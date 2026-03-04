import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import prisma from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) return new NextResponse('Unauthorized', { status: 401 });

    const { problem, result } = await req.json();

    const transcriptEntry = await prisma.transcriptEntry.create({
      data: {
        userId: user.userId,
        activityName: `Geometry: ${problem?.slice(0, 60) || 'Problem Solved'}`,
        mappedSubject: 'Math',
        creditsEarned: 0.1,
        dateCompleted: new Date(),
        notes: result?.answer || '',
        metadata: { problem, ...result },
      },
    });

    return NextResponse.json({ success: true, transcriptEntry });
  } catch (error) {
    console.error('Geometry save error:', error);
    return NextResponse.json({ error: 'Failed to save geometry work' }, { status: 500 });
  }
}
