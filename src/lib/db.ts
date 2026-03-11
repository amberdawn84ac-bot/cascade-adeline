import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

declare global {
  var prisma: PrismaClient | undefined;
  var pgPool: Pool | undefined;
}

function createClient(): PrismaClient {
  const connectionString = process.env.DIRECT_DATABASE_URL || process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error('DATABASE_URL is not set');
  }

  if (!globalThis.pgPool) {
    globalThis.pgPool = new Pool({
      connectionString,
      ssl: { rejectUnauthorized: false },
      max: 5,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
    });
  }

  const adapter = new PrismaPg(globalThis.pgPool);

  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });
}

// Lazy initialization - only create client when first accessed
let prismaInstance: PrismaClient | undefined;

const prisma = new Proxy({} as PrismaClient, {
  get(target, prop) {
    if (!prismaInstance) {
      prismaInstance = globalThis.prisma ?? createClient();
      if (process.env.NODE_ENV !== 'production') {
        globalThis.prisma = prismaInstance;
      }
    }
    return (prismaInstance as any)[prop];
  }
});

export default prisma;

