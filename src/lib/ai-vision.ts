/**
 * AI Vision Service - Multi-provider support for receipt OCR
 * Supports: OpenAI GPT-4 Vision, Google Gemini Vision, Anthropic Claude Vision
 */

export type AIVisionProvider = 'openai' | 'google' | 'anthropic';

export interface ExtractedPart {
    name: string;
    quantity: number;
    unitPrice: number;
    sku?: string;
    confidence?: number;
}

export interface ExtractedSupplier {
    name?: string;
    phone?: string;
    email?: string;
    address?: string;
}

export interface ReceiptScanResult {
    parts: ExtractedPart[];
    supplier?: ExtractedSupplier;
    invoiceNumber?: string;
    date?: string;
    total?: number;
    rawText?: string;
}

export interface AIVisionConfig {
    provider: AIVisionProvider;
    apiKey: string;
}

export interface AIVisionError {
    code: 'NO_INTERNET' | 'INVALID_API_KEY' | 'RATE_LIMIT' | 'IMAGE_QUALITY' | 'NO_PARTS' | 'SERVICE_DOWN' | 'UNKNOWN';
    message: string;
    retryable: boolean;
}

const EXTRACTION_PROMPT = `You are a receipt scanner for a mobile repair shop. Analyze this supplier invoice image and extract all parts/items listed.

For each part, extract:
- name: The part name (e.g., "iPhone 12 Screen", "Samsung Battery")
- quantity: Number of units purchased
- unitPrice: Price per unit (as a number, no currency symbol)
- sku: SKU/part number if visible

Also extract supplier/vendor information if visible:
- supplier.name: Company/business name
- supplier.phone: Phone number
- supplier.email: Email address
- supplier.address: Street address

And invoice details:
- invoiceNumber: Invoice/receipt number
- date: Invoice date (YYYY-MM-DD format)
- total: Total amount

Return ONLY valid JSON in this exact format:
{
  "parts": [
    { "name": "Part Name", "quantity": 1, "unitPrice": 10.00, "sku": "ABC123" }
  ],
  "supplier": {
    "name": "Supplier Name",
    "phone": "+1234567890",
    "email": "contact@supplier.com",
    "address": "123 Main St, City"
  },
  "invoiceNumber": "INV-001",
  "date": "2024-12-08",
  "total": 100.00
}

If you cannot read the image or find no parts, return: { "parts": [], "error": "reason" }`;


/**
 * Extract parts from receipt image using OpenAI GPT-4 Vision
 */
async function extractWithOpenAI(imageBase64: string, apiKey: string): Promise<ReceiptScanResult> {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            model: 'gpt-4o',
            messages: [
                {
                    role: 'user',
                    content: [
                        { type: 'text', text: EXTRACTION_PROMPT },
                        {
                            type: 'image_url',
                            image_url: {
                                url: imageBase64.startsWith('data:') ? imageBase64 : `data:image/jpeg;base64,${imageBase64}`,
                            },
                        },
                    ],
                },
            ],
            max_tokens: 1000,
        }),
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        if (response.status === 401) {
            throw { code: 'INVALID_API_KEY', message: 'Invalid OpenAI API key', retryable: false } as AIVisionError;
        }
        if (response.status === 429) {
            throw { code: 'RATE_LIMIT', message: 'Rate limit exceeded', retryable: true } as AIVisionError;
        }
        throw { code: 'SERVICE_DOWN', message: error.error?.message || 'OpenAI service error', retryable: true } as AIVisionError;
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '';

    return parseJSONResponse(content);
}

/**
 * Extract parts from receipt image using Google Gemini Vision
 */
async function extractWithGoogle(imageBase64: string, apiKey: string): Promise<ReceiptScanResult> {
    // Remove data URL prefix if present
    const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, '');

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            contents: [
                {
                    parts: [
                        { text: EXTRACTION_PROMPT },
                        {
                            inline_data: {
                                mime_type: 'image/jpeg',
                                data: base64Data,
                            },
                        },
                    ],
                },
            ],
            generationConfig: {
                maxOutputTokens: 4096,
            },
        }),
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        if (response.status === 400 && error.error?.message?.includes('API key')) {
            throw { code: 'INVALID_API_KEY', message: 'Invalid Google API key', retryable: false } as AIVisionError;
        }
        if (response.status === 429) {
            throw { code: 'RATE_LIMIT', message: 'Rate limit exceeded', retryable: true } as AIVisionError;
        }
        throw { code: 'SERVICE_DOWN', message: error.error?.message || 'Google service error', retryable: true } as AIVisionError;
    }

    const data = await response.json();
    const content = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

    // Debug log to see what the AI returned
    console.log('Gemini Vision raw response:', content.substring(0, 500));

    // Check for blocked or empty response
    if (!content) {
        const blockReason = data.candidates?.[0]?.finishReason;
        console.log('Gemini response issue:', { blockReason, candidates: data.candidates });
        throw { code: 'IMAGE_QUALITY', message: `AI could not process image: ${blockReason || 'empty response'}`, retryable: true } as AIVisionError;
    }

    return parseJSONResponse(content);
}

