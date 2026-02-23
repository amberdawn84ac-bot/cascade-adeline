import prisma from '../db';
import { generateText } from 'ai';
import { getModel } from '../ai-models';
import { loadConfig } from '../config';

export interface KnowledgeSharingSession {
  id: string;
  topic: string;
  hostUserId: string;
  participantIds: string[];
  status: 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
  startTime: Date;
  endTime?: Date;
  sharedInsights: Array<{
    userId: string;
    insight: string;
    category: 'concept' | 'strategy' | 'resource' | 'question';
    timestamp: Date;
  }>;
}

export interface PeerTeachingMatch {
  mentorId: string;
  menteeId: string;
  conceptId: string;
  masteryLevel: number;
  confidenceScore: number;
  scheduledAt?: Date;
  status: 'PENDING' | 'SCHEDULED' | 'COMPLETED';
}

/**
 * Create a collaborative knowledge sharing session.
 */
export async function createKnowledgeSharingSession(
  hostUserId: string,
  topic: string,
  participantIds: string[]
): Promise<KnowledgeSharingSession> {
  const session = await prisma.collaborativeSession.create({
    data: {
      hostUserId,
      topic,
      participantIds,
      status: 'ACTIVE',
      startTime: new Date(),
      sharedInsights: [],
    },
  });

  return {
    id: session.id,
    topic: session.topic,
    hostUserId: session.hostUserId,
    participantIds: session.participantIds as string[],
    status: session.status as any,
    startTime: session.startTime,
    sharedInsights: [],
  };
}

/**
 * Find optimal peer teaching matches based on mastery levels.
 */
export async function findPeerTeachingMatches(
  userId: string,
  subjectArea?: string
): Promise<PeerTeachingMatch[]> {
  // Get user's mastered concepts (high mastery)
  const userMasteredConcepts = await prisma.userConceptMastery.findMany({
    where: {
      userId,
      masteryLevel: { gte: 0.8 },
      ...(subjectArea && { concept: { subjectArea } }),
    },
    include: { concept: true },
  });

  // Find other users who need help with these concepts
  const matches: PeerTeachingMatch[] = [];

  for (const masteredConcept of userMasteredConcepts) {
    const mentees = await prisma.userConceptMastery.findMany({
      where: {
        conceptId: masteredConcept.conceptId,
        userId: { not: userId },
        masteryLevel: { lte: 0.5 },
      },
      include: { user: true, concept: true },
      take: 3, // Limit to top 3 mentees per concept
    });

    for (const mentee of mentees) {
      const confidenceScore = calculateTeachingConfidence(
        masteredConcept.masteryLevel,
        mentee.masteryLevel
      );

      matches.push({
        mentorId: userId,
        menteeId: mentee.userId,
        conceptId: masteredConcept.conceptId,
        masteryLevel: masteredConcept.masteryLevel,
        confidenceScore,
        status: 'PENDING',
      });
    }
  }

  return matches.sort((a, b) => b.confidenceScore - a.confidenceScore);
}

/**
 * Calculate confidence score for peer teaching match.
 */
function calculateTeachingConfidence(
  mentorMastery: number,
  menteeMastery: number
): number {
  const masteryGap = mentorMastery - menteeMastery;
  const mentorStrength = mentorMastery;
  const menteeNeed = 1 - menteeMastery;
  
  // Higher confidence for larger gaps and stronger mentors
  return (masteryGap * 0.6) + (mentorStrength * 0.4);
}

/**
 * Add an insight to a collaborative session.
 */
export async function addSessionInsight(
  sessionId: string,
  userId: string,
  insight: string,
  category: 'concept' | 'strategy' | 'resource' | 'question'
): Promise<void> {
  const newInsight = {
    userId,
    insight,
    category,
    timestamp: new Date(),
  };

  await prisma.collaborativeSession.update({
    where: { id: sessionId },
    data: {
      sharedInsights: {
        push: newInsight,
      },
    },
  });
}

/**
 * Generate collaborative learning summary using AI.
 */
