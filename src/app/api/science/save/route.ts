import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import prisma from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) return new NextResponse('Unauthorized', { status: 401 });

    const body = await req.json();
    const { experiment } = body;
    if (!experiment || !experiment.title) {
      return NextResponse.json({ error: "Invalid experiment data" }, { status: 400 });
    }

    // Save as a TranscriptEntry so it compiles into the Year-End Portfolio
    const entry = await prisma.transcriptEntry.create({
      data: {
        userId: user.userId,
        activityName: `Nature Journal: ${experiment.title}`,
        mappedSubject: 'Science',
        creditsEarned: 0.1, // Award a micro-credit for the activity
        dateCompleted: new Date(),
        notes: experiment.theScience, // Save the classical explanation as standard notes
        metadata: experiment, // Store the full structured JSON for the portfolio renderer
      }
    });

    return NextResponse.json({ success: true, entry });
  } catch (error) {
    console.error("Error saving experiment to journal:", error);
    return NextResponse.json({ error: "Failed to save to journal" }, { status: 500 });
  }
}

