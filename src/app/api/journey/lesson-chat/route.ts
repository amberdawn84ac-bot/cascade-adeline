import { NextRequest } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { getModel } from '@/lib/ai-models';
import { loadConfig } from '@/lib/config';
import { streamText } from 'ai';
import { getStudentContext } from '@/lib/learning/student-context';

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) return new Response('Unauthorized', { status: 401 });

    const { messages, lessonTitle, lessonContent, subject } = await req.json();

    const studentCtx = await getStudentContext(user.userId);
    const config = loadConfig();

    const result = await streamText({
      model: getModel(config.models.default),
      temperature: 0.7,
      system: `You are Adeline, a brilliant and patient homeschool teacher helping a student who is working through today's lesson.

TODAY'S LESSON: "${lessonTitle}" (${subject})

LESSON CONTENT THE STUDENT IS WORKING FROM:
${lessonContent}

${studentCtx.systemPromptAddendum}

YOUR ROLE RIGHT NOW:
- The student is actively working through this lesson and needs help
- Answer their questions directly and specifically about THIS lesson
- If they're stuck on a step, walk them through it in concrete terms
- If they ask about the recipe/activity, give exact measurements, temperatures, and times
- Use the Socratic method when appropriate — guide them to discover, don't just dump answers
- Be warm, encouraging, and specific
- Keep responses focused and not overwhelming — this is a conversation, not a lecture`,
      messages,
    });

    return result.toTextStreamResponse();

  } catch (error) {
    console.error('[journey/lesson-chat] Error:', error);
    return new Response('Failed to connect to Adeline', { status: 500 });
  }
}
