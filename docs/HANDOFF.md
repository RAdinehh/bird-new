# 🤝 HANDOFF.md — سند تحویل به AI بعدی

> **این سند نقشه‌ی راه توئه. اول این رو کامل بخون.**
> آخرین به‌روزرسانی: ۱۴۰۴/۰۷/۲۱ (جلسه ۶ — انکوباسیون + استاندارد بستر)

---

## 📌 بخش ۱ — خلاصه وضعیت

### پروژه چیه؟
**Bird-new** — PWA مدیریت مرغداری (React + TS + Vite + Zustand + Zod + date-fns-jalali)

### وضعیت کلی
- tsc ✅ ۰ خطا
- تست‌ها: ✅ ۱۰۶۸/۱۰۶۸ pass
- build ✅ موفق

### آمار
| مورد | مقدار |
|---|---|
| ماژول | ۲۰ |
| خطوط کد | ~۶۵٬۰۰۰ |
| فایل تست | ۱۴۵ |
| Bundle | ~۱.۹ MB |
| درصد کلی | ~۸۶٪ |

### قفل‌شده (تموم و تأییدشده)
- ✅ `set` (تنظیمات + استانداردها)
- ✅ `brd` (پرنده و نژاد)
- ✅ `hal` (سالن‌ها + بخش‌ها + تجهیزات) — ۱۰۰٪ (جلسه ۵)
- ✅ `doc` (اسناد)
---

## 📚 بخش ۲ — مستندات مرجع

**ترتیب مطالعه:**

| # | فایل | نقش | اولویت |
|---|---|---|---|
| ۱ | `HANDOFF.md` (این) | وضعیت + برنامه | 🔴 اول |
| ۲ | `FOUNDATION.md` | قوانین آهنین (۱۳ بخش) | 🔴 |
| ۳ | `FOUNDATION-PATTERNS.md` | الگوهای تفکر (۱۶ بخش) | 🔴 |
| ۴ | `ARCHITECTURE.md` | نقشه فایل‌ها + وابستگی | 🟡 |
| ۵ | `AI-RULES.md` | پروتکل کار با کاربر | 🟡 |
| ۶ | `STANDARDS.md` | استانداردهای UI/UX | 🟢 |
| ۷ | `AUDIT.md` | چک‌لیست ۷ محوره | 🟢 |
| ۸ | `AUDIT-BRD.md` | ممیزی brd | مرجع |
| ۹ | `AUDIT-HAL.md` | ممیزی hal | مرجع |
| ۱۰ | `STATUS.md` | نقشه راه (قدیمی — فقط کارها) | 🟢 |

**قانون:** اگه بین `STATUS.md` و `FOUNDATION.md` تضاد دیدی، **FOUNDATION برنده‌ست**.
---

## 📊 بخش ۳ — وضعیت ماژول‌ها

| ماژول | وضعیت | نکته |
|---|---|---|
| `set` تنظیمات | ✅ ۹۰٪ | استانداردها |
| `brd` پرنده/نژاد | ✅ ۱۰۰٪ | قفل‌شده، ممیزی کامل |
| `hal` سالن | ✅ ۱۰۰٪ | قفل‌شده (جلسه ۵) |
| `ctc` مخاطبین | ✅ ۸۵٪ | — |
| `flk` گله | 🟡 ۷۰٪ | cascade نیمه |
| `dlg` ثبت روزانه | 🟡 ۷۰٪ | cascade نیمه |
| `egg` تخم | ✅ ۹۰٪ | — |
| `whs` انبار | ✅ ۸۵٪ | — |
| `fed` جیره | 🟡 ۷۵٪ | cascade نیمه |
| `inc` جوجه‌کشی | 🟡 ۷۰٪ | cascade نیمه |
| `tra` معاملات | 🟡 ۷۰٪ | — |
| `alt` هشدارها | 🟡 ۶۰٪ | validation نیست |
| `cal` تقویم | 🟡 ۷۰٪ | — |
| `dsh` داشبورد | 🟡 ۷۰٪ | — |
| `rep` گزارش | 🟡 ۷۰٪ | — |
| `doc` اسناد | ✅ ۱۰۰٪ | — |
| `arc` آرشیو | 🟡 ۷۰٪ | — |


---

## 🛠 بخش ۳.۵ — ابزارهای نصب‌شده (جلسه ۵)

