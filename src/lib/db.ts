import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { getDatabaseUrl } from './db-config';

declare global {
  var prisma: PrismaClient | undefined;
}

function createClient(): PrismaClient {
  const accelerateUrl = process.env.PRISMA_ACCELERATE_URL;

  // If Prisma Accelerate is configured, it is the only required URL.
  if (accelerateUrl) {
    return new PrismaClient({ accelerateUrl });
  }

  const url = getDatabaseUrl('app');
  if (!url) {
    throw new Error('[db] DATABASE_URL is not set. Please add it to your .env file.');
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
