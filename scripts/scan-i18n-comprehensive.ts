#!/usr/bin/env ts-node
/**
 * Comprehensive i18n scanning script
 * Scans for:
 * 1. Hardcoded user-facing strings that should be translated
 * 2. Missing translation keys (keys used in code but not in translation files)
 * 3. Unused translation keys (keys in translation files but not used in code)
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

interface TranslationKeyUsage {
  file: string;
  line: number;
  key: string;
  context: string;
}

interface ScanReport {
  scanDate: string;
  totalFilesScanned: number;
  hardcodedStrings: HardcodedString[];
  translationKeysUsed: Set<string>;
  translationKeysInFiles: Set<string>;
  missingKeys: string[];
  unusedKeys: string[];
  issuesBySeverity: {
    high: number;
    medium: number;
    low: number;
  };
}

// Patterns to detect hardcoded strings
const HARDCODED_PATTERNS = [
  // String literals in JSX text content (capitalized, 4+ chars)
  /(?:>|})\s*['"]([A-Z][^'"]{3,}?)['"]\s*(?:<|{)/g,
  // Common UI prop patterns
  /(?:label|title|placeholder|description|text|message|error|warning|success|info|heading|subtitle)\s*[:=]\s*['"]([^'"]{3,}?)['"]/gi,
  // Button text
  /(?:button|btn|Button)\s*[>}]\s*['"]([^'"]{3,}?)['"]/gi,
  // Table headers
  /<th[^>]*>\s*['"]([^'"]{3,}?)['"]\s*<\/th>/gi,
  // Error/Success messages
  /(?:error|Error|ERROR|success|Success|SUCCESS|warning|Warning|WARNING)\s*[:=]\s*['"]([^'"]{3,}?)['"]/gi,
  // Alert/Toast messages
  /(?:alert|toast|notification)\s*[:=]\s*['"]([^'"]{3,}?)['"]/gi,
  // Dialog/Modal titles
  /(?:dialog|modal|Dialog|Modal)\s*[>}]\s*['"]([^'"]{3,}?)['"]/gi,
];

// Patterns to extract translation keys
const TRANSLATION_KEY_PATTERNS = [
  // t('key') or t("key")
  /t\(['"]([^'"]+)['"]\)/g,
  // getTranslation('key')
  /getTranslation\(['"]([^'"]+)['"]/g,
  // i18n.t('key')
  /i18n\.t\(['"]([^'"]+)['"]\)/g,
  // Template literals t(`key`)
  /t\(`([^`]+)`\)/g,
];

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
  /i18n-config\.ts$/, // Config file
  /scan-i18n/, // Scanning scripts
  /report\//, // Report directory
];

const EXCLUDE_STRINGS = [
  /^[a-z]+$/, // Single lowercase words
  /^\d+$/, // Numbers
  /^[A-Z_]+$/, // Constants
  /^[a-z]+\.[a-z]+$/, // dot notation (likely already translated)
  /^(id|key|value|name|type|status|className|href|src|alt|title|role|aria-)$/i, // Common prop names
  /^(px|rem|em|%|vh|vw)$/, // CSS units
  /^(true|false|null|undefined)$/, // JavaScript literals
  /^[{}[\]]+$/, // Only brackets
  /^\s*$/, // Whitespace only
];

// Common technical strings that don't need translation
const TECHNICAL_STRINGS = [
  /^(GET|POST|PUT|DELETE|PATCH)$/i,
  /^(application\/json|text\/html)$/i,
  /^(localhost|127\.0\.0\.1)$/i,
  /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i, // UUIDs
  /^#[0-9a-f]{3,6}$/i, // Hex colors
];

function shouldExcludeString(str: string): boolean {
  if (EXCLUDE_STRINGS.some((pattern) => pattern.test(str))) {
    return true;
  }
  if (TECHNICAL_STRINGS.some((pattern) => pattern.test(str))) {
    return true;
  }
  // Exclude if it contains template variables
  if (str.includes('${') || str.includes('{{')) {
    return true;
  }
  // Exclude if it's a URL
  if (/^https?:\/\//.test(str)) {
    return true;
  }
  // Exclude if it's a file path
  if (/^[./]/.test(str) || /\\/.test(str)) {
    return true;
  }
  return false;
}

function determineSeverity(str: string, context: string): 'high' | 'medium' | 'low' {
  // High severity: UI labels, buttons, error messages
  if (
    /(?:label|title|button|error|warning|success|message|heading)/i.test(context) ||
    str.length > 20
  ) {
    return 'high';
  }
  // Medium severity: descriptions, placeholders
  if (/(?:description|placeholder|help|tooltip|subtitle)/i.test(context)) {
    return 'medium';
  }
  // Low severity: everything else
  return 'low';
}

function extractTranslationKeys(content: string): string[] {
  const keys: string[] = [];
  
  TRANSLATION_KEY_PATTERNS.forEach((pattern) => {
    const matches = content.matchAll(pattern);
    for (const match of matches) {
      if (match[1]) {
        keys.push(match[1]);
      }
    }
  });
  
  return keys;
}

function scanFile(filePath: string): {
  hardcoded: HardcodedString[];
  translationKeys: TranslationKeyUsage[];
} {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');
  const hardcoded: HardcodedString[] = [];
  const translationKeys: TranslationKeyUsage[] = [];

  // Extract translation keys
  const allKeys = extractTranslationKeys(content);
  allKeys.forEach((key, index) => {
    // Find the line number for this key
    const keyPattern = new RegExp(`['"]${key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}['"]`);
    lines.forEach((line, lineIndex) => {
      if (keyPattern.test(line) && (line.includes('t(') || line.includes('getTranslation('))) {
        translationKeys.push({
          file: filePath,
          line: lineIndex + 1,
          key: key,
          context: line.trim(),
        });
      }
    });
  });

  // Find hardcoded strings
  lines.forEach((line, index) => {
    // Skip lines with translation calls
    if (line.includes("t('") || line.includes('t("') || line.includes('getTranslation(') || line.includes('i18n.t(')) {
      return;
    }

    // Skip comments
    if (line.trim().startsWith('//') || line.trim().startsWith('*') || line.trim().startsWith('/*')) {
      return;
    }

    // Check for hardcoded strings
    HARDCODED_PATTERNS.forEach((pattern) => {
      const matches = line.matchAll(pattern);
      for (const match of matches) {
        const str = match[1] || match[2] || match[0];
        if (str && str.length > 3 && !shouldExcludeString(str)) {
          hardcoded.push({
            file: filePath,
            line: index + 1,
            content: str,
            context: line.trim(),
            severity: determineSeverity(str, line),
          });
        }
      }
    });
  });

  return { hardcoded, translationKeys };
}

function loadTranslationKeys(localeFile: string): Set<string> {
  try {
    const content = fs.readFileSync(localeFile, 'utf-8');
    const translations = JSON.parse(content);
    
    // Recursively extract all keys from nested objects
    const keys = new Set<string>();
    
    function extractKeys(obj: any, prefix = ''): void {
      for (const key in obj) {
        const fullKey = prefix ? `${prefix}.${key}` : key;
        if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
          extractKeys(obj[key], fullKey);
        } else {
          keys.add(fullKey);
        }
      }
    }
    
    extractKeys(translations);
    return keys;
  } catch (error) {
    console.error(`Error loading ${localeFile}:`, error);
    return new Set();
  }
}

async function main() {
  console.log('🔍 Starting comprehensive i18n scan...\n');

  // Find all source files
  const files = await glob('src/**/*.{ts,tsx,js,jsx}', {
    ignore: EXCLUDE_PATTERNS.map((p) => p.toString().replace(/^\/|\/$/g, '')),
  });

  console.log(`📁 Scanning ${files.length} files...\n`);

  const allHardcoded: HardcodedString[] = [];
  const allTranslationKeys = new Set<string>();
  const translationKeyUsages: TranslationKeyUsage[] = [];

  // Scan all files
  for (const file of files) {
    if (EXCLUDE_PATTERNS.some((pattern) => pattern.test(file))) {
      continue;
    }

    try {
      const { hardcoded, translationKeys } = scanFile(file);
      allHardcoded.push(...hardcoded);
      translationKeys.forEach((usage) => {
        allTranslationKeys.add(usage.key);
        translationKeyUsages.push(usage);
      });
    } catch (error) {
      console.error(`Error scanning ${file}:`, error);
    }
  }

  // Load translation keys from locale files
  console.log('📚 Loading translation files...\n');
  const enKeys = loadTranslationKeys('public/locales/en/translation.json');
  const arKeys = loadTranslationKeys('public/locales/ar/translation.json');
  const frKeys = loadTranslationKeys('public/locales/fr/translation.json');

  // Find missing keys (used in code but not in translation files)
  const missingKeys = Array.from(allTranslationKeys).filter(
    (key) => !enKeys.has(key) && !arKeys.has(key) && !frKeys.has(key)
  );

  // Find unused keys (in translation files but not used in code)
  const unusedKeys = Array.from(enKeys).filter((key) => !allTranslationKeys.has(key));

  // Generate report
  const report: ScanReport = {
    scanDate: new Date().toISOString(),
    totalFilesScanned: files.length,
    hardcodedStrings: allHardcoded,
    translationKeysUsed: allTranslationKeys,
    translationKeysInFiles: enKeys,
    missingKeys: missingKeys.sort(),
    unusedKeys: unusedKeys.sort(),
    issuesBySeverity: {
      high: allHardcoded.filter((i) => i.severity === 'high').length,
      medium: allHardcoded.filter((i) => i.severity === 'medium').length,
      low: allHardcoded.filter((i) => i.severity === 'low').length,
    },
  };

  // Ensure report directory exists
  const reportDir = 'report';
  if (!fs.existsSync(reportDir)) {
    fs.mkdirSync(reportDir, { recursive: true });
  }

  // Write JSON report
  fs.writeFileSync(
    path.join(reportDir, 'i18n-comprehensive-scan.json'),
    JSON.stringify(report, null, 2)
  );

  // Write human-readable report
  const reportText = generateTextReport(report);
  fs.writeFileSync(path.join(reportDir, 'i18n-comprehensive-scan.txt'), reportText);

  // Print summary
  console.log('✅ Scan complete!\n');
  console.log('📊 Summary:');
  console.log(`   Total files scanned: ${files.length}`);
  console.log(`   Translation keys used: ${allTranslationKeys.size}`);
  console.log(`   Translation keys in files: ${enKeys.size}`);
  console.log(`   Missing keys: ${missingKeys.length}`);
  console.log(`   Unused keys: ${unusedKeys.length}`);
  console.log(`   Hardcoded strings found: ${allHardcoded.length}`);
  console.log(`     High severity: ${report.issuesBySeverity.high}`);
  console.log(`     Medium severity: ${report.issuesBySeverity.medium}`);
  console.log(`     Low severity: ${report.issuesBySeverity.low}`);
  console.log(`\n📄 Reports saved to:`);
  console.log(`   - report/i18n-comprehensive-scan.json`);
  console.log(`   - report/i18n-comprehensive-scan.txt`);

  // Print top issues
  if (missingKeys.length > 0) {
    console.log(`\n⚠️  Top 10 Missing Keys:`);
    missingKeys.slice(0, 10).forEach((key) => {
      console.log(`   - ${key}`);
    });
    if (missingKeys.length > 10) {
      console.log(`   ... and ${missingKeys.length - 10} more`);
    }
  }

  if (allHardcoded.length > 0) {
    console.log(`\n⚠️  Top 10 Hardcoded Strings (High Severity):`);
    allHardcoded
      .filter((h) => h.severity === 'high')
      .slice(0, 10)
      .forEach((h) => {
        console.log(`   ${h.file}:${h.line} - "${h.content.substring(0, 50)}"`);
      });
  }
}

