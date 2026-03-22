import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import prisma from '@/lib/db';

export async function POST(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { topic, subject, investigationPath, answers } = await req.json() as {
    topic: string;
    subject: string;
    investigationPath: string;
    answers: Array<{ question: string; response: string }>;
  };

  if (!topic || !investigationPath || !answers?.length) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  const summary = answers
    .filter(a => a.response.trim())
    .map(a => `Q: ${a.question}\nA: ${a.response}`)
    .join('\n\n');

  const investigation = await prisma.investigation.create({
    data: {
      title: `${investigationPath.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}: ${topic}`,
      summary,
      userId: user.userId,
      sources: {
        create: answers
          .filter(a => a.response.trim())
          .map(a => ({
            title: a.question,
            content: a.response,
            sourceType: 'PRIMARY' as const,
          })),
      },
    },
  });

  return NextResponse.json({ id: investigation.id });
}
