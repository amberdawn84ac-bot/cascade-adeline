import { NextRequest, after } from 'next/server';
import { streamText, experimental_transcribe as transcribeAudio } from 'ai';
import { getSessionUser } from '@/lib/auth';
import { maskPII } from '@/lib/safety/pii-masker';
import { moderateContent } from '@/lib/safety/content-moderator';
import { shouldRefuse } from '@/lib/learning/scaffolding-guardian';
import { recordInteraction, calculateCognitiveLoad } from '@/lib/cognitive-load';
import { indexConversationMemory, shouldIndexConversation } from '@/lib/memex/memory-indexer';
import { retrieveRelevantMemories, formatMemoriesForPrompt } from '@/lib/memex/memory-retriever';
import { loadConfig, buildSystemPrompt } from '@/lib/config';
import { getModel, getTranscriptionModel } from '@/lib/ai-models';
import { router as adelineRouter } from '@/lib/langgraph/router';
import { lifeCreditLogger } from '@/lib/langgraph/lifeCreditLogger';
import { lessonOrchestrator } from '@/lib/langgraph/lesson/lessonOrchestrator';
import { subjectFromQuery } from '@/lib/langgraph/lesson/subjectFromQuery';
import { AdelineGraphState } from '@/lib/langgraph/types';
import { getStudentContext } from '@/lib/learning/student-context';
import redis from '@/lib/redis';
import prisma from '@/lib/db';

// Intent-specific addendum appended to Adeline's base system prompt
function getIntentContext(intent: string | undefined): string {
  switch (intent) {
    case 'INVESTIGATE':
      return `\n\nCURRENT MODE: Investigation / Discernment\nThe student is asking an investigative question. Your role right now is researcher and guide.\n- Lead with: Who profits? Who funded this? Trace the money.\n- Prioritize primary sources: congressional records, SEC filings, patents, court docs, first-person accounts.\n- Center human suffering — not abstract talking points. Who were the real people harmed?\n- Do NOT hedge with "some people say." Present the evidence and let them draw their own conclusions.\n- End with 1-2 questions that push them deeper into the evidence.`;
    case 'LIFE_LOG':
      return `\n\nCURRENT MODE: Life Credit Logging\nThe student is describing something they did. Your role is to celebrate and record.\n- Tell them specifically what subjects they just earned credit in (use your life-to-credit knowledge).\n- Give a small, accurate credit amount (0.01-0.02 credits for a single activity).\n- Ask ONE follow-up: "Tell me more about how it turned out."\n- Keep it brief. They are logging an activity, not writing an essay.`;
    case 'BRAINSTORM':
      return `\n\nCURRENT MODE: Project Brainstorming\nThe student wants to build or create something. Help them find a project with PURPOSE.\n- Ask first: Who does this help? What problem does it solve or what beauty does it add to the world?\n- Give a concrete project plan: what to build, 3-4 steps, what subjects it covers.\n- Invite service as an option at the end — never as a gate or requirement.\n- If it sounds like busywork, redirect: "I love this idea. But who does it help? Let's make it matter."`;
    case 'REFLECT':
      return `\n\nCURRENT MODE: Metacognitive Reflection\nThe student is thinking about their own learning. Ask ONE Socratic question — not a lecture.\nChoose one reflection dimension: Process (how did you do it?), Challenge (what was hard?), Connection (what does this remind you of?), Transfer (where else could you use this?), Growth (what would you do differently?).\nOne question only. Then wait.`;
    case 'OPPORTUNITY':
      return `\n\nCURRENT MODE: Opportunity Scout\nHelp the student discover scholarships, competitions, or programs that match their interests.\nBe specific — give real program names, rough deadlines if known, and what skills they develop.`;
    case 'ASSESS':
      return `\n\nCURRENT MODE: Placement Assessment\nThe student wants to know where they stand in a subject. Your role is diagnostic, not instructional.\n- Ask 3-5 targeted questions that reveal their actual level — start at grade level, adjust up or down based on responses.\n- Do NOT lecture. Ask, listen, then ask the next question.\n- At the end, tell them exactly where they are: "You're solidly at grade X in this subject. Here's what to tackle next."`;
    case 'ANALOGY':
      return `\n\nCURRENT MODE: Simplify & Scaffold\nThe student's cognitive load is high — they're overwhelmed. Your ONLY job right now is to make one thing crystal clear.\n- Pick the single most confusing concept and explain it with one powerful analogy tied to their interests.\n- No lists. No multiple points. One analogy, one idea, one breath.\n- End with: "Does that click? Tell me what you're still stuck on."`;
    case 'AUDIO_LOG':
      return `\n\nCURRENT MODE: Audio Life Log\nThe student sent a voice recording describing something they did. Treat the transcribed text as a life activity log.\n- Celebrate what they did and identify what subjects they earned credit in.\n- Give a small, accurate credit amount (0.01-0.02 credits).\n- Ask ONE follow-up about how it went.`;
    case 'IMAGE_LOG':
      return `\n\nCURRENT MODE: Image Life Log\nThe student shared a photo of something they made, built, or did. Respond to what you can infer from the description.\n- Identify the subjects this activity connects to and celebrate the work.\n- Give a small credit estimate (0.01-0.02 credits) and ask what they learned from making it.`;
    default:
      return '';
  }
}

