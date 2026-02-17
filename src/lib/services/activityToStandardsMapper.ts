import { generateText } from 'ai';
import { getModel } from '../ai-models';
import { loadConfig } from '../config';
import { getOrCreateStandard, recordStandardProgress } from './standardsService';
import type { StandardSummary } from './standardsService';

/**
 * Activity-to-Standards Mapper
 *
 * Ported from old dear-adeline, adapted for AI SDK + Prisma.
 * Uses LLM to suggest state standards that align with a student's activity,
 * then auto-links them to the student's progress.
 */

export interface ActivityAnalysis {
  activity: string;
  skills: string[];
  subjects: string[];
}

interface StandardSuggestion {
  standardCode: string;
  subject: string;
  reasoning: string;
  confidence: 'high' | 'medium' | 'low';
  matched?: StandardSummary | null;
}

/**
 * Suggest state standards that align with an activity.
 */
export async function suggestStandards(
  activityDescription: string,
  analysis: ActivityAnalysis,
  jurisdiction: string = 'Oklahoma',
  gradeLevel: string = 'K-12'
): Promise<StandardSuggestion[]> {
  try {
    const config = loadConfig();
    const { text } = await generateText({
      model: getModel(config.models.default),
      maxOutputTokens: 500,
      temperature: 0,
      prompt: `You are an expert in state education standards alignment.
A student completed this activity: "${activityDescription}"
Skills demonstrated: ${analysis.skills.join(', ')}
Subjects: ${analysis.subjects.join(', ')}
Grade level: ${gradeLevel}
State: ${jurisdiction}

Suggest 2-4 specific state standards that this activity aligns with.
Use standard codes in this format:
- Mathematics: ${jurisdiction}.MATH.{grade}.{strand}.{standard}
- English Language Arts: ${jurisdiction}.ELA.{grade}.{strand}.{standard}
- Science: ${jurisdiction}.SCI.{grade}.{strand}.{standard}
- Social Studies: ${jurisdiction}.SS.{grade}.{strand}.{standard}

Return ONLY valid JSON (no markdown):
{"suggestions":[{"standard_code":"...","subject":"...","reasoning":"...","confidence":"high|medium|low"}]}`,
    });

    // Parse LLM response
    const cleaned = text.replace(/```json?\n?/g, '').replace(/```/g, '').trim();
    const parsed = JSON.parse(cleaned);
    const suggestions: StandardSuggestion[] = [];

    for (const s of parsed.suggestions || []) {
      const matched = await getOrCreateStandard(s.standard_code, jurisdiction, gradeLevel);
      suggestions.push({
        standardCode: s.standard_code,
        subject: s.subject,
        reasoning: s.reasoning,
        confidence: s.confidence || 'medium',
        matched,
      });
    }

    return suggestions;
  } catch (error) {
    console.error('[ActivityToStandardsMapper] suggestStandards failed:', error);
    return [];
  }
}

/**
 * Auto-link an activity to state standards based on AI suggestions.
 * Records progress for standards above the confidence threshold.
 */
export async function autoLinkActivityToStandards(
  userId: string,
  activityLogId: string,
  activityDescription: string,
  analysis: ActivityAnalysis,
  jurisdiction: string = 'Oklahoma',
  gradeLevel: string = 'K-12',
  confidenceThreshold: 'high' | 'medium' | 'low' = 'medium'
): Promise<StandardSummary[]> {
  const confidenceLevels = { high: 3, medium: 2, low: 1 };
  const threshold = confidenceLevels[confidenceThreshold];

  const suggestions = await suggestStandards(
    activityDescription,
    analysis,
    jurisdiction,
    gradeLevel
  );

  const recorded: StandardSummary[] = [];

  for (const s of suggestions) {
    if (confidenceLevels[s.confidence] >= threshold && s.matched) {
      await recordStandardProgress(userId, s.matched.id, 'activity_log', activityLogId);
      recorded.push(s.matched);
    }
  }

  if (recorded.length > 0) {
    console.log(
      `[ActivityToStandardsMapper] Linked ${recorded.length} standards for activity "${activityDescription}"`
    );
  }

  return recorded;
}
