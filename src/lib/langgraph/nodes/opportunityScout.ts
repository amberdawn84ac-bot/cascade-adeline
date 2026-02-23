import { generateText } from 'ai';
import { AdelineStateType } from '../state';
import { loadConfig, buildSystemPrompt } from '@/lib/config';
import { getModel } from '@/lib/ai-models';

/**
 * OpportunityScout Node
 *
 * Helps students find scholarships, competitions, programs, and resources
 * that match their interests. Adeline's approach: be specific, give real names,
 * connect opportunities to what the student is already doing.
 */
export async function opportunityScout(state: AdelineStateType): Promise<Partial<AdelineStateType>> {
  const lastMessage = state.messages[state.messages.length - 1];
  const content = lastMessage.content as string;

  try {
    const config = loadConfig();
    const modelId = config.models.default;
    const basePrompt = buildSystemPrompt(config);

    const scoutContext = `\n\nCURRENT MODE: Opportunity Scout
The student is looking for scholarships, competitions, programs, or external resources.

Your approach:
- Give SPECIFIC, real opportunities by name. Do not invent organizations.
- If you know the organization or program name, state it. If you're uncertain, say so.
- Connect the opportunity to what the student is already interested in or working on.
- Include: type (scholarship/competition/program/grant), rough deadline or cycle, who it's for.
- If the student is homeschooled, note if the opportunity is homeschool-friendly.
- End with an action step: "To apply, typically you'll need..."`;

    const conversationMessages = state.messages.slice(0, -1).map((m) => ({
      role: m._getType() === 'human' ? ('user' as const) : ('assistant' as const),
      content: m.content as string,
    }));

    const { text } = await generateText({
      model: getModel(modelId),
      system: basePrompt + scoutContext,
      messages: [
        ...conversationMessages,
        { role: 'user', content },
      ],
      maxOutputTokens: 500,
    });

    return {
      response_content: text,
      metadata: {
        ...state.metadata,
        opportunityScout: { model: modelId, timestamp: new Date().toISOString() },
      },
    };
  } catch (error) {
    console.error('[OpportunityScout] Error:', error);
    return {
      response_content:
        "I hit a snag searching for opportunities. Try asking again with more detail about your interests or grade level.",
      metadata: {
        ...state.metadata,
        opportunityScout: { error: error instanceof Error ? error.message : String(error) },
      },
    };
  }
}
