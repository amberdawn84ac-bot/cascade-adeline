import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import prisma from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) return new NextResponse('Unauthorized', { status: 401 });

    const { report } = await req.json();
    if (!report || !report.location) {
      return NextResponse.json({ error: 'Invalid report data' }, { status: 400 });
    }

    // Map to Physical Education (outdoor activity) or Science (geology/archaeology focus)
    const hasGeologyFocus = report.geology?.formation || report.geology?.rocks?.length > 0;
    const mappedSubject = hasGeologyFocus ? 'Science' : 'Physical Education';

    const transcriptEntry = await prisma.transcriptEntry.create({
      data: {
        userId: user.userId,
        activityName: `Expedition: ${report.location}`,
        mappedSubject,
        creditsEarned: 0.1, // Micro-credit for expedition planning
        dateCompleted: new Date(),
        notes: `Geology: ${report.geology?.formation || 'N/A'} | Archaeology: ${report.archaeology?.remnants || 'N/A'}`,
        metadata: report,
      },
    });

    return NextResponse.json({ success: true, transcriptEntry });
  } catch (error) {
    console.error('Error saving expedition:', error);
    return NextResponse.json({ error: 'Failed to save expedition' }, { status: 500 });
  }
}
