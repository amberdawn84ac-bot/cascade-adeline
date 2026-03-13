/**
 * Centralized Credit Award System
 * 
 * Awards credits based on student's personalized learning plan standards.
 * Used across all subject areas and activities.
 */

import prisma from '@/lib/db';

export type CreditAwardResult = {
  creditsEarned: number;
  planStandardId: string | null;
  masteryEvidence: any;
  standardLinked: boolean;
};

export type ActivityResult = {
  subject: string;
  activityType: string;
  activityName: string;
  metadata?: any;
  performanceScore?: number; // 0-1 scale for partial credit
  masteryDemonstrated?: boolean;
};

/**
 * Award credits for an activity based on student's learning plan
 */
export async function awardCreditsForActivity(
  userId: string,
  activity: ActivityResult
): Promise<CreditAwardResult> {
  // Get student's learning plan
  const learningPlan = await prisma.learningPlan.findUnique({
    where: { userId },
    include: {
      planStandards: {
        where: { isActive: true },
        include: {
          standard: true,
          activities: true,
        },
      },
    },
  });

  let creditsEarned = 0;
  let planStandardId: string | null = null;
  let masteryEvidence: any = activity.metadata || {};

  if (learningPlan) {
    // Find matching standard in the student's plan
    const matchingStandard = learningPlan.planStandards.find(ps =>
      ps.standard.subject === activity.subject &&
      ps.activities.some(a => a.activityType === activity.activityType)
    );

    if (matchingStandard) {
      // Use the microcredit value from the student's plan
      const baseMicrocredit = Number(matchingStandard.microcreditValue);
      
      // Apply performance multiplier if provided
      const performanceMultiplier = activity.performanceScore ?? 1.0;
      
      // Full credit for mastery, partial for practice
      const masteryMultiplier = activity.masteryDemonstrated !== false ? 1.0 : 0.2;
      
      creditsEarned = baseMicrocredit * performanceMultiplier * masteryMultiplier;
      planStandardId = matchingStandard.id;

      // Update student standard progress
      await prisma.studentStandardProgress.upsert({
        where: {
          userId_standardId: {
            userId,
            standardId: matchingStandard.standardId,
          },
        },
        update: {
          microcreditsEarned: {
            increment: creditsEarned,
          },
          lastActivityAt: new Date(),
          mastery: activity.masteryDemonstrated ? 'DEVELOPING' : 'INTRODUCED',
        },
        create: {
          userId,
          standardId: matchingStandard.standardId,
          microcreditsEarned: creditsEarned,
          lastActivityAt: new Date(),
          mastery: activity.masteryDemonstrated ? 'DEVELOPING' : 'INTRODUCED',
          evidence: masteryEvidence,
        },
      });
    }
  }

  // If no plan or no matching standard, use default minimal credit
  if (creditsEarned === 0) {
    creditsEarned = 0.01; // Default minimal credit for engagement
  }

  return {
    creditsEarned: parseFloat(creditsEarned.toFixed(4)),
    planStandardId,
    masteryEvidence,
    standardLinked: !!planStandardId,
  };
}

/**
 * Create transcript entry with credit award
 */
export async function createTranscriptEntryWithCredits(
  userId: string,
  activityName: string,
  mappedSubject: string,
  creditResult: CreditAwardResult,
  notes?: string,
  metadata?: any
) {
  return await prisma.transcriptEntry.create({
    data: {
      userId,
      activityName,
      mappedSubject,
      creditsEarned: creditResult.creditsEarned,
      dateCompleted: new Date(),
      notes,
      planStandardId: creditResult.planStandardId,
      masteryEvidence: creditResult.masteryEvidence,
      metadata: metadata || {},
    },
  });
}
