import { NextRequest, NextResponse } from 'next/server';
import { ChatOpenAI } from '@langchain/openai';
import { z } from 'zod';
import { getSessionUser } from '@/lib/auth';
import { loadConfig } from '@/lib/config';
import prisma from '@/lib/db';

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
});

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) return new NextResponse('Unauthorized', { status: 401 });

    const { location } = await req.json();
    if (!location) return NextResponse.json({ error: 'Missing location' }, { status: 400 });

    const dbUser = await prisma.user.findUnique({
      where: { id: user.userId },
      select: { gradeLevel: true, learningStyle: true },
    });

    const gradeContext = dbUser?.gradeLevel ? `The student is in grade ${dbUser.gradeLevel}.` : '';
    const styleContext = dbUser?.learningStyle ? `Their learning style is ${dbUser.learningStyle}.` : '';

    const config = loadConfig();
    const llm = new ChatOpenAI({
      modelName: config.models.default || 'gpt-4o',
      temperature: 0.7,
    }).withStructuredOutput(expeditionSchema);

    const result = await llm.invoke([
      {
        role: 'system',
        content: `You are Adeline, a classical field naturalist and geographer. ${gradeContext} ${styleContext} The student is planning a virtual expedition to a real-world location. Generate a rich, educational survey covering the geology, archaeology, and human geography of this place. Adapt the language complexity to match the student's grade level.`,
      },
      { role: 'user', content: `Survey location: ${location}` },
    ]);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Expedition generation error:', error);
    return NextResponse.json({ error: 'Failed to generate expedition report' }, { status: 500 });
  }
}
