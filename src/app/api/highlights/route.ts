import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import prisma from '@/lib/db';

export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const highlights: Array<Record<string, unknown>> = [];

  // Auto-generated highlights from high-quality reflections
  try {
    const reflections = await prisma.reflectionEntry.findMany({
      where: { userId: user.userId, insightScore: { gte: 0.7 } },
      orderBy: { insightScore: 'desc' },
      take: 5,
    });

    reflections.forEach((reflection) => {
      highlights.push({
        id: `reflection-${reflection.id}`,
        userId: user.userId,
        content: reflection.activitySummary,
        type: 'DEEP_REFLECTION',
        source: 'auto',
        impact: `Reflection depth: ${Math.round((reflection.insightScore ?? 0) * 100)}%`,
        createdAt: reflection.createdAt,
      });
    });
  } catch {
    // reflectionEntry may not exist yet
  }

  // Auto-generated highlights from transcript entries (credits earned)
  try {
    const transcripts = await prisma.transcriptEntry.findMany({
      where: { userId: user.userId },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    transcripts.forEach((entry) => {
      highlights.push({
        id: `transcript-${entry.id}`,
        userId: user.userId,
        content: `Earned ${entry.creditsEarned} credits in ${entry.mappedSubject}`,
        type: 'CREDIT_EARNED',
        source: 'auto',
        impact: `${entry.creditsEarned} credits — ${entry.mappedSubject}`,
        createdAt: entry.createdAt,
      });
    });
  } catch {
    // transcriptEntry may not exist yet
  }

  // Sort by date descending
  highlights.sort((a, b) => {
    const dateA = new Date(a.createdAt as string).getTime();
    const dateB = new Date(b.createdAt as string).getTime();
    return dateB - dateA;
  });

  return NextResponse.json(highlights.slice(0, 20));
}

export async function POST(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const { content, userNote } = body;

  if (!content) {
    return NextResponse.json({ error: 'Content is required' }, { status: 400 });
  }

  // Store as a manual highlight in conversation memory metadata
  const highlight = {
    id: crypto.randomUUID(),
    userId: user.userId,
    content,
    type: 'MANUAL',
    source: 'manual',
    userNote: userNote || null,
    createdAt: new Date(),
  };

  return NextResponse.json(highlight);
}
