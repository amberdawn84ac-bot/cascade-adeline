# Go-To-Market Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build complete revenue infrastructure including Stripe subscriptions, pricing tiers, club features, referral system, SEO landing page, and analytics tracking to acquire first 100-1000 paying customers.

**Architecture:** Add Subscription model with Stripe integration, implement 4-tier freemium pricing with feature gates, build club creation/joining with public showcase, add referral tracking with credit system, optimize landing page for SEO, integrate PostHog analytics.

**Tech Stack:** Stripe SDK, Next.js API routes, Prisma for subscriptions/referrals, PostHog analytics, React Email for transactional emails

**Estimated Time:** 1-2 weeks (60-80 hours)

---

## Prerequisites

### Install Dependencies

```bash
npm install stripe @stripe/stripe-js
npm install posthog-js posthog-node
npm install react-email @react-email/components
npm install sharp # For image optimization
```

---

## Phase 1: Stripe Integration Foundation

### Task 1.1: Add Subscription Schema

**Files:**
- Modify: `prisma/schema.prisma`

**Step 1: Add Subscription models**

Add to `prisma/schema.prisma` after the existing models:

```prisma
model Subscription {
  id                   String             @id @default(uuid()) @db.Uuid
  userId               String             @unique @db.Uuid
  user                 User               @relation(fields: [userId], references: [id], onDelete: Cascade)
  stripeCustomerId     String             @unique
  stripeSubscriptionId String             @unique
  stripePriceId        String
  tier                 SubscriptionTier   @default(FREE)
  status               SubscriptionStatus @default(ACTIVE)
  currentPeriodEnd     DateTime
  cancelAtPeriodEnd    Boolean            @default(false)
  credits              Decimal            @default(0) @db.Decimal(10, 2)
  createdAt            DateTime           @default(now())
  updatedAt            DateTime           @updatedAt

  @@index([userId])
  @@index([stripeCustomerId])
}

enum SubscriptionTier {
  FREE
  STUDENT
  PARENT
  FAMILY
}

enum SubscriptionStatus {
  ACTIVE
  PAST_DUE
  CANCELED
  TRIALING
}

model Referral {
  id           String         @id @default(uuid()) @db.Uuid
  referrerId   String         @db.Uuid
  referrer     User           @relation("Referrer", fields: [referrerId], references: [id])
  refereeId    String         @db.Uuid
  referee      User           @relation("Referee", fields: [refereeId], references: [id])
  status       ReferralStatus @default(PENDING)
  creditAmount Decimal        @default(10.00) @db.Decimal(10, 2)
  createdAt    DateTime       @default(now())
  paidAt       DateTime?
  creditedAt   DateTime?

  @@index([referrerId])
  @@index([refereeId])
}

enum ReferralStatus {
  PENDING
  PAID
  CREDITED
}
```

Also add to User model:

```prisma
model User {
  // ... existing fields

  referralCode String?        @unique
  referredBy   String?        @db.Uuid
  subscription Subscription?
  referralsMade Referral[]    @relation("Referrer")
  referralsReceived Referral[] @relation("Referee")
  messageCount Int            @default(0)
  messageResetAt DateTime?
}
```

**Step 2: Push schema changes**

```bash
npx prisma db push
npx prisma generate
```

Expected: Schema updated successfully

**Step 3: Commit**

```bash
git add prisma/schema.prisma src/generated/prisma/
git commit -m "feat(subscription): add Subscription and Referral models

- Add Subscription model with Stripe fields
- Add 4 subscription tiers (FREE, STUDENT, PARENT, FAMILY)
- Add Referral model for $10/$10 program
- Add User fields for referral tracking and message limits

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

### Task 1.2: Setup Stripe SDK

**Files:**
- Create: `src/lib/stripe.ts`
- Create: `.env.local` (add Stripe keys)

**Step 1: Create Stripe client**

Create `src/lib/stripe.ts`:

```typescript
import Stripe from 'stripe';

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY is not set');
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2024-11-20.acacia',
  typescript: true,
});

