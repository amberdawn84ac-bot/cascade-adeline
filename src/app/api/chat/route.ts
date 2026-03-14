import { NextRequest } from 'next/server';
import { HumanMessage } from '@langchain/core/messages';
import { adelineBrainRunnable } from '@/lib/langgraph';
import { getSessionUser } from '@/lib/auth';
import { maskPII } from '@/lib/safety/pii-masker';
import { moderateContent } from '@/lib/safety/content-moderator';
import prisma from '@/lib/db';
import { indexConversationMemory, shouldIndexConversation } from '@/lib/memex/memory-indexer';
import { shouldRefuse } from '@/lib/learning/scaffolding-guardian';

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) return new Response('Unauthorized', { status: 401 });

    const body = await req.json();
    const { messages } = body;
    const lastMessage = messages[messages.length - 1];
    const maskedContent = maskPII(lastMessage.content);
    const moderationResult = await moderateContent(lastMessage.content);

    if (moderationResult.severity === 'blocked') {
      return new Response('Content violates safety guidelines', { status: 400 });
    }

    const refusalDecision = shouldRefuse(maskedContent.masked, { userId: user.userId });
    if (refusalDecision.refuse) {
      const refusalText = refusalDecision.socraticPrompt;
      const encoder = new TextEncoder();
      const stream = new ReadableStream({
        start(controller) {
          let index = 0;
          const interval = setInterval(() => {
            if (index < refusalText.length) {
              controller.enqueue(encoder.encode(`0:${JSON.stringify(refusalText[index])}\n`));
              index++;
            } else {
              clearInterval(interval);
              controller.close();
            }
          }, 10);
        },
      });
      return new Response(stream, {
        headers: { 'Content-Type': 'text/plain; charset=utf-8', 'X-Vercel-AI-Data-Stream': 'v1' },
      });
    }

    const student = await prisma.user.findUnique({
      where: { id: user.userId },
      select: { gradeLevel: true }
    });

    const gradeLevel = student?.gradeLevel || '3';

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

    const result = await adelineBrainRunnable.invoke(initialState);
    
    // MEMEX: Non-blocking memory indexing - extract and store important facts from this conversation
    // Build conversation history for memory extraction
    const conversationForMemory = [
      { role: 'user' as const, content: maskedContent.masked },
      { role: 'assistant' as const, content: result.response_content || '' },
    ];
    
    // Index memories in background (non-blocking) if conversation is substantial
    if (shouldIndexConversation(conversationForMemory)) {
      // Generate a session ID from timestamp for grouping related conversations
      const sessionId = `chat-${Date.now()}`;
      
      // Fire and forget - don't await, let it run in background
      indexConversationMemory(user.userId, sessionId, conversationForMemory).catch(err => {
        console.error('[Memex] Background indexing failed:', err);
      });
    }
    
    // 1. Extract and Strip the [GENUI] string if the LLM leaked it into the text
    let responseText = result.response_content || "I'm here to help you learn and grow!";
    let payload = result.genUIPayload;

    const genUIMatch = responseText.match(/\[GENUI:(.*?)\]/);
    if (genUIMatch) {
      try {
        payload = JSON.parse(genUIMatch[1]);
        // Remove the ugly JSON artifact from the text the user sees
        responseText = responseText.replace(/\[GENUI:.*?\]/, '').trim();
      } catch (e) {
        console.error("Failed to parse inline GenUI", e);
      }
    }
    
    // 2. Stream using strict Vercel AI Protocol
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      start(controller) {
        // Send the UI Payload first (Vercel data chunk prefix '2:')
        if (payload) {
           const wrappedData = { genUIPayload: payload };
           controller.enqueue(encoder.encode(`2:${JSON.stringify([wrappedData])}\n`));
        }
        // Stream text character by character for the typing effect (Vercel text chunk '0:')
        let index = 0;
        const interval = setInterval(() => {
          if (index < responseText.length) {
            const charChunk = `0:${JSON.stringify(responseText[index])}\n`;
            controller.enqueue(encoder.encode(charChunk));
            index++;
          } else {
            clearInterval(interval);
            controller.close();
            // Memory indexing happens in background, stream closes immediately
          }
        }, 10);
      }
    });
    
    return new Response(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'X-Vercel-AI-Data-Stream': 'v1'
      },
    });

  } catch (error: any) {
    console.error('Chat API error:', error);
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      start(controller) {
        controller.enqueue(encoder.encode(`0:${JSON.stringify("SYSTEM CRASH: " + (error.message || "Unknown"))}\n`));
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

