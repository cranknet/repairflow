#!/usr/bin/env ts-node
/**
 * Comprehensive i18n scanning script
 * Scans for:
 * 1. Hardcoded user-facing strings
 * 2. Missing translation keys (used in code but not in locale files)
 * 3. Unused translation keys (in locale files but not used in code)
 */

import * as fs from 'fs';
import * as path from 'path';
import { glob } from 'glob';

interface HardcodedString {
  file: string;
  line: number;
  content: string;
  context: string;
  severity: 'high' | 'medium' | 'low';
}

interface MissingKey {
  file: string;
  line: number;
  key: string;
  context: string;
}

interface UnusedKey {
  key: string;
  languages: string[];
}

const EXCLUDE_PATTERNS = [
  /node_modules/,
  /\.git/,
  /build/,
  /dist/,
  /\.next/,
  /coverage/,
  /\.test\./,
  /\.spec\./,
  /i18n\.ts$/, // Legacy i18n file
  /scan-i18n/,
  /report\//,
];

// Patterns to detect translation function calls
const TRANSLATION_PATTERNS = [
  // t('key') or t("key")
  /t\(['"]([^'"]+)['"]\)/g,
  // getTranslation('key') or getTranslation("key")
  /getTranslation\(['"]([^'"]+)['"]/g,
  // t('key', { params }) - extract just the key
  /t\(['"]([^'"]+)['"]\s*,/g,
];

// Patterns to detect hardcoded strings
const HARDCODED_PATTERNS = [
  // JSX text content: >Text here<
  />\s*['"]([A-Z][^'"]{3,}?)['"]\s*</g,
  // String literals in JSX props
  /(?:label|title|placeholder|description|text|message|error|warning|success|info|ariaLabel|aria-label)\s*[:=]\s*['"]([^'"]{3,}?)['"]/gi,
  // Button text
  /<button[^>]*>[\s\S]*?['"]([A-Z][^'"]{3,}?)['"]/gi,
  // Table headers
  /<th[^>]*>\s*['"]([^'"]{3,}?)['"]\s*<\/th>/gi,
  // Error messages
  /(?:error|Error|ERROR|message|Message)\s*[:=]\s*['"]([^'"]{3,}?)['"]/gi,
  // Toast/notification messages
  /(?:toast|notification|alert)\.(?:success|error|info|warning)\(['"]([^'"]{3,}?)['"]/gi,
  // Return statements with strings
  /return\s+['"]([A-Z][^'"]{3,}?)['"]/g,
];

const EXCLUDE_STRINGS = [
  /^[a-z]+$/, // Single lowercase words
  /^\d+$/, // Numbers
  /^[A-Z_]+$/, // Constants
  /^(id|key|value|name|type|status|className|href|src|alt|title|data-|aria-)$/i, // Common props/attrs
  /^(px|rem|em|%|vh|vw)$/, // CSS units
  /^[a-z]+\.[a-z]+$/, // dot notation (likely already translated)
  /^(true|false|null|undefined)$/i, // JS literals
  /^[{}[\]]+$/, // Brackets only
];

function loadLocaleFiles(): Record<string, Record<string, string>> {
  const locales: Record<string, Record<string, string>> = {};
  const localeDirs = ['public/locales/en', 'public/locales/ar', 'public/locales/fr'];
  
  for (const dir of localeDirs) {
    const filePath = path.join(dir, 'translation.json');
    if (fs.existsSync(filePath)) {
      const lang = path.basename(path.dirname(filePath));
      try {
        const content = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
        locales[lang] = flattenObject(content);
      } catch (error) {
        console.error(`Error loading ${filePath}:`, error);
      }
    }
  }
  
  return locales;
}

function flattenObject(obj: any, prefix = '', result: Record<string, string> = {}): Record<string, string> {
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      const newKey = prefix ? `${prefix}.${key}` : key;
      if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
        flattenObject(obj[key], newKey, result);
      } else {
        result[newKey] = obj[key];
      }
    }
  }
  return result;
}

function extractTranslationKeys(content: string): Set<string> {
  const keys = new Set<string>();
  
  for (const pattern of TRANSLATION_PATTERNS) {
    const matches = content.matchAll(pattern);
    for (const match of matches) {
      const key = match[1];
      if (key && !key.includes('${') && !key.includes('{')) {
        keys.add(key);
      }
    }
  }
  
  return keys;
}

