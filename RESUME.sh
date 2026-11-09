#!/bin/bash
cd "$(dirname "$0")" || exit 1
echo "# === RESUME $(date -u +%Y-%m-%dT%H:%MZ) ==="
echo "## HEAD"
git log -1 --pretty='%h — %s (%cr)'
echo "## Branch: $(git rev-parse --abbrev-ref HEAD)"
echo "## Working tree"
git status --short
echo "## ۱۵ کامیت آخر"
git log --oneline -15
echo "## NOW.md"
cat NOW.md 2>/dev/null || echo "(نیست)"
echo "## IDEAS.md"
cat IDEAS.md 2>/dev/null || echo "(نیست)"
echo "## tsc (max 20s)"
timeout 20 npx tsc --noEmit 2>&1 | tail -3 || echo "(skip)"
echo "## tests (max 20s)"
timeout 20 npx vitest run 2>&1 | tail -3 || echo "(skip)"
