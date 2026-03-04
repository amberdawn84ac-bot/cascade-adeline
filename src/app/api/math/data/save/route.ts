import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import prisma from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) return new NextResponse('Unauthorized', { status: 401 });

    const { data, result } = await req.json();

    const transcriptEntry = await prisma.transcriptEntry.create({
      data: {
        userId: user.userId,
        activityName: `Data Science: Dataset Analysis`,
        mappedSubject: 'Math',
        creditsEarned: 0.1,
        dateCompleted: new Date(),
        notes: `Mean: ${result?.mean}, Median: ${result?.median}, Mode: ${result?.mode}`,
        metadata: { data, ...result },
      },
    });

    return NextResponse.json({ success: true, transcriptEntry });
  } catch (error) {
    console.error('Data save error:', error);
    return NextResponse.json({ error: 'Failed to save data analysis' }, { status: 500 });
  }
}