function scanHardcodedStrings(filePath: string, content: string): HardcodedString[] {
  const lines = content.split('\n');
  const issues: HardcodedString[] = [];
  
  lines.forEach((line, index) => {
    // Skip lines with translation calls
    if (line.includes("t('") || line.includes('t("') || line.includes('getTranslation(')) {
      return;
    }
    
    // Skip comment lines
    if (line.trim().startsWith('//') || line.trim().startsWith('*')) {
      return;
    }
    
    // Skip import/export statements
    if (line.trim().startsWith('import ') || line.trim().startsWith('export ')) {
      return;
    }
    
    // Check for hardcoded strings
    for (const pattern of HARDCODED_PATTERNS) {
      const matches = line.matchAll(pattern);
      for (const match of matches) {
        const str = match[1] || match[2] || match[0];
        if (str && str.length > 3) {
          // Check if it should be excluded
          const shouldExclude = EXCLUDE_STRINGS.some((pattern) => pattern.test(str));
          if (!shouldExclude && !str.includes('${') && !str.includes('{') && !str.includes('`')) {
            // Additional check: skip if it looks like a CSS class or technical string
            if (!str.match(/^[a-z-]+$/i) || str.length > 10) {
              issues.push({
                file: filePath,
                line: index + 1,
                content: str,
                context: line.trim().substring(0, 100),
                severity: determineSeverity(str, line),
              });
            }
          }
        }
      }
    }
  });
  
  return issues;
}

function determineSeverity(str: string, context: string): 'high' | 'medium' | 'low' {
  // High severity: UI labels, buttons, error messages, long strings
  if (
    /(?:label|title|button|error|warning|success|message|alert|notification)/i.test(context) ||
    str.length > 20
  ) {
    return 'high';
  }
  // Medium severity: descriptions, placeholders
  if (/(?:description|placeholder|help|tooltip|hint)/i.test(context)) {
    return 'medium';
  }
  // Low severity: everything else
  return 'low';
}

async function scanForMissingKeys(
  files: string[],
  localeKeys: Set<string>
): Promise<MissingKey[]> {
  const missing: MissingKey[] = [];
  
  for (const file of files) {
    if (EXCLUDE_PATTERNS.some((pattern) => pattern.test(file))) {
      continue;
    }
    
    try {
      const content = fs.readFileSync(file, 'utf-8');
      const lines = content.split('\n');
      const usedKeys = extractTranslationKeys(content);
      
      lines.forEach((line, index) => {
        for (const pattern of TRANSLATION_PATTERNS) {
          const matches = line.matchAll(pattern);
          for (const match of matches) {
            const key = match[1];
            if (key && !key.includes('${') && !key.includes('{')) {
              if (!localeKeys.has(key)) {
                missing.push({
                  file,
                  line: index + 1,
                  key,
                  context: line.trim().substring(0, 100),
                });
              }
            }
          }
        }
      });
    } catch (error) {
      console.error(`Error scanning ${file}:`, error);
    }
  }
  
  return missing;
}

async function scanForUnusedKeys(
  files: string[],
  localeKeys: Set<string>
): Promise<UnusedKey[]> {
  const usedKeys = new Set<string>();
  
  for (const file of files) {
    if (EXCLUDE_PATTERNS.some((pattern) => pattern.test(file))) {
      continue;
    }
    
    try {
      const content = fs.readFileSync(file, 'utf-8');
      const keys = extractTranslationKeys(content);
      keys.forEach((key) => usedKeys.add(key));
    } catch (error) {
      console.error(`Error scanning ${file}:`, error);
    }
  }
  
  const unused: UnusedKey[] = [];
  for (const key of localeKeys) {
    if (!usedKeys.has(key)) {
      unused.push({
        key,
        languages: ['en', 'ar', 'fr'], // All languages have the same keys
      });
    }
  }
  
  return unused;
}

