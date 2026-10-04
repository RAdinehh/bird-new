# 🐔 Bird-new — سند وضعیت و نقشه راه

> آخرین به‌روزرسانی: ۱۴۰۴/۰۷/۱۴
> وضعیت کلی: ~۷۸٪ آماده

---

## 📋 فهرست

1. معرفی پروژه
2. معماری کلی
3. وضعیت ماژول‌ها
4. کارهای نیمه‌کاره
5. مشکلات شناخته‌شده
6. نقشه راه
7. راهنمای AI بعدی

---

## معرفی

**Bird-new** یه PWA مدیریت مرغداریه که برای پرورش نژادهای بومی ایران (مرندی، گلپایگانی، گیلینی) و نژادهای تجاری (گوشتی، تخم‌گذار) طراحی شده.

### Stack

- Frontend: React + TypeScript + Vite
- State: Zustand + persist (localStorage)
- Date: date-fns-jalali (شمسی)
- Validation: Zod
- Test: Vitest (987 تست)
- UI: CSS vars (بدون Tailwind)
- PWA: Vite PWA + Workbox

### دستورات مهم

cd ~/Bird-new
npm run dev -- --host 0.0.0.0 --port 3000
npm test -- --run
npx tsc --noEmit
npm run build
git log --oneline -10

---

## معماری

### ساختار پوشه‌ها

src/
- mod/          : ۲۰ ماژول کسب‌وکار
  - brd/        : پرنده و نژاد
  - flk/        : گله
  - dlg/        : ثبت روزانه
  - tra/        : معاملات
  - egg/        : تخم‌ها
  - whs/        : انبار
  - fed/        : جیره‌نویسی
  - inc/        : جوجه‌کشی
  - hal/        : سالن‌ها
  - ctc/        : مخاطبین
  - alt/        : هشدارها
  - cal/        : تقویم و واکسن
  - dsh/        : داشبورد
  - rep/        : گزارش‌ها
  - set/        : تنظیمات و standards
  - doc/        : اسناد
  - arc/        : آرشیو
- shr/          : زیرساخت مشترک
  - components/ : ui.tsx, ExpandableCard, DatePicker
  - hooks/      : useCarousel, useBreedStandard
  - units/      : سیستم واحدها
  - validation/ : Zod schemas
    - types.ts
    - helpers.ts
    - biological.ts
    - useValidation.ts
    - rules/    : ۱۰ ماژول
  - utils/      : fa.ts, temp.ts, sources.ts
- cor/          : زیرساخت سیستم
  - store/      : dialog, toast
  - logger/     : auditLog
  - ui/         : UndoBar

### اصول معماری

1. Single Source of Truth
   - تلفات -> dlg -> cascade به flk
   - فروش/خرید پرنده -> tra -> cascade به flk
   - تخم -> dlg -> cascade به egg -> cascade به whs
   - دان/دارو -> dlg -> cascade به whs
   - هچ -> inc -> cascade به flk

2. اعتبارسنجی یکپارچه (Zod)
   - همه فرم‌ها useValidation(schema, data, context) استفاده می‌کنن
   - خطاهای زنده زیر فیلدها
   - دکمه ذخیره disabled اگه خطا هست

3. UI یکسان
   - Field با prop error/warning/autoFrom
   - ExpandableCard برای کارت‌ها
   - Btn, Modal, DatePicker مشترک

---

## وضعیت ماژول‌ها

