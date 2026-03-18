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
    description: 'Full access: Learning Path, Daily Journal, unlimited chat, and all subjects.',
    priceInCents: 299,
    mode: 'subscription',
    interval: 'month',
  },
  PARENT_MONTHLY: {
    name: 'Dear Adeline — Parent',
    description: 'Everything in Student plus parent dashboard, transcripts, and up to 5 connected students.',
    priceInCents: 999,
    mode: 'subscription',
    interval: 'month',
  },
  TEACHER_MONTHLY: {
    name: 'Dear Adeline — Teacher',
    description: 'Everything in Parent plus classroom management and up to 40 connected students.',
    priceInCents: 2999,
    mode: 'subscription',
    interval: 'month',
  },
  EXTRA_STUDENT: {
    name: 'Additional Student',
    description: 'Add one more student to your Parent or Teacher account.',
    priceInCents: 299,
    mode: 'subscription',
    interval: 'month',
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
