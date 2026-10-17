# 📘 AI-RULES.md — قوانین AI، راه‌اندازی و مسیر

> آخرین به‌روزرسانی: ۱۴۰۴/۰۷/۲۱ (جلسه ۱۲)
> این سند فقط قوانین کار AI است. استانداردها → `STANDARDS.md`

## 🎯 بخش ۱ — نقش کاربر

کاربر **کدنویس نیست**:
1. اسکریپت کوتاه کپی/پیست می‌کنه
2. اسکرین‌شات می‌گیره
3. خروجی ترمینال کپی می‌کنه
4. روی Chrome Android (localhost:3000) تست می‌کنه

**محدودیت:** توکن محدود → اسکریپت‌ها کوتاه (زیر ۵۰ خط).

## 🤖 بخش ۲ — قوانین طلایی AI

### ✅ باید بکنه

1. **قبل از هر تغییر، فایل واقعی رو ببینه** (نه حدس)
2. **قبل از هر کاری، استانداردها رو مرور کنه** و به کاربر بگه داره چیکار می‌کنه
3. **یه تغییر در هر مرحله**
4. **اسکریپت کوتاه (زیر ۵۰ خط)**
5. **بعد از هر تغییر:** `tsc + build + test + commit + push`
6. **Rollback خودکار** اگه tsc خطا داد
7. **بهترین راه‌حل رو خودش انتخاب کنه** — سوال زیاد نپرسه
8. **خودش رو معمار ارشد گوگل/اپل فرض کنه**
9. **فایل ≤ ۴۰۰ خط**
10. **کد در بخش مربوطه** (`shr` یا `mod/xxx`)
11. **حالت آبشاری** رعایت بشه
12. **چیدمان دوستونه** پیش‌فرض
13. **اسکریپت برای همه کارها** (نه heredoc بزرگ)
14. **git tag قبل از تغییر بزرگ** (esp. eslint --fix)
15. **Proactive Sweep:** نه فقط `: any` — `as any` هم چک شه
16. **تایپ‌ها:** `*Payload` (Zod) vs `*FormData` (form)
17. **فرم > ۷ فیلد → تقسیم به بخش تاشو**

### ❌ نباید بکنه

- حدس anchor بدون دیدن فایل
- `sed` برای تغییرات پیچیده
- چند تغییر با هم
- اسکریپت > ۱۰۰ خط در یه مرحله
- ریپیت استانداردها بدون اطلاع کاربر
- اضافه کردن کد بدون بررسی قبلی
- نوشتن `: any` جدید بدون ثبت در `TYPE-REGISTRY.md`

### 🚨 درس‌های حیاتی

