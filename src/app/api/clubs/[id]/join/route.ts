import { NextRequest } from 'next/server';
import prisma from '@/lib/db';
import { getSessionUser } from '@/lib/auth';

export async function POST(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const user = await getSessionUser();
  if (!user) return new Response('Unauthorized', { status: 401 });

  const { id: clubId } = await context.params;
  if (!clubId || !/^[0-9a-fA-F-]{36}$/.test(clubId)) return new Response('Invalid club id', { status: 400 });

  const existing = await prisma.clubMembership.findUnique({ where: { userId_clubId: { userId: user.userId, clubId } } });
  if (existing) return new Response('Already a member', { status: 200 });

  await prisma.clubMembership.create({
    data: {
      userId: user.userId,
      clubId,
      role: 'MEMBER',
    },
  });

  return Response.json({ ok: true });
}
