#!/usr/bin/env tsx
/**
 * Unified i18n Management Script
 *
 * This is the single source of truth for all i18n operations.
 * All locale files (en, fr, ar) will always have the same keys.
 * English is the source of truth.
 *
 * Commands:
 *   npm run i18n sync       - Sync all locale files (add missing, remove extra keys)
 *   npm run i18n translate  - Translate all [TRANSLATE] markers using LibreTranslate API
 *   npm run i18n check      - Check for issues (missing keys, untranslated text)
 *   npm run i18n report     - Generate a detailed report
 *   npm run i18n            - Run sync + translate (full pipeline)
 */

import * as fs from 'fs';
import * as path from 'path';
import { glob } from 'glob';

// ============================================================================
// Configuration
// ============================================================================

const LOCALES_DIR = path.join(process.cwd(), 'public', 'locales');
const LOCALES = ['en', 'fr', 'ar'] as const;
const SOURCE_LOCALE = 'en';
const TRANSLATE_MARKER = '[TRANSLATE]';
const REPORT_DIR = path.join(process.cwd(), 'report');

type Locale = (typeof LOCALES)[number];
type LocaleData = Record<string, string>;

// ============================================================================
// Utilities
// ============================================================================

function loadLocale(locale: Locale): LocaleData {
    const filePath = path.join(LOCALES_DIR, locale, 'translation.json');
    try {
        return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    } catch {
        console.error(`❌ Could not load ${locale}/translation.json`);
        return {};
    }
}

function saveLocale(locale: Locale, data: LocaleData): void {
    const filePath = path.join(LOCALES_DIR, locale, 'translation.json');
    // Sort keys alphabetically
    const sorted: LocaleData = {};
    Object.keys(data)
        .sort()
        .forEach((key) => {
            sorted[key] = data[key];
        });
    fs.writeFileSync(filePath, JSON.stringify(sorted, null, 2) + '\n', 'utf-8');
}

function shouldSkipTranslation(key: string): boolean {
    // Skip technical keys that shouldn't be translated
    if (key.length <= 1 || /^[\d\s\$\.,\/:;@_\-]+$/.test(key)) return true;
    if (key.startsWith('/') || key.startsWith('./') || key.startsWith('@/')) return true;
    if (key.includes('@serialport') || key.includes('@tauri')) return true;
    return false;
}

function needsTranslation(value: string | undefined): boolean {
    return !!value && value.startsWith(TRANSLATE_MARKER);
}

async function translateText(text: string, targetLang: string): Promise<string | null> {
    const endpoints = [
        'https://libretranslate.com/translate',
        'https://libretranslate.de/translate',
    ];

    for (const url of endpoints) {
        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    q: text,
                    source: 'en',
                    target: targetLang,
                    format: 'text',
                }),
            });
            if (!response.ok) continue;

            const contentType = response.headers.get('content-type') || '';
            if (contentType.includes('application/json')) {
                const data = await response.json();
                if (data.translatedText && data.translatedText !== text) {
                    return data.translatedText;
                }
            }
        } catch {
            // Try next endpoint
        }
    }
    return null;
}

// ============================================================================
// Commands
// ============================================================================

