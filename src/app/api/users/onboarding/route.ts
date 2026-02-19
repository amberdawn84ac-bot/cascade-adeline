import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getSessionUser } from '@/lib/auth';

export async function PATCH(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { gradeLevel, interests } = await req.json();

  await prisma.user.update({
    where: { id: user.userId },
    data: {
      gradeLevel: gradeLevel || null,
      interests: Array.isArray(interests) ? interests : [],
    },
  });

  return NextResponse.json({ ok: true });
}
