import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * POST /api/install/finalize
 * Complete the installation process
 */
export async function POST(request: NextRequest) {
    try {
        // Verify admin user exists
        const adminExists = await prisma.user.findFirst({
            where: { role: 'ADMIN' },
        });

        if (!adminExists) {
            return NextResponse.json(
                { error: 'No administrator account found. Please create an admin user first.' },
                { status: 400 }
            );
        }

        // Create default settings if they don't exist
        const defaultSettings = [
            { key: 'company_logo', value: '/default-logo.png', description: 'Company logo path' },
            { key: 'company_favicon', value: '/default-favicon.png', description: 'Company favicon path' },
            { key: 'auto_mark_tickets_as_paid', value: 'false', description: 'Auto-mark new tickets as paid' },
        ];

        for (const setting of defaultSettings) {
            const exists = await prisma.settings.findUnique({
                where: { key: setting.key },
            });

            if (!exists) {
                await prisma.settings.create({
                    data: setting,
                });
            }
        }

        // Set installation complete
        await prisma.settings.upsert({
            where: { key: 'is_installed' },
            update: { value: 'true' },
            create: {
                key: 'is_installed',
                value: 'true',
                description: 'Installation status',
            },
        });

        // Record installation timestamp
        await prisma.settings.upsert({
            where: { key: 'installed_at' },
            update: { value: new Date().toISOString() },
            create: {
                key: 'installed_at',
                value: new Date().toISOString(),
                description: 'Installation timestamp',
            },
        });

        return NextResponse.json({
            success: true,
            redirectTo: '/login',
        });
    } catch (error) {
        console.error('Error finalizing installation:', error);
        return NextResponse.json(
            { error: 'Failed to complete installation' },
            { status: 500 }
        );
    }
}
