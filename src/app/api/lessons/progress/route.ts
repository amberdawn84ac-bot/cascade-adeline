/**
 * Lesson Progress API
 * 
 * Tracks student progress through lesson blocks and awards credits.
 * Automatically updates StudentStandardProgress and transcript entries.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import prisma from '@/lib/db';
import { getAllCodesForSubject } from '@/lib/standards/subjectStandardsMap';
import { getOrCreateStandard, recordStandardProgress } from '@/lib/services/standardsService';
import { calculateLessonCredits, getTotalCreditHours } from '@/lib/standards/creditCalculator';

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { lessonId, blockId, completed, response, timeSpent, score } = await req.json();

    // Record or update progress
    const progress = await prisma.studentLessonProgress.upsert({
      where: {
        userId_lessonId_blockId: {
          userId: user.userId,
          lessonId,
          blockId
        }
      },
      update: {
        completed,
        response: response || {},
        timeSpent: timeSpent || 0,
        score: score || null,
        completedAt: completed ? new Date() : null
      },
      create: {
        userId: user.userId,
        lessonId,
        blockId,
        completed,
        response: response || {},
        timeSpent: timeSpent || 0,
        score: score || null,
        completedAt: completed ? new Date() : null
      }
    });

    // Check if lesson is now complete
    const allBlocks = await prisma.studentLessonProgress.findMany({
      where: {
        userId: user.userId,
        lessonId
      }
    });

    const totalBlocks = allBlocks.length;
    const completedBlocks = allBlocks.filter(b => b.completed).length;
    const lessonCompleted = completedBlocks === totalBlocks && totalBlocks > 0;

    let creditsAwarded = [];
    let transcriptEntries = [];

    // Award credits when lesson is completed
    if (lessonCompleted) {
      try {
        // Get lesson details for credit calculation
        const lesson = await prisma.lesson.findUnique({
          where: { lessonId }
        });

        if (lesson) {
          const creditAwards = calculateLessonCredits({
            subject: lesson.subject,
            topic: lesson.title,
            blocks: lesson.lessonJson as any[],
            standardsCodes: lesson.standardsCodes,
            quizScore: score || 100,
            completedBlocks: allBlocks.map(b => b.blockId)
          });

          // Create transcript entries for each credit award
          for (const award of creditAwards) {
            const entry = await prisma.transcriptEntry.create({
              data: {
                userId: user.userId,
                activityName: `${lesson.title} - ${award.subject}`,
                mappedSubject: award.subject,
                creditsEarned: award.hours,
                dateCompleted: new Date(),
                notes: `Lesson completed - ${award.standards.length} standards`,
                masteryEvidence: { 
                  lessonId, 
                  blocksCompleted: completedBlocks,
                  standards: award.standards 
                },
                metadata: { 
                  source: 'lesson-system',
                  lessonType: 'structured_lesson'
                }
              }
            });
            transcriptEntries.push(entry);
          }

          // Record standards progress
          for (const award of creditAwards) {
            for (const standardCode of award.standards) {
              const jx = standardCode.startsWith('OAS') ? 'Oklahoma' : 
                        standardCode.startsWith('AP') ? 'AP' : 'Common Core';
              const std = await getOrCreateStandard(standardCode, jx);
              if (std) {
                await recordStandardProgress(user.userId, std.id, 'lesson', transcriptEntries[0]?.id);
              }
            }
          }

          creditsAwarded = creditAwards;
        }
      } catch (creditErr) {
        console.error('[lesson-progress] Credit awarding failed:', creditErr);
      }
    }

    return NextResponse.json({
      success: true,
      progress,
      lessonCompleted,
      creditsAwarded: lessonCompleted ? creditsAwarded : undefined,
      transcriptEntries: lessonCompleted ? transcriptEntries : undefined,
      totalHours: lessonCompleted ? getTotalCreditHours(creditsAwarded) : 0
    });

  } catch (error) {
    console.error('[lesson-progress] Error:', error);
    return NextResponse.json({ error: 'Failed to record progress' }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const lessonId = searchParams.get('lessonId');

    if (!lessonId) {
      return NextResponse.json({ error: 'Lesson ID required' }, { status: 400 });
    }

    const progress = await prisma.studentLessonProgress.findMany({
      where: {
        userId: user.userId,
        lessonId
      },
      orderBy: { createdAt: 'asc' }
    });

    return NextResponse.json({ progress });

  } catch (error) {
    console.error('[lesson-progress] GET Error:', error);
    return NextResponse.json({ error: 'Failed to fetch progress' }, { status: 500 });
  }
}
