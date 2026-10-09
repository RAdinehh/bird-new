# 📘 سند ۱ — معرفی و وضعیت پروژه Bird-new

> نسخه: ۰.۱۰.۰ | آخرین به‌روزرسانی: ۱۴۰۴/۰۷/۱۹

## 🎯 پروژه چیه؟
Bird-new — PWA مدیریت مرغداری (مزرعه طیور)

**Stack:** React 18 + TypeScript + Vite + Zustand + Zod + date-fns-jalali + Vitest + Phosphor Icons + Vazirmatn

**پلتفرم‌ها:** PWA (وب + موبایل) | Android (Capacitor → APK) | iOS (بعداً)

**مسیرها:**
- Local: ~/Bird-new
- GitHub: https://github.com/RAdinehh/bird-new (Private)

## 📊 آمار فعلی
- فایل‌های کد: ۵۵۲
- خطوط کد: ~۶۵,۰۰۰
- تست‌ها: ۱۰۷۰ pass
- فایل تست: ۱۴۵
- Bundle: ~۱.۹ MB
- Commit: ۹۹۰+

## 🏗️ معماری
src/
  ├── mod/    ← ۱۸ ماژول تجاری
  ├── shr/    ← زیرساخت مشترک
  ├── cor/    ← هسته (store, router, theme)
  └── test/   ← تست‌ها

**ماژول‌ها:** dsh, brd, flk, hal, inc, egg, dlg, whs, fed, tra, rep, ctc, alt, cal, set, doc, arc

## ✅ کارهای انجام‌شده

### فاز ۱ — پایه
- زیرساخت React/TS/Vite/PWA
- ۱۸ ماژول CRUD کامل
- ۱۰۷۰ تست ۱۰۰٪ pass
- استاندارد ۲۳ نژاد + راهنمای علمی
- Multi-Select در ۲۰+ ماژول
- آبشاری در ۸ ماژول
- Toast + FAB + Dialog کامل
- Feature flag واکسن/دارو

### فاز ۲ — شکستن فایل‌های بزرگ
- filter/configs.tsx (۱۷۲۰→۱۴ فایل)
- shr/components/ui.tsx (۱۳۱۴→۱۰ فایل)
- FilterBar.tsx (۶۴۴→۳۶۶ + ۳ فایل)
- tra/store.ts (۶۹۷→۴ فایل)
- ItemDetailsForm.tsx (۵۱۷→۵ فایل)
- data-breeds.ts (۱۳۷۶→۸ فایل)

### فاز ۳ — Capacitor + APK
- نصب Capacitor
- پوشه android/ ساخته شد
- GitHub Actions برای Build خودکار
- اولین APK روی گوشی نصب شد ✅
- هر git push → APK جدید (~۳ دقیقه)

### فاز ۴ — A11y
- Focus Visible (پاکسازی ۳ بلوک تکراری)
- useKeyboardSafeFocus (فیلد میاد وسط صفحه)
- حذف ۵۵۱ فایل .bak (۱۴ MB)
- سند استانداردها تدوین شد

### فاز ۵ — brd (در جریان)
- SourceBadge (آیکون منبع داده ۱۶×۱۶)
- _source.ts (تشخیص منبع)
- AutocompleteInline (لیست پیشنهاد inline)
- BirdNameField (فیلد نام پرنده)
- Cascade: پرنده → نژاد
- حذف match کاذب در findBirdPreset
- ⚠️ ۵ تست fail در انتظار بررسی

## ⏳ کارهای باقی‌مونده

### 🔴 فوری
- رفع ۵ تست fail در brd
- تأیید AutocompleteInline در ماژول‌های دیگر
- SourceBadge در BreedsPage

### 🟡 مهم
- اتصالات بین ماژول‌ها:
  - inc → flk (هچ → گله خودکار)
  - fed → dlg (جیره فعال → ثبت روزانه)
  - tra → egg (فروش تخم → موجودی)
  - whs → dlg (مصرف دارو → انبار)
- KPI نژاد در کارت
- سازگاری پرنده/نژاد (هشدار)
- کپی نژاد بین پرنده‌ها
- نمایش استاندارد زنده در کارت

### 🟠 پایین‌تر
- ترتیب فیلد whs (ItemsPage + MovesPage)
- نوار چرخه Dashboard (نیمه‌کاره)
- ROI گله در Dashboard + Report

### 🟢 Refactor
- inc (۳۷۸۲ خط)
- set (۲۶۲۵ خط)
- tra (۱۹۹۸ خط)
- hal (۱۶۶۰ خط)
- Code Splitting

### 🔵 بلندمدت
- Backend (Supabase)
- Auth + Cloud Sync
- iOS
- i18n انگلیسی
