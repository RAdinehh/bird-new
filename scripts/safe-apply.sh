#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."

LABEL="${1:-manual}"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="$HOME/Bird-new-backups"
mkdir -p "$BACKUP_DIR"

echo "🛡️  بکاپ قبل از تغییر: $LABEL"

# tag گیت (اگر قبلاً نبود)
TAG="pre-${LABEL}-${TIMESTAMP}"
if git rev-parse "$TAG" >/dev/null 2>&1; then
  echo "⚠️  tag $TAG از قبل هست"
else
  git tag "$TAG"
  echo "✅ tag: $TAG"
fi

# بکاپ فایل‌های کلیدی
for f in src/mod/whs/store.ts src/mod/tra/types.ts src/mod/tra/DealsPage.tsx PROGRESS.md; do
  if [ -f "$f" ]; then
    base=$(basename "$f")
    cp "$f" "$BACKUP_DIR/${base%.*}-${TIMESTAMP}.${base##*.}" 2>/dev/null || true
  fi
done
echo "✅ فایل‌ها در: $BACKUP_DIR"

# بکاپ دیتابیس localStorage (اگر جدا از مرورگر قابل دسترسی بود — فعلاً skip)
echo "💡 برای restore: git reset --hard $TAG"
echo "🎯 آماده برای اجرای پچ."