// Price IDs (set these after creating products in Stripe Dashboard)
export const STRIPE_PRICES = {
  STUDENT_MONTHLY: process.env.STRIPE_PRICE_STUDENT_MONTHLY || '',
  STUDENT_YEARLY: process.env.STRIPE_PRICE_STUDENT_YEARLY || '',
  PARENT_MONTHLY: process.env.STRIPE_PRICE_PARENT_MONTHLY || '',
  PARENT_YEARLY: process.env.STRIPE_PRICE_PARENT_YEARLY || '',
  FAMILY_MONTHLY: process.env.STRIPE_PRICE_FAMILY_MONTHLY || '',
  FAMILY_YEARLY: process.env.STRIPE_PRICE_FAMILY_YEARLY || '',
};

export const TIER_LIMITS = {
  FREE: {
    messages: 10,
    students: 1,
    canCreateClubs: false,
    hasParentDashboard: false,
    hasTranscripts: false,
  },
  STUDENT: {
    messages: Infinity,
    students: 1,
    canCreateClubs: true,
    hasParentDashboard: false,
    hasTranscripts: false,
  },
  PARENT: {
    messages: Infinity,
    students: 1,
    canCreateClubs: true,
    hasParentDashboard: true,
    hasTranscripts: false,
  },
  FAMILY: {
    messages: Infinity,
    students: 6,
    canCreateClubs: true,
    hasParentDashboard: true,
    hasTranscripts: true,
  },
};
```

**Step 2: Add environment variables**

Add to `.env` (you'll need to create products in Stripe Dashboard first):

```bash
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...

# These will be set after creating products
STRIPE_PRICE_STUDENT_MONTHLY=price_...
STRIPE_PRICE_STUDENT_YEARLY=price_...
STRIPE_PRICE_PARENT_MONTHLY=price_...
STRIPE_PRICE_PARENT_YEARLY=price_...
STRIPE_PRICE_FAMILY_MONTHLY=price_...
STRIPE_PRICE_FAMILY_YEARLY=price_...

# Webhook signing secret (set after creating webhook)
STRIPE_WEBHOOK_SECRET=whsec_...
```

**Step 3: Create Stripe products (manual step)**

Go to Stripe Dashboard → Products → Create products:

1. **Student Plan**
   - Name: "Student Plan"
   - Monthly: $2.99
   - Yearly: $28.80 (20% discount)

2. **Parent Plan**
   - Name: "Parent Plan"
   - Monthly: $19.00
   - Yearly: $182.40

3. **Family Plan**
   - Name: "Family Plan"
   - Monthly: $29.00
   - Yearly: $278.40

Copy the price IDs into `.env`

**Step 4: Commit**

```bash
git add src/lib/stripe.ts .env.example
git commit -m "feat(stripe): setup Stripe SDK and price configuration

- Create Stripe client with API v2024-11-20
- Define tier limits (messages, students, features)
- Add environment variables for price IDs
- Document Stripe product creation

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

### Task 1.3: Create Checkout Session API

**Files:**
- Create: `src/app/api/stripe/create-checkout/route.ts`

**Step 1: Create checkout endpoint**

Create `src/app/api/stripe/create-checkout/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { stripe, STRIPE_PRICES } from '@/lib/stripe';
import { getSessionUser } from '@/lib/auth';
import prisma from '@/lib/db';

export async function POST(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { tier, billing } = await req.json();

  // Validate tier
  const validTiers = ['STUDENT', 'PARENT', 'FAMILY'];
  if (!validTiers.includes(tier)) {
    return NextResponse.json({ error: 'Invalid tier' }, { status: 400 });
  }

  // Get price ID
  const priceKey = `${tier}_${billing.toUpperCase()}` as keyof typeof STRIPE_PRICES;
  const priceId = STRIPE_PRICES[priceKey];

  if (!priceId) {
    return NextResponse.json({ error: 'Price not found' }, { status: 400 });
  }

  try {
    // Check if customer already exists
    let customerId: string | undefined;

    const existingSubscription = await prisma.subscription.findUnique({
      where: { userId: user.userId },
    });

    if (existingSubscription) {
      customerId = existingSubscription.stripeCustomerId;
    } else {
      // Create new Stripe customer
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: {
          userId: user.userId,
        },
      });
      customerId = customer.id;
    }

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/welcome?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/pricing`,
      metadata: {
        userId: user.userId,
        tier,
      },
      allow_promotion_codes: true,
    });

    return NextResponse.json({ sessionId: session.id, url: session.url });
  } catch (error) {
    console.error('[Stripe Checkout Error]', error);
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}
```

**Step 2: Test checkout creation**

```bash
# Start dev server
npm run dev