/**
 * Extract parts from receipt image using Anthropic Claude Vision
 */
async function extractWithAnthropic(imageBase64: string, apiKey: string): Promise<ReceiptScanResult> {
    // Remove data URL prefix if present
    const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, '');

    const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
            'x-api-key': apiKey,
            'anthropic-version': '2023-06-01',
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            model: 'claude-3-5-sonnet-20241022',
            max_tokens: 1000,
            messages: [
                {
                    role: 'user',
                    content: [
                        {
                            type: 'image',
                            source: {
                                type: 'base64',
                                media_type: 'image/jpeg',
                                data: base64Data,
                            },
                        },
                        { type: 'text', text: EXTRACTION_PROMPT },
                    ],
                },
            ],
        }),
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        if (response.status === 401) {
            throw { code: 'INVALID_API_KEY', message: 'Invalid Anthropic API key', retryable: false } as AIVisionError;
        }
        if (response.status === 429) {
            throw { code: 'RATE_LIMIT', message: 'Rate limit exceeded', retryable: true } as AIVisionError;
        }
        throw { code: 'SERVICE_DOWN', message: error.error?.message || 'Anthropic service error', retryable: true } as AIVisionError;
    }

    const data = await response.json();
    const content = data.content?.[0]?.text || '';

    return parseJSONResponse(content);
}

/**
 * Parse JSON response from AI, handling markdown code blocks
 */
function parseJSONResponse(content: string): ReceiptScanResult {
    // Remove markdown code blocks if present
    let jsonStr = content.trim();

    // Try to extract JSON from markdown code blocks
    if (jsonStr.startsWith('```json')) {
        jsonStr = jsonStr.slice(7);
    } else if (jsonStr.startsWith('```')) {
        jsonStr = jsonStr.slice(3);
    }
    if (jsonStr.endsWith('```')) {
        jsonStr = jsonStr.slice(0, -3);
    }
    jsonStr = jsonStr.trim();

    // If still not valid JSON, try to find JSON object in the response
    if (!jsonStr.startsWith('{')) {
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            jsonStr = jsonMatch[0];
        }
    }

    try {
        const result = JSON.parse(jsonStr);

        // Validate and normalize parts
        const parts: ExtractedPart[] = (result.parts || []).map((p: any) => ({
            name: String(p.name || '').trim(),
            quantity: Number(p.quantity) || 1,
            unitPrice: Number(p.unitPrice) || 0,
            sku: p.sku ? String(p.sku).trim() : undefined,
        })).filter((p: ExtractedPart) => p.name && p.unitPrice > 0);

        if (parts.length === 0 && !result.error) {
            throw { code: 'NO_PARTS', message: 'No parts detected in this image', retryable: false } as AIVisionError;
        }

        // Parse supplier - handle both string (old) and object (new) format
        let supplier: ExtractedSupplier | undefined;
        if (result.supplier) {
            if (typeof result.supplier === 'string') {
                supplier = { name: result.supplier };
            } else {
                supplier = {
                    name: result.supplier.name?.trim() || undefined,
                    phone: result.supplier.phone?.trim() || undefined,
                    email: result.supplier.email?.trim() || undefined,
                    address: result.supplier.address?.trim() || undefined,
                };
            }
        }

        return {
            parts,
            supplier,
            invoiceNumber: result.invoiceNumber || undefined,
            date: result.date || undefined,
            total: result.total ? Number(result.total) : undefined,
        };
    } catch (e) {
        if ((e as AIVisionError).code) throw e;
        console.log('JSON parse error. Content was:', jsonStr.substring(0, 300));
        throw { code: 'IMAGE_QUALITY', message: 'AI returned invalid format. Try a clearer photo.', retryable: true } as AIVisionError;
    }
}

