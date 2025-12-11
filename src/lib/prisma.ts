import 'server-only';

import { PrismaClient } from '@prisma/client';

// Global prisma instance cache for development hot-reload
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Create a simple SQLite Prisma client
function createPrismaClient(): PrismaClient {
  return new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });
}

// Export singleton instance
export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

// Async getter for compatibility with existing code
export async function getPrismaClient(): Promise<PrismaClient> {
  return prisma;
}

// Reset prisma client (useful for testing)
export async function resetPrismaClient(): Promise<void> {
  if (globalForPrisma.prisma) {
    await globalForPrisma.prisma.$disconnect();
  }
  globalForPrisma.prisma = undefined;
}
