import { NextRequest } from 'next/server';
import { streamText } from 'ai';
import { StreamData } from 'ai/server';
import { anthropic } from '@ai-sdk/anthropic';
import { google } from '@ai-sdk/google';
import { openai } from '@ai-sdk/openai';
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
import { AdelineGraphState } from '@/lib/langgraph/types';
import { getSessionUser } from '@/lib/auth';

function pickModelProvider(modelId: string) {
  const id = modelId.toLowerCase();
  if (id.includes('claude')) return anthropic(modelId);
  if (id.includes('gpt')) return openai(modelId);
  return google(modelId);
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
      role: message.role.toUpperCase() as any,
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
): Promise<AdelineGraphState> {
  try {
    return await node(state);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error(`[LangGraph:${name}]`, err);
    const metadata = { ...(state.metadata || {}), errors: [...(((state.metadata as any)?.errors as string[]) || []), `${name} failed`] };
    return { ...state, metadata };
  }
}

async function runWorkflow(prompt: string, baseState: Partial<AdelineGraphState>): Promise<AdelineGraphState> {
  let state: AdelineGraphState = {
    prompt,
    ...baseState,
  } as AdelineGraphState;

  state = await safeNode('router', router, state);

  switch (state.intent) {
    case 'LIFE_LOG':
      state = await safeNode('lifeCreditLogger', lifeCreditLogger, state);
      break;
    case 'INVESTIGATE':
      state = await safeNode('discernmentEngine', discernmentEngine, state);
      break;
    case 'BRAINSTORM':
      state = await safeNode('projectBrainstormer', projectBrainstormer, state);
      break;
    case 'OPPORTUNITY':
      state = await safeNode('opportunityScout', opportunityScout, state);
      break;
    default:
      break;
  }

  state = await safeNode('genUIPlanner', genUIPlanner, state);
  state = await safeNode('gapDetector', gapDetector, state);
  return state;
}

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for') || 'unknown';
  const sessionUser = await getSessionUser();
  const body = await req.json();
  const { messages, userId, gradeLevel, studentContext } = body as {
    messages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>;
    userId?: string;
    gradeLevel?: string;
    studentContext?: AdelineGraphState['studentContext'];
  };

  const effectiveUserId = sessionUser?.userId || userId;
  const rateKey = effectiveUserId ? `chat:${effectiveUserId}` : `chat:${ip}`;
  if (!(await rateLimit(rateKey, CHAT_RATE_LIMIT, 60))) {
    return new Response('Rate limit exceeded', { status: 429 });
  }
  if (!isValidMessages(messages)) return new Response('Invalid messages payload', { status: 400 });

  const latestUser = [...messages].reverse().find((m) => m.role === 'user');
  const prompt = latestUser?.content || '';
  const sessionId = req.headers.get('x-session-id') || 'default';

  // Persist incoming user message
  if (effectiveUserId && latestUser) {
    await saveMessage(effectiveUserId, sessionId, latestUser as ChatMessage);
  }

  const history = await loadHistory(effectiveUserId, sessionId);
  const combinedHistory: ChatMessage[] = [...history, ...messages];

  let workflowState: AdelineGraphState;
  try {
    workflowState = await runWorkflow(prompt, {
      userId: effectiveUserId,
      gradeLevel,
      studentContext,
      conversationHistory: combinedHistory,
    });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('[LangGraph:workflow]', err);
    const fallback = 'I hit a snag while thinking that through, but I’m still here. Could you rephrase or try again?';
    return new Response(fallback, { status: 200 });
  }

  const model = pickModelProvider(workflowState.selectedModel || loadConfig().models.default);
  const data = new StreamData();
  if (workflowState.genUIPayload) {
    data.append({ genUIPayload: workflowState.genUIPayload });
  }
  if (workflowState.metadata && (workflowState.metadata as any).gapNudge) {
    data.append({ gapNudge: (workflowState.metadata as any).gapNudge });
  }

  const result = streamText({
    model,
    system: buildSystemPrompt(),
    messages,
    onFinish: async ({ text }) => {
      if (userId) {
        const session = sessionId;
        await Promise.all([
          saveMessage(userId, session, { role: 'assistant', content: text }),
          prisma.conversationMemory.create({
            data: {
              userId,
              sessionId: session,
              role: 'assistant',
              content: text,
              metadata: { genUIPayload: workflowState.genUIPayload },
            },
          }),
        ]);
      }
      data.close();
    },
  });

  return (result as any).toDataStreamResponse({ data });
}
