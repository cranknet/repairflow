import { NextResponse } from 'next/server';

/**
 * Liveness Probe Endpoint
 * 
 * Indicates if the application process is alive and responding.
 * Used by Kubernetes/container orchestrators for restart decisions.
 * 
 * GET /api/live
 */
export async function GET() {
    return NextResponse.json(
        {
            alive: true,
            timestamp: new Date().toISOString(),
            pid: process.pid,
        },
        { status: 200 }
    );
}