# Test with curl (replace with real user token)
curl -X POST http://localhost:3000/api/stripe/create-checkout \
  -H "Content-Type: application/json" \
  -d '{"tier": "STUDENT", "billing": "monthly"}'
```

Expected: Returns `{ sessionId: "cs_test_...", url: "https://checkout.stripe.com/..." }`

**Step 3: Commit**

```bash
git add src/app/api/stripe/create-checkout/route.ts
git commit -m "feat(stripe): add checkout session creation endpoint

- POST /api/stripe/create-checkout
- Creates or reuses Stripe customer
- Generates checkout session with success/cancel URLs
- Supports promotion codes
- Returns session ID and checkout URL

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

### Task 1.4: Handle Stripe Webhooks

**Files:**
- Create: `src/app/api/stripe/webhook/route.ts`

**Step 1: Create webhook handler**

Create `src/app/api/stripe/webhook/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import prisma from '@/lib/db';
import Stripe from 'stripe';

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = req.headers.get('stripe-signature');

  if (!sig || !process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error('[Webhook Error]', err);
    return NextResponse.json({ error: 'Webhook signature verification failed' }, { status: 400 });
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        await handleCheckoutCompleted(session);
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionUpdated(subscription);
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionDeleted(subscription);
        break;
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice;
        await handlePaymentSucceeded(invoice);
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        await handlePaymentFailed(invoice);
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('[Webhook Handler Error]', error);
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 });
  }
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const userId = session.metadata?.userId;
  const tier = session.metadata?.tier as 'STUDENT' | 'PARENT' | 'FAMILY';

  if (!userId || !tier) {
    throw new Error('Missing userId or tier in session metadata');
  }

  // Get subscription from Stripe
  const subscription = await stripe.subscriptions.retrieve(
    session.subscription as string
  );

  // Create or update subscription in database
  await prisma.subscription.upsert({
    where: { userId },
    create: {
      userId,
      stripeCustomerId: session.customer as string,
      stripeSubscriptionId: subscription.id,
      stripePriceId: subscription.items.data[0].price.id,
      tier,
      status: 'ACTIVE',
      currentPeriodEnd: new Date(subscription.current_period_end * 1000),
    },
    update: {
      stripeSubscriptionId: subscription.id,
      stripePriceId: subscription.items.data[0].price.id,
      tier,
      status: 'ACTIVE',
      currentPeriodEnd: new Date(subscription.current_period_end * 1000),
      cancelAtPeriodEnd: false,
    },
  });

  console.log(`[Checkout] Subscription created for user ${userId}, tier ${tier}`);

  // TODO: Send welcome email
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  await prisma.subscription.update({
    where: { stripeSubscriptionId: subscription.id },
    data: {
      status: subscription.status === 'active' ? 'ACTIVE' : 'PAST_DUE',
      currentPeriodEnd: new Date(subscription.current_period_end * 1000),
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
    },
  });

  console.log(`[Subscription] Updated ${subscription.id}`);
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  await prisma.subscription.update({
    where: { stripeSubscriptionId: subscription.id },
    data: {
      status: 'CANCELED',
      tier: 'FREE',
    },
  });

  console.log(`[Subscription] Canceled ${subscription.id}`);
}

async function handlePaymentSucceeded(invoice: Stripe.Invoice) {
  console.log(`[Payment] Succeeded for invoice ${invoice.id}`);
  // TODO: Send receipt email
}

async function handlePaymentFailed(invoice: Stripe.Invoice) {
  console.log(`[Payment] Failed for invoice ${invoice.id}`);
  // TODO: Send dunning email
}
```

**Step 2: Setup webhook in Stripe Dashboard**

1. Go to Stripe Dashboard → Developers → Webhooks
2. Click "Add endpoint"
3. URL: `https://your-domain.com/api/stripe/webhook`
4. Events to listen for:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
5. Copy webhook signing secret → Add to `.env` as `STRIPE_WEBHOOK_SECRET`

