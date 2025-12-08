/**
 * Migration script: Extracts translations from src/lib/i18n.ts
 * and creates separate JSON locale files for i18next
 * 
 * Run with: npx tsx scripts/migrate-i18n.ts
 */

import * as fs from 'fs';
import * as path from 'path';

// Import translations from the existing file
import { translations } from '../src/lib/i18n';

const LOCALES_DIR = path.join(process.cwd(), 'public', 'locales');

// Supported languages
const languages = ['en', 'ar', 'fr'] as const;

/**
 * Convert flat key structure to nested structure
 * e.g., 'install.step.welcome' -> { install: { step: { welcome: '...' } } }
 */
function flatToNested(flat: Record<string, string>): Record<string, unknown> {
    const nested: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(flat)) {
        const parts = key.split('.');
        let current: Record<string, unknown> = nested;

        for (let i = 0; i < parts.length - 1; i++) {
            const part = parts[i];
            if (!(part in current)) {
                current[part] = {};
            }
            // If the current value is a string (leaf node that's being overwritten),
            // convert it to an object with a _value key
            if (typeof current[part] === 'string') {
                current[part] = { _value: current[part] };
            }
            current = current[part] as Record<string, unknown>;
        }

        const lastPart = parts[parts.length - 1];
        // If there's already an object at this key, preserve it and add the value
        if (typeof current[lastPart] === 'object' && current[lastPart] !== null) {
            (current[lastPart] as Record<string, unknown>)._value = value;
        } else {
            current[lastPart] = value;
        }
    }

    return nested;
}

/**
 * Keep flat structure - better for i18next-scanner
 */
function keepFlat(flat: Record<string, string>): Record<string, string> {
    return { ...flat };
}

async function migrate() {
    console.log('🚀 Starting i18n migration...\n');

    // Create locales directory
    if (!fs.existsSync(LOCALES_DIR)) {
        fs.mkdirSync(LOCALES_DIR, { recursive: true });
        console.log(`📁 Created directory: ${LOCALES_DIR}`);
    }

    // Process each language
    for (const lang of languages) {
        const langDir = path.join(LOCALES_DIR, lang);

        // Create language directory
        if (!fs.existsSync(langDir)) {
            fs.mkdirSync(langDir, { recursive: true });
        }

        const langTranslations = translations[lang];
        const keyCount = Object.keys(langTranslations).length;

        // Write flat structure (recommended for i18next-scanner compatibility)
        const outputPath = path.join(langDir, 'translation.json');
        fs.writeFileSync(
            outputPath,
            JSON.stringify(keepFlat(langTranslations), null, 2),
            'utf-8'
        );

        console.log(`✅ ${lang.toUpperCase()}: Exported ${keyCount} keys to ${outputPath}`);
    }

    console.log('\n📊 Summary:');
    console.log(`   - English (en): ${Object.keys(translations.en).length} keys`);
    console.log(`   - Arabic (ar): ${Object.keys(translations.ar).length} keys`);
    console.log(`   - French (fr): ${Object.keys(translations.fr).length} keys`);

    console.log('\n✨ Migration complete!');
    console.log('\nNext steps:');
    console.log('1. Review the generated files in public/locales/');
    console.log('2. Update src/lib/i18n-config.ts to use i18next');
    console.log('3. Run i18next-scanner to detect new keys: npm run i18n:scan');
}

migrate().catch(console.error);
