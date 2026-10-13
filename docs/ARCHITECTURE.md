# 🏛 ARCHITECTURE.md — نقشه کامل پروژه Bird-new

> **این فایل مرجع حقیقت پروژه است.** قبل از هر کار، AI باید بخوندش.
> آخرین اسکن خودکار: ۱۴۰۴/۰۷/۲۰

---

## 📊 خلاصه پروژه

- **۱۷ ماژول** کاربردی (mod/)
- **۶۰۰+ فایل** TS/TSX در کل
- **۴ لایه معماری:** cor/ (هسته) · shr/ (مشترک) · mod/ (ماژول‌ها) · test/
- **۱۴ Zustand Store** با persist در localStorage
- **۱۷ فایل فیلتر** (shr/filter/configs/)
- **۱۶ فایل validation** (shr/validation/rules/)

## 🗺 نقشه فایل‌ها

| پوشه | نقش |
|---|---|
| cor/ | هسته: روتر، تم، دیالوگ، توست، لاگر |
| shr/ | زیرساخت مشترک بین ماژول‌ها |
| shr/components/ | ۴۷ کامپوننت عمومی |
| shr/filter/ | سیستم فیلتر (configs/ + FilterBar) |
| shr/validation/ | Zod schemas |
| shr/hooks/ | ۱۳ hook مشترک |
| mod/xxx/ | هر ماژول: store.ts + index.tsx + *Page.tsx |
| docs/ | مستندات + قوانین |

## 🛠 فایل‌های ابزار (اضافه‌شده جلسه ۵)

### ریشه پروژه
- .github/workflows/ci.yml — CI خودکار (tsc + test + build)
- .github/workflows/build-apk.yml — ساخت APK
- eslint.config.js — config ESLint (flat)
- docs/TYPE-REGISTRY.md — جدول تایپ‌های همه ماژول‌ها
- scripts/check-any.py — چک any در فایل‌های staged

### hal — ساختار فعلی (بعد از جلسه ۵)
- HallsPage.tsx (۳۷۳ خط — از ۴۱۷)
- HallsFormModal.tsx (۳۴۸ خط)
- ZonesPage.tsx (۴۰۰ خط)
- ZoneFormModal.tsx (۱۲۳ خط)
- EquipmentPage.tsx (۳۱۲ خط)
- EquipmentFormModal.tsx (۲۶۱ خط)
- EquipmentCard.tsx (۲۳۷ خط)
- HallCard.tsx
- HallEquipSection.tsx
- _hallsHelpers.ts — تایپ F + emptyForm + calcSuggestedCapacity
- _typedLabels.ts — getKindLabel, getCategoryLabel, getStatusLabel, getUnitLabel, getEquipLabel, getCategoryColor, getCategorySoft
- hooks/useHallsCascade.ts — cascade گله‌ها هنگام حذف سالن
- useEquipmentForm.ts — state + logic فرم تجهیزات
- store.ts — Zustand (۵ migration)
- api/equipmentCalc.ts — محاسبات
- api/equipmentWhs.ts — اتصال انبار
- components/ — کارت‌ها و مودال‌ها

---

## 🔴 مشکلات شناسایی‌شده (بازبینی‌شده ۱۴۰۴/۰۷/۲۰)

> ⚠️ این بخش بازبینی شد. **۳ مورد از ۵ مورد اول false positive بودن.**
> گزارش‌های خودکار قدیمی و نویزدار بودن — هر مورد باید با فایل واقعی verify شه.

### ❌ False Positive ها

1. **فایل‌های .bak** — قبلاً پاک شدن. `.gitignore` درست تنظیم است. ✅
2. **dsh ناقص** — false positive. dsh ماژول تک‌صفحه‌ایه و به index.tsx/store.ts نیازی نداره. ✅
3. **cal و doc بدون نام store** — false positive. cal اصلاً Zustand store نیست (aggregate است)، doc از IndexedDB استفاده می‌کنه. ✅

### 🟡 مشکلات واقعی (فقط عدم یکدستی — نه باگ)

4. **رنگ‌های hex هاردکد** — ۳۱ مورد واقعی (نه ۷۰).
   - فایل‌های مجاز (skip): applyTheme.ts, DebugPanel.tsx, export.ts, InvoicePrint.tsx
   - راه‌حل: جایگزینی با توکن‌های موجود، فایل به فایل.

5. **padding هاردکد** — ۸۱ مورد واقعی (نه ۵۱۹).
   - `padding: 0` ها از شمارش حذف شدن (reset طبیعی).
   - توکن‌ها کاملن: `--sp-1..8`, `--pad-*`, `--gap-*`
   - راه‌حل: جایگزینی با توکن‌های موجود، فایل به فایل.

### 🟢 قابل بهبود