### 🔧 Alias ها (~/.bashrc)
| Alias | کار |
|---|---|
| `af` | `python3 ~/auto_fast.py` |
| `chk` | `python3 scripts/check-any.py` |
| `hal` / `brd` / `flk` / ... | پرش سریع به ماژول |
| `tsc` / `vit` / `gs` / `gl` | دستورات سریع |
| `dev` | اجرای dev server |

### 🤖 GitHub Actions CI
- فایل: `.github/workflows/ci.yml`
- با هر push: tsc + test + build
- اگه خطا: ایمیل/نوتیفیکیشن

### 🔍 ESLint + پلاگین‌ها
- فایل: `eslint.config.js`
- `no-unused-imports`: error (auto-fix)
- `no-explicit-any`: warn
- `prefer-const`: error

### 📊 scripts/check-any.py
- اجرا در auto_fast.py (مرحله ۳)
- نمایش: تعداد `any` در فایل‌های staged
- گزینه `--all`: کل پروژه

### 📚 docs/TYPE-REGISTRY.md
- جدول همه‌ی تایپ‌های ماژول‌ها
- Hook ها و تایپ برگشتی
- قواعد جایگزینی `any`

### 🏷 الگوهای جدید تایپ‌ها
- `*Payload` — برای Zod schema (number)
- `*FormData` — برای form state (string)
- مثال: `HallPayload` vs `HallFormData`

---

## 🔴 بخش ۴ — کارهای باقی‌مونده

### ✅ قبلاً حل شده (تأیید ۱۴۰۴/۰۷/۲۰)
- [x] **ErrorBoundary ریشه‌ای** — `main.tsx:48` + `ErrorFallback` + `logError` + تست
- [x] **Export/Import JSON** — `BackupTab.tsx` + `backup.ts` (۷ تابع) + `AutoBackup` فعال در `App.tsx`

### 🔴 بحرانی باقی‌مونده
- [ ] **Decimal.js** — بررسی عمیق‌تر (فعلاً `parseFloat` ساده در `fa.ts`)
- [ ] **`any` cleanup ادامه** — ۶۸۵ → ۵۴۸ (۲۰٪ کاهش در جلسه ۵)؛ هدف: صفر
- [ ] **فرم‌های بلند hal** — HallsFormModal (۱۶ فیلد), EquipmentFormModal (۱۵)

### 🟡 مهم
- [ ] **اتصالات باقی‌مونده:**
  - `tra → egg` (فروش تخم)
  - `fed → dlg` (جیره فعال)
  - `inc → flk` (candling)
  - `cal → inc/dlg` (واکسن)
  - `alt rules` (هشدار خودکار)
- [ ] **Multi-Select گله**
- [ ] **Event Bus** (کاهش circular dependency)

### 🟢 کم‌اهمیت
- [ ] Refactor فایل‌های بزرگ (DailyLogsPage ۱۱۸۸، EggEntriesPage ۱۱۳۹، FlocksPage ۱۰۰۱)
- [ ] حذف کد تکراری (`num`, `int`, `toFa` توی ۱۵+ فایل)
- [ ] UI/UX یکدست‌سازی
- [ ] i18n پایه
- [ ] Virtualization (TanStack Virtual)
- [ ] تقویم حرفه‌ای (Doran Calendar)

### 🔵 بلندمدت
- [ ] PWA offline کامل
- [ ] Backend (multi-user)
- [ ] React Native
- [ ] E2E tests (Playwright)
---

## 🧠 بخش ۵ — پروتکل کار با کاربر

### قاعده ۱: کاربر کدنویس نیست
- اسکریپت Python کوتاه (زیر ۱۰۰ خط)
- کاربر فقط کپی/پیست می‌کنه
- **پاسخ فارسی، بدون اصطلاح پیچیده**
- کاربر توکن محدود داره → خلاصه و دقیق

### قاعده ۲: قبل از هر تغییر
- **فایل واقعی رو ببین** (`cat` یا `sed -n`)
- **گمان نزن** — anchor حدسی نزن
- اگه شک داری، **بهترین راه‌حل رو خودت انتخاب کن**

### قاعده ۳: یه تغییر در هر مرحله
- نکن چند کار با هم
- بعد از هر تغییر: `python3 ~/auto_fast.py "پیام"`
- اگه tsc خطا داد → **rollback، نه fix**

### قاعده ۴: کامپوننت‌های قفل‌شده 🔒
`SelectSheetShell`, `SmartSelect`, `EditableSelect`, `AutocompleteSheet`, `DependentSelect`, `Field`, `Input`, `EntityLink`, `OverrideHint`, `ExpandableCard`

