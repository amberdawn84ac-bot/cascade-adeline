import { vi } from 'vitest';
import '@testing-library/jest-dom/vitest';

// Mock environment variables
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test';
process.env.OPENAI_API_KEY = 'sk-test-key';
process.env.UPSTASH_REDIS_REST_URL = 'https://test.upstash.io';
process.env.UPSTASH_REDIS_REST_TOKEN = 'test-token';

// Mock Next.js server-only modules
vi.mock('server-only', () => ({}));

// Mock Prisma client
vi.mock('@/lib/db', () => ({
  default: {
    user: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    conversationMemory: {
      findMany: vi.fn(),
      create: vi.fn(),
      count: vi.fn(),
    },
    transcriptEntry: {
      findMany: vi.fn(),
      create: vi.fn(),
    },
    reflectionEntry: {
      findMany: vi.fn(),
      create: vi.fn(),
      count: vi.fn(),
    },
    highlight: {
      findMany: vi.fn(),
      create: vi.fn(),
    },
    userConceptMastery: {
      findMany: vi.fn(),
      update: vi.fn(),
    },
    concept: {
      findMany: vi.fn(),
    },
    reviewSchedule: {
      findMany: vi.fn(),
      upsert: vi.fn(),
    },
    $queryRaw: vi.fn(),
  },
}));

// Mock Redis
vi.mock('@/lib/redis', () => ({
  default: {
    get: vi.fn(),
    set: vi.fn(),
    incr: vi.fn(),
    expire: vi.fn(),
    rpush: vi.fn(),
    ltrim: vi.fn(),
    lrange: vi.fn(),
  },
}));

// Mock AI SDK
vi.mock('ai', () => ({
  streamText: vi.fn(() => ({
    toUIMessageStreamResponse: vi.fn(() => new Response()),
  })),
  createUIMessageStream: vi.fn(),
  createUIMessageStreamResponse: vi.fn(),
  generateText: vi.fn(() => ({
    text: 'mock response',
  })),
}));

// Mock Stripe
process.env.STRIPE_SECRET_KEY = 'sk_test_mock';
vi.mock('@/lib/stripe', () => ({
  stripe: {
    customers: { create: vi.fn() },
    checkout: { sessions: { create: vi.fn() } },
    subscriptions: { retrieve: vi.fn() },
    webhooks: { constructEvent: vi.fn() },
    billingPortal: { sessions: { create: vi.fn() } },
  },
  STRIPE_PRICES: {
    STUDENT_MONTHLY: 'price_test_student_monthly',
    STUDENT_YEARLY: 'price_test_student_yearly',
    PARENT_MONTHLY: 'price_test_parent_monthly',
    PARENT_YEARLY: 'price_test_parent_yearly',
    FAMILY_MONTHLY: 'price_test_family_monthly',
    FAMILY_YEARLY: 'price_test_family_yearly',
  },
  TIER_LIMITS: {
    FREE: { messages: 10, students: 1, canCreateClubs: false, hasParentDashboard: false, hasTranscripts: false },
    STUDENT: { messages: Infinity, students: 1, canCreateClubs: true, hasParentDashboard: false, hasTranscripts: false },
    PARENT: { messages: Infinity, students: 1, canCreateClubs: true, hasParentDashboard: true, hasTranscripts: false },
    FAMILY: { messages: Infinity, students: 6, canCreateClubs: true, hasParentDashboard: true, hasTranscripts: true },
  },
}));

// Mock semantic cache
vi.mock('@/lib/semantic-cache', () => ({
  getCachedResponse: vi.fn(() => null),
  cacheResponse: vi.fn(),
  getSemanticCacheStats: vi.fn(() => ({ hits: 0, misses: 0, stores: 0, hitRate: '0%' })),
}));

// Mock subscription helpers
vi.mock('@/lib/subscription', () => ({
  getUserSubscription: vi.fn(() => ({ tier: 'FREE', status: 'ACTIVE' })),
  checkMessageLimit: vi.fn(() => ({ allowed: true, remaining: 9, limit: 10, tier: 'FREE' })),
  incrementMessageCount: vi.fn(),
}));

// Mock next/headers
vi.mock('next/headers', () => ({
  cookies: vi.fn(() => ({
    get: vi.fn(),
    set: vi.fn(),
  })),
  headers: vi.fn(() => new Headers()),
}));
