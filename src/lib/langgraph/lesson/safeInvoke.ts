import { jsonrepair } from 'jsonrepair';
import { z } from 'zod';
import type { ChatOpenAI } from '@langchain/openai';

type MessageParam = { role: string; content: string | any[] };

/**
 * Invoke a withStructuredOutput model with automatic JSON repair fallback.
 *
 * Uses `includeRaw: true` so we always have the raw text even when parsing fails.
 * If the model truncates mid-JSON (token limit hit), jsonrepair closes the open
 * structures before re-parsing against the Zod schema.
 *
 * Pass `maxTokens` on the ChatOpenAI constructor — not here.
 */
export async function safeStructuredInvoke<T>(
  model: ChatOpenAI,
  messages: MessageParam[],
  schema: z.ZodType<T>,
): Promise<T> {
  const wrappedModel = model.withStructuredOutput(schema, { includeRaw: true });
  const result = await wrappedModel.invoke(messages as any);

  // Happy path: LangChain parsed it successfully
  if (result.parsed != null) {
    return result.parsed as T;
  }

  // Fallback: raw text exists but parsing failed — attempt JSON repair
  const rawText: string =
    (result.raw as any)?.content ??
    (result.raw as any)?.text ??
    '';

  if (!rawText) {
    throw new Error('[safeStructuredInvoke] No raw text available for repair');
  }

  console.warn('[safeStructuredInvoke] Attempting JSON repair on truncated response');

  // Extract the JSON object/array from the raw text (strip any preamble)
  const jsonStart = rawText.search(/[{[]/);
  const trimmed = jsonStart >= 0 ? rawText.slice(jsonStart) : rawText;

  const repaired = jsonrepair(trimmed);
  const parsed = JSON.parse(repaired);
  return schema.parse(parsed);
}
