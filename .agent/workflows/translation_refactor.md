---
description: Automate translation refactor to replace hardcoded strings with i18n keys
---

# Translation Refactor Workflow

This workflow automates the process of extracting hard‑coded strings, generating i18n keys, updating locale JSON files, and replacing the strings in the source code with the appropriate translation helper.

## Prerequisites
- Ensure the project uses the `next-i18next` (or similar) i18n setup with locale files under `public/locales/{lang}/translation.json`.
- Install the required CLI tool for extraction (e.g., `i18next-scanner`).
- Have a backup or version control ready.

## Steps
1. **Install i18n extraction tool**
   ```bash
   npm install --save-dev i18next-scanner
   ```
   // turbo
2. **Run the scanner to extract strings**
   ```bash
   npx i18next-scanner "src/**/*.tsx" "src/**/*.ts" -o public/locales/{{lng}}/translation.json
   ```
   // turbo
3. **Generate missing keys**
   - Review the generated JSON files for new keys.
   - Manually add any missing keys that the scanner could not infer (e.g., dynamic messages).
4. **Replace hard‑coded strings in source files**
   - Use a codemod script (e.g., `jscodeshift`) to replace literals with `t('key')`.
   ```bash
   npx jscodeshift -t scripts/replace-hardcoded-strings.js src/**/*.tsx src/**/*.ts
   ```
   // turbo
5. **Run lint and type‑check**
   ```bash
   npm run lint && npm run type-check
   ```
   // turbo
6. **Commit changes**
   - Stage all modified files.
   - Commit with a descriptive message.
   ```bash
   git add . && git commit -m "refactor: replace hardcoded strings with i18n keys"
   ```
   // turbo
7. **Verify in the app**
   - Start the dev server and ensure UI text appears correctly in all supported languages.
   ```bash
   npm run dev
   ```
   // turbo

**Note**: Adjust the script paths and locale directory structure if your project differs.
