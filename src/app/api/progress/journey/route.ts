import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getSessionUser } from '@/lib/auth';

function parseGradeNum(gradeLevel: string | null | undefined): number {
  if (!gradeLevel) return 5;
  const g = gradeLevel.trim().toUpperCase();
  if (g === 'K') return 0;
  const n = parseInt(g, 10);
  return isNaN(n) ? 5 : n;
}

function getMilestone(pct: number, isHighSchool: boolean): string {
  if (isHighSchool) {
    if (pct < 25) return 'Basecamp';
    if (pct < 50) return 'The Traverse';
    if (pct < 75) return 'The Ridge';
    if (pct < 95) return 'The Summit';
    return 'Graduation Defense';
  } else {
    if (pct < 20) return 'Autumn Sowing';
    if (pct < 40) return 'Winter Roots';
    if (pct < 60) return 'Early Bloom';
    if (pct < 80) return 'Spring Growth';
    return 'Spring Harvest';
  }
}

export async function GET() {
  try {
    const session = await getSessionUser();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: {
        gradeLevel: true,
        transcriptEntries: { select: { creditsEarned: true } },
      },
    });

    if (!user) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const gradeNum = parseGradeNum(user.gradeLevel);
    const isHighSchool = gradeNum >= 9;
    const target = isHighSchool ? 24 : 5.5;

    const earned = user.transcriptEntries.reduce(
      (sum, e) => sum + Number(e.creditsEarned),
      0
    );

    const pct = Math.min(100, Math.round((earned / target) * 100));
    const milestone = getMilestone(pct, isHighSchool);

    return NextResponse.json({
      mode: isHighSchool ? 'graduation' : 'annual',
      pct,
      earned: Math.round(earned * 100) / 100,
      target,
      milestone,
      gradeLevel: user.gradeLevel ?? 'Unknown',
    });
  } catch (err) {
    console.error('[journey] error:', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
