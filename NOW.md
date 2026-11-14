# NOW.md — وضعیت لحظه‌ای

> بازنویسی می‌شود، نه append.
> آخرین آپدیت: 1405/11/15

## HEAD
9c4dae2c — feat(dlg): اتصال HealthSection به موتور محاسبه (calculateHealthDose + FieldHint)
✅ sync با origin

## 🔨 کار جاری (تکمیل‌شده)
**موتور محاسبه سلامت + یکدست‌سازی ExpandableCard + استاندارد طب سنتی دامپزشکی**

## ✅ این جلسه — دستاوردهای کلیدی

### بخش ۱: بازطراحی استاندارد طب سنتی دامپزشکی
- `b2e97f0c` — ساخت `constants/herbal.ts` (لیست جامع ۲۱ شکل دارویی + ۱۶ روش مصرف مخصوص پرنده)
- `82780614` — فیلد «سایر» تک‌ستونه
- تصمیم نهایی کاربر: **لیبل = اصطلاح اصیل (طبیخ)، HelpIcon = ترجمه روان + توضیح**
- اتصال `HerbalForm` به فرم انبار (دسته گیاهی)

### بخش ۲: BUG-2 حل شد ✅
- منطق ترکیبی: اولویت بازه کاربر + هشدار تناقض با استاندارد نژاد
- سپس طبق بازخورد کاربر: ردیف‌های متنی «استاندارد نژاد» حذف شد (فقط کارت زرد/قرمز کافی است)
- ⚠️ **`BUGS.md` هنوز `[ ]` است — در جلسه بعد علامت `[x]` بزن**

### بخش ۳: بازطراحی LogCard سلامت
- استفاده از `Row` استاندارد برای تلفات/واکسن/دارو
- نمایش مقدار + واحد + روش مصرف (فارسی)
- حذف تکرار «مجموع» در تلفات

### بخش ۴: ExpandableCard variant="inner" (کامپوننت مشترک)
- `31535384` — افزودن `variant="inner"` + `onDelete` به `ExpandableCard` (Zero-Breaking)
- `d125a919` — مهاجرت HealthSection (تلفات، واکسن، دارو)
- `81bacda5` — مهاجرت EggsWeightSection
- `a7240a01` — مهاجرت FeedSection

### بخش ۵: منبع حقیقت روش‌های مصرف دامپزشکی
- `d75d6f16` — ساخت `shr/constants/vetMethods.ts` با `VET_METHOD_LABEL` (منبع واحد)
- حذف ۲ نسخه تکراری `USAGE_LABEL` از `whs`
- `injection` → «تزریقی»، `topical` → «موضعی» در `LogCard`

### بخش ۶: موتور محاسبه سلامت (فاز ۱-۵ کامل)
- `c7be8b55` — تایپ‌های `HealthParams`/`HealthResult`/`HealthRoute` در `calc/types.ts`
- `1e0970c9` — تابع `calculateHealthDose` در `calc/formulas/health.ts`
  - منطق: `water` → `dosePerLiter × waterAmountL` | `oral/injectable` → `dosePerBirdMl × aliveCount`
- `dd21e32a` — `dosePerLiter` در `Item` + UI شرطی (آشامیدنی vs تزریقی) در انبار
- `9c4dae2c` — اتصال `HealthSection` به موتور:
  - نمایش «💡 نیاز محاسبه‌شده» زیر `QuantityUnitInput`
  - `FieldHint` با `expected` override → هشدار هوشمند از طریق `useAnomalyHint`

## 🧠 معماری فعلی

### کامپوننت‌های مشترک در `src/shr/`
| کامپوننت | کاربرد |
|---|---|
| `SummaryCard` | کارت خلاصه لیستی |
| `KpiCard` | کاشی KPI (size: md/lg) |
| `StatBox` | آمار inline |
| `MiniStat` | آمار جعبه‌ای/ساده (variant: box/plain) |
| `MiniEmpty` | حالت خالی ساده |
| `Empty` | حالت خالی قوی |
| `QuantityUnitInput` | ورودی عدد + انتخاب واحد + پیش‌نمایش |
| `ExpandableCard` | کارت بازشونده (variant: outer/inner) — **inner** = کارت داخلی با X قرمز |

