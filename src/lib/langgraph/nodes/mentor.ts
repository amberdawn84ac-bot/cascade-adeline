import { AdelineStateType } from "../state";

export async function mentor(state: AdelineStateType): Promise<Partial<AdelineStateType>> {
  console.log('[Mentor] MINIMAL VERSION - NODE CALLED - intent:', state.intent);
  
  try {
    const lastMessage = state.messages[state.messages.length - 1];
    const content = lastMessage.content as string;
    console.log('[Mentor] MINIMAL VERSION - Processing content:', content);
    
    // Return a simple response for now
    return {
      response_content: "Mentor node working! Content: " + content,
      metadata: state.metadata,
    };
  } catch (error) {
    console.error('[Mentor] MINIMAL VERSION - Error:', error);
    return {
      response_content: "Mentor error: " + error.message,
      metadata: state.metadata,
    };
  }
}
