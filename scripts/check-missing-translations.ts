// check-missing-translations.ts
import * as fs from 'fs';
import * as path from 'path';

function load(file: string) {
    return JSON.parse(fs.readFileSync(file, 'utf-8')) as Record<string, string>;
}

const localesDir = path.join(process.cwd(), 'public', 'locales');
const en = load(path.join(localesDir, 'en', 'translation.json'));
const fr = load(path.join(localesDir, 'fr', 'translation.json'));
const ar = load(path.join(localesDir, 'ar', 'translation.json'));

function diff(base: Record<string, string>, compare: Record<string, string>) {
    const missing: string[] = [];
    for (const key of Object.keys(base)) {
        if (!(key in compare)) {
            missing.push(key);
        }
    }
    return missing;
}

const missingFr = diff(en, fr);
const missingAr = diff(en, ar);

console.log('Missing in French:', missingFr.length);
missingFr.forEach(k => console.log('  fr missing:', k));
console.log('Missing in Arabic:', missingAr.length);
missingAr.forEach(k => console.log('  ar missing:', k));

// Also report keys where translation is still a placeholder
function placeholderKeys(obj: Record<string, string>) {
    return Object.entries(obj)
        .filter(([, v]) => v.startsWith('[TODO_TRANSLATE]') || v === '')
        .map(([k]) => k);
}

const placeholderFr = placeholderKeys(fr);
const placeholderAr = placeholderKeys(ar);
console.log('Placeholders in French:', placeholderFr.length);
placeholderFr.forEach(k => console.log('  fr placeholder:', k));
console.log('Placeholders in Arabic:', placeholderAr.length);
placeholderAr.forEach(k => console.log('  ar placeholder:', k));