6. **۱۰ فایل > ۴۲۰ خط:** Charts(488)، BirdsPage(467)، DevicesPage(449)، ReceivablesPage(440)، InvoicePage(440)، EquipmentPage(437)، ItemsPage(436)، useDashboardData(433)، EditableSelect(429 — 🔒 قفل)، StatsPage(427)
7. **آبشار ناقص:** فقط ۲ جا DependentSelect استفاده شده (FlocksModal, HallsFormModal)
8. **کامپوننت‌های unused:** EmojiPicker, Skeleton, useVisualViewport
9. **set بدون AUDIT** — ۴۲۳KB، ۴۶ فایل (طبق گزارش خودکار — تأیید نشده)

## 🔗 نقشه وابستگی بین ماژول‌ها

~~~
set    ← پایه (همه)
  ↓
brd    ← hal, flk, egg, inc, tra, alt, rep
  ↓
hal    ← flk
  ↓
whs    ← tra, egg, fed, dlg, hal
~~~

**قانون طلایی:** هر ماژول فقط به والدهای خودش وابسته باشه، نه به فرزندها.

---
# ARCHITECTURE.md — نقشه کامل پروژه Bird-new

> این فایل خودکار ساخته شده


## ماژول‌ها (mod/)

### alt — 1 صفحه · 2 tsx · 2 ts · 33KB
  - index.tsx ✅
  - store.ts ✅
  - صفحات: AlertsPage.tsx
### arc — 1 صفحه · 2 tsx · 0 ts · 8KB
  - index.tsx ✅
  - صفحات: ArchivePage.tsx
### brd — 2 صفحه · 6 tsx · 4 ts · 68KB
  - index.tsx ✅
  - store.ts ✅
  - صفحات: BirdsPage.tsx, BreedsPage.tsx
### cal — 0 صفحه · 6 tsx · 3 ts · 48KB
  - index.tsx ✅
  - store.ts ✅
### ctc — 1 صفحه · 3 tsx · 1 ts · 28KB
  - index.tsx ✅
  - store.ts ✅
  - صفحات: ContactsPage.tsx
### dlg — 1 صفحه · 10 tsx · 9 ts · 102KB
  - index.tsx ✅
  - store.ts ✅
  - صفحات: DailyLogsPage.tsx
### doc — 1 صفحه · 4 tsx · 1 ts · 28KB
  - index.tsx ✅
  - store.ts ✅
  - صفحات: FilesPage.tsx
### dsh — 0 صفحه · 13 tsx · 2 ts · 86KB
### egg — 2 صفحه · 5 tsx · 1 ts · 61KB
  - index.tsx ✅
  - store.ts ✅
  - صفحات: ProductionsPage.tsx, StatsPage.tsx
### fed — 3 صفحه · 7 tsx · 4 ts · 83KB
  - index.tsx ✅
  - store.ts ✅
  - صفحات: IngredientsPage.tsx, RequirementsPage.tsx, FormulasPage.tsx
### flk — 1 صفحه · 6 tsx · 6 ts · 75KB
  - index.tsx ✅
  - store.ts ✅
  - صفحات: FlocksPage.tsx
### hal — 3 صفحه · 13 tsx · 9 ts · 213KB
  - index.tsx ✅
  - store.ts ✅
  - صفحات: HallsPage.tsx, ZonesPage.tsx, EquipmentPage.tsx
### inc — 4 صفحه · 20 tsx · 12 ts · 245KB
  - index.tsx ✅
  - store.ts ✅
  - صفحات: DevicesPage.tsx, EggEntriesPage.tsx, HatchesPage.tsx, CandlingsPage.tsx
### rep — 4 صفحه · 7 tsx · 1 ts · 46KB
  - index.tsx ✅
  - صفحات: FinancialPage.tsx, ProductionPage.tsx, FlockReportPage.tsx, ComparePage.tsx
### set — 0 صفحه · 46 tsx · 34 ts · 423KB
  - index.tsx ✅
  - store.ts ✅
### tra — 5 صفحه · 11 tsx · 7 ts · 126KB
  - index.tsx ✅
  - store.ts ✅
  - صفحات: PurchasesPage.tsx, SalesPage.tsx, DealsPage.tsx, ReceivablesPage.tsx, InvoicePage.tsx
### whs — 3 صفحه · 8 tsx · 1 ts · 83KB
  - index.tsx ✅
  - store.ts ✅
  - صفحات: ItemsPage.tsx, MovesPage.tsx, WarningsPage.tsx

## زیرساخت مشترک (shr/)

### shr/components/ — 47 فایل
  - AccordionSection.tsx
  - AutocompleteSheet.tsx
  - BottomNav.tsx
  - Charts.tsx
  - ChemicalForm.tsx
  - DatePicker.tsx
  - DependentSelect.tsx
  - DialogHost.tsx
  - ... و 39 فایل دیگه
### shr/data/ — 1 فایل
  - emojis.ts
