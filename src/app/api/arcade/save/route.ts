import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import prisma from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) return new NextResponse('Unauthorized', { status: 401 });

    const { title, code, type } = await req.json();
    if (!code) return NextResponse.json({ error: 'Missing code' }, { status: 400 });

    const activityName = type === 'challenge'
      ? `Coding Challenge: ${title || 'Code Snippet'}`
      : `Game Lab: ${title || 'My Game'}`;

    const transcriptEntry = await prisma.transcriptEntry.create({
      data: {
        userId: user.userId,
        activityName,
        mappedSubject: 'Technology',
        creditsEarned: 0.1,
        dateCompleted: new Date(),
        notes: `Student built and submitted a ${type === 'challenge' ? 'coding challenge' : 'game'} project.`,
        metadata: { code, title, type },
      },
    });

    return NextResponse.json({ success: true, transcriptEntry });
  } catch (error) {
    console.error('Arcade save error:', error);
    return NextResponse.json({ error: 'Failed to save project' }, { status: 500 });
  }
}

