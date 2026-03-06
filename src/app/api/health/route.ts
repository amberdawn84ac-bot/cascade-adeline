import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import redis from '@/lib/redis';

/**
 * GET /api/health — System health check.
 *
 * Verifies all critical services: DB, Redis, OpenAI, Supabase.
 * Returns detailed status for production monitoring.
 */
export async function GET() {
  const checks: Record<string, { status: 'ok' | 'fail'; message?: string; latency?: number }> = {};

  // Check Postgres
  const dbStart = Date.now();
  try {
    await (prisma as any).$queryRaw`SELECT 1`;
    checks.database = { status: 'ok', latency: Date.now() - dbStart };
  } catch (error) {
    checks.database = { status: 'fail', message: String(error).substring(0, 100) };
  }

  // Check Redis
  const redisStart = Date.now();
  try {
    await redis.ping();
    checks.redis = { status: 'ok', latency: Date.now() - redisStart };
  } catch (error) {
    checks.redis = { status: 'fail', message: String(error).substring(0, 100) };
  }

  // Check OpenAI
  const openaiStart = Date.now();
  try {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      checks.openai = { status: 'fail', message: 'OPENAI_API_KEY not set' };
    } else {
      const response = await fetch('https://api.openai.com/v1/models', {
        headers: { 'Authorization': `Bearer ${apiKey}` },
        signal: AbortSignal.timeout(5000),
      });
      if (response.ok) {
        checks.openai = { status: 'ok', latency: Date.now() - openaiStart };
      } else {
        checks.openai = { status: 'fail', message: `HTTP ${response.status}` };
      }
    }
  } catch (error) {
    checks.openai = { status: 'fail', message: String(error).substring(0, 100) };
  }

  // Check Supabase configuration
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    if (!url || !anonKey) {
      checks.supabase = { status: 'fail', message: 'Supabase credentials not set' };
    } else {
      checks.supabase = { status: 'ok', message: 'Configured' };
    }
  } catch (error) {
    checks.supabase = { status: 'fail', message: String(error).substring(0, 100) };
  }

  const allOk = Object.values(checks).every((v) => v.status === 'ok');
  const failedServices = Object.entries(checks)
    .filter(([, v]) => v.status === 'fail')
    .map(([k]) => k);

  return NextResponse.json(
    {
      status: allOk ? 'healthy' : 'degraded',
      timestamp: new Date().toISOString(),
      version: '0.1.0',
      checks,
      ...(failedServices.length > 0 && { failedServices }),
    },
    { status: allOk ? 200 : 503 }
  );
}
