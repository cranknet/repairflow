/**
 * API Error Message Translation Helper
 * 
 * This module provides translated error messages for API routes.
 * Use these functions instead of hardcoded error strings.
 */

import { getServerTranslation, type Language } from './server-translation';
import { NextResponse } from 'next/server';

/**
 * Common API error keys mapped to translation keys
 */
export const ApiErrorKeys = {
    UNAUTHORIZED: 'errors.unauthorized',
    FORBIDDEN: 'errors.forbidden',
    NOT_FOUND: 'errors.notFound',
    TICKET_NOT_FOUND: 'errors.ticketNotFound',
    USER_NOT_FOUND: 'errors.userNotFound',
    CUSTOMER_NOT_FOUND: 'errors.customerNotFound',
    PART_NOT_FOUND: 'errors.partNotFound',
    SUPPLIER_NOT_FOUND: 'errors.supplierNotFound',
    CHAT_NOT_FOUND: 'errors.chatNotFound',
    MESSAGE_NOT_FOUND: 'errors.messageNotFound',
    RETURN_NOT_FOUND: 'errors.returnNotFound',
    INVALID_INPUT: 'errors.invalidInput',
    FAILED_TO_FETCH: 'errors.failedToFetch',
    FAILED_TO_CREATE: 'errors.failedToCreate',
    FAILED_TO_UPDATE: 'errors.failedToUpdate',
    FAILED_TO_DELETE: 'errors.failedToDelete',
    ONLY_ADMINS_CAN_UPDATE: 'errors.onlyAdminsCanUpdate',
    ONLY_ADMINS_CAN_DELETE: 'errors.onlyAdminsCanDelete',
    SKU_ALREADY_EXISTS: 'errors.skuAlreadyExists',
    CONNECTION_FAILED: 'errors.connectionFailed',
    TEST_FAILED: 'errors.testFailed',
    UNKNOWN_PROVIDER: 'errors.unknownProvider',
    NO_OCR_API_KEY: 'errors.noOcrApiKey',
    NO_AI_API_KEY: 'errors.noAiApiKey',
    NETWORK_REQUIRED: 'errors.networkRequired',
    INVALID_API_KEY: 'errors.invalidApiKey',
    RATE_LIMIT_EXCEEDED: 'errors.rateLimitExceeded',
    IMAGE_ERROR: 'errors.imageError',
    OCR_FAILED: 'errors.ocrFailed',
    TOO_MANY_REQUESTS: 'errors.tooManyRequests',
} as const;

export type ApiErrorKey = keyof typeof ApiErrorKeys;

/**
 * Get a translated error message
 * @param key - The error key from ApiErrorKeys
 * @param lang - Language to translate to (defaults to 'en')
 */
export function getApiError(key: ApiErrorKey, lang: Language = 'en'): string {
    return getServerTranslation(ApiErrorKeys[key], lang);
}

/**
 * Create a JSON error response with translated message
 * @param key - The error key from ApiErrorKeys
 * @param status - HTTP status code
 * @param lang - Language to translate to (defaults to 'en')
 */
export function apiErrorResponse(
    key: ApiErrorKey,
    status: number,
    lang: Language = 'en'
): NextResponse {
    return NextResponse.json(
        { error: getApiError(key, lang) },
        { status }
    );
}

/**
 * Common error responses (English only for backward compatibility)
 * These can be used directly in API routes
 */
export const ApiErrors = {
    unauthorized: () => NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
    forbidden: () => NextResponse.json({ error: 'Forbidden' }, { status: 403 }),
    notFound: (resource?: string) => NextResponse.json(
        { error: resource ? `${resource} not found` : 'Not found' },
        { status: 404 }
    ),
    invalidInput: () => NextResponse.json({ error: 'Invalid input' }, { status: 400 }),
    serverError: (message?: string) => NextResponse.json(
        { error: message || 'Internal server error' },
        { status: 500 }
    ),
};

/**
 * Helper to extract language from request headers or query params
 * Useful for translating API error messages based on client preference
 */
export function getLanguageFromRequest(request: Request): Language {
    // Try to get from Accept-Language header
    const acceptLanguage = request.headers.get('Accept-Language');
    if (acceptLanguage) {
        const preferred = acceptLanguage.split(',')[0].split('-')[0].toLowerCase();
        if (preferred === 'ar' || preferred === 'fr') {
            return preferred;
        }
    }
    return 'en';
}

