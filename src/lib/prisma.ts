import 'server-only';

import { PrismaClient } from '@prisma/client';

// Dynamic adapter selection based on DB_PROVIDER
async function createPrismaClient(): Promise<PrismaClient> {
  const provider = process.env.DB_PROVIDER || 'postgresql';
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    console.warn('DATABASE_URL not set, Prisma client may not work correctly');
  }

  if (provider === 'mysql') {
    // MySQL/MariaDB adapter using mariadb driver
    // Convert mysql:// to mariadb:// for the driver (Prisma CLI uses mysql://)
    const mariadb = await import('mariadb');
    const { PrismaMariaDb } = await import('@prisma/adapter-mariadb');

    const mariaDbUrl = (databaseUrl || '').replace(/^mysql:\/\//, 'mariadb://');
    const pool = mariadb.createPool({
      uri: mariaDbUrl,
      connectionLimit: 5,
      acquireTimeout: 5000, // 5 second timeout
      connectTimeout: 5000,
    });
    const adapter = new PrismaMariaDb(pool);

    return new PrismaClient({
      adapter,
      log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    });
  } else {
    // PostgreSQL adapter using pg (default)
    const pg = await import('pg');
    const { PrismaPg } = await import('@prisma/adapter-pg');

    const pool = new pg.Pool({ connectionString: databaseUrl });
    const adapter = new PrismaPg(pool);

    return new PrismaClient({
      adapter,
      log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    });
  }
}

// Global prisma instance cache
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
  prismaPromise: Promise<PrismaClient> | undefined;
};

// Lazy initialization - create client on first use
async function getPrismaClient(): Promise<PrismaClient> {
  if (globalForPrisma.prisma) {
    return globalForPrisma.prisma;
  }

  if (!globalForPrisma.prismaPromise) {
    globalForPrisma.prismaPromise = createPrismaClient().then((client) => {
      globalForPrisma.prisma = client;
      return client;
    });
  }

  return globalForPrisma.prismaPromise;
}

// For synchronous access after initialization
// Note: This throws if prisma hasn't been initialized yet
function getPrismaSyncUnsafe(): PrismaClient {
  if (!globalForPrisma.prisma) {
    throw new Error('Prisma client not yet initialized. Use getPrismaClient() async function.');
  }
  return globalForPrisma.prisma;
}

// Export a proxy that lazily initializes
// This maintains backward compatibility with existing code that uses `prisma.table.find()`
export const prisma = new Proxy({} as PrismaClient, {
  get(target, prop) {
    // If already initialized, use the real client
    if (globalForPrisma.prisma) {
      return (globalForPrisma.prisma as unknown as Record<string | symbol, unknown>)[prop];
    }

    // For methods that need async initialization
    if (typeof prop === 'string') {
      // Return a function that initializes and then calls the method
      return new Proxy(() => { }, {
        get(_, subProp) {
          return async (...args: unknown[]) => {
            const client = await getPrismaClient();
            const model = (client as unknown as Record<string, unknown>)[prop];
            if (model && typeof model === 'object') {
              const method = (model as Record<string | symbol, unknown>)[subProp];
              if (typeof method === 'function') {
                return (method as (...args: unknown[]) => Promise<unknown>).call(model, ...args);
              }
            }
            throw new Error(`Method ${String(prop)}.${String(subProp)} not found`);
          };
        },
        apply: async (_, __, args) => {
          const client = await getPrismaClient();
          const method = (client as unknown as Record<string, unknown>)[prop];
          if (typeof method === 'function') {
            return (method as (...args: unknown[]) => Promise<unknown>).call(client, ...args);
          }
          throw new Error(`Method ${String(prop)} not found`);
        },
      });
    }

    return undefined;
  },
});

// Export async getter for explicit initialization
export { getPrismaClient };

// Reset prisma client (useful when switching databases)
export async function resetPrismaClient(): Promise<void> {
  if (globalForPrisma.prisma) {
    await globalForPrisma.prisma.$disconnect();
  }
  globalForPrisma.prisma = undefined;
  globalForPrisma.prismaPromise = undefined;
}
