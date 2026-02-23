import { generateText } from 'ai';
import { AdelineStateType } from '../state';
import { loadConfig, buildSystemPrompt } from '@/lib/config';
import { getModel } from '@/lib/ai-models';

/**
 * Mentor Node — Adeline's default conversational mode.
 *
 * For general questions, greetings, and anything that doesn't route to a
 * more specific node. Uses Adeline's full persona from adeline.config.toml:
 * warm, sharp-witted, no theatrics, no formulaic templates, biblical worldview.
 */
export async function mentor(state: AdelineStateType): Promise<Partial<AdelineStateType>> {
  const lastMessage = state.messages[state.messages.length - 1];
  const content = lastMessage.content as string;

  try {
    const config = loadConfig();
    const modelId = config.models.default;
    const systemPrompt = buildSystemPrompt(config);

    // Build conversation history from prior messages
    const conversationMessages = state.messages.slice(0, -1).map((m) => ({
      role: m._getType() === 'human' ? ('user' as const) : ('assistant' as const),
      content: m.content as string,
    }));

    const { text } = await generateText({
      model: getModel(modelId),
      system: systemPrompt,
      messages: [
        ...conversationMessages,
        { role: 'user', content },
      ],
      maxOutputTokens: 600,
    });

    return {
      response_content: text,
      metadata: {
        ...state.metadata,
        mentor: { model: modelId, timestamp: new Date().toISOString() },
      },
    };
  } catch (error) {
    console.error('[Mentor] Error:', error);
    return {
      response_content:
        "I'm having a little trouble connecting right now. Try again in a moment.",
      metadata: {
        ...state.metadata,
        mentor: { error: error instanceof Error ? error.message : String(error) },
      },
    };
  }
}
