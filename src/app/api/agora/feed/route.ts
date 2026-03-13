import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    // Get recent transcript entries that have photo metadata (like the homesteading ones)
    // We'll use these as the initial feed for the Agora
    const recentProjects = await prisma.transcriptEntry.findMany({
      where: {
        metadata: {
          path: ['photoUrl'],
          not: { equals: null }
        }
      },
      include: {
        user: {
          select: {
            name: true,
            avatarUrl: true,
            gradeLevel: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 20
    });

    // We'll also mix in recent highlights if there aren't enough photo projects
    const recentHighlights = await prisma.highlight.findMany({
      where: {
        intent: 'share' // Assuming we'll add an intent for sharing to the Agora
      },
      include: {
        user: {
          select: {
            name: true,
            avatarUrl: true,
            gradeLevel: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 10
    });

    return NextResponse.json({
      projects: recentProjects,
      highlights: recentHighlights
    });
  } catch (error) {
    console.error('[agora/feed] Error:', error);
    return NextResponse.json({ error: 'Failed to fetch feed' }, { status: 500 });
  }
}
