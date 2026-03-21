import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import prisma from '@/lib/db';
import { getStudentStandardsProgress } from '@/lib/services/standardsProgress';

/**
 * GET /api/standards/progress
 *
 * Returns the student's standards progress grouped by subject (with per-subject grade levels),
 * then by domain, then individual standards with mastery.
 *
 * Query params:
 *   - studentId (optional): parent/teacher viewing a child (must be their child or have teacher role)
 *   - jurisdiction (optional, default "Oklahoma")
 */
export async function GET(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const requestedStudentId = searchParams.get('studentId');
  const jurisdiction = searchParams.get('jurisdiction') ?? 'Oklahoma';

  // Resolve whose data to show
  let targetUserId = user.userId;

  if (requestedStudentId && requestedStudentId !== user.userId) {
    // Verify the requester is the parent of this student or has TEACHER role
    const requester = await prisma.user.findUnique({
      where: { id: user.userId },
      select: { role: true },
    });
    const isTeacher = requester?.role === 'TEACHER' || requester?.role === 'PARENT';

    if (!isTeacher) {
      // Check parent-child relationship
      const child = await prisma.user.findFirst({
        where: { id: requestedStudentId, parentId: user.userId },
        select: { id: true },
      });
      if (!child) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    targetUserId = requestedStudentId;
  }

  try {
    const result = await getStudentStandardsProgress(targetUserId, { jurisdiction });
    return NextResponse.json(result);
  } catch (err) {
    console.error('[standards/progress] Error:', err);
    return NextResponse.json({ error: 'Failed to load standards' }, { status: 500 });
  }
}