export async function generateCollaborativeSummary(
  sessionId: string
): Promise<string> {
  const session = await prisma.collaborativeSession.findUnique({
    where: { id: sessionId },
  });

  if (!session || !session.sharedInsights) {
    return 'No insights available for summary.';
  }

  const insights = session.sharedInsights as any[];
  const config = loadConfig();
  const modelId = config.models.default;

  const { text } = await generateText({
    model: getModel(modelId),
    prompt: `Generate a collaborative learning summary from these student insights:

Topic: ${session.topic}
Number of Participants: ${Array.isArray(session.participantIds) ? session.participantIds.length : 0}

Student Insights:
${insights.map((insight, index) => 
  `${index + 1}. [${insight.category}] ${insight.insight} (Student: ${insight.userId})`
).join('\n')}

Create a concise summary that:
1. Identifies key learning themes
2. Highlights breakthrough moments
3. Notes areas needing further exploration
4. Suggests next steps for the group

Keep it encouraging and actionable for students.`,
  });

  return text;
}

/**
 * Get collaborative learning analytics for a user.
 */
export async function getCollaborativeAnalytics(
  userId: string
): Promise<{
    sessionsParticipated: number;
    sessionsHosted: number;
    insightsShared: number;
    conceptsTaught: number;
    collaborationScore: number;
}> {
  const [participated, hosted, insights, taught] = await Promise.all([
    prisma.collaborativeSession.count({
      where: {
        participantIds: {
          path: '$',
          string_contains: userId
        }
      },
    }),
    prisma.collaborativeSession.count({
      where: { hostUserId: userId },
    }),
    prisma.collaborativeSession.findMany({
      where: { 
        participantIds: {
          path: '$',
          string_contains: userId
        },
        sharedInsights: { 
          not: null 
        } 
      },
    }),
    prisma.userConceptMastery.count({
      where: { 
        userId,
        masteryLevel: { gte: 0.8 }
      },
    }),
  ]);

  const insightsShared = insights.reduce((total, session) => {
    const sessionInsights = session.sharedInsights as any[];
    return total + sessionInsights.filter(
      insight => insight.userId === userId
    ).length;
  }, 0);

  // Calculate collaboration score (0-100)
  const collaborationScore = Math.min(100, 
    (participated * 10) + 
    (hosted * 15) + 
    (insightsShared * 5) + 
    (taught * 3)
  );

  return {
    sessionsParticipated: participated,
    sessionsHosted: hosted,
    insightsShared,
    conceptsTaught: taught,
    collaborationScore,
  };
}

/**
 * Match students for co-discovery sessions based on complementary strengths.
 */
export async function findCoDiscoveryMatches(
  userId: string,
  topic: string
): Promise<string[]> {
  // Get user's concept mastery levels for the topic
  const userConcepts = await prisma.userConceptMastery.findMany({
    where: {
      userId,
      concept: { subjectArea: topic },
    },
    include: { concept: true },
  });

  // Find other users with complementary mastery patterns
  const otherUsers = await prisma.user.findMany({
    where: {
      id: { not: userId },
      role: 'STUDENT',
    },
    take: 20,
  });

  const matches: Array<{ userId: string; compatibilityScore: number }> = [];

  for (const otherUser of otherUsers) {
    const otherConcepts = await prisma.userConceptMastery.findMany({
      where: {
        userId: otherUser.id,
        concept: { subjectArea: topic },
      },
      include: { concept: true },
    });

    const compatibilityScore = calculateCompatibility(
      userConcepts,
      otherConcepts
    );

    if (compatibilityScore > 0.3) {
      matches.push({
        userId: otherUser.id,
        compatibilityScore,
      });
    }
  }

  return matches
    .sort((a, b) => b.compatibilityScore - a.compatibilityScore)
    .slice(0, 5)
    .map(match => match.userId);
}

/**
 * Calculate compatibility score between two students based on complementary mastery.
 */
function calculateCompatibility(
  user1Concepts: any[],
  user2Concepts: any[]
): number {
  let complementaryScore = 0;
  let overlapScore = 0;

  user1Concepts.forEach(concept1 => {
    const concept2 = user2Concepts.find(c => c.conceptId === concept1.conceptId);
    
    if (concept2) {
      const masteryDiff = Math.abs(concept1.masteryLevel - concept2.masteryLevel);
      
      // Complementary if one is strong and other is weak
      if (masteryDiff > 0.3) {
        complementaryScore += masteryDiff;
      } else {
        // Some overlap is good for collaboration
        overlapScore += (1 - masteryDiff);
      }
    }
  });

  // Normalize and combine scores
  const totalConcepts = Math.max(user1Concepts.length, user2Concepts.length);
  const normalizedComplementary = complementaryScore / totalConcepts;
  const normalizedOverlap = overlapScore / totalConcepts;

  return (normalizedComplementary * 0.7) + (normalizedOverlap * 0.3);
}
