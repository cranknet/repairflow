/**
 * i18next configuration for RepairFlow
 * 
 * This file sets up i18next with:
 * - React integration via react-i18next
 * - Browser language detection
 * - JSON locale files from public/locales
 */

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Import translations directly (for SSR compatibility)
import enTranslation from '../../public/locales/en/translation.json';
import arTranslation from '../../public/locales/ar/translation.json';
import frTranslation from '../../public/locales/fr/translation.json';

export const supportedLanguages = ['en', 'ar', 'fr'] as const;
export type Language = (typeof supportedLanguages)[number];

export const languages: { code: Language; name: string; flag: string; dir: 'ltr' | 'rtl' }[] = [
    { code: 'en', name: 'English', flag: '🇺🇸', dir: 'ltr' },
    { code: 'ar', name: 'العربية', flag: '🇸🇦', dir: 'rtl' },
    { code: 'fr', name: 'Français', flag: '🇫🇷', dir: 'ltr' },
];

const resources = {
    en: { translation: enTranslation },
    ar: { translation: arTranslation },
    fr: { translation: frTranslation },
};

// Initialize i18next only on client side
if (typeof window !== 'undefined') {
    i18n
        .use(LanguageDetector)
        .use(initReactI18next)
        .init({
            resources,
            fallbackLng: 'en',
            supportedLngs: supportedLanguages,

            // Debug mode in development
            debug: process.env.NODE_ENV === 'development',

            interpolation: {
                escapeValue: false, // React already escapes values
            },

            // Language detection options
            detection: {
                order: ['localStorage', 'navigator', 'htmlTag'],
                caches: ['localStorage'],
                lookupLocalStorage: 'app_language',
            },

            // React options
            react: {
                useSuspense: false, // Disable suspense for SSR compatibility
            },
        });
}

// Server-side initialization (without detection)
if (typeof window === 'undefined' && !i18n.isInitialized) {
    i18n
        .use(initReactI18next)
        .init({
            resources,
            lng: 'en', // Default language for SSR
            fallbackLng: 'en',
            supportedLngs: supportedLanguages,
            interpolation: {
                escapeValue: false,
            },
            react: {
                useSuspense: false,
            },
        });
}

export default i18n;

/**
 * Helper function to get translation (for use outside React components)
 * This maintains backward compatibility with the existing getTranslation function
 */
export function getTranslation(
    key: string,
    lang: Language = 'en',
    params?: Record<string, string | number>
): string {
    // Use i18next's t function with specified language
    return i18n.t(key, { lng: lang, ...params }) as string;
}

/**
 * Get the direction (LTR/RTL) for a language
 */
export function getLanguageDirection(lang: Language): 'ltr' | 'rtl' {
    return lang === 'ar' ? 'rtl' : 'ltr';
}
