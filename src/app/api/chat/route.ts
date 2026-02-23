import { NextRequest } from 'next/server';
import { streamText } from 'ai';
import { HumanMessage } from '@langchain/core/messages';
import { adelineBrainRunnable } from '@/lib/langgraph';
import { getSessionUser } from '@/lib/auth';
import { maskPII } from '@/lib/safety/pii-masker';
import { moderateContent } from '@/lib/safety/content-moderator';

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) return new Response('Unauthorized', { status: 401 });

    const body = await req.json();
    const { messages } = body;
    const lastMessage = messages[messages.length - 1];
    const maskedContent = maskPII(lastMessage.content);
    
    // Setup initial LangGraph state
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
      metadata: { timestamp: new Date().toISOString(), user_role: user.role },
    };

    // Run the LangGraph Brain to get result
    const result = await adelineBrainRunnable.invoke(initialState);
    const responseContent = result.response_content || "I am processing that request. Give me just a moment.";
    
    // Create a proper streaming response with GenUI payload
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      start(controller) {
        // Send GenUI payload first if it exists
        if (result.genUIPayload) {
          const data = `0:"${JSON.stringify({ type: 'data', data: result.genUIPayload })}"\n`;
          controller.enqueue(encoder.encode(data));
        }
        
        // Send the text response
        const text = `0:"${JSON.stringify({ type: 'text', text: responseContent })}"\n`;
        controller.enqueue(encoder.encode(text));
        
        controller.close();
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
    
  } catch (error) {
    console.error('Chat API error:', error);
    return new Response('Internal server error', { status: 500 });
  }
}
