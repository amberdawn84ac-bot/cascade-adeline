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
        
        // Stream the response character by character
        let index = 0;
        const interval = setInterval(() => {
          if (index < responseText.length) {
            controller.enqueue(responseText[index]);
            index++;
          } else {
            clearInterval(interval);
            controller.close();
          }
        }, 10); // 10ms delay between characters for streaming effect
      }
    });
    
    return new Response(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Transfer-Encoding': 'chunked',
      },
    });
    
  } catch (error) {
    console.error('Chat API error:', error);
    return new Response('Internal server error', { status: 500 });
  }
}
