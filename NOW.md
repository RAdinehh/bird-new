# NOW.md

> آخرین آپدیت: 1405/11/15

## ✅ این جلسه (دستاوردها)

### رفع باگ‌ها
- `35613882` — BUG-2 [x] (ناسازگاری رطوبت — منطق ترکیبی)

### شکاف feed در موتور محاسبه سلامت
- `0573bddd` — فاز ۱: dosePerKgFeed در Item + تایپ + getTotalFeedKg
- `fefd2d61` — فاز ۲: branch feed در calculateHealthDose
- `f6d3f9af` — فاز ۳: UI دوز پویا در انبار (oral/water/feed)
- `9221f895` — فاز ۴: اتصال HealthSection (feedAmountKg)

### شکاف وزن‌کشی در LogCard
- `bf1ca887` — واحد گرم/کیلو، جنسیت، CV هوشمند، یکنواختی

### یکدست‌سازی کامپوننت‌ها (Zero-Breaking)
- `dbf75597` — CardSection + SectionTitle first prop
- `9676f736` — SectionTitle در ۵ ماژول → re-export
- `b5d76548` — chip() در ۴ ماژول → re-export
- `3ae989ec` — Row/RowGrid در tra → re-export
- `076900d1` — LogSection → SectionTitle first
- `ad7e4675` — LogGroup ساده (بدون کادر تودرتو)

### بخش سلامت در LogCard (الگوی InvoiceCard)
- `f3ccc2bb` — **نهایی**: تلفات Grid2 (کوتاه) + واکسن/دارو Row تک‌ستونه + auto-fill دوز + SmartSelect روش + حذف «نامشخص» + انتقال متن محاسبه

### ⚠️ بخش Toast/Undo — به حالت قبل برگشت
- `7b3a9717` و `3c386407` — تغییرات Toast/Undo (استاندارد UX)
- **`c6267bd9` و `7ed8974a` — Revert شدند.**
- **دلیل:** کاربر می‌خواهد این بخش را **خودش دستی تکمیل کند** (تصمیم قطعی).
- **وضعیت فعلی:** Toast + Modal + UndoBar مثل قبل کار می‌کنند.

## 🎯 قدم بعدی (اولویت)

### ۱. کد مرده (رها شده)
- `npx tsc --noEmit --noUnusedLocals --noUnusedParameters` → ~۱۵۰ مورد
- **روش:** فایل به فایل، verify در هر مرحله (روش یک‌جا شکست خورد)
- **شروع:** LogCard → HealthSection → FeedSection → DailyLogs
- **⚠️ props مثل vErrors:** دست نزن
- **⚠️ locals مثل cardHasShortage:** فقط اگر tsc مطمئن باشد

### ۲. featureهای بعدی
- مهاجرت بقیه ماژول‌ها (HallCard, FlockCard, InvoiceCard) به CardSection
- شکستن tra/store.ts (MASTER-ROADMAP — اولین `[ ]`)
- IDEA-30 (هوشمندسازی FeedSection)

## ⚠️ هشدارها
- tsc: ۰ خطا ✅
- ۲۴ فایل > ۵۰۰ خط
- BUG باز: هیچ

## 📋 منابع حقیقت
- `docs/MASTER-ROADMAP.md`
- `docs/DELETION-RULES.md`
- `AGENTS.md`
- `safe-commit.sh`
- `src/shr/components/ui/index.ts`
- `src/shr/constants/` (herbal, vetMethods)
- `src/shr/calc/formulas/health.ts`
- `src/shr/utils/weightHelpers.ts`

## 📝 نکات کلیدی AI بعدی
1. **حذف/آرشیو:** `docs/DELETION-RULES.md` را بخوان
2. **کارت بازشونده:** `ExpandableCard variant="inner"`
3. **کارت خلاصه:** `SummaryCard`/`SummarySection`/`SummaryRow`
4. **SectionTitle:** منبع واحد در `shr/ui/Layout.tsx` (re-export در ۵ ماژول)
5. **chip():** منبع واحد در `shr/utils/chipStyle.ts`
6. **Row:** منبع واحد در `shr/ui/Row.tsx` (re-export در tra)
7. **کامیت:** فقط `./safe-commit.sh`
8. **کد مرده:** فایل به فایل، verify در هر مرحله
9. **⚠️ Toast/Undo:** به حالت قبل برگشت — کاربر خودش تکمیل می‌کند (دست نزن)
