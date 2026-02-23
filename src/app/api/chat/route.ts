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

    // Extract response content and GenUI payload
    const responseContent = result.response_content || "I'm here to help! Could you tell me more about what you'd like to learn or explore?";
    const genUIPayload = result.genUIPayload;

    // Create stream with proper Vercel AI SDK format
    const stream = streamText({
      model: 'gpt-4',
      messages: [
        {
          role: 'assistant',
          content: responseContent,
        }
      ],
      onFinish: () => {
        // This is called when the stream is complete
      },
      onError: (error) => {
        console.error('Stream error:', error);
      },
    });

    // If there's a GenUI payload, we need to modify the stream to include it
    if (genUIPayload) {
      // Create a custom stream that includes both text and GenUI metadata
      const encoder = new TextEncoder();
      
      const customStream = new ReadableStream({
        async start(controller) {
          try {
            // Get the original stream reader
            const reader = stream.textStream.getReader();
            
            // Read and forward all chunks from the original stream
            while (true) {
              const { done, value } = await reader.read();
              if (done) break;
              
              if (value) {
                controller.enqueue(value);
              }
            }
            
            // After the text stream is complete, add the GenUI payload as metadata
            const genUIMetadata = {
              type: 'genui',
              payload: genUIPayload,
              timestamp: new Date().toISOString(),
            };
            
            // Send the GenUI metadata as a special chunk
            controller.enqueue(encoder.encode(`\n\n[GENUI_METADATA]\n${JSON.stringify(genUIMetadata)}\n`));
            
            controller.close();
          } catch (error) {
            console.error('Custom stream error:', error);
            controller.error(error);
          }
        },
      });
      
      return new Response(customStream);
    }

    // Return the original stream for text-only responses
    return stream.toTextStreamResponse();

  } catch (error) {
    console.error('Chat API error:', error);
    return new Response('Internal server error', { status: 500 });
  }
}
