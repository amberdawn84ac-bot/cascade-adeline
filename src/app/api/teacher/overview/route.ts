import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import prisma from '@/lib/db';

export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (user.role !== 'TEACHER' && user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const totalStudents = await prisma.user.count({ where: { parentId: user.userId } });

  const recentActivity = await prisma.userActivity.findMany({
    where: { user: { parentId: user.userId } },
    include: { user: { select: { id: true, name: true } } },
    orderBy: { createdAt: 'desc' },
    take: 20,
  });

  const learningGaps = await prisma.learningGap.findMany({
    where: { user: { parentId: user.userId }, severity: { in: ['MODERATE', 'SIGNIFICANT'] } },
    include: {
      user: { select: { id: true, name: true } },
      concept: { select: { name: true, subjectArea: true } },
    },
    orderBy: { detectedAt: 'desc' },
    take: 15,
  });

  const transcriptsPending = await prisma.transcriptEntry.count({
    where: { approvedById: null, user: { parentId: user.userId } },
  });

  const groupActivity = await prisma.scienceGroup.findMany({
    where: { isPublic: true },
    select: {
      id: true,
      name: true,
      _count: { select: { messages: true, memberships: true, projects: true } },
      messages: {
        where: { aiMediated: true },
        select: { id: true, createdAt: true },
        orderBy: { createdAt: 'desc' },
        take: 1,
      },
    },
    orderBy: { updatedAt: 'desc' },
    take: 10,
  });

  return NextResponse.json({
    totalStudents,
    recentActivity,
    learningGaps,
    transcriptsPending,
    groupActivity: groupActivity.map(g => ({
      ...g,
      lastMediationAt: g.messages[0]?.createdAt ?? null,
    })),
  });
}
