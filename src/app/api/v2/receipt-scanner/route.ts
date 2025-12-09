/**
 * Receipt Scanner API - Extract parts from supplier invoice images
 * Supports: Tesseract.js (free), OCR.space, Vision API
 * POST /api/v2/receipt-scanner
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { extractPartsFromReceipt, AIVisionError, AIVisionProvider } from '@/lib/ai-vision';
import { extractTextWithOCRSpace, OCRError } from '@/lib/ocr-service';
import { parseReceiptText, AIParseError } from '@/lib/ai-text-parser';
import { matchPartsToInventory, addMatchedPartsToInventory } from '@/lib/part-matcher';
import { z } from 'zod';
import { t } from '@/lib/server-translation';

// Scanning modes
type ScanMode = 'tesseract' | 'ocrspace' | 'vision';

const scanReceiptSchema = z.object({
    image: z.string().min(1, 'Image is required'), // Base64 image
    mode: z.enum(['tesseract', 'ocrspace', 'vision']).optional(),
    ocrText: z.string().optional(), // Pre-extracted OCR text (for Tesseract mode)
});

const confirmPartsSchema = z.object({
    parts: z.array(z.object({
        name: z.string(),
        quantity: z.number().min(1),
        unitPrice: z.number().min(0),
        sku: z.string().optional(),
        matchedPartId: z.string().nullable(),
        createNew: z.boolean().optional(),
    })),
    supplier: z.object({
        name: z.string().optional(),
        phone: z.string().optional(),
        email: z.string().optional(),
        address: z.string().optional(),
        existingId: z.string().optional(), // If user selected an existing supplier
    }).optional(),
    invoiceNumber: z.string().optional(),
    date: z.string().optional(),
    total: z.number().optional(),
    forceAdd: z.boolean().optional(), // Skip duplicate check
});

/**
 * POST /api/v2/receipt-scanner - Scan receipt and extract parts
 */
export async function POST(request: NextRequest) {
    try {
        const session = await auth();
        if (!session) {
            return NextResponse.json({ error: t('unauthorized') }, { status: 401 });
        }

        const body = await request.json();

        // Determine action based on body content
        if (body.action === 'confirm') {
            return await handleConfirmParts(body, session.user.id);
        }

        // Default: Scan receipt
        return await handleScanReceipt(body, session.user.id);
    } catch (error) {
        console.error('Receipt scanner error:', error);

        // Handle OCR errors
        if (error instanceof OCRError) {
            const errorMessages: Record<string, { message: string; statusCode: number }> = {
                'NETWORK_ERROR': { message: t('internetConnectionRequiredForReceipt'), statusCode: 503 },
                'INVALID_API_KEY': { message: t('ocrApiKeyIsInvalid'), statusCode: 400 },
                'RATE_LIMIT': { message: t('ocrRateLimitExceeded500day'), statusCode: 429 },
                'IMAGE_ERROR': { message: t('errors.imageError'), statusCode: 400 },
                'OCR_FAILED': { message: t('ocrProcessingFailedPleaseTry'), statusCode: 500 },
            };
            const errorInfo = errorMessages[error.code] || { message: error.message, statusCode: 500 };
            return NextResponse.json(
                { error: errorInfo.message, code: error.code, retryable: error.code !== 'INVALID_API_KEY' },
                { status: errorInfo.statusCode }
            );
        }

        // Handle AI Parse errors
        if (error instanceof AIParseError) {
            const errorMessages: Record<string, { message: string; statusCode: number }> = {
                'NETWORK_ERROR': { message: t('receiptScanner.noInternet'), statusCode: 503 },
                'INVALID_API_KEY': { message: t('aiApiKeyIsInvalid'), statusCode: 400 },
                'RATE_LIMIT': { message: t('tooManyRequestsPleaseWait'), statusCode: 429 },
                'NO_PARTS': { message: 'No parts detected in this receipt', statusCode: 400 },
                'PARSE_ERROR': { message: t('failedToParseReceiptText'), statusCode: 500 },
            };
            const errorInfo = errorMessages[error.code] || { message: error.message, statusCode: 500 };
            return NextResponse.json(
                { error: errorInfo.message, code: error.code, retryable: error.code !== 'INVALID_API_KEY' },
                { status: errorInfo.statusCode }
            );
        }

        // Handle AI Vision errors
        if ((error as AIVisionError).code) {
            const aiError = error as AIVisionError;
            const errorMessages: Record<string, { message: string; statusCode: number }> = {
                'NO_INTERNET': { message: t('internetConnectionRequiredForReceipt'), statusCode: 503 },
                'INVALID_API_KEY': { message: t('aiVisionApiKeyIs'), statusCode: 400 },
                'RATE_LIMIT': { message: t('tooManyRequestsPleaseWait'), statusCode: 429 },
                'IMAGE_QUALITY': { message: t('imageQualityTooLowPlease'), statusCode: 400 },
                'NO_PARTS': { message: t('noPartsDetectedInThis'), statusCode: 400 },
                'SERVICE_DOWN': { message: t('aiServiceTemporarilyUnavailablePlease'), statusCode: 503 },
            };
            const errorInfo = errorMessages[aiError.code] || { message: aiError.message, statusCode: 500 };
            return NextResponse.json(
                { error: errorInfo.message, code: aiError.code, retryable: aiError.retryable },
                { status: errorInfo.statusCode }
            );
        }

        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { error: t('validationError'), details: error.errors },
                { status: 400 }
            );
        }

        return NextResponse.json(
            { error: t('receiptScanner.processFailed') },
            { status: 500 }
        );
    }
}

