import { generateObject } from 'ai';
import { z } from 'zod';
import { getModel } from '@/lib/ai-models';
import { loadConfig, buildSystemPrompt } from '@/lib/config';
import prisma from '@/lib/db';

export interface AnalyticsMetrics {
  engagementMetrics: {
    totalMessages: number;
    averageSessionLength: number;
    activeUsers: number;
    retentionRate: number;
  };
  learningMetrics: {
    conceptsMastered: number;
    averageMasteryScore: number;
    learningVelocity: number;
    strugglingConcepts: string[];
  };
  collaborationMetrics: {
    collaborativeSessions: number;
    peerTeachingMatches: number;
    sharedInsights: number;
    teamProjects: number;
  };
  characterGrowthMetrics: {
    virtueAssessments: number;
    spiritualGrowthScore: number;
    serviceLearningHours: number;
    holisticScore: number;
  };
}

export interface AnalyticsInsight {
  category: 'engagement' | 'learning' | 'collaboration' | 'character';
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  recommendations: string[];
}

const InsightSchema = z.object({
  insights: z.array(z.object({
    category: z.enum(['engagement', 'learning', 'collaboration', 'character']),
    title: z.string(),
    description: z.string(),
    priority: z.enum(['high', 'medium', 'low']),
    recommendations: z.array(z.string()).min(1).max(4),
  })).min(2).max(5),
});

async function computeMetrics(userId: string | undefined, sinceDate: Date, periodMs: number): Promise<AnalyticsMetrics> {
  const previousPeriodStart = new Date(sinceDate.getTime() - periodMs);
  const userFilter = userId ? { userId } : {};
  const hostFilter = userId ? { hostUserId: userId } : {};
  const creatorFilter = userId ? { createdById: userId } : {};

  const [
    transcriptEntries,
    userConcepts,
    collaborativeSessions,
    avgDuration,
    newMasteries,
    prevPeriodMemories,
    currPeriodMemories,
    reflections,
    teamProjects,
  ] = await Promise.all([
    prisma.transcriptEntry.findMany({
      where: { ...userFilter, dateCompleted: { gte: sinceDate } },
    }),
    prisma.userConceptMastery.findMany({
      where: userFilter,
      include: { concept: true },
    }),
    prisma.collaborativeSession.findMany({
      where: { ...hostFilter, createdAt: { gte: sinceDate } },
    }),
    prisma.userActivity.aggregate({
      where: { ...userFilter, createdAt: { gte: sinceDate } },
      _avg: { duration: true },
    }),
    prisma.userConceptMastery.count({
      where: { ...userFilter, masteryLevel: { gte: 0.8 }, updatedAt: { gte: sinceDate } },
    }),
    prisma.conversationMemory.groupBy({
      by: ['userId'],
      where: { createdAt: { gte: previousPeriodStart, lt: sinceDate } },
    }),
    prisma.conversationMemory.groupBy({
      by: ['userId'],
      where: { createdAt: { gte: sinceDate } },
    }),
    prisma.reflectionEntry.count({
      where: { ...userFilter, createdAt: { gte: sinceDate } },
    }),
    prisma.project.count({
      where: { ...creatorFilter, createdAt: { gte: sinceDate } },
    }),
  ]);

  // averageSessionLength: avg activity duration in minutes (fallback: 0)
  const averageSessionLength = avgDuration._avg.duration ?? 0;

  // activeUsers: distinct users with conversation memories this period
  const activeUsers = userId ? 1 : currPeriodMemories.length;

  // retentionRate: fraction of previous-period users who returned this period
  const prevIds = new Set(prevPeriodMemories.map((u: { userId: string }) => u.userId));
  const retained = currPeriodMemories.filter((u: { userId: string }) => prevIds.has(u.userId)).length;
  const retentionRate = prevIds.size > 0 ? retained / prevIds.size : (currPeriodMemories.length > 0 ? 1 : 0);

  // learningVelocity: fraction of tracked concepts newly mastered this period
  const totalConcepts = userConcepts.length;
  const learningVelocity = totalConcepts > 0 ? newMasteries / totalConcepts : 0;

  // peerTeachingMatches: sessions where participantIds array has > 1 entry
  const peerTeachingMatches = collaborativeSessions.filter((s: any) => {
    const ids = Array.isArray(s.participantIds) ? s.participantIds : [];
    return ids.length > 1;
  }).length;

  // sharedInsights: total insight objects across all session sharedInsights arrays
  const sharedInsights = collaborativeSessions.reduce((sum: number, s: any) => {
    const arr = Array.isArray(s.sharedInsights) ? s.sharedInsights : [];
    return sum + arr.length;
  }, 0);

  // spiritualGrowthScore: reflections this period vs. 1-per-week target (capped at 1.0)
  const weeksInPeriod = Math.max(1, periodMs / (7 * 24 * 60 * 60 * 1000));
  const spiritualGrowthScore = Math.min(reflections / weeksInPeriod, 1.0);

  // holisticScore: weighted composite of mastery + reflection consistency + streak proxy
  const avgMastery = totalConcepts > 0
    ? userConcepts.reduce((sum: number, c: any) => sum + Number(c.masteryLevel), 0) / totalConcepts
    : 0;
  const reflectionScore = Math.min(reflections / Math.max(weeksInPeriod, 1), 1);
  const holisticScore = parseFloat((avgMastery * 0.5 + reflectionScore * 0.3 + Math.min(transcriptEntries.length / 20, 1) * 0.2).toFixed(3));

  return {
    engagementMetrics: {
      totalMessages: transcriptEntries.length,
      averageSessionLength,
      activeUsers,
      retentionRate,
    },
    learningMetrics: {
      conceptsMastered: userConcepts.filter((c: any) => Number(c.masteryLevel) > 0.8).length,
      averageMasteryScore: totalConcepts > 0
        ? userConcepts.reduce((sum: number, c: any) => sum + Number(c.masteryLevel), 0) / totalConcepts
        : 0,
      learningVelocity,
      strugglingConcepts: userConcepts.filter((c: any) => Number(c.masteryLevel) < 0.5).map((c: any) => c.concept.name).slice(0, 5),
    },
    collaborationMetrics: {
      collaborativeSessions: collaborativeSessions.length,
      peerTeachingMatches,
      sharedInsights,
      teamProjects,
    },
    characterGrowthMetrics: {
      virtueAssessments: reflections,
      spiritualGrowthScore,
      serviceLearningHours: transcriptEntries.reduce((sum: number, e: any) => sum + (Number(e.creditsEarned) * 120), 0),
      holisticScore,
    },
  };
}

