import { NextResponse } from 'next/server';
import type { EnvCheckResult } from '@/app/(setup)/install/lib/validation';
import { isDatabaseConfigured } from '@/lib/install-check';

/**
 * Detect database type from DATABASE_URL
 */
function getDatabaseType(): { type: 'sqlite' | 'postgresql' | 'unknown'; displayName: string } {
    const databaseUrl = process.env.DATABASE_URL || '';

    if (databaseUrl.startsWith('file:')) {
        return { type: 'sqlite', displayName: 'SQLite' };
    }
    if (databaseUrl.startsWith('postgresql://') || databaseUrl.startsWith('postgres://')) {
        return { type: 'postgresql', displayName: 'PostgreSQL' };
    }

    return { type: 'unknown', displayName: 'Unknown' };
}

/**
 * Test database connection
 */
async function testDatabaseConnection(): Promise<{
    success: boolean;
    error?: string;
    troubleshooting?: string[];
}> {
    const databaseUrl = process.env.DATABASE_URL;

    if (!databaseUrl) {
        return {
            success: false,
            error: 'DATABASE_URL is not set',
            troubleshooting: [
                'Set DATABASE_URL in your .env file or environment variables',
                'For local development: DATABASE_URL="file:./prisma/dev.db"',
                'For production: DATABASE_URL="postgresql://user:password@host:5432/database"',
            ],
        };
    }

    try {
        // Dynamic import to avoid issues when DB isn't configured
        const { prisma } = await import('@/lib/prisma');

        // Simple connectivity test - try to count settings (fast query)
        await prisma.$queryRaw`SELECT 1`;

        return { success: true };
    } catch (error) {
        const err = error as { code?: string; message?: string };
        const dbType = getDatabaseType();

        // Generate specific troubleshooting hints based on error
        const troubleshooting: string[] = [];

        if (err.code === 'P1001' || err.message?.includes("Can't reach")) {
            troubleshooting.push('Database server is not running or unreachable');
            if (dbType.type === 'postgresql') {
                troubleshooting.push('Check that your PostgreSQL server is running');
                troubleshooting.push('Verify the host and port in DATABASE_URL are correct');
                troubleshooting.push('For Supabase: Use port 5432, not 6543');
            }
        } else if (err.code === 'P1002') {
            troubleshooting.push('Database connection timed out');
            troubleshooting.push('Check your network connectivity');
        } else if (err.code === 'P1003') {
            troubleshooting.push('Database does not exist');
            troubleshooting.push('Create the database first or check the database name in your connection string');
        } else if (err.message?.includes('password')) {
            troubleshooting.push('Check your database password is correct');
            troubleshooting.push('Special characters in password must be URL-encoded');
        } else if (err.message?.includes('SSL') || err.message?.includes('TLS')) {
            troubleshooting.push('SSL/TLS connection issue');
            troubleshooting.push('Try adding ?sslmode=require or ?sslmode=disable to your connection string');
        } else if (err.message?.includes('SQLITE') || err.message?.includes('ENOENT')) {
            troubleshooting.push('SQLite database file not found');
            troubleshooting.push('Run: npx prisma db push to create the database');
        } else {
            troubleshooting.push('Check that DATABASE_URL is correctly formatted');
            troubleshooting.push('Verify database credentials are correct');
        }

        // Add Vercel-specific hint if value looks corrupted
        if (err.message?.includes('DATABASE_URL=') || databaseUrl.startsWith('DATABASE_URL=')) {
            troubleshooting.unshift('❗ DATABASE_URL contains "DATABASE_URL=" prefix - remove it in Vercel settings');
        }

        return {
            success: false,
            error: err.message || 'Unknown database error',
            troubleshooting,
        };
    }
}

/**
 * GET /api/install/environment
 * Check required environment variables and database connection
 */
export async function GET() {
    const checks: EnvCheckResult[] = [];

    // Get database info
    const dbConfigured = isDatabaseConfigured();
    const dbType = getDatabaseType();

    // Test database connection
    const dbConnection = dbConfigured ? await testDatabaseConnection() : null;

    // Database Type Check
    checks.push({
        key: 'DATABASE_TYPE',
        label: `Database Type: ${dbType.displayName}`,
        status: dbType.type !== 'unknown' ? 'ok' : 'warning',
        required: false,
        message: dbType.type === 'sqlite'
            ? 'Using local SQLite database'
            : dbType.type === 'postgresql'
                ? 'Using PostgreSQL database (recommended for production)'
                : 'Database type could not be detected',
    });

    // Database Connection Check
    if (dbConfigured && dbConnection) {
        checks.push({
            key: 'DATABASE_CONNECTION',
            label: 'Database Connection',
            status: dbConnection.success ? 'ok' : 'error',
            required: true,
            message: dbConnection.success
                ? `✓ Successfully connected to ${dbType.displayName}`
                : `✗ Connection failed: ${dbConnection.error}`,
            ...(dbConnection.troubleshooting && { troubleshooting: dbConnection.troubleshooting }),
        });
    } else if (!dbConfigured) {
        checks.push({
            key: 'DATABASE_CONNECTION',
            label: 'Database Connection',
            status: 'error',
            required: true,
            message: 'DATABASE_URL is not configured',
            troubleshooting: [
                'Set DATABASE_URL in your .env file or environment variables',
                'For local development: DATABASE_URL="file:./prisma/dev.db"',
                'For production (Vercel/Supabase): Set DATABASE_URL in Vercel environment variables',
            ],
        });
    }

    // Check AUTH_SECRET / NEXTAUTH_SECRET
    const authSecret = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET;
    checks.push({
        key: 'AUTH_SECRET',
        label: 'Auth Secret',
        status: authSecret ? 'ok' : 'error',
        required: true,
        message: authSecret ? 'Configured' : 'AUTH_SECRET or NEXTAUTH_SECRET is required in .env',
    });

    // Check SMTP configuration (optional)
    const smtpHost = process.env.SMTP_HOST;
    const smtpUser = process.env.SMTP_USER;
    const smtpConfigured = smtpHost && smtpUser;
    checks.push({
        key: 'SMTP_CONFIG',
        label: 'SMTP Configuration',
        status: smtpConfigured ? 'ok' : 'warning',
        required: false,
        message: smtpConfigured
            ? 'Email sending configured'
            : 'Optional: Email features can be configured later in Settings',
    });

    // Check EMAIL_ENCRYPTION_KEY (optional, for secure SMTP storage)
    const emailKey = process.env.EMAIL_ENCRYPTION_KEY;
    checks.push({
        key: 'EMAIL_ENCRYPTION_KEY',
        label: 'Email Encryption Key',
        status: emailKey ? 'ok' : 'warning',
        required: false,
        message: emailKey
            ? 'Configured for secure password storage'
            : 'Optional: Run npm run generate-email-key for secure SMTP storage',
    });

    const hasErrors = checks.some(c => c.status === 'error');
    const hasWarnings = checks.some(c => c.status === 'warning');
    const dbConnectionFailed = dbConnection && !dbConnection.success;

    return NextResponse.json({
        checks,
        hasErrors,
        hasWarnings,
        canProceed: !hasErrors,
        databaseType: dbType.type,
        databaseTypeName: dbType.displayName,
        databaseConnected: dbConnection?.success ?? false,
        databaseError: dbConnection?.error,
        databaseTroubleshooting: dbConnection?.troubleshooting,
    });
}
