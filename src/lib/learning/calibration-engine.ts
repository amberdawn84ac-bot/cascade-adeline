/**
 * Calibration Engine — Decoupled Subject Mastery Baseline
 *
 * Provides utilities to update, retrieve, and auto-calibrate a student's
 * subject-specific grade level (mathLevel, elaLevel, scienceLevel, historyLevel).
 *
 * Called by:
 *  - ZPD engine when student consistently aces above-grade material
 *  - Assessment routes when a placement result is finalized
 *  - Manual overrides from parent/teacher settings
 */

import prisma from '@/lib/db';
import { invalidateStudentContext, resolveSubjectKey } from '@/lib/learning/student-context';
import { ensureStudentStandardsLoaded } from '@/lib/services/standardsService';

export type SubjectKey = 'math' | 'ela' | 'science' | 'history';

const SUBJECT_DB_MAP: Record<SubjectKey, 'mathLevel' | 'elaLevel' | 'scienceLevel' | 'historyLevel'> = {
  math:    'mathLevel',
  ela:     'elaLevel',
  science: 'scienceLevel',
  history: 'historyLevel',
};

const SUBJECT_GRADE_STRING_MAP: Record<SubjectKey, string> = {
  math:    'Mathematics',
  ela:     'English Language Arts',
  science: 'Science',
  history: 'Social Studies',
};

/**
 * Update a student's baseline level for a specific subject.
 * Also reloads that subject's standards into StudentStandardProgress
 * and busts the cached StudentContext.
 */
export async function updateSubjectBaseline(
  userId: string,
  subject: string,
  newLevel: number
): Promise<{ updated: boolean; subject: SubjectKey; newLevel: number }> {
  const subjectKey = resolveSubjectKey(subject) as SubjectKey | null;
  if (!subjectKey) {
    console.warn(`[calibration-engine] Unknown subject: "${subject}"`);
    return { updated: false, subject: 'math', newLevel };
  }

  const dbField = SUBJECT_DB_MAP[subjectKey];
  const clampedLevel = Math.max(0, Math.min(12, newLevel));

  await prisma.user.update({
    where: { id: userId },
    data: { [dbField]: clampedLevel },
  });

  invalidateStudentContext(userId);

  // Load standards for the new level
  const gradeString = clampedLevel === 0 ? 'K' : String(clampedLevel);
  ensureStudentStandardsLoaded(userId, gradeString).catch((err) =>
    console.warn('[calibration-engine] ensureStudentStandardsLoaded failed:', err)
  );

  console.log(`[calibration-engine] Set ${userId} ${subjectKey} → Grade ${clampedLevel}`);
  return { updated: true, subject: subjectKey, newLevel: clampedLevel };
}

/**
 * Get a student's current level for a specific subject.
 * Falls back to the global gradeLevel (parsed as int) if subject level not set.
 */
export async function getSubjectLevel(userId: string, subject: string): Promise<number> {
  const subjectKey = resolveSubjectKey(subject) as SubjectKey | null;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      gradeLevel: true,
      mathLevel: true,
      elaLevel: true,
      scienceLevel: true,
      historyLevel: true,
    },
  });

  if (!user) return 3;

  const fallback = (() => {
    const g = user.gradeLevel ?? '3';
    if (g.toLowerCase() === 'k') return 0;
    const n = parseInt(g);
    return isNaN(n) ? 3 : Math.min(12, n);
  })();

  if (!subjectKey) return fallback;

  const dbField = SUBJECT_DB_MAP[subjectKey];
  return user[dbField] ?? fallback;
}

/**
 * Update a student's pacing multiplier (e.g. 1.5 = 50% faster toward early graduation).
 */
export async function updatePacingMultiplier(
  userId: string,
  multiplier: number
): Promise<void> {
  const clamped = Math.max(0.5, Math.min(3.0, multiplier));
  await prisma.user.update({
    where: { id: userId },
    data: { pacingMultiplier: clamped },
  });
  invalidateStudentContext(userId);
}

/**
 * Set a student's target graduation year (for early graduation tracking).
 */
export async function setTargetGraduationYear(
  userId: string,
  year: number
): Promise<void> {
  await prisma.user.update({
    where: { id: userId },
    data: { targetGraduationYear: year },
  });
  invalidateStudentContext(userId);
}

/**
 * Auto-advance: called by ZPD engine when a student aces above-level material.
 * Bumps the subject level by 1 if the student is consistently performing above
 * their current baseline.
 *
 * @param masteryScore  0.0 – 1.0 from the ZPD/BKT engine
 * @param threshold     mastery score above which we advance (default 0.9)
 */
export async function autoAdvanceIfReady(
  userId: string,
  subject: string,
  masteryScore: number,
  threshold = 0.9
): Promise<{ advanced: boolean; newLevel?: number }> {
  if (masteryScore < threshold) return { advanced: false };

  const currentLevel = await getSubjectLevel(userId, subject);
  const nextLevel = currentLevel + 1;

  if (nextLevel > 12) return { advanced: false };

  await updateSubjectBaseline(userId, subject, nextLevel);
  console.log(`[calibration-engine] Auto-advanced ${userId} ${subject}: ${currentLevel} → ${nextLevel}`);
  return { advanced: true, newLevel: nextLevel };
}

export { SUBJECT_GRADE_STRING_MAP };
