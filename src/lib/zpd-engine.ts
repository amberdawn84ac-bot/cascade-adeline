import prisma from './db';

// --- Configuration ---
const MASTERY_THRESHOLD = 0.7;   // Concept considered "mastered" at this level
const PREREQ_READINESS = 0.7;    // Avg prerequisite mastery needed to enter ZPD
const DECAY_HALF_LIFE_DAYS = 30; // Mastery decays by half every 30 days without practice

// --- BKT Parameters ---
// Bayesian Knowledge Tracing: 4-parameter model
// P(L0) = prior probability of knowing the concept
// P(T)  = probability of learning on each opportunity
// P(S)  = probability of slipping (knows but answers wrong)
// P(G)  = probability of guessing (doesn't know but answers right)
export interface BKTParams {
  pL: number;  // P(L) — current probability of mastery
  pT: number;  // P(T) — learn rate
  pS: number;  // P(S) — slip rate
  pG: number;  // P(G) — guess rate
}

const DEFAULT_BKT: BKTParams = {
  pL: 0.1,   // low prior — assume student doesn't know yet
  pT: 0.15,  // moderate learning rate per opportunity
  pS: 0.05,  // low slip rate
  pG: 0.25,  // moderate guess rate
};

/**
 * Update BKT probability after an observation.
 * @param params Current BKT parameters
 * @param correct Whether the student answered/performed correctly
 * @returns Updated P(L) — posterior probability of mastery
 */
export function bktUpdate(params: BKTParams, correct: boolean): number {
  const { pL, pT, pS, pG } = params;

  // P(correct | L) and P(correct | ¬L)
  const pCorrectGivenL = 1 - pS;
  const pCorrectGivenNotL = pG;

  // Posterior P(L | observation) via Bayes
  let posteriorL: number;
  if (correct) {
    const pCorrect = pL * pCorrectGivenL + (1 - pL) * pCorrectGivenNotL;
    posteriorL = (pL * pCorrectGivenL) / pCorrect;
  } else {
    const pIncorrect = pL * pS + (1 - pL) * (1 - pG);
    posteriorL = (pL * pS) / pIncorrect;
  }

  // Apply learning transition: P(L_new) = P(L|obs) + (1 - P(L|obs)) * P(T)
  return posteriorL + (1 - posteriorL) * pT;
}

/**
 * Get BKT params from mastery history, or return defaults.
 */
function getBKTFromHistory(history: unknown): BKTParams {
  if (history && typeof history === 'object' && !Array.isArray(history)) {
    const h = history as Record<string, unknown>;
    if (h.bkt && typeof h.bkt === 'object') {
      const bkt = h.bkt as Record<string, number>;
      return {
        pL: bkt.pL ?? DEFAULT_BKT.pL,
        pT: bkt.pT ?? DEFAULT_BKT.pT,
        pS: bkt.pS ?? DEFAULT_BKT.pS,
        pG: bkt.pG ?? DEFAULT_BKT.pG,
      };
    }
  }
  // If history is an array (legacy format), extract pL from last entry
  if (Array.isArray(history) && history.length > 0) {
    const last = history[history.length - 1];
    return { ...DEFAULT_BKT, pL: last?.newLevel ?? DEFAULT_BKT.pL };
  }
  return { ...DEFAULT_BKT };
}

// --- Types ---
export interface ZPDConcept {
  conceptId: string;
  name: string;
  description: string;
  subjectArea: string;
  gradeBand: string | null;
  currentMastery: number;       // User's current mastery (0-1), decay-adjusted
  prerequisiteReadiness: number; // Average mastery of prerequisites (0-1)
  priority: number;             // Higher = more recommended (0-1)
}

export interface MasterySnapshot {
  conceptId: string;
  name: string;
  masteryLevel: number;
  decayAdjusted: number;
  bktProbability: number;  // BKT P(L) — probability student has mastered this
  lastPracticed: Date | null;
  status: 'mastered' | 'in_zpd' | 'not_ready' | 'unknown';
}

// --- Helpers ---

/**
 * Apply time-based decay to mastery using exponential decay.
 * Models the forgetting curve: mastery degrades without practice.
 */
function applyDecay(masteryLevel: number, lastPracticed: Date): number {
  const daysSince = (Date.now() - lastPracticed.getTime()) / (1000 * 60 * 60 * 24);
  if (daysSince <= 0) return masteryLevel;
  const decayFactor = Math.pow(0.5, daysSince / DECAY_HALF_LIFE_DAYS);
  return masteryLevel * decayFactor;
}

/**
 * Compute ZPD priority score for a concept.
 * Factors: prerequisite readiness (weight 0.6), inverse of current mastery (0.3),
 * and a small boost for concepts with more dependents (0.1).
 */
function computePriority(
  prereqReadiness: number,
  currentMastery: number,
  dependentCount: number,
  maxDependents: number
): number {
  const readinessScore = prereqReadiness;
  const gapScore = 1 - currentMastery;
  const leverageScore = maxDependents > 0 ? dependentCount / maxDependents : 0;
  return 0.6 * readinessScore + 0.3 * gapScore + 0.1 * leverageScore;
}

// --- Core API ---

/**
 * Get all concepts with the user's mastery data, applying time decay.
 */
export async function getUserMasteryMap(userId: string): Promise<Map<string, MasterySnapshot>> {
  const concepts = await prisma.concept.findMany({
    include: {
      userMastery: { where: { userId } },
      dependents: true, // concepts that depend on this one
    },
  });

  const map = new Map<string, MasterySnapshot>();

  for (const concept of concepts) {
    const record = concept.userMastery[0];
    let rawMastery = record?.masteryLevel ?? 0;
    let lastPracticed = record?.lastPracticed ?? null;
    let decayAdjusted = lastPracticed ? applyDecay(rawMastery, lastPracticed) : rawMastery;

    const bktParams = getBKTFromHistory(record?.history);

    map.set(concept.id, {
      conceptId: concept.id,
      name: concept.name,
      masteryLevel: rawMastery,
      decayAdjusted,
      bktProbability: bktParams.pL,
      lastPracticed,
      status: 'unknown', // will be set by ZPD computation
    });
  }

  return map;
}

/**
 * Identify concepts within the user's Zone of Proximal Development.
 *
 * A concept is in the ZPD when:
 * 1. The user has NOT yet mastered it (decayAdjusted < MASTERY_THRESHOLD)
 * 2. The user HAS mastered most of its prerequisites (avg >= PREREQ_READINESS)
 *
 * Concepts with no prerequisites are always "ready" (prereqReadiness = 1.0)
 * if not yet mastered.
 *
 * Returns concepts sorted by priority (highest first).
 */
export async function getZPDConcepts(
  userId: string,
  options?: { subjectArea?: string; gradeBand?: string; limit?: number }
): Promise<ZPDConcept[]> {
  // Fetch all concepts with prerequisites and dependents
  const concepts = await prisma.concept.findMany({
    where: {
      ...(options?.subjectArea ? { subjectArea: options.subjectArea } : {}),
      ...(options?.gradeBand ? { gradeBand: options.gradeBand } : {}),
    },
    include: {
      prerequisites: {
        include: { prerequisite: true },
      },
      dependents: true,
      userMastery: { where: { userId } },
    },
  });

  // Build mastery lookup
  const masteryMap = await getUserMasteryMap(userId);

  // Find max dependents for leverage scoring
  const maxDependents = Math.max(...concepts.map(c => c.dependents.length), 1);

  const zpdConcepts: ZPDConcept[] = [];

  for (const concept of concepts) {
    const snapshot = masteryMap.get(concept.id);
    const currentMastery = snapshot?.decayAdjusted ?? 0;

    // Skip already-mastered concepts
    if (currentMastery >= MASTERY_THRESHOLD) {
      if (snapshot) snapshot.status = 'mastered';
      continue;
    }

    // Compute prerequisite readiness
    let prereqReadiness: number;
    if (concept.prerequisites.length === 0) {
      // No prerequisites → always ready
      prereqReadiness = 1.0;
    } else {
      const prereqMasteries = concept.prerequisites.map(p => {
        const prereqSnapshot = masteryMap.get(p.prerequisiteId);
        return prereqSnapshot?.decayAdjusted ?? 0;
      });
      prereqReadiness = prereqMasteries.reduce((a, b) => a + b, 0) / prereqMasteries.length;
    }

    // Check if prerequisites are sufficiently mastered
    if (prereqReadiness < PREREQ_READINESS) {
      if (snapshot) snapshot.status = 'not_ready';
      continue;
    }

    // This concept is in the ZPD!
    if (snapshot) snapshot.status = 'in_zpd';

    const priority = computePriority(
      prereqReadiness,
      currentMastery,
      concept.dependents.length,
      maxDependents
    );

    zpdConcepts.push({
      conceptId: concept.id,
      name: concept.name,
      description: concept.description,
      subjectArea: concept.subjectArea,
      gradeBand: concept.gradeBand,
      currentMastery,
      prerequisiteReadiness: prereqReadiness,
      priority,
    });
  }

  // Sort by priority descending
  zpdConcepts.sort((a, b) => b.priority - a.priority);

  return options?.limit ? zpdConcepts.slice(0, options.limit) : zpdConcepts;
}

