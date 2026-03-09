import { PrismaClient } from '@prisma/client';

declare global {
  var prisma: PrismaClient | undefined;
}

function createClient(): PrismaClient {
  return new PrismaClient({
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
