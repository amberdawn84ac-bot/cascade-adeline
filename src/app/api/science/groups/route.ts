import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import prisma from '@/lib/db';

export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const groups = await prisma.scienceGroup.findMany({
    where: { isPublic: true },
    include: {
      creator: { select: { id: true, name: true } },
      moderator: { select: { id: true, name: true } },
      memberships: { select: { userId: true, role: true } },
      _count: { select: { messages: true, projects: true, memberships: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json(groups);
}

export async function POST(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { name, focus, description, currentChallenge, isPublic, moderatorEmail } = await req.json();

  if (!name?.trim() || !focus?.trim() || !description?.trim() || !currentChallenge?.trim()) {
    return NextResponse.json({ error: 'name, focus, description, and currentChallenge are required' }, { status: 400 });
  }

  let moderatorId: string | undefined;
  if (moderatorEmail) {
    const mod = await prisma.user.findUnique({ where: { email: moderatorEmail }, select: { id: true } });
    moderatorId = mod?.id;
  }

  const group = await prisma.scienceGroup.create({
    data: {
      name: name.trim(),
      focus: focus.trim(),
      description: description.trim(),
      currentChallenge: currentChallenge.trim(),
      isPublic: isPublic !== false,
      creatorId: user.userId,
      moderatorId,
      memberships: {
        create: { userId: user.userId, role: 'MODERATOR' },
      },
    },
    include: {
      creator: { select: { id: true, name: true } },
      memberships: { select: { userId: true, role: true } },
      _count: { select: { messages: true, projects: true, memberships: true } },
    },
  });

  return NextResponse.json(group, { status: 201 });
}
