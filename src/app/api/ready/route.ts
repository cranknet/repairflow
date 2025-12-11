import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * Readiness Probe Endpoint
 * 
 * Indicates if the application is ready to receive traffic.
 * Used by Kubernetes/container orchestrators for load balancing.
 * 
 * GET /api/ready
 */
export async function GET() {
    try {
        // Check if database is ready
        await prisma.$queryRaw`SELECT 1`;

        return NextResponse.json(
            { ready: true, timestamp: new Date().toISOString() },
            { status: 200 }
        );
    } catch (error) {
        return NextResponse.json(
            {
                ready: false,
                timestamp: new Date().toISOString(),
                error: 'Database not ready'
            },
            { status: 503 }
        );
    }
}
