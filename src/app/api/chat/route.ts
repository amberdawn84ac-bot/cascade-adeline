import { NextRequest } from 'next/server';
import { streamText, createUIMessageStream, createUIMessageStreamResponse } from 'ai';
import { HumanMessage } from '@langchain/core/messages';
import { adelineBrainRunnable } from '@/lib/langgraph';
import { getSessionUser } from '@/lib/auth';
import { maskPII } from '@/lib/safety/pii-masker';
import { moderateContent } from '@/lib/safety/content-moderator';

/**
 * Wrap a plain text response in the UI message stream protocol
 * so the client's useChat always receives a consistent format.
 */
function textAsUIStream(text: string, meta?: Record<string, unknown>): Response {
  const stream = createUIMessageStream({
    execute: async ({ writer }) => {
      if (meta) writer.write({ type: 'start', messageMetadata: meta });
      writer.write({ type: 'text-start', id: 'msg' });
      writer.write({ type: 'text-delta', id: 'msg', delta: text });
      writer.write({ type: 'text-end', id: 'msg' });
      writer.write({ type: 'finish', finishReason: 'stop', ...(meta ? { messageMetadata: meta } : {}) });
    },
  });
  return createUIMessageStreamResponse({ stream });
}

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
      metadata: {
        timestamp: new Date().toISOString(),
        user_role: user.role,
      },
    };

    // Run the LangGraph
    const result = await adelineBrainRunnable.invoke(initialState);

    // Extract response content
    const responseContent = result.response_content || "I'm here to help! Could you tell me more about what you'd like to learn or explore?";

    // Return response as UI stream
    return textAsUIStream(responseContent, {
      intent: result.intent,
      metadata: result.metadata,
    });

  } catch (error) {
    console.error('Chat API error:', error);
    return new Response('Internal server error', { status: 500 });
  }
}
