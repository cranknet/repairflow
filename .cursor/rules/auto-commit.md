When I ask you to commit changes, do the following:

1. Analyze the full diff of all modified files.
2. Identify:
   - What changed
   - Why it changed (inferred from context)
   - Which part of the app or feature it belongs to
   - Any side effects (API, UI, workflow, translations, docs updates)

3. Generate a clear and conventional commit message using this structure:

<type>(<scope>): <short summary>

Detailed explanation:
- What was changed and why
- Key files touched
- Important logic/UI/backend updates
- Notes about required documentation or translation updates

4. Use these allowed types:
feat, fix, refactor, docs, test, chore, style, perf, ci

5. The message must be specific, not generic. No vague phrases like “updates,” “changes,” or “misc fixes.”

6. If the change affects:
- workflows
- statuses
- backend checks
- translations files
- modal texts
- docs

→ Then add: "Requires docs update" or "Requires translation update" in the body.

7. Output ONLY the commit message. No explanation, no filler, no suggestions.

8. After generating the commit message, execute the Git commit with the message.
