import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import prisma from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) return new NextResponse('Unauthorized', { status: 401 });

    const body = await req.json();
    const { lesson, writingResponse, theme } = body;

    if (!lesson || !writingResponse) {
      return NextResponse.json({ error: 'Missing lesson or writing response' }, { status: 400 });
    }

    // Save the complete ELA lesson to transcript
    const transcriptEntry = await prisma.transcriptEntry.create({
      data: {
        userId: user.userId,
        activityName: `Daily Literacy: ${theme || lesson.topic || 'ELA Lesson'}`,
        mappedSubject: 'English Language Arts',
        creditsEarned: 0.004, // ~1/250th of a credit = 1 day of ELA work (1 credit per year ÷ 250 school days)
        dateCompleted: new Date(),
        notes: `Completed unified ELA lesson. Writing response: ${writingResponse.substring(0, 200)}${writingResponse.length > 200 ? '...' : ''}`,
        metadata: {
          theme,
          anchorText: lesson.anchorText,
          comprehension: lesson.comprehension,
          spellingWords: lesson.spellingWords,
          grammarFocus: lesson.grammarFocus,
          writingPrompt: lesson.writingPrompt,
          writingResponse,
          completedAt: new Date().toISOString(),
        },
      },
    });

    return NextResponse.json({ success: true, transcriptEntry });
  } catch (error) {
    console.error('Error saving ELA lesson:', error);
    return NextResponse.json({ error: 'Failed to save lesson' }, { status: 500 });
  }
}
