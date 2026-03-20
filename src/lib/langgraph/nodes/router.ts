import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { AdelineStateType, Intent } from "../state";
import { ChatOpenAI } from "@langchain/openai";
import { z } from "zod";
import { loadConfig } from '@/lib/config';

const INTENT_LABELS = ["CHAT", "LOG_CREDIT", "BRAINSTORM", "INVESTIGATE", "OPPORTUNITY", "REFLECT", "GEN_UI", "IMAGE_LOG", "VISION"] as const;

function heuristicIntent(messageText: string): Intent | null {
  const lower = messageText.toLowerCase();

  // Hard override: timeline queries → CHAT
  if (lower.includes("timeline")) {
    return "CHAT";
  }

  // Image/vision overrides are handled upstream via state.metadata

  const lifeLogPhrases = [
    'i built', 'i made', 'i helped', 'i cooked', 'i baked', 'i read',
    'i wrote', 'i finished', 'i completed', 'i sewed', 'i planted',
    'i gardened', 'i volunteered', 'i served',
  ];
  if (lifeLogPhrases.some((phrase) => lower.includes(phrase))) {
    return "LOG_CREDIT";
  }

  if (lower.includes('brainstorm') || lower.includes('idea') || lower.includes('i want to build') || lower.includes('i want to make')) {
    return "BRAINSTORM";
  }

  if (['who profits', 'follow the money', 'investigate', 'regulatory capture', 'what really happened', 'who funded'].some((kw) => lower.includes(kw))) {
    return "INVESTIGATE";
  }

  if (lower.includes('opportunit') || lower.includes('scholarship') || lower.includes('competition')) {
    return "OPPORTUNITY";
  }

  const assessPhrases = ['assess my', 'placement test', 'test my level', 'what grade am i', 'where am i in', 'assess me', 'placement assessment', 'evaluate my'];
  if (assessPhrases.some((phrase) => lower.includes(phrase))) {
    return "CHAT"; // ASSESS not in pipeline switch yet, fall through to mentor
  }

  const reflectPhrases = ['i learned', 'i realized', 'i noticed', 'what i found hard', 'next time i would', 'i struggled with', 'it made me think'];
  if (reflectPhrases.some((phrase) => lower.includes(phrase))) {
    return "REFLECT";
  }

  return null;
}

export const router = async (state: AdelineStateType): Promise<Partial<AdelineStateType>> => {
  const { messages } = state;
  const lastMessage = messages[messages.length - 1];
  const messageText = typeof lastMessage.content === 'string' ? lastMessage.content : JSON.stringify(lastMessage.content);

  // Image/audio overrides via metadata
  if (state.metadata?.imageUrl) {
    return { intent: "IMAGE_LOG" };
  }
  if (state.metadata?.audioBase64) {
    return { intent: "LOG_CREDIT" };
  }

  // Try heuristic first — fast and reliable for clear patterns
  const heuristic = heuristicIntent(messageText);
  if (heuristic !== null) {
    return { intent: heuristic };
  }

  // Fall back to LLM classification for ambiguous messages
  const routerSchema = z.object({
    intent: z.enum(["CHAT", "LOG_CREDIT", "BRAINSTORM", "INVESTIGATE", "OPPORTUNITY", "REFLECT", "GEN_UI"]),
  });

  const config = loadConfig();
  const llm = new ChatOpenAI({ model: config.models.default || "gpt-4o", temperature: 0 }).withStructuredOutput(routerSchema);

  try {
    const result = await llm.invoke([
      new SystemMessage(`You are the Adeline Router. Classify the user's message into exactly ONE intent.

Intent definitions:
- LOG_CREDIT: User describes an activity they DID (past tense) — "I baked", "I built", "I helped", "I read", "I volunteered". These are life activities to log for transcript credit.
- BRAINSTORM: User wants to plan, design, or brainstorm a project or idea.
- INVESTIGATE: User asks investigative questions about institutions, corporations, funding, or systemic issues. Keywords: "who profits", "who funds", "investigate", "follow the money".
- OPPORTUNITY: User asks about opportunities, scholarships, competitions, or resources.
- REFLECT: User is reflecting on their learning — "I learned", "I realized", "I noticed", "I struggled with".
- GEN_UI: User requests a specific UI component like a transcript card or investigation board.
- CHAT: General conversation, greetings, or questions that don't fit the above.

Return ONLY the intent label.`),
      new HumanMessage(messageText),
    ]);
    return { intent: result.intent };
  } catch {
    return { intent: "CHAT" };
  }
};
