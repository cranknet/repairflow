import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/install/status
 * Check if the application is already installed
 */
export async function GET() {
    try {
        const setting = await prisma.settings.findUnique({
            where: { key: 'is_installed' },
        });

        return NextResponse.json({
            isInstalled: setting?.value === 'true',
        });
    } catch (error) {
        // If database doesn't exist or can't connect, not installed
        console.error('Error checking install status:', error);
        return NextResponse.json({
            isInstalled: false,
            error: 'Could not check installation status',
        });
    }
}