/**
 * Handle receipt scanning - supports Tesseract, OCR.space, and Vision modes
 */
async function handleScanReceipt(body: any, userId: string) {
    const data = scanReceiptSchema.parse(body);

    // Get settings
    const settings = await prisma.settings.findMany({
        where: {
            key: {
                in: ['aiVisionProvider', 'aiVisionApiKey', 'ocrApiKey', 'scanMode'],
            },
        },
    });

    const settingsMap = Object.fromEntries(settings.map(s => [s.key, s.value]));

    // Determine scan mode (can be overridden per-request)
    const scanMode: ScanMode = (data.mode || settingsMap.scanMode || 'tesseract') as ScanMode;
    const aiProvider = (settingsMap.aiVisionProvider || 'openai') as AIVisionProvider;
    const aiApiKey = settingsMap.aiVisionApiKey;
    const ocrApiKey = settingsMap.ocrApiKey;

    let extractedParts: any[];
    let supplier: { name?: string; phone?: string; email?: string; address?: string } | undefined;
    let invoiceNumber: string | undefined;
    let date: string | undefined;
    let total: number | undefined;
    let ocrText: string | undefined;

    if (scanMode === 'vision') {
        // Mode 1: AI Vision (most expensive, best quality)
        if (!aiApiKey) {
            return NextResponse.json(
                { error: t('aiApiKeyNotConfigured'), code: 'INVALID_API_KEY', retryable: false },
                { status: 400 }
            );
        }

        const extractionResult = await extractPartsFromReceipt(data.image, {
            provider: aiProvider,
            apiKey: aiApiKey,
        });

        extractedParts = extractionResult.parts;
        supplier = extractionResult.supplier;
        invoiceNumber = extractionResult.invoiceNumber;
        date = extractionResult.date;
        total = extractionResult.total;
    } else if (scanMode === 'ocrspace') {
        // Mode 2: OCR.space + Normal API
        if (!ocrApiKey) {
            return NextResponse.json(
                { error: t('ocrspaceApiKeyNotConfigured'), code: 'INVALID_API_KEY', retryable: false },
                { status: 400 }
            );
        }
        if (!aiApiKey) {
            return NextResponse.json(
                { error: 'AI API key not configured for text parsing. Please configure in Settings', code: 'INVALID_API_KEY', retryable: false },
                { status: 400 }
            );
        }

        // Step 1: Extract text using OCR.space
        const ocrResult = await extractTextWithOCRSpace(data.image, ocrApiKey);
        ocrText = ocrResult.text;
        console.log('OCR.space extracted:', ocrText.substring(0, 200) + '...');

        // Step 2: Parse text using normal AI API
        const parsedResult = await parseReceiptText(ocrText, aiProvider, aiApiKey);

        extractedParts = parsedResult.parts;
        supplier = parsedResult.supplier;
        invoiceNumber = parsedResult.invoiceNumber;
        date = parsedResult.date;
        total = parsedResult.total;
    } else {
        // Mode 3: Tesseract.js (client-side OCR) + Normal API
        // In this mode, the client sends pre-extracted OCR text
        if (!data.ocrText) {
            return NextResponse.json(
                { error: t('ocrTextNotProvidedClient'), code: 'PARSE_ERROR', retryable: false },
                { status: 400 }
            );
        }
        if (!aiApiKey) {
            return NextResponse.json(
                { error: 'AI API key not configured for text parsing. Please configure in Settings', code: 'INVALID_API_KEY', retryable: false },
                { status: 400 }
            );
        }

        ocrText = data.ocrText;
        console.log('Tesseract extracted:', ocrText.substring(0, 200) + '...');

        // Parse text using normal AI API
        const parsedResult = await parseReceiptText(ocrText, aiProvider, aiApiKey);

        extractedParts = parsedResult.parts;
        supplier = parsedResult.supplier;
        invoiceNumber = parsedResult.invoiceNumber;
        date = parsedResult.date;
        total = parsedResult.total;
    }

    // Match extracted parts to inventory
    const matchedParts = await matchPartsToInventory(extractedParts);

    // Separate matched and unmatched parts
    const matched = matchedParts.filter(p => p.matchedPartId !== null);
    const unmatched = matchedParts.filter(p => p.matchedPartId === null);

    return NextResponse.json({
        success: true,
        mode: scanMode,
        extractedParts: matchedParts,
        matched,
        unmatched,
        supplier,
        invoiceNumber,
        date,
        total,
        ocrText: ocrText?.substring(0, 500), // Return truncated OCR text for debugging
    });
}

