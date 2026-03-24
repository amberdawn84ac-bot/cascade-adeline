import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';

async function getRedis() {
  try {
    const { default: redis } = await import('@/lib/redis');
    return redis;
  } catch {
    return null;
  }
}

export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const redis = await getRedis();
    if (!redis) {
      return NextResponse.json({
        messagesUsed: 0,
        messagesLimit: 30,
        estimatedCost: 0,
        error: 'Rate limiter unavailable'
      });
    }

    // Get rate limit data from Redis
    const rateLimitKey = `rate_limit:${user.userId}`;
    const data = await redis.get<{ count: number; resetTime: number }>(rateLimitKey);

    // Default rate limits (can be customized per user tier)
    const messagesLimit = 30; // 30 messages per hour default
    const messagesUsed = data?.count || 0;
    
    // Estimate cost (rough approximation: $0.01 per message)
    const estimatedCost = messagesUsed * 0.01;

    // Calculate reset time
    const resetTime = data?.resetTime 
      ? new Date(data.resetTime).toISOString()
      : new Date(Date.now() + 3600000).toISOString(); // 1 hour from now

    return NextResponse.json({
      messagesUsed,
      messagesLimit,
      estimatedCost,
      resetTime
    });

  } catch (error) {
    console.error('[usage/credits] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch usage data' },
      { status: 500 }
    );
  }
}