**بدون اجازه‌ی صریح کاربر، دست نزن.**

### قاعده ۵: درخواست‌های چندگانه
1. لیست کن
2. به کاربر نشون بده
3. یکی‌یکی انجام بده
4. آخر همه رو یادآوری کن

### قاعده ۶: کامیت
```
cd ~/Bird-new && python3 ~/auto_fast.py "پیام commit"
```
خودش: tsc → build → commit → push → rollback اگه خطا
---

## 🚦 بخش ۶ — از کجا شروع کنی

### گام ۰: verify وضعیت
```bash
cd ~/Bird-new
git log --oneline -5
git status -s
npx tsc --noEmit 2>&1 | tail -3
```

### گام ۱: بخون (ترتیب بخش ۲)
- `FOUNDATION.md`
- `FOUNDATION-PATTERNS.md`
- `ARCHITECTURE.md`

### گام ۲: از کاربر بپرس
«از کجا شروع کنیم؟»
- **کارهای فوری** → بخش ۴ بحرانی
- **استاندارد کامل** → فاز A→E
- **ماژول خاص** → بپرس کدوم

### گام ۳: شروع کن
- یه تغییر در هر مرحله
- commit بعد هر تغییر
- اگه شکستی، برگرد نه fix

---

## 📞 بخش ۷ — دستورات سریع

```bash
cd ~/Bird-new

# اجرا
npm run dev -- --host 0.0.0.0 --port 3000

# تست
npm test -- --run

# TypeScript
npx tsc --noEmit

# Build
npm run build

# کامیت + push
python3 ~/auto_fast.py "پیام"

# Git
git log --oneline -10
git tag before-XXX-YYYYMMDD
```
---

## ⚠️ بخش ۸ — نکات حیاتی

### ۱. localStorage کلیدها
`pm-settings`, `pm-brd`, `pm-hal`, `pm-ctc`, `pm-flk`, `pm-inc`, `pm-egg`, `pm-dlg`, `pm-whs`, `pm-fed`, `pm-tra`, `pm-alt`, `pm-cal-manual`, `pm-theme`, `pm-custom-options`, `pm-custom-species`

### ۲. قوانین بیولوژیکی (biological.ts)
- Hen-Day: زیر ۱۰۲٪
- تخم: وزن ۳۵-۸۵ گرم
- جوجه: وزن ۲۰-۶۰ گرم
- Chick yield: ۶۴-۷۱٪
- FCR: ۱.۰-۵.۰
- دان/پرنده: ۱۰-۲۶۰ گرم/روز

### ۳. نکات محیطی
- °C در DB، °F فقط نمایش
- استانداردها بر اساس نژاد، نه فقط پرنده
- DB تومان پایه
- 100svh نه 100dvh روی موبایل
- کش PWA مشکل اصلی تست: **Unregister Service Worker** قبل تست

### ۴. Master Data vs Operations (قانون ۱۶)
- استانداردها فقط توی `/set`
- پرنده‌ها فقط توی `مدیریت پرنده‌ها`
- توی `/brd`: فقط انتخاب، نه ساخت
---

## 🎬 بخش ۹ — تاریخ جلسات

### جلسه ۱ (۱۴۰۴/۰۷/۲۰)
- ممیزی اولیه brd
- ۳ false positive کشف شد
- ساخت `FOUNDATION.md` و `AUDIT-BRD.md`

### جلسه ۲ (۱۴۰۴/۰۷/۲۰ — بعد)
- ۱۱ fix موفق روی brd
- refactor BirdForm, BirdCard, BreedForm, BreedCard
- Zod + توکنی‌سازی کامل

### جلسه ۳ (۱۴۰۴/۰۷/۲۰ — دوم)
- اضافه شدن ۳ استاندارد مرغ مادر
- اضافه شدن turkeys (۴)، ducks (۵)، geese (۵)
- `_display-name` + `_display-values` (Single Resolver)
- `species.ts` + `customSpecies`
- Master Data vs Operations (قانون ۱۶)
- ممیزی کامل hal + تمیزکاری
- `AUDIT-HAL.md`

### جلسه ۴ (۱۴۰۴/۰۷/۲۰ — سوم)
- بازنویسی کامل `HANDOFF.md`
- حذف تکراری‌ها
- یک سند مرجع