function generateTextReport(report: ScanReport): string {
  let output = '='.repeat(80) + '\n';
  output += 'COMPREHENSIVE I18N SCAN REPORT\n';
  output += '='.repeat(80) + '\n\n';
  output += `Scan Date: ${report.scanDate}\n`;
  output += `Total Files Scanned: ${report.totalFilesScanned}\n\n`;

  output += '='.repeat(80) + '\n';
  output += 'SUMMARY\n';
  output += '='.repeat(80) + '\n\n';
  output += `Translation Keys Used in Code: ${report.translationKeysUsed.size}\n`;
  output += `Translation Keys in Files: ${report.translationKeysInFiles.size}\n`;
  output += `Missing Keys: ${report.missingKeys.length}\n`;
  output += `Unused Keys: ${report.unusedKeys.length}\n`;
  output += `Hardcoded Strings: ${report.hardcodedStrings.length}\n`;
  output += `  High Severity: ${report.issuesBySeverity.high}\n`;
  output += `  Medium Severity: ${report.issuesBySeverity.medium}\n`;
  output += `  Low Severity: ${report.issuesBySeverity.low}\n\n`;

  if (report.missingKeys.length > 0) {
    output += '='.repeat(80) + '\n';
    output += 'MISSING TRANSLATION KEYS\n';
    output += '='.repeat(80) + '\n\n';
    report.missingKeys.forEach((key) => {
      const usages = report.hardcodedStrings.filter((h) => h.content === key);
      output += `❌ ${key}\n`;
      if (usages.length > 0) {
        usages.forEach((usage) => {
          output += `   Found in: ${usage.file}:${usage.line}\n`;
        });
      }
      output += '\n';
    });
  }

  if (report.unusedKeys.length > 0) {
    output += '='.repeat(80) + '\n';
    output += 'UNUSED TRANSLATION KEYS\n';
    output += '='.repeat(80) + '\n\n';
    output += `Found ${report.unusedKeys.length} keys in translation files that are not used in code:\n\n`;
    report.unusedKeys.slice(0, 50).forEach((key) => {
      output += `  - ${key}\n`;
    });
    if (report.unusedKeys.length > 50) {
      output += `  ... and ${report.unusedKeys.length - 50} more\n`;
    }
    output += '\n';
  }

  if (report.hardcodedStrings.length > 0) {
    output += '='.repeat(80) + '\n';
    output += 'HARDCODED STRINGS\n';
    output += '='.repeat(80) + '\n\n';

    const bySeverity = {
      high: report.hardcodedStrings.filter((h) => h.severity === 'high'),
      medium: report.hardcodedStrings.filter((h) => h.severity === 'medium'),
      low: report.hardcodedStrings.filter((h) => h.severity === 'low'),
    };

    ['high', 'medium', 'low'].forEach((severity) => {
      if (bySeverity[severity as keyof typeof bySeverity].length > 0) {
        output += `\n${severity.toUpperCase()} SEVERITY (${bySeverity[severity as keyof typeof bySeverity].length} found):\n`;
        output += '-'.repeat(80) + '\n\n';
        bySeverity[severity as keyof typeof bySeverity].forEach((h) => {
          output += `File: ${h.file}:${h.line}\n`;
          output += `Content: "${h.content}"\n`;
          output += `Context: ${h.context}\n`;
          output += '\n';
        });
      }
    });
  }

  return output;
}

main().catch(console.error);

