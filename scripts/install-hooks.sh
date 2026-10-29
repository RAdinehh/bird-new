#!/usr/bin/env bash
set -e
cd "$(dirname "$0")/.."

# pre-commit → fast-check
cat > .git/hooks/pre-commit <<'HOOK'
#!/usr/bin/env bash
bash scripts/fast-check.sh
HOOK
chmod +x .git/hooks/pre-commit
echo "✅ .git/hooks/pre-commit → fast-check (tsc only)"

# pre-push → full-check
cat > .git/hooks/pre-push <<'HOOK'
#!/usr/bin/env bash
bash scripts/full-check.sh
HOOK
chmod +x .git/hooks/pre-push
echo "✅ .git/hooks/pre-push → full-check (tsc + tests)"

echo "🎯 hooks نصب شدند. git commit سریع، git push کامل."
