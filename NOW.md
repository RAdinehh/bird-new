# NOW.md — وضعیت لحظه‌ای

> بازنویسی می‌شود، نه append.
> آخرین آپدیت: 1405/11/15

## HEAD
cdb29d6f — feat(dlg): اتصال بخش تغذیه به QuantityUnitInput
✅ sync با origin

## 🔨 کار جاری (تکمیل‌شده)
**سیستم واحدهای هوشمند (Base Unit + Sub Units) در سراسر نرم‌افزار.**

### ✅ این جلسه — دستاوردهای کلیدی (۹ کامیت)
1. **`89bbc421`** — بازطراحی EggsWeightSection (کارت expandable + CV هوشمند + واحد گرم + HelpIcon)
2. **`0282bfd5`** — رفع ایموجی تکراری + حذف نمایش ۰ اولیه در سلامت
3. **`0e4a7f7a`** — واحدهای فرعی در انبار (تایپ `subUnits` + فرم + پیش‌نمایش هوشمند)
4. **`3207b622`** — کامپوننت مشترک `QuantityUnitInput` در `shr/ui`
5. **`4744b916`** — اتصال سلامت (واکسن/دارو) به `QuantityUnitInput`
6. **`a11d3399`** — روش مصرف + واکنش در واکسن (استاندارد جهانی)
7. **`ff1cc004`** — کادر خلاصه سلامت (لیست کامل RTL + علت تلفات فارسی + RTL)
8. **`548b0791`** — ریفکتور ۵ کامپوننت نمایش داده (KpiCard, StatBox, MiniStat, MiniEmpty → همه در `shr/ui`)
9. **`cdb29d6f`** — اتصال بخش تغذیه (`FeedSection`) به `QuantityUnitInput`

## 🧠 معماری فعلی (مهم برای AI بعدی)

### کامپوننت‌های نمایش داده — همه در `src/shr/components/ui/`
> ⚠️ **قانون:** هرگز نسخه‌ی محلی نسازید! قبل از هر کارت جدید، به این لیست نگاه کنید.

| کامپوننت | کاربرد | جایگزین چه چیزی شد |
|---|---|---|
| `SummaryCard` | کارت خلاصه‌ی لیستی (children) | — |
| `KpiCard` | کاشی KPI (size: md/lg) | ادغام KpiCard در dsh + SummaryCard محلی در egg |
| `StatBox` | آمار inline (icon + label: value) | منتقل از ExpandableCard |
| `MiniStat` | آمار جعبه‌ای/ساده (variant: box/plain) | ادغام نسخه dsh + نسخه egg |
| `MiniEmpty` | حالت خالی ساده | منتقل از dsh/cards |
| `Empty` | حالت خالی قوی (SVG + action) | — |
| `QuantityUnitInput` | ورودی عدد + انتخاب واحد + پیش‌نمایش | — |

### سیستم واحدها
- **Base Unit:** در انبار ذخیره می‌شود (`unit`).
- **Sub Units:** در انبار هر آیتم (`subUnits: {name, factor}[]`).
- **در فرم روزانه:** `QuantityUnitInput` مقدار نمایشی را می‌گیرد و در پس‌زمینه `value × factor` را به عنوان مقدار پایه ذخیره می‌کند.
- **در سلامت:** `Vaccine.unit/factor` و `Medication.unit/factor`.
- **در تغذیه:** `FeedSource.displayUnit/displayValue` (جدید) — مقدار پایه در `quantity` (کیلوگرم) دست‌نخورده.

## ✅ ابزار خودکارسازی
`safe-commit.sh` در ریشه‌ی پروژه:
- چک `tsc` خودکار
- در صورت خطا: `git restore` خودکار (rollback)
- در صورت موفقیت: commit + push خودکار

**استفاده:** `./safe-commit.sh "پیام کامیت"`

## ⚠️ هشدارها
- tsc: ۰ خطا ✅
- ۲۴ فایل > ۵۰۰ خط (نقض قانون ۳۲ — BUG-1 هنوز باز است)
- BUG باز: ۱ (BUG-2 — رطوبت)

## 🎯 قدم بعدی (به ترتیب اولویت)
1. **BUG-2** — ناسازگاری بازه‌ی رطوبت در `dlg/LogCard.tsx`
2. **شکستن `tra/store.ts`** (۱۳۲۵ خط → ۳ فایل) — طبق MASTER-ROADMAP
3. **IDEA-30** — هوشمندسازی FeedSection (Anomaly Detection: feedPerBird)
4. **IDEA-32** — آستانه‌های پویای CV بر اساس نژاد

## 📋 منبع حقیقت
- `docs/MASTER-ROADMAP.md`
- `AGENTS.md`
- `BUGS.md`
- `docs/DESIGN-CONSISTENCY.md` (قانون ۳۴)
- `safe-commit.sh`
- `src/shr/components/ui/index.ts` ← همه کامپوننت‌های مشترک اینجا export شده‌اند

## 📝 نکات مهم برای AI بعدی
1. **قبل از ساخت هر کارت:** به `shr/ui/index.ts` نگاه کن. اگر مشابهش هست، استفاده کن.
2. **قبل از هر تغییر:** `./safe-commit.sh` تنها راه commit است.
3. **قبل از هر ادغام:** ابتدا grep کنید که در چند جا استفاده شده (تعداد مصرف‌کننده را بدانید).
4. **re-export برای Zero-Breaking:** هنگام انتقال کامپوننت‌ها، فایل قدیمی را با `export { X } from '...'` جایگزین کنید تا مصرف‌کننده‌های قبلی نشکنند.
