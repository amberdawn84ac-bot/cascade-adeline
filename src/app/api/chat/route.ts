import { NextRequest } from 'next/server';
import { streamText, createUIMessageStream, createUIMessageStreamResponse } from 'ai';
import prisma from '@/lib/db';
import redis from '@/lib/redis';
import { loadConfig } from '@/lib/config';
import { router } from '@/lib/langgraph/router';
import { lifeCreditLogger } from '@/lib/langgraph/lifeCreditLogger';
import { discernmentEngine } from '@/lib/langgraph/discernmentEngine';
import { projectBrainstormer } from '@/lib/langgraph/projectBrainstormer';
import { genUIPlanner } from '@/lib/langgraph/genUIPlanner';
import { opportunityScout } from '@/lib/langgraph/opportunityScout';
import { gapDetector } from '@/lib/langgraph/gapDetector';
import { reflectionCoach } from '@/lib/langgraph/reflectionCoach';
import { visionAnalyzer } from '@/lib/langgraph/visionAnalyzer';
import { AdelineGraphState } from '@/lib/langgraph/types';
import { getSessionUser } from '@/lib/auth';
import { getModel } from '@/lib/ai-models';
import { maskPII } from '@/lib/safety/pii-masker';
import { moderateContent } from '@/lib/safety/content-moderator';
import { createTraceContext, recordTrace, forceFlush, type TraceContext } from '@/lib/observability/tracer';
import { getCachedResponse, cacheResponse } from '@/lib/semantic-cache';
import { checkMessageLimit, incrementMessageCount } from '@/lib/subscription';

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

function buildSystemPrompt() {
  const config = loadConfig();
  return `${config.persona.name} — ${config.persona.role}. Voice: ${config.persona.voice}. Foundation: ${config.persona.foundation}. Core belief: ${config.persona.core_belief}.`;
}

type ChatMessage = { role: 'user' | 'assistant' | 'system'; content: string };
const REDIS_LIMIT = 5;
const CHAT_RATE_LIMIT = 30; // per minute per user

function isValidMessages(payload: unknown): payload is Array<{ role: ChatMessage['role']; content: string }> {
  if (!Array.isArray(payload) || payload.length === 0) return false;
  const validRoles: ChatMessage['role'][] = ['user', 'assistant', 'system'];
  return payload.every((m) => m && typeof m.role === 'string' && typeof m.content === 'string' && validRoles.includes(m.role as any));
}

async function saveMessage(userId: string | undefined, sessionId: string, message: ChatMessage) {
  if (!userId) return;
  const key = `conv:${userId}:${sessionId}`;
  await Promise.all([redis.rpush(key, JSON.stringify(message)), redis.ltrim(key, -REDIS_LIMIT, -1)]);
  await (prisma as any).conversationMemory.create({
    data: {
      userId,
      sessionId,
      role: message.role.toUpperCase(),
      content: message.content,
      metadata: {},
    },
  });
}

async function loadHistory(userId?: string, sessionId?: string): Promise<ChatMessage[]> {
  if (!userId || !sessionId) return [];
  const key = `conv:${userId}:${sessionId}`;
  const cached = await redis.lrange(key, -10, -1);
  if (cached && cached.length) {
    return cached
      .map((c: string) => {
        try {
          return JSON.parse(c) as ChatMessage;
        } catch {
          return null;
        }
      })
      .filter((m: ChatMessage | null): m is ChatMessage => Boolean(m));
  }

  const fromDb = await prisma.conversationMemory.findMany({
    where: { userId, sessionId },
    orderBy: { createdAt: 'desc' },
    take: 10,
  });
  const history = fromDb.reverse().map((m: any) => ({ role: m.role.toLowerCase() as ChatMessage['role'], content: m.content }));
  if (history.length) {
    await Promise.all(history.map((h: ChatMessage) => redis.rpush(key, JSON.stringify(h))));
    await redis.ltrim(key, -REDIS_LIMIT, -1);
  }
  return history;
}

async function rateLimit(key: string, limit = 50, windowSeconds = 600) {
  const count = await redis.incr(key);
  if (count === 1) {
    await redis.expire(key, windowSeconds);
  }
  if (count > limit) {
    return false;
  }
  return true;
}

