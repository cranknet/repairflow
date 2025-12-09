#!/usr/bin/env tsx
/**
 * i18n Check Script
 * 
 * Runs during pre-commit or CI to ensure:
 * 1. No new hardcoded strings are introduced
 * 2. All used translation keys exist in locale files
 * 
 * Exit codes:
 * - 0: All checks passed
 * - 1: Issues found (blocks commit/build)
 */

import * as fs from 'fs';
import * as path from 'path';
import { glob } from 'glob';

interface Issue {
  file: string;
  line: number;
  type: 'hardcoded' | 'missing_key';
  content: string;
}

// Patterns to detect hardcoded strings in JSX
const HARDCODED_PATTERNS = [
  // Common UI prop patterns with hardcoded strings
  /(?:label|title|placeholder|description|error|message)\s*[:=]\s*['"]([A-Z][^'"]{10,}?)['"]/gi,
];

// Pattern to extract translation keys
const TRANSLATION_KEY_PATTERN = /t\(['"]([^'"]+)['"]\)/g;

const EXCLUDE_PATTERNS = [
  /node_modules/,
  /\.next/,
  /\.git/,
  /\.test\./,
  /\.spec\./,
  /i18n\.ts$/,
  /i18n-config\.ts$/,
  /scripts\//,
];

function loadTranslationKeys(): Set<string> {
  try {
    const enPath = path.join(process.cwd(), 'public/locales/en/translation.json');
    const content = fs.readFileSync(enPath, 'utf-8');
    const translations = JSON.parse(content);
    return new Set(Object.keys(translations));
  } catch {
    console.error('❌ Could not load translation file');
    process.exit(1);
  }
}

function extractUsedKeys(content: string): string[] {
  const keys: string[] = [];
  const matches = content.matchAll(TRANSLATION_KEY_PATTERN);
  for (const match of matches) {
    if (match[1]) keys.push(match[1]);
  }
  return keys;
}

function checkFile(filePath: string, existingKeys: Set<string>): Issue[] {
  const issues: Issue[] = [];
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');

  lines.forEach((line, index) => {
    // Skip lines that already use translation
    if (line.includes("t('") || line.includes('t("') || line.includes('getTranslation(')) {
      return;
    }

    // Check for hardcoded strings (only high severity)
    HARDCODED_PATTERNS.forEach((pattern) => {
      const matches = line.matchAll(pattern);
      for (const match of matches) {
        const str = match[1];
        if (str && str.length > 10 && /[A-Z]/.test(str[0])) {
          issues.push({
            file: filePath,
            line: index + 1,
            type: 'hardcoded',
            content: str.substring(0, 50),
          });
        }
      }
    });
  });

  // Check for missing keys
  const usedKeys = extractUsedKeys(content);
  usedKeys.forEach((key) => {
    // Skip dynamic keys and error keys (they use dot notation)
    if (key.includes('${') || key.includes('{')) return;
    
    if (!existingKeys.has(key)) {
      const lineNum = lines.findIndex((l) => l.includes(`'${key}'`) || l.includes(`"${key}"`));
      issues.push({
        file: filePath,
        line: lineNum + 1,
        type: 'missing_key',
        content: key,
      });
    }
  });

  return issues;
}

async function main() {
  const args = process.argv.slice(2);
  const strictMode = args.includes('--strict');
  const ciMode = args.includes('--ci');

  console.log('🔍 Running i18n check...\n');

  const existingKeys = loadTranslationKeys();
  console.log(`📚 Loaded ${existingKeys.size} translation keys\n`);

  const files = await glob('src/**/*.{ts,tsx}', {
    ignore: ['**/node_modules/**', '**/.next/**'],
  });

  let allIssues: Issue[] = [];

  for (const file of files) {
    if (EXCLUDE_PATTERNS.some((p) => p.test(file))) continue;
    
    const issues = checkFile(file, existingKeys);
    allIssues.push(...issues);
  }

  // Filter to unique issues
  const uniqueIssues = allIssues.filter((issue, index, self) =>
    index === self.findIndex((i) => 
      i.file === issue.file && i.line === issue.line && i.content === issue.content
    )
  );

  const hardcoded = uniqueIssues.filter((i) => i.type === 'hardcoded');
  const missingKeys = uniqueIssues.filter((i) => i.type === 'missing_key');

  if (hardcoded.length > 0) {
    console.log(`⚠️  Found ${hardcoded.length} potential hardcoded strings:\n`);
    hardcoded.slice(0, 10).forEach((issue) => {
      console.log(`   ${issue.file}:${issue.line}`);
      console.log(`   → "${issue.content}..."\n`);
    });
    if (hardcoded.length > 10) {
      console.log(`   ... and ${hardcoded.length - 10} more\n`);
    }
  }

  if (missingKeys.length > 0) {
    console.log(`❌ Found ${missingKeys.length} missing translation keys:\n`);
    missingKeys.forEach((issue) => {
      console.log(`   ${issue.file}:${issue.line}`);
      console.log(`   → Key: "${issue.content}"\n`);
    });
  }

  // Determine exit code
  if (missingKeys.length > 0) {
    console.log('\n❌ i18n check FAILED - Missing translation keys must be added');
    process.exit(1);
  }

  if (strictMode && hardcoded.length > 0) {
    console.log('\n❌ i18n check FAILED (strict mode) - Hardcoded strings found');
    process.exit(1);
  }

  if (hardcoded.length > 0) {
    console.log('\n⚠️  i18n check passed with warnings');
    console.log('   Run with --strict to fail on hardcoded strings');
  } else {
    console.log('\n✅ i18n check passed!');
  }

  process.exit(0);
}

main().catch((error) => {
  console.error('Error running i18n check:', error);
  process.exit(1);
});

