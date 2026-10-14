# 🐔 STATUS.md — تاریخچه و نقشه راه

> آخرین به‌روزرسانی: ۱۴۰۴/۰۷/۲۱ (جلسه ۷ — hal نهایی + UX فرم)
> این سند فقط **تاریخچه** و **Roadmap** رو نگه می‌داره.
> وضعیت فعلی و کارهای جاری → `HANDOFF.md`

---

## ✅ تاریخ فازها

### فاز ۱ — پایه (تموم)
- زیرساخت React/TS/Vite/PWA
- ۱۸ ماژول CRUD کامل
- ۱۰۷۰ تست ۱۰۰٪ pass
- استاندارد ۲۳ نژاد + راهنمای علمی
- Multi-Select در ۲۰+ ماژول
- آبشاری در ۸ ماژول
- Toast + FAB + Dialog کامل
- Feature flag واکسن/دارو

### فاز ۲ — شکستن فایل‌های بزرگ (تموم)
- filter/configs.tsx (۱۷۲۰→۱۴ فایل)
- shr/components/ui.tsx (۱۳۱۴→۱۰ فایل)
- FilterBar.tsx (۶۴۴→۳۶۶ + ۳ فایل)
- tra/store.ts (۶۹۷→۴ فایل)
- ItemDetailsForm.tsx (۵۱۷→۵ فایل)
- data-breeds.ts (۱۳۷۶→۸ فایل)

### فاز ۳ — Capacitor + APK (تموم)
- نصب Capacitor
- پوشه android/ ساخته شد
- GitHub Actions برای Build خودکار
- اولین APK روی گوشی نصب شد ✅
- هر git push → APK جدید (~۳ دقیقه)

### فاز ۴ — A11y (تموم)
- Focus Visible (پاکسازی ۳ بلوک تکراری)
- useKeyboardSafeFocus (فیلد میاد وسط صفحه)
- حذف ۵۵۱ فایل .bak (۱۴ MB)
- سند استانداردها تدوین شد

### فاز ۵ — brd (تموم — قفل‌شده)
- ممیزی کامل (AUDIT-BRD.md)
- ۱۱ fix موفق
- refactor کامل (BirdForm, BirdCard, BreedForm, BreedCard)
- Single Resolver (resolveStandard)
- Master Data (قانون ۱۶)
- tsc: ۰ خطا، تست: ۱۰۶۴/۱۰۶۴

### فاز ۶ — hal (تموم — قفل‌شده ✅)
- ممیزی کامل (AUDIT-HAL.md)
- EquipmentPage: ۴۳۷ → ۳۱۱ خط
- ZonesPage: ۴۱۴ → ۳۵۷ خط
- استخراج useEquipmentForm + ZoneFormModal
- توکنی‌سازی ۷۰+ مورد
- **جلسه ۵:** ۹۶ any → ۶ (۹۴٪ کاهش) — قفل ۱۰۰/۱۰۰

### فاز ۷ — FOUNDATION (تموم)
- FOUNDATION.md (۱۳ بخش)
- FOUNDATION-PATTERNS.md (۱۶ بخش)
- ۳۰+ الگوی تفکر

### فاز ۱۰ — hal نهایی (تموم — جلسه ۷)
- ✅ **۱۷ fix** روی hal (Halls + Zones + Equipment)
- ✅ **۶ باگ پنهان کشف و fix** (zoneId، ErrorBox، litter_roll، ventilation/light، ...)
- ✅ **گروه‌بندی بصری** HallsFormModal (۵ گروه) + EquipmentFormModal (۴ گروه)
- ✅ **sync کامل** Hall ↔ Equipment (شامل `ventilation`/`light`)
- ✅ **auto-fill** روشنایی از استاندارد
- ✅ **onErrorClear** در ۳ فرم
- ✅ **کد سالن** + ۵ ماده litter جدید
- ✅ **نمایش ×N** به جای درصد > ۱۰۰
- ✅ **fallback** نمایش دستی ventilation/light