/**
 * Main function to extract parts from receipt image
 */
// Device Detection Types and Prompt
export interface DeviceDetectionResult {
    brand: string;
    model: string;
    color: string;
    confidence: number; // 0-100
    stickerText?: string; // Any text found on stickers
}

export interface DeviceDetectionOptions {
    brandHint?: string; // Optional brand hint to improve detection
}

/**
 * Generate device detection prompt with optional brand hint
 */
function getDeviceDetectionPrompt(brandHint?: string): string {
    const brandContext = brandHint
        ? `\n\nIMPORTANT: The user has indicated this is a "${brandHint}" device. Use this to narrow down the specific model.`
        : '';

    return `You are a mobile device identification expert. Analyze this device BACK photo and identify the exact model.

FOCUS ON THE BACK OF THE DEVICE:
- Camera module layout (number of lenses, arrangement, shape)
- Brand logo position and style
- Flash position relative to cameras
- Fingerprint sensor location (if visible)
- Overall body shape and material appearance
- Button placement

STICKER DETECTION (CRITICAL):
- Look for any stickers on the device (IMEI labels, model stickers, carrier labels)
- If you see a sticker with text, extract all readable text including model numbers
- Common sticker locations: near SIM tray, on battery cover, near camera area
- Sticker text often contains: model number (e.g., "SM-G998B", "A2894"), IMEI, serial number

Extract the following information:
- brand: The manufacturer (e.g., "Apple", "Samsung", "Google", "Xiaomi", "OnePlus", "Huawei", "OPPO", "Vivo", "Realme", "Motorola")
- model: The specific model name (e.g., "iPhone 14 Pro", "Galaxy S23 Ultra", "Pixel 8 Pro")
- color: The device color (e.g., "Space Black", "Silver", "Deep Purple", "Phantom Black")
- confidence: Your confidence level 0-100 (100 = very certain)
- stickerText: Any text you can read from stickers on the device (model numbers, IMEI, etc.)

MODEL IDENTIFICATION TIPS:
- iPhone: Apple logo centered, camera island in corner, lens arrangement varies by model
- Samsung Galaxy S series: Horizontal or vertical camera strip, Samsung logo lower center
- Samsung Galaxy A series: Similar but plastic body, different camera arrangement
- Google Pixel: Distinctive horizontal camera bar across top
- Xiaomi/Redmi: Camera island with model number sometimes printed
- OnePlus: Hasselblad branding on newer models${brandContext}

Return ONLY valid JSON in this exact format:
{
  "brand": "Brand Name",
  "model": "Model Name", 
  "color": "Color Name",
  "confidence": 85,
  "stickerText": "Any visible sticker text or null"
}

If you cannot identify the device, return:
{
  "brand": "",
  "model": "",
  "color": "",
  "confidence": 0,
  "stickerText": null,
  "error": "reason"
}`;
}

/**
 * Detect device from images using OpenAI GPT-4 Vision
 */
async function detectDeviceWithOpenAI(images: string[], apiKey: string, brandHint?: string): Promise<DeviceDetectionResult> {
    const imageContent = images.map(img => ({
        type: 'image_url' as const,
        image_url: {
            url: img.startsWith('data:') ? img : `data:image/jpeg;base64,${img}`,
        },
    }));

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            model: 'gpt-4o',
            messages: [
                {
                    role: 'user',
                    content: [
                        { type: 'text', text: getDeviceDetectionPrompt(brandHint) },
                        ...imageContent,
                    ],
                },
            ],
            max_tokens: 1024,
        }),
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        if (response.status === 401) {
            throw { code: 'INVALID_API_KEY', message: 'Invalid OpenAI API key', retryable: false } as AIVisionError;
        }
        if (response.status === 429) {
            throw { code: 'RATE_LIMIT', message: 'Rate limit exceeded', retryable: true } as AIVisionError;
        }
        throw { code: 'SERVICE_DOWN', message: error.error?.message || 'OpenAI service error', retryable: true } as AIVisionError;
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '';

    return parseDeviceDetectionResponse(content);
}

/**
 * Detect device from images using Google Gemini Vision
 */
