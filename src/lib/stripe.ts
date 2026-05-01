import 'server-only'

import Stripe from 'stripe'

let _stripe: Stripe | undefined;
export const stripe: Stripe = new Proxy({} as Stripe, {
  get(_target, prop) {
    if (!_stripe) {
      if (!process.env.STRIPE_SECRET_KEY) {
        throw new Error('STRIPE_SECRET_KEY is not set');
      }
      _stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    }
    return (_stripe as any)[prop];
  },
});

// Price IDs (set these after creating products in Stripe Dashboard)
export const STRIPE_PRICES = {
  STUDENT_MONTHLY: process.env.STRIPE_PRICE_STUDENT_MONTHLY || '',
  STUDENT_YEARLY: process.env.STRIPE_PRICE_STUDENT_YEARLY || '',
  PARENT_MONTHLY: process.env.STRIPE_PRICE_PARENT_MONTHLY || '',
  PARENT_YEARLY: process.env.STRIPE_PRICE_PARENT_YEARLY || '',
  TEACHER_MONTHLY: process.env.STRIPE_PRICE_TEACHER_MONTHLY || '',
  TEACHER_YEARLY: process.env.STRIPE_PRICE_TEACHER_YEARLY || '',
  EXTRA_STUDENT: process.env.STRIPE_PRICE_EXTRA_STUDENT || '',
};

export { TIER_LIMITS } from './tiers';
export type { TierName } from './tiers';

