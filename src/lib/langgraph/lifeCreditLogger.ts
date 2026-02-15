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

CREDIT SCALE: 1 credit = 1 full year of study (~180 hours). Use this scale:
- Quick activity (under 1 hour): 0.005 credits
- Short project (1-3 hours): 0.01-0.02 credits  
- Half-day project (4-6 hours): 0.03-0.05 credits
- Full day project: 0.05-0.08 credits
- Multi-day project: 0.1+ credits

Return ONLY strict JSON with this shape (no prose):
{
  "matchedRuleKey": "baking",
  "activityDescription": "Baked bread for elderly neighbor",
  "mappedSubjects": ["Chemistry: Fermentation", "Math: Ratios"],
  "suggestedCredits": 0.01,
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
    const parsed = JSON.parse(cleanText);
    if (!parsed || !parsed.matchedRuleKey) return null;
    return parsed;
  } catch (err) {
    console.warn('lifeCreditLogger JSON parse failed', err);
    return null;
  }
}

export async function lifeCreditLogger(state: AdelineGraphState): Promise<AdelineGraphState> {
  const config = loadConfig();
  const rules = config.life_to_credit_rules;
  const modelId = config.models.default;

  const llmResult = await llmMatchLifeRule(state.prompt, rules, modelId);

  if (!llmResult) {
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
    creditsEarned: Number(llmResult.suggestedCredits ?? 0.5) || 0.5,
    notes: llmResult.extensionSuggestion || `Auto-mapped from life activity: ${state.prompt}`,
  };

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
}
