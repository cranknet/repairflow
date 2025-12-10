// batch-translate.ts
// Translates all English placeholders in fr and ar locale files using AI translations
import * as fs from 'fs';
import * as path from 'path';

// This will be populated with translations - for now we'll process directly
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
    const frUpdates: Record<string, string> = {};
    const arUpdates: Record<string, string> = {};

    for (const key in en) {
        const enText = en[key];
        if (!enText) continue;

        // Check French
        if (fr[key] && typeof fr[key] === 'string' && fr[key].startsWith('[TRANSLATE]')) {
            const cleanText = fr[key].replace(/^\[TRANSLATE\]\s*/, '').trim();
            // Mark for translation - will be populated by AI
            frUpdates[key] = cleanText;
        }

        // Check Arabic  
        if (ar[key] && typeof ar[key] === 'string' && ar[key] === enText && key.length > 2) {
            // Skip technical keys
            if (!/^[\d\s\$\.,\/:;@_\-]+$/.test(key) && !key.startsWith('/') && !key.startsWith('./')) {
                arUpdates[key] = enText;
            }
        }
    }

    console.log(`Found ${Object.keys(frUpdates).length} French entries to translate`);
    console.log(`Found ${Object.keys(arUpdates).length} Arabic entries to translate`);
    console.log('\nTranslations will be applied by editing the JSON files directly.');
    console.log('This script identifies entries that need translation.');
}

main().catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
});



