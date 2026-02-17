import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getSessionUser } from '@/lib/auth';

/**
 * GET /api/placement/report?assessmentId=... — Get placement report.
 */
export async function GET(req: NextRequest) {
  const assessmentId = req.nextUrl.searchParams.get('assessmentId');
  const sessionUser = await getSessionUser();

  if (!assessmentId) {
    // Get latest completed assessment for current user
    if (!sessionUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const latest = await prisma.placementAssessment.findFirst({
      where: { userId: sessionUser.userId, status: 'COMPLETED' },
      orderBy: { completedAt: 'desc' },
    });

    if (!latest) {
      return NextResponse.json({ error: 'No completed assessment found' }, { status: 404 });
    }

    return NextResponse.json({
      assessmentId: latest.id,
      results: latest.results,
      completedAt: latest.completedAt,
      learningProfile: latest.learningProfile,
    });
  }

  const assessment = await prisma.placementAssessment.findUnique({
    where: { id: assessmentId },
  });

  if (!assessment) {
    return NextResponse.json({ error: 'Assessment not found' }, { status: 404 });
  }

  if (assessment.status !== 'COMPLETED') {
    return NextResponse.json({ error: 'Assessment not yet completed' }, { status: 400 });
  }

  return NextResponse.json({
    assessmentId: assessment.id,
    results: assessment.results,
    completedAt: assessment.completedAt,
    learningProfile: assessment.learningProfile,
  });
}
