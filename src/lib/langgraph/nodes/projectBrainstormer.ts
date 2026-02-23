import { generateText } from 'ai';
import { AdelineStateType } from '../state';
import { loadConfig, buildSystemPrompt } from '@/lib/config';
import { getModel } from '@/lib/ai-models';

/**
 * ProjectBrainstormer Node — Helping students build things with PURPOSE.
 *
 * Adeline's brainstorm philosophy (from adeline.config.toml):
 * - Every project must help someone, solve a problem, or add beauty to the world.
 * - Service is an invitation, NEVER a gate.
 * - Reject busywork: redirect it toward real purpose.
 * - Concrete plan: what to build + 3-4 steps + mapped credits.
 */
export async function projectBrainstormer(state: AdelineStateType): Promise<Partial<AdelineStateType>> {
  const lastMessage = state.messages[state.messages.length - 1];
  const content = lastMessage.content as string;

  try {
    const config = loadConfig();
    const modelId = config.models.default;
    const basePrompt = buildSystemPrompt(config);

    const brainstormerContext = `\n\nCURRENT MODE: Project Brainstorming
The student wants to build or create something. Help them develop a project with REAL PURPOSE.

Your approach:
1. First, ask or assume WHO this helps — a neighbor, the community, themselves, the environment.
2. Give a CONCRETE plan specific to what they mentioned: what to actually build or create, 3-4 clear steps.
3. Map the relevant academic credits (subjects and skills this covers).
4. At the end, offer ONE optional service angle — not required, just an invitation.

If the idea sounds like busywork (no real purpose), redirect warmly: "I love this. But let's make it matter — who does it help?"
Do NOT give generic project ideas that have nothing to do with what the student mentioned.`;

    const conversationMessages = state.messages.slice(0, -1).map((m) => ({
      role: m._getType() === 'human' ? ('user' as const) : ('assistant' as const),
      content: m.content as string,
    }));

    const { text } = await generateText({
      model: getModel(modelId),
      system: basePrompt + brainstormerContext,
      messages: [
        ...conversationMessages,
        { role: 'user', content },
      ],
      maxOutputTokens: 500,
    });

    return {
      response_content: text,
      genUIPayload: {
        component: 'ProjectImpactCard',
        props: { suggestion: text, prompt: content },
      },
      metadata: {
        ...state.metadata,
        projectBrainstormer: { model: modelId, timestamp: new Date().toISOString() },
      },
    };
  } catch (error) {
    console.error('[ProjectBrainstormer] Error:', error);
    return {
      response_content:
        "I couldn't connect to brainstorm just now. Tell me more about what you want to build and try again.",
      metadata: {
        ...state.metadata,
        projectBrainstormer: { error: error instanceof Error ? error.message : String(error) },
      },
    };
  }
}