### جلسه ۹ (۱۴۰۴/۰۷/۲۱ — جلسه پنجم) — تجهیزات (hal) ✅
- ✅ **حذف کد تکراری** EquipmentFormModal — بلوک «وضعیت+تاریخ خرید» ۲ بار بود → ۱ بار
- ✅ **hook جدید** `useBodyScrollLock` در `shr/hooks/` — قفل اسکرول بدن
- ✅ **HallEquipSection** از ۴۰۶ → **۳۸۵ خط** (زیر ۴۰۰) با استفاده از hook
- ✅ **EquipmentFormModal** از ۲۷۱ → **۲۵۶ خط**

### جلسه ۸ (۱۴۰۴/۰۷/۲۱ — جلسه چهارم) — Zones بهبود ✅
- ✅ **crossError** — بلاک قاطع save اگه مجموع ظرفیت بخش‌ها > ظرفیت سالن
  - `crossWarn` → `crossError` (معنای دقیق‌تر)
- ✅ **توکنی‌سازی** کارت «ارثی از سالن»:
  - `padding: '6px 10px'` → `var(--pad-tight)`
  - `gap: 6` → `var(--sp-2)`
  - `lineHeight: 1.6` → `1.7`
  - `marginTop: -4` → `calc(-1 * var(--sp-1))`
- ✅ **حذف تکرار «پرنده»** از hint ظرفیت (دو خطی بود)
- ✅ **استخراج `ZoneCard.tsx`** (۸۱ خط):
  - `ZonesPage.tsx`: ۴۱۹ → **۳۹۰ خط** ✅ (زیر ۴۰۰)
  - بلوک `list.map` (۷۱ خط) → `<ZoneCard />` (۱۸ خط)
- ✅ **رفع باگ `new Map<string, any[]>`** → `new Map<string, Flock[]>`
- ✅ **حذف ایموجی ⚠️** از error (طبق UX-FORM-RULES ب۱۶)
- ✅ **رنگ `--warn` → `--danger`** برای crossError
- ✅ **استخراج `handleDelete`** (منطق تأیید + Undo + Toast)

### جلسه ۷ (۱۴۰۴/۰۷/۲۱ — جلسه سوم) — hal نهایی + UX فرم
- ✅ **۲۵+ fix روی hal** (Halls + Zones + Equipment)
- ✅ **۹ باگ پنهان** کشف و fix شد:
  - `zoneId` در `buildPayload` نبود → بخش از دست می‌رفت
  - `ErrorBox` در `EquipmentFormModal` نداشت
  - **`litter_roll ≠ paper_roll`** → ۱۰ برابر خطا در محاسبه بستر
  - `ventilation`/`light` از تجهیزات sync نمی‌شد
  - `realCapacity = area × 9` hardcode
  - `lampEfficiency = 100` hardcode
  - **`birdId` از `breedId` مشتق می‌شد** (خطای منطقی)
  - **`fan_tunnel stdKey = fanM3PerKg`** (ظرفیت ۴.۵ به جای ۴۰۰۰)
  - **`lamp_led stdKey = lampWattPerM2`** (ظرفیت ۳ به جای ۱۰)
- ✅ **گروه‌بندی بصری** HallsFormModal (۵ گروه) + EquipmentFormModal (۴ گروه)
- ✅ **حذف گروه ⚙️ سیستم‌ها** از فرم سالن (Single Source)
- ✅ **sync کامل** Hall ↔ Equipment (شامل `ventilation`/`light`)
- ✅ **onErrorClear** در ۳ فرم + خطا فقط بعد از ذخیره (saveAttempted)
- ✅ **کد سالن** + ۵ ماده litter جدید
- ✅ **auto-fill کامل** + اعداد فارسی (capacity/temp/humidity/light/litter/feeder/drinker)
- ✅ **کارت‌های KPI دو ستونه** تجهیزات (Big Dutchman style)
- ✅ **مدال تجهیزات** با نوار پیشرفت + وضعیت رنگی + آیکون در هدر
- ✅ **Placeholder های فارسی** مختصر برای همه فیلدها
- ✅ **کارت سالن** Grid2 (ابعاد + هویت + شرایط + زمان‌ها)
- ✅ **استاندارد دانخوری/آبخوری** ۸ نژاد (bucket/pan/chick + fountain)
- ✅ **۲۲ hint استاندارد** برای همه تجهیزات
- ✅ **حذف `turkey_goose.ts`** legacy
- ✅ **جدید در FOUNDATION ب۳.۷** — قوانین UX فرم

