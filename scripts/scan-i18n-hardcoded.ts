#!/usr/bin/env ts-node
/**
 * Comprehensive i18n scanning script
 * Scans all source files for hardcoded user-facing strings
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

const HARDCODED_PATTERNS = [
  // String literals in JSX
  /(['"])([A-Z][^'"]{3,}?)\1/g,
  // Common UI patterns
  /(?:label|title|placeholder|description|text|message|error|warning|success|info)\s*[:=]\s*['"]([^'"]{3,}?)['"]/gi,
  // Button text
  /(?:button|btn)\s*[>}]\s*['"]([^'"]{3,}?)['"]/gi,
  // Table headers
  /<th[^>]*>\s*['"]([^'"]{3,}?)['"]\s*<\/th>/gi,
  // Error messages
  /(?:error|Error|ERROR)\s*[:=]\s*['"]([^'"]{3,}?)['"]/gi,
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
];

const EXCLUDE_STRINGS = [
  /^[a-z]+$/, // Single lowercase words
  /^\d+$/, // Numbers
  /^[A-Z_]+$/, // Constants
  /^[a-z]+\.[a-z]+$/, // dot notation (likely already translated)
  /^(id|key|value|name|type|status)$/i, // Common prop names
  /^(className|href|src|alt|title)$/i, // HTML attributes
];

async function scanFile(filePath: string): Promise<HardcodedString[]> {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');
  const issues: HardcodedString[] = [];

  lines.forEach((line, index) => {
    // Skip lines with translation calls
    if (line.includes("t('") || line.includes('t("') || line.includes('getTranslation(')) {
      return;
    }

    // Check for hardcoded strings
    HARDCODED_PATTERNS.forEach((pattern) => {
      const matches = line.matchAll(pattern);
      for (const match of matches) {
        const str = match[1] || match[2] || match[0];
        if (str && str.length > 3) {
          // Check if it should be excluded
          const shouldExclude = EXCLUDE_STRINGS.some((pattern) => pattern.test(str));
          if (!shouldExclude && !str.includes('${') && !str.includes('{')) {
            issues.push({
              file: filePath,
              line: index + 1,
              content: str,
              context: line.trim(),
              severity: determineSeverity(str, line),
            });
          }
        }
      }
    });
  });

  return issues;
}

function determineSeverity(str: string, context: string): 'high' | 'medium' | 'low' {
  // High severity: UI labels, buttons, error messages
  if (
    /(?:label|title|button|error|warning|success|message)/i.test(context) ||
    str.length > 20
  ) {
    return 'high';
  }
  // Medium severity: descriptions, placeholders
  if (/(?:description|placeholder|help|tooltip)/i.test(context)) {
    return 'medium';
  }
  // Low severity: everything else
  return 'low';
}

async function main() {
  const files = await glob('src/**/*.{ts,tsx,js,jsx}', {
    ignore: EXCLUDE_PATTERNS.map((p) => p.toString().replace(/^\/|\/$/g, '')),
  });

  console.log(`Scanning ${files.length} files...`);

  const allIssues: HardcodedString[] = [];

  for (const file of files) {
    if (EXCLUDE_PATTERNS.some((pattern) => pattern.test(file))) {
      continue;
    }

    try {
      const issues = await scanFile(file);
      allIssues.push(...issues);
    } catch (error) {
      console.error(`Error scanning ${file}:`, error);
    }
  }

  // Write report
  const report = {
    scanDate: new Date().toISOString(),
    totalFilesScanned: files.length,
    totalIssuesFound: allIssues.length,
    issuesBySeverity: {
      high: allIssues.filter((i) => i.severity === 'high').length,
      medium: allIssues.filter((i) => i.severity === 'medium').length,
      low: allIssues.filter((i) => i.severity === 'low').length,
    },
    issues: allIssues,
  };

  fs.writeFileSync(
    'report/i18n-hardcoded-scan.json',
    JSON.stringify(report, null, 2)
  );

  console.log(`\nScan complete!`);
  console.log(`Total issues found: ${allIssues.length}`);
  console.log(`High severity: ${report.issuesBySeverity.high}`);
  console.log(`Medium severity: ${report.issuesBySeverity.medium}`);
  console.log(`Low severity: ${report.issuesBySeverity.low}`);
  console.log(`\nReport saved to report/i18n-hardcoded-scan.json`);
}

main().catch(console.error);

