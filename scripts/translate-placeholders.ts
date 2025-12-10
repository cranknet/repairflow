// translate-placeholders.ts
// Identifies and translates English placeholders in ar and fr locale files
import * as fs from 'fs';
import * as path from 'path';

// Helper to call LibreTranslate public API with fallback handling
async function translate(text: string, targetLang: string): Promise<string> {
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
                return data.translatedText;
            }
        } catch (_) {
            // ignore and try next endpoint
        }
    }
    // Fallback: return the original English text if translation fails
    return text;
}

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

function isEnglishText(text: string, enText: string): boolean {
    // Check if the text is identical to English (case-insensitive)
    if (text.toLowerCase().trim() === enText.toLowerCase().trim()) {
        return true;
    }
    // Check if it starts with translation markers but contains English
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

    // Find English placeholders in French
    const frKeysToTranslate: string[] = [];
    for (const key in en) {
        if (shouldSkipKey(key, en[key])) {
            continue; // Skip technical keys
        }
        if (en[key] && fr[key] && isEnglishText(fr[key], en[key])) {
            frKeysToTranslate.push(key);
        }
    }

    // Find English placeholders in Arabic
    const arKeysToTranslate: string[] = [];
    for (const key in en) {
        if (shouldSkipKey(key, en[key])) {
            continue; // Skip technical keys
        }
        if (en[key] && ar[key] && isEnglishText(ar[key], en[key])) {
            arKeysToTranslate.push(key);
        }
    }

    console.log(`\nFound ${frKeysToTranslate.length} French entries with English placeholders.`);
    console.log(`Found ${arKeysToTranslate.length} Arabic entries with English placeholders.\n`);

    if (frKeysToTranslate.length === 0 && arKeysToTranslate.length === 0) {
        console.log('✅ No English placeholders found. All translations are complete!');
        return;
    }

    // Translate French entries
    let frTranslated = 0;
    let frFailed = 0;
    for (const key of frKeysToTranslate) {
        const enText = en[key];
        const cleanText = fr[key]
            .replace(/^\[TODO_TRANSLATE\]\s*/i, '')
            .replace(/^\[TRANSLATE\]\s*/i, '')
            .trim();
        
        try {
            const translated = await translate(cleanText, 'fr');
            if (translated !== cleanText && translated !== enText) {
                fr[key] = translated;
                frTranslated++;
                console.log(`✔ FR: ${key}`);
            } else {
                frFailed++;
                console.log(`⚠ FR: ${key} (translation may have failed)`);
            }
            // Add delay to be nice to the API
            await new Promise(resolve => setTimeout(resolve, 500));
        } catch (e) {
            frFailed++;
            console.error(`❌ FR: ${key} error:`, e);
        }
    }

    // Translate Arabic entries
    let arTranslated = 0;
    let arFailed = 0;
    for (const key of arKeysToTranslate) {
        const enText = en[key];
        const cleanText = ar[key]
            .replace(/^\[TODO_TRANSLATE\]\s*/i, '')
            .replace(/^\[TRANSLATE\]\s*/i, '')
            .trim();
        
        try {
            const translated = await translate(cleanText, 'ar');
            if (translated !== cleanText && translated !== enText) {
                ar[key] = translated;
                arTranslated++;
                console.log(`✔ AR: ${key}`);
            } else {
                arFailed++;
                console.log(`⚠ AR: ${key} (translation may have failed)`);
            }
            // Add delay to be nice to the API
            await new Promise(resolve => setTimeout(resolve, 500));
        } catch (e) {
            arFailed++;
            console.error(`❌ AR: ${key} error:`, e);
        }
    }

    // Write back the updated files
    fs.writeFileSync(frPath, JSON.stringify(fr, null, 2) + '\n', 'utf-8');
    fs.writeFileSync(arPath, JSON.stringify(ar, null, 2) + '\n', 'utf-8');

    console.log('\n✅ Translation complete!');
    console.log(`French: ${frTranslated} translated, ${frFailed} failed`);
    console.log(`Arabic: ${arTranslated} translated, ${arFailed} failed`);
}

main().catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
});

