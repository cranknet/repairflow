/**
 * OCR Service - Hybrid OCR with multiple providers
 * Tesseract.js (browser), OCR.space (API)
 */

export type OCRProvider = 'tesseract' | 'ocrspace';

export interface OCRResult {
    text: string;
    confidence?: number;
    provider: OCRProvider;
}

export class OCRError extends Error {
    constructor(
        message: string,
        public code: 'NETWORK_ERROR' | 'INVALID_API_KEY' | 'RATE_LIMIT' | 'IMAGE_ERROR' | 'OCR_FAILED'
    ) {
        super(message);
        this.name = 'OCRError';
    }
}

/**
 * Extract text from image using OCR.space API
 */
export async function extractTextWithOCRSpace(
    imageBase64: string,
    apiKey: string,
    language: 'eng' | 'ara' | 'fre' = 'eng'
): Promise<OCRResult> {
    try {
        const response = await fetch('https://api.ocr.space/parse/image', {
            method: 'POST',
            headers: {
                'apikey': apiKey,
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
                base64Image: `data:image/jpeg;base64,${imageBase64}`,
                language: language,
                isTable: 'true', // Better for receipts
                OCREngine: '2', // Better for receipts and special chars
                scale: 'true',
                detectOrientation: 'true',
            }),
        });

        if (!response.ok) {
            if (response.status === 401 || response.status === 403) {
                throw new OCRError('Invalid OCR.space API key', 'INVALID_API_KEY');
            }
            if (response.status === 429) {
                throw new OCRError('OCR.space rate limit exceeded (500/day on free plan)', 'RATE_LIMIT');
            }
            throw new OCRError(`OCR.space API error: ${response.status}`, 'OCR_FAILED');
        }

        const result = await response.json();

        if (result.IsErroredOnProcessing) {
            throw new OCRError(result.ErrorMessage || 'OCR processing failed', 'OCR_FAILED');
        }

        if (!result.ParsedResults || result.ParsedResults.length === 0) {
            throw new OCRError('No text found in image', 'IMAGE_ERROR');
        }

        const parsedText = result.ParsedResults
            .map((r: any) => r.ParsedText)
            .join('\n')
            .trim();

        if (!parsedText) {
            throw new OCRError('No text extracted from image', 'IMAGE_ERROR');
        }

        return {
            text: parsedText,
            confidence: result.ParsedResults[0]?.TextOverlay?.confidence,
            provider: 'ocrspace',
        };
    } catch (error) {
        if (error instanceof OCRError) throw error;
        if (error instanceof TypeError && error.message.includes('fetch')) {
            throw new OCRError('Network error - check your internet connection', 'NETWORK_ERROR');
        }
        throw new OCRError(`OCR failed: ${(error as Error).message}`, 'OCR_FAILED');
    }
}

/**
 * Extract text using Tesseract.js (browser-side)
 * This runs entirely in the browser - no API key needed!
 */
export async function extractTextWithTesseract(
    imageBase64: string,
    language: 'eng' | 'ara' | 'fra' = 'eng'
): Promise<OCRResult> {
    // Dynamic import to avoid bundling Tesseract on server
    const Tesseract = await import('tesseract.js');

    try {
        const result = await Tesseract.recognize(
            `data:image/jpeg;base64,${imageBase64}`,
            language,
            {
                logger: (m) => {
                    // Can be used for progress updates
                    if (m.status === 'recognizing text') {
                        console.log(`OCR Progress: ${Math.round(m.progress * 100)}%`);
                    }
                },
            }
        );

        if (!result.data.text.trim()) {
            throw new OCRError('No text extracted from image', 'IMAGE_ERROR');
        }

        return {
            text: result.data.text.trim(),
            confidence: result.data.confidence,
            provider: 'tesseract',
        };
    } catch (error) {
        if (error instanceof OCRError) throw error;
        throw new OCRError(`Tesseract OCR failed: ${(error as Error).message}`, 'OCR_FAILED');
    }
}