export async function generateAnalytics(
  userId?: string,
  period: '24h' | '7d' | '30d' = '7d'
): Promise<{ metrics: AnalyticsMetrics; insights: AnalyticsInsight[] }> {
  try {
    const config = loadConfig();
    const periodMs = period === '24h' ? 24 * 60 * 60 * 1000 : period === '7d' ? 7 * 24 * 60 * 60 * 1000 : 30 * 24 * 60 * 60 * 1000;
    const sinceDate = new Date(Date.now() - periodMs);

    const metrics = await computeMetrics(userId, sinceDate, periodMs);

    const systemPrompt = buildSystemPrompt(config);
    const { object } = await generateObject({
      model: getModel(config.models.default),
      schema: InsightSchema,
      system: systemPrompt,
      prompt: `You are Adeline, a caring educational guide. Based on these real analytics for the ${period} period, generate 3-5 concise, actionable insights for parents and students. Focus on the whole child — knowledge, skills, character, and calling. Be specific and encouraging, not generic.

Analytics data:
${JSON.stringify(metrics, null, 2)}`,
      temperature: 0.6,
    });

    return { metrics, insights: object.insights as AnalyticsInsight[] };
  } catch (error) {
    console.error('Analytics generation error:', error);
    throw new Error('Failed to generate analytics');
  }
}