async function safeNode(
  name: string,
  node: (state: AdelineGraphState) => Promise<AdelineGraphState>,
  state: AdelineGraphState,
  traceCtx?: TraceContext,
): Promise<AdelineGraphState> {
  const start = performance.now();
  try {
    const result = await node(state);
    if (traceCtx) {
      recordTrace(traceCtx, {
        agentNode: name,
        modelId: state.selectedModel || 'unknown',
        promptTokens: 0,
        outputTokens: 0,
        totalTokens: 0,
        latencyMs: Math.round(performance.now() - start),
        success: true,
      });
    }
    return result;
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error(`[LangGraph:${name}]`, err);
    if (traceCtx) {
      recordTrace(traceCtx, {
        agentNode: name,
        modelId: state.selectedModel || 'unknown',
        promptTokens: 0,
        outputTokens: 0,
        totalTokens: 0,
        latencyMs: Math.round(performance.now() - start),
        success: false,
        errorMessage: err instanceof Error ? err.message : String(err),
      });
    }
    const md = { ...(state.metadata || {}), errors: [...(state.metadata?.errors || []), `${name} failed`] };
    return { ...state, metadata: md };
  }
}

async function runWorkflow(prompt: string, baseState: Partial<AdelineGraphState>, traceCtx?: TraceContext): Promise<AdelineGraphState> {
  let state: AdelineGraphState = {
    prompt,
    ...baseState,
  } as AdelineGraphState;

  state = await safeNode('router', router, state, traceCtx);
  console.log('[Workflow] Router returned intent:', state.intent, 'model:', state.selectedModel);

  switch (state.intent) {
    case 'LIFE_LOG':
      state = await safeNode('lifeCreditLogger', lifeCreditLogger, state, traceCtx);
      state = { ...state, metadata: { ...state.metadata, reflectionMode: 'post_activity' } };
      state = await safeNode('reflectionCoach', reflectionCoach, state, traceCtx);
      break;
    case 'INVESTIGATE':
      state = await safeNode('discernmentEngine', discernmentEngine, state, traceCtx);
      break;
    case 'BRAINSTORM':
      state = await safeNode('projectBrainstormer', projectBrainstormer, state, traceCtx);
      break;
    case 'OPPORTUNITY':
      state = await safeNode('opportunityScout', opportunityScout, state, traceCtx);
      break;
    case 'REFLECT':
      state = await safeNode('reflectionCoach', reflectionCoach, state, traceCtx);
      break;
    case 'IMAGE_LOG':
      state = await safeNode('visionAnalyzer', visionAnalyzer, state, traceCtx);
      state = await safeNode('lifeCreditLogger', lifeCreditLogger, state, traceCtx);
      state = { ...state, metadata: { ...state.metadata, reflectionMode: 'post_activity' } };
      state = await safeNode('reflectionCoach', reflectionCoach, state, traceCtx);
      break;
    default:
      break;
  }

  state = await safeNode('genUIPlanner', genUIPlanner, state, traceCtx);
  state = await safeNode('gapDetector', gapDetector, state, traceCtx);
  return state;
}

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for') || 'unknown';
  const sessionUser = await getSessionUser();
  const body = await req.json();
  const { messages, userId, gradeLevel, studentContext, imageUrl } = body as {
    messages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>;
    userId?: string;
    gradeLevel?: string;
    studentContext?: AdelineGraphState['studentContext'];
    imageUrl?: string;
  };

  const effectiveUserId = sessionUser?.userId || userId;
  const rateKey = effectiveUserId ? `chat:${effectiveUserId}` : `chat:${ip}`;
  if (!(await rateLimit(rateKey, CHAT_RATE_LIMIT, 60))) {
    return new Response('Rate limit exceeded', { status: 429 });
  }

  // Check subscription message limit
  if (effectiveUserId) {
    const limitCheck = await checkMessageLimit(effectiveUserId);
    if (!limitCheck.allowed) {
      return new Response(
        JSON.stringify({
          error: 'message_limit_reached',
          message: `You've used all ${limitCheck.limit} free messages this month. Upgrade to continue learning!`,
          tier: limitCheck.tier,
          limit: limitCheck.limit,
        }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      );
    }
  }

  if (!isValidMessages(messages)) return new Response('Invalid messages payload', { status: 400 });

  const latestUser = [...messages].reverse().find((m) => m.role === 'user');
  const prompt = latestUser?.content || '';
  const sessionId = req.headers.get('x-session-id') || 'default';

  // --- Safety Layer: Content Moderation ---
  const moderation = await moderateContent(prompt);
  if (moderation.severity === 'blocked') {
    console.log('[Safety] Content blocked:', moderation.flaggedCategories);
    const safeResponse = moderation.message || "Let's keep our conversation focused on learning!";
    return textAsUIStream(safeResponse, { intent: 'BLOCKED' });
  }

  // --- Safety Layer: PII Masking ---
  const piiResult = maskPII(prompt);
  if (piiResult.hadPII) {
    console.log('[Safety] PII detected and masked:', piiResult.detections.map(d => d.type));
  }
  const safePrompt = piiResult.masked;
  // Replace the user message content with the masked version for LLM processing
  const safeMessages = messages.map((m) =>
    m === latestUser ? { ...m, content: safePrompt } : m
  );

  // Persist incoming user message (original, not masked — we store truthfully)
  if (effectiveUserId && latestUser) {
    await saveMessage(effectiveUserId, sessionId, latestUser as ChatMessage);
  }

  const history = await loadHistory(effectiveUserId, sessionId);
  const combinedHistory: ChatMessage[] = [...history, ...safeMessages];

  // --- Semantic Cache: Check for similar previous responses ---
  const cached = await getCachedResponse(safePrompt);
  if (cached && !imageUrl) {
    console.log('[Chat] Semantic cache hit, similarity:', cached.similarity.toFixed(4));
    if (effectiveUserId) {
      try {
        await saveMessage(effectiveUserId, sessionId, { role: 'assistant', content: cached.response });
      } catch {}
    }
    return textAsUIStream(cached.response, { intent: cached.intent });
  }

  // --- Observability: Create trace context ---
  const traceCtx = createTraceContext(effectiveUserId);

  let workflowState: AdelineGraphState;
  try {
    workflowState = await runWorkflow(safePrompt, {
      userId: effectiveUserId,
      gradeLevel,
      studentContext,
      conversationHistory: combinedHistory,
      ...(imageUrl ? { metadata: { imageUrl } } : {}),
    }, traceCtx);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('[LangGraph:workflow]', err);
    throw err;
  }

  const model = getModel(workflowState.selectedModel || loadConfig().models.default);
  console.log('[Chat] Selected model ID:', workflowState.selectedModel || loadConfig().models.default);
  console.log('[Chat] Intent:', workflowState.intent);
  console.log('[Chat] Has responseContent:', !!workflowState.responseContent);

  // Build metadata to send to client
  const messageMetadata = {
    intent: workflowState.intent,
    genUIPayload: workflowState.genUIPayload ?? null,
    gapNudge: workflowState.metadata?.gapNudge ?? null,
  };

  // If an agent already produced a response, stream it via UI message protocol
  if (workflowState.responseContent) {
    const agentResponse = workflowState.responseContent;
    console.log('[Chat] Using agent responseContent, length:', agentResponse.length);

    const stream = createUIMessageStream({
      execute: async ({ writer }) => {
        writer.write({ type: 'start', messageMetadata });
        writer.write({ type: 'text-start', id: 'agent-response' });
        writer.write({ type: 'text-delta', id: 'agent-response', delta: agentResponse });
        writer.write({ type: 'text-end', id: 'agent-response' });
        writer.write({ type: 'finish', finishReason: 'stop', messageMetadata });
      },
    });

    // Save the response
    if (effectiveUserId) {
      try {
        await Promise.all([
          saveMessage(effectiveUserId, sessionId, { role: 'assistant', content: agentResponse }),
          (prisma as any).conversationMemory.create({
            data: {
              userId: effectiveUserId,
              sessionId,
              role: 'ASSISTANT',
              content: agentResponse,
              metadata: { genUIPayload: workflowState.genUIPayload },
            },
          }),
        ]);
      } catch (err) {
        console.error('[chat:saveAgentResponse]', err);
      }
    }

    // Cache the response for future similar queries
    cacheResponse(safePrompt, agentResponse, workflowState.intent || 'CHAT').catch(() => {});
    forceFlush().catch(() => {});

    // Increment message count for subscription tracking
    if (effectiveUserId) incrementMessageCount(effectiveUserId).catch(() => {});

    return createUIMessageStreamResponse({ stream });
  }

  // No agent response - use streamText for general chat
  const result = streamText({
    model,
    system: buildSystemPrompt(),
    messages,
    onFinish: async ({ text, usage }) => {
      console.log('[Chat] Stream finished. Text length:', text.length);
      recordTrace(traceCtx, {
        agentNode: 'streamChat',
        modelId: workflowState.selectedModel || loadConfig().models.default,
        promptTokens: usage?.inputTokens ?? 0,
        outputTokens: usage?.outputTokens ?? 0,
        totalTokens: (usage?.inputTokens ?? 0) + (usage?.outputTokens ?? 0),
        latencyMs: 0,
        success: true,
      });
      forceFlush().catch(() => {});
      // Increment message count for subscription tracking
      if (effectiveUserId) incrementMessageCount(effectiveUserId).catch(() => {});
      try {
        if (effectiveUserId) {
          const session = sessionId;
          await Promise.all([
            saveMessage(effectiveUserId, session, { role: 'assistant', content: text }),
            (prisma as any).conversationMemory.create({
              data: {
                userId: effectiveUserId,
                sessionId: session,
                role: 'ASSISTANT',
                content: text,
                metadata: { genUIPayload: workflowState.genUIPayload },
              },
            }),
          ]);
        }
      } catch (err) {
        console.error('[chat:onFinish]', err);
      }
    },
  });

  return result.toUIMessageStreamResponse({
    messageMetadata: () => messageMetadata,
  });
}
