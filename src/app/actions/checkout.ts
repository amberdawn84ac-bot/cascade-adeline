'use server'

import { getSessionUser } from '@/lib/auth'
import { stripe } from '@/lib/stripe'
import prisma from '@/lib/db'

interface Product {
  name: string
  description: string
  priceInCents: number
  mode: 'payment' | 'subscription'
  interval?: 'month' | 'year'
}

const PRODUCT_CATALOG: Record<string, Product> = {
  STUDENT_MONTHLY: {
    name: 'Dear Adeline — Student',
    description: 'Unlimited AI tutoring, personalized learning paths, and living books library.',
    priceInCents: 999,
    mode: 'subscription',
    interval: 'month',
  },
  STUDENT_YEARLY: {
    name: 'Dear Adeline — Student (Annual)',
    description: 'Unlimited AI tutoring, personalized learning paths, and living books library.',
    priceInCents: 9900,
    mode: 'subscription',
    interval: 'year',
  },
  PARENT_MONTHLY: {
    name: 'Dear Adeline — Parent',
    description: 'Everything in Student plus parent dashboard, progress tracking, and transcript generation.',
    priceInCents: 1499,
    mode: 'subscription',
    interval: 'month',
  },
  PARENT_YEARLY: {
    name: 'Dear Adeline — Parent (Annual)',
    description: 'Everything in Student plus parent dashboard, progress tracking, and transcript generation.',
    priceInCents: 14900,
    mode: 'subscription',
    interval: 'year',
  },
  FAMILY_MONTHLY: {
    name: 'Dear Adeline — Family',
    description: 'Up to 6 students, parent dashboard, transcript generation, and family co-ops.',
    priceInCents: 1999,
    mode: 'subscription',
    interval: 'month',
  },
  FAMILY_YEARLY: {
    name: 'Dear Adeline — Family (Annual)',
    description: 'Up to 6 students, parent dashboard, transcript generation, and family co-ops.',
    priceInCents: 19900,
    mode: 'subscription',
    interval: 'year',
  },
}

async function getProduct(productId: string): Promise<Product> {
  const product = PRODUCT_CATALOG[productId]
  if (!product) throw new Error(`Unknown product: ${productId}`)
  return product
}

export async function startCheckoutSession(productId: string) {
  const user = await getSessionUser()
  if (!user) throw new Error('Unauthorized')

  const product = await getProduct(productId)

  // Reuse existing Stripe customer if available
  let customerId: string | undefined
  const existing = await prisma.subscription.findUnique({ where: { userId: user.userId } })
  if (existing?.stripeCustomerId) {
    customerId = existing.stripeCustomerId
  } else {
    const customer = await stripe.customers.create({
      email: user.email || undefined,
      metadata: { userId: user.userId },
    })
    customerId = customer.id
  }

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    ui_mode: 'embedded',
    redirect_on_completion: 'never',
    line_items: [
      {
        price_data: {
          currency: 'usd',
          product_data: {
            name: product.name,
            description: product.description,
          },
          unit_amount: product.priceInCents,
          ...(product.mode === 'subscription' && product.interval
            ? { recurring: { interval: product.interval } }
            : {}),
        },
        quantity: 1,
      },
    ],
    mode: product.mode,
    metadata: { userId: user.userId, productId },
  })

  return session.client_secret
}