async function main() {
  console.log('🔍 Starting comprehensive i18n scan...\n');
  
  // Load locale files
  console.log('📚 Loading locale files...');
  const locales = loadLocaleFiles();
  const allLocaleKeys = new Set<string>();
  
  for (const lang in locales) {
    for (const key in locales[lang]) {
      allLocaleKeys.add(key);
    }
  }
  console.log(`   Found ${allLocaleKeys.size} translation keys in locale files\n`);
  
  // Find all source files
  const files = await glob('src/**/*.{ts,tsx,js,jsx}', {
    ignore: EXCLUDE_PATTERNS.map((p) => p.toString().replace(/^\/|\/$/g, '')),
  });
  
  console.log(`📁 Scanning ${files.length} source files...\n`);
  
  // 1. Scan for hardcoded strings
  console.log('1️⃣  Scanning for hardcoded strings...');
  const hardcodedIssues: HardcodedString[] = [];
  for (const file of files) {
    if (EXCLUDE_PATTERNS.some((pattern) => pattern.test(file))) {
      continue;
    }
    try {
      const content = fs.readFileSync(file, 'utf-8');
      const issues = scanHardcodedStrings(file, content);
      hardcodedIssues.push(...issues);
    } catch (error) {
      console.error(`Error scanning ${file}:`, error);
    }
  }
  console.log(`   Found ${hardcodedIssues.length} hardcoded strings\n`);
  
  // 2. Scan for missing keys
  console.log('2️⃣  Scanning for missing translation keys...');
  const missingKeys = await scanForMissingKeys(files, allLocaleKeys);
  console.log(`   Found ${missingKeys.length} missing keys\n`);
  
  // 3. Scan for unused keys
  console.log('3️⃣  Scanning for unused translation keys...');
  const unusedKeys = await scanForUnusedKeys(files, allLocaleKeys);
  console.log(`   Found ${unusedKeys.length} unused keys\n`);
  
  // Generate report
  const report = {
    scanDate: new Date().toISOString(),
    summary: {
      totalFilesScanned: files.length,
      totalLocaleKeys: allLocaleKeys.size,
      hardcodedStrings: {
        total: hardcodedIssues.length,
        bySeverity: {
          high: hardcodedIssues.filter((i) => i.severity === 'high').length,
          medium: hardcodedIssues.filter((i) => i.severity === 'medium').length,
          low: hardcodedIssues.filter((i) => i.severity === 'low').length,
        },
      },
      missingKeys: {
        total: missingKeys.length,
        unique: new Set(missingKeys.map((m) => m.key)).size,
      },
      unusedKeys: {
        total: unusedKeys.length,
      },
    },
    hardcodedStrings: hardcodedIssues,
    missingKeys: Array.from(new Set(missingKeys.map((m) => m.key))).map((key) => {
      const occurrences = missingKeys.filter((m) => m.key === key);
      return {
        key,
        occurrences: occurrences.length,
        files: Array.from(new Set(occurrences.map((o) => o.file))),
        examples: occurrences.slice(0, 3).map((o) => ({
          file: o.file,
          line: o.line,
          context: o.context,
        })),
      };
    }),
    unusedKeys: unusedKeys,
  };
  
  // Write report
  const reportPath = 'report/i18n-comprehensive-scan.json';
  if (!fs.existsSync('report')) {
    fs.mkdirSync('report', { recursive: true });
  }
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  
  // Print summary
  console.log('✅ Scan complete!\n');
  console.log('📊 Summary:');
  console.log(`   Files scanned: ${files.length}`);
  console.log(`   Translation keys in locale files: ${allLocaleKeys.size}`);
  console.log(`\n   Hardcoded strings: ${hardcodedIssues.length}`);
  console.log(`      High severity: ${report.summary.hardcodedStrings.bySeverity.high}`);
  console.log(`      Medium severity: ${report.summary.hardcodedStrings.bySeverity.medium}`);
  console.log(`      Low severity: ${report.summary.hardcodedStrings.bySeverity.low}`);
  console.log(`\n   Missing translation keys: ${report.summary.missingKeys.unique} (${report.summary.missingKeys.total} occurrences)`);
  console.log(`   Unused translation keys: ${report.summary.unusedKeys.total}`);
  console.log(`\n📄 Full report saved to ${reportPath}`);
}

main().catch(console.error);

