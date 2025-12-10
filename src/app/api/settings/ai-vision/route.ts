/**
 * AI Vision Settings API
 * GET/PUT /api/settings/ai-vision
 * 
 * Supports: Google Gemini, OpenAI GPT-4, Anthropic Claude
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const updateSchema = z.object({
    scanMode: z.enum(['tesseract', 'ocrspace', 'vision']).optional(),
    aiVisionProvider: z.enum(['openai', 'google', 'anthropic']).optional(),
    aiVisionApiKey: z.string().optional(),
    ocrApiKey: z.string().optional(),
});

export async function GET() {
    try {
        const session = await auth();
        if (!session || session.user.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const settings = await prisma.settings.findMany({
            where: {
                key: {
                    in: ['scanMode', 'aiVisionProvider', 'aiVisionApiKey', 'ocrApiKey'],
                },
            },
        });

        const result: Record<string, string> = {};
        for (const s of settings) {
            // Mask API keys for security
            if (s.key === 'aiVisionApiKey' && s.value) {
                result[s.key] = s.value.slice(0, 8) + '...' + s.value.slice(-4);
                result.hasAiApiKey = 'true';
            } else if (s.key === 'ocrApiKey' && s.value) {
                result[s.key] = s.value.slice(0, 8) + '...' + s.value.slice(-4);
                result.hasOcrApiKey = 'true';
            } else {
                result[s.key] = s.value;
            }
        }

        // Set defaults
        if (!result.scanMode) result.scanMode = 'vision';
        if (!result.aiVisionProvider) result.aiVisionProvider = 'google';
        if (!result.hasAiApiKey) result.hasAiApiKey = 'false';
        if (!result.hasOcrApiKey) result.hasOcrApiKey = 'false';

        return NextResponse.json(result);
    } catch (error) {
        console.error('Error fetching AI vision settings:', error);
        return NextResponse.json(
            { error: 'Failed to fetch settings' },
            { status: 500 }
        );
    }
}

export async function PUT(request: NextRequest) {
    try {
        const session = await auth();
        if (!session || session.user.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const data = updateSchema.parse(body);

        // Update each setting
        for (const [key, value] of Object.entries(data)) {
            if (value !== undefined) {
                await prisma.settings.upsert({
                    where: { key },
                    update: { value: value as string },
                    create: { key, value: value as string },
                });
            }
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { error: 'Validation error', details: error.errors },
                { status: 400 }
            );
        }
        console.error('Error updating AI vision settings:', error);
        return NextResponse.json(
            { error: 'Failed to update settings' },
            { status: 500 }
        );
    }
}
