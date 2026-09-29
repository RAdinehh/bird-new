# 🐔 Bird-new — نرم‌افزار مدیریت مرغداری

PWA آفلاین، فارسی، RTL، تقویم شمسی

نسخه 0.7.0 | Baseline: 5f5c14d | تاریخ: ۱۴۰۵/۰۷/۰۷

---

## 🎯 هدف

مدیریت جامع مرغداری برای کارگر و مدیر مزرعه.

- بدون سرور، کاملاً آفلاین
- داده محلی (localStorage + IndexedDB)
- PWA برای نصب روی گوشی
- رابط فارسی، راست‌چین

## ✨ ویژگی‌ها

### ۱۷ ماژول کامل

- تنطیمات — پروفایل، ظاهر، پشتیبان
- پرنده و نژاد — بانک اطلاعاتی پرندگان
- سالن، بخش، تجهیزات
- مخاطبین — مشتری، فروشنده، کارگر
- گله — فعال، تخم‌گذار، گوشتی، مادر
- جوجه‌کشی — دستگاه، ورودی، کندلینگ، هچ
- تخم — تخم‌گذاری، انبار
- ثبت روزانه — دما، تلفات، دان، واکسن
- معاملات — خرید، فروش، مطالبات، چک، سررسید
- انبار — اقلام، گردش، هشدار
- جیره‌نویسی — مواد، نیازها، فرمول
- گزارش — مالی، تولید، گله، مقایسه
- هشدار — فعال، تاریخچه
- داشبورد — KPI + سررسید + چک
- آرشیو
- تقویم — هچ، واکسن، کار
- اسناد — IndexedDB

## 🛠 تکنولوژی

- React 18 + TypeScript strict
- Vite 6
- Tailwind v3.4.15
- Zustand + persist
- React Router v6
- date-fns-jalali
- idb (IndexedDB)
- Vazirmatn از CDN
- vite-plugin-pwa

## 🚀 راه‌اندازی

پیش‌نیاز: Node.js 18+

نصب:
npm install

اجرا:
npm run dev

Build:
npm run build

Preview:
npm run preview

## 📱 نصب روی گوشی

1. npm run dev در Termux
2. Chrome → localhost:3000
3. منو → Install app
4. آیکون روی صفحه اصلی

## 📁 ساختار پروژه

src/
- cor/ (core) — router, store, theme, logger
- mod/ (modules) — ۱۵ ماژول اصلی
- shr/ (shared)
  - components/ — ui.tsx + کامپوننت‌های مشترک
  - utils/ — fa, smart, backup, export
  - hooks/ — useKeyboard

doc/
- DESIGN.md — سیستم طراحی
- WORKFLOW.md — قوانین کار
- SCHEMA.md — ساختار داده (v2.0)
- PROJECT-LOG.md — تاریخچه
- CHANGELOG.md — نسخه‌ها
- AUDIT-REPORT.md — گزارش آدیت
- TECH-DEBT.md — بدهی فنی
- BASELINE.md — رفتار پایه
- STANDARDS.md — استاندارد کد
- COMPONENTS.md — API کامپوننت‌ها

## 📊 وضعیت

- حجم کد: ~۲۴,۵۰۰ خط
- ماژول‌ها: ۱۵ فعال + ۶ Placeholder
- Build: 18.52s
- Bundle: 831 KB (gzip: 203 KB)

## 🎯 نقشه راه

- ✅ فاز ۰ — Safety + Docs
- ⏳ فاز ۰.۹ — تقویت ui.tsx
- ⏳ فاز ۱ — آدیت ۱۵ ماژول
- ⏳ فاز ۲ — تست جامع
- ⏳ فاز ۳ — مستندسازی نهایی

## 📄 لایسنس

Private project

پایان
