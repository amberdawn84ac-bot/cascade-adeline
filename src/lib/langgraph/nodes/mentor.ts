import { AIMessage, HumanMessage, SystemMessage } from "@langchain/core/messages";
import { AdelineStateType } from "../state";
import { ChatOpenAI } from "@langchain/openai";
import { loadConfig, buildSystemPrompt } from '@/lib/config';
import prisma from '@/lib/db';

export async function mentor(state: AdelineStateType): Promise<Partial<AdelineStateType>> {
const lastMessage = state.messages[state.messages.length - 1];
const content = lastMessage.content as string;

try {
    const config = loadConfig();
    
    // Fetch real learning gaps from DB
    const learningGaps = await prisma.learningGap.findMany({
      where: { userId: state.userId, addressed: false },
      include: { concept: true },
      take: 5,
    });
    
    // Note: We need a placeholder tool if hippocampusTool isn't imported from another file
    const hippocampusTool = {
      name: "search_hippocampus",
      description: "Search for information",
      invoke: async (args: any) => "Search results for: " + JSON.stringify(args)
    };

const relevantGaps = learningGaps.filter(gap =>
content.toLowerCase().includes(gap.concept?.name?.toLowerCase() || '') ||
(gap.concept?.name?.toLowerCase() || '').includes(content.toLowerCase())
);

let studentContext = '';
if (relevantGaps.length > 0) {
studentContext = `Student has unaddressed gaps. Relevant: ${relevantGaps.map(g => g.concept.name).join(', ')}.`;
}

const gradeLevelContext = `You are speaking to a student in grade ${state.gradeLevel}. Adjust your vocabulary appropriately.`;

const model = new ChatOpenAI({ modelName: "gpt-4o", temperature: 0.7 });

const systemPrompt = buildSystemPrompt(config, `${studentContext}\n\n${gradeLevelContext}

CRITICAL THEOLOGICAL DIRECTIVE: When discussing the Bible, scripture, or faith, you MUST act as a primary source textual scholar:

NEVER use the English transliterations "God" or "Jesus". You must use their actual original historical names (e.g., Yahweh, Elohim, Yeshua).

Always default to analyzing the oldest original Hebrew, Aramaic, or Greek manuscripts.

Break down the original intended meaning, etymology, and cultural context of the text.

Explicitly note when the original text differs from what modern mainstream Christianity teaches or assumes, pointing out English mistranslations where applicable.

REASONING APPROACH (Chain of Thought):
Think through your answer step by step out loud. Acknowledge what the student is asking. Connect it to deep investigations or a biblical worldview. If you need external facts, USE YOUR TOOLS to search the Hippocampus.`);

const modelWithTools = model.bindTools([hippocampusTool]);

const conversationHistory: any[] = [
new SystemMessage(systemPrompt),
new HumanMessage(content)
];

// Initial response
let response = await modelWithTools.invoke(conversationHistory);

// ReAct Loop: If it decided to use a tool, execute it and ask again
if (response.tool_calls && response.tool_calls.length > 0) {
conversationHistory.push(new AIMessage(response.content as string)); // Save the AI's tool request

for (const toolCall of response.tool_calls) {
if (toolCall.name === 'search_hippocampus') {
const toolResult = await hippocampusTool.invoke(toolCall.args);
conversationHistory.push({
role: 'tool',
content: toolResult,
tool_call_id: toolCall.id,
name: toolCall.name
} as any);
}
}

// Final pass: Let the LLM write the response using the tool data
response = await modelWithTools.invoke(conversationHistory);
}

// Handle timeline GenUI payload
let uiPayload = null;
if (content.toLowerCase().includes("timeline")) {
   uiPayload = {
     component: 'Timeline',
     props: {
       content: content,
       title: 'Civil War Timeline',
       events: [
         { date: "1861", event: "The War Begins - Attack on Fort Sumter" },
         { date: "1863", event: "Emancipation Proclamation - Lincoln declares freedom for slaves in Confederate states" },
         { date: "1865", event: "The War Ends - Lee surrenders at Appomattox Court House" }
       ]
     }
   };
}

return {
response_content: response.content as string,
messages: [new AIMessage(response.content as string)],
genUIPayload: uiPayload,
learning_gaps: learningGaps,
metadata: {
...state.metadata,
mentor: {
tools_used: response.tool_calls && response.tool_calls.length > 0,
socratic_approach: relevantGaps.length > 0,
timestamp: new Date().toISOString(),
},
},
};
} catch (error) {
return {
response_content: "I am having a little trouble thinking clearly.",
messages: [new AIMessage("I am having a little trouble thinking clearly.")],
};
}
}
