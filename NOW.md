# NOW.md

> آخرین آپدیت: 1405/11/16
> وضعیت: آماده تحویل به AI بعدی

## HEAD
48c048d3 — fix(safe-commit): رفع باگ چک push

## ✅ این جلسه
- مرحله ۱ Correction atomic: save() حالا overrideForm + reason می‌پذیرد (e207798c)
- مرحله ۲ CorrectionModal → save: کاملاً اتمیک با cascade (70081879)
- رفع باگ: skip if no change در buildCorrectionEvents (a8faf3a2)
- رفع باگ safe-commit.sh: چک commit + push (48c048d3)
- انتقال ۳ کامیت از fix/daily-log-corrections به main
- حذف شاخه fix/daily-log-corrections (محلی و remote)

## 🎯 کار بعدی (اولویت)

### ۱. مرحله ۳ — منطق ویرایش ۳ روز
- در LogCard: اگر daysSince <= 3 → دکمه ویرایش فعال
- اگر daysSince > 3 → دکمه ویرایش disabled + tooltip برای استفاده از ثبت اصلاح
- فایل: src/mod/dlg/components/LogCard.tsx

### ۲. کتابخانه جامع دارو
- سند کامل: docs/DRUG-LIBRARY-ARCHITECTURE.md
- ری‌فکتور ۴-ماژولی (whs, dlg, rep, dsh)
- مدل داده فعلی باید به ماتریس species × route × dose تبدیل شود

### ۳. رفع شکاف CorrectionModal UI
- ۱۲ چیپ به هم ریخته باید گروه‌بندی شوند (محیط، تغذیه، تولید)

## 📝 نکات کلیدی AI بعدی
- حذف/آرشیو: docs/DELETION-RULES.md
- کارت بازشونده: ExpandableCard variant inner
- کارت خلاصه: SummaryCard + SummarySection + SummaryRow
- کامیت: safe-commit.sh (اکنون امن — commit و push چک می‌شوند)
- Toast/Undo: به حالت قبل برگشت (کاربر خودش تکمیل می‌کند)
- کد مرده: فایل به فایل، نه یکجا
- Correction: قبلاً فقط ظاهری بود، الان اتمیک است
