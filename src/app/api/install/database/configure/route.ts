import { NextRequest, NextResponse } from 'next/server';
import {
    testDbConnection,
    initializeDatabase,
    type DbConfig,
    type DbProvider
} from '@/lib/db-config';

interface ConfigureRequest {
    provider: DbProvider;
    host: string;
    port: number;
    database: string;
    username: string;
    password: string;
    testOnly?: boolean;
}

/**
 * POST /api/install/database/configure
 * Configure and initialize database during installation
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json() as ConfigureRequest;

        // Validate required fields
        const { provider, host, port, database, username, password, testOnly } = body;

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

        // Test connection only
        if (testOnly) {
            const result = await testDbConnection(config);
            return NextResponse.json({
                success: result.success,
                message: result.success
                    ? `Connected successfully to ${result.version}`
                    : result.error,
                version: result.version,
            });
        }

        // Full initialization
        console.log('Starting database initialization...');
        const result = await initializeDatabase(config);

        if (result.success) {
            return NextResponse.json({
                success: true,
                message: 'Database initialized successfully',
                steps: result.steps,
            });
        } else {
            // Find the first failed step
            const failedStep = result.steps.find(s => !s.success);
            return NextResponse.json({
                success: false,
                error: failedStep?.error || 'Database initialization failed',
                steps: result.steps,
            }, { status: 500 });
        }
    } catch (error) {
        console.error('Database configuration error:', error);
        return NextResponse.json({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error occurred',
        }, { status: 500 });
    }
}
