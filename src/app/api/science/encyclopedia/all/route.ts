import { NextResponse } from 'next/server';
import prisma from '@/lib/db';

export async function GET() {
  try {
    // Fetch all Encyclopedia entries from TranscriptEntry table
    const entries = await prisma.transcriptEntry.findMany({
      where: {
        activityName: {
          startsWith: 'Encyclopedia:',
        },
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

    // Transform to ScienceEntry format
    const herbariumEntries = entries.map((entry) => {
      const metadata = entry.metadata as any;
      return {
        id: entry.id,
        title: metadata?.title || entry.activityName.replace('Encyclopedia: ', ''),
        topic: metadata?.title || entry.activityName.replace('Encyclopedia: ', ''),
        category: metadata?.category || 'Science',
        hypothesis: metadata?.hypothesis || '',
        observation: metadata?.observation || '',
        conclusion: metadata?.conclusion || '',
        funFact: metadata?.funFact || '',
        fieldNotes: metadata?.fieldNotes || [],
        references: metadata?.references || [],
        sources: metadata?.sources || [],
      };
    });

    return NextResponse.json(herbariumEntries);
  } catch (error) {
    console.error('Error fetching Global Herbarium:', error);
    return NextResponse.json({ error: 'Failed to fetch entries' }, { status: 500 });
  }
}
