import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { ChatOpenAI } from '@langchain/openai';
import { z } from 'zod';
import { loadConfig } from '@/lib/config';
import { getStudentContext } from '@/lib/learning/student-context';
import prisma from '@/lib/db';

const classicLessonSchema = z.object({
  subject: z.string(),
  title: z.string(),
  gradeLevel: z.string(),
  objectives: z.array(z.string()).describe("3-5 clear learning objectives for this lesson"),
  lessonContent: z.string().describe("Structured, step-by-step lesson content. Use clear paragraphs separated by double newlines."),
  keyTerms: z.array(z.object({
    term: z.string(),
    definition: z.string(),
  })).describe("5-8 key vocabulary terms from this lesson"),
  worksheet: z.object({
    instructions: z.string().describe("Clear instructions for completing the worksheet"),
    questions: z.array(z.object({
      number: z.number(),
      type: z.enum(['multiple-choice', 'fill-in-blank', 'short-answer']),
      question: z.string(),
      options: z.array(z.string()).optional().describe("For multiple-choice only: 4 answer options"),
      answer: z.string().optional().describe("Correct answer (for teacher reference, not shown to student)"),
    })).describe("Exactly 5 practice questions that match the lesson content"),
  }),
});

const SUBJECT_PROMPTS = {
  math: `Generate a focused Mathematics lesson. Cover one specific concept (e.g., fractions, multiplication, geometry). Include clear examples with step-by-step solutions. The worksheet should test understanding of the exact concept taught.`,
  
  science: `Generate a focused Science lesson. Cover one specific topic (e.g., photosynthesis, states of matter, simple machines). Include real-world examples and observable phenomena. The worksheet should test comprehension of the scientific concepts.`,
  
  ela: `Generate a focused Language Arts lesson. Cover one specific skill (e.g., sentence structure, parts of speech, reading comprehension, writing techniques). Include clear examples and practice sentences. The worksheet should reinforce the grammar or writing skill taught.`,
  
  history: `Generate a focused History lesson based on PRIMARY SOURCES ONLY. Choose a specific historical event or period. Present the REAL story - not sanitized textbook narratives. Include direct quotes from diaries, letters, court records, or eyewitness accounts. Teach students to think critically about power, greed, and human nature. Reference "Lies My Teacher Told Me" approach - acknowledge uncomfortable truths. The worksheet should test critical thinking about historical evidence and human behavior, not just memorization of dates.`,
};

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { subject } = await req.json();
    if (!subject || !['math', 'science', 'ela', 'history'].includes(subject)) {
      return NextResponse.json({ error: 'Invalid subject' }, { status: 400 });
    }

    const studentCtx = await getStudentContext(user.userId);
    const config = loadConfig();
    const llm = new ChatOpenAI({
      model: config.models.default || 'gpt-4o',
      temperature: 0.7,
    }).withStructuredOutput(classicLessonSchema);

    const subjectName = {
      math: 'Mathematics',
      science: 'Science',
      ela: 'English Language Arts',
      history: 'History',
    }[subject as 'math' | 'science' | 'ela' | 'history'];

    const result = await llm.invoke([
      {
        role: 'system',
        content: `You are Adeline, a dedicated homeschool tutor creating traditional, structured lessons.

${studentCtx.systemPromptAddendum}

CRITICAL INSTRUCTIONS:
- Generate a SINGLE-SUBJECT lesson for ${subjectName}. DO NOT mix subjects.
- This is a traditional, structured lesson - not a project or expedition.
- The lesson should be highly organized with clear sections and step-by-step instruction.
- Grade level: ${studentCtx.gradeLevel}
- Student interests: ${studentCtx.interests.join(', ') || 'general topics'}

${SUBJECT_PROMPTS[subject as keyof typeof SUBJECT_PROMPTS]}

WORKSHEET REQUIREMENTS:
- Exactly 5 questions that perfectly match the lesson content
- Mix of question types (multiple-choice, fill-in-blank, short-answer)
- Questions should be grade-appropriate and test mastery of the specific concept taught
- For multiple-choice: provide exactly 4 options with one clearly correct answer
- For fill-in-blank: create sentences with one key term missing
- For short-answer: ask questions that require 2-3 sentence responses

The worksheet is meant to be PRINTED and completed with a pencil. Format accordingly.`,
      },
      {
        role: 'user',
        content: `Create today's ${subjectName} lesson for ${studentCtx.name}.`,
      },
    ]);

    return NextResponse.json(result);
  } catch (error) {
    console.error('[classic/lesson]', error);
    return NextResponse.json(
      { error: 'Failed to generate lesson', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
