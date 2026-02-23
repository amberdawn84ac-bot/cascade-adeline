import { NextRequest } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import prisma from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) return new Response('Unauthorized', { status: 401 });

    // Fetch approved transcript entries for the user
    const entries = await prisma.transcriptEntry.findMany({
      where: {
        userId: user.userId,
        approvedById: { not: null }, // Only approved entries
      },
      select: {
        mappedSubject: true,
        creditsEarned: true,
        notes: true,
        dateCompleted: true,
      },
      orderBy: {
        dateCompleted: 'desc',
      },
    });

    return Response.json(entries);
  } catch (error) {
    console.error('Error fetching transcript entries:', error);
    return new Response('Internal server error', { status: 500 });
  }
}
