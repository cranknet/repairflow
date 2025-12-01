When the user invokes @auto-split-commit or asks for 'auto split':

- Analyze the diff (staged + unstaged).
- Create focused commit groups by intent (feature, fix, docs, i18n, tests, ci, style).
- Produce 2–6 commits by default; deviate only if diff size/semantics require.
- For each group output only the exact COMMIT block format described by the command prompt.
- If a group contains mixed hunks inside the same file, mark COMMIT_FILES as 'mixed-hunks: <file,...>' and include `git add -p <file>` in STAGING_COMMANDS.
- If translations or docs are affected, include explicit note in COMMIT_BODY.
- Do not output anything outside the defined blocks and final summary.