### فاز ۹ — انکوباسیون + استاندارد بستر (تموم — جلسه ۶)
- ✅ **استاندارد بستر per-material** — `kgPerM2ByMaterial` (رول کاغذی ۰.۳، ماسه ۲۵، کاه ۵، ...)
- ✅ **migration** برای override قدیمی (`set/store.ts` merge)
- ✅ **نمایش اعشار صحیح** در LitterEditor (`decimals={2}`)
- ✅ **کاهش وزن تخم** — ۲ فیلد + `calcWeightLossPct` + محاسبه زنده + نمایش
- ✅ **`weightLossMinPct/MaxPct`** در `IncubationStandard` (۱۱-۱۳)
- ✅ **هشدار alt** — کاهش وزن خارج بازه (روز ۷-۱۸)
- ✅ **پروفایل دما/رطوبت روز‌به‌روز** (`IncubationPhase` + ۸ پروفایل Ross 308)
- ✅ **`getIncubationPhase` + `getExpectedTempHumidity`** (pure)
- ✅ **نمایش «🌡 هدف امروز»** در `EggEntryCard`
- ✅ **`IncubationProfileEditor`** (UI ویرایشگر با پروفایل پیش‌فرض)
- ✅ **اتصال به `ProductionSection`** (تب 🥚 تولید)
- ✅ **Extensibility تأیید شد** — نژاد جدید از Master Data با پروفایل کپی می‌شه
- ✅ **EST + چرخش + CO₂/O₂** — ۵ فیلد استاندارد + پایش زنده در `DeviceFormModal`
- ✅ **هشدار alt** — EST خارج بازه + CO₂/O₂ (دستگاه‌های فعال)
- ✅ **`inc/needs.ts`** — ۶ تابع pure (تهویه، چرخش، ذخیره، هچ، chick yield)
- ✅ **نمایش ذخیره‌سازی تخم** در `EggEntryCard`
- ✅ **نمایش Chick Yield** در `HatchCard`
- ✅ **پایش زنده در کارت دستگاه** — ۵ فیلد (دما/رطوبت/EST/CO₂/O₂)
- ✅ **وضعیت چرخش** (`turningCurrent`) + هشدار قبل/بعد lockdown
- ✅ **fix باگ save** — پایش زنده (estCurrent/co2Current/o2Current) قبلاً ذخیره نمی‌شد
- ✅ **نمودار روند** — `DeviceReading` + LineChart + ۵ metric

### فاز ۸ — ابزارها + hal نهایی (تموم — جلسه ۵)
- ✅ **ESLint** نصب + config (no-unused-imports, no-explicit-any, prefer-const)
- ✅ **GitHub Actions CI** — چک خودکار tsc + test + build روی هر push
- ✅ **`scripts/check-any.py`** — چک any قبل از commit
- ✅ **`docs/TYPE-REGISTRY.md`** — جدول تایپ‌های ماژول‌ها
- ✅ **Alias های پروژه** (`af`, `chk`, `hal`, ...) — سرعت × ۳
- ✅ **hal صفر any** (۹۶ → ۶ migration)
- ✅ **ESLint `--fix` روی ۱۵ ماژول** (۲۳۰ خط import مرده حذف)
- ✅ **rename تایپ‌ها** — `*Payload` (Zod) vs `*FormData` (form)
- ✅ **hint هوشمند** — حذف تکراری‌ها طبق AUDIT
- ✅ **۱۰۶۸ تست pass** (۱۱ تست جدید hal)

---

## 📋 Roadmap تفصیلی — کارهای آینده

### 🔴 بحرانی (اولویت ۱)

#### ۱. ~~Error Boundary~~ ✅ حل شده (جلسه ۴)
- **وضعیت:** `main.tsx:48` + `ErrorFallback` + `logError` + تست
- **نتیجه:** ✅ انجام شد