/**
 * Handle confirming and adding parts to inventory
 */
async function handleConfirmParts(body: any, userId: string) {
    const data = confirmPartsSchema.parse(body);

    // Create content hash for duplicate detection
    const partsFingerprint = data.parts
        .map(p => `${p.name.toLowerCase()}:${p.quantity}:${p.unitPrice}`)
        .sort()
        .join('|');
    const contentHash = Buffer.from(partsFingerprint).toString('base64').substring(0, 50);

    // Check for duplicates (unless forceAdd is true)
    if (!data.forceAdd) {
        // Check 1: Exact invoice number match
        if (data.invoiceNumber) {
            const existingByInvoice = await prisma.receiptScan.findFirst({
                where: { invoiceNumber: data.invoiceNumber },
                include: { supplier: true },
            });

            if (existingByInvoice) {
                return NextResponse.json({
                    success: false,
                    duplicate: true,
                    duplicateType: t('invoice'),
                    message: `Invoice "${data.invoiceNumber}" was already scanned on ${existingByInvoice.scannedAt.toLocaleDateString()}`,
                    existingRecord: {
                        id: existingByInvoice.id,
                        scannedAt: existingByInvoice.scannedAt,
                        supplierName: existingByInvoice.supplier?.name,
                    },
                }, { status: 409 });
            }
        }

        // Check 2: Similar content in last 7 days
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        const existingByContent = await prisma.receiptScan.findFirst({
            where: {
                contentHash,
                scannedAt: { gte: sevenDaysAgo },
            },
            include: { supplier: true },
        });

        if (existingByContent) {
            return NextResponse.json({
                success: false,
                duplicate: true,
                duplicateType: 'content',
                message: `Similar receipt was scanned on ${existingByContent.scannedAt.toLocaleDateString()}`,
                existingRecord: {
                    id: existingByContent.id,
                    scannedAt: existingByContent.scannedAt,
                    supplierName: existingByContent.supplier?.name,
                    invoiceNumber: existingByContent.invoiceNumber,
                },
            }, { status: 409 });
        }
    }

    let supplierId: string | undefined;

    // Handle supplier
    if (data.supplier?.existingId) {
        // User selected an existing supplier - just use the ID
        supplierId = data.supplier.existingId;
    } else if (data.supplier?.name) {
        // Create or find supplier by name
        const supplierName = data.supplier.name.toLowerCase();
        const allSuppliers = await prisma.supplier.findMany({
            where: { name: { not: '' } },
        });
        const existingSupplier = allSuppliers.find(
            s => s.name.toLowerCase() === supplierName
        );

        if (existingSupplier) {
            const updatedSupplier = await prisma.supplier.update({
                where: { id: existingSupplier.id },
                data: {
                    phone: data.supplier.phone || existingSupplier.phone,
                    email: data.supplier.email || existingSupplier.email,
                    address: data.supplier.address || existingSupplier.address,
                },
            });
            supplierId = updatedSupplier.id;
        } else {
            const newSupplier = await prisma.supplier.create({
                data: {
                    name: data.supplier.name,
                    phone: data.supplier.phone || null,
                    email: data.supplier.email || null,
                    address: data.supplier.address || null,
                },
            });
            supplierId = newSupplier.id;
        }
    }

    // Add parts to inventory
    const result = await addMatchedPartsToInventory(
        data.parts.map(p => ({
            name: p.name,
            quantity: p.quantity,
            unitPrice: p.unitPrice,
            sku: p.sku,
            matchedPartId: p.matchedPartId,
            matchConfidence: 100,
            matchType: p.matchedPartId ? 'exact' : 'none',
        })),
        userId,
        supplierId
    );

    // Record this scan for future duplicate detection
    await prisma.receiptScan.create({
        data: {
            invoiceNumber: data.invoiceNumber || null,
            supplierId: supplierId || null,
            contentHash,
            partsCount: data.parts.length,
            total: data.total || null,
            date: data.date || null,
            scannedById: userId,
        },
    });

    return NextResponse.json({
        success: true,
        updated: result.updated,
        created: result.created,
        errors: result.errors,
        supplierId,
    });
}
