#!/bin/bash
# Setup Git hooks for i18n auto-fix
# Run: bash scripts/setup-hooks.sh

HOOKS_DIR=".git/hooks"
PRE_COMMIT_HOOK="$HOOKS_DIR/pre-commit"

# Create hooks directory if it doesn't exist
mkdir -p "$HOOKS_DIR"

# Create pre-commit hook
cat > "$PRE_COMMIT_HOOK" << 'EOF'
#!/bin/bash
# Pre-commit hook for i18n auto-fix
# Automatically adds missing translation keys before commit

echo "🔍 Running i18n auto-fix..."

# Run i18n auto-fix (adds missing keys automatically)
npm run i18n:fix:auto

# Check if locale files were modified
if git diff --name-only public/locales/ | grep -q .; then
    echo ""
    echo "📝 Translation files updated! Adding to commit..."
    git add public/locales/en/translation.json
    git add public/locales/ar/translation.json
    git add public/locales/fr/translation.json
    echo "✅ Translation files staged"
fi

echo ""
echo "✅ i18n pre-commit completed!"
exit 0
EOF

# Make hook executable
chmod +x "$PRE_COMMIT_HOOK"

echo "✅ Git hooks installed successfully!"
echo ""
echo "The pre-commit hook will now:"
echo "  1. Scan for missing translation keys"
echo "  2. Auto-add them to all locale files"
echo "  3. Stage the updated locale files"
echo ""
echo "To skip the hook temporarily, use: git commit --no-verify"

