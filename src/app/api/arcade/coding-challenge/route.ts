import { NextRequest, NextResponse } from 'next/server';
import { ChatOpenAI } from '@langchain/openai';
import { z } from 'zod';
import { getSessionUser } from '@/lib/auth';
import { loadConfig } from '@/lib/config';
import { getStudentContext } from '@/lib/learning/student-context';

const challengeSchema = z.object({
  explanation: z.string().describe("A clear, grade-appropriate explanation of the concept"),
  codeSnippet: z.string().describe("A working, runnable code snippet demonstrating the concept"),
  language: z.string().describe("The programming language used (e.g. 'Python', 'JavaScript')"),
  nextChallenge: z.string().describe("A follow-up challenge the student can try next"),
});

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) return new NextResponse('Unauthorized', { status: 401 });

    const { question, language } = await req.json();
    if (!question) return NextResponse.json({ error: 'Missing question' }, { status: 400 });

    const studentCtx = await getStudentContext(user.userId, { subjectArea: 'Technology' });

    const config = loadConfig();
    const llm = new ChatOpenAI({
      model: config.models.default || 'gpt-4o',
      temperature: 0.5,
    }).withStructuredOutput(challengeSchema);

    const result = await llm.invoke([
      {
        role: 'system',
        content: `You are Adeline, a patient coding tutor. The student is learning to code. Explain the concept they are asking about with a clear, grade-appropriate explanation and a short, working code snippet. Use ${language || 'Python'} unless they specify otherwise. End with an encouraging next challenge for them to try.${studentCtx.systemPromptAddendum}`,
      },
      { role: 'user', content: question },
    ]);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Coding challenge error:', error);
    return NextResponse.json({ error: 'Failed to generate challenge' }, { status: 500 });
  }
}

