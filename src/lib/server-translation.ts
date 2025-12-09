/**
 * Server-safe translation helper
 * 
 * Use this in API routes and server components instead of i18n-config.ts
 * This avoids React context issues that occur when using react-i18next on the server.
 */

// Import translations directly (these are JSON files, no React dependencies)
import enTranslation from '../../public/locales/en/translation.json';
import arTranslation from '../../public/locales/ar/translation.json';
import frTranslation from '../../public/locales/fr/translation.json';

export const supportedLanguages = ['en', 'ar', 'fr'] as const;
export type Language = (typeof supportedLanguages)[number];

const translations: Record<Language, Record<string, string>> = {
    en: enTranslation as Record<string, string>,
    ar: arTranslation as Record<string, string>,
    fr: frTranslation as Record<string, string>,
};

/**
 * Get a translation for a key (server-safe)
 * Use this in API routes and server components
 * 
 * @param key - Translation key
 * @param lang - Language code (defaults to 'en')
 * @param params - Optional parameters for interpolation
 * @returns Translated string or the key if not found
 */
export function getServerTranslation(
    key: string,
    lang: Language = 'en',
    params?: Record<string, string | number>
): string {
    // Get translation from the specified language, fallback to English
    let translation = translations[lang]?.[key] || translations.en[key] || key;

    // Handle parameter interpolation (e.g., {name} -> John)
    if (params) {
        Object.entries(params).forEach(([paramKey, value]) => {
            translation = translation.replace(
                new RegExp(`\\{${paramKey}\\}`, 'g'),
                String(value)
            );
        });
    }

    return translation;
}

/**
 * Shorthand for getting English translation (most common case in API routes)
 */
export const t = (key: string, params?: Record<string, string | number>): string => {
    return getServerTranslation(key, 'en', params);
};

/**
 * Get the direction (LTR/RTL) for a language
 */
export function getLanguageDirection(lang: Language): 'ltr' | 'rtl' {
    return lang === 'ar' ? 'rtl' : 'ltr';
}

