import { embed } from 'ai';
import redis from './redis';
import { getEmbeddingModel } from './ai-models';
import { loadConfig } from './config';

/**
 * Semantic Cache ("Hippocampus Cache")
 *
 * Before hitting the LLM, embed the query and check Redis for a
 * "close enough" cached response (cosine similarity > threshold).
 *
 * Saves tokens and latency for repeated/similar questions.
 *
 * Storage: Redis hash with key = truncated embedding fingerprint
 * Each entry stores: { embedding: number[], response: string, intent: string, timestamp: number }
 */

const CACHE_PREFIX = 'semcache:';
const SIMILARITY_THRESHOLD = 0.92;
const CACHE_TTL_SECONDS = 3600; // 1 hour
const MAX_CACHE_ENTRIES = 500;

/**
 * Compute cosine similarity between two vectors.
 */
function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) return 0;
  let dot = 0, magA = 0, magB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    magA += a[i] * a[i];
    magB += b[i] * b[i];
  }
  const denom = Math.sqrt(magA) * Math.sqrt(magB);
  return denom === 0 ? 0 : dot / denom;
}

/**
 * Generate a short fingerprint from an embedding for Redis key bucketing.
 * Uses the first 8 dimensions quantized to create a rough locality hash.
 */
function embeddingFingerprint(embedding: number[]): string {
  return embedding.slice(0, 8).map((v) => (v > 0 ? '1' : '0')).join('');
}

/**
 * Look up a semantically similar cached response.
 * Returns the cached response if similarity > threshold, otherwise null.
 */
export async function getCachedResponse(
  query: string
): Promise<{ response: string; intent: string; similarity: number } | null> {
  try {
    const config = loadConfig();
    const embeddingModel = getEmbeddingModel(config.models.embeddings);

    const { embedding: queryEmbedding } = await embed({
      model: embeddingModel,
      value: query,
    });

    // Get the bucket key
    const bucket = embeddingFingerprint(queryEmbedding);
    const cacheKey = `${CACHE_PREFIX}${bucket}`;

    // Fetch all entries in this bucket
    const entries = await redis.lrange(cacheKey, 0, -1);
    if (!entries || entries.length === 0) return null;

    let bestMatch: { response: string; intent: string; similarity: number } | null = null;

    for (const raw of entries) {
      try {
        const entry = typeof raw === 'string' ? JSON.parse(raw) : raw;
        const similarity = cosineSimilarity(queryEmbedding, entry.embedding);

        if (similarity >= SIMILARITY_THRESHOLD) {
          if (!bestMatch || similarity > bestMatch.similarity) {
            bestMatch = {
              response: entry.response,
              intent: entry.intent || 'CHAT',
              similarity,
            };
          }
        }
      } catch {
        continue;
      }
    }

    if (bestMatch) {
      console.log(`[SemanticCache] HIT — similarity: ${bestMatch.similarity.toFixed(4)}`);
    }

    return bestMatch;
  } catch (err) {
    console.warn('[SemanticCache] Lookup failed:', err);
    return null;
  }
}

/**
 * Store a response in the semantic cache.
 */
export async function cacheResponse(
  query: string,
  response: string,
  intent: string
): Promise<void> {
  try {
    const config = loadConfig();
    const embeddingModel = getEmbeddingModel(config.models.embeddings);

    const { embedding: queryEmbedding } = await embed({
      model: embeddingModel,
      value: query,
    });

    const bucket = embeddingFingerprint(queryEmbedding);
    const cacheKey = `${CACHE_PREFIX}${bucket}`;

    const entry = JSON.stringify({
      embedding: queryEmbedding,
      response,
      intent,
      query: query.substring(0, 100), // truncated for debugging
      timestamp: Date.now(),
    });

    await redis.rpush(cacheKey, entry);
    await redis.expire(cacheKey, CACHE_TTL_SECONDS);

    // Trim bucket to prevent unbounded growth
    const len = await redis.llen(cacheKey);
    if (len > MAX_CACHE_ENTRIES) {
      await redis.ltrim(cacheKey, len - MAX_CACHE_ENTRIES, -1);
    }

    console.log(`[SemanticCache] STORED — bucket: ${bucket}, intent: ${intent}`);
  } catch (err) {
    console.warn('[SemanticCache] Store failed:', err);
  }
}