#### ۲. ~~Export/Import JSON~~ ✅ حل شده (جلسه ۴)
- **وضعیت:** `BackupTab.tsx` + `backup.ts` (۷ تابع) + `AutoBackup` فعال
- **نتیجه:** ✅ انجام شد

#### ۳. Decimal.js
- **چیه؟** محاسبه دقیق اعشاری
- **چرا؟** جیره + مالی (الان باگ داریم: 0.1 + 0.2 = 0.30004)
- **زمان:** ۱ روز

#### ۴. ~~رفع ۲ تست fail~~ ✅ حل شده (جلسه ۴)
- **وضعیت:** ✅ ۱۰۶۸/۱۰۶۸ pass
- **زمان:** -

#### ۵. `any` cleanup ادامه
- **چیه؟** ۶۸۵ → ۵۴۸ (۲۰٪ کاهش در جلسه ۵)
- **چرا؟** جلوگیری از باگ‌های پنهان (مثل `c.fullName` که هیچ‌وقت نبود)
- **هدف:** صفر
- **زمان:** ۳-۴ روز
- **الگو:** `scripts/check-any.py` + `docs/TYPE-REGISTRY.md`

#### ۶. Multi-Select گله‌ها
- **چیه؟** انتخاب چندتایی برای حذف/آرشیو گروهی
- **چرا؟** کاربر با ۱۰ گله باید دونه‌دونه حذف کنه
- **زمان:** ۱ روز

---

### 🟡 مهم (اولویت ۲)

#### ۶. اتصالات باقی‌مونده
- `tra → egg` — فروش تخم از EggSale به tra.Invoice
- `fed → dlg` — جیره فعال به فرمول پیش‌فرض dlg
- `inc → flk` — candling آپدیت گله
- `cal → inc/dlg` — برنامه واکسن فعال
- `alt rules` — هشدارهای خودکار
- **زمان:** ۳-۴ روز

#### ۷. Event Bus
- **چیه؟** سیستم ارتباط بین ماژول‌ها بدون import مستقیم
- **چرا؟** با ۲۰ ماژول، circular dependency ایجاد می‌شه
- **زمان:** نیم روز

#### ۸. TanStack Virtual
- **چیه؟** virtualization
- **چرا؟** لیست‌های طولانی کند می‌شن
- **زمان:** نیم روز

#### ۹. ثبت چند بار در روز
- **چیه؟** کاربر صبح و عصر می‌ره سالن
- **گزینه‌ها:** یک رکورد / چند رکورد / هیبرید
- **زمان:** ۱-۲ روز

#### ۱۰. تقویم حرفه‌ای (Doran Calendar)
- **چیه؟** @doranjs/react — تقویم فارسی کامل
- **چرا؟** تایپ مستقیم، range picker، agenda، Zod
- **زمان:** ۱ روز

#### ۱۱. i18n پایه
- **چیه؟** رشته‌ها تو fa.ts متمرکز
- **چرا؟** بعداً اضافه کردن انگلیسی راحت
- **زمان:** ۱ روز

#### ۱۲. Driver.js (تور آموزشی)
- **چیه؟** تور مرحله‌به‌مرحله کاربر جدید
- **زمان:** ۱ روز

---

### 🟢 کم‌اهمیت (اولویت ۳)

#### ۱۳. Refactor فایل‌های بزرگ
- ui.tsx (۱۲۵۲ خط به ۵ فایل)
- DailyLogsPage.tsx (۱۱۸۸ خط)
- EggEntriesPage.tsx (۱۱۳۹ خط)
- FlocksPage.tsx (۱۰۰۱ خط)
- **زمان:** ۳-۴ روز

#### ۱۴. حذف کد تکراری
- num, int, toFa تو ۱۵+ فایل تکرار شده
- انتقال به shr/utils/
- **زمان:** ۱ روز

#### ۱۵. UI/UX یکسان‌سازی
- کارت‌ها، Badgeها، Padding/Gap، سرگروه‌ها
- **زمان:** ۲-۳ روز

