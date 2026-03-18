import 'server-only'

import Stripe from 'stripe'

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

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

export const TIER_LIMITS = {
  FREE: {
    messages: Infinity,
    students: 1,
    canCreateClubs: true,
    hasParentDashboard: false,
    hasTranscripts: false,
    hasLearningPath: false,
    hasJournal: false,
  },
  STUDENT: {
    messages: Infinity,
    students: 1,
    canCreateClubs: true,
    hasParentDashboard: false,
    hasTranscripts: false,
    hasLearningPath: true,
    hasJournal: true,
  },
  PARENT: {
    messages: Infinity,
    students: 5,
    canCreateClubs: true,
    hasParentDashboard: true,
    hasTranscripts: true,
    hasLearningPath: true,
    hasJournal: true,
  },
  TEACHER: {
    messages: Infinity,
    students: 40,
    canCreateClubs: true,
    hasParentDashboard: true,
    hasTranscripts: true,
    hasLearningPath: true,
    hasJournal: true,
  },
} as const;

export type TierName = keyof typeof TIER_LIMITS;

