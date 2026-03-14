import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getSessionUser } from '@/lib/auth';

export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    // Fetch True History timeline entries for the current user only
    const entries = await prisma.transcriptEntry.findMany({
      where: {
        userId: user.userId,
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

