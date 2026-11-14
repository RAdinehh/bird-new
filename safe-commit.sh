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
git push
echo "🚀 با موفقیت انجام شد."
