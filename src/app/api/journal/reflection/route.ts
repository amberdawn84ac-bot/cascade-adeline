import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import prisma from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { prompt, content } = await req.json();
    if (!prompt || !content) {
      return NextResponse.json({ error: 'prompt and content are required' }, { status: 400 });
    }

    // Get today's date at midnight for consistent date matching
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Upsert reflection for today
    const reflection = await prisma.dailyReflection.upsert({
      where: {
        studentId_date: {
          studentId: user.userId,
          date: today,
        },
      },
      create: {
        studentId: user.userId,
        date: today,
        prompt,
        content,
      },
      update: {
        prompt,
        content,
        createdAt: new Date(), // Update timestamp when overwriting
      },
    });

    console.log('[journal/reflection] Saved reflection for user:', user.userId);

    return NextResponse.json({ success: true, reflection });
  } catch (error) {
    console.error('[journal/reflection] Error saving reflection:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({
      error: 'Failed to save reflection',
      details: errorMessage,
    }, { status: 500 });
  }
}
