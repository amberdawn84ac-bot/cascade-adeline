import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getSessionUser } from '@/lib/auth';

/**
 * GET /api/analytics — Usage dashboard data.
 *
 * Query params:
 *   ?period=24h|7d|30d (default: 24h)
 *   ?userId=... (optional, filter by user)
 *
 * Returns: token usage, cost, latency, error rates, and per-agent breakdowns.
 */
export async function GET(req: NextRequest) {
  const sessionUser = await getSessionUser();
  const period = req.nextUrl.searchParams.get('period') || '24h';
  const filterUserId = req.nextUrl.searchParams.get('userId') || undefined;

  // Only admins or the user themselves can view analytics
  const effectiveUserId = sessionUser?.userId || filterUserId;

  const hoursMap: Record<string, number> = { '24h': 24, '7d': 168, '30d': 720 };
  const hours = hoursMap[period] ?? 24;
  const since = new Date(Date.now() - hours * 60 * 60 * 1000);

  try {
    const where = {
      createdAt: { gte: since },
      ...(filterUserId ? { userId: filterUserId } : {}),
    };

    // Aggregate totals
    const totals = await prisma.lLMTrace.aggregate({
      where,
      _sum: {
        promptTokens: true,
        outputTokens: true,
        totalTokens: true,
        estimatedCost: true,
        latencyMs: true,
      },
      _avg: {
        latencyMs: true,
        estimatedCost: true,
      },
      _count: true,
    });

    // Error count
    const errorCount = await prisma.lLMTrace.count({
      where: { ...where, success: false },
    });

    // Per-agent breakdown
    const agentBreakdown = await prisma.lLMTrace.groupBy({
      by: ['agentNode'],
      where,
      _sum: {
        totalTokens: true,
        estimatedCost: true,
        latencyMs: true,
      },
      _avg: {
        latencyMs: true,
      },
      _count: true,
    });

    // Per-model breakdown
    const modelBreakdown = await prisma.lLMTrace.groupBy({
      by: ['modelId'],
      where,
      _sum: {
        totalTokens: true,
        estimatedCost: true,
      },
      _count: true,
    });

    return NextResponse.json({
      period,
      since: since.toISOString(),
      totals: {
        calls: totals._count,
        promptTokens: totals._sum.promptTokens ?? 0,
        outputTokens: totals._sum.outputTokens ?? 0,
        totalTokens: totals._sum.totalTokens ?? 0,
        totalCostUSD: Number((totals._sum.estimatedCost ?? 0).toFixed(6)),
        avgLatencyMs: Math.round(totals._avg.latencyMs ?? 0),
        errorCount,
        errorRate: totals._count > 0 ? (errorCount / totals._count * 100).toFixed(1) + '%' : '0%',
      },
      byAgent: agentBreakdown.map((a) => ({
        agent: a.agentNode,
        calls: a._count,
        totalTokens: a._sum.totalTokens ?? 0,
        totalCostUSD: Number((a._sum.estimatedCost ?? 0).toFixed(6)),
        avgLatencyMs: Math.round(a._avg.latencyMs ?? 0),
      })),
      byModel: modelBreakdown.map((m) => ({
        model: m.modelId,
        calls: m._count,
        totalTokens: m._sum.totalTokens ?? 0,
        totalCostUSD: Number((m._sum.estimatedCost ?? 0).toFixed(6)),
      })),
    });
  } catch (err) {
    console.error('[API:analytics:GET]', err);
    return NextResponse.json({ error: 'Failed to fetch analytics' }, { status: 500 });
  }
}
