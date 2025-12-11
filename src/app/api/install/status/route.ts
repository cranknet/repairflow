import { NextResponse } from 'next/server';
import { isAppInstalled, isDatabaseConfigured } from '@/lib/install-check';

/**
 * GET /api/install/status
 * Check if the application is already installed
 */
export async function GET() {
    try {
        const dbConfigured = isDatabaseConfigured();
        const installed = dbConfigured ? await isAppInstalled() : false;

        return NextResponse.json({
            isInstalled: installed,
            databaseConfigured: dbConfigured,
        });
    } catch (error) {
        // If database doesn't exist or can't connect, not installed
        console.error('Error checking install status:', error);
        return NextResponse.json({
            isInstalled: false,
            databaseConfigured: false,
            error: 'Could not check installation status',
        });
    }
}
