#!/usr/bin/env tsx
/**
 * i18n Auto-Fix Script
 * 
 * Automatically:
 * 1. Detects missing translation keys and adds them to locale files
 * 2. Extracts hardcoded strings and suggests/creates translation keys
 * 3. Updates all locale files (en, ar, fr)
 * 
 * Usage:
 *   npm run i18n:fix          # Interactive mode
 *   npm run i18n:fix -- --auto  # Auto-fix all (non-interactive)
 */

import * as fs from 'fs';
import * as path from 'path';
import { glob } from 'glob';
import * as readline from 'readline';

interface LocaleData {
  [key: string]: string;
}

interface MissingKey {
  key: string;
  file: string;
  line: number;
  suggestedValue?: string;
}

interface HardcodedString {
  file: string;
  line: number;
  content: string;
  context: string;
  suggestedKey: string;
}

const LOCALE_FILES = {
  en: 'public/locales/en/translation.json',
  ar: 'public/locales/ar/translation.json',
  fr: 'public/locales/fr/translation.json',
};

// Pattern to extract translation keys
const TRANSLATION_KEY_PATTERN = /t\(['"]([^'"]+)['"]\)/g;

// Pattern to detect hardcoded strings that should be translated
const HARDCODED_PATTERN = /(?:label|title|placeholder|description|error|message|text)\s*[:=]\s*['"]([A-Z][^'"]{5,}?)['"]/gi;

const EXCLUDE_PATTERNS = [
  /node_modules/,
  /\.next/,
  /\.git/,
  /\.test\./,
  /\.spec\./,
  /i18n\.ts$/,
  /i18n-config\.ts$/,
  /scripts\//,
  /report\//,
];

function loadLocale(locale: keyof typeof LOCALE_FILES): LocaleData {
  const filePath = path.join(process.cwd(), LOCALE_FILES[locale]);
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(content);
  } catch {
    return {};
  }
}

function saveLocale(locale: keyof typeof LOCALE_FILES, data: LocaleData): void {
  const filePath = path.join(process.cwd(), LOCALE_FILES[locale]);
  
  // Sort keys alphabetically
  const sorted: LocaleData = {};
  Object.keys(data).sort().forEach((key) => {
    sorted[key] = data[key];
  });
  
  fs.writeFileSync(filePath, JSON.stringify(sorted, null, 2) + '\n');
}

function extractUsedKeys(content: string): { key: string; line: number }[] {
  const keys: { key: string; line: number }[] = [];
  const lines = content.split('\n');
  
  lines.forEach((line, index) => {
    const matches = line.matchAll(TRANSLATION_KEY_PATTERN);
    for (const match of matches) {
      if (match[1] && !match[1].includes('${')) {
        keys.push({ key: match[1], line: index + 1 });
      }
    }
  });
  
  return keys;
}

function extractHardcodedStrings(content: string, filePath: string): HardcodedString[] {
  const strings: HardcodedString[] = [];
  const lines = content.split('\n');
  
  lines.forEach((line, index) => {
    // Skip lines that already use translation
    if (line.includes("t('") || line.includes('t("') || line.includes('getTranslation(')) {
      return;
    }
    
    const matches = line.matchAll(HARDCODED_PATTERN);
    for (const match of matches) {
      const str = match[1];
      if (str && str.length > 5) {
        // Generate a suggested key from the string
        const suggestedKey = generateKeyFromString(str);
        strings.push({
          file: filePath,
          line: index + 1,
          content: str,
          context: line.trim().substring(0, 80),
          suggestedKey,
        });
      }
    }
  });
  
  return strings;
}

function generateKeyFromString(str: string): string {
  // Convert string to camelCase key
  return str
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .split(/\s+/)
    .filter((word) => word.length > 0)
    .slice(0, 5) // Max 5 words
    .map((word, index) => 
      index === 0 ? word : word.charAt(0).toUpperCase() + word.slice(1)
    )
    .join('');
}

function generateTranslationPlaceholder(key: string, value: string, locale: string): string {
  if (locale === 'en') {
    return value;
  }
  return `[TRANSLATE] ${value}`;
}

async function scanForIssues(): Promise<{
  missingKeys: MissingKey[];
  hardcodedStrings: HardcodedString[];
}> {
  const enLocale = loadLocale('en');
  const existingKeys = new Set(Object.keys(enLocale));
  
  const files = await glob('src/**/*.{ts,tsx}', {
    ignore: ['**/node_modules/**', '**/.next/**'],
  });
  
  const missingKeys: MissingKey[] = [];
  const hardcodedStrings: HardcodedString[] = [];
  
  for (const file of files) {
    if (EXCLUDE_PATTERNS.some((p) => p.test(file))) continue;
    
    const content = fs.readFileSync(file, 'utf-8');
    
    // Find missing keys
    const usedKeys = extractUsedKeys(content);
    usedKeys.forEach(({ key, line }) => {
      if (!existingKeys.has(key)) {
        // Try to find a suggested value from context
        const lines = content.split('\n');
        const contextLine = lines[line - 1] || '';
        
        missingKeys.push({
          key,
          file,
          line,
          suggestedValue: key, // Use key as default value
        });
      }
    });
    
    // Find hardcoded strings
    const hardcoded = extractHardcodedStrings(content, file);
    hardcodedStrings.push(...hardcoded);
  }
  
  // Deduplicate
  const uniqueMissingKeys = missingKeys.filter((k, i, arr) => 
    arr.findIndex((x) => x.key === k.key) === i
  );
  
  const uniqueHardcoded = hardcodedStrings.filter((h, i, arr) =>
    arr.findIndex((x) => x.content === h.content) === i
  );
  
  return {
    missingKeys: uniqueMissingKeys,
    hardcodedStrings: uniqueHardcoded,
  };
}

