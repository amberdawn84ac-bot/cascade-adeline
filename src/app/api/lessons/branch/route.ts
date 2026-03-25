import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import prisma from '@/lib/db';
import { updateBKT } from '@/lib/learning/bkt';

export async function POST(req: Request) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { blockId, response, currentBlocks, lessonId } = await req.json();

    // Save student response
    await prisma.studentLessonProgress.upsert({
      where: {
        userId_lessonId_blockId: {
          userId: user.userId,
          lessonId: lessonId || 'temp',
          blockId
        }
      },
      create: {
        userId: user.userId,
        lessonId: lessonId || 'temp',
        blockId,
        response,
        completed: true,
        score: response.score,
        timeSpent: response.timeSpent || 0
      },
      update: {
        response,
        completed: true,
        score: response.score,
        timeSpent: response.timeSpent || 0,
        completedAt: new Date()
      }
    });

    // Update BKT if this is a quiz response
    if (response.score !== undefined && response.correct !== undefined) {
      await updateBKT({
        userId: user.userId,
        conceptId: blockId,
        correct: response.correct,
        timestamp: new Date()
      });
    }

    // Determine branching logic
    const branchingResult: any = {
      showBlocks: [],
      hideBlocks: [],
      newBlocks: []
    };

    // Quiz score-based branching
    if (response.score !== undefined) {
      if (response.score > 80) {
        // Show advanced content
        branchingResult.showBlocks = currentBlocks
          .filter((id: string) => id.includes('advanced'))
          .slice(0, 2);
      } else if (response.score < 70) {
        // Show review content
        branchingResult.showBlocks = currentBlocks
          .filter((id: string) => id.includes('review'))
          .slice(0, 2);
      }
    }

    // Choice-based branching
    if (response.choice) {
      // Add blocks based on student choice
      // This would be expanded with actual branching logic from lesson definition
      branchingResult.message = `Exploring ${response.choice}...`;
    }

    // Update lesson session
    const session = await prisma.lessonSession.findFirst({
      where: {
        userId: user.userId,
        lessonId: lessonId || 'temp',
        isActive: true
      }
    });

    if (session) {
      const completedBlocks = [...session.completedBlocks, blockId];
      await prisma.lessonSession.update({
        where: { id: session.id },
        data: {
          completedBlocks,
          studentResponses: {
            ...((session.studentResponses as any) || {}),
            [blockId]: response
          },
          updatedAt: new Date()
        }
      });
    }

    return NextResponse.json(branchingResult);
  } catch (error) {
    console.error('[Branch API] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
