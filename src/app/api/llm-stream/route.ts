import { streamObject } from 'ai';
import { openai } from '@ai-sdk/openai';
import { z } from 'zod';

// CRITICAL: Edge runtime - NO Prisma imports allowed
export const runtime = 'edge';

// Generic schema for any structured LLM output
const genericSchema = z.record(z.any());

// Simple edge-compatible throttle using headers
const throttleMap = new Map<string, number>();

export async function POST(req: Request) {
  try {
    const { schema, prompt, systemPrompt, model = 'gpt-4o', temperature = 0.7, userId } = await req.json();

    if (!prompt) {
      return new Response(JSON.stringify({ error: 'Missing prompt' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Throttle check - prevent button mashing
    if (userId) {
      const now = Date.now();
      const lastRequest = throttleMap.get(userId);
      const cooldownMs = 5000; // 5 seconds

      if (lastRequest && (now - lastRequest) < cooldownMs) {
        const remainingMs = cooldownMs - (now - lastRequest);
        console.log(`[llm-stream] User ${userId} throttled (${remainingMs}ms remaining)`);
        return new Response(
          JSON.stringify({ 
            error: 'Too many requests',
            message: 'Please wait a moment before generating another challenge.',
            retryAfter: Math.ceil(remainingMs / 1000),
          }),
          {
            status: 429,
            headers: { 
              'Content-Type': 'application/json',
              'Retry-After': Math.ceil(remainingMs / 1000).toString(),
            },
          }
        );
      }

      throttleMap.set(userId, now);
    }

    // Parse the schema if it's a string (from JSON serialization)
    const parsedSchema = typeof schema === 'string' ? JSON.parse(schema) : schema;

    // Build the full prompt with system context
    const fullPrompt = systemPrompt 
      ? `${systemPrompt}\n\n${prompt}`
      : prompt;

    console.log('[llm-stream] Streaming with model:', model);

    const result = await streamObject({
      model: openai(model),
      schema: parsedSchema || genericSchema,
      prompt: fullPrompt,
      temperature,
    });

    return result.toTextStreamResponse();
  } catch (error) {
    console.error('[llm-stream] Error:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Failed to stream LLM response',
        details: error instanceof Error ? error.message : 'Unknown error',
      }),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}
