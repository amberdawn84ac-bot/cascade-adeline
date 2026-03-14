import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import prisma from '@/lib/db';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const { searchParams } = new URL(req.url);
  const since = searchParams.get('since');

  const membership = await prisma.groupMembership.findUnique({
    where: { userId_groupId: { userId: user.userId, groupId: id } },
  });
  if (!membership) return NextResponse.json({ error: 'Not a member of this group' }, { status: 403 });

  const messages = await prisma.groupMessage.findMany({
    where: {
      groupId: id,
      ...(since ? { createdAt: { gt: new Date(since) } } : {}),
    },
    include: { author: { select: { id: true, name: true, avatarUrl: true } } },
    orderBy: { createdAt: 'asc' },
    take: 100,
  });

  return NextResponse.json(messages);
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const { content } = await req.json();
  if (!content?.trim()) return NextResponse.json({ error: 'content is required' }, { status: 400 });

  const membership = await prisma.groupMembership.findUnique({
    where: { userId_groupId: { userId: user.userId, groupId: id } },
  });
  if (!membership) return NextResponse.json({ error: 'Not a member of this group' }, { status: 403 });

  const message = await prisma.groupMessage.create({
    data: { groupId: id, authorId: user.userId, content: content.trim() },
    include: { author: { select: { id: true, name: true, avatarUrl: true } } },
  });

  const messageCount = await prisma.groupMessage.count({ where: { groupId: id } });
  if (messageCount > 0 && messageCount % 10 === 0) {
    fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/science/groups/${id}/mediate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ trigger: 'auto', messageCount }),
    }).catch(() => {});
  }

  return NextResponse.json(message, { status: 201 });
}
