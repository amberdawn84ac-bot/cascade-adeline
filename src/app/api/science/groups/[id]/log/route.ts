import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import prisma from '@/lib/db';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;

  const membership = await prisma.groupMembership.findUnique({
    where: { userId_groupId: { userId: user.userId, groupId: id } },
  });
  if (!membership) return NextResponse.json({ error: 'Not a member of this group' }, { status: 403 });

  const logs = await prisma.groupLogEntry.findMany({
    where: { groupId: id },
    include: {
      user: { select: { id: true, name: true, avatarUrl: true } },
      project: { select: { id: true, title: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });

  return NextResponse.json(logs);
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const { content, projectId } = await req.json();
  if (!content?.trim()) return NextResponse.json({ error: 'content is required' }, { status: 400 });

  const membership = await prisma.groupMembership.findUnique({
    where: { userId_groupId: { userId: user.userId, groupId: id } },
  });
  if (!membership) return NextResponse.json({ error: 'Not a member of this group' }, { status: 403 });

  const entry = await prisma.groupLogEntry.create({
    data: {
      groupId: id,
      userId: user.userId,
      content: content.trim(),
      ...(projectId ? { projectId } : {}),
    },
    include: {
      user: { select: { id: true, name: true, avatarUrl: true } },
      project: { select: { id: true, title: true } },
    },
  });

  return NextResponse.json(entry, { status: 201 });
}