async function detectDeviceWithGoogle(images: string[], apiKey: string, brandHint?: string): Promise<DeviceDetectionResult> {
    const imageParts = images.map(img => ({
        inline_data: {
            mime_type: 'image/jpeg',
            data: img.replace(/^data:image\/\w+;base64,/, ''),
        },
    }));

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            contents: [
                {
                    parts: [
                        { text: getDeviceDetectionPrompt(brandHint) },
                        ...imageParts,
                    ],
                },
            ],
            generationConfig: {
                maxOutputTokens: 1024,
            },
        }),
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        if (response.status === 400 && error.error?.message?.includes('API key')) {
            throw { code: 'INVALID_API_KEY', message: 'Invalid Google API key', retryable: false } as AIVisionError;
        }
        if (response.status === 429) {
            throw { code: 'RATE_LIMIT', message: 'Rate limit exceeded', retryable: true } as AIVisionError;
        }
        throw { code: 'SERVICE_DOWN', message: error.error?.message || 'Google service error', retryable: true } as AIVisionError;
    }

    const data = await response.json();
    const content = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

    if (!content) {
        const blockReason = data.candidates?.[0]?.finishReason;
        throw { code: 'IMAGE_QUALITY', message: `AI could not process image: ${blockReason || 'empty response'}`, retryable: true } as AIVisionError;
    }

    return parseDeviceDetectionResponse(content);
}

/**
 * Detect device from images using Anthropic Claude Vision
 */
async function detectDeviceWithAnthropic(images: string[], apiKey: string, brandHint?: string): Promise<DeviceDetectionResult> {
    const imageContent = images.map(img => ({
        type: 'image' as const,
        source: {
            type: 'base64' as const,
            media_type: 'image/jpeg' as const,
            data: img.replace(/^data:image\/\w+;base64,/, ''),
        },
    }));

    const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
            'x-api-key': apiKey,
            'anthropic-version': '2023-06-01',
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            model: 'claude-3-5-sonnet-20241022',
            max_tokens: 1024,
            messages: [
                {
                    role: 'user',
                    content: [
                        ...imageContent,
                        { type: 'text', text: getDeviceDetectionPrompt(brandHint) },
                    ],
                },
            ],
        }),
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        if (response.status === 401) {
            throw { code: 'INVALID_API_KEY', message: 'Invalid Anthropic API key', retryable: false } as AIVisionError;
        }
        if (response.status === 429) {
            throw { code: 'RATE_LIMIT', message: 'Rate limit exceeded', retryable: true } as AIVisionError;
        }
        throw { code: 'SERVICE_DOWN', message: error.error?.message || 'Anthropic service error', retryable: true } as AIVisionError;
    }

    const data = await response.json();
    const content = data.content?.[0]?.text || '';

    return parseDeviceDetectionResponse(content);
}

/**
 * Parse JSON response for device detection
 * Handles truncated/incomplete JSON responses from AI
 */
function parseDeviceDetectionResponse(content: string): DeviceDetectionResult {
    let jsonStr = content.trim();

    // Remove markdown code blocks if present
    if (jsonStr.startsWith('```json')) {
        jsonStr = jsonStr.slice(7);
    } else if (jsonStr.startsWith('```')) {
        jsonStr = jsonStr.slice(3);
    }
    if (jsonStr.endsWith('```')) {
        jsonStr = jsonStr.slice(0, -3);
    }
    jsonStr = jsonStr.trim();

    // If still not valid JSON, try to find JSON object in the response
    if (!jsonStr.startsWith('{')) {
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            jsonStr = jsonMatch[0];
        }
    }

    // First try standard JSON parse
    try {
        const result = JSON.parse(jsonStr);
        return {
            brand: String(result.brand || '').trim(),
            model: String(result.model || '').trim(),
            color: String(result.color || '').trim(),
            confidence: Math.min(100, Math.max(0, Number(result.confidence) || 0)),
        };
    } catch (e) {
        // JSON parse failed - try to extract fields using regex from truncated response
        console.log('Device detection JSON parse failed, attempting regex extraction. Content:', jsonStr.substring(0, 300));

        const extractedResult = extractFieldsFromTruncatedJSON(jsonStr);

        // If we got at least brand OR model, return partial result
        if (extractedResult.brand || extractedResult.model) {
            console.log('Successfully extracted partial data:', extractedResult);
            return extractedResult;
        }

        // Nothing could be extracted
        console.log('Could not extract any fields from response');
        throw { code: 'IMAGE_QUALITY', message: 'AI returned invalid format. Try clearer photos.', retryable: true } as AIVisionError;
    }
}

/**
 * Extract device detection fields from truncated/malformed JSON using regex
 */
