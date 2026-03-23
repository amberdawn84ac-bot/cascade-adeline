import { getStudentContext } from '@/lib/learning/student-context';
import { LessonStateType } from '../lessonState';
import { lessonAssemblerNode } from './lessonAssemblerNode';
import prisma from '@/lib/db';

export async function orchestrator(state: LessonStateType): Promise<Partial<LessonStateType>> {
  const studentCtx = await getStudentContext(state.userId, { subjectArea: state.subject });

  const interests = studentCtx.interests;
  const learningStyle = studentCtx.learningStyle;
  const effectiveGrade = state.gradeLevel || studentCtx.gradeLevel;
  const bktSummary = studentCtx.bktSummary;

  // Check for existing structured lessons first
  console.log(`[orchestrator] Checking for existing lesson: ${state.subject} - ${state.topic}`);
  
  try {
    const existingLessons = await prisma.lesson.findMany({
      where: {
        subject: {
          contains: state.subject,
          mode: 'insensitive'
        },
        title: {
          contains: state.topic,
          mode: 'insensitive'
        },
        isActive: true
      },
      take: 1
    });

    if (existingLessons.length > 0) {
      console.log(`[orchestrator] Found existing lesson: ${existingLessons[0].title}`);
      
      // Use lesson assembler to prepare the existing lesson
      const assemblerResult = await lessonAssemblerNode({
        userId: state.userId,
        subject: state.subject,
        topic: state.topic,
        gradeLevel: effectiveGrade,
        interests,
        learningStyle
      } as any);

      if (assemblerResult.genUIPayload?.lesson) {
        console.log(`[orchestrator] Using structured lesson with ${assemblerResult.adaptedBlocks?.length || 0} blocks`);
        return {
          bktSummary,
          interests,
          learningStyle,
          gradeLevel: effectiveGrade,
          loopCount: state.loopCount,
          phase: 'structured_lesson',
          blocks: assemblerResult.adaptedBlocks as any || [],
          genUIPayload: assemblerResult.genUIPayload,
          // Skip to personalizer since we have complete lesson
          _skipTo: 'personalizerAgent'
        };
      }
    }
  } catch (error) {
    console.warn('[orchestrator] Error checking for existing lessons:', error);
  }

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
