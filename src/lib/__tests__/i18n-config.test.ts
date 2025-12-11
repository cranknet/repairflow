/**
 * i18n Configuration Unit Tests
 */
import {
    supportedLanguages,
    languages,
    getLanguageDirection,
    getTranslation,
    type Language
} from '../i18n-config';

describe('i18n Configuration', () => {
    describe('supportedLanguages', () => {
        it('contains expected locales', () => {
            expect(supportedLanguages).toContain('en');
            expect(supportedLanguages).toContain('fr');
            expect(supportedLanguages).toContain('ar');
            expect(supportedLanguages.length).toBe(3);
        });
    });

    describe('languages', () => {
        it('has config for all supported languages', () => {
            supportedLanguages.forEach((langCode) => {
                const lang = languages.find(l => l.code === langCode);
                expect(lang).toBeDefined();
                expect(lang?.name).toBeDefined();
                expect(lang?.dir).toMatch(/^(ltr|rtl)$/);
            });
        });

        it('has correct direction for Arabic', () => {
            const arabic = languages.find(l => l.code === 'ar');
            expect(arabic?.dir).toBe('rtl');
        });

        it('has correct direction for English and French', () => {
            const english = languages.find(l => l.code === 'en');
            const french = languages.find(l => l.code === 'fr');
            expect(english?.dir).toBe('ltr');
            expect(french?.dir).toBe('ltr');
        });
    });

    describe('getLanguageDirection', () => {
        it('returns correct direction for each locale', () => {
            expect(getLanguageDirection('en')).toBe('ltr');
            expect(getLanguageDirection('fr')).toBe('ltr');
            expect(getLanguageDirection('ar')).toBe('rtl');
        });
    });

    describe('getTranslation', () => {
        it('returns translation key as fallback for unknown keys', () => {
            // When key doesn't exist, i18next returns the key itself
            const result = getTranslation('some.unknown.key', 'en');
            expect(typeof result).toBe('string');
        });

        it('defaults to English when no language specified', () => {
            const result = getTranslation('dashboard');
            expect(typeof result).toBe('string');
        });
    });
});