### shr/filter/ — 23 فایل
  - FilterBar.tsx
  - FilterGroupBody.tsx
  - RowItem.tsx
  - _types.ts
  - alt.tsx
  - arc.tsx
  - brd.tsx
  - ctc.tsx
  - ... و 15 فایل دیگه
### shr/hooks/ — 13 فایل
  - useAutoBackup.ts
  - useAutoLock.ts
  - useBreedStandard.ts
  - useCarousel.ts
  - useFab.ts
  - useFocusParam.ts
  - useFormDraft.ts
  - useKeyboard.ts
  - ... و 5 فایل دیگه
### shr/icons/ — 2 فایل
  - equipment.tsx
  - index.tsx
### shr/multiSelect/ — 2 فایل
  - MultiSelectBar.tsx
  - useMultiSelect.ts
### shr/search/ — 4 فایل
  - GlobalSearch.tsx
  - config.ts
  - index.ts
  - useGlobalSearch.ts
### shr/store/ — 1 فایل
  - customOptions.ts
### shr/styles/ — 0 فایل
### shr/units/ — 4 فایل
  - convert.ts
  - index.ts
  - types.ts
  - useFormat.ts
### shr/utils/ — 10 فایل
  - audio.ts
  - backup.ts
  - export.ts
  - fa.ts
  - itemDetails.ts
  - pareto.ts
  - smart.ts
  - storage.ts
  - ... و 2 فایل دیگه
### shr/validation/ — 16 فایل
  - biological.ts
  - helpers.ts
  - index.ts
  - alt.ts
  - ctc.ts
  - dlg.ts
  - egg.ts
  - fed.ts
  - ... و 8 فایل دیگه

## هسته (cor/)

- cor/events/ — 5 فایل
- cor/logger/ — 2 فایل
- cor/router/ — 1 فایل
- cor/store/ — 4 فایل
- cor/theme/ — 1 فایل
- cor/ui/ — 8 فایل

## فایل‌های بزرگ

- 536 خط — src/test/rules.test.ts
- 488 خط — src/shr/components/Charts.tsx
- 467 خط — src/mod/brd/BirdsPage.tsx
- 449 خط — src/mod/inc/DevicesPage.tsx
- 440 خط — src/mod/tra/ReceivablesPage.tsx
- 440 خط — src/mod/tra/InvoicePage.tsx
- 437 خط — src/mod/hal/EquipmentPage.tsx
- 436 خط — src/mod/whs/ItemsPage.tsx
- 429 خط — src/shr/components/EditableSelect.tsx
- 427 خط — src/mod/egg/StatsPage.tsx
- 421 خط — src/mod/fed/IngredientsPage.tsx
- 419 خط — src/shr/search/GlobalSearch.tsx
- 416 خط — src/mod/brd/BreedsPage.tsx
- 415 خط — src/mod/ctc/ContactsPage.tsx
- 414 خط — src/mod/hal/ZonesPage.tsx

## وابستگی‌های بین ماژول‌ها

- alt → brd, dlg, egg, flk, inc, set, tra, whs
- arc → brd, flk, hal
- brd → set
- cal → brd, dlg, flk, inc, set, tra, whs
- dlg → brd, egg, fed, flk, hal, set, whs
- dsh → alt, dlg, flk, hal, tra, whs
- egg → brd, flk, whs
- fed → whs
- flk → brd, cal, hal, set, tra
- hal → brd, ctc, flk, set, tra, whs
- inc → brd, ctc, egg, flk, hal, set, tra
- rep → brd, ctc, dlg, egg, flk, tra
- set → hal
- tra → brd, ctc, egg, flk, hal, set, whs
- whs → ctc, hal

## Zustand Stores

- src/mod/set/store.ts → pm-settings
- src/mod/brd/store.ts → pm-brd
- src/mod/hal/store.ts → pm-hal
- src/mod/flk/store.ts → pm-flk
- src/mod/inc/store.ts → pm-inc
- src/mod/egg/store.ts → pm-egg
- src/mod/dlg/store.ts → pm-dlg
- src/mod/whs/store.ts → pm-whs
- src/mod/fed/store.ts → pm-fed
- src/mod/alt/store.ts → pm-alt
- src/mod/cal/store.ts → ?
- src/mod/ctc/store.ts → pm-ctc
- src/mod/tra/store.ts → pm-tra
- src/mod/doc/store.ts → ?
---

## ⚠️ استثناهای معماری (تصمیم آگاهانه)

### ۱. `set → hal` (وابستگی معکوس)

- **فایل:** `src/mod/set/HiddenOptionsTab.tsx`
- **دلیل:** چک استفاده‌ی آپشن سفارشی قبل از حذف دائمی
- **تحلیل:** کاربرد منطقیه، ولی جریان معماری معکوس
- **تصمیم:** رها شد (هزینه‌ی refactor > سود)
- **تاریخ:** ۱۴۰۴/۰۷/۲۰
- **اگر بخوایم fix کنیم:** با prop `usageCheck` از parent پاس داده شود

---
