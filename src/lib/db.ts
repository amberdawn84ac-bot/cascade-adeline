import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

declare global {
  var prisma: PrismaClient | undefined;
  var pool: Pool | undefined;
}

function createClient(): PrismaClient {
  const connectionString = process.env.DATABASE_URL;
  
  if (!connectionString) {
    throw new Error('DATABASE_URL is not set');
  }

  // Reuse pool in development to avoid "too many clients" error
  if (!globalThis.pool) {
    globalThis.pool = new Pool({ 
      connectionString,
      ssl: {
        rejectUnauthorized: false
      },
      max: 10, // Limit connections
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
    });
  }
  
  const adapter = new PrismaPg(globalThis.pool);
  
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
