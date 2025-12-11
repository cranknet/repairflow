import { NextResponse } from 'next/server';
import { isDatabaseConfigured } from '@/lib/install-check';

/**
 * GET /api/install/database
 * Check current database configuration status (not connection test)
 * The actual connection test is done via POST /api/install/database/configure
 */
export async function GET() {
    const dbConfigured = isDatabaseConfigured();
    const provider = process.env.DB_PROVIDER || 'postgresql';

    if (!dbConfigured) {
        return NextResponse.json({
            connected: false,
            configured: false,
            type: 'Not configured',
            message: 'Please configure your database connection',
        });
    }

    // If configured, try to connect
    try {
        const { prisma } = await import('@/lib/prisma');

        // Test connection by running a simple query
        await prisma.$queryRaw`SELECT 1`;

        // Determine database type from DATABASE_URL
        const databaseUrl = process.env.DATABASE_URL || '';
        let dbType = provider === 'mysql' ? 'MySQL' : 'PostgreSQL';

        if (databaseUrl.startsWith('postgresql://') || databaseUrl.startsWith('postgres://')) {
            dbType = 'PostgreSQL';
        } else if (databaseUrl.startsWith('mysql://')) {
            dbType = 'MySQL';
        }

        return NextResponse.json({
            connected: true,
            configured: true,
            type: dbType,
            canRead: true,
            canWrite: true,
        });
    } catch (error) {
        console.error('Database connection error:', error);
        return NextResponse.json({
            connected: false,
            configured: true,
            type: provider === 'mysql' ? 'MySQL' : 'PostgreSQL',
            error: error instanceof Error ? error.message : 'Failed to connect to database',
        }, { status: 500 });
    }
}
