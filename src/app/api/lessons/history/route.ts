import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import prisma from '@/lib/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // Get the 5 most recent lesson sessions for this user
  const sessions = await prisma.lessonSession.findMany({
    where: { userId: user.userId },
    orderBy: { startedAt: 'desc' },
    take: 5,
    select: { lessonId: true },
  });

  if (sessions.length === 0) return NextResponse.json([]);

  const lessonIds = sessions.map(s => s.lessonId);

  // Fetch the corresponding archived lessons
  const lessons = await prisma.lesson.findMany({
    where: { lessonId: { in: lessonIds } },
    select: { lessonId: true, title: true, contentBlocks: true, createdAt: true },
    orderBy: { createdAt: 'desc' },
  });

  // Shape into Vercel AI SDK Message format with annotations
  const messages = lessons
    .filter(l => Array.isArray(l.contentBlocks) && (l.contentBlocks as any[]).length > 0)
    .map(lesson => ({
      id: lesson.lessonId,
      role: 'assistant' as const,
      content: `Here is a lesson on "${lesson.title}" from ${new Date(lesson.createdAt).toLocaleDateString()}:`,
      annotations: (lesson.contentBlocks as any[]).map((block: any) => ({
        genUIPayload: {
          component: 'LessonBlock',
          props: { block, lessonId: lesson.lessonId },
        },
      })),
    }));

  return NextResponse.json(messages);
}
