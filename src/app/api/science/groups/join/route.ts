import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import prisma from '@/lib/db';
import { indexConversationMemory } from '@/lib/memex/memory-indexer';

export async function POST(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { groupName } = await req.json();
  if (!groupName) return NextResponse.json({ error: 'groupName is required' }, { status: 400 });

  const existing = await prisma.user.findUnique({
    where: { id: user.userId },
    select: { joinedGroups: true },
  });

  const alreadyJoined = existing?.joinedGroups?.includes(groupName) ?? false;

  const updated = await prisma.user.update({
    where: { id: user.userId },
    data: {
      joinedGroups: alreadyJoined
        ? { set: (existing?.joinedGroups ?? []).filter((g) => g !== groupName) }
        : { push: groupName },
    },
    select: { joinedGroups: true },
  });

  if (!alreadyJoined) {
    // Non-blocking memory log
    indexConversationMemory(user.userId, `group-join-${Date.now()}`, [
      { role: 'user', content: `I joined the ${groupName}.` },
    ]).catch(() => {});
  }

  return NextResponse.json({ ok: true, joined: !alreadyJoined, joinedGroups: updated.joinedGroups });
}

