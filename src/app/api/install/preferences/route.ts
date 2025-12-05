import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { preferencesSchema } from '@/app/(setup)/install/lib/validation';
import { z } from 'zod';

/**
 * POST /api/install/preferences
 * Save system preferences during installation
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
        const data = preferencesSchema.parse(body);

        // Build settings to save
        const settingsToSave: { key: string; value: string; description: string }[] = [];

        if (data.timezone) {
            settingsToSave.push({
                key: 'timezone',
                value: data.timezone,
                description: 'System timezone',
            });
        }

        settingsToSave.push({
            key: 'sms_enabled',
            value: data.sms_enabled ? 'true' : 'false',
            description: 'SMS notifications enabled',
        });

        if (data.facebook_url) {
            settingsToSave.push({
                key: 'facebook_url',
                value: data.facebook_url,
                description: 'Facebook page URL',
            });
        }

        if (data.youtube_url) {
            settingsToSave.push({
                key: 'youtube_url',
                value: data.youtube_url,
                description: 'YouTube channel URL',
            });
        }

        if (data.instagram_url) {
            settingsToSave.push({
                key: 'instagram_url',
                value: data.instagram_url,
                description: 'Instagram profile URL',
            });
        }

        settingsToSave.push({
            key: 'theme',
            value: data.theme,
            description: 'Default theme mode',
        });

        // Save all settings
        if (settingsToSave.length > 0) {
            await prisma.$transaction(
                settingsToSave.map(setting =>
                    prisma.settings.upsert({
                        where: { key: setting.key },
                        update: { value: setting.value },
                        create: setting,
                    })
                )
            );
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { error: 'Validation error', details: error.errors },
                { status: 400 }
            );
        }
        console.error('Error saving preferences:', error);
        return NextResponse.json(
            { error: 'Failed to save preferences' },
            { status: 500 }
        );
    }
}
