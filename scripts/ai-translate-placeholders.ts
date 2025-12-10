// ai-translate-placeholders.ts
// Identifies English placeholders and prepares them for AI translation
import * as fs from 'fs';
import * as path from 'path';

function shouldSkipKey(key: string, value: string): boolean {
    // Skip single characters, numbers, symbols
    if (key.length <= 1 || /^[\d\s\$\.,\/:;@_\-]+$/.test(key)) {
        return true;
    }
    // Skip paths and technical identifiers
    if (key.startsWith('/') || key.startsWith('./') || key.startsWith('@/') || key.includes('@serialport')) {
        return true;
    }
    // Skip HTTP headers and technical constants
    if (key.includes('-') && key === key.toUpperCase()) {
        return true;
    }
    // Skip if value is just a symbol or single character
    if (value.trim().length <= 1 && /^[\d\s\$\.,\/:;@_\-]+$/.test(value.trim())) {
        return true;
    }
    return false;
}

function isEnglishPlaceholder(text: string, enText: string): boolean {
    if (!text || typeof text !== 'string') return false;
    
    // Check if it starts with translation markers
    if (text.startsWith('[TRANSLATE]') || text.startsWith('[TODO_TRANSLATE]')) {
        return true;
    }
    
    // Check if the text is identical to English (case-insensitive)
    const cleanText = text
        .replace(/^\[TODO_TRANSLATE\]\s*/i, '')
        .replace(/^\[TRANSLATE\]\s*/i, '')
        .trim();
    
    return cleanText.toLowerCase() === enText.toLowerCase().trim();
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
        if (shouldSkipKey(key, en[key])) {
            continue;
        }
        
        const enText = en[key];
        if (!enText) continue;

        // Check French
        if (fr[key] && isEnglishPlaceholder(fr[key], enText)) {
            const cleanText = fr[key]
                .replace(/^\[TODO_TRANSLATE\]\s*/i, '')
                .replace(/^\[TRANSLATE\]\s*/i, '')
                .trim();
            frToTranslate.push({ key, enText, currentText: cleanText });
        }

        // Check Arabic
        if (ar[key] && isEnglishPlaceholder(ar[key], enText)) {
            const cleanText = ar[key]
                .replace(/^\[TODO_TRANSLATE\]\s*/i, '')
                .replace(/^\[TRANSLATE\]\s*/i, '')
                .trim();
            arToTranslate.push({ key, enText, currentText: cleanText });
        }
    }

    console.log(`\nFound ${frToTranslate.length} French entries to translate`);
    console.log(`Found ${arToTranslate.length} Arabic entries to translate\n`);

    // Export to JSON for processing
    const output = {
        fr: frToTranslate,
        ar: arToTranslate,
        summary: {
            frCount: frToTranslate.length,
            arCount: arToTranslate.length,
        }
    };

    fs.writeFileSync(
        path.join(process.cwd(), 'scripts', 'translations-needed.json'),
        JSON.stringify(output, null, 2),
        'utf-8'
    );

    console.log('✅ Exported translation needs to scripts/translations-needed.json');
    console.log('This file contains all entries that need translation.');
}

main().catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
});



