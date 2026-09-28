# PROJECT-LOG — حافظه پروژه

نسخه: ۰.۶.۰ | تاریخ: ۱۴۰۵/۰۷/۱۰

## ⚠️ قبل از هر کار، ۴ سند را بخوان
doc/DESIGN.md · doc/SCHEMA.md · doc/WORKFLOW.md · این فایل

قبل از هر کد → پیش‌نمایش بده.
هیچ کدی بدون تأیید کاربر نوشته نمی‌شود.

---

## 🎯 هدف پروژه

نرم‌افزار مدیریت مرغداری — PWA آفلاین، فارسی، RTL، تقویم شمسی
- کاربر: خودش کارگر است
- محیط: Termux + nano + مرورگر موبایل
- داده: localStorage + IndexedDB (فایل‌ها)، بدون بک‌اند
- تعداد ماژول: ۲۳ (۱۷ کامل + ۶ placeholder)

---

## 📦 Tech Stack

- Frontend: React 18 + TypeScript strict
- Build: Vite 6
- Style: Tailwind v3.4.15 (نه v4)
- State: Zustand + persist
- Router: React Router v6
- Date: date-fns-jalali
- ID: UUID v4 (crypto.randomUUID)
- Storage: localStorage + IndexedDB (idb)
- Font: Vazirmatn از CDN

---

## ✅ کامل‌شده (v0.6.0)