- `.bak` نباید commit شه
- بعد از هر تغییر build + push
- React hook rules: هیچ hook بعد از return شرطی
- کش PWA مشکل اصلی تست کاربره → Unregister Service Worker
- کاربر صبر کم داره → کد سریع و دقیق
- **`git status --short`** به جای `git status -s` (توی Termux فرق داره)
- **داخل `.md` از `~~~` استفاده کن** به جای ` ``` ` (تا بلوک bash قطع نشه)
- ESLint `--fix` روی `set/store.ts` فایل رو خالی کرد → **همیشه git tag**

## 🛠 بخش ۳ — دستورات مهم

### Alias های پروژه (`~/.bashrc`)

| Alias | کار |
|---|---|
| `af` | کامیت + push (`python3 ~/auto_fast.py`) |
| `chk` | چک any (`scripts/check-any.py`) |
| `hal` / `brd` / `flk` | پرش به ماژول |
| `tsc` / `vit` | tsc / vitest |
| `gs` / `gl` / `gd` | git status/log/diff |
| `dev` | dev server |

### دستورات اصلی

~~~
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
git status --short
git add -A
git commit -m "message"
git push

# کامیت سریع (tsc + build + rollback اتوماتیک)
python3 ~/auto_fast.py "پیام"
~~~

## 📱 بخش ۴ — راه‌اندازی APK

### خودکار (توصیه‌شده)

1. `git push`
2. برو به: https://github.com/RAdinehh/bird-new/actions
3. بعد از ~۳ دقیقه APK آماده‌ست
4. دانلود از Artifacts

### دستی (Termux)

~~~
cd ~/Bird-new
npm run build
npx cap sync android
cd android && ./gradlew assembleDebug
# APK: android/app/build/outputs/apk/debug/app-debug.apk
~~~

### نصب روی گوشی

1. APK رو دانلود کن
2. Files → Downloads → APK → نصب
3. اگه Play Protect پیام داد → «Install anyway»

## 🔑 بخش ۵ — نکات حیاتی

1. °C در DB، °F فقط نمایش
2. استانداردها بر اساس نژاد، نه فقط پرنده
3. DB تومان پایه
4. `100svh` نه `100dvh` روی موبایل
5. `git tag before-XXX` قبل هر تغییر بزرگ
6. Rollback خودکار اگه build fail
7. یه تغییر در هر مرحله
8. **localStorage کلیدها:**
   `pm-settings`, `pm-brd`, `pm-hal`, `pm-ctc`, `pm-flk`, `pm-inc`, `pm-egg`, `pm-dlg`, `pm-whs`, `pm-fed`, `pm-tra`, `pm-alt`, `pm-cal-manual`, `pm-doc`, `pm-theme`, `pm-custom-options`, `pm-custom-species`

## 📁 بخش ۶ — ساختار فایل‌های مهم

### ماژول `brd`
~~~
mod/brd/
  ├── BirdsPage.tsx
  ├── BreedsPage.tsx
  ├── store.ts             ← Zustand
  ├── presets.ts           ← BIRD_PRESETS + SUGGESTED_BREEDS
  ├── BirdNameField.tsx
  ├── _source.ts
  └── index.tsx
~~~

### ماژول `flk` (بزرگ‌ترین ماژول)
~~~
mod/flk/
  ├── FlocksPage.tsx
  ├── store.ts (819 خط ⚠️)
  ├── handlers.ts          ← Event Bus
  ├── api/
  │   ├── flocksCalc.ts
  │   └── hallCapacity.ts
  ├── components/
  │   ├── GroupsPage.tsx (531 خط ⚠️)
  │   ├── GroupsModal · MergeFlocksModal
  │   ├── GroupTimeline · GroupComparisonModal
  │   ├── FlocksModal · FlocksTabs · FlockCard
  │   ├── FlockTabPanel (480) · FlocksKpiCards
  │   └── LifecycleBar · UpcomingFlocks
  ├── hooks/
  │   ├── useFlocksForm · useFlocksKpi
  │   ├── useGroupKpi · useTabBadge
  └── index.tsx
~~~

### زیرساخت مشترک
~~~
shr/
  ├── components/          ← ۴۷ کامپوننت
  ├── hooks/               ← ۱۶ hook
  ├── filter/configs/      ← ۱۴ فایل per-module
  ├── validation/rules/    ← ۱۷ فایل Zod
  ├── styles/global.css
  └── utils/
~~~

### هسته
~~~
cor/
  ├── store/dialog.ts      ← showAlert, showConfirmAsync
  ├── store/toast.ts       ← showToast + toastMsg
  ├── events/              ← Event Bus (۵ فایل)
  │   ├── bus.ts
  │   ├── events.ts (۱۸ event)
  │   ├── types.ts
  │   ├── index.ts
  │   └── DebugPanel.tsx
  ├── ui/fabStore.ts · FloatingAdd.tsx
  ├── theme/applyTheme.ts
  ├── router/AppRouter.tsx
  └── logger/auditLog.ts
~~~

## 🎯 بخش ۷ — مسیر پیشنهادی (جلسه ۱۲)

### هفته ۱ — بدهی فنی
- فعال‌سازی Event Bus (۱۶/۱۸ غیرفعال)
- `catch` خالی hal (۷ مورد)
- `showAlert → Toast` (۱۵ مورد)
- `any` در inc (۱۵۵)

### هفته ۲ — پاکسازی
- `any` در set (۱۲۲)
- refactor flk/store (۸۱۹ خط)
- refactor alt/rules (۵۸۹ خط)

### هفته ۳ — refactor
- flk/GroupsPage (۵۳۱)
- inc/DevicesPage (۵۰۶)
- hal/ZonesPage (۴۴۴)

### هفته ۴ — قابلیت جدید
- Multi-Select گله‌ها
- `Decimal.js`
- TanStack Virtual

### ماه بعد
- E2E tests (Playwright)
- i18n پایه
- Code Splitting

### ۳ ماه
- Backend (Supabase)
- Auth + Cloud Sync
- iOS

## 🔧 بخش ۸ — پروتکل ESLint `--fix`

**قبل از `eslint --fix`:**

1. `git tag before-eslint-fix-YYYYMMDD`
2. فقط یه ماژول: `npx eslint src/mod/xxx/ --fix`
3. `git diff` رو بخون
4. `npx tsc --noEmit`
5. اگه OK → کامیت
6. اگه مشکوک → `git checkout HEAD -- src/mod/xxx/`

**⚠️ هشدار:** فایل‌های بزرگ (`set/store.ts`) → ممکنه خالی کنه.
**مثال واقعی:** `turkey_goose.ts` ۳۰۰ خط → ۸ خط (جلسه ۵، rollback شد).

## 🏷 بخش ۹ — Type Naming Convention

**دو تایپ متفاوت با یه اسم → ممنوع!**

| تایپ | نقش | مثال |
|---|---|---|
| `*Payload` | Zod (`number`) | `HallPayload` |
| `*FormData` | Form (`string`) | `HallFormData` |

**قانون:**

~~~
export type HallPayload = z.infer<...>         // ✅ Zod
export interface HallFormData { length: string } // ✅ Form
export type HallFormData = z.infer<...>        // ❌ تضاد
~~~

## 📞 بخش ۱۰ — برای AI جدید

اگه اولین باره این پروژه رو می‌بینی:

1. **این اسناد رو به ترتیب بخون:**
   - `HANDOFF.md` (وضعیت فعلی)
   - `FOUNDATION.md` (قوانین آهنین)
   - `FOUNDATION-PATTERNS.md` (الگوهای تفکر)
   - `ARCHITECTURE.md` (نقشه کامل)
   - `EVENT-BUS.md` (سیستم ایونت)
   - `AI-RULES.md` (این)
2. `git log --oneline -20`
3. `npm test -- --run`
4. `npx tsc --noEmit`
5. با کاربر بگو از کجا شروع کنیم
6. **قبل از هر تغییر، استانداردها رو مرور کن و به کاربر بگو**
7. یه تغییر در هر مرحله
8. بعد از هر تغییر: `tsc + build + test + push`

## 🎬 بخش ۱۱ — الگوی تعامل با کاربر

### کاربر توکن محدود داره
- **پاسخ فارسی، کوتاه**
- **اسکریپت کوتاه، یک بلوک**
- **داخل `.md` از `~~~` به جای ` ``` `** (تا بلوک bash قطع نشه)

