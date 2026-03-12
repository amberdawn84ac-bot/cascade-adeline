import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import prisma from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) return new NextResponse('Unauthorized', { status: 401 });

    const { title, objective, groupName, roles } = await req.json();
    if (!title || !objective || !groupName || !Array.isArray(roles)) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Create a co-op mission in metadata
    const mission = await prisma.user.update({
      where: { id: user.userId },
      data: {
        metadata: {
          ...(await prisma.user.findUnique({ where: { id: user.userId }, select: { metadata: true } }))?.metadata as object || {},
          coopMissions: [
            ...((await prisma.user.findUnique({ where: { id: user.userId }, select: { metadata: true } }))?.metadata as any)?.coopMissions || [],
            {
              id: `mission-${Date.now()}`,
              title,
              objective,
              groupName,
              roles, // e.g., [{ role: 'Soil Tester', task: 'Measure pH in 3 spots' }, { role: 'Data Logger', task: 'Record all measurements' }]
              createdBy: user.userId,
              createdAt: new Date().toISOString(),
              contributions: [],
            }
          ]
        }
      },
      select: { metadata: true }
    });

    return NextResponse.json({ ok: true, mission });
  } catch (error) {
    console.error('[science/missions/create]', error);
    return NextResponse.json({ error: 'Failed to create mission' }, { status: 500 });
  }
}
