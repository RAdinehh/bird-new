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
echo "## MASTER-ROADMAP (نقشه راه)"
if [ -f docs/MASTER-ROADMAP.md ]; then
  echo "--- اولین قدم (اولین کار انجام‌نشده) ---"
  grep -m 1 "^\- \[ \]" docs/MASTER-ROADMAP.md 2>/dev/null || echo "(همه کارها تمومه)"
  echo "--- تعداد کارهای باقی‌مونده ---"
  grep -c "^\- \[ \]" docs/MASTER-ROADMAP.md 2>/dev/null || echo "0"
else
  echo "(MASTER-ROADMAP نیست)"
fi
echo "## tsc (max 20s)"
timeout 20 npx tsc --noEmit 2>&1 | tail -3 || echo "(skip)"
echo "## قوانین AGENTS (خلاصه)"
grep -E "^### قانون|^## 🆕" AGENTS.md 2>/dev/null | head -30
echo "## تست Correction (15 تست، ~5s)"
timeout 15 npx vitest run \
  src/test/dlg-corrections.test.ts \
  src/test/dlg-applyCorrections-recompute.test.ts \
  src/test/dlg-store-corrections.test.ts 2>&1 \
  | grep -E "Tests |Test Files" | tail -2 \
  || echo "(timeout/خطا)"
