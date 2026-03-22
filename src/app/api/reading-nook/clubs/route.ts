import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import prisma from '@/lib/db';
import { generateBookClubPrompt } from '@/lib/reading-nook/bookClubFacilitator';

/**
 * GET /api/reading-nook/clubs
 * Returns all active book clubs with member count and latest post preview.
 */
export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const clubs = await prisma.bookClub.findMany({
    where: { active: true },
    include: {
      _count: { select: { members: true, posts: true } },
      posts: {
        orderBy: { createdAt: 'desc' },
        take: 1,
        select: { content: true, createdAt: true, isAdeline: true },
      },
      members: {
        where: { userId: user.userId },
        select: { joinedAt: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  const result = clubs.map((club) => ({
    id: club.id,
    name: club.name,
    bookId: club.bookId,
    bookTitle: club.bookTitle,
    memberCount: club._count.members,
    postCount: club._count.posts,
    lastPost: club.posts[0] ?? null,
    isMember: club.members.length > 0,
  }));

  return NextResponse.json(result);
}

/**
 * POST /api/reading-nook/clubs
 * Body action variants:
 *   { action: 'create',    name, bookId, bookTitle }
 *   { action: 'join',      clubId }
 *   { action: 'post',      clubId, content, chapter? }
 *   { action: 'facilitate', clubId, bookId, chapter? }
 *   { action: 'posts',     clubId }   — fetch posts for a club
 */
export async function POST(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const { action } = body as { action: string };

  switch (action) {
    case 'create': {
      const { name, bookId, bookTitle } = body as { name: string; bookId: string; bookTitle: string };
      if (!name || !bookId || !bookTitle) {
        return NextResponse.json({ error: 'name, bookId, and bookTitle are required' }, { status: 400 });
      }
      const club = await prisma.bookClub.create({
        data: { name, bookId, bookTitle },
      });
      // Auto-join creator
      await prisma.bookClubMember.create({
        data: { clubId: club.id, userId: user.userId },
      });
      return NextResponse.json(club, { status: 201 });
    }

    case 'join': {
      const { clubId } = body as { clubId: string };
      if (!clubId) return NextResponse.json({ error: 'clubId is required' }, { status: 400 });

      const existing = await prisma.bookClubMember.findUnique({
        where: { clubId_userId: { clubId, userId: user.userId } },
      });
      if (existing) return NextResponse.json({ alreadyMember: true });

      const member = await prisma.bookClubMember.create({
        data: { clubId, userId: user.userId },
      });
      return NextResponse.json(member, { status: 201 });
    }

    case 'post': {
      const { clubId, content, chapter } = body as { clubId: string; content: string; chapter?: string };
      if (!clubId || !content?.trim()) {
        return NextResponse.json({ error: 'clubId and content are required' }, { status: 400 });
      }

      // Must be a member to post
      const membership = await prisma.bookClubMember.findUnique({
        where: { clubId_userId: { clubId, userId: user.userId } },
      });
      if (!membership) return NextResponse.json({ error: 'Not a member of this club' }, { status: 403 });

      const post = await prisma.bookClubPost.create({
        data: { clubId, userId: user.userId, content: content.trim(), chapter: chapter ?? null },
        include: { user: { select: { name: true, avatarUrl: true } } },
      });
      return NextResponse.json(post, { status: 201 });
    }

    case 'facilitate': {
      const { clubId, bookId, chapter } = body as { clubId: string; bookId: string; chapter?: string };
      if (!clubId || !bookId) {
        return NextResponse.json({ error: 'clubId and bookId are required' }, { status: 400 });
      }
      try {
        const post = await generateBookClubPrompt(user.userId, clubId, bookId, chapter);
        return NextResponse.json(post, { status: 201 });
      } catch (err) {
        console.error('[clubs/facilitate] Error:', err);
        return NextResponse.json({ error: 'Failed to generate discussion prompt' }, { status: 500 });
      }
    }

    case 'posts': {
      const { clubId } = body as { clubId: string };
      if (!clubId) return NextResponse.json({ error: 'clubId is required' }, { status: 400 });

      const posts = await prisma.bookClubPost.findMany({
        where: { clubId },
        orderBy: { createdAt: 'asc' },
        include: { user: { select: { name: true, avatarUrl: true } } },
      });
      return NextResponse.json(posts);
    }

    default:
      return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 });
  }
}
