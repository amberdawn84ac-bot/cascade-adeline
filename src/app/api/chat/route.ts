import { NextRequest } from 'next/server';
import { HumanMessage } from '@langchain/core/messages';
import { adelineBrainRunnable } from '@/lib/langgraph';
import { getSessionUser } from '@/lib/auth';
import { maskPII } from '@/lib/safety/pii-masker';
import { moderateContent } from '@/lib/safety/content-moderator';
import prisma from '@/lib/db';
import { indexConversationMemory, shouldIndexConversation } from '@/lib/memex/memory-indexer';
import { shouldRefuse } from '@/lib/learning/scaffolding-guardian';
import { recordInteraction, calculateCognitiveLoad } from '@/lib/cognitive-load';

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
      select: { gradeLevel: true, messageCount: true, messageResetAt: true }
    });

    const gradeLevel = student?.gradeLevel || '3';

    // ── Rate limiting ──────────────────────────────────────────────────────────
    const DAILY_LIMIT = 50; // free tier; paid plans can raise this via metadata
    const now = new Date();
    const resetAt = student?.messageResetAt;
    const needsReset = !resetAt || (now.getTime() - resetAt.getTime()) > 24 * 60 * 60 * 1000;
    const currentCount = needsReset ? 0 : (student?.messageCount ?? 0);

    if (needsReset) {
      await prisma.user.update({
        where: { id: user.userId },
        data: { messageCount: 0, messageResetAt: now },
      });
    }

    if (currentCount >= DAILY_LIMIT) {
      const limitMsg = "You've reached your 50 message daily limit! Your count resets every 24 hours. Upgrade to a paid plan for unlimited conversations with Adeline. 🌿";
      const encoder = new TextEncoder();
      const stream = new ReadableStream({
        start(controller) {
          controller.enqueue(encoder.encode(`0:${JSON.stringify(limitMsg)}\n`));
          controller.close();
        },
      });
      return new Response(stream, {
        status: 429,
        headers: { 'Content-Type': 'text/plain; charset=utf-8', 'X-Vercel-AI-Data-Stream': 'v1' },
      });
    }

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

    const aiStartTime = Date.now();
    const result = await adelineBrainRunnable.invoke(initialState);
    const responseTimeMs = Date.now() - aiStartTime;

    // Increment message count (non-blocking)
    prisma.user.update({
      where: { id: user.userId },
      data: { messageCount: { increment: 1 } },
    }).catch(err => console.error('[RateLimit] Failed to increment count:', err));
    
    // Log user activity so analytics has real session duration data (non-blocking)
    prisma.userActivity.create({
      data: {
        userId: user.userId,
        activityType: 'chat',
        duration: Math.round(responseTimeMs / 1000 / 60) || 1, // minutes, min 1
        metadata: { intent: result.intent ?? 'CHAT', gradeLevel },
      },
    }).catch(() => {});

    // Cognitive load tracking (non-blocking)
    const sessionId = `chat-${Math.floor(aiStartTime / 60000)}`; // bucket per minute
    const messageId = `msg-${aiStartTime}`;
    const editDistance = maskedContent.masked.length; // proxy: message length
    const sentimentScore = moderationResult.severity !== 'safe' ? -0.5 : 0; // rough signal
    recordInteraction({ userId: user.userId, sessionId, messageId, responseTimeMs, editDistance, sentimentScore })
      .catch(err => console.error('[CognitiveLoad] record failed:', err));
    calculateCognitiveLoad({ userId: user.userId, responseTimeMs, editDistance, sentimentScore })
      .then(load => {
        if (load.level === 'HIGH' || load.level === 'CRITICAL') {
          console.warn(`[CognitiveLoad] User ${user.userId} load=${load.level} score=${load.score.toFixed(2)}`);
        }
      }).catch(() => {});

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

