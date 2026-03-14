import { NextRequest, NextResponse } from 'next/server';
import { ChatOpenAI } from '@langchain/openai';
import { z } from 'zod';
import { getSessionUser } from '@/lib/auth';
import { loadConfig } from '@/lib/config';
import prisma from '@/lib/db';
import { buildStudentContextPrompt } from '@/lib/learning/student-context';
import { getCachedContent, saveToCache, getGradeBracket } from '@/lib/cache/contentCache';

const encyclopediaSchema = z.object({
  title: z.string().describe("The specific topic title, exactly as searched"),
  coreConcept: z.string().describe("A fascinating scientific breakdown of the topic. MUST be strictly adapted to the student's exact grade level, vocabulary, and cognitive profile from the student context. NOT a Wikipedia dump — a sharp, engaging 3-5 sentence explanation that a curious student at this exact level would find thrilling. A 1st grader gets simple wonder. A 10th grader gets mechanisms and chemistry."),
  appliedReality: z.string().describe("How this specific science applies directly to a real-world homestead, backyard, kitchen, or physical environment the student lives in. Concrete, immediate, and specific — not abstract. 2-3 sentences max."),
  fieldChallenge: z.string().describe("A gritty, hands-on physical demand the student can do RIGHT NOW in their immediate environment. 2-3 sentences describing the action, then end with ONE explicit question that demands a specific response the student can only answer by actually doing it. Adapt the challenge to the student's age and grade level. Example for young student: 'Go find 3 tiny pebbles a chicken might eat. Hold them in your hand. Are they smooth or rough — and why would that matter to a chicken?'. Example for older student: 'Check your flock's grit supply right now. Calculate if the current amount is enough given the flock size and outdoor time. What's your estimate?'"),
});

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) return new NextResponse('Unauthorized', { status: 401 });

    const body = await req.json();
    const { query } = body;
    if (!query) return NextResponse.json({ error: "Missing query" }, { status: 400 });

    // --- Resolve grade bracket early (needed for cache lookup AND image style) ---
    const userData = await prisma.user.findUnique({
      where: { id: user.userId },
      select: { gradeLevel: true },
    });
    const gradeStr = (userData?.gradeLevel ?? '').toLowerCase().trim();
    const gradeBracket = getGradeBracket(gradeStr);
    const isEarlyElementary = gradeBracket === 'K-2';
    const normalizedTopic = query.toLowerCase().trim();

    // --- Cache-first: return saved entry if it exists ---
    const cached = await getCachedContent('science-encyclopedia', normalizedTopic, gradeBracket);
    if (cached) return NextResponse.json({ ...cached, cached: true });

    // --- Not cached: generate via AI ---
    const studentContext = await buildStudentContextPrompt(user.userId);
    const config = loadConfig();
    const llm = new ChatOpenAI({
      model: config.models.default || "gpt-4o",
      temperature: 0.7,
    }).withStructuredOutput(encyclopediaSchema);

    const result = await llm.invoke([
      {
        role: 'system',
        content: `You are Adeline, generating a personalized encyclopedia entry for a specific student. Do NOT dump a Wikipedia article. Deliver a sharp, highly engaging micro-lesson.

ABSOLUTE RULE — ZPD ADAPTATION:
You MUST tailor every word to the student's exact grade level, reading level, vocabulary, and cognitive profile provided below. This is non-negotiable. If you ignore the student context and write at the wrong level, the lesson fails completely.
- A 1st grader gets wonder, simple language, and concrete sensory details ("squishy," "smells like dirt").
- A 5th grader gets mechanisms explained through analogy and real-world cause-effect.
- A 10th grader gets precise scientific vocabulary, data, and systems-level thinking.

DIRECTIVE:
- coreConcept: Make this thrilling. No dry definitions. Explain the science like you're sharing a secret about how the world actually works.
- appliedReality: Connect it directly to their physical world — farm, garden, kitchen, backyard. Make it feel urgent and relevant.
- fieldChallenge: Force them off the screen. Give a specific physical challenge they can do RIGHT NOW, ending with ONE question they can only answer by doing it.

${studentContext}`,
      },
      { role: 'user', content: `Topic: ${query}` }
    ]);

    // --- Image generation ---
    const imageStyle = isEarlyElementary
      ? 'black and white minimalist coloring book page, bold clean outlines only, no shading, no color, pure white background, simple and friendly, designed for a young child to color in'
      : 'beautiful realistic educational illustration, vibrant colors, natural lighting, detailed and scientifically accurate';

    let imageUrl: string | null = null;
    try {
      const imageRes = await fetch('https://api.openai.com/v1/images/generations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: 'dall-e-3',
          prompt: `${query}: ${imageStyle}`,
          n: 1,
          size: '1024x1024',
          quality: isEarlyElementary ? 'standard' : 'hd',
        }),
      });
      if (imageRes.ok) {
        const imageData = await imageRes.json();
        imageUrl = imageData.data?.[0]?.url ?? null;
      }
    } catch (imgErr) {
      console.error('Image generation failed (non-fatal):', imgErr);
    }

    const isColoringPage = isEarlyElementary && !!imageUrl;
    const payload = { ...result, imageUrl, isColoringPage };

    await saveToCache('science-encyclopedia', normalizedTopic, gradeBracket, payload);

    return NextResponse.json({ ...payload, cached: false });
  } catch (error) {
    console.error("Encyclopedia generation error:", error);
    return NextResponse.json({ error: "Failed to generate entry" }, { status: 500 });
  }
}

