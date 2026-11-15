# NOW.md — وضعیت لحظه‌ای

> بازنویسی می‌شود، نه append.
> آخرین آپدیت: 1405/11/15

## HEAD
16142285 — refactor(shr): ارتقای SummaryCard با SummarySection/SummaryRow + مهاجرت کامل HealthSection/FeedSection
✅ sync با origin

## 🔨 کار جاری (تکمیل‌شده)
**موتور محاسبه سلامت + یکدست‌سازی کامل UI + استاندارد طب سنتی دامپزشکی + usageTypes چندگانه**

## ✅ این جلسه — دستاوردهای کلیدی (به ترتیب زمان)

### بخش ۱: بازطراحی استاندارد طب سنتی
- `b2e97f0c` — ساخت `constants/herbal.ts` (۲۱ شکل دارویی + ۱۶ روش مصرف پرنده)
- `82780614` — فیلد «سایر» تک‌ستونه
- تصمیم نهایی: **لیبل = اصطلاح اصیل (طبیخ)، HelpIcon = ترجمه روان + توضیح**
- اتصال `HerbalForm` به فرم انبار (دسته گیاهی)

### بخش ۲: BUG-2 حل شد ✅
- منطق ترکیبی: اولویت بازه کاربر + هشدار تناقض با استاندارد نژاد
- طبق بازخورد کاربر: ردیف‌های متنی «استاندارد نژاد» حذف شد
- ⚠️ **`BUGS.md` هنوز `[ ]` است — جلسه بعد `[x]` بزن**

### بخش ۳: ExpandableCard variant="inner" (کامپوننت مشترک)
- `31535384` — افزودن `variant="inner"` + `onDelete` (Zero-Breaking)
- `d125a919` — مهاجرت HealthSection (تلفات، واکسن، دارو)
- `81bacda5` — مهاجرت EggsWeightSection
- `a7240a01` — مهاجرت FeedSection
- `3853eb7a` — رفع بریدگی/بیرون‌زدگی (minHeight:0 + padding)
- ⚠️ فرم روزانه کاملاً یکدست، اما **بقیه ماژول‌ها (گله، سالن، انبار) هنوز مهاجرت نکرده‌اند**

### بخش ۴: منبع حقیقت روش‌های مصرف دامپزشکی
- `d75d6f16` — ساخت `shr/constants/vetMethods.ts` (`VET_METHOD_LABEL`)
- حذف ۲ نسخه تکراری `USAGE_LABEL` از `whs`
- `injection` → «تزریقی»، `topical` → «موضعی»

### بخش ۵: موتور محاسبه سلامت (فاز ۱-۵)
- `c7be8b55` — تایپ `HealthParams`/`HealthResult`/`HealthRoute`
- `1e0970c9` — `calculateHealthDose` در `calc/formulas/health.ts`
- `dd21e32a` — `dosePerLiter` در `Item` + UI شرطی
- `9c4dae2c` — اتصال `HealthSection` به موتور (نمایش نیاز + `FieldHint`)
- منطق: `water` → `dosePerLiter × waterAmountL` | `oral/injectable` → `dosePerBirdMl × aliveCount`
- ⚠️ **`feed` (مخلوط با دان) هنوز محاسبه ندارد** — نیاز به فیلد `dosePerKgFeed`

### بخش ۶: usageTypes چندگانه (ری‌فکتور داده)
- `d5ab29f0` — `usageTypes: string[]` در `Item` + multi-select ToggleChip در انبار
- Migration خودکار: `usageType: 'water'` → `usageTypes: ['drinking_water']`
- فیلتر روش‌ها در فرم روزانه بر اساس `usageTypes` انبار
- Auto-fill نام واکسن/دارو (نه روش مصرف)

### بخش ۷: یکدست‌سازی کارت‌های خلاصه
- `16142285` — ساخت `SummarySection` + `SummaryRow` در `SummaryCard.tsx`
- مهاجرت کامل `HealthSection` و `FeedSection` به الگوی استاندارد جهانی
- سلسله‌مراتب ۳ سطحی: تیتر (fs-base/bold 800) → نام (fs-sm/700) → جزئیات (fs-xs/muted)

## 🧠 معماری فعلی

### کامپوننت‌های مشترک در `src/shr/components/ui/`
| کامپوننت | کاربرد |
|---|---|
| `SummaryCard` | کارت خلاصه (tone: accent/info/warn/danger) |
| `SummarySection` | بخش داخل SummaryCard (تیتر + meta + خط‌چین) |
| `SummaryRow` | ردیف استاندارد (label/value/detail) |
| `KpiCard` | کاشی KPI (size: md/lg) |
| `StatBox` | آمار inline |
| `MiniStat` | آمار جعبه‌ای/ساده (variant: box/plain) |
| `MiniEmpty` | حالت خالی ساده |
| `Empty` | حالت خالی قوی |
| `QuantityUnitInput` | ورودی عدد + انتخاب واحد + پیش‌نمایش |
| `ExpandableCard` | کارت بازشونده (variant: outer/inner) — **inner** = کارت داخلی با X قرمز |

