import { generateText } from 'ai';
import { google } from '@ai-sdk/google';
import { anthropic } from '@ai-sdk/anthropic';
import { openai } from '@ai-sdk/openai';
import { loadConfig } from '../config';
import { AdelineGraphState, AdelineIntent } from './types';

const INTENT_LABELS: AdelineIntent[] = [
  'CHAT',
  'LIFE_LOG',
  'BRAINSTORM',
  'INVESTIGATE',
  'GEN_UI',
  'OPPORTUNITY',
];

function pickModelProvider(modelId: string) {
  if (modelId.toLowerCase().includes('claude')) return anthropic(modelId);
  if (modelId.toLowerCase().includes('gpt')) return openai(modelId);
  return google(modelId);
}

async function llmClassifyIntent(prompt: string, modelId: string): Promise<AdelineIntent | null> {
  try {
    const { text } = await generateText({
      model: pickModelProvider(modelId),
      prompt: `Classify the user's request into one intent label exactly: ${INTENT_LABELS.join(
        ', ',
      )}.
Return only the label.
User message: ${prompt}`,
    });
    const normalized = text.trim().toUpperCase();
    if (INTENT_LABELS.includes(normalized as AdelineIntent)) {
      return normalized as AdelineIntent;
    }
  } catch (err) {
    console.warn('Router classification fallback to heuristic', err);
  }
  return null;
}

function heuristicIntent(prompt: string): AdelineIntent {
  const lower = prompt.toLowerCase();
  if (
    ['i built', 'i made', 'i helped', 'i cooked', 'i baked', 'i read', 'i wrote', 'i finished', 'i completed', 'i sewed', 'i planted', 'i gardened', 'i volunteered', 'i served'].some(
      (phrase) => lower.includes(phrase),
    )
  ) {
    return 'LIFE_LOG';
  }
  if (lower.includes('brainstorm') || lower.includes('idea')) {
    return 'BRAINSTORM';
  }
  if (
    ['who profits', 'follow the money', 'investigate', 'regulatory capture', 'what really happened'].some(
      (kw) => lower.includes(kw),
    )
  ) {
    return 'INVESTIGATE';
  }
  if (lower.includes('opportunit')) {
    return 'OPPORTUNITY';
  }
  return 'CHAT';
}

function selectModel(intent: AdelineIntent, prompt: string, config: ReturnType<typeof loadConfig>): string {
  const rules = config.models.routing_rules as Record<string, unknown>;
  const lower = prompt.toLowerCase();

  const deepKeywords = (rules.deep_analysis_keywords as string[]) || [];
  const investigationKeywords = (rules.investigation_keywords as string[]) || [];

  if (intent === 'INVESTIGATE' || investigationKeywords.some((kw) => lower.includes(kw.toLowerCase()))) {
    return (rules.investigation_model as string) || config.models.investigation;
  }

  if (intent === 'OPPORTUNITY') {
    return (rules.general_chat as string) || config.models.default;
  }

  if (deepKeywords.some((kw) => lower.includes(kw.toLowerCase()))) {
    return (rules.deep_analysis_model as string) || config.models.deep_analysis;
  }

  return (rules.general_chat as string) || config.models.default;
}

export async function router(state: AdelineGraphState): Promise<AdelineGraphState> {
  const config = loadConfig();
  const baseModel = config.models.default;

  const classified = (await llmClassifyIntent(state.prompt, baseModel)) ?? heuristicIntent(state.prompt);
  const model = selectModel(classified, state.prompt, config);

  return {
    ...state,
    intent: classified,
    selectedModel: model,
  };
}
