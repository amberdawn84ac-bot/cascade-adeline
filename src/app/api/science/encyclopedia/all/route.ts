import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getSessionUser } from '@/lib/auth';

export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    // Fetch Encyclopedia entries for the current user only
    const entries = await prisma.transcriptEntry.findMany({
      where: {
        userId: user.userId,
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

    // Transform to interactive lesson format
    const herbariumEntries = entries.map((entry) => {
      const metadata = entry.metadata as any;
      return {
        id: entry.id,
        title: metadata?.title || entry.activityName.replace('Encyclopedia: ', ''),
        topic: metadata?.title || entry.activityName.replace('Encyclopedia: ', ''),
        coreConcept: metadata?.coreConcept || '',
        appliedReality: metadata?.appliedReality || '',
        fieldChallenge: metadata?.fieldChallenge || '',
        imageUrl: metadata?.imageUrl || null,
        isColoringPage: metadata?.isColoringPage || false,
        createdAt: entry.dateCompleted,
      };
    });

    return NextResponse.json(herbariumEntries);
  } catch (error) {
    console.error('Error fetching Global Herbarium:', error);
    return NextResponse.json({ error: 'Failed to fetch entries' }, { status: 500 });
  }
}

