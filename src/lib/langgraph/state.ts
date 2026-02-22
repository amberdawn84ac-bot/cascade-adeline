import { Annotation } from "@langchain/langgraph";
import { BaseMessage } from "@langchain/core/messages";

// Define the intent enum
export type Intent = 'CHAT' | 'INVESTIGATE' | 'LOG_CREDIT' | 'REFLECT' | 'GEN_UI';

// Define the main state interface
export const AdelineState = Annotation.Root({
  // Core conversation state
  messages: Annotation<BaseMessage[]>({
    reducer: (left: BaseMessage[], right: BaseMessage[]) => right,
    default: () => [],
  }),
  
  // User identification
  userId: Annotation<string>({
    reducer: (left: string, right: string) => right,
    default: () => "",
  }),
  
  // Intent classification
  intent: Annotation<Intent>({
    reducer: (left: Intent, right: Intent) => right,
    default: () => 'CHAT',
  }),
  
  // Missing information for clarification
  missing_info: Annotation<string[]>({
    reducer: (left: string[], right: string[]) => right,
    default: () => [],
  }),
  
  // Investigation state
  investigation_sources: Annotation<any[]>({
    reducer: (left: any[], right: any[]) => right,
    default: () => [],
  }),
  
  // Credit logging state
  credit_entry: Annotation<any>({
    reducer: (left: any, right: any) => right,
    default: () => null,
  }),
  
  // Learning gaps context
  learning_gaps: Annotation<any[]>({
    reducer: (left: any[], right: any[]) => right,
    default: () => [],
  }),
  
  // Response content
  response_content: Annotation<string>({
    reducer: (left: string, right: string) => right,
    default: () => "",
  }),
  
  // Metadata for tracking
  metadata: Annotation<Record<string, any>>({
    reducer: (left: Record<string, any>, right: Record<string, any>) => ({ ...left, ...right }),
    default: () => ({}),
  }),
});

export type AdelineStateType = typeof AdelineState.State;
