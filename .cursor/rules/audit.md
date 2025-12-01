When the user invokes @audit or an automated pipeline runs this command:

- Always analyze staged + unstaged diffs.
- Detect hardcoded user-facing strings and classify priority.
- Detect changes that affect docs (APIs, workflows, flags, translations, user flows).
- Detect changes that affect notifications (email/push/sms/in-app) and whether templates need updates.
- Produce the report in the exact REPORT block format from the command prompt. No extra commentary.
- If HIGH priority issues exist, ensure at least one suggested commit with staging commands is included in SUGGESTED_COMMITS.
- Do not auto-run git commands (this command only suggests).
