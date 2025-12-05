import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/install/database
 * Test database connection
 */
export async function GET() {
    try {
        // Test connection by running a simple query
        await prisma.$queryRaw`SELECT 1`;

        // Determine database type from DATABASE_URL
        const databaseUrl = process.env.DATABASE_URL || '';
        let dbType = 'Unknown';

        if (databaseUrl.startsWith('file:') || databaseUrl.includes('.db')) {
            dbType = 'SQLite';
        } else if (databaseUrl.startsWith('postgresql://') || databaseUrl.startsWith('postgres://')) {
            dbType = 'PostgreSQL';
        } else if (databaseUrl.startsWith('mysql://')) {
            dbType = 'MySQL';
        }

        // Try to create initial settings to verify write access
        await prisma.settings.upsert({
            where: { key: 'install_db_test' },
            update: { value: new Date().toISOString() },
            create: {
                key: 'install_db_test',
                value: new Date().toISOString(),
                description: 'Database write test during installation',
            },
        });

        // Clean up test record
        await prisma.settings.delete({
            where: { key: 'install_db_test' },
        }).catch(() => {
            // Ignore if delete fails
        });

        return NextResponse.json({
            connected: true,
            type: dbType,
            canRead: true,
            canWrite: true,
        });
    } catch (error) {
        console.error('Database connection error:', error);
        return NextResponse.json({
            connected: false,
            type: 'Unknown',
            error: error instanceof Error ? error.message : 'Failed to connect to database',
        }, { status: 500 });
    }
}
