import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import prisma from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) return new NextResponse('Unauthorized', { status: 401 });

    const { title, result } = await req.json();

    const transcriptEntry = await prisma.transcriptEntry.create({
      data: {
        userId: user.userId,
        activityName: `Story Workshop: ${title || result?.title || 'Untitled'}`,
        mappedSubject: 'ELA',
        creditsEarned: 0.1,
        dateCompleted: new Date(),
        notes: result?.opening?.slice(0, 200) || '',
        metadata: result,
      },
    });

    return NextResponse.json({ success: true, transcriptEntry });
  } catch (error) {
    console.error('Story save error:', error);
    return NextResponse.json({ error: 'Failed to save story' }, { status: 500 });
  }
}

