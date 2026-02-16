import { generateText } from 'ai';
import { loadConfig } from '../config';
import { AdelineGraphState } from './types';
import { getModel } from '../ai-models';
import { getZPDSummaryForPrompt } from '../zpd-engine';

async function draftPlan(
  prompt: string,
  conversationHistory: Array<{ role: string; content: string }> | undefined,
  modelId: string,
  zpdContext: string
) {
  // Build context from recent conversation
  const recentContext = conversationHistory
    ?.slice(-6)
    .map((m) => `${m.role}: ${m.content}`)
    .join('\n') || '';

  const zpdSection = zpdContext
    ? `\n\nThe following concepts are in this student's Zone of Proximal Development (BKT = Bayesian Knowledge Tracing probability of mastery). Use BKT P(L) values to calibrate difficulty: P(L)<0.3 = introduce gently, P(L) 0.3-0.6 = scaffold with support, P(L)>0.6 = challenge with extension. Try to naturally weave relevant ZPD concepts into your project suggestions:\n${zpdContext}`
    : '';

  const { text } = await generateText({
    model: getModel(modelId),
    maxOutputTokens: 400,
    system:
      `You are Adeline's Project Brainstormer. Be enthusiastic and affirming. Deliver a full project plan immediately: what to build/do, learning goals, mapped credits, and a next step. After the plan, gently suggest a service idea as an invitation (optional, no pressure). IMPORTANT: Pay attention to the conversation context to understand what the student is actually talking about.${zpdSection}`,
    prompt: `Recent conversation:
${recentContext}

Student's current message: ${prompt}

Respond with: 1) warm affirmation, 2) concise plan based on what they're ACTUALLY discussing (3-4 sentences), 3) mapped credits relevant to their specific idea, 4) if ZPD concepts are relevant, mention one or two as stretch goals, 5) end with an optional service invitation.`,
  });
  return text;
}

export async function projectBrainstormer(state: AdelineGraphState): Promise<AdelineGraphState> {
  const config = loadConfig();
  const modelId = config.models.default;

  // Fetch ZPD context if we have a userId
  let zpdContext = '';
  if (state.userId) {
    try {
      zpdContext = await getZPDSummaryForPrompt(state.userId, { limit: 5 });
    } catch (e) {
      console.warn('[ProjectBrainstormer] Failed to fetch ZPD context:', e);
    }
  }

  const plan = await draftPlan(state.prompt, state.conversationHistory, modelId, zpdContext);

  return {
    ...state,
    responseContent: plan,
    genUIPayload: {
      component: 'MissionBriefing',
      props: {
        title: state.prompt,
        objective: state.serviceGoal || 'Make and share the project',
        steps: [
          'List materials and sketch the design together.',
          'Build and test it, taking notes/photos.',
          'Share it (or gift it) and reflect on what was learned.',
        ],
      },
    },
    metadata: {
      ...state.metadata,
      projectBrainstormer: {
        model: modelId,
      },
    },
  };
}
