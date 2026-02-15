import prisma from './db';

/**
 * SM-2 Spaced Repetition Algorithm
 *
 * Based on the SuperMemo SM-2 algorithm by Piotr Wozniak.
 * Adapted for concept mastery in an educational context.
 *
 * Quality scale (0-5):
 *   0 — Complete blackout, no recall
 *   1 — Incorrect, but upon seeing the answer, remembered
 *   2 — Incorrect, but the answer seemed easy to recall
 *   3 — Correct with serious difficulty
 *   4 — Correct after hesitation
 *   5 — Perfect, instant recall
 *
 * Quality >= 3 is considered a "pass" (successful recall).
 */

// --- Types ---

export interface SM2Result {
  interval: number;      // new interval in days
  easeFactor: number;    // updated ease factor
  repetitions: number;   // updated repetition count
}

export interface DueReview {
  reviewId: string;
  conceptId: string;
  conceptName: string;
  conceptDescription: string;
  subjectArea: string;
  nextReviewAt: Date;
  interval: number;
  repetitions: number;
  overdueDays: number;
}

// --- Core SM-2 Algorithm ---

/**
 * Calculate the next review schedule using the SM-2 algorithm.
 */
export function sm2(
  quality: number,
  previousInterval: number,
  previousEaseFactor: number,
  previousRepetitions: number
): SM2Result {
  // Clamp quality to 0-5
  const q = Math.max(0, Math.min(5, Math.round(quality)));

  let interval: number;
  let easeFactor: number;
  let repetitions: number;

  if (q >= 3) {
    // Successful recall
    repetitions = previousRepetitions + 1;

    if (repetitions === 1) {
      interval = 1;
    } else if (repetitions === 2) {
      interval = 6;
    } else {
      interval = Math.round(previousInterval * previousEaseFactor);
    }

    // Update ease factor: EF' = EF + (0.1 - (5-q) * (0.08 + (5-q) * 0.02))
    easeFactor = previousEaseFactor + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02));
  } else {
    // Failed recall — reset
    repetitions = 0;
    interval = 1;
    easeFactor = previousEaseFactor;
  }

  // Ease factor floor of 1.3
  easeFactor = Math.max(1.3, easeFactor);

  return { interval, easeFactor, repetitions };
}

/**
 * Convert a quality score (0-5) to a mastery delta for the ZPD engine.
 * Maps SM-2 quality to a mastery change:
 *   5 → +0.15, 4 → +0.10, 3 → +0.05, 2 → -0.02, 1 → -0.05, 0 → -0.08
 */
export function qualityToMasteryDelta(quality: number): number {
  const map: Record<number, number> = {
    5: 0.15,
    4: 0.10,
    3: 0.05,
    2: -0.02,
    1: -0.05,
    0: -0.08,
  };
  return map[Math.max(0, Math.min(5, Math.round(quality)))] ?? 0;
}

// --- Database Operations ---

/**
 * Get all reviews due for a user (nextReviewAt <= now).
 */
export async function getDueReviews(
  userId: string,
  options?: { limit?: number; subjectArea?: string }
): Promise<DueReview[]> {
  const now = new Date();

  const reviews = await prisma.reviewSchedule.findMany({
    where: {
      userId,
      nextReviewAt: { lte: now },
      ...(options?.subjectArea
        ? { concept: { subjectArea: options.subjectArea } }
        : {}),
    },
    include: {
      concept: {
        select: {
          id: true,
          name: true,
          description: true,
          subjectArea: true,
        },
      },
    },
    orderBy: { nextReviewAt: 'asc' },
    take: options?.limit ?? 10,
  });

  return reviews.map((r) => ({
    reviewId: r.id,
    conceptId: r.conceptId,
    conceptName: r.concept.name,
    conceptDescription: r.concept.description,
    subjectArea: r.concept.subjectArea,
    nextReviewAt: r.nextReviewAt,
    interval: r.interval,
    repetitions: r.repetitions,
    overdueDays: Math.max(0, (now.getTime() - r.nextReviewAt.getTime()) / (1000 * 60 * 60 * 24)),
  }));
}

/**
 * Record a review result: update the schedule using SM-2 and adjust mastery.
 */
export async function recordReview(
  userId: string,
  conceptId: string,
  quality: number
): Promise<{ nextReviewAt: Date; interval: number; masteryDelta: number }> {
  const existing = await prisma.reviewSchedule.findUnique({
    where: { userId_conceptId: { userId, conceptId } },
  });

  const prevInterval = existing?.interval ?? 1;
  const prevEase = existing?.easeFactor ?? 2.5;
  const prevReps = existing?.repetitions ?? 0;

  const result = sm2(quality, prevInterval, prevEase, prevReps);
  const nextReviewAt = new Date(Date.now() + result.interval * 24 * 60 * 60 * 1000);

  await prisma.reviewSchedule.upsert({
    where: { userId_conceptId: { userId, conceptId } },
    create: {
      userId,
      conceptId,
      nextReviewAt,
      interval: result.interval,
      easeFactor: result.easeFactor,
      repetitions: result.repetitions,
      lastQuality: quality,
      lastReviewedAt: new Date(),
    },
    update: {
      nextReviewAt,
      interval: result.interval,
      easeFactor: result.easeFactor,
      repetitions: result.repetitions,
      lastQuality: quality,
      lastReviewedAt: new Date(),
    },
  });

  // Also update mastery via the ZPD engine
  const masteryDelta = qualityToMasteryDelta(quality);
  const { updateMastery } = await import('./zpd-engine');
  await updateMastery(userId, conceptId, masteryDelta, {
    source: 'spaced_repetition',
    quality,
    newInterval: result.interval,
  });

  return { nextReviewAt, interval: result.interval, masteryDelta };
}

/**
 * Schedule a concept for review (called after a learning activity).
 * If a schedule already exists, this is a no-op (the existing schedule takes priority).
 */
export async function scheduleConceptReview(
  userId: string,
  conceptId: string
): Promise<void> {
  const existing = await prisma.reviewSchedule.findUnique({
    where: { userId_conceptId: { userId, conceptId } },
  });

  if (existing) return; // Already scheduled

  // First review in 1 day
  const nextReviewAt = new Date(Date.now() + 1 * 24 * 60 * 60 * 1000);

  await prisma.reviewSchedule.create({
    data: {
      userId,
      conceptId,
      nextReviewAt,
      interval: 1,
      easeFactor: 2.5,
      repetitions: 0,
    },
  });
}

/**
 * Get a formatted summary of due reviews for use in agent prompts.
 */
export async function getDueReviewsSummary(
  userId: string,
  limit = 5
): Promise<string> {
  const due = await getDueReviews(userId, { limit });

  if (due.length === 0) {
    return 'No concept reviews are currently due.';
  }

  const lines = due.map((r, i) => {
    const overdue = r.overdueDays > 0 ? ` (${r.overdueDays.toFixed(0)} days overdue)` : '';
    return `${i + 1}. **${r.conceptName}** (${r.subjectArea}) — Review #${r.repetitions + 1}${overdue}`;
  });

  return `Concepts due for review (${due.length}):\n${lines.join('\n')}`;
}
