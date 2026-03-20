import { NextRequest, NextResponse } from 'next/server';
import { stripe, STRIPE_PRICES } from '@/lib/stripe';
import { getSessionUser } from '@/lib/auth';
import prisma from '@/lib/db';

/**
 * GET /checkout/initiate?tier=STUDENT&billing=monthly
 *
 * Called after email confirmation when the user selected a paid tier during signup
 * but couldn't go through Stripe checkout before confirming their email.
 */
export async function GET(req: NextRequest) {
  const { searchParams, origin } = new URL(req.url);
  const tier = searchParams.get('tier') as 'STUDENT' | 'PARENT' | 'TEACHER' | null;
  const billing = (searchParams.get('billing') || 'monthly') as 'monthly' | 'yearly';

  const validTiers = ['STUDENT', 'PARENT', 'TEACHER'];
  if (!tier || !validTiers.includes(tier)) {
    return NextResponse.redirect(`${origin}/onboarding`);
  }

  const user = await getSessionUser();
  if (!user) {
    return NextResponse.redirect(`${origin}/login`);
  }

  try {
    const priceKey = `${tier}_${billing.toUpperCase()}` as keyof typeof STRIPE_PRICES;
    const priceId = STRIPE_PRICES[priceKey];
    if (!priceId) {
      return NextResponse.redirect(`${origin}/onboarding`);
    }

    let customerId: string | undefined;
    const existing = await prisma.subscription.findUnique({ where: { userId: user.userId } });
    if (existing?.stripeCustomerId) {
      customerId = existing.stripeCustomerId;
    } else {
      const customer = await stripe.customers.create({
        email: user.email || undefined,
        metadata: { userId: user.userId },
      });
      customerId = customer.id;
    }

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      subscription_data: {
        trial_period_days: 7,
        metadata: { userId: user.userId, tier },
      },
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/onboarding?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/pricing`,
      metadata: { userId: user.userId, tier },
      allow_promotion_codes: true,
    });

    return NextResponse.redirect(session.url!);
  } catch (err) {
    console.error('[checkout/initiate] error:', err);
    return NextResponse.redirect(`${origin}/onboarding`);
  }
}
