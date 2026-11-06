# 🤖 HANDOFF v6 (جلسه ۸.۸)
> آخرین به‌روزرسانی: ۱۴۰۵/۱۱/۰۶

## 🎯 وضعیت فعلی
| مورد | مقدار |
|---|---|
| آخرین commit | 320ae63e |
| تست‌ها | **۱۵۴+ سبز** (۱۲ جدید) |
| tsc | ✅ |
| شاخه | main |

## ✅ کارهای امروز (~۵۰ commit)

### فاز ۱ — Fix باگ‌ها (کامل)
Merge/Unmerge / Double-save / Zod / deleteInvoice / Group

### Merge/Unmerge UX (کامل)
گروه‌بندی خودکار / انتخاب درون‌گروه / رنگ‌بندی / UnmergeFlocksModal / MergedEditBlockModal

### ارزش روز گله — IFRS 13 (کامل)
- `resolveFlockKind` — ۶ منبع fallback (breedId/breed/name/birdId/invoice/items)
- بدون fallback به مرغ (null + پیام)
- QuickPricesModal — همه ۹ فیلد
- KIND chip در header

### بهای تمام‌شده — IAS 41 (کامل)
- `totalCost = costs.grandTotalOwed + cons.totalCost` (شامل دان+دارو+واکسن+گیاهی)
- سود واقعی = `revenue - totalCost`
- ROI بر اساس totalCost

### جدول رشد ۱۰۹ نژاد (منابع معتبر)
- **Broilers** (Aviagen+Cobb): ross-308 (4.5kg), cobb-500 (4.7kg), iran-broiler (3.8kg)
- **Layers** (Hy-Line+Lohmann): hy-line-w36 (1.7kg), lohmann (1.9kg), leghorn (1.3kg)
- **Turkeys** (Aviagen): bronze (12kg), white (13.5kg), bourbon (12.5kg), breeder (12kg)
- **Ducks**: pekin (2.5kg), muscovy (3.8kg), ukrainian (3kg) + breeders
- **Geese**: emden (8kg), chinese (4.2kg), toulouse (7kg), african (4kg), ukrainian (4.3kg)
- **Quail**: broiler (280g), layer (200g), breeder (240g)
- **Native**: marandi (1.45kg), golpaygani (1.9kg), lari (4kg), golin (2.3kg)
- **Ornamental**: 5 نژاد

### فاز ۲ — زیرساخت sexing (کامل)
- `BirdStandard.sexingAgeDay` — ۲۱ نژاد
- `Flock.sexingAgeOverride`
- `Flock.sexingEvents` + `Flock.sexBalanceEvents`
- `Flock.initialMaleCount` + `initialFemaleCount`
- `validateSexBalance()` helper

### فاز ۳ — Sexing UI (کامل)
- **فاز ۳a** — `SexingModal` + `recordSexing` action
- **فاز ۳b** — `SexingHistoryModal` + Badge ⏰
- **editable unknown** — سه فیلد (نر/ماده/نامشخص) + «جمع کل» نشانگر
- برچسب‌ها: «📜 رویدادها» + «📅 تفکیک‌ها»
- فیلد نامشخص editable + invariant `male+female+unknown === currentCount`
- برچسب‌های جنسیتی — «تعداد نر»/«تعداد ماده» (نه خروس/مرغ)

### فاز ۴a — تلفات با جنسیت (کامل)
- **۴a-1** (`862daa7b`) — `Death.sex` + UI «جنسیت تلفات» (conditional)
- **۴a-2** (`1a565a94`) — `handlers.ts` sex-aware (male/female/mixed events)
- **۴a-3** (`446db6cc`) — `addEvent` clamp fix + `sexBalanceEvents` audit
- **۴a-4** (`320ae63e`) — ۱۲ تست regression (`flk-sex-balance.test.ts`)

## 🚨 کارهای باقی‌مانده

### فاز ۴b — Sale/Return با جنسیت (نیازمند verify عمیق)
**کشف امروز:** `applyInvoiceFlocks` در `invoiceHelpers.ts:640` **مسیر موازی** است:
- مستقیم `currentCount` را تغییر می‌دهد (بدون `addEvent`)
- `addEvent type='sell'` هیچ‌جا صدا زده نمی‌شود
- `InvoiceItem.sex` وجود ندارد

**فاز ۴b (~۲۵۰ خط، ۲-۳ commit):**
- [ ] افزودن `sex` به `InvoiceItem`
- [ ] UI در `InvoiceFormModal` (~۸۰ خط — پیچیده)
- [ ] `applyInvoiceFlocks` sex-aware (~۱۰۰ خط — مسیر موازی)
- [ ] تصمیم: بازسازی به event-based یا نگه‌داشتن مسیر موازی
- [ ] تست (~۶۰ خط)

### فاز ۵ — Merge با sex (~۲۵۰ خط)
- `sexBalanceEvents` concat با tag source
- `genderSplitAt` منطق (هر دو sexed → min)
- `sexingAgeOverride` در Modal
- Pro-rata تلفات بین merge-unmerge
- Unmerge Modal: انتخاب source
- Merge/Unmerge در `sexBalanceEvents`

### فاز ۶ — Group audit (~۸۰ خط)
### فاز ۷ — گزارش‌ها (~۳۰۰ خط، ۲ commit)

### Card Pattern Architecture (بعد از فاز ۵)
- `docs/CARD-PATTERN.md` جدید
- Reference implementation (FlockCard)
- Progressive migration

## 📐 قوانین آمر
- L1: state فقط از store
- L4: showAlert → showToast
- L5: any فقط کاهش (ratchet)
- L6: catch {} ممنوع
- L10: قفل‌شده: Modal, Field, Row, ExpandableCard, EntityLink
- L11: هر store action با تست
- L13: اول بگرد، بعد بساز

## 🎨 قاعده طراحی
قبل از هر UI: `docs/DESIGN-CONSISTENCY.md`

## 🎯 شروع جلسه بعد
    cd ~/Bird-new
    git log --oneline -5
    npx tsc --noEmit
    npx vitest run 2>&1 | tail -5
    cat docs/ROADMAP-SEXING.md
    cat docs/DESIGN-CONSISTENCY.md

## 🎯 اولویت‌ها (جلسه بعد)
1. **verify عمیق** — `applyInvoiceFlocks` + `InvoiceFormModal` (۲ دستور cat)
2. **تصمیم معماری** — مسیر موازی فروش vs event-based
3. **فاز ۴b** — Sale با جنسیت
4. **فاز ۵** — Merge با sex
5. **Card Pattern** — طراحی الگوی جهانی

## 📚 درس‌های این جلسه
- **verify قبل از هر patch** — `grep -A 40` کافی نیست (فقط ۴۰ خط بعد)
- **داده علمی > تست قدیمی** — تست رو fix کن، نه داده رو
- **anchor طولانی با فارسی = شکست** — بازنویسی کامل بهتر
- **`applyInvoiceFlocks` مسیر موازی** — مستقل از `addEvent` (کشف مهم)
- **clamp fix با redistribution** — invariant حفظ شود (male+female+unknown === currentCount)
- **`sexBalanceEvents` audit trail** — هر تغییر جنسیت → event

## 🎯 خلاصه یک‌خطی
Aging + AR + Credit + Advance + Merge/Unmerge + ارزش روز + بهای تمام‌شده + جدول رشد ۱۰۹ نژاد + Sexing UI (فاز ۲-۳) + تلفات با جنسیت (فاز ۴a) کامل. باقی: فاز ۴b (نیازمند verify `applyInvoiceFlocks`), فاز ۵, Card Pattern.