### جلسه ۶ (۱۴۰۴/۰۷/۲۱ — بعد) — انکوباسیون + استاندارد بستر
- ✅ **استاندارد بستر per-material** (`kgPerM2ByMaterial` + migration)
- ✅ **کاهش وزن تخم** (فیلد + محاسبه + نمایش + هشدار alt)
- ✅ **پروفایل دما/رطوبت روز‌به‌روز** (`IncubationPhase` + ۸ نژاد Ross 308)
- ✅ **`IncubationProfileEditor`** + اتصال به `ProductionSection`
- ✅ **نمایش «🌡 هدف امروز»** در کارت ورودی تخم
- ✅ **Extensibility تأیید شد** — نژاد جدید با template، پروفایل کپی می‌شه
- ✅ **EST + CO₂/O₂ + چرخش** (۵ فیلد استاندارد + پایش زنده Device)
- ✅ **هشدار alt** — EST/CO₂/O₂ (دستگاه‌های فعال)
- ✅ **`inc/needs.ts`** — ۶ تابع pure (تهویه، چرخش، ذخیره، هچ، chick yield)
- ✅ **نمایش ذخیره‌سازی تخم** در EggEntryCard + **Chick Yield** در HatchCard
- ✅ **پایش زنده در کارت دستگاه** (دما/رطوبت/EST/CO₂/O₂)
- ✅ **وضعیت چرخش** + هشدار قبل/بعد lockdown
- ✅ **fix باگ save** — پایش زنده
- ✅ **نمودار روند** — `DeviceReading` + LineChart
- ✅ **مستندسازی** به‌روز

### جلسه ۵ (۱۴۰۴/۰۷/۲۱) — hal کامل + ابزارها ⭐
**کارهای انجام‌شده:**
- ✅ **hal کامل (۱۰۰/۱۰۰)** — ۹۶ `any` → ۶ (فقط migration — justified)
- ✅ **Cascade کامل** — سالن/بخش/تجهیز
- ✅ **رفع باگ قدیمی hooks** — انتقال `flocksByZone` قبل از return
- ✅ **هماهنگی وضعیت‌های تجهیز** — `broken`/`repair`/`maintenance`
- ✅ **هشدارهای خودکار تجهیزات** در `alt` و `dsh`
- ✅ **ESLint نصب + config** — قوانین `no-unused-imports`, `no-explicit-any`, `prefer-const`
- ✅ **GitHub Actions CI** — `.github/workflows/ci.yml` (tsc + test + build)
- ✅ **`scripts/check-any.py`** — چک `any` قبل از commit
- ✅ **`docs/TYPE-REGISTRY.md`** — جدول تایپ‌ها
- ✅ **Alias های پروژه** — `af`, `chk`, `hal`, `brd`, ...
- ✅ **حذف خودکار ۸۳ `any`** — از callback ها (۲۸ فایل)
- ✅ **ESLint `--fix` روی ۱۵ ماژول** — ۲۳۰ خط import مرده حذف
- ✅ **rename تایپ‌ها** — `*Payload` (Zod) vs `*FormData` (form)
- ✅ **hint های هوشمند** — حذف تکراری‌ها طبق AUDIT
- ✅ **۱۱ تست جدید hal** — مجموع ۱۰۶۸ تست pass
- ✅ **مستندات** — `HANDOFF.md`, `STATUS.md`, `FOUNDATION.md`, `AI-RULES.md`

**درس‌های مهم:**
- ⚠️ ESLint `--fix` روی `set` فایل رو خالی کرد → rollback با `git tag`
- ⚠️ regex روی import ها خطرناکه → جایگزینی دقیق
- ✅ `any` مخفی رو کشف کرد (`c.fullName` که هیچ‌وقت نبود)
- ✅ ابزارها سرعت رو ۳-۵ برابر کردن

---

## ⚠️ بخش ۱۰ — هشدار نهایی

**پروژه ۶+ ماه کار و سرمایه‌گذاری کاربره. احترام بذار.**

۱. **قبل از هر تغییر، ۳ بار فکر کن.**
۲. **اگه شک داری، نکن.**
۳. **اگه کاربر گفت «کار می‌کنه»، دست نزن.**
۴. **اگه کاربر گفت «خرابه»، برگرد به نسخه سالم — نه fix.**

**هدف نهایی:** نرم‌افزار سطح اپل/گوگل برای مدیریت مرغداری.

**موفق باشی!** 🐦
