import { AdelineStateType } from "../state";
import { genUIPlanner } from "../genUIPlanner";

export async function mentor(state: AdelineStateType): Promise<Partial<AdelineStateType>> {
  console.log('[Mentor] WITH GENUI - NODE CALLED - intent:', state.intent);
  
  try {
    const lastMessage = state.messages[state.messages.length - 1];
    const content = lastMessage.content as string;
    console.log('[Mentor] WITH GENUI - Processing content:', content);
    
    // Check if GenUI component is needed
    let genUIPayload = null;
    if (state.intent === 'GEN_UI' || content.toLowerCase().includes('timeline')) {
      try {
        console.log('[Mentor] WITH GENUI - Attempting to generate GenUI payload...');
        // Create a state object for genUIPlanner
        const genUIState = {
          prompt: content,
          gradeLevel: state.gradeLevel || '3',
          intent: state.intent,
          studentContext: state.studentContext || { detectedGaps: [] },
          messages: state.messages
        };
        const genUIResult = await genUIPlanner(genUIState);
        genUIPayload = genUIResult.genUIPayload;
        console.log('[Mentor] WITH GENUI - GenUI payload generated:', genUIPayload);
      } catch (error) {
        console.warn('[Mentor] WITH GENUI - Failed to generate GenUI payload:', error);
      }
    }
    
    // Return a simple response with GenUI payload
    return {
      response_content: "Mentor with GenUI working! Content: " + content,
      genUIPayload,
      metadata: state.metadata,
    };
  } catch (error) {
    console.error('[Mentor] WITH GENUI - Error:', error);
    return {
      response_content: "Mentor with GenUI error: " + (error as Error).message,
      metadata: state.metadata,
    };
  }
}
