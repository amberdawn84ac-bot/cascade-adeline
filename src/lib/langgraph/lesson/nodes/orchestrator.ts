import prisma from '@/lib/db';
import { getZPDSummaryForPrompt } from '@/lib/zpd-engine';
import { LessonStateType } from '../lessonState';

export async function orchestrator(state: LessonStateType): Promise<Partial<LessonStateType>> {
  const [user, bktSummary] = await Promise.all([
    prisma.user.findUnique({
      where: { id: state.userId },
      select: { interests: true, learningStyle: true, gradeLevel: true },
    }),
    getZPDSummaryForPrompt(state.userId, { subjectArea: state.subject, limit: 5 }).catch(() => ''),
  ]);

  const interests = user?.interests ?? [];
  const learningStyle = user?.learningStyle ?? 'EXPEDITION';
  const effectiveGrade = state.gradeLevel || user?.gradeLevel || '';

  // Determine phase based on re-entry signals
  let phase = 'intro';
  let loopCount = state.loopCount;

  if (state.quizScore !== undefined && state.quizScore < 70 && loopCount < 3) {
    loopCount = loopCount + 1;
    phase = 'remediation';
  } else if (loopCount >= 3) {
    phase = 'activity'; // force out of loop
  }

  console.log(`[orchestrator] phase=${phase} loopCount=${loopCount} quizScore=${state.quizScore}`);

  return {
    bktSummary,
    interests,
    learningStyle,
    gradeLevel: effectiveGrade,
    loopCount,
    phase,
  };
}
