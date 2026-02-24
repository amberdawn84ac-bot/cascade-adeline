import { HumanMessage } from "@langchain/core/messages";
import { AdelineStateType } from "../state";

export async function router(state: AdelineStateType): Promise<Partial<AdelineStateType>> {
  const lastMessage = state.messages[state.messages.length - 1];
  const content = lastMessage.content as string;
  
  // Analyze the user's message to determine intent using Chain of Thought
  let intent: string = 'CHAT';
  
  // Chain of Thought reasoning for intent detection
  const reasoningProcess = `
  Step 1: What is the student actually asking or reporting?
  - Content: "${content}"
  
  Step 2: Look for key intent indicators:
  - Investigation patterns: "who funded", "who paid for", "source", "investigate", "research", "study"
  - Life credit patterns: "i baked", "i cooked", "i made", "i built", "i created", "i finished", "i completed", "i learned", "i did"
  - Other intents: reflection, brainstorm, opportunity, etc.
  
  Step 3: Consider the student's grade level and context
  - Grade: ${state.gradeLevel || 'unknown'}
  - Previous interactions: ${state.messages.length} messages
  
  Step 4: Determine the most appropriate intent
  `;
  
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
  
  // Opportunity patterns
  if (content.toLowerCase().includes('opportunity') ||
      content.toLowerCase().includes('scholarship') ||
      content.toLowerCase().includes('internship') ||
      content.toLowerCase().includes('competition') ||
      content.toLowerCase().includes('program')) {
    intent = 'OPPORTUNITY';
  }
  
  // Brainstorming patterns
  if (content.toLowerCase().includes('brainstorm') ||
      content.toLowerCase().includes('project idea') ||
      content.toLowerCase().includes('what should I') ||
      content.toLowerCase().includes('help me create') ||
      content.toLowerCase().includes('suggest a')) {
    intent = 'BRAINSTORM';
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
