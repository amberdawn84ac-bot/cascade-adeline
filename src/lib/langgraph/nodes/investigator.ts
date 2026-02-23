import { generateText } from 'ai';
import { AdelineStateType } from '../state';
import { loadConfig, buildSystemPrompt } from '@/lib/config';
import { getModel } from '@/lib/ai-models';

/**
 * Investigator Node — Discernment Engine
 *
 * Handles questions about institutions, corporations, funding, and systems.
 * Adeline's investigation philosophy (from adeline.config.toml):
 * - Always ask: Who profits? Follow the money.
 * - Prioritize primary sources over mainstream summaries.
 * - Center human suffering, not abstract talking points.
 * - Help students form their own conclusions — never tell them what to believe.
 */
export async function investigator(state: AdelineStateType): Promise<Partial<AdelineStateType>> {
  const lastMessage = state.messages[state.messages.length - 1];
  const content = lastMessage.content as string;

  try {
    const config = loadConfig();
    // Use the investigation model (Claude) for discernment tasks
    const modelId = config.models.investigation || config.models.default;
    const basePrompt = buildSystemPrompt(config);

    const investigatorContext = `\n\nCURRENT MODE: Investigation / Discernment
You are functioning as Adeline's Discernment Engine. The student has an investigative question.

Your approach:
- Lead by tracing incentives: Who profits from this narrative? Who funded the research?
- Cite types of primary sources that would answer this definitively (congressional records, SEC filings, patents, court documents, first-person testimony, corporate funding disclosures).
- Center the human cost — focus on real people harmed, not abstract "environmental concerns."
- Present the evidence landscape honestly, including what IS known and what remains murky.
- Do NOT say "some people believe" or "experts say." Name the specific actors and their interests.
- End with 1-2 questions that teach the student HOW to keep digging: "What would you search for in a FOIA request? Who filed the patent?"

Source priority (tag your sources): [PRIMARY] > [CURATED] > [SECONDARY] > [MAINSTREAM]`;

    const conversationMessages = state.messages.slice(0, -1).map((m) => ({
      role: m._getType() === 'human' ? ('user' as const) : ('assistant' as const),
      content: m.content as string,
    }));

    const { text } = await generateText({
      model: getModel(modelId),
      system: basePrompt + investigatorContext,
      messages: [
        ...conversationMessages,
        { role: 'user', content },
      ],
      maxOutputTokens: 800,
    });

    return {
      response_content: text,
      investigation_sources: [],
      genUIPayload: {
        component: 'InvestigationBoard',
        props: { query: content, summary: text },
      },
      metadata: {
        ...state.metadata,
        investigator: { model: modelId, timestamp: new Date().toISOString() },
      },
    };
  } catch (error) {
    console.error('[Investigator] Error:', error);
    return {
      response_content:
        "I hit a snag while digging into that. Try rephrasing your question and I'll investigate again.",
      metadata: {
        ...state.metadata,
        investigator: { error: error instanceof Error ? error.message : String(error) },
      },
    };
  }
}
