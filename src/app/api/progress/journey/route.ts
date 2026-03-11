import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getSessionUser } from '@/lib/auth';

const FULL_GRADUATION_CREDITS = 24;
const ANNUAL_TARGET_K8 = 5.5;

function parseGradeNum(gradeLevel: string | null | undefined): number {
  if (!gradeLevel) return 5;
  const g = gradeLevel.trim().toUpperCase();
  if (g === 'K') return 0;
  const n = parseInt(g, 10);
  return isNaN(n) ? 5 : n;
}

function getMilestone(pct: number, isHighSchool: boolean, accelerated: boolean): string {
  if (isHighSchool) {
    const label = accelerated ? '⚡ ' : '';
    if (pct < 25) return `${label}Basecamp`;
    if (pct < 50) return `${label}The Traverse`;
    if (pct < 75) return `${label}The Ridge`;
    if (pct < 95) return `${label}The Summit`;
    return `${label}Graduation Defense`;
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
        metadata: true,
        transcriptEntries: {
          select: { creditsEarned: true, validationType: true },
        },
      },
    });

    if (!user) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const gradeNum = parseGradeNum(user.gradeLevel);
    const isHighSchool = gradeNum >= 9;

    // Accelerated Mode: read metadata.graduationYears (e.g. 3 for 3-year plan)
    const meta = (user.metadata ?? {}) as Record<string, unknown>;
    const graduationYears = typeof meta.graduationYears === 'number' ? meta.graduationYears : 4;
    const accelerated = isHighSchool && graduationYears < 4;
    const yearsTarget = Math.max(1, Math.min(4, graduationYears));

    // Credit target adjusts proportionally for compressed timeline
    const target = isHighSchool
      ? Math.round((FULL_GRADUATION_CREDITS * (yearsTarget / 4)) * 10) / 10
      : ANNUAL_TARGET_K8;

    const earned = user.transcriptEntries.reduce(
      (sum, e) => sum + Number(e.creditsEarned),
      0
    );

    // Credit breakdown by validation type
    const externalCredits = user.transcriptEntries
      .filter(e => e.validationType !== 'internal')
      .reduce((sum, e) => sum + Number(e.creditsEarned), 0);

    const pct = Math.min(100, Math.round((earned / target) * 100));
    const milestone = getMilestone(pct, isHighSchool, accelerated);

    return NextResponse.json({
      mode: isHighSchool ? 'graduation' : 'annual',
      pct,
      earned: Math.round(earned * 100) / 100,
      externalCredits: Math.round(externalCredits * 100) / 100,
      target,
      milestone,
      gradeLevel: user.gradeLevel ?? 'Unknown',
      accelerated,
      yearsTarget,
    });
  } catch (err) {
    console.error('[journey] error:', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

