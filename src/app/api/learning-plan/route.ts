import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import prisma from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // Fetch learning plan with all relations
    const plan = await prisma.learningPlan.findUnique({
      where: { userId: user.userId },
      include: {
        planStandards: {
          where: { isActive: true },
          include: {
            standard: true,
            activities: true,
          },
          orderBy: {
            standard: {
              subject: 'asc',
            },
          },
        },
      },
    });

    if (!plan) {
      return NextResponse.json({ 
        error: 'No learning plan found',
        message: 'Create a learning plan first'
      }, { status: 404 });
    }

    // Get progress statistics
    const progressStats = await prisma.studentStandardProgress.groupBy({
      by: ['mastery'],
      where: {
        userId: user.userId,
      },
      _count: true,
    });

    const totalStandards = plan.planStandards.length;
    const masteredCount = progressStats.find(s => s.mastery === 'MASTERED')?._count || 0;
    const proficientCount = progressStats.find(s => s.mastery === 'PROFICIENT')?._count || 0;
    const developingCount = progressStats.find(s => s.mastery === 'DEVELOPING')?._count || 0;

    // Group standards by subject
    const standardsBySubject = plan.planStandards.reduce((acc, ps) => {
      const subject = ps.standard.subject;
      if (!acc[subject]) {
        acc[subject] = {
          subject,
          standards: [],
          totalMicrocredits: 0,
          earnedMicrocredits: 0,
        };
      }
      acc[subject].standards.push(ps);
      acc[subject].totalMicrocredits += Number(ps.microcreditValue);
      return acc;
    }, {} as Record<string, any>);

    // Calculate earned microcredits per subject
    const earnedByStandard = await prisma.studentStandardProgress.findMany({
      where: {
        userId: user.userId,
        standardId: {
          in: plan.planStandards.map(ps => ps.standardId),
        },
      },
      select: {
        standardId: true,
        microcreditsEarned: true,
      },
    });

    const earnedMap = new Map(
      earnedByStandard.map(e => [e.standardId, Number(e.microcreditsEarned)])
    );

    for (const ps of plan.planStandards) {
      const subject = ps.standard.subject;
      const earned = earnedMap.get(ps.standardId) || 0;
      standardsBySubject[subject].earnedMicrocredits += earned;
    }

    return NextResponse.json({
      plan: {
        id: plan.id,
        state: plan.state,
        graduationYear: plan.graduationYear,
        lastReviewedAt: plan.lastReviewedAt,
        createdAt: plan.createdAt,
      },
      subjects: Object.values(standardsBySubject),
      progress: {
        totalStandards,
        mastered: masteredCount,
        proficient: proficientCount,
        developing: developingCount,
        introduced: totalStandards - masteredCount - proficientCount - developingCount,
      },
    });

  } catch (error) {
    console.error('[learning-plan] Error:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch learning plan',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
