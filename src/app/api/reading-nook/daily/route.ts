import { NextRequest, NextResponse } from 'next/server';
import { ChatOpenAI } from '@langchain/openai';
import { z } from 'zod';
import { getSessionUser } from '@/lib/auth';
import { loadConfig } from '@/lib/config';
import { buildStudentContextPrompt } from '@/lib/learning/student-context';
import { getCachedContent, saveToCache, getGradeBracket } from '@/lib/cache/contentCache';

const dailyELASchema = z.object({
  anchorText: z.string().describe("A short, highly engaging paragraph (3-5 sentences) about a real-world homesteading topic. Make it vivid, concrete, and connected to the student's interests. This is the foundation for all other ELA activities."),
  comprehension: z.string().describe("ONE question that proves the student understood the anchor text. Make it specific and require them to recall or infer from what they just read."),
  spellingWords: z.array(z.string()).describe("5 to 10 spelling or vocabulary words pulled directly from or closely related to the anchor text. Follow age-appropriate phonics patterns (e.g., CVC words for K-1, digraphs for 2-3, prefixes/roots for 4+). Include the actual words from the text when possible."),
  grammarFocus: z.string().describe("A quick, concrete grammar challenge based on the anchor text. Examples: 'Find the three action verbs in the story', 'Circle all the nouns that name animals', 'Underline the sentence that asks a question'. Make it hands-on and specific to the text."),
  writingPrompt: z.string().describe("A short prompt asking the student to write 3-5 sentences extending or responding to the anchor text. Make it personal and opinion-based. Examples: 'If you had a backhoe, what would you dig up and why?', 'Would you rather raise chickens or goats? Explain your choice.'"),
  requiredReading: z.object({
    title: z.string().describe("The full title of the book"),
    bookId: z.string().describe("URL-safe slug for the book (e.g., 'little-house-on-the-prairie', 'lies-my-teacher-told-me')"),
    chapterOrPage: z.string().optional().describe("Specific chapter or page reference (e.g., 'Chapter 2', 'Pages 45-67')"),
  }).optional().describe("If this lesson requires the student to read a specific book from their curriculum, include this object with the book details. Use standardized bookId slugs."),
});

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) return new NextResponse('Unauthorized', { status: 401 });

    const body = await req.json();
    const { topic, dailyTheme } = body;
    
    // Use dailyTheme if provided (from Daily Expedition), otherwise fall back to topic or default
    const lessonTopic = dailyTheme || topic || 'homesteading';

    // Resolve grade bracket for cache and age-appropriate content
    const userData = await req.json().then(() => 
      fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/users/profile`, {
        headers: { cookie: req.headers.get('cookie') || '' }
      }).then(r => r.json()).catch(() => ({ gradeLevel: '' }))
    ).catch(() => ({ gradeLevel: '' }));
    
    const gradeStr = (userData?.gradeLevel ?? '').toLowerCase().trim();
    const gradeBracket = getGradeBracket(gradeStr);
    const normalizedTopic = lessonTopic.toLowerCase().trim();

    // Cache-first: return saved lesson if it exists
    const cached = await getCachedContent('ela-daily', normalizedTopic, gradeBracket);
    if (cached) return NextResponse.json({ ...cached, cached: true });

    // Not cached: generate via AI
    const studentContext = await buildStudentContextPrompt(user.userId);
    const config = loadConfig();
    const llm = new ChatOpenAI({
      model: config.models.default || "gpt-4o",
      temperature: 0.7,
    }).withStructuredOutput(dailyELASchema);

    const result = await llm.invoke([
      {
        role: 'system',
        content: `You are Adeline, generating a unified Daily Literacy lesson for a student. This is NOT four separate worksheets. This is ONE cohesive learning experience where reading, spelling, grammar, and writing all connect to a single engaging story.

CRITICAL BINDING — TODAY'S THEME:
You are writing the ELA Anchor Text for today's lesson. The global theme for today is: "${lessonTopic}".
You MUST write the Anchor Text specifically about this theme. This is not optional — the entire lesson must revolve around this exact topic.
The spelling words, grammar challenge, and writing prompt must all branch directly from this specific text.

CRITICAL PHILOSOPHY — UNIFIED ELA:
All four components (reading, spelling, grammar, writing) must be tightly integrated around ONE anchor text about "${lessonTopic}". The student reads about this topic, spells words from that story, finds grammar in that same text, and writes about their thoughts on it. Everything connects.

ANCHOR TEXT REQUIREMENTS:
- 3-5 sentences maximum
- MUST be about: ${lessonTopic}
- Vivid and concrete — use sensory details
- Connected to the student's interests from their profile
- Written at EXACTLY the student's reading level (see student context below)
- Make it feel real and immediate, not abstract

SPELLING WORDS — AGE-APPROPRIATE PHONICS:
${studentContext.includes('K') || studentContext.includes('1') || studentContext.includes('2') ? 
  '- K-2: Focus on CVC words (cat, dig, hen), simple digraphs (shop, chop), and sight words from the text' :
  studentContext.includes('3') || studentContext.includes('4') || studentContext.includes('5') ?
  '- 3-5: Focus on blends (plant, trust), long vowel patterns (make, seed), and common suffixes (-ing, -ed)' :
  '- 6+: Focus on Greek/Latin roots, prefixes, suffixes, and academic vocabulary from the text'}
- Pull words DIRECTLY from the anchor text when possible
- 5-10 words total, scaled to grade level

GRAMMAR FOCUS — HANDS-ON AND TEXT-BASED:
- Must reference the actual anchor text you generated
- Make it concrete: "Find the...", "Circle the...", "Underline the..."
- Age-appropriate: nouns/verbs for K-2, adjectives/adverbs for 3-5, clauses/phrases for 6+
- ONE clear task, not multiple

WRITING PROMPT — PERSONAL AND CONNECTED:
- Extend the anchor text with a personal question
- 3-5 sentences expected (adjust for age)
- Opinion or narrative style
- Make them WANT to write about it

LIBRARIAN DIRECTIVE — BOOK LINKING:
- If your lesson requires the student to read a specific book from their curriculum, you MUST include the requiredReading object
- Use standardized URL slugs for bookId:
  * 'little-house-on-the-prairie' for Little House on the Prairie
  * 'farmer-boy' for Farmer Boy
  * 'charlotte-web' for Charlotte's Web
  * 'lies-my-teacher-told-me' for Lies My Teacher Told Me
  * 'people-history-united-states' for A People's History of the United States
  * 'narrative-life-frederick-douglass' for Narrative of the Life of Frederick Douglass
- Include specific chapter or page references when relevant
- Only include requiredReading if the lesson genuinely requires reading from a specific book

${studentContext}`,
      },
      { role: 'user', content: `Generate a unified Daily Literacy lesson about: ${lessonTopic}` }
    ]);

    const payload = { ...result, topic: lessonTopic };
    await saveToCache('ela-daily', normalizedTopic, gradeBracket, payload as any);

    return NextResponse.json({ ...payload, cached: false });
  } catch (error) {
    console.error("Daily ELA generation error:", error);
    return NextResponse.json({ error: "Failed to generate daily lesson" }, { status: 500 });
  }
}
