import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { getDueReviews, recordReview } from '@/lib/spaced-repetition';

/**
 * GET /api/reviews — Fetch due reviews for the current user.
 * Query params: ?limit=10&subject=Math
 */
export async function GET(req: NextRequest) {
  const sessionUser = await getSessionUser();
  const userId = sessionUser?.userId || req.nextUrl.searchParams.get('userId');

  if (!userId) {
    return NextResponse.json({ error: 'userId required' }, { status: 400 });
  }

  const limit = Number(req.nextUrl.searchParams.get('limit')) || 10;
  const subjectArea = req.nextUrl.searchParams.get('subject') || undefined;

  try {
    const reviews = await getDueReviews(userId, { limit, subjectArea });
    return NextResponse.json({ reviews, count: reviews.length });
  } catch (err) {
    console.error('[API:reviews:GET]', err);
    return NextResponse.json({ error: 'Failed to fetch reviews' }, { status: 500 });
  }
}

/**
 * POST /api/reviews — Record a review result.
 * Body: { conceptId: string, quality: number (0-5) }
 */
export async function POST(req: NextRequest) {
  const sessionUser = await getSessionUser();
  const body = await req.json();
  const { conceptId, quality, userId: bodyUserId } = body as {
    conceptId?: string;
    quality?: number;
    userId?: string;
  };

  const userId = sessionUser?.userId || bodyUserId;

  if (!userId || !conceptId || quality === undefined) {
    return NextResponse.json(
      { error: 'userId, conceptId, and quality (0-5) are required' },
      { status: 400 }
    );
  }

  const q = Math.max(0, Math.min(5, Math.round(quality)));

  try {
    const result = await recordReview(userId, conceptId, q);
    return NextResponse.json({
      success: true,
      nextReviewAt: result.nextReviewAt.toISOString(),
      intervalDays: result.interval,
      masteryDelta: result.masteryDelta,
    });
  } catch (err) {
    console.error('[API:reviews:POST]', err);
    return NextResponse.json({ error: 'Failed to record review' }, { status: 500 });
  }
}
