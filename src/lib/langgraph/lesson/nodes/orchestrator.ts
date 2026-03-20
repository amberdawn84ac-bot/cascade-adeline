import { getStudentContext } from '@/lib/learning/student-context';
import { LessonStateType } from '../lessonState';

export async function orchestrator(state: LessonStateType): Promise<Partial<LessonStateType>> {
  const studentCtx = await getStudentContext(state.userId, { subjectArea: state.subject });

  const interests = studentCtx.interests;
  const learningStyle = studentCtx.learningStyle;
  const effectiveGrade = state.gradeLevel || studentCtx.gradeLevel;
  const bktSummary = studentCtx.bktSummary;

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
