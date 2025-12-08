// auto-translate-ar.ts
import * as fs from 'fs';
import * as path from 'path';

// Translate using LibreTranslate (fallback endpoints)
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
            const ct = response.headers.get('content-type') || '';
            if (ct.includes('application/json')) {
                const data = await response.json();
                return data.translatedText;
            }
        } catch (_) {
            // ignore and try next endpoint
        }
    }
    // fallback: return original text
    return text;
}

async function main() {
    const localesDir = path.join(process.cwd(), 'public', 'locales');
    const enPath = path.join(localesDir, 'en', 'translation.json');
    const arPath = path.join(localesDir, 'ar', 'translation.json');

    const en = JSON.parse(fs.readFileSync(enPath, 'utf-8')) as Record<string, string>;
    const ar = JSON.parse(fs.readFileSync(arPath, 'utf-8')) as Record<string, string>;

    const keysToTranslate: string[] = [];
    for (const key of Object.keys(en)) {
        const enVal = en[key];
        const arVal = ar[key];
        // If Arabic value is missing, placeholder, empty, or identical to English/key, treat as needing translation
        if (!arVal || arVal === '' || arVal === enVal || arVal === key || arVal.startsWith('[TODO_TRANSLATE]')) {
            keysToTranslate.push(key);
        }
    }

    console.log(`Found ${keysToTranslate.length} Arabic entries to translate.`);
    for (const key of keysToTranslate) {
        const source = en[key] ?? key;
        const clean = source.replace(/^\[TODO_TRANSLATE\]\s*/, '').trim();
        try {
            const translated = await translate(clean, 'ar');
            ar[key] = translated;
            console.log(`✔ ${key}`);
        } catch (e) {
            console.error(`❌ ${key} error:`, e);
        }
    }

    fs.writeFileSync(arPath, JSON.stringify(ar, null, 2), 'utf-8');
    console.log('✅ Arabic translation file updated.');
}

main().catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
});
