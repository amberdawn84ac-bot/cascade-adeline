import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import prisma from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) return new NextResponse('Unauthorized', { status: 401 });

    const { challenge, userAnswer } = await req.json();
    
    if (!challenge || !userAnswer) {
      return NextResponse.json({ error: 'Missing challenge or answer' }, { status: 400 });
    }

    const isCorrect = userAnswer.trim() === challenge.correctAnswer.trim();
    const creditsEarned = isCorrect ? 0.1 : 0.05; // 0.1 for correct, 0.05 for attempt

    // Mint credits via transcript entry
    const transcriptEntry = await prisma.transcriptEntry.create({
      data: {
        userId: user.userId,
        activityName: `Arcade Challenge: ${challenge.type}`,
        mappedSubject: challenge.subject || 'Mathematics',
        creditsEarned,
        dateCompleted: new Date(),
        notes: isCorrect 
          ? `Solved ${challenge.difficulty} ${challenge.type} challenge correctly` 
          : `Attempted ${challenge.difficulty} ${challenge.type} challenge`,
        metadata: {
          challenge,
          userAnswer,
          isCorrect,
          explanation: challenge.explanation,
        },
      },
    });

    return NextResponse.json({
      isCorrect,
      creditsEarned,
      explanation: challenge.explanation,
      transcriptEntry,
    });
  } catch (error) {
    console.error('Answer validation error:', error);
    return NextResponse.json({ error: 'Failed to validate answer' }, { status: 500 });
  }
}

