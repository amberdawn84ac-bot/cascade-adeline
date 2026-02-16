import { PrismaClient } from '../generated/prisma';
import { PrismaPg } from '@prisma/adapter-pg';

declare global {
  var prisma: PrismaClient | undefined;
}

function createClient(): PrismaClient {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.warn('[db] DATABASE_URL is not set — Prisma client will not be functional');
    // Return a stub client that will throw on actual DB calls
    return new PrismaClient({ accelerateUrl: 'https://placeholder.prisma.io' }) as PrismaClient;
  }

  // If a Prisma Accelerate URL is provided, use it directly
  if (process.env.PRISMA_ACCELERATE_URL) {
    return new PrismaClient({
      accelerateUrl: process.env.PRISMA_ACCELERATE_URL,
    });
  }

  // Otherwise use the pg driver adapter for direct Supabase/Postgres connections
  const adapter = new PrismaPg({ connectionString: url });
  return new PrismaClient({ adapter });
}

const prisma = globalThis.prisma ?? createClient();

if (process.env.NODE_ENV !== 'production') {
  globalThis.prisma = prisma;
}

export default prisma;
