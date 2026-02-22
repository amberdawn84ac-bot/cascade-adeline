import { HumanMessage } from "@langchain/core/messages";
import { AdelineStateType } from "../state";

export async function router(state: AdelineStateType): Promise<Partial<AdelineStateType>> {
  const lastMessage = state.messages[state.messages.length - 1];
  const content = lastMessage.content as string;
  
  // Analyze the user's message to determine intent
  let intent: string = 'CHAT';
  
  // Investigation patterns
  if (content.toLowerCase().includes('who funded') || 
      content.toLowerCase().includes('who paid for') ||
      content.toLowerCase().includes('source') ||
      content.toLowerCase().includes('investigate') ||
      content.toLowerCase().includes('research') ||
      content.toLowerCase().includes('study')) {
    intent = 'INVESTIGATE';
  }
  
  // Life credit logging patterns
  if (content.toLowerCase().includes('i baked') ||
      content.toLowerCase().includes('i cooked') ||
      content.toLowerCase().includes('i made') ||
      content.toLowerCase().includes('i built') ||
      content.toLowerCase().includes('i created') ||
      content.toLowerCase().includes('i finished') ||
      content.toLowerCase().includes('i completed') ||
      content.toLowerCase().includes('i learned') ||
      content.toLowerCase().includes('i did')) {
    intent = 'LOG_CREDIT';
  }
  
  // Reflection patterns
  if (content.toLowerCase().includes('reflect') ||
      content.toLowerCase().includes('think about') ||
      content.toLowerCase().includes('how did i') ||
      content.toLowerCase().includes('what could i') ||
      content.toLowerCase().includes('help me improve')) {
    intent = 'REFLECT';
  }
  
  // GenUI patterns (when UI components are needed)
  if (content.toLowerCase().includes('show me') ||
      content.toLowerCase().includes('create') ||
      content.toLowerCase().includes('build') ||
      content.toLowerCase().includes('make a')) {
    intent = 'GEN_UI';
  }
  
  return {
    intent: intent as any,
    metadata: {
      ...state.metadata,
      router: {
        detected_intent: intent,
        message_length: content.length,
        timestamp: new Date().toISOString(),
      },
    },
  };
}