async function syncCommand(): Promise<{ added: number; removed: number }> {
    console.log('\n🔄 Syncing locale files...\n');

    const en = loadLocale('en');
    const fr = loadLocale('fr');
    const ar = loadLocale('ar');

    const enKeys = new Set(Object.keys(en));
    let addedCount = 0;
    let removedCount = 0;

    // Sync French
    const frKeys = new Set(Object.keys(fr));
    for (const key of enKeys) {
        if (!frKeys.has(key)) {
            fr[key] = shouldSkipTranslation(key) ? en[key] : `${TRANSLATE_MARKER} ${en[key]}`;
            addedCount++;
        }
    }
    for (const key of frKeys) {
        if (!enKeys.has(key)) {
            delete fr[key];
            removedCount++;
        }
    }

    // Sync Arabic
    const arKeys = new Set(Object.keys(ar));
    for (const key of enKeys) {
        if (!arKeys.has(key)) {
            ar[key] = shouldSkipTranslation(key) ? en[key] : `${TRANSLATE_MARKER} ${en[key]}`;
            addedCount++;
        }
    }
    for (const key of arKeys) {
        if (!enKeys.has(key)) {
            delete ar[key];
            removedCount++;
        }
    }

    // Sort English too for consistency
    saveLocale('en', en);
    saveLocale('fr', fr);
    saveLocale('ar', ar);

    console.log(`   ✅ English keys: ${enKeys.size}`);
    console.log(`   ✅ French keys:  ${Object.keys(fr).length}`);
    console.log(`   ✅ Arabic keys:  ${Object.keys(ar).length}`);

    if (addedCount > 0) console.log(`   ➕ Added ${addedCount} missing keys`);
    if (removedCount > 0) console.log(`   ➖ Removed ${removedCount} extra keys`);

    return { added: addedCount, removed: removedCount };
}

async function translateCommand(): Promise<number> {
    console.log('\n🌐 Translating marked entries...\n');

    const en = loadLocale('en');
    const fr = loadLocale('fr');
    const ar = loadLocale('ar');

    // Collect keys needing translation
    const keysToTranslate = new Set<string>();

    Object.keys(fr).forEach((k) => {
        if (needsTranslation(fr[k])) keysToTranslate.add(k);
    });
    Object.keys(ar).forEach((k) => {
        if (needsTranslation(ar[k])) keysToTranslate.add(k);
    });

    if (keysToTranslate.size === 0) {
        console.log('   ✅ All translations are complete!\n');
        return 0;
    }

    console.log(`   Found ${keysToTranslate.size} keys needing translation.\n`);

    let translatedCount = 0;
    const langMap: Record<string, string> = { fr: 'French', ar: 'Arabic' };

    for (const key of keysToTranslate) {
        const sourceText = (en[key] || key)
            .replace(/^\[TODO_TRANSLATE\]\s*/, '')
            .replace(/^\[TRANSLATE\]\s*/, '')
            .trim();

        // Translate French if needed
        if (needsTranslation(fr[key])) {
            const tr = await translateText(sourceText, 'fr');
            if (tr) {
                fr[key] = tr;
                console.log(`   ✔ [FR] ${key.substring(0, 50)}`);
                translatedCount++;
            }
            await new Promise((r) => setTimeout(r, 250));
        }

        // Translate Arabic if needed
        if (needsTranslation(ar[key])) {
            const tr = await translateText(sourceText, 'ar');
            if (tr) {
                ar[key] = tr;
                console.log(`   ✔ [AR] ${key.substring(0, 50)}`);
                translatedCount++;
            }
            await new Promise((r) => setTimeout(r, 250));
        }
    }

    saveLocale('fr', fr);
    saveLocale('ar', ar);

    console.log(`\n   ✅ Translated ${translatedCount} entries.\n`);
    return translatedCount;
}

