import prisma from '../db';
import redis from '../redis';

/**
 * Async AI Job Queue
 *
 * Serverless-compatible job queue using Postgres for state + Upstash Redis for notifications.
 * Designed for Vercel's serverless environment where traditional BullMQ (IORedis) won't work.
 *
 * Flow:
 * 1. Client sends chat → API creates AIJob (PENDING) → returns 202 + jobId
 * 2. API immediately starts processing in the same request (or a separate endpoint triggers it)
 * 3. Job updates status to PROCESSING → runs workflow → updates to COMPLETED/FAILED
 * 4. Client polls via SSE endpoint or GET /api/jobs/:id for result
 * 5. Redis pub/sub notifies SSE listeners when job completes
 */

export interface CreateJobParams {
  userId?: string;
  sessionId: string;
  prompt: string;
  metadata?: Record<string, unknown>;
}

export interface JobResult {
  id: string;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  intent?: string;
  result?: string;
  error?: string;
  metadata?: unknown;
  createdAt: Date;
  completedAt?: Date | null;
}

/**
 * Create a new job in PENDING state.
 */
export async function createJob(params: CreateJobParams): Promise<string> {
  const job = await prisma.aIJob.create({
    data: {
      userId: params.userId || null,
      sessionId: params.sessionId,
      prompt: params.prompt,
      status: 'PENDING',
      metadata: (params.metadata ?? {}) as any,
    },
  });

  return job.id;
}

/**
 * Mark a job as PROCESSING.
 */
export async function markProcessing(jobId: string): Promise<void> {
  await prisma.aIJob.update({
    where: { id: jobId },
    data: { status: 'PROCESSING', startedAt: new Date() },
  });
}

/**
 * Mark a job as COMPLETED with the result.
 */
export async function completeJob(
  jobId: string,
  result: string,
  metadata?: Record<string, unknown>
): Promise<void> {
  await prisma.aIJob.update({
    where: { id: jobId },
    data: {
      status: 'COMPLETED',
      result,
      completedAt: new Date(),
      ...(metadata ? { metadata: metadata as any } : {}),
    },
  });

  // Notify via Redis for SSE listeners
  await redis.publish(`job:${jobId}`, JSON.stringify({ status: 'COMPLETED', result }));
}

/**
 * Mark a job as FAILED with an error message.
 */
export async function failJob(jobId: string, error: string): Promise<void> {
  await prisma.aIJob.update({
    where: { id: jobId },
    data: {
      status: 'FAILED',
      error,
      completedAt: new Date(),
    },
  });

  await redis.publish(`job:${jobId}`, JSON.stringify({ status: 'FAILED', error }));
}

/**
 * Get job status and result.
 */
export async function getJob(jobId: string): Promise<JobResult | null> {
  const job = await prisma.aIJob.findUnique({ where: { id: jobId } });
  if (!job) return null;

  return {
    id: job.id,
    status: job.status,
    intent: job.intent ?? undefined,
    result: job.result ?? undefined,
    error: job.error ?? undefined,
    metadata: job.metadata,
    createdAt: job.createdAt,
    completedAt: job.completedAt,
  };
}

/**
 * Update the job's intent field (set after router runs).
 */
export async function updateJobIntent(jobId: string, intent: string): Promise<void> {
  await prisma.aIJob.update({
    where: { id: jobId },
    data: { intent },
  });
}

/**
 * Clean up old completed/failed jobs (retention policy).
 */
export async function cleanupOldJobs(olderThanDays = 7): Promise<number> {
  const cutoff = new Date(Date.now() - olderThanDays * 24 * 60 * 60 * 1000);
  const result = await prisma.aIJob.deleteMany({
    where: {
      status: { in: ['COMPLETED', 'FAILED'] },
      createdAt: { lt: cutoff },
    },
  });
  return result.count;
}
