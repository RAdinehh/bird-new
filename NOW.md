# NOW.md — وضعیت لحظه‌ای

> بازنویسی می‌شود، نه append.
> آخرین آپدیت: 1405/11/15

## HEAD
a7240a01 — refactor(dlg): مهاجرت FeedSection به ExpandableCard variant='inner'
✅ sync با origin

## 🔨 کار جاری (تکمیل‌شده)
**سیستم واحدهای هوشمند + یکدست‌سازی کارت‌های بازشونده + استاندارد طب سنتی دامپزشکی**

## ✅ این جلسه — دستاوردهای کلیدی (۱۷ کامیت جدید + قبلی‌ها)

### بخش ۱: واحدهای فرعی در تغذیه
- `cdb29d6f` — اتصال تغذیه به QuantityUnitInput
- `8722d318` — چیدمان ۳ ستونه تغذیه + پیش‌نمایش تمام عرض
- `3849c85a` — انتقال دکمه افزودن + اسکرول (اولیه)
- `f90a8947` — اسکرول خودکار تغذیه

### بخش ۲: یکدست‌سازی UX فرم روزانه
- `38e2ef80` — اسکرول وزن + انتقال دکمه وزن به بالا
- `f9711c63` — اسکرول تلفات
- `52bb7c7d` — اسکرول واکسن و دارو

### بخش ۳: پایه‌گذاری استاندارد طب سنتی دامپزشکی
- `b2e97f0c` — ساخت `constants/herbal.ts` (21 شکل دارویی + 16 روش مصرف پرنده)
- `82780614` — فیلد «سایر» تک‌ستونه در فرم طب سنتی
- تصمیم نهایی: **لیبل = اصطلاح اصیل (طبیخ)، HelpIcon = ترجمه روان**

### بخش ۴: موتور محاسبه سلامت
- `c7be8b55` — تایپ‌های `HealthParams`/`HealthResult` در `calc/types.ts`
- `1e0970c9` — تابع `calculateHealthDose` در `calc/formulas/health.ts`
- `dd21e32a` — `dosePerLiter` در `Item` + UI شرطی (آشامیدنی vs تزریقی) + profile

### بخش ۵: کامپوننت مشترک ExpandableCard
- `31535384` — افزودن `variant="inner"` + `onDelete` به `ExpandableCard`
- `d125a919` — مهاجرت HealthSection (تلفات، واکسن، دارو)
- `d75d6f16` — ساخت `VET_METHOD_LABEL` (منبع حقیقت واحد دامپزشکی) + حذف ۲ نسخه تکراری `USAGE_LABEL`
- `81bacda5` — مهاجرت EggsWeightSection
- `a7240a01` — مهاجرت FeedSection

## 🐛 BUG-2 حل شد ✅
- **مشکل:** ناسازگاری نمایش رطوبت با استاندارد `envWarn`
- **راه‌حل:** منطق ترکیبی (اولویت بازه کاربر + هشدار تناقض با استاندارد نژاد)
- **تأیید کاربر:** کارت‌های زرد/قرمز در `LogCard` کافی است، ردیف متنی «استاندارد نژاد» حذف شد
- **⚠️ باقی‌مانده:** `BUGS.md` هنوز `[ ]` است — در جلسه بعد علامت `[x]` بزن

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
| `ExpandableCard` | کارت بازشونده (variant: outer/inner) — **inner** جدید برای کارت‌های داخلی با X قرمز |

### دیکشنری‌های روش مصرف (منابع حقیقت)
- `shr/constants/herbal.ts` — `FORM_LABEL`, `FORM_DESC`, `USE_METHOD_LABEL`, `USE_METHOD_DESC`, `PROPERTY_LABEL` (طب سنتی)
- `shr/constants/vetMethods.ts` — `VET_METHOD_LABEL` (دامپزشکی)

### موتور محاسبه سلامت
- `shr/calc/types.ts` — `HealthParams`, `HealthResult`, `HealthRoute`
- `shr/calc/formulas/health.ts` — `calculateHealthDose`
- منطق: `water` → `dosePerLiter × waterAmountL` | `oral/injectable` → `dosePerBirdMl × aliveCount`

