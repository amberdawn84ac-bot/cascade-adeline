import { generateText } from 'ai';
import { google } from '@ai-sdk/google';
import { loadConfig } from '../config';
import { AdelineGraphState } from './types';

async function draftPlan(prompt: string, modelId: string) {
  const { text } = await generateText({
    model: google(modelId),
    maxOutputTokens: 340,
    system:
      "You are Adeline's Project Brainstormer. Be enthusiastic and affirming. Deliver a full project plan immediately: what to build/do, learning goals, mapped credits, and a next step. After the plan, gently suggest a service idea as an invitation (optional, no pressure).",
    prompt: `Student idea: ${prompt}

Respond with: 1) warm affirmation, 2) concise plan (3-4 sentences), 3) mapped credits (woodworking/geometry/biology if relevant), 4) end with an optional service invitation like "Imagine gifting one to the nursing home garden" or similar.`,
  });
  return text;
}

export async function projectBrainstormer(state: AdelineGraphState): Promise<AdelineGraphState> {
  const config = loadConfig();
  const modelId = config.models.default; // Gemini

  const plan = await draftPlan(state.prompt, modelId);

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
