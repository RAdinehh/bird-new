# MASTER-ROADMAP.md — نقشه راه کامل Bird-new

> منبع حقیقت پروژه. AI بعدی قبل از هر کاری این را بخواند.
> آخرین آپدیت: 1405/11/12 | HEAD: ce4f0554 (قبل از این آپدیت)

## 🎯 هدف
از ۷۵٪ به ۹۵٪ استاندارد جهانی، مرحله‌به‌مرحله، بدون شکستن.

## 📊 Baseline (از کد واقعی، 1405/11/12)

### ✅ نقاط قوت
| حوزه | عدد |
|------|-----|
| تست (unit+atomic+cascade+property) | ۲۳۶ فایل |
| Zod validation | ۱۲/۱۲ ماژول |
| Anomaly/Intelligence | ۱۶ فایل، ۷ ماژول |
| Design tokens | ۳۶۱۱ استفاده |
| Lazy loading | ۱۸ ماژول |
| Atomic transactions | ✅ |
| Event Bus | ۱۸ event |
| Audit Trail | ✅ |

### 🔴 نقاط ضعف (اولویت‌بندی)
| # | مشکل | عدد | اولویت |
|---|------|-----|--------|
| ۱ | فایل > ۱۰۰۰ خط | ۳ | 🔴 بحرانی |
| ۲ | فایل ۶۰۰-۱۰۰۰ خط | ۵ | 🟠 متوسط |
| ۳ | catch {} خالی | ۶۹ | 🟠 |
| ۴ | as any | ۱۶۱ | 🟠 |
| ۵ | : any | ۲۹۵ | 🟠 |
| ۶ | hex سخت‌کد | ۷۵ | 🟡 |
| ۷ | Integration tests | ۲ | 🟡 |
| ۸ | RBAC | فقط owner | 🟡 |

## 📋 فازها

### فاز ۰ — تثبیت (DONE ✅)
- [x] Baseline در MASTER-ROADMAP ثبت
- [x] قوانین در AGENTS.md
- [x] RESUME.sh آپدیت

### فاز ۱ — بحرانی: نقض L7 (اولویت اول)
هدف: صفر فایل > ۱۰۰۰ خط.

- [🔄] شکستن `tra/DealsPage.tsx` (در جریان — ۲/۱۰ گام، ۱۵۴۵/۱۶۳۵ خط) → ۱۰ فایل — BUG-1 برای handoff-mismatch
  - [x] گام ۱: `deals/types.ts` (۲۹) — `25461d51`
  - [x] گام ۲: `deals/useDealCalc.ts` (۵۰) — `a744d80e`
  - [⏸] گام ۳: `forms/GoodsForm.tsx` (~۲۶۸)
  - [⏸] گام ۴: `forms/DeliveriesForm.tsx` (~۱۰۳)
  - [⏸] گام ۵: `forms/SalesForm.tsx` (~۶۲)
  - [⏸] گام ۶: `forms/PaymentsForm.tsx` (~۱۰۴)
  - [⏸] گام ۷: `DealsListView.tsx` (~۳۲۷)
  - [⏸] گام ۸: `DealFormShell.tsx` (~۱۳۹)
  - [⏸] گام ۹: `handlers.ts` (~۱۳۰)
  - [⏸] گام ۱۰: `useDealsData.ts` (~۲۱۳)
- [ ] شکستن `tra/store.ts` (۱۳۲۵) → ۳ فایل
- [ ] شکستن `flk/FlockHistoryModal.tsx` (۱۰۵۲) → ۲ فایل

**Checkpoint:** هر فایل → tsc + تست + commit.

### فاز ۲ — Type Safety
هدف: کاهش any و catch.

- [ ] catch {}: ۶۹ → ۰
- [ ] as any: ۱۶۱ → <۳۰
- [ ] : any: ۲۹۵ → <۵۰

بعد از هر ۲۰ مورد: تست + commit.

### فاز ۳ — Features ناقص (ضروری)
- [ ] Movement.supplierId (GFSI)
- [ ] Movement.batchNumber (ISO 22000)
- [ ] entryTime zod-required
- [ ] FCR روزانه
- [ ] Anomaly در fed/inc/egg

### فاز ۴ — Testing (اختیاری)
- [ ] Integration tests: ۲ → ۱۰+
- [ ] Performance benchmark

