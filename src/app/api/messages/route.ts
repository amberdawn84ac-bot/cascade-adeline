import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getSessionUser } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const offset = parseInt(searchParams.get('offset') || '0');
  const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50);
  const sessionId = searchParams.get('sessionId');

  const where: Record<string, unknown> = { userId: user.userId };
  if (sessionId) where.sessionId = sessionId;

  const messages = await prisma.conversationMemory.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    skip: offset,
    take: limit,
  });

  return NextResponse.json(messages);
}
