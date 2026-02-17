import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getSessionUser } from '@/lib/auth';

/**
 * POST /api/placement/start — Start or resume a placement assessment.
 *
 * Ported from old dear-adeline, adapted for Prisma.
 * Supports both logged-in users (userId) and pre-signup (sessionId).
 */
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { sessionId, displayName, grade, interests, learningStyle } = body;

  const sessionUser = await getSessionUser();
  const userId = sessionUser?.userId || body.userId;

  if (!userId && !sessionId) {
    return NextResponse.json({ error: 'User ID or Session ID required' }, { status: 400 });
  }

  // Check for recent completed assessment (within 30 days)
  if (userId) {
    const recent = await prisma.placementAssessment.findFirst({
      where: {
        userId,
        status: 'COMPLETED',
        completedAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
      },
      orderBy: { completedAt: 'desc' },
    });

    if (recent) {
      return NextResponse.json({
        message: 'Student has a recent placement assessment',
        assessmentId: recent.id,
        alreadyCompleted: true,
        results: recent.results,
      });
    }
  }

  // Check for in-progress assessment
  const inProgress = await prisma.placementAssessment.findFirst({
    where: {
      ...(userId ? { userId } : {}),
      status: 'IN_PROGRESS',
    },
    orderBy: { startedAt: 'desc' },
  });

  if (inProgress) {
    const responses = inProgress.responses as Record<string, any> || {};
    const lastKey = Object.keys(responses).sort((a, b) => Number(b) - Number(a))[0];
    const lastQuestion = lastKey ? responses[lastKey]?.question : null;

    return NextResponse.json({
      assessmentId: inProgress.id,
      resumed: true,
      currentSubject: inProgress.currentSubject,
      lastQuestion: lastQuestion || getFirstQuestion(displayName, grade, interests),
    });
  }

  // Create new assessment
  const name = displayName || 'friend';
  const firstQuestion = getFirstQuestion(name, grade, interests);

  if (!userId) {
    return NextResponse.json({ error: 'User ID required to start assessment' }, { status: 400 });
  }

  const assessment = await prisma.placementAssessment.create({
    data: {
      user: { connect: { id: userId } },
      currentSubject: 'introduction',
      status: 'IN_PROGRESS',
      responses: {
        '0': {
          question: firstQuestion,
          answer: null,
          timestamp: new Date().toISOString(),
        },
      },
      learningProfile: {
        interests: interests || [],
        style: learningStyle || 'mixed',
        pace: 'moderate',
      },
    },
  });

  return NextResponse.json({
    assessmentId: assessment.id,
    firstQuestion,
  });
}

function getFirstQuestion(name: string, grade?: string, interests?: string[]): string {
  if (interests && interests.length > 0) {
    return `Hi ${name}! I see you're into ${interests.join(', ')} and going into ${grade || 'school'}. Let's try 3 quick questions to see where you're at!`;
  }
  return `Hi ${name}! To get started, I see you're going into ${grade || 'school'}. Let's try a few fun questions to see if that feels like the right fit!`;
}