### فاز ۵ — Polish (اختیاری)
- [ ] Hex سخت‌کد: ۷۵ → ۰
- [ ] RBAC واقعی
- [ ] i18n

## 🤖 برای AI بعدی — چطور شروع کن

### گام ۱ (اجباری)
1. `cat docs/MASTER-ROADMAP.md` (این فایل)
2. `cat NOW.md`
3. `cat AGENTS.md`
4. `git --no-pager log --oneline -5`
5. `bash RESUME.sh` (اگه هست)

### گام ۲ (گزارش)
بگو:
- HEAD چیه
- کدوم فاز IN PROGRESS
- اولین [ ] چیه

### گام ۳
منتظر تأیید کاربر. هیچ کدی نزن.

### قوانین طلایی
- ✅ grep قبل از هر کار (قانون ۲۴)
- ✅ هر بلاک ≤ ۱۵ خط (قانون ۱۷)
- ✅ tsc + تست بعد از هر تغییر
- ✅ checkpoint بعد از هر موفقیت
- ✅ یک سؤال در هر پیام (قانون ۱۹)
- ❌ حدس نزن
- ❌ کامپوننت تکراری نساز (قانون ۲۶)
- ❌ بیش از ۵ فایل در یک concept

## 🛠 استاندارد شکستن فایل (Refactoring Standard)

### اصل Two Hats (Martin Fowler)
- شکستن = جابه‌جایی، نه تغییر
- باگ fix هم‌زمان با شکستن ❌ ممنوع
- feature جدید هم‌زمان با شکستن ❌ ممنوع
- AI که باگ می‌بینه → BUGS.md → بعد از شکستن، fix در commit جدا

### معیار قبولی
1. هیچ فایل جدید > ۵۰۰ خط
2. tsc = 0 خطا
3. همه تست‌های مربوطه pass
4. UI بدون تغییر (اسکرین‌شات قبل/بعد)
5. هر بخش جدید یه مسئولیت (SRP)

### فرایند (۵ گام)
1. **تحلیل:** کل فایل + نقشهٔ فایل‌های جدید → گزارش به کاربر
2. **تأیید:** منتظر تأیید کاربر (بدون تأیید، شروع نکن)
3. **شکستن تدریجی:** یکی‌یکی → tsc + تست + commit
4. **چک نهایی:** خطوط + tsc + تست + رفتار UI
5. **گزارش:** چه فایل‌هایی، چه اندازه‌ای، چرا

### مثال واقعی — tra/DealsPage.tsx (۱۶۳۵ خط)
نقشهٔ پیشنهادی (۱۰ فایل):
- types.ts (~۱۰۰)
- useDealsData.ts (~۲۵۰)
- handlers.ts (~۳۰۰)
- DealCard.tsx (~۲۰۰)
- DealFormModal.tsx (~۳۰۰)
- forms/DealGoodsForm.tsx، DealDeliveriesForm، DealSalesForm، DealPaymentsForm (~۱۵۰ هر کدام)
- DealsPage.tsx (~۲۵۰ — فقط orchestration)

### سیاست باگ در شکستن
باگ دیدی → BUGS.md → شکستن رو تموم کن → fix در commit جدا → `[x]`

---

## 📝 تاریخچه
### 1405/11/11-12
- IDEA-25 (multi-source تغذیه) ✅
- IDEA-26 (Movement.formulaId) ✅
- IDEA-27 (Formula.version) ✅
- IDEA-30 (Anomaly ۷ فیلد) ✅
- قانون ۲۴+۲۵+۲۶
- Tabs/Row/BadgeOverflow مشترک
- حذف IDEA-31 (batchNumber بدون UI)

### 1405/11/10
- ۶ کامیت Correction
- ۸ کامیت DlgEvent[]
- ۳ کامیت FlockPickerSheet
- فاز ۰ حفظ زمینه

## ❓ سؤالات باز
- فاز ۲/۴/۵ واقعاً ضروری‌ان؟
- اولویت فاز ۱ یا ۳؟

## 📞 منابع
- NOW.md (لحظه‌ای)
- RESUME.sh (دستور واحد)
- AGENTS.md (قوانین)
- docs/DECISIONS.md (چراها)
- docs/UI-PATTERNS-REGISTRY.md (الگوهای UI)
- docs/STATUS.md (خودکار)
- docs/CONSTITUTION.md (قانون اساسی)
- IDEAS.md (ایده‌های معلق)
