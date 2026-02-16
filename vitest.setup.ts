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

// Mock next/headers
vi.mock('next/headers', () => ({
  cookies: vi.fn(() => ({
    get: vi.fn(),
    set: vi.fn(),
  })),
  headers: vi.fn(() => new Headers()),
}));
