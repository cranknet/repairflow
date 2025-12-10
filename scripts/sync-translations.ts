// sync-translations.ts
// Syncs fr and ar translation files with en file to ensure all keys match
import * as fs from 'fs';
import * as path from 'path';

function shouldSkipKey(key: string): boolean {
    // Skip technical keys that shouldn't be translated
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
    return false;
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

    // Get all keys from English (source of truth)
    const enKeys = new Set(Object.keys(en));
    const frKeys = new Set(Object.keys(fr));
    const arKeys = new Set(Object.keys(ar));

    // Find missing keys in fr and ar
    const frMissing: string[] = [];
    const arMissing: string[] = [];
    
    // Find extra keys in fr and ar (not in en)
    const frExtra: string[] = [];
    const arExtra: string[] = [];

    for (const key of enKeys) {
        if (!frKeys.has(key)) {
            frMissing.push(key);
        }
        if (!arKeys.has(key)) {
            arMissing.push(key);
        }
    }

    for (const key of frKeys) {
        if (!enKeys.has(key)) {
            frExtra.push(key);
        }
    }

    for (const key of arKeys) {
        if (!enKeys.has(key)) {
            arExtra.push(key);
        }
    }

    console.log(`\n📊 Sync Analysis:`);
    console.log(`   English keys: ${enKeys.size}`);
    console.log(`   French keys: ${frKeys.size}`);
    console.log(`   Arabic keys: ${arKeys.size}`);
    console.log(`\n   Missing in French: ${frMissing.length}`);
    console.log(`   Missing in Arabic: ${arMissing.length}`);
    console.log(`   Extra in French: ${frExtra.length}`);
    console.log(`   Extra in Arabic: ${arExtra.length}`);

    // Add missing keys to French
    if (frMissing.length > 0) {
        console.log(`\n➕ Adding ${frMissing.length} missing keys to French...`);
        for (const key of frMissing) {
            const enText = en[key];
            // For user-facing text, use [TRANSLATE] marker
            // For technical keys, use English text as-is
            if (shouldSkipKey(key)) {
                fr[key] = enText;
            } else {
                fr[key] = `[TRANSLATE] ${enText}`;
            }
        }
    }

    // Add missing keys to Arabic
    if (arMissing.length > 0) {
        console.log(`\n➕ Adding ${arMissing.length} missing keys to Arabic...`);
        for (const key of arMissing) {
            const enText = en[key];
            // For user-facing text, use [TRANSLATE] marker
            // For technical keys, use English text as-is
            if (shouldSkipKey(key)) {
                ar[key] = enText;
            } else {
                ar[key] = `[TRANSLATE] ${enText}`;
            }
        }
    }

    // Remove extra keys from French (optional - we'll just report them)
    if (frExtra.length > 0) {
        console.log(`\n⚠️  Found ${frExtra.length} extra keys in French (not in English):`);
        frExtra.slice(0, 10).forEach(key => console.log(`   - ${key}`));
        if (frExtra.length > 10) {
            console.log(`   ... and ${frExtra.length - 10} more`);
        }
        console.log(`   (These keys will be removed to keep files in sync)`);
        // Remove extra keys
        for (const key of frExtra) {
            delete fr[key];
        }
    }

    // Remove extra keys from Arabic (optional - we'll just report them)
    if (arExtra.length > 0) {
        console.log(`\n⚠️  Found ${arExtra.length} extra keys in Arabic (not in English):`);
        arExtra.slice(0, 10).forEach(key => console.log(`   - ${key}`));
        if (arExtra.length > 10) {
            console.log(`   ... and ${arExtra.length - 10} more`);
        }
        console.log(`   (These keys will be removed to keep files in sync)`);
        // Remove extra keys
        for (const key of arExtra) {
            delete ar[key];
        }
    }

    // Sort keys alphabetically for consistency
    const sortedFr: Record<string, string> = {};
    const sortedAr: Record<string, string> = {};
    
    const sortedKeys = Array.from(enKeys).sort();
    for (const key of sortedKeys) {
        sortedFr[key] = fr[key];
        sortedAr[key] = ar[key];
    }

    // Write updated files
    if (frMissing.length > 0 || frExtra.length > 0) {
        console.log(`\n💾 Writing updated French file...`);
        fs.writeFileSync(frPath, JSON.stringify(sortedFr, null, 2) + '\n', 'utf-8');
    }

    if (arMissing.length > 0 || arExtra.length > 0) {
        console.log(`💾 Writing updated Arabic file...`);
        fs.writeFileSync(arPath, JSON.stringify(sortedAr, null, 2) + '\n', 'utf-8');
    }

    console.log(`\n✅ Sync complete!`);
    if (frMissing.length === 0 && arMissing.length === 0 && frExtra.length === 0 && arExtra.length === 0) {
        console.log(`   All files are already in sync! 🎉`);
    }
}

main().catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
});

