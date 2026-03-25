import prisma from '@/lib/db';

interface BKTUpdate {
  userId: string;
  conceptId: string;
  correct: boolean;
  timestamp: Date;
}

/**
 * Update Bayesian Knowledge Tracing model based on student performance
 * This is a simplified BKT implementation for lesson quiz responses
 */
export async function updateBKT({ userId, conceptId, correct, timestamp }: BKTUpdate) {
  try {
    // Get or create concept mastery record
    const existing = await prisma.userConceptMastery.findFirst({
      where: {
        userId,
        conceptId
      }
    });

    const currentMastery = existing?.masteryLevel || 0.3; // Initial guess
    
    // BKT parameters
    const pLearned = 0.1; // Probability of learning
    const pSlip = 0.1; // Probability of slip (knowing but getting wrong)
    const pGuess = 0.25; // Probability of guessing (not knowing but getting right)

    // Update mastery based on response
    let newMastery: number;
    
    if (correct) {
      // Student got it right
      newMastery = (currentMastery * (1 - pSlip)) / 
        (currentMastery * (1 - pSlip) + (1 - currentMastery) * pGuess);
    } else {
      // Student got it wrong
      newMastery = (currentMastery * pSlip) / 
        (currentMastery * pSlip + (1 - currentMastery) * (1 - pGuess));
    }

    // Add learning increment
    newMastery = newMastery + (1 - newMastery) * pLearned;
    
    // Clamp between 0 and 1
    newMastery = Math.max(0, Math.min(1, newMastery));

    // Save to database
    if (existing) {
      await prisma.userConceptMastery.update({
        where: { id: existing.id },
        data: {
          masteryLevel: newMastery,
          lastPracticed: timestamp,
          history: {
            ...(existing.history as any),
            attempts: [...((existing.history as any)?.attempts || []), { correct, timestamp }]
          }
        }
      });
    } else {
      await prisma.userConceptMastery.create({
        data: {
          userId,
          conceptId,
          masteryLevel: newMastery,
          lastPracticed: timestamp,
          history: {
            attempts: [{ correct, timestamp }]
          }
        }
      });
    }

    return { masteryLevel: newMastery };
  } catch (error) {
    console.error('[BKT Update] Error:', error);
    throw error;
  }
}

/**
 * Get current mastery level for a concept
 */
export async function getMasteryLevel(userId: string, conceptId: string): Promise<number> {
  const mastery = await prisma.userConceptMastery.findFirst({
    where: { userId, conceptId }
  });
  
  return mastery?.masteryLevel || 0.3; // Default to 30% if not tracked yet
}
