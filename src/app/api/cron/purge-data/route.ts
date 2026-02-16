import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';

/**
 * CRON: Purge user data for accounts that requested deletion.
 *
 * Runs daily. Deletes all user data for accounts where
 * dataDeletionRequestedAt is older than 30 days (grace period).
 *
 * Vercel Cron: Add to vercel.json crons array.
 * Or call manually: POST /api/cron/purge-data with CRON_SECRET header.
 */

const GRACE_PERIOD_DAYS = 30;

export async function POST(req: NextRequest) {
  // Verify cron secret
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - GRACE_PERIOD_DAYS);

  try {
    // Find users who requested deletion more than 30 days ago
    const usersToDelete = await prisma.user.findMany({
      where: {
        dataDeletionRequestedAt: { lte: cutoff },
      },
      select: { id: true, email: true },
    });

    if (usersToDelete.length === 0) {
      return NextResponse.json({ message: 'No accounts to purge', count: 0 });
    }

    const userIds = usersToDelete.map(u => u.id);

    // Delete all related data in order (respecting foreign keys)
    // Use a transaction for atomicity
    await prisma.$transaction(async (tx) => {
      // Delete child records first
      await tx.highlight.deleteMany({ where: { userId: { in: userIds } } });
      await tx.onboardingProgress.deleteMany({ where: { userId: { in: userIds } } });
      await tx.reviewSchedule.deleteMany({ where: { userId: { in: userIds } } });
      await tx.reflectionEntry.deleteMany({ where: { userId: { in: userIds } } });
      await tx.userConceptMastery.deleteMany({ where: { userId: { in: userIds } } });
      await tx.learningGap.deleteMany({ where: { userId: { in: userIds } } });
      await tx.conversationMemory.deleteMany({ where: { userId: { in: userIds } } });
      await tx.transcriptEntry.deleteMany({ where: { userId: { in: userIds } } });
      await tx.subscription.deleteMany({ where: { userId: { in: userIds } } });
      await tx.referral.deleteMany({
        where: { OR: [{ referrerId: { in: userIds } }, { refereeId: { in: userIds } }] },
      });
      await tx.lLMTrace.deleteMany({ where: { userId: { in: userIds } } });

      // Delete the users themselves
      await tx.user.deleteMany({ where: { id: { in: userIds } } });
    });

    console.log(`[Purge] Deleted ${usersToDelete.length} accounts:`, usersToDelete.map(u => u.email));

    return NextResponse.json({
      message: `Purged ${usersToDelete.length} accounts`,
      count: usersToDelete.length,
    });
  } catch (error) {
    console.error('[Purge Error]', error);
    return NextResponse.json({ error: 'Purge failed' }, { status: 500 });
  }
}
