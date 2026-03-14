import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getSessionUser } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    // Get recent transcript entries that have photo metadata (like the homesteading ones)

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
        intent: 'share'
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
    console.error('[community-board/feed] Error:', error);
    return NextResponse.json({ error: 'Failed to fetch feed' }, { status: 500 });
  }
}