function extractFieldsFromTruncatedJSON(content: string): DeviceDetectionResult {
    const result: DeviceDetectionResult = {
        brand: '',
        model: '',
        color: '',
        confidence: 0,
    };

    // Extract brand - look for "brand": "value" or "brand":"value"
    const brandMatch = content.match(/"brand"\s*:\s*"([^"]+)"/i);
    if (brandMatch) {
        result.brand = brandMatch[1].trim();
    }

    // Extract model - may be truncated, so handle incomplete strings
    const modelMatch = content.match(/"model"\s*:\s*"([^"]*)/i);
    if (modelMatch) {
        let model = modelMatch[1].trim();
        // If the model appears truncated (ends abruptly), keep what we have
        // Remove trailing incomplete words if present
        if (model && !content.includes(`"model": "${model}"`)) {
            // Model might be truncated, check if there's a closing quote after
            const fullModelMatch = content.match(/"model"\s*:\s*"([^"]+)"/i);
            if (fullModelMatch) {
                model = fullModelMatch[1].trim();
            }
        }
        result.model = model;
    }

    // Extract color
    const colorMatch = content.match(/"color"\s*:\s*"([^"]+)"/i);
    if (colorMatch) {
        result.color = colorMatch[1].trim();
    }

    // Extract confidence
    const confidenceMatch = content.match(/"confidence"\s*:\s*(\d+)/i);
    if (confidenceMatch) {
        result.confidence = Math.min(100, Math.max(0, parseInt(confidenceMatch[1], 10)));
    } else if (result.brand || result.model) {
        // If we extracted something but no confidence, assume moderate confidence
        result.confidence = 60;
    }

    return result;
}

/**
 * Main function to detect device from images
 * @param images Array of base64 image strings (typically just the back photo)
 * @param config AI provider configuration
 * @param options Optional detection options including brand hint
 */
export async function detectDeviceFromImages(
    images: string[],
    config: AIVisionConfig,
    options?: DeviceDetectionOptions
): Promise<DeviceDetectionResult> {
    if (!config.apiKey) {
        throw { code: 'INVALID_API_KEY', message: 'API key not configured', retryable: false } as AIVisionError;
    }

    if (images.length === 0) {
        throw { code: 'IMAGE_QUALITY', message: 'No images provided', retryable: false } as AIVisionError;
    }

    const brandHint = options?.brandHint;

    try {
        switch (config.provider) {
            case 'openai':
                return await detectDeviceWithOpenAI(images, config.apiKey, brandHint);
            case 'google':
                return await detectDeviceWithGoogle(images, config.apiKey, brandHint);
            case 'anthropic':
                return await detectDeviceWithAnthropic(images, config.apiKey, brandHint);
            default:
                throw { code: 'UNKNOWN', message: 'Unknown AI provider', retryable: false } as AIVisionError;
        }
    } catch (error) {
        if ((error as AIVisionError).code) {
            throw error;
        }
        // Network error
        if (error instanceof TypeError && error.message.includes('fetch')) {
            throw { code: 'NO_INTERNET', message: 'Network error - check your connection', retryable: true } as AIVisionError;
        }
        throw { code: 'UNKNOWN', message: String(error), retryable: true } as AIVisionError;
    }
}

/**
 * Main function to extract parts from receipt image
 */
export async function extractPartsFromReceipt(
    imageBase64: string,
    config: AIVisionConfig
): Promise<ReceiptScanResult> {
    // Note: Don't check navigator.onLine here - this runs on server where navigator doesn't exist

    if (!config.apiKey) {
        throw { code: 'INVALID_API_KEY', message: 'API key not configured', retryable: false } as AIVisionError;
    }

    try {
        switch (config.provider) {
            case 'openai':
                return await extractWithOpenAI(imageBase64, config.apiKey);
            case 'google':
                return await extractWithGoogle(imageBase64, config.apiKey);
            case 'anthropic':
                return await extractWithAnthropic(imageBase64, config.apiKey);
            default:
                throw { code: 'UNKNOWN', message: 'Unknown AI provider', retryable: false } as AIVisionError;
        }
    } catch (error) {
        if ((error as AIVisionError).code) {
            throw error;
        }
        // Network error
        if (error instanceof TypeError && error.message.includes('fetch')) {
            throw { code: 'NO_INTERNET', message: 'Network error - check your connection', retryable: true } as AIVisionError;
        }
        throw { code: 'UNKNOWN', message: String(error), retryable: true } as AIVisionError;
    }
}
