import { NextRequest, NextResponse } from 'next/server';
import { ChatOpenAI } from '@langchain/openai';
import { z } from 'zod';
import { getSessionUser } from '@/lib/auth';
import { loadConfig } from '@/lib/config';
import prisma from '@/lib/db';

const geometrySchema = z.object({
  answer: z.string().describe("The final numerical answer with units"),
  steps: z.array(z.string()).describe("Step-by-step solution walkthrough"),
  formula: z.string().describe("The geometric formula used e.g. 'Area = π × r²'"),
  visualDescription: z.string().describe("A brief description of what the shape looks like"),
  funFact: z.string().describe("An interesting real-world application of this geometric concept"),
});

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) return new NextResponse('Unauthorized', { status: 401 });

    const { problem } = await req.json();
    if (!problem) return NextResponse.json({ error: 'Missing problem' }, { status: 400 });

    const dbUser = await prisma.user.findUnique({
      where: { id: user.userId },
      select: { gradeLevel: true, learningStyle: true },
    });

    const gradeContext = dbUser?.gradeLevel ? `The student is in grade ${dbUser.gradeLevel}.` : '';
    const styleContext = dbUser?.learningStyle ? `Their learning style is ${dbUser.learningStyle}.` : '';

    const config = loadConfig();
    const llm = new ChatOpenAI({
      modelName: config.models.default || 'gpt-4o',
      temperature: 0.3,
    }).withStructuredOutput(geometrySchema);

    const result = await llm.invoke([
      {
        role: 'system',
        content: `You are Adeline, a classical mathematics tutor. ${gradeContext} ${styleContext} Solve this geometry problem step by step. Show every calculation clearly. Adapt vocabulary and complexity to the student's grade level. Connect the math to real-world examples they would relate to.`,
      },
      { role: 'user', content: `Geometry problem: ${problem}` },
    ]);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Geometry solve error:', error);
    return NextResponse.json({ error: 'Failed to solve geometry problem' }, { status: 500 });
  }
}
