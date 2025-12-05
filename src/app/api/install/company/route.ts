import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { companySchema } from '@/app/(setup)/install/lib/validation';
import { z } from 'zod';

/**
 * POST /api/install/company
 * Save company information during installation
 */
export async function POST(request: NextRequest) {
    try {
        // Check if already installed
        const isInstalled = await prisma.settings.findUnique({
            where: { key: 'is_installed' },
        });

        if (isInstalled?.value === 'true') {
            return NextResponse.json(
                { error: 'Application is already installed' },
                { status: 403 }
            );
        }

        const body = await request.json();
        const data = companySchema.parse(body);

        // Upsert each company setting
        const settingsToSave = [
            { key: 'company_name', value: data.company_name, description: 'Company name' },
            { key: 'company_email', value: data.company_email, description: 'Company email' },
            { key: 'company_phone', value: data.company_phone, description: 'Company phone' },
            { key: 'company_address', value: data.company_address || '', description: 'Company address' },
            { key: 'country', value: data.country, description: 'Default country' },
            { key: 'language', value: data.language, description: 'Default language' },
            { key: 'currency', value: data.currency, description: 'Default currency' },
        ];

        await prisma.$transaction(
            settingsToSave.map(setting =>
                prisma.settings.upsert({
                    where: { key: setting.key },
                    update: { value: setting.value },
                    create: setting,
                })
            )
        );

        return NextResponse.json({ success: true });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { error: 'Validation error', details: error.errors },
                { status: 400 }
            );
        }
        console.error('Error saving company settings:', error);
        return NextResponse.json(
            { error: 'Failed to save company settings' },
            { status: 500 }
        );
    }
}
