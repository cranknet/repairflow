/**
 * AI Device Detection API
 * POST /api/ai/detect-device
 * 
 * Analyzes device photos to detect brand, model, and color using AI vision.
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { detectDeviceFromImages, AIVisionProvider } from '@/lib/ai-vision';

const detectDeviceSchema = z.object({
    images: z.array(z.string()).min(1, 'At least one image is required').max(2, 'Maximum 2 images allowed'),
});

export async function POST(request: NextRequest) {
    try {
        const session = await auth();
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const data = detectDeviceSchema.parse(body);

        // Get AI Vision settings
        const settings = await prisma.settings.findMany({
            where: {
                key: {
                    in: ['aiVisionProvider', 'aiVisionApiKey'],
                },
            },
        });

        const settingsMap = Object.fromEntries(settings.map(s => [s.key, s.value]));
        const aiProvider = (settingsMap.aiVisionProvider || 'google') as AIVisionProvider;
        const aiApiKey = settingsMap.aiVisionApiKey;

        if (!aiApiKey) {
            return NextResponse.json(
                { 
                    error: 'AI Vision API key not configured', 
                    code: 'INVALID_API_KEY',
                    configured: false 
                },
                { status: 400 }
            );
        }

        const result = await detectDeviceFromImages(data.images, {
            provider: aiProvider,
            apiKey: aiApiKey,
        });

        return NextResponse.json({
            success: true,
            ...result,
        });
    } catch (error: any) {
        console.error('Device detection error:', error);

        // Handle known AI vision errors
        if (error.code) {
            return NextResponse.json(
                {
                    error: error.message,
                    code: error.code,
                    retryable: error.retryable,
                },
                { status: error.code === 'INVALID_API_KEY' ? 400 : 500 }
            );
        }

        // Handle Zod validation errors
        if (error.errors) {
            return NextResponse.json(
                { error: 'Invalid request', details: error.errors },
                { status: 400 }
            );
        }

        return NextResponse.json(
            { error: 'Failed to detect device', code: 'UNKNOWN' },
            { status: 500 }
        );
    }
}

// GET endpoint to check if AI Vision is configured
export async function GET() {
    try {
        const session = await auth();
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const settings = await prisma.settings.findMany({
            where: {
                key: {
                    in: ['aiVisionProvider', 'aiVisionApiKey'],
                },
            },
        });

        const settingsMap = Object.fromEntries(settings.map(s => [s.key, s.value]));
        const hasApiKey = !!settingsMap.aiVisionApiKey;
        const provider = settingsMap.aiVisionProvider || 'google';

        return NextResponse.json({
            configured: hasApiKey,
            provider: hasApiKey ? provider : null,
        });
    } catch (error) {
        console.error('Error checking AI Vision config:', error);
        return NextResponse.json(
            { error: 'Failed to check configuration', configured: false },
            { status: 500 }
        );
    }
}

