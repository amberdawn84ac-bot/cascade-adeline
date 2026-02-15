import prisma from '../db';
import { randomUUID } from 'crypto';

/**
 * LLM Call Tracer
 *
 * Tracks every LLM invocation with:
 * - Token usage (prompt, output, total)
 * - Latency (ms)
 * - Estimated cost (USD)
 * - Agent node that made the call
 * - Success/failure status
 *
 * Traces are grouped by traceId (one per user request).
 */

// --- Cost Estimation (per 1M tokens, USD) ---
const COST_PER_1M: Record<string, { input: number; output: number }> = {
  'gpt-4o': { input: 2.50, output: 10.00 },
  'gpt-4o-mini': { input: 0.15, output: 0.60 },
  'gpt-4-turbo': { input: 10.00, output: 30.00 },
  'claude-3-sonnet-20240229': { input: 3.00, output: 15.00 },
  'claude-3-haiku-20240307': { input: 0.25, output: 1.25 },
  'gemini-1.5-flash': { input: 0.075, output: 0.30 },
  'gemini-1.5-pro': { input: 1.25, output: 5.00 },
};

function estimateCost(modelId: string, promptTokens: number, outputTokens: number): number {
  const id = modelId.toLowerCase();
  const rates = Object.entries(COST_PER_1M).find(([key]) => id.includes(key));
  if (!rates) return 0;
  const [, cost] = rates;
  return (promptTokens / 1_000_000) * cost.input + (outputTokens / 1_000_000) * cost.output;
}

// --- Types ---

export interface TraceContext {
  traceId: string;
  userId?: string;
}

export interface TraceEntry {
  agentNode: string;
  modelId: string;
  promptTokens: number;
  outputTokens: number;
  totalTokens: number;
  latencyMs: number;
  success: boolean;
  errorMessage?: string;
  metadata?: Record<string, unknown>;
}

// --- In-memory buffer for batch writes ---

const traceBuffer: Array<TraceEntry & TraceContext> = [];
let flushTimer: ReturnType<typeof setTimeout> | null = null;
const FLUSH_INTERVAL_MS = 5000;
const FLUSH_BATCH_SIZE = 20;

async function flushTraces() {
  if (traceBuffer.length === 0) return;

  const batch = traceBuffer.splice(0, FLUSH_BATCH_SIZE);

  try {
    await prisma.lLMTrace.createMany({
      data: batch.map((t) => ({
        traceId: t.traceId,
        agentNode: t.agentNode,
        modelId: t.modelId,
        promptTokens: t.promptTokens,
        outputTokens: t.outputTokens,
        totalTokens: t.totalTokens,
        latencyMs: t.latencyMs,
        estimatedCost: estimateCost(t.modelId, t.promptTokens, t.outputTokens),
        success: t.success,
        errorMessage: t.errorMessage || null,
        userId: t.userId || null,
        metadata: (t.metadata ?? undefined) as any,
      })),
    });
  } catch (err) {
    console.error('[Tracer] Failed to flush traces:', err);
    // Don't re-add to buffer to avoid infinite growth
  }

  // Schedule next flush if buffer still has items
  if (traceBuffer.length > 0) {
    scheduleFlush();
  }
}

function scheduleFlush() {
  if (flushTimer) return;
  flushTimer = setTimeout(() => {
    flushTimer = null;
    flushTraces();
  }, FLUSH_INTERVAL_MS);
}

// --- Public API ---

/**
 * Create a new trace context for a request.
 */
export function createTraceContext(userId?: string): TraceContext {
  return { traceId: randomUUID(), userId };
}

/**
 * Record a trace entry. Buffered and flushed in batches.
 */
export function recordTrace(ctx: TraceContext, entry: TraceEntry): void {
  traceBuffer.push({ ...ctx, ...entry });

  // Log to console for immediate visibility
  const costStr = estimateCost(entry.modelId, entry.promptTokens, entry.outputTokens).toFixed(6);
  console.log(
    `[Trace] ${entry.agentNode} | ${entry.modelId} | ${entry.latencyMs}ms | ` +
    `${entry.totalTokens} tokens | $${costStr} | ${entry.success ? 'OK' : 'FAIL'}`
  );

  if (traceBuffer.length >= FLUSH_BATCH_SIZE) {
    flushTraces();
  } else {
    scheduleFlush();
  }
}

/**
 * Helper: wrap an async LLM call with automatic tracing.
 */
export async function traced<T>(
  ctx: TraceContext,
  agentNode: string,
  modelId: string,
  fn: () => Promise<T>
): Promise<T> {
  const start = performance.now();
  try {
    const result = await fn();
    const latencyMs = Math.round(performance.now() - start);

    // Try to extract token usage from AI SDK result
    const usage = (result as any)?.usage;
    const promptTokens = usage?.promptTokens ?? 0;
    const outputTokens = usage?.completionTokens ?? usage?.outputTokens ?? 0;

    recordTrace(ctx, {
      agentNode,
      modelId,
      promptTokens,
      outputTokens,
      totalTokens: promptTokens + outputTokens,
      latencyMs,
      success: true,
    });

    return result;
  } catch (err) {
    const latencyMs = Math.round(performance.now() - start);
    recordTrace(ctx, {
      agentNode,
      modelId,
      promptTokens: 0,
      outputTokens: 0,
      totalTokens: 0,
      latencyMs,
      success: false,
      errorMessage: err instanceof Error ? err.message : String(err),
    });
    throw err;
  }
}

/**
 * Force flush all pending traces (call on shutdown or at end of request).
 */
export async function forceFlush(): Promise<void> {
  if (flushTimer) {
    clearTimeout(flushTimer);
    flushTimer = null;
  }
  await flushTraces();
}

/**
 * Get trace summary for a specific request.
 */
export async function getTraceSummary(traceId: string) {
  const traces = await prisma.lLMTrace.findMany({
    where: { traceId },
    orderBy: { createdAt: 'asc' },
  });

  const totalLatency = traces.reduce((sum, t) => sum + t.latencyMs, 0);
  const totalTokens = traces.reduce((sum, t) => sum + t.totalTokens, 0);
  const totalCost = traces.reduce((sum, t) => sum + t.estimatedCost, 0);
  const errors = traces.filter((t) => !t.success);

  return {
    traceId,
    callCount: traces.length,
    totalLatencyMs: totalLatency,
    totalTokens,
    totalCostUSD: totalCost,
    errorCount: errors.length,
    calls: traces.map((t) => ({
      agentNode: t.agentNode,
      modelId: t.modelId,
      latencyMs: t.latencyMs,
      tokens: t.totalTokens,
      cost: t.estimatedCost,
      success: t.success,
      error: t.errorMessage,
    })),
  };
}
