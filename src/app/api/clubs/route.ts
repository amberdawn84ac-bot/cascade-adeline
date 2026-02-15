import { NextRequest } from 'next/server';
import prisma from '@/lib/db';
import { getSessionUser } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return new Response('Unauthorized', { status: 401 });

  const { searchParams } = new URL(req.url);
  const ageRange = searchParams.get('ageRange') || undefined;

  const clubs = await prisma.club.findMany({
    where: ageRange ? { ageRange } : undefined,
    orderBy: { createdAt: 'desc' },
    select: { id: true, name: true, description: true, ageRange: true, isActive: true },
  });

  return Response.json({ clubs });
}

export async function POST(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return new Response('Unauthorized', { status: 401 });

  const body = await req.json();
  const { name, description, ageRange } = body as { name?: string; description?: string; ageRange?: string };
  if (!name || typeof name !== 'string' || !name.trim()) return new Response('Missing name', { status: 400 });
  if (!description || typeof description !== 'string' || !description.trim()) return new Response('Missing description', { status: 400 });

  const club = await prisma.club.create({
    data: {
      name,
      description,
      ageRange,
      isActive: true,
      createdById: user.userId,
      memberships: { create: { userId: user.userId, role: 'LEADER' } },
    },
    select: { id: true, name: true, description: true, ageRange: true },
  });

  return Response.json({ club });
}
