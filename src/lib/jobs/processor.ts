import { markProcessing, completeJob, failJob, updateJobIntent } from './queue';
import { router } from '../langgraph/router';
import { lifeCreditLogger } from '../langgraph/lifeCreditLogger';
import { discernmentEngine } from '../langgraph/discernmentEngine';
import { projectBrainstormer } from '../langgraph/projectBrainstormer';
import { genUIPlanner } from '../langgraph/genUIPlanner';
import { opportunityScout } from '../langgraph/opportunityScout';
import { gapDetector } from '../langgraph/gapDetector';
import { reflectionCoach } from '../langgraph/reflectionCoach';
import { visionAnalyzer } from '../langgraph/visionAnalyzer';
import { AdelineGraphState } from '../langgraph/types';
import { loadConfig } from '../config';
import { getModel } from '../ai-models';
import { streamText } from 'ai';
import { createTraceContext, recordTrace, forceFlush, type TraceContext } from '../observability/tracer';

/**
 * Process an AI job asynchronously.
 *
 * This runs the full LangGraph workflow and updates the job record.
 * Designed to be called from an API route handler — runs in the same
 * serverless invocation but decoupled from the response.
 */

function buildSystemPrompt() {
  const config = loadConfig();
  return `${config.persona.name} — ${config.persona.role}. Voice: ${config.persona.voice}. Foundation: ${config.persona.foundation}. Core belief: ${config.persona.core_belief}.`;
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
    console.error(`[JobProcessor:${name}]`, err);
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
    const metadata = { ...(state.metadata || {}), errors: [...(state.metadata?.errors || []), `${name} failed`] };
    return { ...state, metadata };
  }
}

export async function processJob(
  jobId: string,
  prompt: string,
  baseState: Partial<AdelineGraphState>
): Promise<void> {
  const traceCtx = createTraceContext(baseState.userId);

  try {
    await markProcessing(jobId);

    let state: AdelineGraphState = {
      prompt,
      ...baseState,
    } as AdelineGraphState;

    // Run router
    state = await safeNode('router', router, state, traceCtx);
    console.log('[JobProcessor] Intent:', state.intent, 'Model:', state.selectedModel);

    // Update job with detected intent
    if (state.intent) {
      await updateJobIntent(jobId, state.intent);
    }

    // Run intent-specific agents
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

    // If an agent produced a response, use it
    if (state.responseContent) {
      await completeJob(jobId, state.responseContent, {
        intent: state.intent,
        genUIPayload: state.genUIPayload,
      });
    } else {
      // General chat — generate with streamText and collect
      const model = getModel(state.selectedModel || loadConfig().models.default);
      const messages = baseState.conversationHistory?.map((m) => ({
        role: m.role as 'user' | 'assistant' | 'system',
        content: m.content,
      })) || [{ role: 'user' as const, content: prompt }];

      const result = await streamText({
        model,
        system: buildSystemPrompt(),
        messages,
      });

      // Collect the full text
      let fullText = '';
      for await (const chunk of result.textStream) {
        fullText += chunk;
      }

      await completeJob(jobId, fullText, {
        intent: state.intent,
        genUIPayload: state.genUIPayload,
      });
    }

    await forceFlush();
  } catch (err) {
    console.error('[JobProcessor] Fatal error:', err);
    await failJob(jobId, err instanceof Error ? err.message : String(err));
    await forceFlush();
  }
}
