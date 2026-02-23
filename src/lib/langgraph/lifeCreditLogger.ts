import { generateText } from 'ai';
import { loadConfig } from '../config';
import { AdelineGraphState, LifeCreditMapping, TranscriptDraft } from './types';
import { getModel } from '../ai-models';
import { scheduleConceptReview } from '../spaced-repetition';
import prisma from '../db';

async function llmMatchLifeRule(prompt: string, rules: Record<string, string>, modelId: string) {
  const { text } = await generateText({
    model: getModel(modelId),
    temperature: 0,
    maxOutputTokens: 300,
    prompt: `You map real-world student activities to transcript credit mappings.
Here are the available rules as JSON key/value pairs (key = life activity, value = subjects/skills):
${JSON.stringify(rules, null, 2)}

Student description: """${prompt}"""

CRITICAL GRADING MATH: 1.0 full high school credit equals approximately 120 hours of dedicated coursework. Therefore, a single 1-hour to 2-hour activity (like baking bread, a museum visit, or a coding session) should only be awarded between 0.01 and 0.02 credits. NEVER award large amounts like 0.25 or 0.5 credits for a single daily task. Estimate the realistic time the activity took in hours, and multiply by 0.008 to get the correct fractional credit.

CREDIT SCALE GUIDE (based on 120 hours = 1.0 credit):
- Quick activity (under 1 hour): 0.005-0.008 credits
- Short activity (1-2 hours): 0.01-0.02 credits  
- Medium project (3-4 hours): 0.02-0.03 credits
- Half-day project (4-6 hours): 0.03-0.05 credits
- Full day project (7-8 hours): 0.05-0.07 credits
- Multi-day project: 0.1+ credits (only for significant multi-day efforts)

CALCULATION EXAMPLE: 2-hour baking session = 2 hours × 0.008 = 0.016 credits

Return ONLY strict JSON with this shape (no prose):
{
  "matchedRuleKey": "baking",
  "activityDescription": "Baked bread for elderly neighbor",
  "mappedSubjects": ["Chemistry: Fermentation", "Math: Ratios"],
  "suggestedCredits": 0.016,
  "extensionSuggestion": "Test a variable next time — try different flour types and compare results"
}
If you cannot confidently map, return {"matchedRuleKey": null}.
`,
  });

  try {
    // Strip markdown code blocks if present (LLM sometimes wraps JSON in ```json ... ```)
    let cleanText = text.trim();
    if (cleanText.startsWith('```')) {
      cleanText = cleanText.replace(/^```(?:json)?\s*/, '').replace(/\s*```$/, '');
    }
    
    console.log('[lifeCreditLogger] LLM response:', cleanText);
    const parsed = JSON.parse(cleanText);
    console.log('[lifeCreditLogger] Parsed result:', parsed);
    
    if (!parsed || !parsed.matchedRuleKey) {
      console.log('[lifeCreditLogger] No matched rule key found');
      return null;
    }
    return parsed;
  } catch (err) {
    console.warn('[lifeCreditLogger] JSON parse failed:', err);
    console.warn('[lifeCreditLogger] Raw text was:', text);
    return null;
  }
}

export async function lifeCreditLogger(state: AdelineGraphState): Promise<AdelineGraphState> {
  try {
    console.log('[lifeCreditLogger] Processing activity:', state.prompt);
    const config = loadConfig();
    const rules = config.life_to_credit_rules;
    const modelId = config.models.default;

    const llmResult = await llmMatchLifeRule(state.prompt, rules, modelId);
    console.log('[lifeCreditLogger] LLM result:', llmResult);

    if (!llmResult) {
      console.log('[lifeCreditLogger] No LLM result, returning unmatched state');
      return {
        ...state,
        metadata: {
          ...state.metadata,
          lifeCreditLogger: { matched: false },
        },
      };
    }

    const mapping: LifeCreditMapping = {
      activity: llmResult.activityDescription || state.prompt,
      matchedRuleKey: llmResult.matchedRuleKey,
      mappedSubjects: Array.isArray(llmResult.mappedSubjects)
        ? llmResult.mappedSubjects.join(', ')
        : String(llmResult.mappedSubjects ?? ''),
      confidence: 1,
    };

    const transcriptDraft: TranscriptDraft = {
      activityName: llmResult.activityDescription || state.prompt,
      mappedSubject: mapping.mappedSubjects,
      creditsEarned: Number(llmResult.suggestedCredits ?? 0.01) || 0.01,
      notes: llmResult.extensionSuggestion || `Auto-mapped from life activity: ${state.prompt}`,
    };

    console.log('[lifeCreditLogger] Created transcript draft:', transcriptDraft);

    // Auto-schedule related concepts for spaced repetition review
    const scheduledConcepts: string[] = [];
    if (state.userId && Array.isArray(llmResult.mappedSubjects)) {
      try {
        // Extract concept keywords from mapped subjects (e.g. "Chemistry: Fermentation" → "Fermentation")
        const keywords = llmResult.mappedSubjects.map((s: string) => {
          const parts = s.split(':');
          return (parts[parts.length - 1] || s).trim().toLowerCase();
        });

        // Find matching concepts in the knowledge graph
        const concepts = await prisma.concept.findMany({
          where: {
            OR: keywords.map((kw: string) => ({
              name: { contains: kw, mode: 'insensitive' as const },
            })),
          },
          select: { id: true, name: true },
        });

        for (const concept of concepts) {
          await scheduleConceptReview(state.userId, concept.id);
          scheduledConcepts.push(concept.name);
        }
      } catch (err) {
        console.warn('[lifeCreditLogger] Failed to schedule concept reviews:', err);
      }
    }

    // Build a user-friendly response
    const reviewNote = scheduledConcepts.length > 0
      ? `\n📚 **Scheduled for review:** ${scheduledConcepts.join(', ')}` : '';

    const responseContent = `Great work! I've logged your activity:

**Activity:** ${transcriptDraft.activityName}
**Subjects/Skills:** ${transcriptDraft.mappedSubject}
**Credits Earned:** ${transcriptDraft.creditsEarned}
${reviewNote}
${llmResult.extensionSuggestion ? `**Extension Idea:** ${llmResult.extensionSuggestion}` : ''}`;

    console.log('[lifeCreditLogger] Successfully processed activity');
    return {
      ...state,
      lifeCredit: mapping,
      transcriptDraft,
      responseContent,
      metadata: {
        ...state.metadata,
        lifeCreditLogger: {
          matched: true,
          mapping,
          transcriptDraft,
        },
      },
    };
  } catch (error) {
    console.error('[lifeCreditLogger] Unexpected error:', error);
    return {
      ...state,
      metadata: {
        ...state.metadata,
        lifeCreditLogger: { 
          matched: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        } as any,
      },
    };
  }
}
