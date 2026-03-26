import { getSessionUser } from '@/lib/auth';
import prisma from '@/lib/db';

export const dynamic = 'force-dynamic';

// Credits required per year by grade band (from adeline.config.toml)
const ANNUAL_CREDITS: Record<string, number> = {
  K: 1.0, '0': 1.0,
  '1': 1.0, '2': 1.0,
  '3': 1.5, '4': 1.5, '5': 1.5,
  '6': 2.0, '7': 2.0, '8': 2.0,
  '9': 3.0, '10': 3.0, '11': 3.0, '12': 3.0,
};

// Total credits needed for a complete K-12 education
const TOTAL_GRADUATION_CREDITS = 25.5;

function gradeToNum(grade: string): number {
  const g = grade.trim().toUpperCase();
  if (g === 'K' || g === 'KINDERGARTEN') return 0;
  const n = parseInt(g, 10);
  return isNaN(n) ? 6 : Math.min(Math.max(n, 0), 12);
}

function calcGraduationYear(gradeLevel: string, targetYear: number | null): number {
  if (targetYear) return targetYear;
  const currentYear = new Date().getFullYear();
  const gradeNum = gradeToNum(gradeLevel);
  return currentYear + (12 - gradeNum);
}

function gradeLabel(gradeLevel: string): string {
  const g = gradeLevel.trim().toUpperCase();
  if (g === 'K' || g === 'KINDERGARTEN') return 'Kindergarten';
  const n = parseInt(g, 10);
  if (isNaN(n)) return `Grade ${gradeLevel}`;
  const suffixes: Record<number, string> = { 1: 'st', 2: 'nd', 3: 'rd' };
  const suffix = suffixes[n] ?? 'th';
  return `${n}${suffix} Grade`;
}

function paceLabel(multiplier: number): string {
  if (multiplier >= 1.25) return 'Accelerated Pace';
  if (multiplier <= 0.8) return 'Slower Pace';
  return 'Standard Pace';
}

function paceVariant(multiplier: number): 'accelerated' | 'standard' | 'slower' {
  if (multiplier >= 1.25) return 'accelerated';
  if (multiplier <= 0.8) return 'slower';
  return 'standard';
}

export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user) return new Response('Unauthorized', { status: 401 });

    const [profile, creditSum] = await Promise.all([
      prisma.user.findUnique({
        where: { id: user.userId },
        select: {
          name: true,
          gradeLevel: true,
          learningStyle: true,
          targetGraduationYear: true,
          age: true,
          pacingMultiplier: true,
        },
      }),
      prisma.transcriptEntry.aggregate({
        where: { userId: user.userId },
        _sum: { creditsEarned: true },
      }),
    ]);

    const gradeLevel = profile?.gradeLevel ?? '8';
    const learningStyle = profile?.learningStyle ?? 'EXPEDITION';
    const pacingMultiplier = profile?.pacingMultiplier ?? 1.0;
    const totalCreditsEarned = Number(creditSum._sum.creditsEarned ?? 0);
    const graduationYear = calcGraduationYear(gradeLevel, profile?.targetGraduationYear ?? null);
    const annualTarget = ANNUAL_CREDITS[gradeLevel] ?? 2.0;
    const progressPct = Math.min(
      Math.round((totalCreditsEarned / TOTAL_GRADUATION_CREDITS) * 100),
      100,
    );

    return Response.json({
      name: profile?.name ?? 'Explorer',
      gradeLabel: gradeLabel(gradeLevel),
      gradeLevel,
      learningMode: learningStyle.toUpperCase() === 'EXPEDITION' ? 'Expedition Mode' : 'Classic Mode',
      learningStyle,
      pace: paceLabel(pacingMultiplier),
      paceVariant: paceVariant(pacingMultiplier),
      totalCreditsEarned: Math.round(totalCreditsEarned * 10) / 10,
      totalCreditsNeeded: TOTAL_GRADUATION_CREDITS,
      annualTarget,
      progressPct,
      graduationYear,
      graduationLabel: `May ${graduationYear}`,
    });
  } catch (err) {
    console.error('[/api/student/profile]', err);
    return new Response('Internal Server Error', { status: 500 });
  }
}
