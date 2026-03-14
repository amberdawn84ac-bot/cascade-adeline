import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { generateAnalytics, getCohortAnalytics } from '@/lib/analytics/advanced-analytics-pipeline';
import prisma from '@/lib/db';

/**
 * GET /api/analytics/advanced
 *
 * Returns learning metrics, engagement metrics, and AI-generated insights.
 * Parents/teachers see their own cohort; students see their own data.
 *
 * Query params:
 *   ?period=7d|30d|24h  (default: 7d)
 *   ?cohort=true         (teachers only — returns cohort analytics for all students)
 */
export async function GET(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const period = (req.nextUrl.searchParams.get('period') ?? '7d') as '24h' | '7d' | '30d';
  const cohortMode = req.nextUrl.searchParams.get('cohort') === 'true';

  try {
    if (cohortMode && user.role === 'TEACHER') {
      // Cohort analytics: students assigned to this teacher via parentId relation
      const students = await prisma.user.findMany({
        where: { parentId: user.userId },
        select: { id: true },
        take: 40,
      });
      const cohortIds = students.map(s => s.id);
      const result = await getCohortAnalytics(cohortIds, period);
      return NextResponse.json(result);
    }

    if (cohortMode && user.role === 'PARENT') {
      // Cohort analytics: children of this parent
      const children = await prisma.user.findMany({
        where: { parentId: user.userId },
        select: { id: true },
      });
      const cohortIds = children.map(c => c.id);
      if (cohortIds.length === 0) {
        return NextResponse.json({ memberCount: 0, cohortMetrics: null, insights: [] });
      }
      const result = await getCohortAnalytics(cohortIds, period);
      return NextResponse.json(result);
    }

    // Individual analytics (student views own data, or parent/teacher views their own)
    const targetUserId = user.role === 'STUDENT' ? user.userId : user.userId;
    const result = await generateAnalytics(targetUserId, period);
    return NextResponse.json(result);
  } catch (err) {
    console.error('[API:analytics:advanced]', err);
    return NextResponse.json({ error: 'Failed to generate analytics' }, { status: 500 });
  }
}
