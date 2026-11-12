# DLG-DAILY.md — راهنمای AI برای ثبت روزانه

> **این سند برای کیه؟** هر AI که روی `src/mod/dlg/` کار می‌کند.
> **هدف:** جلوگیری از دوباره‌کاری و ثبت وضعیت فعلی (قانون ۳۲+۳۳).

---

## 📐 نقش ماژول
ثبت روزانه — دما، رطوبت، دان، آب، تلفات، رفتار پرنده، اصلاحات.

## 📂 ساختار فایل‌ها

    src/mod/dlg/
    ├── DailyLogsPage.tsx    (صفحه اصلی)
    ├── store.ts             (state + مدل)
    ├── helpers.tsx          (کامپوننت‌های کمکی)
    ├── components/
    │   ├── LogCard.tsx      (کارت لاگ)
    │   ├── FormModal.tsx    (فرم ثبت/ویرایش)
    │   ├── FeedSection.tsx  (تغذیه + آب)
    │   ├── HealthSection.tsx (تلفات + واکسن)
    │   └── ...
    └── api/                 (buildData, applyCorrections)

## 🎨 Design System

### رنگ‌ها (قانون ۳۴)
- `--success` — موفقیت/تأیید (سبز ثابت، مستقل از تم)
- `--warn` — هشدار غیربحرانی (نارنجی)
- `--danger` — خطا (قرمز)
- `--info` — اطلاع‌رسانی (آبی)
- `--accent` / `--primary` — عملیات اصلی (متغیر بر اساس تم)

### کامپوننت‌های مشترک
- `<Tag tone="green|amber|red|blue|gray|purple">` — برچسب کوچک
- `<AlertBox tone="warn|danger|info|success|accent" variant="dashed|solid|flat" size="xs|sm">` — کادر هشدار

## 📋 تغییرات اخیر

### [۱۴۰۵/۱۱/۱۲] مهاجرت ۴ کادر هشدار به AlertBox
- **commit:** `8160c5d8`
- **فایل‌ها:** `FeedSection.tsx`, `FormModal.tsx`, `HealthSection.tsx`
- **رفتار:** بصری یکسان (style override دقیق)
- **tsc:** ۰ خطا ✅

### [۱۴۰۵/۱۱/۱۲] حذف کادر تکراری «رطوبت نامناسب»
- **فایل:** `LogCard.tsx` (خط ۱۳۴-۱۴۱)
- **دلیل:** هشدار تکراری با `Row warn` پایین‌تر

## ⚠️ نکات برای AI بعدی

1. **باگ باز (BUG-2 — بررسی نشده):** در LogCard، بازهٔ رطوبت نمایش‌داده‌شده (۱۵–۵۰) با استاندارد محاسبه (`stdHumMin/Max`) هم‌خوان نیست — رطوبت ۳۲.۵ داخل بازه، ولی کادر می‌گفت «نامناسب». نیاز به بررسی جدا.
2. **۱۳ تست fail در dlg** (validation-dlg، validation-dlg-henday) — از قبل، ربطی به refactor ندارد. در BUGS.md ثبت نشده، پیشنهاد: ثبت شه.
3. **`entryTime` zod-required** — تعویق افتاده (IDEAS.md).
4. **IDEA-25..30** — چند منبع دان + FeedSection هوشمند، پیاده نشده.

## 🔗 منابع
- `docs/MASTER-ROADMAP.md` — نقشه راه
- `AGENTS.md` قانون ۳۴ — رنگ و design system
- `BUGS.md` — باگ‌های باز
- `IDEAS.md` — ایده‌ها