async function checkCommand(): Promise<{ errors: number; warnings: number }> {
    console.log('\n🔍 Checking i18n status...\n');

    const en = loadLocale('en');
    const fr = loadLocale('fr');
    const ar = loadLocale('ar');

    const enKeys = new Set(Object.keys(en));
    const frKeys = new Set(Object.keys(fr));
    const arKeys = new Set(Object.keys(ar));

    let errors = 0;
    let warnings = 0;

    // Check key parity
    const frMissing = [...enKeys].filter((k) => !frKeys.has(k));
    const arMissing = [...enKeys].filter((k) => !arKeys.has(k));
    const frExtra = [...frKeys].filter((k) => !enKeys.has(k));
    const arExtra = [...arKeys].filter((k) => !enKeys.has(k));

    if (frMissing.length > 0 || arMissing.length > 0) {
        console.log(`   ❌ Missing keys: FR=${frMissing.length}, AR=${arMissing.length}`);
        errors += frMissing.length + arMissing.length;
    }

    if (frExtra.length > 0 || arExtra.length > 0) {
        console.log(`   ⚠️  Extra keys: FR=${frExtra.length}, AR=${arExtra.length}`);
        warnings += frExtra.length + arExtra.length;
    }

    // Check untranslated entries
    const frUntranslated = Object.values(fr).filter((v) => needsTranslation(v)).length;
    const arUntranslated = Object.values(ar).filter((v) => needsTranslation(v)).length;

    if (frUntranslated > 0 || arUntranslated > 0) {
        console.log(`   ⚠️  Untranslated: FR=${frUntranslated}, AR=${arUntranslated}`);
        warnings += frUntranslated + arUntranslated;
    }

    // Summary
    console.log(`\n   📊 Summary:`);
    console.log(`      English: ${enKeys.size} keys`);
    console.log(`      French:  ${frKeys.size} keys (${frUntranslated} untranslated)`);
    console.log(`      Arabic:  ${arKeys.size} keys (${arUntranslated} untranslated)`);

    if (errors === 0 && warnings === 0) {
        console.log(`\n   ✅ All checks passed!\n`);
    } else if (errors > 0) {
        console.log(`\n   ❌ Check failed with ${errors} errors and ${warnings} warnings.`);
        console.log(`      Run: npm run i18n sync\n`);
    } else {
        console.log(`\n   ⚠️  Check passed with ${warnings} warnings.`);
        console.log(`      Run: npm run i18n translate\n`);
    }

    return { errors, warnings };
}

async function reportCommand(): Promise<void> {
    console.log('\n📝 Generating i18n report...\n');

    const en = loadLocale('en');
    const fr = loadLocale('fr');
    const ar = loadLocale('ar');

    const enKeys = Object.keys(en).sort();
    const frUntranslated = enKeys.filter((k) => needsTranslation(fr[k]));
    const arUntranslated = enKeys.filter((k) => needsTranslation(ar[k]));

    // Ensure report directory exists
    if (!fs.existsSync(REPORT_DIR)) {
        fs.mkdirSync(REPORT_DIR, { recursive: true });
    }

    let report = '='.repeat(80) + '\n';
    report += 'I18N STATUS REPORT\n';
    report += '='.repeat(80) + '\n\n';
    report += `Generated: ${new Date().toISOString()}\n\n`;
    report += `Total Keys: ${enKeys.length}\n`;
    report += `French Untranslated: ${frUntranslated.length}\n`;
    report += `Arabic Untranslated: ${arUntranslated.length}\n\n`;

    if (frUntranslated.length > 0) {
        report += '-'.repeat(80) + '\n';
        report += 'FRENCH UNTRANSLATED\n';
        report += '-'.repeat(80) + '\n';
        frUntranslated.forEach((k) => {
            report += `  ${k}\n`;
        });
        report += '\n';
    }

    if (arUntranslated.length > 0) {
        report += '-'.repeat(80) + '\n';
        report += 'ARABIC UNTRANSLATED\n';
        report += '-'.repeat(80) + '\n';
        arUntranslated.forEach((k) => {
            report += `  ${k}\n`;
        });
        report += '\n';
    }

    const reportPath = path.join(REPORT_DIR, 'i18n-status.txt');
    fs.writeFileSync(reportPath, report, 'utf-8');

    console.log(`   ✅ Report saved to: ${reportPath}\n`);
}

// ============================================================================
// Main
// ============================================================================

async function main() {
    const args = process.argv.slice(2);
    const command = args[0] || 'all';

    console.log('━'.repeat(60));
    console.log('  RepairFlow i18n Manager');
    console.log('━'.repeat(60));

    switch (command) {
        case 'sync':
            await syncCommand();
            break;

        case 'translate':
            await translateCommand();
            break;

        case 'check':
            const { errors } = await checkCommand();
            if (errors > 0) process.exit(1);
            break;

        case 'report':
            await reportCommand();
            break;

        case 'all':
        default:
            // Full pipeline: sync → translate → check
            await syncCommand();
            await translateCommand();
            await checkCommand();
            break;
    }
}

main().catch((err) => {
    console.error('Fatal error:', err);
    process.exit(1);
});
