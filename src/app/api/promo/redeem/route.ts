import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import prisma from '@/lib/db';

const VALID_CODES: Record<string, { tier: 'STUDENT' | 'PARENT'; expiresAt: Date | null }> = {
  FAMILY2026: { tier: 'STUDENT', expiresAt: new Date('2026-12-31') },
  HOMESCHOOL2026: { tier: 'STUDENT', expiresAt: new Date('2026-12-31') },
};

export async function POST(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { code } = await req.json();
  if (!code || typeof code !== 'string') {
    return NextResponse.json({ error: 'Promo code required' }, { status: 400 });
  }

  const promo = VALID_CODES[code.toUpperCase().trim()];
  if (!promo) {
    return NextResponse.json({ error: 'Invalid promo code' }, { status: 400 });
  }

  if (promo.expiresAt && new Date() > promo.expiresAt) {
    return NextResponse.json({ error: 'This promo code has expired' }, { status: 400 });
  }

  const periodEnd = new Date('2027-01-01');

  await prisma.subscription.upsert({
    where: { userId: user.userId },
    create: {
      userId: user.userId,
      tier: promo.tier,
      status: 'ACTIVE',
      currentPeriodEnd: periodEnd,
    },
    update: {
      tier: promo.tier,
      status: 'ACTIVE',
      currentPeriodEnd: periodEnd,
      cancelAtPeriodEnd: false,
    },
  });

  return NextResponse.json({ success: true, tier: promo.tier });
}
