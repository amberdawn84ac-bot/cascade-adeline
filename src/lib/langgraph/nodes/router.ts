import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { AdelineStateType } from "../state";
import { ChatOpenAI } from "@langchain/openai";
import { z } from "zod";
import { loadConfig } from '@/lib/config';
export const router = async (state: AdelineStateType): Promise<Partial<AdelineStateType>> => {
const { messages } = state;
const lastMessage = messages[messages.length - 1];
const messageText = typeof lastMessage.content === 'string' ? lastMessage.content : JSON.stringify(lastMessage.content);

// HARD OVERRIDE: If user types timeline, force it to CHAT (Mentor)
if (messageText.toLowerCase().includes("timeline")) {
return { intent: "CHAT" };
}

// Normal LLM routing for everything else
const routerSchema = z.object({
intent: z.enum(["CHAT", "BRAINSTORM", "INVESTIGATE", "LOG_CREDIT", "REFLECT", "GEN_UI", "OPPORTUNITY", "IMAGE_LOG", "VISION"])
});

const config = loadConfig();
const llm = new ChatOpenAI({ model: config.models.default || "gpt-4o", temperature: 0 }).withStructuredOutput(routerSchema);

try {
const result = await llm.invoke([
new SystemMessage("You are the Adeline Router. If a user asks for facts or a timeline, return CHAT. If they explicitly ask for project ideas, return BRAINSTORM."),
new HumanMessage(messageText)
]);
return { intent: result.intent };
} catch (error) {
return { intent: "CHAT" };
}
};

