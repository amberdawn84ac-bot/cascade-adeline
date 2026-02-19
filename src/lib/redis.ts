import { Redis } from '@upstash/redis';

// Upstash client sourced from env (UPSTASH_REDIS_REST_URL, UPSTASH_REDIS_REST_TOKEN)
// https://upstash.com/docs/redis/sdks/ts
const redis = Redis.fromEnv();

export default redis;
