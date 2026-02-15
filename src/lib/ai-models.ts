import { LanguageModel } from 'ai';
import { anthropic } from '@ai-sdk/anthropic';
import { google } from '@ai-sdk/google';
import { openai } from '@ai-sdk/openai';

/**
 * Returns the appropriate AI SDK model provider based on the model ID string.
 * Supports:
 * - OpenAI (gpt-*)
 * - Anthropic (claude-*)
 * - Google (gemini-*)
 */
export function getModel(modelId: string): LanguageModel {
  const id = modelId.toLowerCase();
  
  if (id.includes('gpt')) {
    return openai(modelId);
  }
  
  if (id.includes('claude')) {
    return anthropic(modelId);
  }
  
  if (id.includes('gemini') || id.includes('flash') || id.includes('pro')) {
    // Handle potential "models/" prefix if present in config, though typically SDK handles it
    // The google provider expects just the model name usually, but let's be safe
    const cleanId = modelId.replace(/^models\//, '');
    return google(cleanId);
  }

  // Fallback
  console.warn(`[getModel] Unknown model ID format: ${modelId}. Defaulting to Google.`);
  return google(modelId);
}

/**
 * Returns the appropriate AI SDK embedding model provider.
 * Supports:
 * - OpenAI (text-embedding-*)
 * - Google (text-embedding-004, etc.)
 */
export function getEmbeddingModel(modelId: string) {
  const id = modelId.toLowerCase();

  if (id.includes('text-embedding-3') || id.includes('ada')) {
    return openai.embedding(modelId);
  }

  if (id.includes('embedding-004') || id.includes('gemini')) {
    const cleanId = modelId.replace(/^models\//, '');
    return google.textEmbeddingModel(cleanId);
  }

  // Fallback
  console.warn(`[getEmbeddingModel] Unknown model ID: ${modelId}. Defaulting to Google text-embedding-004.`);
  return google.textEmbeddingModel(modelId);
}
