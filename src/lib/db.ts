import { PrismaClient } from '../generated/prisma/client';

declare global {
  var prisma: PrismaClient | undefined;
}

const prisma =
  globalThis.prisma ??
  new PrismaClient({
    // Prisma 7 type requires accelerateUrl; provide env or blank.
    accelerateUrl: process.env.PRISMA_ACCELERATE_URL || '',
  });

if (process.env.NODE_ENV !== 'production') {
  globalThis.prisma = prisma;
}

export default prisma;
