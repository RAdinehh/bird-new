# 🔗 CROSS-INTEGRATIONS — قرارداد بین‌بخشی

> هر AI یا توسعه‌دهنده، **قبل از patch هر بخش**، این سند را می‌خواند.
> وضعیت: ✅ سالم | ⚠️ ناقص | 🚨 شکسته

## ۱. flk ↔ whs — 🚨 شکسته
- `Movement.flockId` تعریف شده ولی هیچ‌جا پر نمی‌شود
- `fed/IngredientsPage:363` — «به انبار وصل نیست»
- **قرارداد:** `computeFlockFeedCost(flockId)` + flockId اجباری در consumption
- **وابسته:** Book Value، FCR، هزینه هر پرنده

## ۲. flk ↔ brd — ✅
## ۳. flk ↔ set/standards — ✅
## ۴. tra ↔ ctc — ✅
## ۵. tra ↔ whs — ✅
## ۶. tra ↔ flk — 🚨 شکسته
- **`applyInvoiceFlocks`** مسیر موازی (بدون `addEvent`) → `sexBalanceEvents` ثبت نمی‌شود
- **`sex:'mixed'` هاردکد** در event فروش (دو مسیر: `invoiceHelpers.ts:648` + `store.ts:180` revoke)
- **clamp بدون redistribution** در shortage جنسیتی → invariant `male+female+unknown===currentCount` نقض می‌شود
- **وابسته:** فاز ۴b — سه باگ B1/B2/B3
## ۷. fed ↔ whs — 🚨 شکسته
## ۸. inc ↔ flk — ⚠️
## ۹. dlg ↔ flk — ⚠️
## ۱۰. egg ↔ whs — ⚠️

## 🎯 Roadmap
1. فاز ۱: Market Value — مستقل
2. flk ↔ whs — پایه Book Value
3. fed ↔ whs — جیره‌نویسی
4. inc ↔ flk + egg ↔ whs
5. dlg ↔ flk
