import { Redis } from '@upstash/redis';

// Upstash client sourced from env (UPSTASH_REDIS_REST_URL, UPSTASH_REDIS_REST_TOKEN)
// https://upstash.com/docs/redis/sdks/ts

function createRedisClient(): Redis {
  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
    console.warn('[Redis] Missing UPSTASH_REDIS_REST_URL or UPSTASH_REDIS_REST_TOKEN — caching disabled');
    // Return a no-op proxy so callers don't crash when Redis is unconfigured
    return new Proxy({} as Redis, {
      get: (_target, prop) => {
        if (prop === 'then') return undefined; // not a thenable
        return async () => null;
      },
    });
  }
  return Redis.fromEnv();
}

const redis = createRedisClient();

export default redis;

