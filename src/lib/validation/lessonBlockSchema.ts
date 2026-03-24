import { z } from 'zod';

export const LessonBlockSchema = z.object({
  type: z.enum([
    'text',
    'scripture',
    'prompt',
    'quiz',
    'flashcards',
    'game',
    'worksheet',
    'hands-on',
    'photo',
    'video',
    'animation',
    'infographic',
    'primary_source',
    'investigation',
    'source_gap'
  ]),
  content: z.union([z.string(), z.record(z.unknown())]),
  interactive: z.object({
    options: z.array(z.string()).optional(),
    answer: z.string().optional(),
    correctIndex: z.number().optional(),
    explanation: z.string().optional(),
    term: z.string().optional(),
    definition: z.string().optional(),
    example: z.string().optional(),
    category: z.string().optional(),
    sourceType: z.enum(['document', 'photo', 'audio', 'artifact', 'court_record', 'speech', 'newspaper']).optional(),
    narrativeRole: z.enum(['official_claim', 'eyewitness', 'counter_document', 'propagandist', 'victim_testimony', 'government_record', 'scripture', 'investigative_data', 'evidence']).optional(),
    citation: z.string().optional(),
    creator: z.string().optional(),
    date: z.string().optional(),
    collection: z.string().optional(),
    url: z.string().optional(),
    investigationPrompts: z.array(z.string()).optional(),
    investigationType: z.enum(['follow-the-money', 'compare-sources', 'timeline', 'network-map', 'propaganda-analysis', 'document-analysis']).optional(),
    guidingQuestions: z.array(z.string()).optional(),
    whoBenefits: z.string().optional(),
  }).optional(),
  metadata: z.object({
    skills: z.array(z.string()),
    ok_standard: z.string().optional(),
    zpd_level: z.string(),
    faith_tie: z.boolean().optional(),
    agent: z.string().optional(),
    hippocampusId: z.string().optional(),
    sourceSlug: z.string().optional(),
  }),
  next_handoff: z.string().optional(),
});

export type ValidatedLessonBlock = z.infer<typeof LessonBlockSchema>;

/**
 * Validates an array of lesson blocks
 * Returns validated blocks or throws with detailed error
 */
export function validateLessonBlocks(blocks: unknown[]): ValidatedLessonBlock[] {
  try {
    return blocks.map((block, index) => {
      try {
        return LessonBlockSchema.parse(block);
      } catch (error) {
        if (error instanceof z.ZodError) {
          console.error(`[LessonBlock] Validation failed for block ${index}:`, error.errors);
          throw new Error(`Block ${index} validation failed: ${error.errors[0].message}`);
        }
        throw error;
      }
    });
  } catch (error) {
    console.error('[LessonBlock] Validation error:', error);
    throw error;
  }
}

/**
 * Validates lesson blocks without throwing - returns result
 * Useful for filtering out invalid blocks
 */
export function safeValidateLessonBlocks(blocks: unknown[]): {
  valid: ValidatedLessonBlock[];
  invalid: Array<{ index: number; error: string }>;
} {
  const valid: ValidatedLessonBlock[] = [];
  const invalid: Array<{ index: number; error: string }> = [];

  blocks.forEach((block, index) => {
    try {
      const validated = LessonBlockSchema.parse(block);
      valid.push(validated);
    } catch (error) {
      if (error instanceof z.ZodError) {
        invalid.push({
          index,
          error: error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ')
        });
      } else {
        invalid.push({
          index,
          error: String(error)
        });
      }
    }
  });

  return { valid, invalid };
}
