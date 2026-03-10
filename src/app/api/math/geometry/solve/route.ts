import { NextRequest, NextResponse } from 'next/server';
import { ChatOpenAI } from '@langchain/openai';
import { z } from 'zod';
import { getSessionUser } from '@/lib/auth';
import { loadConfig } from '@/lib/config';
import { buildStudentContextPrompt } from '@/lib/learning/student-context';

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

    const studentContext = await buildStudentContextPrompt(user.userId);

    const config = loadConfig();
    const llm = new ChatOpenAI({
      modelName: config.models.default || 'gpt-4o',
      temperature: 0.3,
    }).withStructuredOutput(geometrySchema);

    const result = await llm.invoke([
      {
        role: 'system',
        content: `You are Adeline, a classical mathematics tutor. Solve this geometry problem step by step. Show every calculation clearly. Connect the math to real-world examples they would relate to.${studentContext}`,
      },
      { role: 'user', content: `Geometry problem: ${problem}` },
    ]);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Geometry solve error:', error);
    return NextResponse.json({ error: 'Failed to solve geometry problem' }, { status: 500 });
  }
}
