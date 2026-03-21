import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import prisma from '@/lib/db';
import { ensureStudentStandardsLoaded } from '@/lib/services/standardsService';

/**
 * GET /api/standards/progress
 *
 * Returns the student's full standards checklist grouped by subject and grade level,
 * with mastery status for each standard. Used to render the graduation progress view.
 *
 * Query params:
 *   - subject (optional): filter by subject
 *   - grade (optional): filter by grade level
 *   - jurisdiction (optional, default "Oklahoma")
 */
export async function GET(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const subjectFilter = searchParams.get('subject') ?? undefined;
  const gradeFilter = searchParams.get('grade') ?? undefined;
  const jurisdiction = searchParams.get('jurisdiction') ?? 'Oklahoma';

  // Ensure the checklist exists for this student's current grade (idempotent)
  const studentGrade = await prisma.user
    .findUnique({ where: { id: user.userId }, select: { gradeLevel: true } })
    .then((u) => u?.gradeLevel ?? null);

  if (studentGrade) {
    ensureStudentStandardsLoaded(user.userId, studentGrade, jurisdiction).catch(() => {});
  }

  // Fetch all standards for the jurisdiction + optional filters
  const standards = await prisma.stateStandard.findMany({
    where: {
      jurisdiction,
      ...(subjectFilter ? { subject: subjectFilter } : {}),
      ...(gradeFilter ? { gradeLevel: gradeFilter } : {}),
    },
    orderBy: [{ subject: 'asc' }, { gradeLevel: 'asc' }, { standardCode: 'asc' }],
  });

  // Fetch this student's progress records
  const progress = await prisma.studentStandardProgress.findMany({
    where: { userId: user.userId },
    select: { standardId: true, mastery: true, demonstratedAt: true, lastActivityAt: true },
  });

  const progressMap = new Map(progress.map((p) => [p.standardId, p]));

  // Shape: group by subject → grade
  const grouped: Record<string, Record<string, Array<{
    id: string;
    code: string;
    statement: string;
    mastery: string;
    demonstratedAt: string | null;
  }>>> = {};

  for (const s of standards) {
    if (!grouped[s.subject]) grouped[s.subject] = {};
    if (!grouped[s.subject][s.gradeLevel]) grouped[s.subject][s.gradeLevel] = [];

    const prog = progressMap.get(s.id);
    grouped[s.subject][s.gradeLevel].push({
      id: s.id,
      code: s.standardCode,
      statement: s.statementText,
      mastery: prog?.mastery ?? 'NOT_STARTED',
      demonstratedAt: prog?.demonstratedAt?.toISOString() ?? null,
    });
  }

  // Summary counts
  const totalStandards = standards.length;
  const masteredCount = progress.filter((p) => p.mastery === 'MASTERED').length;
  const proficientCount = progress.filter((p) => p.mastery === 'PROFICIENT').length;
  const developingCount = progress.filter((p) => p.mastery === 'DEVELOPING').length;
  const introducedCount = progress.filter((p) => p.mastery === 'INTRODUCED').length;

  return NextResponse.json({
    summary: {
      total: totalStandards,
      mastered: masteredCount,
      proficient: proficientCount,
      developing: developingCount,
      introduced: introducedCount,
      notStarted: totalStandards - progress.length,
    },
    bySubjectAndGrade: grouped,
  });
}