### منابع حقیقت (Single Source of Truth)
- `shr/constants/herbal.ts` — طب سنتی (FORM_LABEL, FORM_DESC, USE_METHOD_LABEL, USE_METHOD_DESC, PROPERTY_LABEL)
- `shr/constants/vetMethods.ts` — دامپزشکی (`VET_METHOD_LABEL`, `VET_METHOD_OPTIONS`)
- `shr/calc/formulas/health.ts` — `calculateHealthDose`
- `shr/calc/types.ts` — `HealthParams`, `HealthResult`, `HealthRoute`
- `shr/intelligence/fieldProfiles.ts` — پروفایل ۱۰۰+ فیلد (شامل `whs.dosePerBird`, `whs.dosePerLiter`)
- `shr/intelligence/anomalyDetector.ts` — موتور تشخیص ناهنجاری (۶ سیگنال موازی)

### usageTypes (ری‌فکتور شده)
- `Item.usageTypes?: string[]` (جدید) + `Item.usageType?: string` (deprecated، migration خودکار)
- در انبار: multi-select با ToggleChip از `VET_METHOD_OPTIONS`
- در فرم روزانه: فیلتر methods بر اساس `usageTypes` انبار (اگر خالی بود → همه)
- کلیدهای مجاز: `water`, `oral`, `injection`, `feed`, `spray`, `topical`, `eye_drop`, `wing_web`
- **نکته:** کدهای قدیمی (`injectable`, `drinking_water`) خودکار migrate می‌شوند

### فرم روزانه کاملاً یکدست
| بخش | ExpandableCard inner | SummaryCard |
|---|---|---|
| سلامت (تلفات، واکسن، دارو) | ✅ | ✅ |
| وزن‌کشی | ✅ | — |
| تغذیه (منابع دان) | ✅ | ✅ |

## ❌ تصمیمات کنسل‌شده (قطعی)
- **واحدهای فرعی در فاکتور خرید (`tra`)**: کنسل شد. خرید با واحدهای بزرگ (کیلوگرم، تن، کیسه) انجام می‌شود، نه مشت/رطل.

## ⚠️ هشدارها
- tsc: ۰ خطا ✅
- ۲۴ فایل > ۵۰۰ خط (نقض قانون ۳۲)
- **BUGS.md ناهماهنگ:** BUG-2 حل شد ولی هنوز `[ ]` است — اول جلسه بعد `[x]` بزن
- **`feed` (مخلوط با دان) در موتور محاسبه پشتیبانی نمی‌شود** — نیاز به فیلد `dosePerKgFeed` در `Item`

## 🎯 قدم بعدی (اولویت)
1. **`BUGS.md`** — علامت `[x]` روی BUG-2
2. **مهاجرت بقیه ماژول‌ها به ExpandableCard inner** — طبق توافق کاربر، همه کارت‌های بازشونده باید یکدست شوند (گله، سالن، انبار، جوجه‌کشی)
3. **محاسبه `feed` در موتور سلامت** — افزودن `dosePerKgFeed` به `Item` + منطق در `calculateHealthDose`
4. **شکستن `tra/store.ts`** (۱۳۲۵ خط → ۳ فایل) — طبق MASTER-ROADMAP
5. **IDEA-30** — هوشمندسازی FeedSection (Anomaly Detection)

## 📋 منبع حقیقت
- `docs/MASTER-ROADMAP.md`
- `AGENTS.md`
- `BUGS.md` (BUG-2 باید [x] شود)
- `docs/DESIGN-CONSISTENCY.md` (قانون ۳۴)
- `safe-commit.sh`
- `src/shr/components/ui/index.ts`

## 📝 نکات کلیدی برای AI بعدی
1. **قبل از ساخت کارت بازشونده:** `ExpandableCard variant="inner"` استفاده کن.
2. **قبل از ساخت کارت خلاصه:** از `SummaryCard` + `SummarySection` + `SummaryRow` استفاده کن (نه div دست‌ساز).
3. **قبل از ساخت دیکشنری:** `shr/constants/herbal.ts` و `vetMethods.ts` را چک کن.
4. **قبل از ساخت کامپوننت:** `src/shr/components/ui/index.ts` را چک کن.
5. **قبل از هر کامیت:** فقط `./safe-commit.sh`.
6. **re-export برای Zero-Breaking:** هنگام انتقال، `export { X } from '...'`.
7. **طب سنتی:** لیبل = اصطلاح اصیل، HelpIcon = ترجمه روان.
8. **دامپزشکی:** لیبل کامل با ایموجی، از `VET_METHOD_LABEL`.
9. **usageTypes چندگانه:** کاربر می‌تواند چند روش مصرف برای یک آیتم تعریف کند.
10. **کاربر تأکید دارد:** همه کارت‌های بازشونده در همه ماژول‌ها باید از `ExpandableCard` مشترک استفاده کنند (نه پترن دست‌ساز).