| ماژول | Store | UI | Validation | Cascade | درصد |
|---|---|---|---|---|---|
| brd پرنده/نژاد | بله | بله | بله | بله | ۱۰۰ |
| flk گله | بله | بله | بله | نیمه | ۷۰ |
| dlg ثبت روزانه | بله | بله | بله | نیمه | ۷۰ |
| tra معاملات | بله | بله | بله | نیمه | ۷۰ |
| egg تخم | بله | بله | بله | بله | ۹۰ |
| whs انبار | بله | بله | بله | بله | ۸۵ |
| fed جیره | بله | بله | بله | نیمه | ۷۵ |
| inc جوجه‌کشی | بله | بله | بله | نیمه | ۷۰ |
| hal سالن | بله | بله | بله | بله | ۸۵ |
| ctc مخاطبین | بله | بله | بله | بله | ۸۵ |
| alt هشدارها | بله | بله | خیر | نیمه | ۶۰ |
| cal تقویم | بله | بله | خیر | نیمه | ۷۰ |
| dsh داشبورد | — | بله | — | نیمه | ۷۰ |
| rep گزارش | — | بله | — | نیمه | ۷۰ |
| set تنظیمات | بله | بله | — | بله | ۹۰ |
| doc اسناد | بله | بله | — | — | ۱۰۰ |
| arc آرشیو | بله | بله | — | نیمه | ۷۰ |

میانگین: حدود ۷۸٪

---

## کارهای نیمه‌کاره

### بحرانی

- [ ] Error Boundary — بدون اون یه crash کل اپ رو سفید می‌کنه
- [ ] Export/Import JSON — backup خودکار
- [ ] رفع ۲ تست fail از ۹۸۷
- [ ] tra -> egg — فروش تخم از EggSale به tra.Invoice
- [ ] fed -> dlg — جیره فعال -> فرمول پیش‌فرض dlg
- [ ] alt rules — هشدارهای خودکار

### مهم

- [ ] inc -> flk — candling آپدیت گله
- [ ] cal -> inc/dlg — برنامه واکسن فعال
- [ ] i18n پایه — stringها تو fa.ts
- [ ] Refactor ui.tsx (۱۲۵۲ خط به ۵ فایل)
- [ ] Refactor DailyLogsPage (۱۱۸۸ خط)
- [ ] UI/UX یکسان بین ماژول‌ها

### برنامه آینده

- [ ] ادغام/گروه گله (FlockEvent transfer/merge)
- [ ] Hen-Day و Hen-Housed خودکار
- [ ] EggSale.flockId
- [ ] Migration FlockEvent
- [ ] چک‌لیست آماده‌سازی سالن
- [ ] PWA offline کامل
- [ ] i18n انگلیسی
- [ ] Virtualization لیست‌ها
- [ ] A11y audit
- [ ] E2E tests با Playwright

---

## مشکلات شناخته‌شده

### بحرانی

1. بدون Error Boundary — crash کل اپ رو سفید می‌کنه
2. بدون backup — پاک شدن localStorage همه چیز رو از بین می‌بره
3. ۲ تست fail از ۹۸۷ — نامعلوم
4. Bundle size نامعلوم

### متوسط

5. فایل‌های بزرگ — ui.tsx ۱۲۵۲ خط، DailyLogsPage ۱۱۸۸ خط
6. UI ناهمسان — کارت‌ها، padding و badgeها متفاوت
7. کد تکراری — num، int، toFa تو ۱۵+ فایل
8. بدون i18n — stringها hardcode

### کم‌اهمیت

9. بدون Analytics — کرش‌ها دیده نمی‌شن
10. بدون Virtualization — لیست‌های طولانی سنگین

---

## نقشه راه

### فاز ۱: پایداری (هفته ۱)

- [ ] رفع تست‌های fail
- [ ] ErrorBoundary ریشه‌ای
- [ ] Export/Import JSON
- [ ] Bundle size check

### فاز ۲: اتصالات (هفته ۱-۲)

- [ ] tra -> egg
- [ ] fed -> dlg
- [ ] inc -> flk
- [ ] cal -> inc/dlg
- [ ] alt rules خودکار

### فاز ۳: UI/UX (هفته ۲-۳)

- [ ] ساخت src/shr/components/layout/ مشترک
- [ ] اعمال در همه ماژول‌ها
- [ ] تست موبایل واقعی

