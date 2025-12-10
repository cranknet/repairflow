import 'server-only';

import { PrismaClient } from '@prisma/client';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';

// Create the adapter with the database path
const adapter = new PrismaBetterSqlite3({
  url: process.env.DATABASE_URL ?? 'file:./prisma/dev.db',
});

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

// Note: For MySQL support, use prisma/mysql/schema.prisma and create a separate
// lib/prisma-mysql.ts entry point, or swap this file at deployment time.
// The mariadb driver requires:
//   import { PrismaMariaDb } from '@prisma/adapter-mariadb';
//   import mariadb from 'mariadb';
//   const pool = mariadb.createPool(process.env.DATABASE_URL);
//   const adapter = new PrismaMariaDb(pool);
