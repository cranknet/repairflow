import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import {
    testDbConnection,
    initializeDatabase,
    exportDatabaseData,
    importDatabaseData,
    type DbConfig,
    type DbProvider
} from '@/lib/db-config';
import { resetPrismaClient } from '@/lib/prisma';

interface SwitchRequest {
    provider: DbProvider;
    host: string;
    port: number;
    database: string;
    username: string;
    password: string;
    migrateData?: boolean;
}

/**
 * POST /api/settings/database/switch
 * Switch database provider (Admin only)
 */
export async function POST(request: NextRequest) {
    try {
        // Check authentication
        const session = await auth();
        if (!session || session.user?.role !== 'ADMIN') {
            return NextResponse.json({
                success: false,
                error: 'Unauthorized. Admin access required.',
            }, { status: 401 });
        }

        const body = await request.json() as SwitchRequest;

        // Validate required fields
        const { provider, host, port, database, username, password, migrateData } = body;

        if (!provider || !['postgresql', 'mysql'].includes(provider)) {
            return NextResponse.json({
                success: false,
                error: 'Invalid provider. Must be "postgresql" or "mysql".',
            }, { status: 400 });
        }

        if (!host || !database || !username) {
            return NextResponse.json({
                success: false,
                error: 'Missing required fields: host, database, username',
            }, { status: 400 });
        }

        const config: DbConfig = {
            provider,
            host,
            port: port || (provider === 'postgresql' ? 5432 : 3306),
            database,
            username,
            password: password || '',
        };

        // Step 1: Test new connection
        console.log('Testing new database connection...');
        const testResult = await testDbConnection(config);
        if (!testResult.success) {
            return NextResponse.json({
                success: false,
                error: `Connection test failed: ${testResult.error}`,
            }, { status: 400 });
        }

        // Step 2: Export current data if migration requested
        let exportedData: Record<string, unknown[]> | null = null;
        if (migrateData) {
            console.log('Exporting current database data...');
            try {
                exportedData = await exportDatabaseData();
                console.log(`Exported ${Object.keys(exportedData).length} tables`);
            } catch (error) {
                console.error('Failed to export data:', error);
                return NextResponse.json({
                    success: false,
                    error: 'Failed to export current data. Switch aborted.',
                }, { status: 500 });
            }
        }

        // Step 3: Reset current Prisma client
        console.log('Disconnecting current database...');
        await resetPrismaClient();

        // Step 4: Initialize new database
        console.log('Initializing new database...');
        const initResult = await initializeDatabase(config);

        if (!initResult.success) {
            const failedStep = initResult.steps.find(s => !s.success);
            return NextResponse.json({
                success: false,
                error: `Database initialization failed: ${failedStep?.error || 'Unknown error'}`,
                steps: initResult.steps,
            }, { status: 500 });
        }

        // Step 5: Import data if migration was requested
        if (migrateData && exportedData) {
            console.log('Importing data to new database...');
            try {
                const importResult = await importDatabaseData(exportedData);
                if (!importResult.success) {
                    console.warn('Some tables failed to import:', importResult.failed);
                }

                return NextResponse.json({
                    success: true,
                    message: 'Database switched successfully with data migration',
                    dataImported: importResult.imported,
                    dataFailed: importResult.failed,
                    steps: initResult.steps,
                });
            } catch (error) {
                console.error('Failed to import data:', error);
                return NextResponse.json({
                    success: true,
                    warning: 'Database switched but data import failed. Please restore from backup.',
                    steps: initResult.steps,
                });
            }
        }

        return NextResponse.json({
            success: true,
            message: 'Database switched successfully',
            steps: initResult.steps,
        });
    } catch (error) {
        console.error('Database switch error:', error);
        return NextResponse.json({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error occurred',
        }, { status: 500 });
    }
}

/**
 * GET /api/settings/database/switch
 * Get current database configuration status
 */
export async function GET() {
    try {
        const provider = process.env.DB_PROVIDER || 'postgresql';
        const databaseUrl = process.env.DATABASE_URL || '';

        // Parse connection info from URL (don't expose password)
        let host = '';
        let port = '';
        let database = '';

        try {
            const url = new URL(databaseUrl);
            host = url.hostname;
            port = url.port || (provider === 'mysql' ? '3306' : '5432');
            database = url.pathname.replace('/', '').split('?')[0];
        } catch {
            // URL parsing failed, connection might not be configured
        }

        return NextResponse.json({
            provider,
            host,
            port,
            database,
            configured: !!databaseUrl,
        });
    } catch (error) {
        console.error('Error getting database status:', error);
        return NextResponse.json({
            provider: 'unknown',
            configured: false,
        });
    }
}
