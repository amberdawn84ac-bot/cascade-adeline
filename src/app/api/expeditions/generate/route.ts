import { NextRequest, NextResponse } from 'next/server';
import { ChatOpenAI } from '@langchain/openai';
import { z } from 'zod';
import { getSessionUser } from '@/lib/auth';
import { loadConfig } from '@/lib/config';
import { buildStudentContextPrompt } from '@/lib/learning/student-context';

const expeditionSchema = z.object({
  location: z.string().describe("The full name of the location"),
  coordinates: z.string().describe("Approximate coordinates e.g. '36°N, 112°W'"),
  geology: z.object({
    formation: z.string().describe("How the land was geologically formed"),
    rocks: z.array(z.string()).describe("Key rock types found at this location"),
  }),
  archaeology: z.object({
    era: z.string().describe("The primary historical era of interest"),
    remnants: z.string().describe("Key ruins, artifacts, or archaeological finds"),
  }),
  sociology: z.object({
    culture: z.string().describe("How the land shaped the people who lived there"),
    connection: z.string().describe("The explicit link between geology and sociology"),
  }),
  characterFocus: z.string().describe("The specific virtue or character trait being developed (e.g., Diligence, Empathy, Stewardship)"),
  communityImpact: z.string().describe("How this specific project or knowledge can be directly used to serve a neighbor, family member, or the local community"),
});

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) return new NextResponse('Unauthorized', { status: 401 });

    const { location } = await req.json();
    if (!location) return NextResponse.json({ error: 'Missing location' }, { status: 400 });

    const studentContext = await buildStudentContextPrompt(user.userId);

    const config = loadConfig();
    const llm = new ChatOpenAI({
      model: config.models.default || 'gpt-4o',
      temperature: 0.7,
    }).withStructuredOutput(expeditionSchema);

    const result = await llm.invoke([
      {
        role: 'system',
        content: `You are Adeline, a classical field naturalist and geographer.${studentContext} The student is planning a virtual expedition to a real-world location. Generate a rich, educational survey covering the geology, archaeology, and human geography of this place. Adapt the language complexity to match the student's grade level.

You must strictly frame this activity around serving others. Expeditions should involve stewardship or helping neighbors. Frame the expedition as an opportunity to learn about this place so the student can teach others, protect the environment, or serve their community through this knowledge. Never generate selfish or purely consumer-driven examples.`,
      },
      { role: 'user', content: `Survey location: ${location}` },
    ]);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Expedition generation error:', error);
    return NextResponse.json({ error: 'Failed to generate expedition report' }, { status: 500 });
  }
}