### زیرساخت
- ۴ سند قانون اساسی (DESIGN, SCHEMA, WORKFLOW, PROJECT-LOG)
- Layout کامل: Header + BottomNav + MenuDrawer + Router
- سیستم تم روشن/تیره
- applyTheme: رنگ اصلی (۴ رنگ) + اندازه فونت (۴ حالت) + انیمیشن + کنتراست بالا + کم‌مصرف
- ErrorBoundary + ErrorFallback (جلوی صفحه سفید)
- Store های ماژولی داخل هر ماژول (mod/*/store.ts)
- Store های عمومی در cor/store/ (dialog, theme, ui)

### کامپوننت‌های مشترک (۱۶)
- ExpandableCard · DatePicker · TimePicker
- ProgressTracker + MiniProgress
- Charts: BarChart، DualBarChart، LineChart، PieChart (SVG)
- DialogHost · HelpModal · ShortcutsModal
- Header · BottomNav · MenuDrawer
- ErrorBoundary · ErrorFallback
- ui.tsx (Btn, Input, Select, Field, Grid2/3, Card, Tag, Empty, Modal, Chip, BtnRow)

### Utility
- fa.ts: toFa، toEn، formatNumWhileTyping، numberToWords، parseFaNum
- smart.ts: clampPercent، complement
- backup.ts: exportAll، importAll، getStats، downloadBackup، readFile
- export.ts: toCSV، downloadCSV، printHTML، printTemplate

### Hook
- useKeyboard: Ctrl+H، ?، Ctrl+1..9، Ctrl+F، Esc

---

## 📋 ماژول‌ها (۲۳)

### ✅ کامل (۱۷)
| # | کد | ماژول | تب‌ها |
|---|---|---|---|
| ۱ | set | تنظیمات | پروفایل، ظاهر، ماژول‌ها، اعلان‌ها، پشتیبان، درباره، لاگ |
| ۲ | brd | پرنده و نژاد | پرنده، نژاد |
| ۳ | hal | سالن | سالن، بخش، تجهیزات |
| ۴ | ctc | مخاطبین | همه، مشتری، فروشنده، کارگر |
| ۵ | flk | گله | فعال، تخم‌گذار، گوشتی، مادر، آرشیو |
| ۶ | inc | جوجه‌کشی | دستگاه، ورودی، کندلینگ، هچ |
| ۷ | egg | تخم | تخم‌گذاری، انبار و فروش |
| ۸ | dlg | ثبت روزانه | امروز، تاریخچه |
| ۹ | tra | معاملات | خرید، فروش، خاص، مطالبات |
| ۱۰ | whs | انبار | اقلام، ورود/خروج، هشدارها |
| ۱۱ | fed | جیره‌نویسی | مواد، نیازها، جیره‌ها |
| ۱۲ | rep | گزارش | مالی، تولید، گله، مقایسه |
| ۱۳ | alt | هشدار | فعال، تاریخچه |
| ۱۴ | dsh | داشبورد | — |
| ۱۵ | arc | آرشیو | — |
| ۱۶ | cal | تقویم | هچ، واکسن، سرسید، کارها، مالی |
| ۱۷ | doc | اسناد | فایل‌ها، آپلود (IndexedDB) |

### 🚧 Placeholder (۶) — نیاز به پیاده‌سازی
| کد | حدس ماژول |
|---|---|
| cus | مشتریان |
| dea | معاملات خاص |
| med | دارو/واکسن |
| sal | حقوق/فروش |
| tmd | زمان‌بندی |
| wrk | کارگر/کار |

---

## 🧠 قواعد هوشمندسازی (فعال)

- درصد: فقط ۰-۱۰۰
- درصد مکمل شراکتی: خودکار ۱۰۰ - شریک
- تلفات ≤ تعداد زنده گله
- تخم ≤ ظرفیت دستگاه
- هچ‌شده ≤ سالم کندلینگ
- پرداخت ≤ قیمت نهایی
- جمع کندلینگ ≤ تعداد کل تخم
- تخم‌گذاری ≤ تعداد گله
- فیلد سن تخم‌گذاری قابل ویرایش (پیش‌فرض ۱۴۰ روز)
- وقتی گله به سن نرسیده: فیلدها غیرفعال + ProgressTracker
- عدد → حروف فارسی در ≥ ۱۰۰٬۰۰۰

---

## 🎨 قواعد طراحی (قفل‌شده)

- همه کارت‌ها: ExpandableCard
- انیمیشن: grid-template-rows 0fr→1fr
- Easing: cubic-bezier(.16,1,.3,1)
- فقط یکی باز هم‌زمان
- فلش چرخان چپ + نوار رنگی راست + بج شماره
- RTL: تأیید راست، لغو چپ
- ورودی عدد: dir=ltr، mode=number، autoClamp
- فیلد کوتاه: ۲-۳ ستونه
- مودال: از پایین، max 90vh
- Toast: بدون translateY(-20px)

---

## 🎨 Design Tokens

فونت: --fs-xs ۱۱px · --fs-sm ۱۲.۵px · --fs-base ۱۳px
        --fs-md ۱۴px · --fs-lg ۱۵.۵px · --fs-xl ۱۹px · --fs-2xl ۲۳px

رنگ روشن: bg=#f1f5f9 · accent=#16a34a
رنگ تیره: bg=#0f172a · accent=#22c55e
۴ برند: سبز (پیش‌فرض)، آبی، نارنجی، بنفش

فاصله: --sp-1 (۴px) تا --sp-8 (۳۲px)
گوشه: --r-sm (۸px) تا --r-2xl (۲۰px)
انیمیشن: fast ۱۵۰ms · base ۲۰۰ms · slow ۲۵۰ms · enter ۳۰۰ms

---

## 🗂 ساختار پوشه (به‌روز)

src/
├── cor/
│   ├── store/{theme.ts, ui.ts, dialog.ts}
│   ├── router/AppRouter.tsx
│   └── theme/applyTheme.ts
├── shr/
│   ├── components/ (۱۶ فایل)
│   ├── styles/global.css
│   ├── hooks/useKeyboard.ts
│   └── utils/{fa.ts, smart.ts, backup.ts, export.ts}
└── mod/ (۲۳ ماژول)
    ├── کامل: set brd hal ctc flk inc egg dlg tra whs fed rep alt dsh arc cal doc
    └── placeholder: cus dea med sal tmd wrk

---

## 🔴 کارهای فوری (v0.6.1)

### ۱. پاکسازی ۲۲ alert() باقی‌مانده
فایل‌های دارای alert:
- mod/set/LogsTab.tsx
- mod/set/AboutTab.tsx
- mod/flk/FlocksPage.tsx
- mod/inc/EggEntriesPage.tsx
- mod/inc/CandlingsPage.tsx
- mod/inc/HatchesPage.tsx
- mod/egg/ProductionsPage.tsx
- mod/egg/StockPage.tsx
- mod/dlg/DailyLogsPage.tsx
- mod/whs/MovesPage.tsx
- mod/fed/FormulasPage.tsx
- mod/tra/PurchasesPage.tsx
- mod/tra/SalesPage.tsx
- mod/tra/DealsPage.tsx
→ همه با showAlert جایگزین شوند.

### ۲. پر کردن ۶ Placeholder
تعیین وظیفه دقیق + پیاده‌سازی ماژول‌محور (طبق WORKFLOW).

---

## 🟠 کارهای مهم (v0.7.0)

- رفرش خودکار KPI (هر ۳۰ ثانیه)
- پشتیبان خودکار (هر ۲۴ ساعت، ۵ نسخه)
- تست PWA روی گوشی + GitHub
- تحلیل پیشرفته (Pareto، Heatmap، Benchmarking)
- مهاجرت داده‌ها (version + schemaVersion)

---

## 🟡 متوسط (v0.8.0)

- Onboarding کامل
- میان‌برهای عملیاتی (Ctrl+D/W/E/V/B)
- Skeleton loader
- FAB شناور
- جستجوی سراسری در هدر
- اعلان‌های بیرونی (SMS، ایمیل، تلگرام)
- تست واحد Vitest

---

## 🟢 کم

- Demo Mode
- Tooltip + Walkthrough
- i18n (چند زبانه)
- چند کاربر
- مهاجرت به SQLite

---

## اجرا و Build

cd ~/Bird-new && npm run dev      # localhost:3000
cd ~/Bird-new && npm run build    # خروجی در dist/

---

## نکات AI بعدی

1. کاربر کدنویس نیست — فقط کپی/پیست
2. محیط: Termux + nano + موبایل
3. قبل از هر ماژول: تحلیل + تأیید کاربر
4. همیشه ExpandableCard برای کارت‌ها
5. فیلد عددی با mode=number
6. پیام‌های طولانی در چت می‌شکنند — بلوک کوچک بده
7. پس از هر ماژول این فایل را به‌روز کن
8. قواعد قفل‌شده را تغییر نده
9. از python3 برای جایگزینی امن استفاده کن
10. بعد از تغییرات، کاربر refresh می‌کند

---

## آمار فعلی (v0.6.0)

- ماژول کامل: ۱۷
- ماژول Placeholder: ۶
- فایل‌های ts/tsx: ۱۱۴
- سطر کد: ~۱۹٬۶۷۴
- کامپوننت مشترک: ۱۶
- Store عمومی: ۳ (بقیه داخل ماژول‌ها)
- ErrorBoundary: ✅
- IndexedDB: ✅ (mod/doc)
- confirm() باقی‌مانده: ۰
- alert() باقی‌مانده: ۲۲

---

## مسائل شناخته‌شده (باقی‌مانده)

1. ۲۲ alert() در ۱۳ فایل
2. ۶ ماژول فقط Placeholder
3. MenuDrawer ممکن است سفید شود
4. BottomNav احساس بی‌جانی
5. PWA روی گوشی تست نشده
6. GitHub راه‌اندازی نشده
7. Zustand selector ممکن است undefined بدهد

---

## 🎯 گام بعدی پیشنهادی

۱. پاکسازی ۲۲ alert (سریع، کم‌خطر)
۲. تعیین وظیفه ۶ placeholder + پیاده‌سازی
۳. تست PWA + GitHub
۴. رفرش + پشتیبان خودکار
۵. تحلیل پیشرفته

---

## مراجع استاندارد

Material Design 3 · Apple HIG · SAP Fiori
Petersime / Pas Reform · Hy-Line / Lohmann · Nielsen Norman

پایان نسخه ۰.۶.۰
