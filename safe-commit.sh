#!/bin/bash
cd ~/Bird-new || exit 1

echo "🔍 بررسی TypeScript..."
npx tsc --noEmit
if [ $? -ne 0 ]; then
  echo "❌ خطای تایپ‌اسکریپت! بازگردانی تغییرات..."
  git restore .
  git clean -fd src/
  exit 1
fi

echo "✅ تایپ‌اسکریپت پاس شد. ثبت و ارسال..."
git add .
git commit -m "${1:-auto: safe commit}"
COMMIT_STATUS=$?

if [ $COMMIT_STATUS -ne 0 ]; then
  # اگر commit شکست خورد (مثلاً working tree پاک بود)
  if git diff --quiet && git diff --cached --quiet; then
    echo "ℹ️  تغییری برای commit نیست. همه‌چیز از قبل ثبت شده."
    exit 0
  fi
  echo "❌ خطای commit! بررسی کنید."
  exit 1
fi

echo "📤 ارسال به origin..."
git push
PUSH_STATUS=$?

if [ $PUSH_STATUS -ne 0 ]; then
  echo "❌ خطای push! کامیت محلی انجام شد ولی به origin ارسال نشد."
  echo "   لطفاً یک‌بار دیگر دستی بررسی کنید: git push"
  exit 1
fi

echo "🚀 با موفقیت انجام شد (commit + push)."
