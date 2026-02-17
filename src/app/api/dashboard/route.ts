import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getSessionUser } from '@/lib/auth';
import { getZPDConcepts } from '@/lib/zpd-engine';

export async function GET() {
  const session = await getSessionUser();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userId = session.userId;

  // 1. Get standards progress
  const progress = await prisma.studentStandardProgress.findMany({
    where: { userId },
    include: { standard: true },
  });

  const stats = {
    science: { earned: 0, total: 0 },
    math: { earned: 0, total: 0 },
    ela: { earned: 0, total: 0 },
    history: { earned: 0, total: 0 },
  };

  progress.forEach(p => {
    const subject = p.standard.subject.toLowerCase();
    const isMastered = p.mastery === 'MASTERED' || p.mastery === 'PROFICIENT';
    
    if (subject.includes('science')) {
      stats.science.total++;
      if (isMastered) stats.science.earned++;
    } else if (subject.includes('math')) {
      stats.math.total++;
      if (isMastered) stats.math.earned++;
    } else if (subject.includes('english') || subject.includes('language')) {
      stats.ela.total++;
      if (isMastered) stats.ela.earned++;
    } else if (subject.includes('social') || subject.includes('history')) {
      stats.history.total++;
      if (isMastered) stats.history.earned++;
    }
  });

  // 2. Get ZPD recommendations
  const zpd = await getZPDConcepts(userId, { limit: 3 });

  // 3. Get recent activity
  const recent = await prisma.conversationMemory.findMany({
    where: { userId, role: 'USER' },
    orderBy: { createdAt: 'desc' },
    take: 5,
    select: { content: true, createdAt: true },
  });

  return NextResponse.json({
    stats,
    zpd,
    recent,
  });
}