### دیکشنری‌های منبع حقیقت
- `shr/constants/herbal.ts` — لیست کامل طب سنتی (FORM_LABEL, FORM_DESC, USE_METHOD_LABEL, USE_METHOD_DESC, PROPERTY_LABEL)
- `shr/constants/vetMethods.ts` — `VET_METHOD_LABEL` (دامپزشکی)

### موتور محاسبه سلامت
- `shr/calc/types.ts` — `HealthParams`, `HealthResult`, `HealthRoute`
- `shr/calc/formulas/health.ts` — `calculateHealthDose`
- `shr/intelligence/anomalyDetector.ts` — از قبل موجود، بدون تغییر (سیگنال `dose_vs_flock` + پشتیبانی `expected` override)

### سیستم واحدها
- **Base Unit:** در انبار (`unit`)
- **Sub Units:** در انبار (`subUnits: {name, factor}[]`)
- **در فرم روزانه:** `QuantityUnitInput` + `displayValue`/`displayUnit`

### فرم روزانه کاملاً یکدست
| بخش | ExpandableCard inner |
|---|---|
| سلامت (تلفات، واکسن، دارو) | ✅ |
| وزن‌کشی | ✅ |
| تغذیه (منابع دان) | ✅ |

## ❌ تصمیمات کنسل‌شده (قطعی)
- **واحدهای فرعی در فاکتور خرید (`tra`)**: **کنسل شد.** خرید با واحدهای بزرگ (کیلوگرم، تن، کیسه) انجام می‌شود، نه مشت/رطل.

## ⚠️ هشدارها
- tsc: ۰ خطا ✅
- ۲۴ فایل > ۵۰۰ خط (نقض قانون ۳۲)
- **BUGS.md ناهماهنگ:** BUG-2 حل شد ولی هنوز `[ ]` است — اول جلسه بعد `[x]` بزن

## 🎯 قدم بعدی (اولویت)
1. **`BUGS.md`** — علامت `[x]` روی BUG-2 (تأیید کاربر انجام شد)
2. **مهاجرت بقیه ماژول‌ها به ExpandableCard inner** — طبق توافق کاربر، همه کارت‌های بازشونده در همه ماژول‌ها (گله، سالن، انبار، جوجه‌کشی) باید یکدست شوند
3. **شکستن `tra/store.ts`** (۱۳۲۵ خط → ۳ فایل) — طبق MASTER-ROADMAP
4. **IDEA-30** — هوشمندسازی FeedSection (Anomaly Detection)
5. **تست بصری موتور محاسبه سلامت** — هنوز توسط کاربر تأیید نشده (تست ۱ و ۲ از پیام آخر)

## 📋 منبع حقیقت
- `docs/MASTER-ROADMAP.md`
- `AGENTS.md`
- `BUGS.md` (BUG-2 باید [x] شود)
- `docs/DESIGN-CONSISTENCY.md` (قانون ۳۴)
- `safe-commit.sh`
- `src/shr/components/ui/index.ts`
- `src/shr/constants/herbal.ts`
- `src/shr/constants/vetMethods.ts`
- `src/shr/calc/formulas/health.ts`

## 📝 نکات کلیدی برای AI بعدی
1. **قبل از ساخت کارت بازشونده:** `ExpandableCard variant="inner"` استفاده کن، نساز.
2. **قبل از ساخت دیکشنری:** `shr/constants/herbal.ts` و `vetMethods.ts` را چک کن.
3. **قبل از ساخت کامپوننت:** `src/shr/components/ui/index.ts` را چک کن.
4. **قبل از هر کامیت:** فقط `./safe-commit.sh`.
5. **re-export برای Zero-Breaking:** هنگام انتقال، `export { X } from '...'`.
6. **طب سنتی:** لیبل = اصطلاح اصیل، HelpIcon = ترجمه روان.
7. **دامپزشکی:** لیبل کامل با ایموجی، از `VET_METHOD_LABEL`.
8. **واحدهای فرعی در فاکتور خرید نیاز نیست** (تصمیم قطعی).
9. **BUG-2 حل شد** — `BUGS.md` را به‌روزرسانی کن.
10. **کاربر تأکید دارد:** همه کارت‌های بازشونده در همه ماژول‌ها باید از `ExpandableCard` مشترک استفاده کنند.
