import prisma from './db';
import { TIER_LIMITS, TierName } from './stripe';

export async function getUserSubscription(userId: string) {
  const subscription = await prisma.subscription.findUnique({
    where: { userId },
  });

  return subscription || { tier: 'FREE' as const, status: 'ACTIVE' as const };
}

export async function checkMessageLimit(userId: string): Promise<{
  allowed: boolean;
  remaining: number;
  limit: number;
  tier: string;
}> {
  const subscription = await getUserSubscription(userId);
  const tier = (subscription.tier || 'FREE') as TierName;
  const limits = TIER_LIMITS[tier];

  if (limits.messages === Infinity) {
    return { allowed: true, remaining: Infinity, limit: Infinity, tier };
  }

  // Get user's message count for this billing period
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { messageCount: true, messageResetAt: true },
  });

  if (!user) {
    throw new Error('User not found');
  }

  // Check if we need to reset counter (monthly)
  const now = new Date();
  const resetDate = user.messageResetAt || now;

  if (now.getTime() > resetDate.getTime()) {
    // Reset counter
    await prisma.user.update({
      where: { id: userId },
      data: {
        messageCount: 0,
        messageResetAt: new Date(now.getFullYear(), now.getMonth() + 1, 1),
      },
    });
    return { allowed: true, remaining: limits.messages - 1, limit: limits.messages, tier };
  }

  const remaining = limits.messages - user.messageCount;

  return {
    allowed: remaining > 0,
    remaining: Math.max(0, remaining - 1),
    limit: limits.messages,
    tier,
  };
}

export async function incrementMessageCount(userId: string) {
  await prisma.user.update({
    where: { id: userId },
    data: {
      messageCount: { increment: 1 },
    },
  });
}
