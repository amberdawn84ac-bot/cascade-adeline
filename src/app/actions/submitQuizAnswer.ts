'use server';

import { getSessionUser } from '@/lib/auth';
import { updateBKT } from '@/lib/learning/bkt';
import prisma from '@/lib/db';

interface QuizAnswerSubmission {
  lessonId: string;
  blockId: string;
  questionId: string;
  selectedAnswer: number;
  correctAnswer: number;
  conceptId?: string;
  timeSpent: number; // seconds
}

export async function submitQuizAnswer(data: QuizAnswerSubmission) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return { success: false, error: 'Unauthorized' };
    }

    const { lessonId, blockId, questionId, selectedAnswer, correctAnswer, conceptId, timeSpent } = data;
    const isCorrect = selectedAnswer === correctAnswer;

    // Save to StudentLessonProgress
    await prisma.studentLessonProgress.upsert({
      where: {
        userId_lessonId_blockId: {
          userId: user.userId,
          lessonId,
          blockId
        }
      },
      create: {
        userId: user.userId,
        lessonId,
        blockId,
        completed: true,
        response: {
          questionId,
          selectedAnswer,
          isCorrect
        },
        timeSpent,
        score: isCorrect ? 100 : 0,
        completedAt: new Date()
      },
      update: {
        response: {
          questionId,
          selectedAnswer,
          isCorrect
        },
        score: isCorrect ? 100 : 0,
        timeSpent,
        completedAt: new Date()
      }
    });

    // Update BKT if conceptId provided
    if (conceptId) {
      const bktResult = await updateBKT({
        userId: user.userId,
        conceptId,
        correct: isCorrect,
        timestamp: new Date()
      });

      console.log('[Quiz Answer] BKT updated:', bktResult);
    }

    // Get or update lesson session
    const session = await prisma.lessonSession.findFirst({
      where: {
        userId: user.userId,
        lessonId,
        isActive: true
      }
    });

    if (session) {
      // Add to completed blocks
      const completedBlocks = [...new Set([...session.completedBlocks, blockId])];
      
      await prisma.lessonSession.update({
        where: { id: session.id },
        data: {
          completedBlocks,
          studentResponses: {
            ...((session.studentResponses as any) || {}),
            [blockId]: {
              questionId,
              selectedAnswer,
              isCorrect,
              timestamp: new Date().toISOString()
            }
          }
        }
      });
    }

    return {
      success: true,
      correct: isCorrect,
      masteryUpdated: !!conceptId
    };
  } catch (error) {
    console.error('[Submit Quiz Answer] Error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Handle lesson branching based on quiz score
 */
export async function handleLessonBranching(lessonId: string, blockId: string, score: number) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return { success: false, error: 'Unauthorized' };
    }

    const session = await prisma.lessonSession.findFirst({
      where: {
        userId: user.userId,
        lessonId,
        isActive: true
      }
    });

    if (!session) {
      return { success: false, error: 'No active session found' };
    }

    // Determine which blocks to show based on score
    let newVisibleBlocks: string[] = [];
    
    if (score > 80) {
      // Show advanced content
      newVisibleBlocks = [`${blockId}-advanced`, 'advanced-synthesis'];
    } else if (score < 60) {
      // Show remedial content
      newVisibleBlocks = [`${blockId}-remedial`, 'remedial-review'];
    }

    if (newVisibleBlocks.length > 0) {
      await prisma.lessonSession.update({
        where: { id: session.id },
        data: {
          visibleBlocks: [...session.visibleBlocks, ...newVisibleBlocks],
          currentBranch: score > 80 ? 'advanced' : score < 60 ? 'remedial' : 'standard'
        }
      });

      return {
        success: true,
        newBlocks: newVisibleBlocks,
        branch: score > 80 ? 'advanced' : 'remedial'
      };
    }

    return { success: true, newBlocks: [], branch: 'standard' };
  } catch (error) {
    console.error('[Lesson Branching] Error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}