**Step 3: Test webhook locally (using Stripe CLI)**

```bash
# Install Stripe CLI: https://stripe.com/docs/stripe-cli
stripe login
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

**Step 4: Commit**

```bash
git add src/app/api/stripe/webhook/route.ts
git commit -m "feat(stripe): add webhook handler for subscription events

- Handle checkout.session.completed (create subscription)
- Handle customer.subscription.updated (update status)
- Handle customer.subscription.deleted (cancel subscription)
- Handle invoice payment events
- Verify webhook signature

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Phase 2: Pricing Page & Paywalls

### Task 2.1: Create Pricing Page

**Files:**
- Create: `src/app/pricing/page.tsx`

**Step 1: Create pricing page component**

Create `src/app/pricing/page.tsx`:

```typescript
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';

const TIERS = [
  {
    id: 'FREE',
    name: 'Try It',
    price: { monthly: 0, yearly: 0 },
    description: 'Perfect for trying Adeline',
    features: [
      '10 messages per month',
      '1 student profile',
      'All learning intents',
      'Join unlimited clubs',
      'Chat history (7 days)',
    ],
    cta: 'Start Free',
    ctaAction: '/chat',
  },
  {
    id: 'STUDENT',
    name: 'Student',
    price: { monthly: 2.99, yearly: 28.80 },
    description: 'Unlimited learning for one',
    features: [
      '✨ Unlimited messages',
      '1 student profile',
      'Create clubs',
      'Full conversation history',
      'Basic highlights',
    ],
    cta: 'Upgrade',
    popular: false,
  },
  {
    id: 'PARENT',
    name: 'Parent',
    price: { monthly: 19, yearly: 182.40 },
    description: 'Track one learner deeply',
    features: [
      'Everything in Student, plus:',
      '📊 Parent dashboard',
      '📁 Portfolio builder',
      'Learning timeline',
      'Weekly progress emails',
    ],
    cta: 'Upgrade',
    popular: false,
  },
  {
    id: 'FAMILY',
    name: 'Family',
    price: { monthly: 29, yearly: 278.40 },
    description: 'For multi-child families',
    features: [
      'Everything in Parent, plus:',
      '👨‍👩‍👧‍👦 Up to 6 students',
      '📄 PDF transcript exports',
      '✨ Advanced highlights',
      'Priority support',
    ],
    cta: 'Upgrade',
    popular: true,
  },
];

export default function PricingPage() {
  const [billing, setBilling] = useState<'monthly' | 'yearly'>('monthly');
  const router = useRouter();

  const handleUpgrade = async (tierId: string) => {
    if (tierId === 'FREE') {
      router.push('/chat');
      return;
    }

    const response = await fetch('/api/stripe/create-checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tier: tierId, billing }),
    });

    const { url } = await response.json();
    if (url) window.location.href = url;
  };

  return (
    <div style={{ minHeight: '100vh', background: '#FFFEF7', padding: '40px 24px' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <h1 style={{
            fontFamily: '"Emilys Candy", cursive',
            fontSize: '3rem',
            color: '#2F4731',
            marginBottom: 16,
          }}>
            Choose Your Plan
          </h1>
          <p style={{
            fontFamily: 'Kalam',
            fontSize: '1.2rem',
            color: '#4B3424',
            marginBottom: 24,
          }}>
            Start free, upgrade anytime. No credit card required.
          </p>

          {/* Billing Toggle */}
          <div style={{
            display: 'inline-flex',
            gap: 8,
            background: '#FFFFFF',
            border: '2px solid #E7DAC3',
            borderRadius: 999,
            padding: 4,
          }}>
            <button
              onClick={() => setBilling('monthly')}
              style={{
                padding: '8px 24px',
                borderRadius: 999,
                border: 'none',
                background: billing === 'monthly' ? '#BD6809' : 'transparent',
                color: billing === 'monthly' ? '#FFF' : '#2F4731',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Monthly
            </button>
            <button
              onClick={() => setBilling('yearly')}
              style={{
                padding: '8px 24px',
                borderRadius: 999,
                border: 'none',
                background: billing === 'yearly' ? '#BD6809' : 'transparent',
                color: billing === 'yearly' ? '#FFF' : '#2F4731',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Yearly <span style={{ fontSize: 12 }}>(Save 20%)</span>
            </button>
          </div>
        </div>

        {/* Pricing Cards */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          gap: 24,
        }}>
          {TIERS.map((tier) => (
            <motion.div
              key={tier.id}
              whileHover={{ scale: 1.02 }}
              style={{
                background: '#FFFFFF',
                border: tier.popular ? '3px solid #BD6809' : '1px solid #E7DAC3',
                borderRadius: 16,
                padding: 24,
                position: 'relative',
              }}
            >
              {tier.popular && (
                <div style={{
                  position: 'absolute',
                  top: -12,
                  left: '50%',
                  transform: 'translateX(-50%)',
                  background: '#BD6809',
                  color: '#FFF',
                  padding: '4px 16px',
                  borderRadius: 999,
                  fontSize: 12,
                  fontWeight: 700,
                }}>
                  Most Popular
                </div>
              )}

              <h3 style={{
                fontFamily: 'Kranky',
                fontSize: '1.5rem',
                color: '#2F4731',
                marginBottom: 8,
              }}>
                {tier.name}
              </h3>

              <div style={{ marginBottom: 16 }}>
                <span style={{
                  fontSize: '2.5rem',
                  fontWeight: 700,
                  color: '#2F4731',
                }}>
                  ${tier.price[billing]}
                </span>
                {tier.price.monthly > 0 && (
                  <span style={{ color: '#4B3424', fontSize: '1rem' }}>
                    /{billing === 'monthly' ? 'mo' : 'yr'}
                  </span>
                )}
              </div>

              <p style={{
                fontFamily: 'Kalam',
                color: '#4B3424',
                marginBottom: 24,
              }}>
                {tier.description}
              </p>

              <ul style={{ listStyle: 'none', padding: 0, marginBottom: 24 }}>
                {tier.features.map((feature, idx) => (
                  <li key={idx} style={{
                    fontFamily: 'Kalam',
                    color: '#121B13',
                    marginBottom: 12,
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 8,
                  }}>
                    <span style={{ color: '#BD6809', fontSize: 18 }}>✓</span>
                    {feature}
                  </li>
                ))}
              </ul>

              <button
                onClick={() => handleUpgrade(tier.id)}
                style={{
                  width: '100%',
                  padding: '12px 24px',
                  borderRadius: 12,
                  border: 'none',
                  background: tier.popular ? '#BD6809' : '#2F4731',
                  color: '#FFF',
                  fontWeight: 700,
                  fontSize: 16,
                  cursor: 'pointer',
                }}
              >
                {tier.cta}
              </button>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
```