/**
 * Update a user's mastery level for a concept using BKT.
 * The `correct` flag drives BKT update; `delta` is kept for backward compat.
 * BKT params are persisted in the history JSON field.
 */
export async function updateMastery(
  userId: string,
  conceptId: string,
  delta: number,
  evidence?: Record<string, unknown> & { correct?: boolean }
): Promise<void> {
  const existing = await prisma.userConceptMastery.findUnique({
    where: { userId_conceptId: { userId, conceptId } },
  });

  const currentLevel = existing?.masteryLevel ?? 0;

  // Get current BKT params
  const bktParams = getBKTFromHistory(existing?.history);

  // Determine if this was a correct observation
  // If evidence.correct is explicitly set, use it; otherwise infer from delta sign
  const correct = evidence?.correct ?? (delta > 0);

  // Run BKT update
  const newPL = bktUpdate(bktParams, correct);

  // Blend BKT probability with delta-based update (BKT takes priority)
  const bktLevel = newPL;
  const deltaLevel = Math.max(0, Math.min(1, currentLevel + delta));
  // Use BKT as primary signal, delta as secondary (80/20 blend)
  const newLevel = Math.max(0, Math.min(1, 0.8 * bktLevel + 0.2 * deltaLevel));

  const historyEntry = {
    timestamp: new Date().toISOString(),
    previousLevel: currentLevel,
    newLevel,
    delta,
    correct,
    bkt: { pL: newPL, pT: bktParams.pT, pS: bktParams.pS, pG: bktParams.pG },
    ...(evidence ?? {}),
  };

  const existingHistory = Array.isArray(existing?.history) ? existing.history : [];

  await prisma.userConceptMastery.upsert({
    where: { userId_conceptId: { userId, conceptId } },
    create: {
      userId,
      conceptId,
      masteryLevel: newLevel,
      lastPracticed: new Date(),
      history: { entries: [historyEntry], bkt: { pL: newPL, pT: bktParams.pT, pS: bktParams.pS, pG: bktParams.pG } } as any,
    },
    update: {
      masteryLevel: newLevel,
      lastPracticed: new Date(),
      history: { entries: [...(existingHistory as any[]), historyEntry], bkt: { pL: newPL, pT: bktParams.pT, pS: bktParams.pS, pG: bktParams.pG } } as any,
    },
  });
}

/**
 * Get a formatted summary of ZPD concepts for use in agent prompts.
 */
export async function getZPDSummaryForPrompt(
  userId: string,
  options?: { subjectArea?: string; limit?: number }
): Promise<string> {
  const zpd = await getZPDConcepts(userId, { ...options, limit: options?.limit ?? 5 });

  if (zpd.length === 0) {
    return 'No concepts currently identified in the student\'s Zone of Proximal Development.';
  }

  // Fetch BKT probabilities for richer prompt context
  const masteryMap = await getUserMasteryMap(userId);

  const lines = zpd.map((c, i) => {
    const snapshot = masteryMap.get(c.conceptId);
    const bktProb = snapshot?.bktProbability ?? c.currentMastery;
    return `${i + 1}. **${c.name}** (${c.subjectArea}${c.gradeBand ? `, ${c.gradeBand}` : ''}) — ` +
      `BKT P(L)=${bktProb.toFixed(2)}, ` +
      `Mastery: ${(c.currentMastery * 100).toFixed(0)}%, ` +
      `Prereq Readiness: ${(c.prerequisiteReadiness * 100).toFixed(0)}%, ` +
      `Priority: ${(c.priority * 100).toFixed(0)}%`;
  });

  return `Student's Zone of Proximal Development (top ${zpd.length} concepts, BKT = Bayesian Knowledge Tracing probability of mastery):\n${lines.join('\n')}`;
}
