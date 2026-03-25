import { NextRequest, NextResponse } from 'next/server';
import redis from '@/lib/redis';

interface RateLimitConfig {
  maxRequests: number;
  windowSeconds: number;
  identifier?: (req: NextRequest) => string;
}

interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
}

/**
 * Redis-based rate limiter for API endpoints
 * Uses sliding window algorithm for accurate rate limiting
 */
export async function rateLimit(
  req: NextRequest,
  config: RateLimitConfig
): Promise<RateLimitResult> {
  const { maxRequests, windowSeconds, identifier } = config;
  
  // Get identifier (IP address or custom function)
  const id = identifier 
    ? identifier(req) 
    : req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
  
  const key = `ratelimit:${id}`;
  const now = Date.now();
  const windowMs = windowSeconds * 1000;
  const windowStart = now - windowMs;

  try {
does i    // Add current request timestamp
    await redis.zadd(key, { score: now, member: `${now}` });
    
    // Remove old entries outside the window
    await redis.zremrangebyscore(key, 0, windowStart);
    
    // Count requests in current window
    const count = await redis.zcard(key);
    
    // Set expiration on the key
    await redis.expire(key, windowSeconds);
    
    const remaining = Math.max(0, maxRequests - count);
    const reset = now + windowMs;
    
    return {
      success: count <= maxRequests,
      limit: maxRequests,
      remaining,
      reset,
    };
  } catch (error) {
    console.error('[RateLimit] Redis error (allowing request):', error);
    // On Redis failure, allow the request (fail open)
    return {
      success: true,
      limit: maxRequests,
      remaining: maxRequests,
      reset: now + windowMs,
    };
  }
}

/**
 * Rate limit middleware wrapper for API routes
 * Returns 429 if rate limit exceeded
 */
export async function withRateLimit(
  req: NextRequest,
  config: RateLimitConfig,
  handler: () => Promise<NextResponse>
): Promise<NextResponse> {
  const result = await rateLimit(req, config);
  
  if (!result.success) {
    return NextResponse.json(
      {
        error: 'Too many requests',
        code: 'RATE_LIMIT_EXCEEDED',
        details: {
          limit: result.limit,
          remaining: result.remaining,
          resetAt: new Date(result.reset).toISOString(),
        },
      },
      {
        status: 429,
        headers: {
          'X-RateLimit-Limit': result.limit.toString(),
          'X-RateLimit-Remaining': result.remaining.toString(),
          'X-RateLimit-Reset': result.reset.toString(),
          'Retry-After': Math.ceil((result.reset - Date.now()) / 1000).toString(),
        },
      }
    );
  }
  
  const response = await handler();
  
  // Add rate limit headers to successful responses
  response.headers.set('X-RateLimit-Limit', result.limit.toString());
  response.headers.set('X-RateLimit-Remaining', result.remaining.toString());
  response.headers.set('X-RateLimit-Reset', result.reset.toString());
  
  return response;
}

// Preset configurations for common use cases
export const RATE_LIMITS = {
  // Auth endpoints - strict limits to prevent brute force
  AUTH: { maxRequests: 5, windowSeconds: 60 }, // 5 requests per minute
  
  // Lesson generation - moderate limits (expensive operations)
  LESSON_GENERATION: { maxRequests: 10, windowSeconds: 60 }, // 10 per minute
  
  // General API - generous limits
  API: { maxRequests: 100, windowSeconds: 60 }, // 100 per minute
  
  // Public endpoints - very strict
  PUBLIC: { maxRequests: 20, windowSeconds: 60 }, // 20 per minute
};
