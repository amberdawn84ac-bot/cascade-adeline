import { Redis } from '@upstash/redis';

// Upstash client sourced from env (UPSTASH_REDIS_REST_URL, UPSTASH_REDIS_REST_TOKEN)
// https://upstash.com/docs/redis/sdks/ts

// Validate required env vars before initialization - fail fast if misconfigured
if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
  console.error('[Redis] CRITICAL: Missing UPSTASH_REDIS_REST_URL or UPSTASH_REDIS_REST_TOKEN');
  console.error('[Redis] Create an Upstash Redis database at https://upstash.com and add credentials to your .env');
  throw new Error('Redis configuration missing. Set UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN environment variables.');
}

const redis = Redis.fromEnv();

export default redis;

