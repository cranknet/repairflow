import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * Health Check Endpoint
 * 
 * Returns the overall health status of the application.
 * Used by container orchestrators and monitoring systems.
 * 
 * GET /api/health
 */
export async function GET() {
    const startTime = Date.now();

    const health: {
        status: 'ok' | 'degraded' | 'down';
        timestamp: string;
        version: string;
        uptime: number;
        checks: {
            database: { status: 'ok' | 'error'; latency?: number; error?: string };
        };
    } = {
        status: 'ok',
        timestamp: new Date().toISOString(),
        version: process.env.npm_package_version || '1.0.0',
        uptime: process.uptime(),
        checks: {
            database: { status: 'ok' },
        },
    };

    // Check database connectivity
    try {
        const dbStart = Date.now();
        await prisma.$queryRaw`SELECT 1`;
        health.checks.database.latency = Date.now() - dbStart;
    } catch (error) {
        health.status = 'down';
        health.checks.database.status = 'error';
        health.checks.database.error = error instanceof Error ? error.message : 'Unknown database error';
    }

    // Determine overall status
    const hasErrors = Object.values(health.checks).some(check => check.status === 'error');
    if (hasErrors) {
        health.status = 'down';
    }

    const statusCode = health.status === 'ok' ? 200 : health.status === 'degraded' ? 200 : 503;

    return NextResponse.json(health, { status: statusCode });
}
