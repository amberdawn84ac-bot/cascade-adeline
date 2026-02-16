import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getSessionUser } from '@/lib/auth';
import { getUserSubscription } from '@/lib/subscription';
import { TIER_LIMITS, TierName } from '@/lib/stripe';

export async function GET(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const subject = searchParams.get('subject') || undefined;

  const clubs = await prisma.club.findMany({
    where: {
      isActive: true,
      ...(subject ? { subject } : {}),
    },
    orderBy: { createdAt: 'desc' },
    include: {
      _count: { select: { memberships: true } },
      createdBy: { select: { name: true } },
    },
  });

  return NextResponse.json(clubs);
}

export async function POST(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // Check if user can create clubs (paid tiers only)
  const subscription = await getUserSubscription(user.userId);
  const limits = TIER_LIMITS[(subscription.tier || 'FREE') as TierName];

  if (!limits.canCreateClubs) {
    return NextResponse.json(
      { error: 'Upgrade to Student plan to create clubs' },
      { status: 403 }
    );
  }

  const { name, subject, description, isPublic } = await req.json();

  if (!name || !subject) {
    return NextResponse.json({ error: 'Name and subject required' }, { status: 400 });
  }

  try {
    const club = await prisma.club.create({
      data: {
        name,
        description: description || '',
        subject,
        isPublic: isPublic ?? true,
        isActive: true,
        createdById: user.userId,
        memberships: { create: { userId: user.userId, role: 'LEADER' } },
      },
    });

    return NextResponse.json(club);
  } catch (error) {
    console.error('[Club Creation Error]', error);
    return NextResponse.json({ error: 'Failed to create club' }, { status: 500 });
  }
}
