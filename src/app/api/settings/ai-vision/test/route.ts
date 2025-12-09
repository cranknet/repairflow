/**
 * Test AI/OCR API Keys
 * POST /api/settings/ai-vision/test
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { AIVisionProvider } from '@/lib/ai-vision';
import { t } from '@/lib/server-translation';

export async function POST(request: NextRequest) {
    try {
        const session = await auth();
        if (!session || session.user.role !== 'ADMIN') {
            return NextResponse.json({ error: t('unauthorized') }, { status: 401 });
        }

        const body = await request.json();
        const { type, provider, apiKey, ocrApiKey } = body as {
            type: 'ai' | 'ocr';
            provider?: AIVisionProvider;
            apiKey?: string;
            ocrApiKey?: string;
        };

        const startTime = Date.now();

        if (type === 'ocr') {
            // Test OCR.space API key
            let keyToTest = ocrApiKey;
            if (!keyToTest) {
                const setting = await prisma.settings.findUnique({
                    where: { key: 'ocrApiKey' },
                });
                keyToTest = setting?.value;
            }

            if (!keyToTest) {
                return NextResponse.json({ success: false, error: t('noOcrApiKeyProvided') }, { status: 400 });
            }

            const result = await testOCRSpace(keyToTest);
            return NextResponse.json({ ...result, latency: Date.now() - startTime });
        } else {
            // Test AI API key (OpenAI, Google, Anthropic)
            let keyToTest = apiKey;
            if (!keyToTest) {
                const setting = await prisma.settings.findUnique({
                    where: { key: 'aiVisionApiKey' },
                });
                keyToTest = setting?.value;
            }

            if (!keyToTest) {
                return NextResponse.json({ success: false, error: t('noAiApiKeyProvided') }, { status: 400 });
            }

            const providerToTest = provider || 'openai';
            let result: { success: boolean; error?: string };

            switch (providerToTest) {
                case 'openai':
                    result = await testOpenAI(keyToTest);
                    break;
                case 'google':
                    result = await testGoogle(keyToTest);
                    break;
                case 'anthropic':
                    result = await testAnthropic(keyToTest);
                    break;
                default:
                    result = { success: false, error: t('unknownProvider') };
            }

            return NextResponse.json({ ...result, latency: Date.now() - startTime, provider: providerToTest });
        }
    } catch (error) {
        console.error('Error testing API key:', error);
        return NextResponse.json({ success: false, error: t('testFailed') }, { status: 500 });
    }
}

async function testOCRSpace(apiKey: string): Promise<{ success: boolean; error?: string }> {
    try {
        // Test with a simple request - just check if the key is valid
        const response = await fetch('https://api.ocr.space/parse/image', {
            method: 'POST',
            headers: {
                'apikey': apiKey,
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
                // Use a tiny 1x1 transparent PNG to minimize data transfer
                base64Image: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
                language: 'eng',
                OCREngine: '2',
            }),
        });

        if (!response.ok) {
            if (response.status === 401 || response.status === 403) {
                return { success: false, error: t('invalidApiKey') };
            }
            if (response.status === 429) {
                return { success: false, error: t('rateLimitExceeded') };
            }
            return { success: false, error: `API error: ${response.status}` };
        }

        const result = await response.json();

        // Even with an empty image, a valid key will get a response
        if (result.ErrorMessage && result.ErrorMessage.includes('API key')) {
            return { success: false, error: t('invalidApiKey') };
        }

        return { success: true };
    } catch (error) {
        return { success: false, error: t('networkError') };
    }
}

async function testOpenAI(apiKey: string): Promise<{ success: boolean; error?: string }> {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            model: 'gpt-4o-mini',
            messages: [{ role: 'user', content: t('sayOk') }],
            max_tokens: 5,
        }),
    });

    if (!response.ok) {
        if (response.status === 401) return { success: false, error: t('invalidApiKey') };
        if (response.status === 429) return { success: false, error: t('rateLimitExceeded') };
        if (response.status === 403) return { success: false, error: t('apiKeyLacksPermissions') };
        const error = await response.json().catch(() => ({}));
        return { success: false, error: error.error?.message || `API error (${response.status})` };
    }

    return { success: true };
}

async function testGoogle(apiKey: string): Promise<{ success: boolean; error?: string }> {
    const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
        {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: t('sayOk') }] }],
                generationConfig: { maxOutputTokens: 5 },
            }),
        }
    );

    if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        if (response.status === 400 && error.error?.message?.includes('API key')) {
            return { success: false, error: t('invalidApiKey') };
        }
        if (response.status === 429) return { success: false, error: t('rateLimitExceeded') };
        return { success: false, error: error.error?.message || `API error (${response.status})` };
    }

    return { success: true };
}

async function testAnthropic(apiKey: string): Promise<{ success: boolean; error?: string }> {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
            'x-api-key': apiKey,
            'anthropic-version': '2023-06-01',
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            model: 'claude-3-haiku-20240307',
            max_tokens: 5,
            messages: [{ role: 'user', content: t('sayOk') }],
        }),
    });

    if (!response.ok) {
        if (response.status === 401) return { success: false, error: t('invalidApiKey') };
        if (response.status === 429) return { success: false, error: t('rateLimitExceeded') };
        const error = await response.json().catch(() => ({}));
        return { success: false, error: error.error?.message || `API error (${response.status})` };
    }

    return { success: true };
}
