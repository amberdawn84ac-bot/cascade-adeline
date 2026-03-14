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

  const projects = await prisma.groupProject.findMany({
    where: { groupId: id },
    include: {
      logEntries: {
        include: { user: { select: { id: true, name: true } } },
        orderBy: { createdAt: 'desc' },
        take: 5,
      },
      _count: { select: { logEntries: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json(projects);
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const { title, description } = await req.json();
  if (!title?.trim() || !description?.trim()) {
    return NextResponse.json({ error: 'title and description are required' }, { status: 400 });
  }

  const membership = await prisma.groupMembership.findUnique({
    where: { userId_groupId: { userId: user.userId, groupId: id } },
  });
  if (!membership) return NextResponse.json({ error: 'Not a member of this group' }, { status: 403 });

  const project = await prisma.groupProject.create({
    data: { groupId: id, title: title.trim(), description: description.trim() },
    include: { _count: { select: { logEntries: true } } },
  });

  return NextResponse.json(project, { status: 201 });
}
