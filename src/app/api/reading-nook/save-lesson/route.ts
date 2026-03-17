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

    // Calculate credits based on assignment length and complexity
    const wordCount = writingResponse.trim().split(/\s+/).length;
    const sentenceCount = writingResponse.split(/[.!?]+/).filter((s: string) => s.trim().length > 0).length;
    
    let creditsEarned = 0.004; // Base: 1 day of work
    
    // Scale credits based on writing length
    if (wordCount >= 500) {
      // Long essay/research (500+ words) = 5+ days of work
      creditsEarned = 0.020 + (Math.floor(wordCount / 500) * 0.004);
    } else if (wordCount >= 200) {
      // Medium essay (200-499 words) = 2-3 days of work
      creditsEarned = 0.012;
    } else if (wordCount >= 100) {
      // Extended response (100-199 words) = 1.5 days of work
      creditsEarned = 0.006;
    } else if (sentenceCount >= 5) {
      // Standard response (5+ sentences) = 1 day of work
      creditsEarned = 0.004;
    } else {
      // Short response (< 5 sentences) = partial day
      creditsEarned = 0.002;
    }
    
    // Cap maximum credits at 0.1 (25 days worth) for any single assignment
    creditsEarned = Math.min(creditsEarned, 0.1);

    // Save the complete ELA lesson to transcript
    const transcriptEntry = await prisma.transcriptEntry.create({
      data: {
        userId: user.userId,
        activityName: `Daily Literacy: ${theme || lesson.topic || 'ELA Lesson'}`,
        mappedSubject: 'English Language Arts',
        creditsEarned,
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
