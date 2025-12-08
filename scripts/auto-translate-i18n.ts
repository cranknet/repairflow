// auto-translate-i18n.ts
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

async function main() {
    const localesDir = path.join(process.cwd(), 'public', 'locales');
    const enPath = path.join(localesDir, 'en', 'translation.json');
    const frPath = path.join(localesDir, 'fr', 'translation.json');
    const arPath = path.join(localesDir, 'ar', 'translation.json');

    const en = JSON.parse(fs.readFileSync(enPath, 'utf-8')) as Record<string, string>;
    const fr = JSON.parse(fs.readFileSync(frPath, 'utf-8')) as Record<string, string>;
    const ar = JSON.parse(fs.readFileSync(arPath, 'utf-8')) as Record<string, string>;

    const todoMarker = '[TODO_TRANSLATE]';

    const keys = Object.keys(fr).filter(k => fr[k].startsWith(todoMarker));
    console.log(`Found ${keys.length} missing French translations.`);

    for (const key of keys) {
        const sourceText = en[key] ?? key; // fallback to key if missing in en
        const cleanSource = sourceText.replace(/^\[TODO_TRANSLATE\]\s*/, '').trim();
        try {
            const frText = await translate(cleanSource, 'fr');
            fr[key] = frText;
            const arText = await translate(cleanSource, 'ar');
            ar[key] = arText;
            console.log(`✔ Translated ${key}`);
        } catch (e) {
            console.error(`❌ Failed to translate ${key}:`, e);
        }
    }

    // Write back the updated files
    fs.writeFileSync(frPath, JSON.stringify(fr, null, 2), 'utf-8');
    fs.writeFileSync(arPath, JSON.stringify(ar, null, 2), 'utf-8');
    console.log('✅ Translation complete. Files updated.');
}

main().catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
});
