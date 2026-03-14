import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import prisma from '@/lib/db';
import { ChatOpenAI } from '@langchain/openai';
import { z } from 'zod';
import { buildStudentContextPrompt } from '@/lib/learning/student-context';
import { loadConfig } from '@/lib/config';

export const maxDuration = 30;

const lessonSchema = z.object({
  lessonTitle: z.string().describe('Specific title for today\'s lesson or project'),
  lessonType: z.enum(['lesson', 'project', 'activity', 'experiment', 'field-trip']).describe('Type of learning activity'),
  timeEstimate: z.string().describe('How long this will take, e.g. "45 minutes" or "2-3 hours"'),
  overview: z.string().describe('2-3 sentence engaging overview of what they will do today'),
  steps: z.array(z.object({
    step: z.number().describe('Step number'),
    title: z.string().describe('Short title for this step'),
    instruction: z.string().describe('Clear, specific instruction for this step'),
  })).describe('3-6 concrete steps to complete the lesson'),
  materials: z.array(z.string()).describe('List of materials or resources needed (books, websites, supplies, etc.)'),
  completionCriteria: z.string().describe('How the student will know they have completed and mastered this lesson'),
  chatPrompt: z.string().describe('A ready-to-paste prompt the student can send to Adeline to get help with this specific lesson'),
});

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { subject, title, description } = await req.json();
    if (!subject || !title) {
      return NextResponse.json({ error: 'subject and title are required' }, { status: 400 });
    }

    const studentContext = await buildStudentContextPrompt(user.userId);
    const student = await prisma.user.findUnique({
      where: { id: user.userId },
      select: { name: true, gradeLevel: true, interests: true },
    });

    const config = loadConfig();
    const llm = new ChatOpenAI({ model: config.models.default || 'gpt-4o', temperature: 0.7 })
      .withStructuredOutput(lessonSchema);

    const result = await llm.invoke([
      {
        role: 'system',
        content: `You are Adeline, a brilliant homeschool teacher creating a hands-on, real-world lesson.

${studentContext}

The student's name is ${student?.name ?? 'Explorer'}, grade ${student?.gradeLevel ?? 'unknown'}.
Their interests: ${(student?.interests ?? []).join(', ') || 'not specified'}.

LESSON DESIGN RULES:
1. Make it CONCRETE — specific books, websites, real experiments, actual projects
2. Connect directly to their interests whenever possible
3. No busywork — every step should build real understanding or skill
4. Steps should be achievable in one sitting (or one day for projects)
5. The chatPrompt should be specific enough that pasting it into chat immediately gets useful help`,
      },
      {
        role: 'user',
        content: `Generate today's lesson for the course: "${title}" (${subject})\nCourse description: ${description || 'Not provided'}`,
      },
    ]);

    return NextResponse.json(result);

  } catch (error) {
    console.error('[journey/lesson] Error:', error);
    return NextResponse.json({
      error: 'Failed to generate lesson',
      details: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}
