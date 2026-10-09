# 📘 سند ۳ — قوانین AI، راه‌اندازی و مسیر

## 🎯 بخش ۱ — نقش کاربر
کاربر **کدنویس نیست**:
1. اسکریپت پایتون که AI می‌ده رو کپی/پیست می‌کند
2. اسکرین‌شات می‌گیرد
3. خروجی ترمینال رو کپی می‌کند
4. روی Chrome Android (localhost:3000) تست می‌کند

**محدودیت:** توکن محدود → اسکریپت‌ها باید کوتاه باشن.

## 🤖 بخش ۲ — قوانین طلایی AI

### ✅ باید بکنه
1. **قبل از هر تغییر، فایل واقعی رو ببینه** (نه حدس)
2. **قبل از هر کاری، استانداردها رو مرور کنه** و به کاربر بگه داره چیکار می‌کنه
3. **یه تغییر در هر مرحله**
4. **اسکریپت کوتاه (زیر ۵۰ خط)**
5. **بعد از هر تغییر:** tsc + build + commit + push
6. **Rollback خودکار** اگه tsc خطا داد
7. **بهترین راه‌حل رو خودش انتخاب کنه** — سوال زیاد نپرسه
8. **خودش رو معمار ارشد گوگل/اپل فرض کنه**
9. **فایل ≤ ۴۰۰ خط**
10. **کد در بخش مربوطه** (shr یا mod/xxx)
11. **حالت آبشاری** رعایت بشه
12. **چیدمان دوستونه** پیش‌فرض
13. **اسکریپت پایتون برای همه کارها** (نه heredoc بزرگ)

### ❌ نباید بکنه
- حدس anchor بدون دیدن فایل
- sed برای تغییرات پیچیده
- چند تغییر با هم
- اسکریپت > ۱۰۰ خط در یه مرحله
- ریپیت استانداردها بدون اطلاع کاربر
- اضافه کردن کد بدون بررسی قبلی

### 🚨 درس‌های حیاتی
- .bak نباید commit شه
- بعد از هر تغییر build + push
- React hook rules: هیچ hook بعد از return شرطی
- کش PWA مشکل اصلی تست کاربره → Unregister Service Worker
- کاربر صبر کم داره → کد سریع و دقیق
- قبل از هر تغییر بگو «طبق کدوم استاندارد داری چیکار می‌کنی»

## 🛠️ بخش ۳ — دستورات مهم

cd ~/Bird-new

# اجرا
npm run dev -- --host 0.0.0.0 --port 3000

# تست
npm test -- --run

# TypeScript check
npx tsc --noEmit

# Build
npm run build

# Capacitor
npx cap sync android
npx cap open android

# Git
git status -s
git add -A
git commit -m "message"
git push

## 📱 بخش ۴ — راه‌اندازی APK

### خودکار (توصیه‌شده)
1. git push کن
2. برو به: https://github.com/RAdinehh/bird-new/actions
3. بعد از ~۳ دقیقه APK آماده‌ست
4. دانلود از Artifacts

### دستی (Termux)
cd ~/Bird-new
npm run build
npx cap sync android
cd android && ./gradlew assembleDebug
# APK: android/app/build/outputs/apk/debug/app-debug.apk

### نصب روی گوشی
1. APK رو دانلود کن
2. Files → Downloads → APK → نصب
3. اگه پیام Play Protect داد → «Install anyway»

## 🔑 بخش ۵ — نکات حیاتی پروژه
1. °C در DB، °F فقط نمایش
2. استانداردها بر اساس نژاد، نه فقط پرنده
3. DB تومان پایه
4. 100svh نه 100dvh روی موبایل
5. git tag before-XXX قبل هر تغییر بزرگ
6. Rollback خودکار اگه build fail
7. یه تغییر در هر مرحله
8. localStorage کلیدها:
   pm-settings, pm-brd, pm-hal, pm-ctc, pm-flk, pm-inc, pm-egg, pm-dlg, pm-whs, pm-fed, pm-tra, pm-alt, pm-cal-manual, pm-theme, pm-custom-options

## 📁 بخش ۶ — ساختار فایل‌های مهم

### ماژول brd (در جریان)
mod/brd/
  ├── BirdsPage.tsx        ← صفحه پرنده‌ها
  ├── BreedsPage.tsx       ← صفحه نژادها
  ├── store.ts             ← Zustand store
  ├── presets.ts           ← BIRD_PRESETS + SUGGESTED_BREEDS
  ├── BirdNameField.tsx    ← فیلد نام پرنده (Autocomplete)
  ├── _source.ts           ← تشخیص منبع داده
  └── index.tsx            ← تب‌بندی

### زیرساخت مشترک
shr/
  ├── components/
  │   ├── ui/              ← Btn, Input, Modal, Sheet, ...
  │   ├── AutocompleteInline.tsx
  │   ├── SourceBadge.tsx
  │   ├── ExpandableCard.tsx
  │   ├── ToastHost.tsx
  │   ├── DialogHost.tsx
  │   └── HelpBanner.tsx
  ├── hooks/
  │   ├── useFab.ts
  │   ├── useKeyboardSafeFocus.ts
  │   ├── useVisualViewport.ts
  │   └── useBreedStandard.ts
  ├── filter/
  │   ├── configs/         ← ۱۴ فایل per-module
  │   ├── FilterBar.tsx
  │   ├── FilterGroupBody.tsx
  │   ├── RowItem.tsx
  │   └── filterHelpers.ts
  ├── multiSelect/
  ├── styles/global.css
  └── utils/

### هسته
cor/
  ├── store/dialog.ts      ← showAlert, showConfirmAsync, showPromptAsync
  ├── store/toast.ts       ← showToast + toastMsg
  ├── ui/fabStore.ts
  ├── ui/FloatingAdd.tsx
  ├── theme/applyTheme.ts
  ├── events/bus.ts
  ├── router/AppRouter.tsx
  └── logger/auditLog.ts

## 🎯 بخش ۷ — مسیر پیشنهادی

### این هفته
- رفع ۵ تست fail
- AutocompleteInline در ماژول‌های دیگر
- اتصالات: inc→flk, fed→dlg, tra→egg, whs→dlg

### هفته بعد
- KPI نژاد + سازگاری
- Code Splitting
- Sentry (پایش خطا)

### ماه بعد
- Refactor فایل‌های بزرگ (inc, set, tra)
- E2E tests (Playwright)
- Virtualization

### ۳ ماه
- Backend (Supabase)
- Auth + Cloud Sync
- iOS

## 📞 بخش ۸ — برای AI جدید

اگه اولین باره این پروژه رو می‌بینی:

1. این سه سند رو کامل بخون
2. git log --oneline -20 بزن
3. npm test -- --run بزن
4. npx tsc --noEmit بزن
5. با کاربر بگو از کجا شروع کنیم
6. **قبل از هر تغییر، استانداردها رو مرور کن و به کاربر بگو**
7. یه تغییر در هر مرحله
8. بعد از هر تغییر: tsc + build + test + push

**هدف نهایی:** نرم‌افزار جامع مدیریت مرغداری در سطح استورهای اپل و گوگل.

**موفق باشی! 🚀**

---

## 🗂️ بخش ۹ — نقشه فایل‌های این سند
- docs/PROJECT-GUIDE.md — سند اصلی (کامل)
- docs/STANDARDS.md — فقط استانداردها
- docs/AI-RULES.md — فقط قوانین AI
- README.md — خلاصه برای GitHub
