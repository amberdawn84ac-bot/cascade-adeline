import { HumanMessage, AIMessage, SystemMessage, ToolMessage } from "@langchain/core/messages";
import { AdelineStateType } from "../state";
import { ChatOpenAI } from "@langchain/openai";
import { loadConfig, buildSystemPrompt } from '@/lib/config';
import { hippocampusTool } from '../tools/hippocampusTool';
import { getStudentContext } from '@/lib/learning/student-context';
import { z } from 'zod';

export async function investigator(state: AdelineStateType): Promise<Partial<AdelineStateType>> {
  const lastMessage = state.messages[state.messages.length - 1];
  const content = lastMessage.content as string;
  
  try {
    // Load Adeline's configuration
    const config = loadConfig();
    const studentCtx = await getStudentContext(state.userId);
    
    // Initialize LangChain ChatOpenAI model with tools
    const model = new ChatOpenAI({
      model: config.models.default || "gpt-4o",
      temperature: 0.5,
      openAIApiKey: process.env.OPENAI_API_KEY,
    }).bindTools([hippocampusTool]);

    // Build the system prompt with Adeline's voice and investigation focus
    const systemPrompt = `${buildSystemPrompt(config, `Student is investigating: "${content}"${studentCtx.systemPromptAddendum}`)}

REASONING APPROACH (Chain of Thought):
You must never use rigid templates, bulleted lists, or academic boilerplate. Instead, think through your answer step by step out loud.

Acknowledge what the student is really asking.

Consider what you already know from their context or grade level.

Connect their question to deep, real-world investigations (follow the money) or a biblical worldview.

Propose a hands-on application to deepen understanding.
Show your thinking naturally—speak like a sharp-witted, wise mentor tracking data late at night. Let the user see your thought process.

INVESTIGATION PROTOCOL:
1. Apply the "follow the money" principle - who profits from this?
2. Center human suffering caused by corporate exploitation, not generic environmental talking points
3. Prioritize primary sources over mainstream summaries
4. Use the search_hippocampus tool to find relevant information
5. Guide the student to evaluate evidence and form their own conclusions
6. Never dictate what to believe - teach discernment

Remember: Always ask "Who profits from me believing this?" and trace funding, incentives, regulatory capture.`;

    // Create the investigation-specific prompt
    const investigatorPrompt = `The student is investigating: "${content}"

As Adeline the investigator, I need to think through this step by step and use our Hippocampus database to find relevant information.

Let me start by searching our knowledge base for information related to this investigation.`;

    // Start the ReAct loop
    const messages: any[] = [
      new SystemMessage(systemPrompt),
      new HumanMessage(investigatorPrompt)
    ];

    // First LLM call to determine if tools are needed
    const response = await model.invoke(messages);
    messages.push(response);

    // Check if the LLM made tool calls
    if (response.tool_calls && response.tool_calls.length > 0) {
      // Execute tool calls
      for (const toolCall of response.tool_calls) {
        if (toolCall.name === 'search_hippocampus') {
          const toolResult = await hippocampusTool.invoke({
            query: toolCall.args.query
          });
          
          const toolMessage = new ToolMessage({
            content: toolResult,
            tool_call_id: toolCall.id ?? '',
          });
          messages.push(toolMessage);
        }
      }

      // Second LLM call with tool results
      const finalResponse = await model.invoke(messages);
      messages.push(finalResponse);
      
      return {
        investigation_sources: [{
          type: 'hippocampus_search',
          title: 'Hippocampus Database Search',
          content: finalResponse.content as string,
          searchQuery: content,
          timestamp: new Date().toISOString(),
        }],
        response_content: finalResponse.content as string || `I've searched our database for information on "${content}". Let me share what I've discovered and help you think critically about who might benefit from this information.`,
        metadata: {
          ...state.metadata,
          investigator: {
            tools_used: ['search_hippocampus'],
            search_query: content,
            react_steps: messages.length,
            llm_calls: 2,
            model_used: 'gpt-4o',
            timestamp: new Date().toISOString(),
          },
        },
      };
    }

    // No tool calls needed, return direct response
    return {
      investigation_sources: [],
      response_content: response.content as string || `Let me help you investigate "${content}" by thinking through who might profit from this and what evidence we should examine.`,
      metadata: {
        ...state.metadata,
        investigator: {
          tools_used: [],
          search_query: content,
          react_steps: 1,
          llm_calls: 1,
          model_used: 'gpt-4o',
          timestamp: new Date().toISOString(),
        },
      },
    };
    
  } catch (error) {
    console.error('Investigator error:', error);
    return {
      response_content: "I'm having trouble accessing our investigation database right now. Let me help you with a general approach to investigating this topic. Remember to always ask: 'Who profits from this information?' and follow the money to understand the real motivations behind what you're studying.",
      metadata: {
        ...state.metadata,
        investigator: {
          error: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date().toISOString(),
        },
      },
    };
  }
}

