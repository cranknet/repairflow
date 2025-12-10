// complete-translations.ts
// Completes all remaining translations for fr and ar locale files
import * as fs from 'fs';
import * as path from 'path';

// Translation function - uses AI to translate text
function translateToFrench(text: string): string {
    // Remove [TRANSLATE] marker if present
    const cleanText = text.replace(/^\[TRANSLATE\]\s*/i, '').trim();
    
    // This will be populated with actual translations
    // For now, return placeholder - translations will be applied directly
    return cleanText;
}

function translateToArabic(text: string): string {
    // This will be populated with actual translations
    // For now, return placeholder - translations will be applied directly
    return text;
}

async function main() {
    const localesDir = path.join(process.cwd(), 'public', 'locales');
    const enPath = path.join(localesDir, 'en', 'translation.json');
    const frPath = path.join(localesDir, 'fr', 'translation.json');
    const arPath = path.join(localesDir, 'ar', 'translation.json');

    console.log('Loading locale files...');
    const en = JSON.parse(fs.readFileSync(enPath, 'utf-8')) as Record<string, string>;
    const fr = JSON.parse(fs.readFileSync(frPath, 'utf-8')) as Record<string, string>;
    const ar = JSON.parse(fs.readFileSync(arPath, 'utf-8')) as Record<string, string>;

    // Find entries that need translation
    const frToTranslate: Array<{ key: string; enText: string; currentText: string }> = [];
    const arToTranslate: Array<{ key: string; enText: string; currentText: string }> = [];

    for (const key in en) {
        const enText = en[key];
        if (!enText) continue;

        // Check French - entries with [TRANSLATE] marker
        if (fr[key] && typeof fr[key] === 'string' && fr[key].startsWith('[TRANSLATE]')) {
            const cleanText = fr[key].replace(/^\[TRANSLATE\]\s*/i, '').trim();
            frToTranslate.push({ key, enText, currentText: cleanText });
        }

        // Check Arabic - entries with [TRANSLATE] marker or identical to English (excluding technical keys)
        if (ar[key] && typeof ar[key] === 'string') {
            // Check for [TRANSLATE] marker
            if (ar[key].startsWith('[TRANSLATE]')) {
                const cleanText = ar[key].replace(/^\[TRANSLATE\]\s*/i, '').trim();
                arToTranslate.push({ key, enText, currentText: cleanText });
            }
            // Check if identical to English (excluding technical keys)
            else if (ar[key] === enText) {
                // Skip technical keys
                if (key.length > 2 && !/^[\d\s\$\.,\/:;@_\-]+$/.test(key) && 
                    !key.startsWith('/') && !key.startsWith('./') && 
                    !key.startsWith('@/') && !key.includes('@serialport')) {
                    arToTranslate.push({ key, enText, currentText: enText });
                }
            }
        }
    }

    console.log(`\nFound ${frToTranslate.length} French entries to translate`);
    console.log(`Found ${arToTranslate.length} Arabic entries to translate\n`);

    // Export for processing
    const output = {
        fr: frToTranslate,
        ar: arToTranslate,
        summary: {
            frCount: frToTranslate.length,
            arCount: arToTranslate.length,
        }
    };

    fs.writeFileSync(
        path.join(process.cwd(), 'scripts', 'remaining-translations.json'),
        JSON.stringify(output, null, 2),
        'utf-8'
    );

    console.log('✅ Exported remaining translations to scripts/remaining-translations.json');
    console.log('This file contains all entries that still need translation.');
}

main().catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
});


