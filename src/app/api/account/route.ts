import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getSessionUser } from '@/lib/auth';

/**
 * Account management: lock/unlock, request deletion, cancel deletion.
 *
 * PATCH /api/account
 * Body: { action: 'lock' | 'unlock' | 'request_deletion' | 'cancel_deletion' }
 */
export async function PATCH(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { action } = await req.json();

  switch (action) {
    case 'lock':
      await prisma.user.update({
        where: { id: user.userId },
        data: { accountLockedAt: new Date() },
      });
      return NextResponse.json({ message: 'Account locked' });

    case 'unlock':
      await prisma.user.update({
        where: { id: user.userId },
        data: { accountLockedAt: null },
      });
      return NextResponse.json({ message: 'Account unlocked' });

    case 'request_deletion':
      await prisma.user.update({
        where: { id: user.userId },
        data: { dataDeletionRequestedAt: new Date() },
      });
      return NextResponse.json({
        message: 'Deletion requested. Your data will be permanently deleted in 30 days. You can cancel before then.',
      });

    case 'cancel_deletion':
      await prisma.user.update({
        where: { id: user.userId },
        data: { dataDeletionRequestedAt: null },
      });
      return NextResponse.json({ message: 'Deletion cancelled' });

    default:
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  }
}
