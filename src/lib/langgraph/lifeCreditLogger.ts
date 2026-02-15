import { generateText } from 'ai';
import { google } from '@ai-sdk/google';
import { anthropic } from '@ai-sdk/anthropic';
import { openai } from '@ai-sdk/openai';
import { loadConfig } from '../config';
import { AdelineGraphState, LifeCreditMapping, TranscriptDraft } from './types';

function pickModelProvider(modelId: string) {
  if (modelId.toLowerCase().includes('claude')) return anthropic(modelId);
  if (modelId.toLowerCase().includes('gpt')) return openai(modelId);
  return google(modelId);
}

async function llmMatchLifeRule(prompt: string, rules: Record<string, string>, modelId: string) {
  const { text } = await generateText({
    model: pickModelProvider(modelId),
    temperature: 0,
    maxOutputTokens: 300,
    prompt: `You map real-world student activities to transcript credit mappings.
Here are the available rules as JSON key/value pairs (key = life activity, value = subjects/skills):
${JSON.stringify(rules, null, 2)}

Student description: """${prompt}"""

Return ONLY strict JSON with this shape (no prose):
{
  "matchedRuleKey": "baking",
  "activityDescription": "Baked bread for elderly neighbor",
  "mappedSubjects": ["Chemistry: Fermentation", "Math: Ratios"],
  "suggestedCredits": 0.5,
  "extensionSuggestion": "Test a variable next time — try different flour types and compare results"
}
If you cannot confidently map, return {"matchedRuleKey": null}.
`,
  });

  try {
    const parsed = JSON.parse(text);
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

  return {
    ...state,
    lifeCredit: mapping,
    transcriptDraft,
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
