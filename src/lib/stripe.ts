import Stripe from 'stripe';

const STRIPE_SECRET = process.env.STRIPE_SECRET_KEY;

export const stripe = STRIPE_SECRET 
  ? new Stripe(STRIPE_SECRET, {
      apiVersion: '2026-01-28.clover',
      typescript: true,
    })
  : (new Proxy({}, {
      get: () => {
        throw new Error('Stripe is not configured (STRIPE_SECRET_KEY missing)');
      }
    }) as unknown as Stripe);

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
} as const;

export type TierName = keyof typeof TIER_LIMITS;
