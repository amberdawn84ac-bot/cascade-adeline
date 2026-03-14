import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import prisma from '@/lib/db';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;

  const group = await prisma.scienceGroup.findUnique({ where: { id } });
  if (!group) return NextResponse.json({ error: 'Group not found' }, { status: 404 });

  const existing = await prisma.groupMembership.findUnique({
    where: { userId_groupId: { userId: user.userId, groupId: id } },
  });

  if (existing) {
    await prisma.groupMembership.delete({
      where: { userId_groupId: { userId: user.userId, groupId: id } },
    });
    return NextResponse.json({ joined: false, groupId: id });
  }

  await prisma.groupMembership.create({
    data: { userId: user.userId, groupId: id, role: 'MEMBER' },
  });

  return NextResponse.json({ joined: true, groupId: id });
}
