import { NextRequest, NextResponse } from 'next/server';
import { ChatOpenAI } from '@langchain/openai';
import { z } from 'zod';
import { getSessionUser } from '@/lib/auth';
import { loadConfig } from '@/lib/config';
import prisma from '@/lib/db';

const assistSchema = z.object({
  code: z.string().describe("The complete, updated HTML/JS game code"),
  explanation: z.string().describe("A brief, friendly explanation of what was changed and why"),
});

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) return new NextResponse('Unauthorized', { status: 401 });

    const { instruction, currentCode } = await req.json();
    if (!instruction) return NextResponse.json({ error: 'Missing instruction' }, { status: 400 });

    const dbUser = await prisma.user.findUnique({
      where: { id: user.userId },
      select: { gradeLevel: true, learningStyle: true },
    });

    const gradeContext = dbUser?.gradeLevel ? `The student is in grade ${dbUser.gradeLevel}.` : '';
    const styleContext = dbUser?.learningStyle ? `Their learning style is ${dbUser.learningStyle}.` : '';

    const config = loadConfig();
    const llm = new ChatOpenAI({
      model: config.models.default || 'gpt-4o',
      temperature: 0.5,
    }).withStructuredOutput(assistSchema);

    const result = await llm.invoke([
      {
        role: 'system',
        content: `You are Adeline, a patient and encouraging coding tutor. ${gradeContext} ${styleContext} The student is building an HTML/JS game. Given their instruction and current code, return the COMPLETE updated code (not just a snippet) with the requested change applied. Keep the code clean and well-commented. Your explanation should be friendly and educational, explaining what you changed and the coding concept behind it.`,
      },
      {
        role: 'user',
        content: `Current code:\n${currentCode || '(no code yet)'}\n\nInstruction: ${instruction}`,
      },
    ]);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Arcade assist error:', error);
    return NextResponse.json({ error: 'Failed to process coding request' }, { status: 500 });
  }
}

