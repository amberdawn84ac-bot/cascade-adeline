import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getSessionUser } from '@/lib/auth';

export async function GET() {
  try {
    const session = await getSessionUser();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: { gradeLevel: true, interests: true, name: true },
    });

    if (!user) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    return NextResponse.json({
      gradeLevel: user.gradeLevel ?? null,
      interests: user.interests ?? [],
      name: user.name ?? null,
    });
  } catch (err) {
    console.error('[user/me]', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
