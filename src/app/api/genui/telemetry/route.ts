import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import prisma from '@/lib/db';
import type { TelemetryEvent } from '@/hooks/useGenUITelemetry';

/**
 * POST /api/genui/telemetry
 * 
 * Fire-and-forget endpoint for GenUI component telemetry.
 * Updates student's mastery profile and knowledge graph for future personalization.
 * 
 * This does NOT trigger immediate UI remediation — that's handled by
 * tool calls via experimental_onToolCall in useChat.
 */
export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const events: TelemetryEvent[] = body.events;

    if (!Array.isArray(events) || events.length === 0) {
      return NextResponse.json({ error: 'No events provided' }, { status: 400 });
    }

    // Process events in parallel
    const results = await Promise.allSettled(
      events.map((event) => processEvent(user.userId, event))
    );

    const succeeded = results.filter((r) => r.status === 'fulfilled').length;
    const failed = results.filter((r) => r.status === 'rejected').length;

    if (failed > 0) {
      console.warn(`[GenUI Telemetry] ${failed}/${events.length} events failed to process`);
    }

    return NextResponse.json({ 
      success: true, 
      processed: succeeded,
      failed,
    });
  } catch (error) {
    console.error('[GenUI Telemetry] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

async function processEvent(userId: string, event: TelemetryEvent): Promise<void> {
  const { type, componentType, componentId, timestamp, ...data } = event;

  // 1. Always log to UserActivity for analytics
  await prisma.userActivity.create({
    data: {
      userId,
      activityType: `genui_${type}`,
      duration: Math.round((data.timeMs ?? 0) / 1000 / 60) || 1,
      metadata: {
        componentType,
        componentId,
        timestamp,
        ...data,
      },
    },
  });

  // 2. Update mastery based on event type
  switch (type) {
    case 'complete':
      await handleCompletion(userId, event);
      break;
    case 'stuck':
      await handleStuck(userId, event);
      break;
    case 'attempt':
      await handleAttempt(userId, event);
      break;
    case 'hint_requested':
      await handleHintRequested(userId, event);
      break;
  }
}

/**
 * Handle successful completion — boost mastery level
 */
async function handleCompletion(userId: string, event: TelemetryEvent): Promise<void> {
  const { componentType, score = 100, difficultyLevel = 'standard' } = event;

  // Map component type to a concept (simplified — in production, use actual concept IDs)
  const conceptMapping = await findConceptForComponent(componentType);
  if (!conceptMapping) return;

  const masteryBoost = calculateMasteryBoost(score, difficultyLevel);

  await prisma.userConceptMastery.upsert({
    where: {
      userId_conceptId: {
        userId,
        conceptId: conceptMapping.conceptId,
      },
    },
    create: {
      userId,
      conceptId: conceptMapping.conceptId,
      masteryLevel: Math.min(1.0, masteryBoost),
      lastPracticed: new Date(),
      history: { events: [{ type: 'complete', score, timestamp: event.timestamp }] },
    },
    update: {
      masteryLevel: {
        increment: masteryBoost,
      },
      lastPracticed: new Date(),
      history: {
        // Append to history array (Prisma JSON update)
        push: { type: 'complete', score, timestamp: event.timestamp },
      },
    },
  });
}

/**
 * Handle stuck event — record struggle for future scaffolding
 */
async function handleStuck(userId: string, event: TelemetryEvent): Promise<void> {
  const { componentType, componentId, failedAttempts = 0 } = event;

  // Try to find a concept matching the component, or skip if not found
  const conceptMapping = await findConceptForComponent(componentType);
  if (!conceptMapping) {
    console.warn('[GenUI Telemetry] No concept found for component:', componentType);
    return;
  }

  // Record as a learning gap for future remediation
  // Severity enum: MINOR, MODERATE, SIGNIFICANT
  await prisma.learningGap.create({
    data: {
      userId,
      conceptId: conceptMapping.conceptId,
      detectedAt: new Date(),
      severity: failedAttempts >= 5 ? 'SIGNIFICANT' : failedAttempts >= 3 ? 'MODERATE' : 'MINOR',
    },
  }).catch(() => {
    // Gap might already exist — that's fine
  });
}

/**
 * Handle individual attempt — track for spaced repetition
 */
async function handleAttempt(userId: string, event: TelemetryEvent): Promise<void> {
  const { componentType, correct, attemptNumber } = event;

  // If incorrect, slightly decrease mastery confidence
  if (!correct) {
    const conceptMapping = await findConceptForComponent(componentType);
    if (!conceptMapping) return;

    await prisma.userConceptMastery.updateMany({
      where: {
        userId,
        conceptId: conceptMapping.conceptId,
      },
      data: {
        masteryLevel: {
          decrement: 0.02, // Small penalty for incorrect attempts
        },
      },
    });
  }
}

/**
 * Handle hint request — indicates need for scaffolding
 */
async function handleHintRequested(userId: string, event: TelemetryEvent): Promise<void> {
  const { componentType, componentId } = event;

  // Update user metadata to prefer scaffolded components
  await prisma.user.update({
    where: { id: userId },
    data: {
      metadata: {
        // Merge with existing metadata
        preferScaffolded: true,
        lastHintRequest: {
          componentType,
          componentId,
          timestamp: event.timestamp,
        },
      },
    },
  }).catch(() => {});
}

/**
 * Map component type to a concept ID (simplified lookup)
 */
async function findConceptForComponent(
  componentType: string
): Promise<{ conceptId: string } | null> {
  // In production, this would query a mapping table or use semantic matching
  // For now, try to find a concept with a similar name
  const concept = await prisma.concept.findFirst({
    where: {
      OR: [
        { name: { contains: componentType, mode: 'insensitive' } },
        { tags: { has: componentType.toLowerCase() } },
      ],
    },
    select: { id: true },
  });

  return concept ? { conceptId: concept.id } : null;
}

/**
 * Calculate mastery boost based on score and difficulty
 */
function calculateMasteryBoost(
  score: number,
  difficultyLevel: 'intro' | 'standard' | 'challenge'
): number {
  const baseBoost = (score / 100) * 0.1; // Max 0.1 per completion
  
  const difficultyMultiplier = {
    intro: 0.5,
    standard: 1.0,
    challenge: 1.5,
  }[difficultyLevel];

  return baseBoost * difficultyMultiplier;
}
