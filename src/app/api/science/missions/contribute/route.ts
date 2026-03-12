import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import prisma from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) return new NextResponse('Unauthorized', { status: 401 });

    const { missionId, role, data, notes } = await req.json();
    if (!missionId || !role || !data) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Find the mission creator and add contribution
    const allUsers = await prisma.user.findMany({
      select: { id: true, metadata: true, name: true }
    });

    let missionOwner = null;
    let mission = null;

    for (const u of allUsers) {
      const missions = (u.metadata as any)?.coopMissions || [];
      const found = missions.find((m: any) => m.id === missionId);
      if (found) {
        missionOwner = u;
        mission = found;
        break;
      }
    }

    if (!mission || !missionOwner) {
      return NextResponse.json({ error: 'Mission not found' }, { status: 404 });
    }

    // Add contribution
    const contributor = await prisma.user.findUnique({ where: { id: user.userId }, select: { name: true } });
    const updatedMissions = ((missionOwner.metadata as any)?.coopMissions || []).map((m: any) => {
      if (m.id === missionId) {
        return {
          ...m,
          contributions: [
            ...(m.contributions || []),
            {
              userId: user.userId,
              userName: contributor?.name || 'Student',
              role,
              data,
              notes: notes || '',
              timestamp: new Date().toISOString(),
            }
          ]
        };
      }
      return m;
    });

    await prisma.user.update({
      where: { id: missionOwner.id },
      data: {
        metadata: {
          ...(missionOwner.metadata as object || {}),
          coopMissions: updatedMissions
        }
      }
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('[science/missions/contribute]', error);
    return NextResponse.json({ error: 'Failed to contribute' }, { status: 500 });
  }
}
