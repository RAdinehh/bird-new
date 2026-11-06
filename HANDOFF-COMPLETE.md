# 🤖 HANDOFF v5 (جلسه ۸.۷)
> آخرین به‌روزرسانی: ۱۴۰۵/۱۱/۰۶

## 🎯 وضعیت فعلی
| مورد | مقدار |
|---|---|
| آخرین commit | 06af62c0 |
| تست‌ها | ۱۰۹+ سبز |
| tsc | ✅ |
| شاخه | main |

## ✅ کارهای امروز (~۴۰ commit)

### فاز ۱ — Fix باگ‌ها
- Unmerge snapshot کامل
- Merge سازگاری + کانفرم
- Double-save guard
- Zod silent fail → toast
- deleteInvoice warning
- Group unknownCount

### Merge/Unmerge کامل
- UnmergeFlocksModal (فایل جدا)
- MergedEditBlockModal (راهنمای ویرایش)
- merge گروه‌بندی خودکار با رنگ‌بندی
- انتخاب درون‌گروه (از ۳ گله، ۲ انتخاب)
- badge «🔗 ادغام‌شده»

### ارزش روز گله (IFRS 13)
- resolveFlockKind: ۶ منبع (breedId/breed/name/birdId/invoice/items)
- بدون fallback به مرغ
- پیام‌های دقیق برای هر خطا
- QuickPricesModal: همه ۹ فیلد

### بهای تمام‌شده (IAS 41)
- totalCost = هزینه ثابت + مصرف انبار
- سود واقعی = درآمد - totalCost (شامل دان+دارو+واکسن+گیاهی)
- ROI بر اساس totalCost

### جدول رشد همه species (منابع معتبر)
- **Broilers** (Aviagen+Cobb 2024): ross-308 (4.5kg), cobb-500 (4.7kg), iran-broiler (3.8kg)
- **Layers** (Hy-Line+Lohmann): hy-line-w36 (1.7kg), lohmann (1.9kg), leghorn (1.3kg)
- **Turkeys** (Aviagen): bronze (12kg), white (13.5kg), bourbon (12.5kg), breeder (12kg)
- **Ducks**: pekin (2.5kg), muscovy (3.8kg), ukrainian (3kg) + breeders
- **Geese**: emden (8kg), chinese (4.2kg), toulouse (7kg), african (4kg), ukrainian (4.3kg)
- **Quail**: broiler (280g), layer (200g), breeder (240g)
- **Native** (Iranian): marandi (1.45kg), golpaygani (1.9kg), lari (4kg), golin (2.3kg)

## 🚨 کارهای باقی‌مانده

### فاز ۲ — زیرساخت sexing (~۱۵۰ خط، ۱ commit)
- [ ] BiologyStandard.sexingAgeDay
- [ ] مقادیر ۱۵+ نژاد
- [ ] Flock.sexingAgeOverride
- [ ] Flock.sexingEvents
- [ ] Flock.sexBalanceEvents
- [ ] Migration
- [ ] validateSexBalance()

### فاز ۳ — SexingModal (~۴۵۰ خط، ۲ commit)
- [ ] recordSexing() action
- [ ] SexingModal.tsx (جدید)
- [ ] SexingHistoryModal.tsx (جدید)
- [ ] Badge ⏰
- [ ] نمایش نر/ماده/نامشخص

### فاز ۴ — تلفات/فروش با جنسیت (~۴۰۰ خط، ۲ commit)
### فاز ۵ — Merge با sex (~۲۵۰ خط، ۱ commit)

## 📐 قوانین آمر
- L1: state فقط از store
- L4: showAlert → showToast
- L5: any فقط کاهش
- L6: catch {} ممنوع
- L10: کامپوننت‌های قفل‌شده (Modal, Field, Row, etc)
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

## 🎯 اولویت‌ها
1. فاز ۲ (زیرساخت sexing) — بی‌ریسک
2. فاز ۳ (SexingModal) — قلب قابلیت
3. فاز ۴ و ۵

## 📚 درس‌های این جلسه
- **verify قبل از patch**: anchor پیدا نشد → rollback، نه fix درجا
- **verify درست**: `grep -A 40` کافی نیست — از `file_text` استفاده کن
- **داده علمی > تست قدیمی**: اگر تست روی داده غلط بود، تست را fix کن نه داده را
- **باگ fallback**: `?? 'chicken'` → null + پیام خطا (IFRS 13)
- **DRY merge**: sexBalanceEvents concat با tag source

## 🎯 خلاصه یک‌خطی
Aging + AR + Credit + Advance + Merge/Unmerge + ارزش روز + بهای تمام‌شده + جدول رشد همه species (منابع معتبر) کامل. باقی: فاز ۲-۵ (sexing).
