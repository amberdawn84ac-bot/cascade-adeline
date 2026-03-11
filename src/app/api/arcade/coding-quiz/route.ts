import { NextResponse } from 'next/server';
import { ChatOpenAI } from '@langchain/openai';
import { z } from 'zod';
import { getSessionUser } from '@/lib/auth';
import { loadConfig } from '@/lib/config';
import prisma from '@/lib/db';

const quizSchema = z.object({
  concept: z.string().describe("The coding concept being tested (e.g. 'loops', 'variables')"),
  language: z.string().describe("Programming language for the snippet"),
  codeSnippet: z.string().describe("A short, readable code snippet (4-10 lines max)"),
  question: z.string().describe("What does this code do / output / contain?"),
  options: z.array(z.string()).length(4).describe("Exactly 4 multiple choice answers"),
  correctAnswer: z.string().describe("The correct answer matching one of the options exactly"),
  explanation: z.string().describe("Why the correct answer is right, teaching the concept"),
  difficulty: z.enum(['beginner', 'intermediate', 'advanced']),
});

export async function POST(req: Request) {
  try {
    const user = await getSessionUser();
    if (!user) return new NextResponse('Unauthorized', { status: 401 });

    const { language = 'Python' } = await req.json().catch(() => ({}));

    const dbUser = await prisma.user.findUnique({
      where: { id: user.userId },
      select: { gradeLevel: true },
    });

    const grade = parseInt((dbUser?.gradeLevel || '6').replace(/\D/g, '')) || 6;
    let difficulty: 'beginner' | 'intermediate' | 'advanced' = 'beginner';
    if (grade <= 4) difficulty = 'beginner';
    else if (grade <= 8) difficulty = 'intermediate';
    else difficulty = 'advanced';

    const gradeContext = `The student is in grade ${dbUser?.gradeLevel || '6'}.`;

    const concepts = {
      beginner: ['variables', 'print statements', 'basic arithmetic', 'if/else', 'simple loops'],
      intermediate: ['functions', 'lists', 'for loops', 'string methods', 'boolean logic'],
      advanced: ['recursion', 'dictionaries', 'list comprehensions', 'classes', 'error handling'],
    };

    const conceptPool = concepts[difficulty];
    const randomConcept = conceptPool[Math.floor(Math.random() * conceptPool.length)];

    const config = loadConfig();
    const llm = new ChatOpenAI({
      model: config.models.default || 'gpt-4o',
      temperature: 0.7,
    }).withStructuredOutput(quizSchema);

    const result = await llm.invoke([
      {
        role: 'system',
        content: `You are Adeline, a coding tutor creating a quiz question. ${gradeContext}
Create a ${difficulty} ${language} coding quiz about "${randomConcept}".
- The code snippet must be SHORT (4-10 lines), clean, and runnable.
- The question should ask what the code outputs, what it does, or what value a variable holds.
- Make one answer clearly correct and the other 3 plausibly wrong but distinct.
- The explanation should teach WHY the answer is correct in a friendly, encouraging way.
CRITICAL: correctAnswer must match one of the 4 options exactly, character for character.`,
      },
      { role: 'user', content: `Generate a ${difficulty} ${language} coding quiz question about ${randomConcept}.` },
    ]);

    return NextResponse.json(result);
  } catch (error) {
    console.error('[arcade/coding-quiz]', error);
    return NextResponse.json({ error: 'Failed to generate quiz' }, { status: 500 });
  }
}

