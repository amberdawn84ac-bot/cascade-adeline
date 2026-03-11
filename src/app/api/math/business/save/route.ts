import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import prisma from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) return new NextResponse('Unauthorized', { status: 401 });

    const { businessName, result } = await req.json();

    const transcriptEntry = await prisma.transcriptEntry.create({
      data: {
        userId: user.userId,
        activityName: `Business Math: ${businessName || 'Lemonade Stand'}`,
        mappedSubject: 'Math',
        creditsEarned: 0.1,
        dateCompleted: new Date(),
        notes: `Profit: ${result?.profit ?? 0} | Margin: ${result?.profitMargin ?? 'N/A'}`,
        metadata: result,
      },
    });

    return NextResponse.json({ success: true, transcriptEntry });
  } catch (error) {
    console.error('Business save error:', error);
    return NextResponse.json({ error: 'Failed to save business analysis' }, { status: 500 });
  }
}

