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

- [ ] شکستن `tra/DealsPage.tsx` (۱۶۳۵) → ۴ فایل
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