### سیستم واحدها
- **Base Unit:** در انبار (`unit`)
- **Sub Units:** در انبار (`subUnits: {name, factor}[]`)
- **در فرم روزانه:** `QuantityUnitInput` + نمایش `displayValue`/`displayUnit` (در FeedSource)

### یکدست‌سازی UX فرم روزانه
| بخش | مهاجرت به ExpandableCard inner |
|---|---|
| سلامت (تلفات، واکسن، دارو) | ✅ `d125a919` |
| وزن‌کشی | ✅ `81bacda5` |
| تغذیه (منابع دان) | ✅ `a7240a01` |

## ❌ تصمیمات کنسل‌شده (قطعی)
- **واحدهای فرعی در فاکتور خرید (`tra`)**: **کنسل شد.** دلیل: خرید در دنیای واقعی همیشه با واحدهای بزرگ (کیلوگرم، تن، کیسه) است، نه مشت/رطل. واحدهای فرعی فقط برای مصرف دقیق در فرم روزانه.

## ⚠️ هشدارها
- tsc: ۰ خطا ✅
- ۲۴ فایل > ۵۰۰ خط (نقض قانون ۳۲)
- BUG باز در `BUGS.md`: **BUG-2 (باید [x] شود)**
- BUG-1: فقط مستندات fix شده، DoD کد ناقص (منتظر tra)

## 🎯 قدم بعدی (اولویت)
1. **آپدیت `BUGS.md`** — علامت `[x]` روی BUG-2 (تأیید کاربر انجام شد)
2. **مهاجرت بقیه ماژول‌ها به ExpandableCard inner** (گله، سالن، انبار، جوجه‌کشی) — طبق توافق کاربر، همه کارت‌های بازشونده باید یکدست شوند
3. **اتصال `HealthSection` به موتور محاسبه** — نمایش نیاز واقعی + `useAnomalyHint` (فاز ۴ و ۵ از نقشه راه موتور سلامت)
4. **شکستن `tra/store.ts`** (۱۳۲۵ خط → ۳ فایل) — طبق MASTER-ROADMAP
5. **IDEA-30** — هوشمندسازی FeedSection (Anomaly Detection)

## 📋 منبع حقیقت
- `docs/MASTER-ROADMAP.md`
- `AGENTS.md`
- `BUGS.md` (BUG-2 باید [x] شود)
- `docs/DESIGN-CONSISTENCY.md` (قانون ۳۴)
- `safe-commit.sh`
- `src/shr/components/ui/index.ts` ← همه کامپوننت‌های مشترک
- `src/shr/constants/herbal.ts` ← لیست کامل طب سنتی
- `src/shr/constants/vetMethods.ts` ← لیست روش‌های دامپزشکی
- `src/shr/calc/formulas/health.ts` ← موتور محاسبه دوز

## 📝 نکات کلیدی برای AI بعدی
1. **قبل از ساخت کارت بازشونده:** `ExpandableCard variant="inner"` موجود است — استفاده کن، نساز.
2. **قبل از ساخت کامپوننت:** `src/shr/components/ui/index.ts` را چک کن.
3. **قبل از هر کامیت:** فقط `./safe-commit.sh`.
4. **قبل از هر ادغام:** `grep -rn` بزن و تعداد مصرف‌کننده‌ها را بشمار.
5. **re-export برای Zero-Breaking:** هنگام انتقال کامپوننت‌ها، فایل قدیمی را با `export { X } from '...'` جایگزین کن.
6. **در بخش طب سنتی:** لیبل فقط اصطلاح اصیل، HelpIcon توضیح+ترجمه روان.
7. **در بخش دامپزشکی:** لیبل کامل با ایموجی (`💧 آشامیدنی`)، از `VET_METHOD_LABEL` استفاده کن.
8. **واحدهای فرعی در فاکتور خرید نیاز نیست** (تصمیم قطعی کاربر).
9. **BUG-2 حل شد** — در جلسه بعد `BUGS.md` را به‌روزرسانی کن.
10. **کاربر تأکید دارد:** همه کارت‌های بازشونده در همه ماژول‌ها باید از `ExpandableCard` مشترک استفاده کنند — نه پترن دست‌ساز.
