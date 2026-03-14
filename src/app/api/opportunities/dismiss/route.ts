import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import prisma from '@/lib/db';

export async function POST(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { matchId } = await req.json();
  if (!matchId) return NextResponse.json({ error: 'matchId is required' }, { status: 400 });

  await prisma.competitionMatch.updateMany({
    where: { id: matchId, userId: user.userId },
    data: { dismissed: true },
  });

  return NextResponse.json({ ok: true });
}
