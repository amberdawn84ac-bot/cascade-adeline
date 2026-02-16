import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getSessionUser } from '@/lib/auth';
import { randomBytes } from 'crypto';

export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // Get or create referral code
  const dbUser = await prisma.user.findUnique({
    where: { id: user.userId },
    select: { referralCode: true },
  });

  let referralCode = dbUser?.referralCode;

  if (!referralCode) {
    referralCode = randomBytes(4).toString('hex');
    await prisma.user.update({
      where: { id: user.userId },
      data: { referralCode },
    });
  }

  // Get referral stats
  const referrals = await prisma.referral.findMany({
    where: { referrerId: user.userId },
    include: {
      referee: { select: { name: true, email: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  const stats = {
    totalSignups: referrals.length,
    totalPaid: referrals.filter(r => r.status === 'PAID' || r.status === 'CREDITED').length,
    totalCredits: referrals
      .filter(r => r.status === 'CREDITED')
      .reduce((sum, r) => sum + Number(r.creditAmount), 0),
    pendingCredits: referrals
      .filter(r => r.status === 'PAID')
      .reduce((sum, r) => sum + Number(r.creditAmount), 0),
  };

  return NextResponse.json({
    referralCode,
    referralLink: `${process.env.NEXT_PUBLIC_APP_URL}/r/${referralCode}`,
    stats,
    referrals: referrals.map(r => ({
      id: r.id,
      refereeName: r.referee.name,
      status: r.status,
      creditAmount: Number(r.creditAmount),
      createdAt: r.createdAt,
      paidAt: r.paidAt,
    })),
  });
}

export async function POST(req: NextRequest) {
  const { referralCode } = await req.json();

  if (!referralCode) {
    return NextResponse.json({ error: 'Referral code required' }, { status: 400 });
  }

  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // Find referrer by code
  const referrer = await prisma.user.findUnique({
    where: { referralCode },
  });

  if (!referrer) {
    return NextResponse.json({ error: 'Invalid referral code' }, { status: 404 });
  }

  if (referrer.id === user.userId) {
    return NextResponse.json({ error: 'Cannot refer yourself' }, { status: 400 });
  }

  // Check if already referred
  const existing = await prisma.referral.findFirst({
    where: { refereeId: user.userId },
  });

  if (existing) {
    return NextResponse.json({ error: 'Already referred' }, { status: 409 });
  }

  // Create referral
  const referral = await prisma.referral.create({
    data: {
      referrerId: referrer.id,
      refereeId: user.userId,
      status: 'PENDING',
      creditAmount: 10.00,
    },
  });

  // Update user's referredBy
  await prisma.user.update({
    where: { id: user.userId },
    data: { referredBy: referrer.id },
  });

  return NextResponse.json({ referralId: referral.id, message: 'Referral recorded' });
}
