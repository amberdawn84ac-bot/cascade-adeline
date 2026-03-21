import { NextRequest, NextResponse } from 'next/server';
import { ChatOpenAI } from '@langchain/openai';
import { z } from 'zod';
import { getSessionUser } from '@/lib/auth';
import { loadConfig } from '@/lib/config';
import { getStudentContext } from '@/lib/learning/student-context';

const storySchema = z.object({
  title: z.string().describe("A compelling title for the story"),
  opening: z.string().describe("A rich, engaging opening paragraph (3-5 sentences) that hooks the reader"),
  characterSketch: z.string().describe("A brief, vivid description of the main character"),
  plotHook: z.string().describe("The central conflict or mystery the story will explore"),
  writingTip: z.string().describe("One specific writing craft tip tailored to the student's grade level"),
  purposeAndAudience: z.object({
    intendedReader: z.string().describe("Who will read this story - be specific (e.g., 'Your 6-year-old sister Emma', 'Elderly neighbor Mr. Thompson', 'Local nursing home newsletter', 'Younger students at church')"),
    serviceGoal: z.string().describe("What this story teaches or gives to the reader (comfort, courage, wisdom, entertainment, perspective)"),
    publicationTarget: z.string().describe("Where this could be published to serve others (local paper, nursing home newsletter, family blog, church bulletin, school literary magazine)")
  }).describe("The purpose and audience for this story - writing as service to others"),
  choices: z.array(z.string()).describe("2 to 3 exciting options for what the main character should do next to continue the story").optional(),
});

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) return new NextResponse('Unauthorized', { status: 401 });

    const { prompt, genre } = await req.json();
    if (!prompt) return NextResponse.json({ error: 'Missing prompt' }, { status: 400 });

    const studentCtx = await getStudentContext(user.userId);

    const config = loadConfig();
    const llm = new ChatOpenAI({
      model: config.models.default || 'gpt-4o',
      temperature: 0.85,
    }).withStructuredOutput(storySchema);

    const result = await llm.invoke([
      {
        role: 'system',
        content: `You are Adeline, a classical rhetoric and literature tutor.${studentCtx.systemPromptAddendum} Generate a rich, engaging story starter in the ${genre || 'adventure'} genre. Your writing should model excellent craft — vivid imagery, strong verbs, compelling characters. CRITICALLY: adapt the vocabulary complexity, sentence length, and thematic depth to perfectly match the student's grade level. For younger students (K-5): simpler words, shorter sentences, magical/fun themes. For older students (6-12): sophisticated vocabulary, complex themes, literary devices.

CRITICAL PURPOSE DIRECTIVE: Every story must have a PURPOSE beyond self-expression. Frame writing as a GIFT to others. In the purposeAndAudience field, you MUST specify:
1. INTENDED READER: A specific person or group who will read this (younger sibling by name, elderly neighbor, nursing home residents, church community, etc.)
2. SERVICE GOAL: What this story gives them (comfort during illness, courage to face challenges, wisdom about friendship, entertainment during lonely times, perspective on their struggles)
3. PUBLICATION TARGET: A specific place to publish it (local newspaper name, nursing home newsletter, church bulletin, school magazine, family blog)

Never generate stories that are purely self-indulgent. Writing is communication and service. The student must know WHO they're writing for and WHY it matters to that person.`,
      },
      { role: 'user', content: `Story prompt: ${prompt}\nGenre: ${genre || 'Adventure'}` },
    ]);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Story generate error:', error);
    // Graceful fallback if AI fails
    return NextResponse.json({
      title: "The Unexpected Discovery",
      opening: `It started as an ordinary day, but everything changed when ${prompt || 'the discovery was made'}. The air suddenly felt different, thick with unspoken secrets.`,
      characterSketch: "A determined protagonist who relies on observation and courage.",
      plotHook: "A sudden twist forces the main character to make a difficult choice that will affect everyone around them.",
      writingTip: "Use strong, active verbs to pull your reader into the scene instead of passive descriptions.",
      purposeAndAudience: {
        intendedReader: "A younger sibling or friend",
        serviceGoal: "To spark their imagination and sense of wonder",
        publicationTarget: "Read aloud at family time or shared with a friend"
      },
      choices: [
        "Investigate the strange occurrence immediately",
        "Seek out a wise mentor for advice",
        "Hide the discovery to protect others"
      ]
    });
  }
}

