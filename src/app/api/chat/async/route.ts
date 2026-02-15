import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { maskPII } from '@/lib/safety/pii-masker';
import { moderateContent } from '@/lib/safety/content-moderator';
import { createJob } from '@/lib/jobs/queue';
import { processJob } from '@/lib/jobs/processor';

/**
 * POST /api/chat/async — Submit a chat message for async processing.
 *
 * Returns 202 Accepted with a jobId immediately.
 * The client then polls GET /api/jobs/[id] or connects to SSE for the result.
 *
 * This endpoint is for long-running agent chains (INVESTIGATE, IMAGE_LOG)
 * that might timeout on serverless if done synchronously.
 */
export async function POST(req: NextRequest) {
  const sessionUser = await getSessionUser();
  const body = await req.json();
  const { messages, userId, gradeLevel, studentContext, imageUrl } = body as {
    messages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>;
    userId?: string;
    gradeLevel?: string;
    studentContext?: any;
    imageUrl?: string;
  };

  const effectiveUserId = sessionUser?.userId || userId;
  const sessionId = req.headers.get('x-session-id') || 'default';

  if (!Array.isArray(messages) || messages.length === 0) {
    return NextResponse.json({ error: 'Invalid messages' }, { status: 400 });
  }

  const latestUser = [...messages].reverse().find((m) => m.role === 'user');
  const prompt = latestUser?.content || '';

  // Safety checks
  const moderation = await moderateContent(prompt);
  if (moderation.severity === 'blocked') {
    return NextResponse.json({
      jobId: null,
      immediate: true,
      result: moderation.message || "Let's keep our conversation focused on learning!",
    });
  }

  const piiResult = maskPII(prompt);
  const safePrompt = piiResult.masked;
  const safeMessages = messages.map((m) =>
    m === latestUser ? { ...m, content: safePrompt } : m
  );

  // Create job
  const jobId = await createJob({
    userId: effectiveUserId,
    sessionId,
    prompt: safePrompt,
    metadata: imageUrl ? { imageUrl } : undefined,
  });

  // Fire and forget — process in background
  // On Vercel, this runs in the same invocation but after the response is sent
  // via waitUntil (Next.js 15+) or just as a dangling promise
  const processingPromise = processJob(jobId, safePrompt, {
    userId: effectiveUserId,
    gradeLevel,
    studentContext,
    conversationHistory: safeMessages,
    ...(imageUrl ? { metadata: { imageUrl } } : {}),
  });

  // Process in background — catch errors to avoid unhandled rejections
  processingPromise.catch((err) => console.error('[AsyncChat] Background processing error:', err));

  return NextResponse.json({ jobId }, { status: 202 });
}
