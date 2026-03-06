import { NextResponse } from 'next/server';
import prisma from '@/lib/db';

export async function GET() {
  try {
    // Fetch all True History timeline entries from TranscriptEntry table
    const entries = await prisma.transcriptEntry.findMany({
      where: {
        OR: [
          { activityName: { startsWith: 'True History:' } },
          { activityName: { startsWith: 'Historical Investigation:' } },
        ],
      },
      orderBy: {
        dateCompleted: 'desc',
      },
      select: {
        id: true,
        activityName: true,
        metadata: true,
        dateCompleted: true,
      },
    });

    // Transform to TimelineEntry format
    const timelineEntries = entries.map((entry) => {
      const metadata = entry.metadata as any;
      return {
        id: entry.id,
        topic: metadata?.topic || entry.activityName.replace('True History: ', '').replace('Historical Investigation: ', ''),
        sanitizedMyth: metadata?.sanitizedMyth || '',
        historicalReality: metadata?.historicalReality || '',
        primarySourcesCiting: metadata?.primarySourcesCiting || [],
        events: metadata?.events || [],
      };
    });

    return NextResponse.json(timelineEntries);
  } catch (error) {
    console.error('Error fetching Living Timeline:', error);
    return NextResponse.json({ error: 'Failed to fetch timeline entries' }, { status: 500 });
  }
}
