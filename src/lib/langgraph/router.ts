import { generateText } from 'ai';
import { loadConfig } from '../config';
import { AdelineGraphState, AdelineIntent } from './types';
import { getModel } from '../ai-models';

const INTENT_LABELS: AdelineIntent[] = [
  'CHAT',
  'LIFE_LOG',
  'BRAINSTORM',
  'INVESTIGATE',
  'GEN_UI',
  'OPPORTUNITY',
  'REFLECT',
];

async function llmClassifyIntent(prompt: string, modelId: string): Promise<AdelineIntent | null> {
  try {
    const { text } = await generateText({
      model: getModel(modelId),
      prompt: `Classify the user's message into exactly ONE intent label.

Intent definitions:
- LIFE_LOG: User describes an activity they DID (past tense) like "I baked", "I built", "I helped", "I made", "I read", "I volunteered", "I finished". These are life activities to log for transcript credit.
- BRAINSTORM: User wants to plan, design, or brainstorm a project or idea. Keywords: "I want to build", "idea", "brainstorm", "plan", "design".
- INVESTIGATE: User asks investigative questions about institutions, corporations, funding, or systemic issues. Keywords: "who profits", "who funds", "investigate", "follow the money".
- OPPORTUNITY: User asks about opportunities, scholarships, competitions, or resources.
- REFLECT: User is reflecting on their learning process, thinking about how they learned, or responding to a reflection question. Keywords: "I learned", "I realized", "I noticed", "what I found hard", "next time I would".
- CHAT: General conversation, greetings, or questions that don't fit above categories.
- GEN_UI: Requests for specific UI components (rare).

User message: "${prompt}"

Return ONLY the single intent label (LIFE_LOG, BRAINSTORM, INVESTIGATE, OPPORTUNITY, REFLECT, CHAT, or GEN_UI):`,
    });
    const normalized = text.trim().toUpperCase().replace(/[^A-Z_]/g, '');
    console.log('[Router] LLM classified as:', normalized);
    if (INTENT_LABELS.includes(normalized as AdelineIntent)) {
      return normalized as AdelineIntent;
    }
  } catch (err) {
    console.warn('Router classification fallback to heuristic', err);
    return heuristicIntent(prompt);
  }
  return null;
}

function heuristicIntent(prompt: string): AdelineIntent {
  const lower = prompt.toLowerCase();
  console.log('[Router] Heuristic checking prompt:', JSON.stringify(lower));
  
  const lifeLogPhrases = ['i built', 'i made', 'i helped', 'i cooked', 'i baked', 'i read', 'i wrote', 'i finished', 'i completed', 'i sewed', 'i planted', 'i gardened', 'i volunteered', 'i served'];
  const matchedPhrase = lifeLogPhrases.find((phrase) => lower.includes(phrase));
  if (matchedPhrase) {
    console.log('[Router] Matched LIFE_LOG phrase:', matchedPhrase);
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
  const reflectPhrases = ['i learned', 'i realized', 'i noticed', 'what i found hard', 'next time i would', 'i struggled with', 'it made me think'];
  if (reflectPhrases.some((phrase) => lower.includes(phrase))) {
    return 'REFLECT';
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

  // If an image is attached, override to IMAGE_LOG
  if (state.metadata?.imageUrl) {
    console.log('[Router] Image detected, overriding to IMAGE_LOG');
    const model = selectModel('LIFE_LOG', state.prompt, config);
    return { ...state, intent: 'IMAGE_LOG', selectedModel: model };
  }

  // Try heuristic first - it's fast and reliable for clear patterns
  const heuristic = heuristicIntent(state.prompt);
  console.log('[Router] Heuristic intent:', heuristic);
  
  let classified: AdelineIntent;
  if (heuristic !== 'CHAT') {
    // Heuristic found a specific intent, use it
    classified = heuristic;
  } else {
    // Heuristic returned CHAT, try LLM for more nuanced classification
    const llmResult = await llmClassifyIntent(state.prompt, baseModel);
    classified = llmResult ?? heuristic;
  }
  
  console.log('[Router] Final intent:', classified);
  const model = selectModel(classified, state.prompt, config);

  return {
    ...state,
    intent: classified,
    selectedModel: model,
  };
}
