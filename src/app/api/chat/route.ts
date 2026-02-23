import { NextRequest } from 'next/server';
import { streamText } from 'ai';
import { HumanMessage } from '@langchain/core/messages';
import { adelineBrainRunnable } from '@/lib/langgraph';
import { getSessionUser } from '@/lib/auth';
import { maskPII } from '@/lib/safety/pii-masker';
import { moderateContent } from '@/lib/safety/content-moderator';

export async function POST(req: NextRequest) {
  try {
    // Get user session
    const user = await getSessionUser();
    if (!user) {
      return new Response('Unauthorized', { status: 401 });
    }

    // Parse request body
    const body = await req.json();
    const { messages } = body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return new Response('Invalid messages format', { status: 400 });
    }

    const lastMessage = messages[messages.length - 1];
    if (lastMessage.role !== 'user') {
      return new Response('Last message must be from user', { status: 400 });
    }

    // Safety checks
    const maskedContent = maskPII(lastMessage.content);
    const moderationResult = await moderateContent(maskedContent.masked);
    
    if (moderationResult.severity === 'blocked') {
      return new Response('Content violates safety guidelines', { status: 400 });
    }

    // Create initial state for LangGraph
    const initialState = {
      messages: [new HumanMessage(maskedContent.masked)],
      userId: user.userId,
      intent: 'CHAT' as const,
      missing_info: [],
      investigation_sources: [],
      credit_entry: null,
      learning_gaps: [],
      response_content: '',
      genUIPayload: null,
      metadata: {
        timestamp: new Date().toISOString(),
        user_role: user.role,
      },
    };

    // Run the LangGraph
    const result = await adelineBrainRunnable.invoke(initialState);

    // Handle different response types
    if (result.genUIPayload) {
      // GenUI response - stream both the explanation and the structured GenUI payload
      const explanation = result.response_content || "I'm here to help! Could you tell me more about what you'd like to learn or explore?";
      
      // Create a custom stream that handles both text and GenUI payload
      const encoder = new TextEncoder();
      const decoder = new TextDecoder();
      
      const stream = new ReadableStream({
        async start(controller) {
          // Send the explanation as text first
          controller.enqueue(encoder.encode(explanation));
          
          // Then send the GenUI payload with special markers
          if (result.genUIPayload) {
            const genUIJson = JSON.stringify(result.genUIPayload);
            controller.enqueue(encoder.encode(`\n\n[GENUI_START]\n${genUIJson}\n[GENUI_END]`));
          }
          
          controller.close();
        },
      });
      
      return new Response(stream);
    } else {
      // Text-only response
      const responseContent = result.response_content || "I'm here to help! Could you tell me more about what you'd like to learn or explore?";
      
      return new Response(responseContent);
    }

  } catch (error) {
    console.error('Chat API error:', error);
    return new Response('Internal server error', { status: 500 });
  }
}