**Step 2: Test pricing page**

```bash
npm run dev
# Navigate to http://localhost:3000/pricing
```

Expected: Pricing page displays with 4 tiers, billing toggle works

**Step 3: Commit**

```bash
git add src/app/pricing/page.tsx
git commit -m "feat(pricing): add pricing page with 4 tiers

- Display FREE, STUDENT, PARENT, FAMILY tiers
- Monthly/yearly billing toggle with 20% discount
- Most Popular badge on Family tier
- Integrate with Stripe checkout API
- Responsive grid layout

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

### Task 2.2: Add Message Limit Check

**Files:**
- Create: `src/lib/subscription.ts`
- Modify: `src/app/api/chat/route.ts`

**Step 1: Create subscription helpers**

Create `src/lib/subscription.ts`:

```typescript
import prisma from './db';
import { TIER_LIMITS } from './stripe';

export async function getUserSubscription(userId: string) {
  const subscription = await prisma.subscription.findUnique({
    where: { userId },
  });

  return subscription || { tier: 'FREE', status: 'ACTIVE' };
}

export async function checkMessageLimit(userId: string): Promise<{
  allowed: boolean;
  remaining: number;
  limit: number;
  tier: string;
}> {
  const subscription = await getUserSubscription(userId);
  const tier = subscription.tier || 'FREE';
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
```

**Step 2: Add limit check to chat route**

Modify `src/app/api/chat/route.ts` - add after rate limit check:

```typescript
import { checkMessageLimit, incrementMessageCount } from '@/lib/subscription';

// ... existing code ...

// After rate limit check:
const limitCheck = await checkMessageLimit(effectiveUserId);

if (!limitCheck.allowed) {
  return new Response(
    JSON.stringify({
      error: 'message_limit_reached',
      message: `You've used all ${limitCheck.limit} free messages this month. Upgrade to continue learning!`,
      tier: limitCheck.tier,
      limit: limitCheck.limit,
    }),
    { status: 403, headers: { 'Content-Type': 'application/json' } }
  );
}

// ... continue with chat logic ...

// After successful response, increment count:
await incrementMessageCount(effectiveUserId);
```

**Step 3: Test message limits**

```bash
# Send 11 messages as free user
# 11th should return 403 with paywall message
```

**Step 4: Commit**

```bash
git add src/lib/subscription.ts src/app/api/chat/route.ts
git commit -m "feat(subscription): add message limit enforcement

- Create subscription helpers
- Check message limits based on tier
- Monthly counter with auto-reset
- Return 403 with upgrade prompt when limit hit
- Increment counter on successful message

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

### Task 2.3: Create Paywall Modal

**Files:**
- Create: `src/components/subscription/PaywallModal.tsx`
- Modify: `src/app/(routes)/chat/page.tsx`

**Step 1: Create paywall modal component**

Create `src/components/subscription/PaywallModal.tsx`:

```typescript
'use client';

import { motion } from 'framer-motion';
import { WheatStalk } from '@/components/illustrations';

type Props = {
  open: boolean;
  onClose: () => void;
  remaining: number;
  limit: number;
};

export function PaywallModal({ open, onClose, remaining, limit }: Props) {
  if (!open) return null;

  const handleUpgrade = (tier: string) => {
    window.location.href = `/pricing?tier=${tier}`;
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(47,71,49,0.9)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
      }}
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        onClick={(e) => e.stopPropagation()}
        style={{
          background: '#FFFEF7',
          borderRadius: 24,
          padding: 40,
          maxWidth: 500,
          textAlign: 'center',
        }}
      >
        <WheatStalk size={80} color="#BD6809" />

        <h2 style={{
          fontFamily: 'Kranky',
          fontSize: '2rem',
          color: '#2F4731',
          marginTop: 16,
          marginBottom: 8,
        }}>
          You've Used All {limit} Free Messages
        </h2>

        <p style={{
          fontFamily: 'Kalam',
          color: '#4B3424',
          fontSize: '1.1rem',
          marginBottom: 32,
        }}>
          Upgrade to continue your learning journey with unlimited messages!
        </p>

        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
        }}>
          <button
            onClick={() => handleUpgrade('STUDENT')}
            style={{
              padding: '14px 24px',
              borderRadius: 12,
              border: 'none',
              background: '#BD6809',
              color: '#FFF',
              fontWeight: 700,
              fontSize: 18,
              cursor: 'pointer',
            }}
          >
            Upgrade for $2.99/mo →
          </button>

          <button
            onClick={() => handleUpgrade('FAMILY')}
            style={{
              padding: '14px 24px',
              borderRadius: 12,
              border: '2px solid #2F4731',
              background: 'transparent',
              color: '#2F4731',
              fontWeight: 700,
              fontSize: 16,
              cursor: 'pointer',
            }}
          >
            See All Plans
          </button>

          <button
            onClick={onClose}
            style={{
              marginTop: 8,
              padding: '8px',
              background: 'none',
              border: 'none',
              color: '#4B3424',
              textDecoration: 'underline',
              cursor: 'pointer',
            }}
          >
            Maybe later
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
```

**Step 2: Integrate into chat page**

Modify `src/app/(routes)/chat/page.tsx`:

```typescript
import { PaywallModal } from '@/components/subscription/PaywallModal';
import { useState } from 'react';

export default function ChatPage() {
  const [showPaywall, setShowPaywall] = useState(false);
  const [messageLimit, setMessageLimit] = useState({ remaining: 10, limit: 10 });

  const { messages, handleSubmit } = useChat({
    api: '/api/chat',
    onError: (error) => {
      const errorData = JSON.parse(error.message);
      if (errorData.error === 'message_limit_reached') {
        setMessageLimit({ remaining: 0, limit: errorData.limit });
        setShowPaywall(true);
      }
    },
  });

  return (
    <div>
      {/* Existing chat UI */}

      <PaywallModal
        open={showPaywall}
        onClose={() => setShowPaywall(false)}
        remaining={messageLimit.remaining}
        limit={messageLimit.limit}
      />
    </div>
  );
}
```

**Step 3: Test paywall**

Hit message limit → Modal appears with upgrade options

**Step 4: Commit**

```bash
git add src/components/subscription/PaywallModal.tsx src/app/\(routes\)/chat/page.tsx
git commit -m "feat(subscription): add paywall modal for message limits

- Beautiful modal with WheatStalk illustration
- Shows messages used/limit
- Quick upgrade to Student ($2.99)
- Link to all plans
- Closes on backdrop click or 'maybe later'

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Phase 3: Clubs & Public Showcase

### Task 3.1: Add Club Creation UI

**Files:**
- Create: `src/app/(routes)/clubs/page.tsx`
- Create: `src/app/api/clubs/create/route.ts`

**Step 1: Create club creation API**

Create `src/app/api/clubs/create/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { getUserSubscription } from '@/lib/subscription';
import { TIER_LIMITS } from '@/lib/stripe';
import prisma from '@/lib/db';

export async function POST(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Check if user can create clubs (paid tiers only)
  const subscription = await getUserSubscription(user.userId);
  const limits = TIER_LIMITS[subscription.tier || 'FREE'];

  if (!limits.canCreateClubs) {
    return NextResponse.json(
      { error: 'Upgrade to Student plan to create clubs' },
      { status: 403 }
    );
  }

  const { name, subject, description, isPublic } = await req.json();

  if (!name || !subject) {
    return NextResponse.json(
      { error: 'Name and subject required' },
      { status: 400 }
    );
  }

  try {
    const club = await prisma.club.create({
      data: {
        name,
        subject,
        description,
        isPublic: isPublic ?? true,
        creatorId: user.userId,
      },
    });

    // Auto-join creator as leader
    await prisma.clubMembership.create({
      data: {
        clubId: club.id,
        userId: user.userId,
        role: 'LEADER',
      },
    });

    return NextResponse.json(club);
  } catch (error) {
    console.error('[Club Creation Error]', error);
    return NextResponse.json(
      { error: 'Failed to create club' },
      { status: 500 }
    );
  }
}
```

**Step 2: Create clubs page**

Create `src/app/(routes)/clubs/page.tsx`:

```typescript
'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

const SUBJECTS = [
  { id: 'history', label: 'History', icon: '📜' },
  { id: 'science', label: 'Science', icon: '🔬' },
  { id: 'art', label: 'Art', icon: '🎨' },
  { id: 'coding', label: 'Coding', icon: '💻' },
  { id: 'literature', label: 'Literature', icon: '📚' },
  { id: 'geography', label: 'Geography', icon: '🌍' },
  { id: 'maker', label: 'Maker', icon: '🛠️' },
  { id: 'music', label: 'Music', icon: '🎵' },
];

export default function ClubsPage() {
  const [clubs, setClubs] = useState([]);
  const [showCreate, setShowCreate] = useState(false);
  const [newClub, setNewClub] = useState({
    name: '',
    subject: '',
    description: '',
    isPublic: true,
  });

  useEffect(() => {
    fetchClubs();
  }, []);

  const fetchClubs = async () => {
    const response = await fetch('/api/clubs');
    const data = await response.json();
    setClubs(data);
  };

  const handleCreate = async () => {
    const response = await fetch('/api/clubs/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newClub),
    });

    if (response.ok) {
      setShowCreate(false);
      setNewClub({ name: '', subject: '', description: '', isPublic: true });
      fetchClubs();
    } else {
      const error = await response.json();
      alert(error.error);
    }
  };

  return (
    <div style={{ padding: 24 }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 32,
      }}>
        <h1 style={{
          fontFamily: 'Kranky',
          fontSize: '2.5rem',
          color: '#2F4731',
        }}>
          Learning Clubs
        </h1>

        <button
          onClick={() => setShowCreate(true)}
          style={{
            padding: '12px 24px',
            borderRadius: 12,
            border: 'none',
            background: '#BD6809',
            color: '#FFF',
            fontWeight: 700,
            cursor: 'pointer',
          }}
        >
          + Create Club
        </button>
      </div>

      {/* Clubs Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
        gap: 20,
      }}>
        {clubs.map((club: any) => (
          <motion.div
            key={club.id}
            whileHover={{ scale: 1.02 }}
            style={{
              background: '#FFFFFF',
              border: '1px solid #E7DAC3',
              borderRadius: 16,
              padding: 20,
              cursor: 'pointer',
            }}
            onClick={() => window.location.href = `/clubs/${club.id}`}
          >
            <div style={{ fontSize: 48, marginBottom: 12 }}>
              {SUBJECTS.find(s => s.id === club.subject)?.icon || '📚'}
            </div>
            <h3 style={{
              fontFamily: 'Kranky',
              color: '#2F4731',
              marginBottom: 8,
            }}>
              {club.name}
            </h3>
            <p style={{
              fontFamily: 'Kalam',
              color: '#4B3424',
              fontSize: 14,
            }}>
              {club.description || 'No description'}
            </p>
          </motion.div>
        ))}
      </div>

      {/* Create Club Modal */}
      {showCreate && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
        }}
          onClick={() => setShowCreate(false)}
        >
          <div
            style={{
              background: '#FFFEF7',
              borderRadius: 16,
              padding: 32,
              maxWidth: 500,
              width: '100%',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 style={{
              fontFamily: 'Kranky',
              color: '#2F4731',
              marginBottom: 24,
            }}>
              Create a Club
            </h2>

            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', marginBottom: 8, fontWeight: 600 }}>
                Club Name
              </label>
              <input
                value={newClub.name}
                onChange={(e) => setNewClub({ ...newClub, name: e.target.value })}
                placeholder="Revolutionary War Timeline"
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: 8,
                  border: '1px solid #E7DAC3',
                  fontFamily: 'Kalam',
                }}
              />
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', marginBottom: 8, fontWeight: 600 }}>
                Subject
              </label>
              <select
                value={newClub.subject}
                onChange={(e) => setNewClub({ ...newClub, subject: e.target.value })}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: 8,
                  border: '1px solid #E7DAC3',
                  fontFamily: 'Kalam',
                }}
              >
                <option value="">Select a subject</option>
                {SUBJECTS.map(s => (
                  <option key={s.id} value={s.id}>
                    {s.icon} {s.label}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ marginBottom: 24 }}>
              <label style={{ display: 'block', marginBottom: 8, fontWeight: 600 }}>
                Description
              </label>
              <textarea
                value={newClub.description}
                onChange={(e) => setNewClub({ ...newClub, description: e.target.value })}
                placeholder="Build an interactive timeline of the Revolutionary War..."
                rows={4}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: 8,
                  border: '1px solid #E7DAC3',
                  fontFamily: 'Kalam',
                  resize: 'vertical',
                }}
              />
            </div>

            <div style={{ display: 'flex', gap: 12 }}>
              <button
                onClick={handleCreate}
                style={{
                  flex: 1,
                  padding: '12px',
                  borderRadius: 8,
                  border: 'none',
                  background: '#BD6809',
                  color: '#FFF',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                Create Club
              </button>
              <button
                onClick={() => setShowCreate(false)}
                style={{
                  padding: '12px 24px',
                  borderRadius: 8,
                  border: '1px solid #E7DAC3',
                  background: 'transparent',
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
```

**Step 3: Test club creation**

- As free user → should see "Upgrade" error
- As paid user → should create club successfully

**Step 4: Commit**

```bash
git add src/app/\(routes\)/clubs/page.tsx src/app/api/clubs/create/route.ts
git commit -m "feat(clubs): add club creation with tier gating

- Create clubs API with subscription check
- Clubs page with grid display
- Create club modal with form
- Auto-join creator as LEADER
- Gate feature to paid tiers ($2.99+)

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

Due to length constraints, I'll save the full plan now and you can access it. The plan continues with:

- Task 3.2-3.4: Club joining, showcase gallery, social sharing
- Phase 4: Referral system (4 tasks)
- Phase 5: SEO landing page (3 tasks)
- Phase 6: Email & Analytics (5 tasks)

Total: **~40 tasks across 6 phases**

Let me save this comprehensive plan:
