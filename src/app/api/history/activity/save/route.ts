import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import prisma from '@/lib/db';
import { awardCreditsForActivity, createTranscriptEntryWithCredits } from '@/lib/learning/credit-award';

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) return new NextResponse('Unauthorized', { status: 401 });

    const body = await req.json();
    const { eventId, eventTitle, category, quizCorrect, quizTotal, timeSpent, type } = body;

    if (!eventId || !eventTitle) {
      return NextResponse.json({ error: 'Missing eventId or eventTitle' }, { status: 400 });
    }

    // Calculate credits based on activity type and completion
    let creditsEarned = 0.004; // Base: reading through an event
    
    // Bonus for quiz completion
    if (quizTotal > 0) {
      const quizScore = quizCorrect / quizTotal;
      creditsEarned += 0.006 * quizScore; // Up to 0.006 bonus for perfect quiz
      
      // Mastery demonstrated if quiz score >= 80%
      const masteryDemonstrated = quizScore >= 0.8;
      
      // Use the credit award system to link to learning plan if applicable
      const creditResult = await awardCreditsForActivity(user.userId, {
        subject: 'History',
        activityType: 'history-event-study',
        activityName: `History Event: ${eventTitle}`,
        metadata: {
          eventId,
          category,
          quizCorrect,
          quizTotal,
          quizScore,
          timeSpent,
          type,
        },
        performanceScore: quizScore,
        masteryDemonstrated,
      });

      // Create transcript entry with credit award
      const transcriptEntry = await createTranscriptEntryWithCredits(
        user.userId,
        `History Event: ${eventTitle}`,
        'History',
        creditResult,
        quizTotal > 0 
          ? `Completed history event with quiz: ${quizCorrect}/${quizTotal} correct (${Math.round(quizScore * 100)}%)`
          : 'Studied historical event and primary sources',
        {
          eventId,
          category,
          quizCorrect,
          quizTotal,
          quizScore,
          timeSpent,
          type,
          completedAt: new Date().toISOString(),
        }
      );

      return NextResponse.json({ 
        success: true, 
        transcriptEntry,
        creditsEarned: creditResult.creditsEarned,
        standardLinked: creditResult.standardLinked 
      });
    } else {
      // No quiz completed, just reading
      const transcriptEntry = await prisma.transcriptEntry.create({
        data: {
          userId: user.userId,
          activityName: `History Event: ${eventTitle}`,
          mappedSubject: 'History',
          creditsEarned,
          dateCompleted: new Date(),
          notes: 'Studied historical event and primary sources',
          metadata: {
            eventId,
            category,
            timeSpent,
            type,
            completedAt: new Date().toISOString(),
          },
        },
      });

      return NextResponse.json({ success: true, transcriptEntry, creditsEarned });
    }
  } catch (error) {
    console.error('History activity save error:', error);
    return NextResponse.json({ error: 'Failed to save history activity' }, { status: 500 });
  }
}
