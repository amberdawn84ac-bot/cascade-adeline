import prisma from './db';

const HISTORY_LIMIT = 50;
const MIN_HISTORY_FOR_BASELINE = 10;

// --- Data Recording ---

export async function recordInteraction(data: {
  userId: string;
  sessionId: string;
  messageId: string;
  responseTimeMs: number;
  editDistance: number;
  sentimentScore: number;
}) {
  if (!data.userId) return;
  // TODO: Create userInteractionStats model in Prisma schema
  // await prisma.userInteractionStats.create({
  //   data: {
  //     userId: data.userId,
  //     sessionId: data.sessionId,
  //     messageId: data.messageId,
  //     responseTimeMs: data.responseTimeMs,
  //     editDistance: data.editDistance,
  //     sentimentScore: data.sentimentScore,
  //   },
  // });
}

// --- Cognitive Load Calculation ---

interface Baseline {
  avgResponseTime: number;
  stdDevResponseTime: number;
  avgEditDistance: number;
  stdDevEditDistance: number;
}

async function getUserBaseline(userId: string): Promise<Baseline | null> {
  // TODO: Create userInteractionStats model in Prisma schema
  return null;
  /*
  const recentInteractions = await prisma.userInteractionStats.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: HISTORY_LIMIT,
  });

  if (recentInteractions.length < MIN_HISTORY_FOR_BASELINE) {
    return null;
  }

  const responseTimes = recentInteractions.map((i: any) => i.responseTimeMs);
  const editDistances = recentInteractions.map((i: any) => i.editDistance);

  const calculateMean = (arr: number[]) => arr.reduce((a, b) => a + b, 0) / arr.length;
  const calculateStdDev = (arr: number[], mean: number) => {
    const variance = arr.reduce((sq, n) => sq + Math.pow(n - mean, 2), 0) / arr.length;
    return Math.sqrt(variance);
  };

  const avgResponseTime = calculateMean(responseTimes);
  const stdDevResponseTime = calculateStdDev(responseTimes, avgResponseTime);
  const avgEditDistance = calculateMean(editDistances);
  const stdDevEditDistance = calculateStdDev(editDistances, avgEditDistance);

  return {
    avgResponseTime,
    stdDevResponseTime,
    avgEditDistance,
    stdDevEditDistance,
  };
  */
}

function calculateZScore(value: number, mean: number, stdDev: number): number {
  if (stdDev === 0) return 0;
  return (value - mean) / stdDev;
}

export async function calculateCognitiveLoad(data: {
  userId: string;
  responseTimeMs: number;
  editDistance: number;
  sentimentScore: number;
}): Promise<{ score: number; level: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' }> {
  const baseline = await getUserBaseline(data.userId);

  // If no baseline, use sentiment as the primary signal
  if (!baseline) {
    const score = 1 - (data.sentimentScore + 1) / 2; // Normalize sentiment from [-1, 1] to [0, 1] for load
    const level = score > 0.8 ? 'CRITICAL' : score > 0.6 ? 'HIGH' : score > 0.3 ? 'MEDIUM' : 'LOW';
    return { score, level };
  }

  const timeZ = calculateZScore(data.responseTimeMs, baseline.avgResponseTime, baseline.stdDevResponseTime);
  const editZ = calculateZScore(data.editDistance, baseline.avgEditDistance, baseline.stdDevEditDistance);

  // Weights: response time deviation is a strong signal, edit distance is moderate,
  // and negative sentiment strongly increases perceived load.
  const timeWeight = 0.5;
  const editWeight = 0.3;
  const sentimentWeight = 0.8; // High weight for negative sentiment

  // Normalize Z-scores to a 0-1 range for easier combination.
  // We use the logistic function to map Z-scores (which can be infinite) to a bounded range.
  const sigmoid = (z: number) => 1 / (1 + Math.exp(-z));
  const normalizedTimeLoad = sigmoid(timeZ);
  const normalizedEditLoad = sigmoid(editZ);
  const normalizedSentimentLoad = 1 - (data.sentimentScore + 1) / 2;

  // Combine weighted scores.
  let combinedScore = 
    timeWeight * normalizedTimeLoad + 
    editWeight * normalizedEditLoad + 
    sentimentWeight * normalizedSentimentLoad;
  
  // Normalize the combined score to be within a 0-1 range.
  const totalWeight = timeWeight + editWeight + sentimentWeight;
  const score = Math.max(0, Math.min(1, combinedScore / totalWeight));

  const level = score > 0.8 ? 'CRITICAL' : score > 0.6 ? 'HIGH' : score > 0.3 ? 'MEDIUM' : 'LOW';

  return { score, level };
}
