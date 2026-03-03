import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import prisma from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) return new NextResponse('Unauthorized', { status: 401 });

    const { entry } = await req.json();
    if (!entry || !entry.topic) return NextResponse.json({ error: "Invalid entry data" }, { status: 400 });

    const transcriptEntry = await prisma.transcriptEntry.create({
      data: {
        userId: user.userId,
        activityName: `True History: ${entry.topic}`,
        mappedSubject: 'History',
        creditsEarned: 0.1, 
        dateCompleted: new Date(),
        notes: entry.historicalReality,
        metadata: entry, 
      }
    });

    return NextResponse.json({ success: true, transcriptEntry });
  } catch (error) {
    console.error("Error saving timeline entry:", error);
    return NextResponse.json({ error: "Failed to save entry" }, { status: 500 });
  }
}
