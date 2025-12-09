#!/usr/bin/env ts-node
/**
 * Generate a clean summary of i18n issues, filtering out false positives
 */

import * as fs from 'fs';
import * as path from 'path';

interface ScanReport {
  scanDate: string;
  totalFilesScanned: number;
  hardcodedStrings: Array<{
    file: string;
    line: number;
    content: string;
    context: string;
    severity: string;
  }>;
  missingKeys: string[];
}

// Filter out false positives
function isValidIssue(content: string, context: string): boolean {
  // Skip single characters, numbers, paths, etc.
  if (content.length < 3) return false;
  if (/^\d+$/.test(content)) return false;
  if (/^[^a-zA-Z]+$/.test(content)) return false; // Only punctuation/symbols
  if (/^[./]/.test(content) || /\\/.test(content)) return false; // Paths
  if (/^https?:\/\//.test(content)) return false; // URLs
  if (/^[A-Z_]+$/.test(content) && content.length < 5) return false; // Short constants
  if (/^(id|key|value|name|type|status|className|href|src|alt|title)$/i.test(content)) return false;
  if (content.includes('${') || content.includes('{{')) return false; // Template strings
  
  // Must contain at least one letter
  if (!/[a-zA-Z]/.test(content)) return false;
  
  return true;
}

function isValidMissingKey(key: string): boolean {
  // Filter out obvious false positives
  if (key.length < 2) return false;
  if (/^[^a-zA-Z]+$/.test(key)) return false;
  if (/^[./]/.test(key) || /\\/.test(key)) return false;
  if (/^\d+$/.test(key)) return false;
  if (/^(true|false|null|undefined)$/.test(key)) return false;
  if (/^[a-z]+\.[a-z]+$/.test(key) && key.length < 10) return false; // Short dot notation
  
  return true;
}

async function main() {
  const reportPath = 'report/i18n-comprehensive-scan.json';
  
  if (!fs.existsSync(reportPath)) {
    console.error('❌ Report file not found. Please run the scan first:');
    console.error('   npx tsx scripts/scan-i18n-comprehensive.ts');
    process.exit(1);
  }

  const report: ScanReport = JSON.parse(fs.readFileSync(reportPath, 'utf-8'));

  // Filter hardcoded strings
  const validHardcoded = report.hardcodedStrings.filter((h) => 
    isValidIssue(h.content, h.context)
  );

  // Filter missing keys
  const validMissingKeys = report.missingKeys.filter(isValidMissingKey);

  // Group by file
  const byFile = new Map<string, typeof validHardcoded>();
  validHardcoded.forEach((h) => {
    if (!byFile.has(h.file)) {
      byFile.set(h.file, []);
    }
    byFile.get(h.file)!.push(h);
  });

  // Generate summary
  let summary = '='.repeat(80) + '\n';
  summary += 'I18N ISSUES SUMMARY (Filtered)\n';
  summary += '='.repeat(80) + '\n\n';
  summary += `Scan Date: ${report.scanDate}\n`;
  summary += `Total Files Scanned: ${report.totalFilesScanned}\n\n`;

  summary += '='.repeat(80) + '\n';
  summary += 'CRITICAL ISSUES\n';
  summary += '='.repeat(80) + '\n\n';

  summary += `Hardcoded Strings (High Priority): ${validHardcoded.filter(h => h.severity === 'high').length}\n`;
  summary += `Missing Translation Keys: ${validMissingKeys.length}\n\n`;

  // Top missing keys
  if (validMissingKeys.length > 0) {
    summary += 'TOP MISSING KEYS:\n';
    summary += '-'.repeat(80) + '\n';
    validMissingKeys.slice(0, 20).forEach((key) => {
      summary += `  ❌ ${key}\n`;
    });
    if (validMissingKeys.length > 20) {
      summary += `  ... and ${validMissingKeys.length - 20} more\n`;
    }
    summary += '\n';
  }

  // Files with most issues
  const filesByCount = Array.from(byFile.entries())
    .sort((a, b) => b[1].length - a[1].length)
    .slice(0, 20);

  summary += '='.repeat(80) + '\n';
  summary += 'FILES WITH MOST HARDCODED STRINGS\n';
  summary += '='.repeat(80) + '\n\n';

  filesByCount.forEach(([file, issues]) => {
    const highSeverity = issues.filter((i) => i.severity === 'high').length;
    summary += `${file} (${issues.length} total, ${highSeverity} high)\n`;
  });
  summary += '\n';

  // Detailed issues by file
  summary += '='.repeat(80) + '\n';
  summary += 'DETAILED ISSUES BY FILE\n';
  summary += '='.repeat(80) + '\n\n';

  filesByCount.slice(0, 10).forEach(([file, issues]) => {
    summary += `\n📄 ${file}\n`;
    summary += '-'.repeat(80) + '\n';
    
    const highIssues = issues.filter((i) => i.severity === 'high').slice(0, 10);
    highIssues.forEach((issue) => {
      summary += `  Line ${issue.line}: "${issue.content}"\n`;
      summary += `    Context: ${issue.context.substring(0, 70)}...\n`;
    });
    
    if (issues.length > 10) {
      summary += `  ... and ${issues.length - 10} more issues\n`;
    }
    summary += '\n';
  });

  // Write summary
  const summaryPath = 'report/i18n-summary.txt';
  fs.writeFileSync(summaryPath, summary);

  console.log('✅ Summary generated!');
  console.log(`📄 Saved to: ${summaryPath}\n`);
  console.log('📊 Quick Stats:');
  console.log(`   Valid hardcoded strings: ${validHardcoded.length}`);
  console.log(`   High severity: ${validHardcoded.filter(h => h.severity === 'high').length}`);
  console.log(`   Valid missing keys: ${validMissingKeys.length}`);
  console.log(`   Files with issues: ${byFile.size}`);
}

main().catch(console.error);