### فاز ۴: Refactor (هفته ۳-۴)

- [ ] شکستن ui.tsx
- [ ] شکستن DailyLogsPage
- [ ] شکستن EggEntriesPage
- [ ] حذف کد تکراری

### فاز ۵: تست کامل (هفته ۴)

- [ ] تست دستی همه flowها
- [ ] رفع باگ
- [ ] انتشار public

### فاز ۶: بلندمدت

- [ ] i18n فارسی و انگلیسی
- [ ] Backend multi-user
- [ ] Real-time sync
- [ ] React Native

---

## راهنمای AI بعدی

### پروتکل بازرسی میدانی

1. کاربر واقعیه، نه کدنویس
   - اسکریپت کوتاه (زیر ۵۰ خط)
   - python3 heredoc با PYEOF
   - پاسخ فارسی ساده

2. قبل از هر تغییر، فایل واقعی رو ببین
   - کاربر باید cat file.tsx بفرسته
   - حدس anchor نزن

3. یه تغییر در هر مرحله
   - backup tag قبل هر تغییر: before-XXX-YYYYMMDD-HHMMSS
   - tsc + build خودکار
   - git reset --hard اگه tsc خطا داد

4. قواعد کد
   - بدون sed برای تغییرات پیچیده — از Python regex
   - Field با error, warning, autoFrom
   - useValidation(schema, data, context)
   - cascade تو UI نه store (استثنا: dlg -> whs تو store)

### فایل‌های مرجع

- Biological: src/shr/validation/biological.ts — همه ثابت‌ها
- Rules: src/shr/validation/rules/ — ۱۰ ماژول
- UI components: src/shr/components/ui.tsx
- ExpandableCard: src/shr/components/ExpandableCard.tsx

### نکات بحرانی

1. localStorage کلیدها:
   pm-flk، pm-dlg، pm-tra، pm-whs، pm-fed، pm-egg، pm-inc، pm-hal، pm-ctc، pm-brd، pm-set، pm-alt، pm-cal

2. Cascadeهای فعلی:
   - dlg.deaths به flk.currentCount و flk.events
   - dlg.feedAmount به whs.Movement (type=out)
   - dlg.vaccines و medications به whs.Movement
   - dlg.eggs به egg.EggProduction و بعد whs.Movement
   - tra.invoice (bird) به flk.currentCount
   - inc.hatch به flk.add
   - egg.production به whs.Movement (type=in)

3. قوانین بیولوژیکی (biological.ts):
   - Hen-Day زیر ۱۰۲ درصد
   - تخم: وزن ۳۵ تا ۸۵ گرم
   - جوجه: وزن ۲۰ تا ۶۰ گرم
   - Chick yield: ۶۴ تا ۷۱ درصد
   - FCR: ۱.۰ تا ۵.۰
   - دان/پرنده: ۱۰ تا ۲۶۰ گرم در روز

4. انواع تلفات:
   - deaths (dlg) به cascade flk — الان فعاله
   - brokenTarget و otherTarget: consumption یا eating

### اولویت‌های پچ بعدی

- [ ] ErrorBoundary
- [ ] Export/Import JSON
- [ ] اتصال tra به egg
- [ ] اتصال fed به dlg

### قوانین ارتباط با کاربر

- کاربر نابده — بهترین راه‌حل رو خودت انتخاب کن
- سوال کم — فقط وقتی معماری مبهمه
- اسکریپت کوتاه — کاربر توکن محدود داره
- پاسخ فارسی — بدون اصطلاح پیچیده
- یک تغییر — نه چند تا با هم
- git tag قبل هر تغییر
- بدون خط تزئینی

---

## تماس و مراجع

- GitHub: https://github.com/RAdinehh/bird-new
- مسیر: ~/Bird-new
- آخرین commit سالم: git log --oneline -1

---

این سند باید با هر تغییر بزرگ آپدیت شه.