export async function getCohortAnalytics(
  cohortIds: string[],
  period: '24h' | '7d' | '30d' = '7d'
): Promise<{ cohortMetrics: AnalyticsMetrics; memberCount: number }> {
  if (!cohortIds.length) throw new Error('No cohort IDs provided');

  const periodMs = period === '24h' ? 24 * 60 * 60 * 1000 : period === '7d' ? 7 * 24 * 60 * 60 * 1000 : 30 * 24 * 60 * 60 * 1000;
  const sinceDate = new Date(Date.now() - periodMs);
  const previousPeriodStart = new Date(sinceDate.getTime() - periodMs);

  const [transcripts, concepts, sessions, avgDuration, reflections, projects, prevMemories, currMemories] = await Promise.all([
    prisma.transcriptEntry.findMany({ where: { userId: { in: cohortIds }, dateCompleted: { gte: sinceDate } } }),
    prisma.userConceptMastery.findMany({ where: { userId: { in: cohortIds } }, include: { concept: true } }),
    prisma.collaborativeSession.findMany({ where: { hostUserId: { in: cohortIds }, createdAt: { gte: sinceDate } } }),
    prisma.userActivity.aggregate({ where: { userId: { in: cohortIds }, createdAt: { gte: sinceDate } }, _avg: { duration: true } }),
    prisma.reflectionEntry.count({ where: { userId: { in: cohortIds }, createdAt: { gte: sinceDate } } }),
    prisma.project.count({ where: { createdById: { in: cohortIds }, createdAt: { gte: sinceDate } } }),
    prisma.conversationMemory.groupBy({ by: ['userId'], where: { userId: { in: cohortIds }, createdAt: { gte: previousPeriodStart, lt: sinceDate } } }),
    prisma.conversationMemory.groupBy({ by: ['userId'], where: { userId: { in: cohortIds }, createdAt: { gte: sinceDate } } }),
  ]);

  const prevIds = new Set(prevMemories.map((u: { userId: string }) => u.userId));
  const retained = currMemories.filter((u: { userId: string }) => prevIds.has(u.userId)).length;
  const retentionRate = prevIds.size > 0 ? retained / prevIds.size : 0;
  const totalConcepts = concepts.length;
  const avgMastery = totalConcepts > 0 ? concepts.reduce((s: number, c: any) => s + Number(c.masteryLevel), 0) / totalConcepts : 0;
  const weeksInPeriod = Math.max(1, periodMs / (7 * 24 * 60 * 60 * 1000));
  const holisticScore = parseFloat((avgMastery * 0.5 + Math.min(reflections / (cohortIds.length * weeksInPeriod), 1) * 0.3 + Math.min(transcripts.length / (cohortIds.length * 20), 1) * 0.2).toFixed(3));

  return {
    memberCount: cohortIds.length,
    cohortMetrics: {
      engagementMetrics: {
        totalMessages: transcripts.length,
        averageSessionLength: avgDuration._avg.duration ?? 0,
        activeUsers: currMemories.length,
        retentionRate,
      },
      learningMetrics: {
        conceptsMastered: concepts.filter((c: any) => Number(c.masteryLevel) > 0.8).length,
        averageMasteryScore: avgMastery,
        learningVelocity: totalConcepts > 0 ? concepts.filter((c: any) => Number(c.masteryLevel) >= 0.8).length / totalConcepts : 0,
        strugglingConcepts: concepts.filter((c: any) => Number(c.masteryLevel) < 0.5).map((c: any) => c.concept.name).slice(0, 5),
      },
      collaborationMetrics: {
        collaborativeSessions: sessions.length,
        peerTeachingMatches: sessions.filter((s: any) => (Array.isArray(s.participantIds) ? s.participantIds : []).length > 1).length,
        sharedInsights: sessions.reduce((s: number, session: any) => s + (Array.isArray(session.sharedInsights) ? session.sharedInsights.length : 0), 0),
        teamProjects: projects,
      },
      characterGrowthMetrics: {
        virtueAssessments: reflections,
        spiritualGrowthScore: Math.min(reflections / (cohortIds.length * weeksInPeriod), 1),
        serviceLearningHours: transcripts.reduce((s: number, e: any) => s + Number(e.creditsEarned) * 120, 0),
        holisticScore,
      },
    },
  };
}

