# NOW.md

> آخرین آپدیت: 1405/11/15

## ✅ این جلسه (دستاوردها)

### BUG-2 حل شد
- `35613882` — BUG-2 [x] (ناسازگاری رطوبت — منطق ترکیبی)

### شکاف feed در موتور محاسبه سلامت
- `0573bddd` — فاز ۱: dosePerKgFeed در Item + تایپ + getTotalFeedKg
- `fefd2d61` — فاز ۲: branch feed در calculateHealthDose
- `f6d3f9af` — فاز ۳: UI دوز پویا در انبار (oral/water/feed)
- `9221f895` — فاز ۴: اتصال HealthSection (feedAmountKg)

### شکاف وزن‌کشی در LogCard
- `bf1ca887` — واحد گرم/کیلو، جنسیت، CV هوشمند، یکنواختی + helper مشترک

### یکدست‌سازی SectionTitle/chip/Row (Zero-Breaking)
- `dbf75597` — CardSection + SectionTitle first prop
- `9676f736` — SectionTitle در ۵ ماژول → re-export
- `b5d76548` — chip() در ۴ ماژول → re-export
- `3ae989ec` — Row/RowGrid در tra → re-export
- `076900d1` — LogSection → SectionTitle first

### گروه‌بندی سلامت + حذف ایموجی + چیدمان دو خطی
- `5fea601e` — LogGroup/LogSubSection/LogItem + گروه‌بندی «🏥 سلامت»

## 🎯 قدم بعدی (اولویت)

### ۱. کد مرده (کاری که رها شد)
- `npx tsc --noEmit --noUnusedLocals --noUnusedParameters` → ~۱۵۰ مورد
- **روش:** فایل به فایل، با verify در هر مرحله (روش یک‌جا شکست خورد)
- **شروع پیشنهادی:** LogCard → HealthSection → FeedSection → DailyLogs
- **⚠️ props مثل vErrors:** دست نزن (caller می‌شکند)
- **⚠️ locals مثل cardHasShortage:** فقط اگر tsc مطمئن باشد

### ۲. featureهای بعدی
- مهاجرت بقیه ماژول‌ها (HallCard, FlockCard, InvoiceCard) به CardSection
- شکستن tra/store.ts (MASTER-ROADMAP)
- IDEA-30 (هوشمندسازی FeedSection)

## ⚠️ هشدارها
- tsc: ۰ خطا ✅
- ۲۴ فایل > ۵۰۰ خط
- **BUG باز:** هیچ (BUG-2 [x] شد)

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
4. **گروه‌بندی داخل کارت:** `LogGroup`/`LogSubSection`/`LogItem` (dlg/helpers)
5. **SectionTitle:** منبع واحد در `shr/ui/Layout.tsx` (re-export در ۵ ماژول)
6. **chip():** منبع واحد در `shr/utils/chipStyle.ts`
7. **کامیت:** فقط `./safe-commit.sh`
8. **کد مرده:** فایل به فایل، verify در هر مرحله — نه یک‌جا