#### ۱۶. Gauge (نمایشگر دما/رطوبت)
- نمایشگر عقربه‌ای مثل سرعت‌سنج
- **زمان:** ۱ روز

#### ۱۷. مقایسه گله‌ها
- مقایسه گله قدیمی با جدید
- **زمان:** ۲-۳ روز

#### ۱۸. react-aspect-ratio
- جلوگیری از CLS
- **زمان:** نیم روز

#### ۱۹. Property-based Testing
- تست با هزاران ترکیب
- **زمان:** اختیاری

---

### 🔵 بلندمدت

#### ۲۰. PWA offline کامل
#### ۲۱. i18n انگلیسی (react-i18next)
#### ۲۲. A11y Audit
#### ۲۳. E2E Tests (Playwright)
#### ۲۴. Backend (multi-user)
#### ۲۵. React Native

---

## 📌 کارهای نیمه‌کاره قبلی

- ۲۶. inc به flk (candling)
- ۲۷. alt rules
- ۲۸. cal (تقویم واکسن فعال)
- ۲۹. Hen-Day و Hen-Housed خودکار
- ۳۰. EggSale.flockId
- ۳۱. Migration FlockEvent
- ۳۲. ادغام/گروه گله
- ۳۳. چک‌لیست آماده‌سازی سالن

---

## ❓ سؤال‌های باز (منتظر جواب کاربر)

### سؤال ۱: ثبت چند بار در روز
- الف) یه رکورد در روز
- ب) چند رکورد (صبح + عصر جدا)
- ج) هیبرید — پیشنهاد

### سؤال ۲: پایان چرخه گله
- الف) حذف کامل
- ب) آرشیو — پیشنهاد
- ج) فروش

### سؤال ۳: کتابخانه‌ها
- TanStack Virtual؟ (بله)
- react-aspect-ratio؟ (نیمه)
- Driver.js؟ (نیمه)

### سؤال ۴: Multi-Select حذف گروهی
- الف) یه تأیید برای همه — پیشنهاد
- ب) هر گله جدا
- ج) بدون تأیید

### سؤال ۵: cascade حذف
- الف) همه چیز حذف
- ب) ارجاع‌ها بمونن
- ج) فقط اگه ارجاع نداره — پیشنهاد

---

## 🎯 ترتیب پیشنهادی اجرا

### هفته ۱
1. ErrorBoundary
2. Export/Import JSON
3. Decimal.js

### هفته ۲
4. Multi-Select گله‌ها
5. Event Bus
6. اتصالات (tra→egg, fed→dlg)

### هفته ۳
7. TanStack Virtual
8. ثبت چند بار در روز
9. Doran Calendar

### هفته ۴
10. Driver.js
11. i18n پایه
12. UI/UX یکسان

### هفته ۵-۶
13. Refactor فایل‌های بزرگ
14. حذف کد تکراری
15. مقایسه گله‌ها

---

## 📊 آمار کلی

| دسته | تعداد | زمان |
|---|---|---|
| بحرانی | ۴ (۲ حل‌شده) | ۲.۵ روز |
| مهم | ۷ | ۸-۹ روز |
| کم‌اهمیت | ۷ | ۸-۱۰ روز |
| بلندمدت | ۶ | ۱-۲ ماه |
| نیمه‌کاره | ۸ | ۵-۷ روز |
| **جمع** | **۳۲** | **~۲۴ روز** |

### 📊 پیشرفت جلسه ۵ (۱۴۰۴/۰۷/۲۱)
| مورد | قبل | بعد |
|---|---|---|
| hal | ۹۰٪ | **۱۰۰٪** ✅ |
| `any` کل | ۶۸۵ | **۵۴۸** (۲۰٪ کاهش) |
| تست‌ها | ۱۰۶۴ | **۱۰۶۸** |
| ESLint | ❌ | ✅ |
| GitHub Actions CI | ❌ | ✅ |
| Alias ها | ❌ | ✅ |
