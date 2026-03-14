'use client'

import { useCallback } from 'react'
import { loadStripe } from '@stripe/stripe-js'
import { EmbeddedCheckout, EmbeddedCheckoutProvider } from '@stripe/react-stripe-js'
import { startCheckoutSession } from '@/app/actions/checkout'

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

export function CheckoutForm({ productId }: { productId: string }) {
  const fetchClientSecret = useCallback(async () => {
    const secret = await startCheckoutSession(productId)
    return secret!
  }, [productId])

  return (
    <EmbeddedCheckoutProvider
      stripe={stripePromise}
      options={{ fetchClientSecret }}
    >
      <EmbeddedCheckout />
    </EmbeddedCheckoutProvider>
  )
}
