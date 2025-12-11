import 'server-only';

import { PrismaClient } from '@prisma/client';

// Check if we're in build mode or DATABASE_URL is not set
function shouldSkipDbConnection(): boolean {
  // Skip during build
  if (process.env.NEXT_PHASE === 'phase-production-build') {
    return true;
  }
  // Skip if no DATABASE_URL
  if (!process.env.DATABASE_URL) {
    return true;
  }
  return false;
}

// Dynamic adapter selection based on DB_PROVIDER
async function createPrismaClient(): Promise<PrismaClient> {
  const provider = process.env.DB_PROVIDER || 'postgresql';
  const databaseUrl = process.env.DATABASE_URL;

  // During build or without DATABASE_URL, create a dummy client that will fail at runtime
  if (shouldSkipDbConnection()) {
    console.warn('Skipping database connection (build mode or no DATABASE_URL)');
    // Return a PrismaClient without adapter - it will fail but won't block build
    return new PrismaClient({
      log: ['error'],
    });
  }

  if (provider === 'mysql') {
    // MySQL/MariaDB adapter using mariadb driver
    const { PrismaMariaDb } = await import('@prisma/adapter-mariadb');

    // Parse the DATABASE_URL to extract connection details
    const url = new URL(databaseUrl || 'mysql://localhost:3306/db');
    const adapter = new PrismaMariaDb({
      host: url.hostname,
      port: parseInt(url.port || '3306', 10),
      user: url.username,
      password: decodeURIComponent(url.password || ''),
      database: url.pathname.replace('/', '') || undefined,
    });

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
