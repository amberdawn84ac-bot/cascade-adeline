import { NextRequest, NextResponse } from 'next/server';
import { ChatOpenAI } from '@langchain/openai';
import { z } from 'zod';
import { getSessionUser } from '@/lib/auth';
import { loadConfig } from '@/lib/config';
import { getStudentContext } from '@/lib/learning/student-context';

const challengeSchema = z.object({
  type: z.enum(['math', 'logic', 'pattern', 'word']).describe("The type of challenge"),
  question: z.string().describe("The challenge question or problem statement"),
  options: z.array(z.string()).describe("4 multiple choice options"),
  correctAnswer: z.string().describe("The correct answer (must match one of the options exactly)"),
  explanation: z.string().describe("A clear explanation of why this is the correct answer"),
  difficulty: z.enum(['easy', 'medium', 'hard']).describe("Difficulty level based on grade"),
  subject: z.enum(['Mathematics', 'Logic', 'Language Arts']).describe("The academic subject this challenge covers"),
});

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) return new NextResponse('Unauthorized', { status: 401 });

    const { challengeType } = await req.json();
    const requestedType = challengeType || 'math';

    const studentCtx = await getStudentContext(user.userId, { subjectArea: 'Mathematics' });

    // Determine difficulty based on grade level
    let difficulty: 'easy' | 'medium' | 'hard' = 'medium';
    if (studentCtx.gradeLevel) {
      const grade = parseInt(studentCtx.gradeLevel.replace(/\D/g, '')) || 5;
      if (grade <= 3) difficulty = 'easy';
      else if (grade <= 6) difficulty = 'medium';
      else difficulty = 'hard';
    }

    const config = loadConfig();
    const llm = new ChatOpenAI({
      model: config.models.default || 'gpt-4o',
      temperature: 0.8,
    }).withStructuredOutput(challengeSchema);

    const typePrompts = {
      math: 'Generate a creative math problem that requires reasoning, not just calculation.',
      logic: 'Generate a logic puzzle or riddle that requires deductive reasoning.',
      pattern: 'Generate a pattern recognition challenge with numbers, shapes, or sequences.',
      word: 'Generate a vocabulary or word puzzle that builds language skills.',
    };

    const result = await llm.invoke([
      {
        role: 'system',
        content: `You are Adeline, a whimsical tutor creating engaging brain challenges.${studentCtx.systemPromptAddendum}
        
Create a ${requestedType} challenge at ${difficulty} difficulty. Make it fun, creative, and educational. 
Avoid dry textbook problems - instead, weave in storytelling, real-world scenarios, or playful contexts.
The challenge should feel like a delightful puzzle, not homework.

IMPORTANT: Ensure the correctAnswer matches one of the options EXACTLY (character-for-character).`,
      },
      { role: 'user', content: typePrompts[requestedType as keyof typeof typePrompts] || typePrompts.math },
    ]);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Challenge generation error:', error);
    return NextResponse.json({ error: 'Failed to generate challenge' }, { status: 500 });
  }
}

