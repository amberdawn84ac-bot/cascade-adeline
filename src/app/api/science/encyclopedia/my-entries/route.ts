import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import prisma from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const session = await getSessionUser();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch all encyclopedia entries for this student from TranscriptEntry
    // Science entries are stored with activityName starting with "Encyclopedia:"
    const transcriptEntries = await prisma.transcriptEntry.findMany({
      where: { 
        userId: session.userId,
        activityName: {
          startsWith: 'Encyclopedia:'
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Extract the entry data from metadata field
    const entries = transcriptEntries.map(te => ({
      id: te.id,
      ...(te.metadata as any),
      createdAt: te.createdAt
    }));

    return NextResponse.json(entries);
  } catch (error) {
    console.error('Error fetching encyclopedia entries:', error);
    return NextResponse.json({ error: 'Failed to fetch entries' }, { status: 500 });
  }
}
