import { NextRequest } from 'next/server';
import { HumanMessage } from '@langchain/core/messages';
import { adelineBrainRunnable } from '@/lib/langgraph';
import { getSessionUser } from '@/lib/auth';
import { maskPII } from '@/lib/safety/pii-masker';
import { moderateContent } from '@/lib/safety/content-moderator';
import prisma from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) return new Response('Unauthorized', { status: 401 });

    const body = await req.json();
    const { messages } = body;
    const lastMessage = messages[messages.length - 1];
    const maskedContent = maskPII(lastMessage.content);
    
    // Content moderation
    const moderationResult = await moderateContent(lastMessage.content);
    if (moderationResult.severity === 'blocked') {
      return new Response('Content violates safety guidelines', { status: 400 });
    }
    
    // Fetch student's grade level
    const student = await prisma.user.findUnique({
      where: { id: user.userId },
      select: { gradeLevel: true }
    });
    
    const gradeLevel = student?.gradeLevel || '3'; // Default to 3rd grade if not set
    
    // Setup initial LangGraph state
    const initialState = {
      messages: [new HumanMessage(maskedContent.masked)],
      userId: user.userId,
      gradeLevel: gradeLevel,
      intent: 'CHAT' as const,
      missing_info: [],
      investigation_sources: [],
      credit_entry: null,
      learning_gaps: [],
      response_content: '',
      genUIPayload: null,
      metadata: { timestamp: new Date().toISOString(), user_role: user.role, gradeLevel: gradeLevel },
    };

    // Run the LangGraph Brain to get result
    const result = await adelineBrainRunnable.invoke(initialState);
    
    // Create native ReadableStream for streaming response
    const stream = new ReadableStream({
      start(controller) {
        const responseText = result.response_content || "I'm here to help you learn and grow!";
        
        console.log('[API Route] Response text:', responseText);
        console.log('[API Route] GenUI payload:', result.genUIPayload);
        
        // Stream using Vercel Data Stream Protocol format
        // 0: for text content
        const textChunk = `0:${JSON.stringify(responseText)}\n`;
        controller.enqueue(new TextEncoder().encode(textChunk));
        
        // If there's a GenUI payload, stream it as data (must be an array)
        if (result.genUIPayload) {
          console.log('[API Route] Streaming GenUI payload:', result.genUIPayload);
          const dataChunk = `2:${JSON.stringify([result.genUIPayload])}\n`;
          controller.enqueue(new TextEncoder().encode(dataChunk));
        } else {
          console.log('[API Route] No GenUI payload to stream');
        }
        
        controller.close();
      }
    });
    
    return new Response(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Transfer-Encoding': 'chunked',
        'X-Vercel-AI-Data-Stream': 'v1'
      },
    });
    
  } catch (error: any) {
    console.error('Chat API error:', error);
    
    // Stream the actual error message to the frontend so we can debug it
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      start(controller) {
        const errorMessage = error.message || "Unknown error occurred";
        controller.enqueue(encoder.encode(`0:${JSON.stringify("SYSTEM CRASH: " + errorMessage)}\n`));
        controller.close();
      }
    });
    
    return new Response(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'X-Vercel-AI-Data-Stream': 'v1'
      }
    });
  }
}
