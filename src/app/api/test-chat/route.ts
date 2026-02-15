import { NextRequest, NextResponse } from 'next/server';
import { router } from '@/lib/langgraph/router';
import { lifeCreditLogger } from '@/lib/langgraph/lifeCreditLogger';
import { discernmentEngine } from '@/lib/langgraph/discernmentEngine';
import { projectBrainstormer } from '@/lib/langgraph/projectBrainstormer';
import { genUIPlanner } from '@/lib/langgraph/genUIPlanner';
import { reflectionCoach } from '@/lib/langgraph/reflectionCoach';
import { AdelineGraphState } from '@/lib/langgraph/types';

/**
 * GET /api/test-chat?prompt=...  — Debug endpoint to test the workflow pipeline.
 *
 * Runs the prompt through the router and intent-specific agents,
 * returns the raw workflow state as JSON. No auth required.
 *
 * Examples:
 *   /api/test-chat?prompt=I+baked+bread+today
 *   /api/test-chat?prompt=Who+funds+the+sugar+industry
 *   /api/test-chat?prompt=What+should+I+learn+today
 */
export async function GET(req: NextRequest) {
  const prompt = req.nextUrl.searchParams.get('prompt') || 'Hello Adeline!';

  let state: AdelineGraphState = {
    prompt,
    conversationHistory: [{ role: 'user', content: prompt }],
  } as AdelineGraphState;

  const steps: Array<{ node: string; intent?: string; duration: number; error?: string }> = [];

  // Router
  let start = performance.now();
  try {
    state = await router(state);
    steps.push({ node: 'router', intent: state.intent, duration: Math.round(performance.now() - start) });
  } catch (err) {
    steps.push({ node: 'router', duration: Math.round(performance.now() - start), error: String(err) });
    return NextResponse.json({ prompt, steps, error: 'Router failed' }, { status: 500 });
  }

  // Intent-specific agent
  start = performance.now();
  try {
    switch (state.intent) {
      case 'LIFE_LOG':
        state = await lifeCreditLogger(state);
        steps.push({ node: 'lifeCreditLogger', duration: Math.round(performance.now() - start) });
        break;
      case 'INVESTIGATE':
        state = await discernmentEngine(state);
        steps.push({ node: 'discernmentEngine', duration: Math.round(performance.now() - start) });
        break;
      case 'BRAINSTORM':
        state = await projectBrainstormer(state);
        steps.push({ node: 'projectBrainstormer', duration: Math.round(performance.now() - start) });
        break;
      case 'REFLECT':
        state = await reflectionCoach(state);
        steps.push({ node: 'reflectionCoach', duration: Math.round(performance.now() - start) });
        break;
      default:
        steps.push({ node: 'none (CHAT intent)', duration: 0 });
        break;
    }
  } catch (err) {
    steps.push({ node: state.intent || 'unknown', duration: Math.round(performance.now() - start), error: String(err) });
  }

  // GenUI planner
  start = performance.now();
  try {
    state = await genUIPlanner(state);
    steps.push({ node: 'genUIPlanner', duration: Math.round(performance.now() - start) });
  } catch (err) {
    steps.push({ node: 'genUIPlanner', duration: Math.round(performance.now() - start), error: String(err) });
  }

  return NextResponse.json({
    prompt,
    intent: state.intent,
    selectedModel: state.selectedModel,
    hasResponseContent: !!state.responseContent,
    responseContentPreview: state.responseContent?.substring(0, 300) || null,
    genUIPayload: state.genUIPayload || null,
    steps,
  });
}