function addMissingKeys(keys: MissingKey[]): void {
  if (keys.length === 0) return;
  
  const locales: (keyof typeof LOCALE_FILES)[] = ['en', 'ar', 'fr'];
  
  locales.forEach((locale) => {
    const data = loadLocale(locale);
    
    keys.forEach((key) => {
      if (!data[key.key]) {
        data[key.key] = generateTranslationPlaceholder(
          key.key,
          key.suggestedValue || key.key,
          locale
        );
      }
    });
    
    saveLocale(locale, data);
  });
  
  console.log(`✅ Added ${keys.length} missing keys to all locale files`);
}

function addHardcodedAsKeys(strings: HardcodedString[]): void {
  if (strings.length === 0) return;
  
  const locales: (keyof typeof LOCALE_FILES)[] = ['en', 'ar', 'fr'];
  
  locales.forEach((locale) => {
    const data = loadLocale(locale);
    
    strings.forEach((str) => {
      if (!data[str.suggestedKey]) {
        data[str.suggestedKey] = generateTranslationPlaceholder(
          str.suggestedKey,
          str.content,
          locale
        );
      }
    });
    
    saveLocale(locale, data);
  });
  
  console.log(`✅ Added ${strings.length} hardcoded strings as translation keys`);
  console.log(`\n⚠️  Remember to update your code to use t('key') instead of hardcoded strings!`);
  console.log(`   Suggested replacements:\n`);
  strings.slice(0, 10).forEach((str) => {
    console.log(`   "${str.content.substring(0, 30)}..." → t('${str.suggestedKey}')`);
  });
  if (strings.length > 10) {
    console.log(`   ... and ${strings.length - 10} more`);
  }
}

async function interactiveMode(
  missingKeys: MissingKey[],
  hardcodedStrings: HardcodedString[]
): Promise<void> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  
  const question = (q: string): Promise<string> => 
    new Promise((resolve) => rl.question(q, resolve));
  
  console.log('\n📋 i18n Auto-Fix Interactive Mode\n');
  
  if (missingKeys.length > 0) {
    console.log(`Found ${missingKeys.length} missing translation keys.`);
    const answer = await question('Add them to locale files? (y/n): ');
    if (answer.toLowerCase() === 'y') {
      addMissingKeys(missingKeys);
    }
  }
  
  if (hardcodedStrings.length > 0) {
    console.log(`\nFound ${hardcodedStrings.length} hardcoded strings.`);
    console.log('These will be added as translation keys (you still need to update your code).\n');
    hardcodedStrings.slice(0, 5).forEach((str) => {
      console.log(`  "${str.content.substring(0, 40)}..." → ${str.suggestedKey}`);
    });
    if (hardcodedStrings.length > 5) {
      console.log(`  ... and ${hardcodedStrings.length - 5} more`);
    }
    
    const answer = await question('\nAdd these as translation keys? (y/n): ');
    if (answer.toLowerCase() === 'y') {
      addHardcodedAsKeys(hardcodedStrings);
    }
  }
  
  rl.close();
}

async function main() {
  const args = process.argv.slice(2);
  const autoMode = args.includes('--auto');
  const missingOnly = args.includes('--missing-only');
  
  console.log('🔍 Scanning for i18n issues...\n');
  
  const { missingKeys, hardcodedStrings } = await scanForIssues();
  
  console.log(`📊 Found:`);
  console.log(`   - ${missingKeys.length} missing translation keys`);
  console.log(`   - ${hardcodedStrings.length} hardcoded strings\n`);
  
  if (missingKeys.length === 0 && hardcodedStrings.length === 0) {
    console.log('✅ No issues found!');
    process.exit(0);
  }
  
  if (autoMode) {
    // Auto-fix mode - just add missing keys
    addMissingKeys(missingKeys);
    
    if (!missingOnly && hardcodedStrings.length > 0) {
      addHardcodedAsKeys(hardcodedStrings);
    }
  } else {
    // Interactive mode
    await interactiveMode(missingKeys, missingOnly ? [] : hardcodedStrings);
  }
  
  console.log('\n✅ Done!');
}

main().catch((error) => {
  console.error('Error:', error);
  process.exit(1);
});