// Which GenUI component to surface based on intent
function getGenUIPayload(intent: string | undefined, prompt: string): object | null {
  switch (intent) {
    case 'INVESTIGATE':
      return { component: 'InvestigationBoard', props: { query: prompt } };
    case 'LIFE_LOG':
      return { component: 'TranscriptCard', props: { activityDescription: prompt } };
    case 'BRAINSTORM':
      return { component: 'ProjectImpactCard', props: { suggestion: prompt } };
    default:
      return null;
  }
}

// Returns a static text message in the Vercel AI data stream v1 format
function staticStreamResponse(text: string, status = 200): Response {
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    start(controller) {
      controller.enqueue(encoder.encode(`0:${JSON.stringify(text)}\n`));
      controller.close();
    },
  });
  return new Response(stream, {
    status,
    headers: { 'Content-Type': 'text/plain; charset=utf-8', 'X-Vercel-AI-Data-Stream': 'v1' },
  });
}

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) return new Response('Unauthorized', { status: 401 });
    const userId = user.userId;

    const body = await req.json();
    const { messages, imageUrl, audioBase64 } = body;

    if (!messages || messages.length === 0) {
      return new Response('No messages provided', { status: 400 });
    }

    const lastMessage = messages[messages.length - 1];
    const maskedContent = maskPII(lastMessage.content);

    // Safety: content moderation
    const moderationResult = await moderateContent(lastMessage.content);
    if (moderationResult.severity === 'blocked') {
      return new Response('Content violates safety guidelines', { status: 400 });
    }

    // Safety: scaffolding guardian (Socratic redirect instead of answer)
    const refusalDecision = shouldRefuse(maskedContent.masked, { userId: user.userId });
    if (refusalDecision.refuse) {
      return staticStreamResponse(refusalDecision.socraticPrompt);
    }

    // Fetch rate-limit counters; gradeLevel comes from cached getStudentContext below
    const [studentCtx, student] = await Promise.all([
      getStudentContext(userId),
      prisma.user.findUnique({
        where: { id: user.userId },
        select: { messageCount: true, messageResetAt: true },
      }),
    ]);

    // Rate limiting — 50 messages/day on free tier
    const DAILY_LIMIT = 50;
    const now = new Date();
    const resetAt = student?.messageResetAt;
    const needsReset = !resetAt || now.getTime() - resetAt.getTime() > 24 * 60 * 60 * 1000;
    const currentCount = needsReset ? 0 : (student?.messageCount ?? 0);

    if (needsReset) {
      await prisma.user.update({
        where: { id: user.userId },
        data: { messageCount: 0, messageResetAt: now },
      });
    }

    if (currentCount >= DAILY_LIMIT) {
      return staticStreamResponse(
        "You've reached your 50 message daily limit! Your count resets every 24 hours. Upgrade to a paid plan for unlimited conversations with Adeline. 🌿",
        429,
      );
    }

    const aiStartTime = Date.now();
    const config = loadConfig();

    // Build router state (includes gradeLevel so lifeCreditLogger maps correctly)
    const routerState: AdelineGraphState = {
      userId: user.userId,
      gradeLevel: studentCtx.gradeLevel ?? '3',
      prompt: maskedContent.masked,
      conversationHistory: messages.map((m: { role: string; content: string }) => ({
        role: m.role,
        content: typeof m.content === 'string' ? m.content : JSON.stringify(m.content),
      })),
      metadata: { imageUrl, audioBase64 },
    };

    // 1. Classify intent and select model
    const routedState = await adelineRouter(routerState);
    const intent = routedState.intent;
    const selectedModel = routedState.selectedModel || config.models.default;

    // 1.5 LESSON intent — stream lesson blocks via LangGraph lessonOrchestrator using AI SDK
    if (intent === 'LESSON') {
      const threadId = `lesson-${userId}-${Date.now()}`;
      const detectedSubject = subjectFromQuery(maskedContent.masked);
      
      const { createDataStreamResponse } = await import('ai');
      
      return createDataStreamResponse({
        execute: async (dataStream) => {
          // Tell chat we're building on the left pane
          dataStream.writeMessageAnnotation({ 
            status: 'Building your interactive lesson on the learning board...' 
          });
          
          try {
            const { lessonOrchestrator } = await import('@/lib/langgraph/lesson/lessonOrchestrator');
            // Redis cache check
            const cacheKey = `lesson:${userId}:${Buffer.from(maskedContent.masked).toString('base64').slice(0, 32)}`;
            const cached = await redis.get<{ lessonBlocks: unknown[]; lessonMetadata: unknown }>(cacheKey).catch(() => null);
            
            let blocksToEmit: unknown[] = [];
            let finalMetadata: Record<string, unknown> | null = null;
            
            if (cached?.lessonBlocks?.length) {
              // Serve from cache
              blocksToEmit = cached.lessonBlocks;
              finalMetadata = cached.lessonMetadata as Record<string, unknown> ?? null;
              
              // Emit cached blocks
              for (const block of blocksToEmit) {
                dataStream.writeMessageAnnotation({
                  genUIPayload: { 
                    component: 'LessonBlock', 
                    props: { block, lessonId: threadId } 
                  }
                });
              }
            } else {
              // Run orchestrator
              const emittedBlockIds = new Set<string>();
              const eventStream = await lessonOrchestrator.streamEvents(
                {
                  studentQuery: maskedContent.masked,
                  userId,
                  studentProfile: {
                    gradeLevel: studentCtx?.gradeLevel ?? '8',
                    interests: (studentCtx as any)?.interests ?? [],
                    learningStyle: (studentCtx as any)?.learningStyle ?? 'EXPEDITION',
                    age: (studentCtx as any)?.age,
                    bktSummary: (studentCtx as any)?.bktSummary,
                  },
                },
                { configurable: { thread_id: threadId }, version: 'v2' as const }
              );
    
              for await (const event of eventStream) {
                if (event.event !== 'on_chain_end') continue;
                const output = event.data?.output as Record<string, unknown> | undefined;
                if (!output) continue;
                
                // Handle metadata
                if (output.lessonMetadata && !finalMetadata) {
                  finalMetadata = output.lessonMetadata as Record<string, unknown>;
                }
                
                // Handle blocks
                if (Array.isArray(output.lessonBlocks)) {
                  for (const block of output.lessonBlocks) {
                    const b = block as Record<string, unknown>;
                    if (!b.block_id) {
                      b.block_id = `block-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
                    }
                    
                    if (emittedBlockIds.has(b.block_id as string)) continue;
                    emittedBlockIds.add(b.block_id as string);
                    
                    if (!b.type) b.type = b.block_type;
                    
                    // Emit as AI SDK annotation
                    dataStream.writeMessageAnnotation({
                      genUIPayload: { 
                        component: 'LessonBlock', 
                        props: { block: b, lessonId: threadId } 
                      }
                    });
                    
                    blocksToEmit.push(b);
                  }
                }
              }
              
              // Cache for 24h
              if (blocksToEmit.length > 0) {
                redis.set(cacheKey, { lessonBlocks: blocksToEmit, lessonMetadata: finalMetadata }, { ex: 86400 })
                  .catch(() => {});
              }
            }
            
            // Save to database (non-blocking)
            if (blocksToEmit.length > 0) {
              const subject = subjectFromQuery(maskedContent.masked);
              prisma.lesson.upsert({
                where: { lessonId: threadId },
                create: {
                  lessonId: threadId,
                  title: (finalMetadata?.title as string | undefined) || maskedContent.masked.slice(0, 100),
                  subject,
                  gradeLevel: studentCtx?.gradeLevel ?? '8',
                  lessonJson: (finalMetadata ?? {}) as any,
                  contentBlocks: blocksToEmit as any,
                  standardsCodes: Array.isArray(finalMetadata?.credits)
                    ? (finalMetadata.credits as any[]).map((c: any) => String(c.subject))
                    : [],
                  estimatedDuration: Math.max(10, blocksToEmit.length * 5),
                },
                update: {
                  contentBlocks: blocksToEmit as any,
                  lessonJson: (finalMetadata ?? {}) as any,
                  updatedAt: new Date(),
                },
              }).catch(() => {});
              
              // Save session
              prisma.lessonSession.upsert({
                where: { userId_lessonId_isActive: { userId, lessonId: threadId, isActive: false } },
                create: {
                  userId,
                  lessonId: threadId,
                  visibleBlocks: (blocksToEmit as any[]).map((b: any) => b.block_id).filter(Boolean),
                  completedBlocks: [],
                  studentResponses: {},
                  checkpointId: threadId,
                  isActive: false,
                },
                update: {
                  visibleBlocks: (blocksToEmit as any[]).map((b: any) => b.block_id).filter(Boolean),
                  updatedAt: new Date(),
                },
              }).catch(() => {});
            }
            
          } catch (err) {
            console.error('[Chat/LESSON] orchestrator error:', err);
            dataStream.writeMessageAnnotation({ 
              status: 'I hit a snag building that lesson. Try again!' 
            });
          }
        }
      });
    }

    // 2. LIFE_LOG / AUDIO_LOG: background transcript save — does not block the stream
    if (intent === 'LIFE_LOG' || intent === 'AUDIO_LOG') {
      lifeCreditLogger(routedState).catch(err =>
        console.warn('[Chat] lifeCreditLogger background save failed:', err),
      );
    }

    // 3. Build full system prompt: Adeline's soul + student adaptation + ZPD + memory + intent mode
    const relevantMemories = await retrieveRelevantMemories(user.userId, maskedContent.masked, 3).catch(() => []);
    const memoryContext = formatMemoriesForPrompt(relevantMemories);
    const fullSystemPrompt =
      buildSystemPrompt(config) + studentCtx.systemPromptAddendum + memoryContext + getIntentContext(intent);

    // 4. GenUI payload (pure intent mapping — no LLM call needed)
    const genUIPayload = getGenUIPayload(intent, maskedContent.masked);

    // 5. Prepare message history for the LLM
    const streamMessages = messages.map((m: { role: string; content: unknown }) => ({
      role: m.role as 'user' | 'assistant' | 'system',
      content: typeof m.content === 'string' ? m.content : JSON.stringify(m.content),
    }));

    // 5.5 Media processing: transcribe audio / attach image for vision before streaming
    if (intent === 'AUDIO_LOG' && audioBase64) {
      try {
        const transcriptResult = await transcribeAudio({
          model: getTranscriptionModel(),
          audio: Buffer.from(audioBase64, 'base64'),
        });
        const lastMsg = streamMessages[streamMessages.length - 1];
        lastMsg.content = `[Voice recording transcription]: ${transcriptResult.text}${
          lastMsg.content ? `\n\nStudent note: ${lastMsg.content}` : ''
        }`;
      } catch (err) {
        console.warn('[Chat] Audio transcription failed, proceeding with text only:', err);
      }
    }

    if (intent === 'IMAGE_LOG' && imageUrl) {
      (streamMessages[streamMessages.length - 1] as any).content = [
        { type: 'image', image: new URL(imageUrl) },
        { type: 'text', text: maskedContent.masked || 'Here is something I made or did.' },
      ];
    }

    // Non-blocking: increment message count
    prisma.user.update({
      where: { id: user.userId },
      data: { messageCount: { increment: 1 } },
    }).catch(err => console.error('[RateLimit] Failed to increment count:', err));

    // Non-blocking: log activity for analytics
    const responseTimeMs = Date.now() - aiStartTime;
    prisma.userActivity.create({
      data: {
        userId: user.userId,
        activityType: 'chat',
        duration: Math.round(responseTimeMs / 1000 / 60) || 1,
        metadata: { intent: intent ?? 'CHAT', gradeLevel: studentCtx.gradeLevel },
      },
    }).catch(() => {});

    // Non-blocking: cognitive load tracking
    const sessionId = `chat-${Math.floor(aiStartTime / 60000)}`;
    const messageId = `msg-${aiStartTime}`;
    const editDistance = maskedContent.masked.length;
    const sentimentScore = moderationResult.severity !== 'safe' ? -0.5 : 0;
    recordInteraction({ userId: user.userId, sessionId, messageId, responseTimeMs, editDistance, sentimentScore })
      .catch(err => console.error('[CognitiveLoad] record failed:', err));
    calculateCognitiveLoad({ userId: user.userId, responseTimeMs, editDistance, sentimentScore })
      .then(load => {
        if (load.level === 'HIGH' || load.level === 'CRITICAL') {
          console.warn(`[CognitiveLoad] User ${user.userId} load=${load.level} score=${load.score.toFixed(2)}`);
        }
      }).catch(() => {});

    // 6. Register post-stream work with next/server after() — called during the request phase
    // so it holds the request context. Awaits fullTextPromise which resolves in onFinish.
    let resolveFullText!: (text: string) => void;
    const fullTextPromise = new Promise<string>(resolve => { resolveFullText = resolve; });

    after(async () => {
      const fullText = await fullTextPromise;

      const conv = [
        { role: 'user' as const, content: maskedContent.masked },
        { role: 'assistant' as const, content: fullText },
      ];
      if (shouldIndexConversation(conv)) {
        await indexConversationMemory(userId, `chat-${Date.now()}`, conv)
          .catch(err => console.error('[Memex] Background indexing failed:', err));
      }

      if (intent === 'REFLECT' && fullText) {
        await prisma.reflectionEntry.create({
          data: {
            userId,
            type: 'SELF_ASSESSMENT',
            activitySummary: maskedContent.masked,
            promptUsed: maskedContent.masked,
            aiFollowUp: fullText,
            conceptsTagged: [],
          },
        }).catch(err => console.error('[Reflect] Save failed:', err));
      }

      if (intent === 'ASSESS' && fullText) {
        const exchange = {
          userMessage: maskedContent.masked,
          adelineResponse: fullText,
          timestamp: new Date().toISOString(),
        };
        try {
          const existing = await prisma.placementAssessment.findFirst({
            where: { userId, status: 'IN_PROGRESS' },
            orderBy: { startedAt: 'desc' },
          });
          if (existing) {
            const prev = (existing.responses as Record<string, unknown>) ?? {};
            const exchanges = Array.isArray(prev.exchanges) ? prev.exchanges : [];
            await prisma.placementAssessment.update({
              where: { id: existing.id },
              data: { responses: { exchanges: [...exchanges, exchange] } },
            });
          } else {
            await prisma.placementAssessment.create({
              data: { userId, status: 'IN_PROGRESS', responses: { exchanges: [exchange] } },
            });
          }
        } catch (err) {
          console.error('[Assess] Save failed:', err);
        }
      }
    });

    // 7. Stream Adeline's response — real LLM streaming via AI SDK v6
    const aiResult = streamText({
      model: getModel(selectedModel),
      system: fullSystemPrompt,
      messages: streamMessages,
      onFinish: ({ text }) => { resolveFullText(text); },
    });

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      start(controller) {
        // Prepend data annotations before text (2: = data chunk in Vercel AI protocol v1)
        const gapNudge = routedState.metadata?.gapNudge ?? null;
        if (genUIPayload || gapNudge) {
          const data = { genUIPayload: genUIPayload ?? null, gapNudge };
          controller.enqueue(encoder.encode(`2:${JSON.stringify([data])}\n`));
        }

        const reader = aiResult.textStream.getReader();

        function pump() {
          reader.read().then(({ done, value }) => {
            if (done) { controller.close(); return; }
            controller.enqueue(encoder.encode(`0:${JSON.stringify(value)}\n`));
            pump();
          }).catch(err => {
            console.error('[Chat] Stream pump error:', err);
            controller.error(err);
          });
        }

        pump();
      },
    });

    return new Response(stream, {
      headers: { 'Content-Type': 'text/plain; charset=utf-8', 'X-Vercel-AI-Data-Stream': 'v1' },
    });

  } catch (error) {
    console.error('[Chat] API error:', error);
    return staticStreamResponse('Something went wrong on my end. Please try again in a moment.');
  }
}
