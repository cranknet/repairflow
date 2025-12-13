---
description: How to manage translations (i18n) in RepairFlow
---

# i18n Workflow

RepairFlow uses a unified i18n system to manage translations across English, French, and Arabic.
All locale files are kept in sync automatically.

## Commands

| Command | Description |
|---------|-------------|
| `npm run i18n` | Full pipeline: sync + translate + check |
| `npm run i18n:sync` | Sync all locale files (add missing, remove extra keys) |
| `npm run i18n:translate` | Translate all `[TRANSLATE]` markers via LibreTranslate API |
| `npm run i18n:check` | Check for issues (used in CI) |
| `npm run i18n:report` | Generate a detailed status report |

## Quick Start

### 1. After adding new translation keys

If you added new `t('key')` calls in code, run:

```bash
npm run i18n:sync
```

This will:
- Add any missing keys to French and Arabic files
- Mark them with `[TRANSLATE]` for later translation
- Remove any extra keys not in English (cleanup)

### 2. To translate marked entries

```bash
npm run i18n:translate
```

This uses the free LibreTranslate API. If rate-limited, retry later.

### 3. Before committing

```bash
npm run i18n:check
```

This is the same check that runs in CI. It verifies:
- All locales have identical keys
- Reports untranslated entries

## CI Integration

The GitHub CI workflow uses `npm run i18n:check` to verify translations.
This is non-blocking (`continue-on-error: true`) but will show warnings.

## File Structure

```
public/locales/
├── en/translation.json  (source of truth)
├── fr/translation.json
└── ar/translation.json
```

English is always the source of truth. Other locales must match its keys exactly.
