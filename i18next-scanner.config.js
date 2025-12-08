/**
 * i18next-scanner configuration
 * 
 * This configuration scans source files for translation keys and updates locale files.
 * 
 * Usage:
 *   npm run i18n:scan
 * 
 * Features:
 * - Scans .ts, .tsx, .js, .jsx files in src/
 * - Detects t('key'), t("key"), and t(`key`) patterns
 * - Updates public/locales/{lang}/translation.json files
 * - Preserves existing translations
 * - Marks new keys for translation
 */

const path = require('path');
const fs = require('fs');

module.exports = {
    input: [
        'src/**/*.{ts,tsx,js,jsx}',
        // Exclude test files
        '!src/**/*.test.{ts,tsx,js,jsx}',
        '!src/**/*.spec.{ts,tsx,js,jsx}',
        '!**/node_modules/**',
    ],

    output: './',

    options: {
        debug: false, // Reduce noise
        removeUnusedKeys: false, // Don't remove unused keys automatically
        sort: true,

        // Function names to look for
        func: {
            list: ['t', 'i18next.t', 'i18n.t'],
            extensions: ['.ts', '.tsx', '.js', '.jsx'],
        },

        // Disable Trans component parsing (we don't use it and it causes TypeScript parsing errors)
        trans: false,

        // Languages to generate
        lngs: ['en', 'ar', 'fr'],

        // Namespace configuration
        ns: ['translation'],
        defaultLng: 'en',
        defaultNs: 'translation',
        defaultValue: function (lng, ns, key) {
            // For English, use the key as a placeholder
            if (lng === 'en') {
                return key;
            }
            // For other languages, mark as needing translation
            return `[TODO_TRANSLATE] ${key}`;
        },

        // Resource configuration
        resource: {
            loadPath: 'public/locales/{{lng}}/{{ns}}.json',
            savePath: 'public/locales/{{lng}}/{{ns}}.json',
            jsonIndent: 2,
            lineEnding: '\n',
        },

        // Key separator (use dot notation)
        nsSeparator: false, // Disable namespace separator in keys
        keySeparator: false, // Keep flat key structure (e.g., 'install.step.welcome')

        // Interpolation settings (match i18next config)
        interpolation: {
            prefix: '{{',
            suffix: '}}',
        },
    },

    // Transform function using regex-based extraction (TypeScript compatible)
    transform: function customTransform(file, enc, done) {
        const parser = this.parser;
        let content;

        try {
            content = fs.readFileSync(file.path, enc);
        } catch (err) {
            console.error(`Error reading file: ${file.path}`, err);
            done();
            return;
        }

        // Regex patterns to extract translation keys
        const patterns = [
            // t('key') or t("key") - single/double quotes
            /(?<![a-zA-Z])t\(\s*['"]([^'"]+)['"]\s*(?:,|\))/g,
            // t(`key`) - template literal without variables
            /(?<![a-zA-Z])t\(\s*`([^`$]+)`\s*(?:,|\))/g,
        ];

        const extractedKeys = new Set();

        patterns.forEach(pattern => {
            let match;
            while ((match = pattern.exec(content)) !== null) {
                const key = match[1];
                if (key && key.trim()) {
                    extractedKeys.add(key.trim());
                }
            }
        });

        // Add all extracted keys to the parser
        extractedKeys.forEach(key => {
            parser.set(key);
        });

        done();
    },
};
