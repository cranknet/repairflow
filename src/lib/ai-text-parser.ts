/**
 * AI Text Parser - Parse OCR text into structured parts data
 * Uses NORMAL API (not vision) - much cheaper!
 */

import { AIVisionProvider } from './ai-vision';

export interface ExtractedPart {
    name: string;
    quantity: number;
    unitPrice: number;
    sku?: string;
}

export interface ExtractedSupplier {
    name?: string;
    phone?: string;
    email?: string;
    address?: string;
}

export interface ParsedReceiptData {
    parts: ExtractedPart[];
    supplier?: ExtractedSupplier;
    invoiceNumber?: string;
    date?: string;
    total?: number;
}

export class AIParseError extends Error {
    constructor(
        message: string,
        public code: 'NETWORK_ERROR' | 'INVALID_API_KEY' | 'RATE_LIMIT' | 'PARSE_ERROR' | 'NO_PARTS'
    ) {
        super(message);
        this.name = 'AIParseError';
    }
}

const PARSING_PROMPT = `You are a receipt/invoice parser. Extract parts/items from the following OCR text.

IMPORTANT RULES:
1. Extract ONLY physical parts/items (not services, labor, shipping, or tax)
2. For each part, extract: name, quantity, unit price
3. If SKU/part number is visible, include it
4. If quantity is not specified, assume 1
5. Extract supplier info if visible: name, phone, email, address
6. Return ONLY valid JSON, no explanation

OCR TEXT:
{text}

Return JSON in this exact format:
{
  "parts": [
    {"name": "Part Name", "quantity": 1, "unitPrice": 10.00, "sku": "ABC123"}
  ],
  "supplier": {
    "name": "Supplier Name",
    "phone": "+1234567890",
    "email": "contact@supplier.com",
    "address": "123 Main St"
  },
  "invoiceNumber": "INV-123",
  "date": "2024-01-15",
  "total": 100.00
}

If no parts found, return: {"parts": [], "error": "No parts found"}`;

/**
 * Parse OCR text using OpenAI (normal API, not vision)
 */
async function parseWithOpenAI(text: string, apiKey: string): Promise<ParsedReceiptData> {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            model: 'gpt-4o-mini', // Cheap and fast!
            messages: [
                {
                    role: 'user',
                    content: PARSING_PROMPT.replace('{text}', text),
                },
            ],
            max_tokens: 1000,
            temperature: 0.1, // Low temp for consistent parsing
            response_format: { type: 'json_object' },
        }),
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        if (response.status === 401) {
            throw new AIParseError('Invalid OpenAI API key', 'INVALID_API_KEY');
        }
        if (response.status === 429) {
            throw new AIParseError('Rate limit exceeded', 'RATE_LIMIT');
        }
        throw new AIParseError(error.error?.message || 'OpenAI API error', 'PARSE_ERROR');
    }

    const result = await response.json();
    const content = result.choices?.[0]?.message?.content;

    if (!content) {
        throw new AIParseError('No response from OpenAI', 'PARSE_ERROR');
    }

    return JSON.parse(content);
}

/**
 * Parse OCR text using Google Gemini (normal API, not vision)
 */
async function parseWithGemini(text: string, apiKey: string): Promise<ParsedReceiptData> {
    const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
        {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{
                    parts: [{ text: PARSING_PROMPT.replace('{text}', text) }],
                }],
                generationConfig: {
                    maxOutputTokens: 4096,
                    temperature: 0.1,
                },
            }),
        }
    );

    if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        if (response.status === 400 && error.error?.message?.includes('API key')) {
            throw new AIParseError('Invalid Google API key', 'INVALID_API_KEY');
        }
        if (response.status === 429) {
            throw new AIParseError('Rate limit exceeded', 'RATE_LIMIT');
        }
        throw new AIParseError(error.error?.message || 'Gemini API error', 'PARSE_ERROR');
    }

    const result = await response.json();
    const content = result.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!content) {
        throw new AIParseError('No response from Gemini', 'PARSE_ERROR');
    }

    // Extract JSON from response (Gemini may include markdown)
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
        throw new AIParseError('Could not parse Gemini response', 'PARSE_ERROR');
    }

    return JSON.parse(jsonMatch[0]);
}

/**
 * Parse OCR text using Anthropic Claude (normal API, not vision)
 */
async function parseWithClaude(text: string, apiKey: string): Promise<ParsedReceiptData> {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
            'x-api-key': apiKey,
            'anthropic-version': '2023-06-01',
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            model: 'claude-3-haiku-20240307', // Cheapest Claude model
            max_tokens: 1000,
            messages: [{
                role: 'user',
                content: PARSING_PROMPT.replace('{text}', text),
            }],
        }),
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        if (response.status === 401) {
            throw new AIParseError('Invalid Anthropic API key', 'INVALID_API_KEY');
        }
        if (response.status === 429) {
            throw new AIParseError('Rate limit exceeded', 'RATE_LIMIT');
        }
        throw new AIParseError(error.error?.message || 'Claude API error', 'PARSE_ERROR');
    }

    const result = await response.json();
    const content = result.content?.[0]?.text;

    if (!content) {
        throw new AIParseError('No response from Claude', 'PARSE_ERROR');
    }

    // Extract JSON from response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
        throw new AIParseError('Could not parse Claude response', 'PARSE_ERROR');
    }

    return JSON.parse(jsonMatch[0]);
}

/**
 * Main function to parse OCR text into structured parts data
 */
export async function parseReceiptText(
    ocrText: string,
    provider: AIVisionProvider,
    apiKey: string
): Promise<ParsedReceiptData> {
    if (!ocrText.trim()) {
        throw new AIParseError('No text to parse', 'PARSE_ERROR');
    }

    try {
        let result: ParsedReceiptData;

        switch (provider) {
            case 'openai':
                result = await parseWithOpenAI(ocrText, apiKey);
                break;
            case 'google':
                result = await parseWithGemini(ocrText, apiKey);
                break;
            case 'anthropic':
                result = await parseWithClaude(ocrText, apiKey);
                break;
            default:
                throw new AIParseError(`Unknown provider: ${provider}`, 'PARSE_ERROR');
        }

        // Validate and clean the result
        if (!result.parts || !Array.isArray(result.parts)) {
            result.parts = [];
        }

        // Clean up parts data
        result.parts = result.parts
            .filter((p) => p.name && typeof p.name === 'string')
            .map((p) => ({
                name: p.name.trim(),
                quantity: Math.max(1, Number(p.quantity) || 1),
                unitPrice: Math.max(0, Number(p.unitPrice) || 0),
                sku: p.sku?.trim() || undefined,
            }));

        // Normalize supplier - handle both string (old) and object (new) format
        if (result.supplier) {
            if (typeof result.supplier === 'string') {
                result.supplier = { name: result.supplier };
            } else {
                result.supplier = {
                    name: (result.supplier as ExtractedSupplier).name?.trim() || undefined,
                    phone: (result.supplier as ExtractedSupplier).phone?.trim() || undefined,
                    email: (result.supplier as ExtractedSupplier).email?.trim() || undefined,
                    address: (result.supplier as ExtractedSupplier).address?.trim() || undefined,
                };
            }
        }

        if (result.parts.length === 0) {
            throw new AIParseError('No parts found in receipt text', 'NO_PARTS');
        }

        return result;
    } catch (error) {
        if (error instanceof AIParseError) throw error;
        if (error instanceof SyntaxError) {
            throw new AIParseError('Failed to parse AI response as JSON', 'PARSE_ERROR');
        }
        throw new AIParseError(`Parse failed: ${(error as Error).message}`, 'PARSE_ERROR');
    }
}
