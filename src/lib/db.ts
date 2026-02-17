import { PrismaClient } from '../generated/prisma';
import { PrismaPg } from '@prisma/adapter-pg';

declare global {
  var prisma: PrismaClient | undefined;
}

function createClient(): PrismaClient {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error('[db] DATABASE_URL is not set. Please add it to your .env file.');
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
