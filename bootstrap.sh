#!/bin/bash
# bootstrap.sh — وضعیت واقعی در docs/STATUS.md
# bash bootstrap.sh           # quick (بدون تست) — ۱۰ ثانیه
# bash bootstrap.sh --full    # + تست کامل — ۵ دقیقه

cd ~/Bird-new 2>/dev/null || { echo "❌ ~/Bird-new پیدا نشد"; exit 1; }

RUN_TESTS=0
[ "$1" = "--full" ] && RUN_TESTS=1

echo "⏳ در حال بررسی..."

GIT_HEAD_SHORT=$(git rev-parse --short HEAD 2>/dev/null || echo "unknown")
GIT_LOG=$(git log --oneline -3 2>/dev/null || echo "(no git)")
GIT_TREE=$(git status --short 2>/dev/null)
[ -z "$GIT_TREE" ] && GIT_TREE="(clean ✅)"

TSC_ERR=$(npx tsc --noEmit 2>&1 | grep -c "error TS" || true)
TSC_ERR=${TSC_ERR:-0}

AS_ANY_TRA=$(grep -c "as any" src/mod/tra/store.ts 2>/dev/null || echo 0)
AS_ANY_DLG=$(grep -rc "as any" src/mod/dlg/ 2>/dev/null | awk -F: '{s+=$2} END {print s+0}')
AS_ANY_DLG=${AS_ANY_DLG:-0}

if [ "$RUN_TESTS" = "1" ]; then
  echo "⏳ تست کامل (۵ دقیقه)..."
  TEST_OUT=$(npx vitest run 2>&1 | tail -3)
else
  TEST_OUT="(skip — اجرا با --full)"
fi

mkdir -p docs

tee docs/STATUS.md > /dev/null << STATUSEOF
# 📊 STATUS — auto-generated

> **این فایل دستی نوشته نمی‌شود — bootstrap.sh می‌سازد.**
> تاریخ: $(date -u +%FT%TZ)

## HEAD
\`\`\`
$GIT_LOG
\`\`\`
**short: $GIT_HEAD_SHORT**

## tsc errors: **$TSC_ERR** $([ "$TSC_ERR" = "0" ] && echo "✅" || echo "⚠️")

## Working tree
\`\`\`
$GIT_TREE
\`\`\`

## Tests
\`\`\`
$TEST_OUT
\`\`\`

## L5 ratchet (as any)
- \`tra/store.ts\`: **$AS_ANY_TRA**
- \`dlg/\`: **$AS_ANY_DLG**
STATUSEOF

echo ""
echo "✅ docs/STATUS.md به‌روز شد"
echo ""
echo "📖 حالا این را بخوان:"
echo "   cat HANDOFF-CURRENT.md"
echo "   cat docs/STATUS.md"