### کاربر کدنویس نیست
- **توضیح فنی نده** — فقط بگو «چیکار می‌کنی» + «چرا»
- **اسکریپت آماده بده** — نه دستور تکی
- **خروجی رو بخواه** — تا ببینی چی شد

### کاربر صبر کم داره
- **کد سریع و دقیق**
- **سوال زیاد نپرس** — بهترین راه‌حل رو خودت انتخاب کن
- **اگه شک داری → نکن**

### چند درخواست همزمان
1. لیست کن
2. به کاربر نشون بده
3. یکی‌یکی انجام بده
4. آخر همه رو یادآوری کن

## 🎯 هدف نهایی

**نرم‌افزار جامع مدیریت مرغداری در سطح استورهای اپل و گوگل.**

- معماری تمیز
- کد با کیفیت
- UX در سطح Apple HIG
- عملکرد سریع
- صفر `any`

**موفق باشی! 🚀**

---

## 🗂 بخش ۱۲ — نقشه فایل‌های این سند

| سند | نقش |
|---|---|
| `HANDOFF.md` | وضعیت + برنامه (اول بخون) |
| `FOUNDATION.md` | قوانین آهنین (۱۳ بخش) |
| `FOUNDATION-PATTERNS.md` | الگوهای تفکر (۲۸ بخش) |
| `ARCHITECTURE.md` | نقشه فایل‌ها + وابستگی |
| `EVENT-BUS.md` | قرارداد Event Bus |
| `AI-RULES.md` (این) | قوانین کار AI |
| `STANDARDS.md` | استانداردهای UI/UX |
| `AUDIT.md` | چک‌لیست ۷ محوره |
| `TYPE-REGISTRY.md` | جدول تایپ‌ها |
| `UX-FORM-RULES.md` | ۷۰ دستور UX فرم |

---

*آخرین به‌روزرسانی: ۱۴۰۴/۰۷/۲۱ (جلسه ۱۲)*
