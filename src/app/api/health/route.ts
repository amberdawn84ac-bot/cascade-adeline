import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import redis from '@/lib/redis';

/**
 * GET /api/health — System health check.
 *
 * Verifies DB and Redis connectivity. Returns status + timestamps.
 */
export async function GET() {
  const checks: Record<string, 'ok' | 'fail'> = {};

  // Check Postgres
  try {
    await prisma.user.count();
    checks.database = 'ok';
  } catch {
    checks.database = 'fail';
  }

  // Check Redis
  try {
    await redis.ping();
    checks.redis = 'ok';
  } catch {
    checks.redis = 'fail';
  }

  const allOk = Object.values(checks).every((v) => v === 'ok');

  return NextResponse.json(
    {
      status: allOk ? 'healthy' : 'degraded',
      timestamp: new Date().toISOString(),
      version: '0.1.0',
      checks,
    },
    { status: allOk ? 200 : 503 }
  );
}
