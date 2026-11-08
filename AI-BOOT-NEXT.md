# AI-BOOT-NEXT.md - راهنمای AI بعدی

آخرین به‌روزرسانی: 1405/08/18
آخرین commit: 04bfefdc

## 0. شروع

cd ~/Bird-new
bash bootstrap.sh
cat docs/STATUS.md
git --no-pager log --oneline -10
git status --short
npx tsc --noEmit 2>&1 | tail -3

## 1. این پروژه چیست

Bird-new = نرم‌افزار مدیریت مرغداری (PWA فارسی، RTL، آفلاین). 17 ماژول. React + TypeScript + Vite + Zustand + Vitest.

مسیر: ~/Bird-new | اجرا: npm run dev

## 2. کجاییم

DONE:
- C1 (data layer): DailyLogCorrection + applyCorrections
- C2 (actions): addCorrection + revokeCorrection
- C3-a (LogCard display): badge + تاریخچه + revoke
- C3-b (CorrectionModal): modal جدا
- C3-fix: propagation به dashboard + گزارش‌ها (6 commit)

PENDING:
1. B3 - ویرایش لاگ با Correction
2. L1-L3 - بسط CorrectionModal
3. تناقض C3 (inline vs modal)
4. C4 - DailyLogHistoryModal

## 3. قوانین آهنین

- L1 state فقط از store
- L2 Event Bus برای side-effect
- L4 showAlert ممنوع -> toastMsg
- L5 any جدید ممنوع
- L6 catch خالی ممنوع
- L7 فایل > 500 خط = خطر
- L9 import بین ماژول‌ها فقط از store
- L10 کامپوننت‌های قفل‌شده: ui/Modal, ui/Field, ui/Input, ui/Btn, ui/BtnRow, ui/ExpandableCard, ui/ErrorBox, toastMsg, showConfirmAsync
- L11 هر store action = یک تست
- L12 هر تصمیم -> docs/DECISIONS.md
- L13 اول بگرد، بعد بساز
- L14 autoClamp حین تایپ ممنوع
- AGENTS >5 فایل در یک concept = نقض
- AGENTS commit بدون PROGRESS = ممنوع
- CLAUDE patch بدون grep + sed + backup = ممنوع

## 4. الگوهای مرجع

- Modal: flk/components/SexingModal.tsx
- CorrectionModal: dlg/components/CorrectionModal.tsx
- Tabs: flk/components/FlocksTabs.tsx
- Atomic save: dlg/hooks/useDlgSave.ts
- Event Bus: cor/outbox/processors.ts
- History+aggregate: flk/components/FlockHistoryModal.tsx (C4 از این کپی می‌کند)
- Calc engine: shr/calc/ (22 فایل)

## 5. پایپ‌لاین dlg

Form (F) -> buildLogData -> DailyLog
- temperature = (min+max)/2 (مشتق)
- humidity = (min+max)/2 (مشتق)
- feedConsumed = calculateFeedMetrics() (مشتق پیچیده)
- deathsCount = sum(deaths) (مشتق)
- birdAgeDays = getBirdAgeAt() (مشتق)

Correction روی فیلد پایه.
applyCorrections recompute مشتق‌ها.

## 6. تست‌های همیشه پاس

npx vitest run src/test/dlg-corrections.test.ts src/test/dlg-applyCorrections-recompute.test.ts src/test/dlg-store-corrections.test.ts

## 7. تله‌ها

- T-C1: قبل از patch روی applyCorrections، همه تست‌های موجود
- T-C2: فیلد مشتق - همیشه applyCorrections(log)
- T-C3: مشتق‌ها: temperature, humidity, feedConsumed, deathsCount, birdAgeDays

## 8. اگر گیر کردی

حدس نزن. grep کن. sed -n کن. cat کن.

grep -rn "کلیدواژه" src/ --include='*.tsx'
sed -n '100,200p' path/to/file
tail -100 docs/DECISIONS.md

## 9. متن شروع برای کاربر

پروژه Bird-new. قبل از هر کاری:
1. cd ~/Bird-new && bash bootstrap.sh && cat docs/STATUS.md
2. cat AI-BOOT-NEXT.md
3. cat CLAUDE.md && cat docs/CONSTITUTION.md

وضعیت: جلسه قبل 6 commit Correction propagation تموم شد. حالا C4 مونده.
قانون: فارسی حرف بزن. تصمیم مهم را از کاربر بپرس.
