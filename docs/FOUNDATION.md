# 🏛 FOUNDATION.md — پایه‌ی معماری Bird-new

> این سند مرجع توکن‌ها، قراردادها و قوانین آهنین است.
> آخرین به‌روزرسانی: ۱۴۰۴/۰۷/۲۰

---

## بخش ۱ — قرارداد توکن‌ها

منبع: `src/shr/styles/global.css` (۵۴۰ خط، کاملاً مجهز)

### ۱.۱ رنگ‌ها

| کاربرد | توکن | نکته |
|---|---|---|
| پس‌زمینه اصلی | `--bg` | بدنه صفحه |
| پس‌زمینه کارت | `--btn-bg` | کارت روی bg |
| پس‌زمینه ورودی | `--input-bg` | input ها |
| پس‌زمینه هدر | `--header-bg` | هدر شفاف |
| مرز | `--border` / `--border-solid` | شفاف / توپر |
| متن اصلی | `--text` | تیتر، پاراگراف |
| متن کم‌رنگ | `--muted` | توضیح ثانویه |
| تاکید | `--accent` | دکمه اصلی، لینک |
| تاکید soft | `--accent-soft` | پس‌زمینه رنگی ملایم |
| تاکید border | `--accent-border` | مرز رنگی |
| هشدار | `--warn` + `--warn-soft` | زرد/نارنجی |
| خطر | `--danger` + `--danger-soft` | خطا، حذف |
| اطلاعات | `--info` + `--info-soft` | آبی، راهنما |
| ویژه | `--purple` + `--purple-soft` | بج، تگ |
| متن روی دکمه | `--avatar-text` | جایگزین `#fff` |
| پوشش مودال | `--overlay` | پس‌زمینه دیالوگ |
| دسته‌بندی | `--cat-*-soft` | ۱۴ توکن تجهیزات |

**استثناهای مجاز (hex مجاز):**
- `src/cor/theme/applyTheme.ts`
- `src/cor/events/DebugPanel.tsx`
- `src/shr/utils/export.ts`
- هر `InvoicePrint.tsx`

**قانون:** هیچ `#hex` توی JSX. همیشه `var(--*)`.

### ۱.۲ فاصله‌ها

| توکن | مقدار | کاربرد |
|---|---|---|
| `--sp-1` | ~4px | خیلی کم |
| `--sp-2` | ~8px | کم |
| `--sp-3` | ~12px | متوسط |
| `--sp-4` | ~14-16px | راحت |
| `--sp-5` | ~16-20px | بزرگ |
| `--sp-6` | ~20-24px | خیلی بزرگ |
| `--sp-7` | ~24px | بزرگ‌تر |
| `--sp-8` | ~32px | خیلی زیاد |

ترکیب‌های آماده: `--pad-tight`، `--pad-normal`، `--pad-comfy`، `--pad-loose`، `--gap-xs/sm/md/lg`

**قانون:** هیچ `padding: 16` هاردکد. → `padding: var(--sp-5)`.
**نکته:** media query مقدار `--sp-unit` رو ریسپانسیو می‌کنه.
**استثنا:** `padding: 0` مجاز ئه — برای دکمه‌های مربعی آیکونی و reset ها.

### ۱.۳ Radius

| توکن | مقدار | کاربرد |
|---|---|---|
| `--r-sm` | 6-8px | chip، تگ کوچیک |
| `--r-md` | 8-10px | دکمه، input |
| `--r-lg` | 12px | کارت |
| `--r-xl` | 16px | sheet، مودال |
| `--r-2xl` | 20px | کارت بزرگ |

### ۱.۴ فونت

- اندازه: `--fs-xs/sm/md/lg/xl`
- وزن: ۴۰۰ (معمولی) / ۶۰۰ (تاکید) / ۷۰۰ (تیتر)
- **ممنوع:** `fontSize: 13` هاردکد — همیشه توکن

---

## بخش ۲ — Contracts (قرارداد بین لایه‌ها)

### ۲.۱ Store Contract

هر Zustand store **باید** با این ساختار تعریف شه:

    export const useXxx = create<State>()(
      persist(
        (set, get) => ({ /* actions */ }),
        { name: 'pm-xxx' }
      )
    );

**قوانین:**
- `name:` اجباری — بدون اون persist کار نمی‌کنه
- اگه schema تغییر کرد → `merge` هم به‌روز شه
- Store های aggregate (مثل `cal`, `dsh`) نباید persist داشته باشن
- ذخیره‌سازی بزرگ (مثل `doc`) → IndexedDB، نه persist

**۱۳ store فعال:**
`pm-settings`, `pm-brd`, `pm-hal`, `pm-ctc`, `pm-flk`, `pm-inc`, `pm-egg`, `pm-dlg`, `pm-whs`, `pm-fed`, `pm-tra`, `pm-alt`, `pm-cal-manual`

### ۲.۲ Module Contract

هر ماژول در `src/mod/xxx/`:

| فایل | اجباری؟ | نقش |
|---|---|---|
| `index.tsx` | فقط اگه ۲+ تب | tab wrapper |
| `store.ts` | فقط اگه داده مستقل داره | Zustand |
| `XxxPage.tsx` | برای هر تب | صفحه |
| `_source.ts` | اگه auto/manual داره | تشخیص منبع |
| `presets.ts` | اگه داده پیش‌فرض داره | مقادیر اولیه |

**مثال چند-تب:** `brd/` (BirdsPage + BreedsPage)
**مثال تک‌صفحه:** `dsh/` (فقط Dashboard.tsx، بدون index.tsx)


### ۲.۳ Filter Contract

هر ماژول فیلترش توی `src/shr/filter/configs/xxx.tsx`:

    export function getXxxConfig(ctx: { ... }): FilterConfig<Entity> {
      return {
        filterDefs: [{ key, label, kind, icon, options, getValue }],
        sortDefs:   [{ key, label, icon, hint, compare }],
      };
    }

**قوانین:**
- همه config ها توی `shr/filter/configs/`
- تایپ‌ها توی `_types.ts` همون پوشه
- همیشه از `FilterBar` استفاده کن، نه فیلتر دستی

### ۲.۴ Validation Contract

- هر ماژول → یه فایل توی `src/shr/validation/rules/xxx.ts`
- خروجی: Zod schemas
- `validation/index.ts` همه رو re-export می‌کنه
- فرم‌ها باید از schema استفاده کنن، نه validation دستی

### ۲.۵ EntityLink Contract

لینک بین ماژول‌ها فقط با `EntityLink`:

    <EntityLink type="flock" id={id} label="گله ۱" />

**انواع مجاز:** flock، bird، breed، hall، party، invoice، item، device، log
**اضافه کردن نوع جدید:** فقط با تأیید کاربر + آپدیت MAP در `EntityLink.tsx`

### ۲.۶ Type Naming Convention 🆕

**قانون:** تایپ‌های Zod با تایپ‌های فرم اشتباه نشن.

| تایپ | نقش | مثال |
|---|---|---|
| `*Payload` | داده‌ی Zod (نهایی، `number`) | `HallPayload`, `ZonePayload` |
| `*FormData` | حالت فرم (ورودی، `string`) | `HallFormData`, `ZoneFormData` |

**مثال:**
- ✅ `export type HallPayload = z.infer<typeof HallSchema>` (Zod — number)
- ✅ `export interface HallFormData { length: string }` (Form — string)
- ❌ `export type HallFormData = z.infer<...>` (تضاد!)

**قانون:** هیچ‌وقت دو تایپ متفاوت با یه اسم نباشن.

---

## بخش ۳ — قوانین آهنین

### ۳.۱ کار با کاربر
1. کاربر کدنویس نیست — اسکریپت آماده بده، توضیح فنی نه
2. یه تغییر در هر مرحله — چند کار با هم ممنوع
3. بعد از هر تغییر: `python3 ~/auto_fast.py "پیام"`
4. قبل از تغییر بزرگ تأیید بگیر (shr، layout، store، props)

### ۳.۲ کامپوننت‌های قفل‌شده 🔒

بدون اجازه صریح دست نزن:
- `SelectSheetShell.tsx`, `SmartSelect.tsx`, `EditableSelect.tsx`
- `AutocompleteSheet.tsx`, `DependentSelect.tsx`
- `ui/Field.tsx`, `ui/Input.tsx`
- `EntityLink.tsx`, `OverrideHint.tsx`, `ExpandableCard.tsx`

**اگه کاربر گفت «خرابه»:** اول `git log --oneline -20 -- <file>` بزن، آخرین نسخه سالم رو `checkout` کن، commit کن. **fix نکن**.

### ۳.۳ قوانین کد
- فایل ≤ ۴۰۰ خط (بیشتر شد → refactor تدریجی)
- هیچ `#hex` توی JSX (توکن)
- هیچ `padding: N` هاردکد (توکن)
- هیچ hook بعد از `return` شرطی
- `useEffect` بدون dep کامل → ممنوع
- `any` فقط با comment توضیحی
- **hint که placeholder رو تکرار می‌کنه → ممنوع**
- **فرم > ۷ فیلد → تقسیم به بخش‌های تاشو**
- **Proactive Sweep برای `as any` — نه فقط `: any`**

### ۳.۴ قوانین Git
- `.bak`, `.save*` هرگز commit نشن
- پیام commit با `feat:` / `fix:` / `docs:` / `refactor:`
- قبل از تغییر بزرگ: `git tag before-xxx`
- `auto_fast.py` خودش tsc + build + commit + push + rollback داره

### ۳.۵ مستندات
- هر تغییر مهم → `docs/STATUS.md`
- false positive گزارش خودکار → علامت‌گذاری در `HANDOFF.md`
- استثنا معماری → `ARCHITECTURE.md` با دلیل و تاریخ

### ۳.۶ ESLint + ابزارها 🆕

**قبل از `eslint --fix`:**
1. **`git tag before-eslint-fix-YYYYMMDD`** ← همیشه
2. **فقط یه ماژول** — نه کل پروژه
3. **بعد از fix:** `git diff` رو بخون
4. **اگه مشکوک:** `git checkout` برگردون

**قوانین ESLint پروژه (`eslint.config.js`):**
- `unused-imports/no-unused-imports: error` (auto-fix)
- `unused-imports/no-unused-vars: warn` (بدون auto-fix)
- `@typescript-eslint/no-explicit-any: warn`
- `prefer-const: error`

**⚠️ هشدار:** ESLint `--fix` روی فایل‌های بزرگ خطرناکه (مثال: `set/store.ts` رو خالی کرد → rollback).

**ابزارهای پروژه:**
| ابزار | کار |
|---|---|
| `scripts/check-any.py` | چک `any` قبل از commit |
| `docs/TYPE-REGISTRY.md` | جدول تایپ‌ها |
| `.github/workflows/ci.yml` | CI خودکار (tsc + test + build) |
| `chk` (alias) | چک سریع any |

---
---

### ۳.۷ قوانین UX فرم 🆕 (استخراج‌شده جلسه ۷)

#### ۳.۷.۱ — Placeholder Rules
- **همیشه فارسی** (بدون لغات لاتین)
- **کوتاه** — بدون overflow توی کادر
- **بدون تکرار label** (مثلاً «نام سالن» → placeholder «شمالی»)
- **بدون «مثلاً:»** — خود placeholder نمونه‌ست
- **محو با تایپ** (رفتار پیش‌فرض HTML)
- **فیلد عددی** → نمونه عددی («۱۰»، «۵»، «۳»)
- **فیلد کد فنی** → `dir="ltr"` مجاز

#### ۳.۷.۲ — Required Rules
- **ستاره قرمز ضخیم** (`*` + `fontWeight: 700`, `fontSize: 1.2em`)
- فقط فیلدهای **حیاتی** اجباری:
  - سالن: نام، طول، عرض، ارتفاع، پرنده، نژاد
  - بخش: نام، سالن
  - تجهیز: سالن، دسته، زیرنوع، نام
- دما و رطوبت **آزاد** (auto-fill می‌شن)

#### ۳.۷.۳ — Error Display Rules
- **خطا فقط بعد از `save`** ظاهر شه (نه دائمی)
- **با تایپ پاک شه** (`onErrorClear`)
- **چینش راست‌چین** یکنواخت (`dir="rtl"` + `textAlign: 'right'`)
- **`saveAttempted` state** برای کنترل نمایش
- **بدون آیکون ایموجی** (⚠️/💡 حذف شدن) — فقط متن رنگی

#### ۳.۷.۴ — Auto-fill Rules
- دکمه «✨ پر کردن خودکار» **فقط بعد از انتخاب نژاد** فعال شه
- پر کنه: `capacity`, `targetTemp`, `targetHumidity`, `light`, `litterType`, `feederType`, `drinkerType`
- **آخرین منبع درست:**
  - `capacity` = `area × densityMax`
  - `temp/humidity/light` = `env[0]`
  - `litterType` = `litter.recommended[0]` → map به equipment type
  - `feederType` = `equipment.feeder` (chain/pan/tube/manual)
  - `drinkerType` = `equipment.drinker` (nipple/cup/trough/manual)
- **تمام اعداد فارسی** (`toFa`)
- **Override کاربر** اولویت داره (`autoFields`)

#### ۳.۷.۵ — Layout Rules
- **RTL برای همه** (فارسی)
- **LTR فقط برای کد فنی** (`code`)
- **Grid2/RowGrid برای فیلدهای کوتاه** (عدد، تاریخ، لینک)
- **تک‌ستونه (Row) برای فیلدهای بلند** (متن، لیست، آدرس، یادداشت)
- **`alignItems: 'start'`** برای Grid2 (هم‌ترازی از بالا)
- **`RowGrid`** (کامپوننت جدید در `helpers.tsx`) — گرید ۲ ستونه برای `Row`
- **label مخفی** (`visibility: 'hidden'`) برای هم‌ترازی کادر محاسبه با فیلد

#### ۳.۷.۶ — Single Source of Truth (فرم سالن)
- **گروه ⚙️ سیستم‌ها از فرم سالن حذف شد** — فقط از تب تجهیزات
- `ventilationSystem`, `feederType`, `drinkerType`, `litterType`, `ventilation`, `light` **خودکار** از Equipment sync می‌شن (در `store.ts` — `computeHallPatch`)
- فرم سالن فقط: **هویت، ابعاد، شرایط، زمان‌ها، یادداشت**

---

## بخش ۴ — قوانین بصری (Visual Stability)

| # | قانون |
|---|---|
| ۴.۱ | قبل از تغییر در `shr/` که رفتار بصری داره → **اسکرین‌شات از کاربر** |
| ۴.۲ | فیلد مرکب (input + آیکون/دکمه) → ارتفاع ثابت، آیکون inline/absolute |
| ۴.۳ | Grid2 فقط برای فیلد ساده — مرکب/آبشاری full-width |
| ۴.۴ | هر لیست اسکرولی → همه آیتم‌ها `flexShrink: 0` |
| ۴.۵ | گروه تک‌عضوی → عنوان گروه نشون نده |
| ۴.۶ | همسایه‌ها هم‌ارتفاع، هم‌شکل، هم‌حرکت |

**درس:** این قوانین از باگ‌های واقعی جلسه ۱۴۰۴/۰۷/۲۰ استخراج شدن (overlap در Sheet، تیک زندانی، شکست Grid2).

---

## بخش ۵ — کامل بودن داده (Data Completeness)

| # | قانون |
|---|---|
| ۵.۱ | برای هر taxonomy (پرنده/نژاد/هدف) → چک‌لیست صنعتی |
| ۵.۲ | هر `DEFAULT_*` → منبع مستند (تاریخ + نام سند) |
| ۵.۳ | قبل از قفل ماژول → همه‌ی ترکیب‌های منطقی چک شن |

**درس:** «مرغ مادر» (Breeder) توی استانداردها نبود چون taxonomy ناقص بود.

---

## بخش ۶ — منبع حقیقت (Source of Truth)

| # | قانون |
|---|---|
| ۵.۱ | هر محاسبه با ۲+ منبع → اولویت **مستند** (کد + سند) |
| ۵.۲ | Auto-fill فقط از منبع **معنایی درست** (نه هر چیزی که در دسترسه) |
| ۵.۳ | هر auto-fill → امکان Override + نمایش منبع |

**درس:** FCR از `Breed.fcr` اول، بعد `Bird.fcrStandard` (کد: `useDashboardData.ts:311`).

---

## بخش ۷ — فرآیند افزودن قابلیت (Feature Workflow)

### ۷.۰ Research-First Protocol ⚡

**قبل از شروع هر ماژول/تب/فیلد → ۴ مرحله اجباری:**

#### مرحله ۱ — تحقیق (۵ منبع مرجع)
| منبع | چه چیزی ازش یاد بگیریم |
|---|---|
| 🖥 مهندسی نرم‌افزار | Design Patterns, Clean Code, SOLID |
| 💻 مهندسی کد | Google/Airbnb Style, TypeScript best practices |
| 🎨 مهندسی UI/UX | Apple HIG, Material 3, Nielsen Norman |
| 🐔 مهندسی مرغداری | استانداردهای Ross/Cobb/Hy-Line/Big Dutchman |
| 🌾 مهندسی کشاورزی | ISO 11788, INSO (استانداردهای ایران) |

#### مرحله ۲ — Gap Analysis (تحلیل شکاف)
| سوال | چه چیزی پیدا می‌کنیم |
|---|---|
| 🔴 **چی کم داریم؟** | Missing (مثلاً Breeder استاندارد نبود) |
| 🟡 **چی زیاد داریم؟** | Redundant (مثلاً FCR دوتا منبع متناقض) |
| 🟠 **چی اشتباهه؟** | Incorrect (مثلاً «مرغ» = تخم‌گذار) |

#### مرحله ۳ — برنامه‌ریزی
- اولویت بر اساس **شدت × تکرار**
- هر تغییر → یه commit جدا
- بعدش → تست واقعی کاربر

#### مرحله ۴ — مستندسازی
- یافته‌ها → `AUDIT-XXX.md`
- درس‌ها → همین سند
- پیشرفت → `HANDOFF.md`

### ۷.۱ تحقیق در نرم‌افزارهای مرجع

**بین‌المللی:**
Big Dutchman · Pas Reform · Odoo Poultry 360 · MTech Systems · Poultry Manager Pro · Farmsoft

**ایرانی:**
فارم‌چک · نوین‌فارم · کاوش‌سپهر · سپیدار مرغداری

**سازندگان نژاد:**
Ross · Cobb · Hy-Line · Aviagen · Lohmann (راهنماهای رسمی)

### ۷.۲ الگو از شرکت‌های بزرگ

- **UI/UX:** Apple HIG · Material Design 3 · Microsoft Fluent
- **کد:** Google Style Guide · Airbnb · Vercel · Stripe
- **معماری:** Vercel (simplicity) · Netflix (resilience) · Shopify (modularity)

### ۷.۳ قوانین

| # | قانون |
|---|---|
| ۷.۳.۱ | هر قابلیت جدید → سند کوچیک «چرا، چی، چطور» (سه خط) |
| ۷.۳.۲ | اگه الگوی مشابه داره → **کپی نکن، abstraction بساز** |

---

## بخش ۸ — تست انسانی (Human Testing Protocol)

### ۸.۱ قوانین

| # | قانون |
|---|---|
| ۸.۱.۱ | قبل از fix بصری → **اسکرین‌شات قبل + بعد** |
| ۸.۱.۲ | بعد از fix → **تست واقعی توسط کاربر** (اسکرین‌شات تأیید) |
| ۸.۱.۳ | **ممنوع:** «کد رو خوندم، درسته» بدون دیدن رندر واقعی |
| ۸.۱.۴ | **ممنوع:** fix بدون تأیید کاربر که مشکل واقعاً چیه |

### ۸.۲ چک‌لیست تست هر ماژول (قبل از قفل)

- [ ] Loading / Empty / Error
- [ ] CRUD کامل (افزودن، ویرایش، حذف، Undo)
- [ ] همه‌ی دکمه‌ها (خصوصاً آیکونی)
- [ ] فیلترها و مرتب‌سازی
- [ ] Responsive (اندازه‌های مختلف)
- [ ] RTL کامل (تأیید راست، لغو چپ)

---

## بخش ۹ — بازبینی ارشد (Senior Verification)

قبل از هر تغییر، **۴ سوال طلایی:**

| # | سوال | اگه «نه» → |
|---|---|---|
| ۹.۱ | کد رو می‌فهمم؟ | اول ببین |
| ۹.۲ | ظاهرش رو دیدم؟ | اسکرین‌شات بگیر |
| ۹.۳ | معناش رو می‌فهمم؟ | سوال بپرس |
| ۹.۴ | با بقیه‌ی سیستم هماهنگه؟ | کجا شکسته؟ |

---

## بخش ۱۰ — پشتیبان و بازگشت (Backup & Rollback)

| # | قانون |
|---|---|
| ۱۰.۱ | قبل از تغییر مهم → `git tag before-xxx` |
| ۱۰.۲ | هر fix → یه commit جدا (نه چند تا با هم) |
| ۱۰.۳ | اگه tsc یا build fail → **برگرد** نه fix |
| ۱۰.۴ | اگه کاربر گفت «کار می‌کرد» → **دست نزن** |
| ۱۰.۵ | اگه کاربر گفت «خرابه» → `git log` بزن، **برگرد به نسخه سالم** |

---

## بخش ۱۱ — سیاست کامپوننت‌های قفل‌شده (Locked Components)

### ۱۱.۱ لیست قفل‌شده 🔒

- `SelectSheetShell.tsx`
- `SmartSelect.tsx`
- `EditableSelect.tsx`
- `AutocompleteSheet.tsx`
- `DependentSelect.tsx`
- `ui/Field.tsx`
- `ui/Input.tsx`
- `EntityLink.tsx`
- `OverrideHint.tsx`
- `ExpandableCard.tsx`

### ۱۱.۲ قوانین

| # | قانون |
|---|---|
| ۱۱.۱ | بدون اجازه‌ی **صریح** کاربر دست نزن |
| ۱۱.۲ | اگه لازم شد → **درخواست باز کردن قفل** + توضیح چرا |
| ۱۱.۳ | بعد از باز کردن: **بکاپ + اسکرین‌شات قبل/بعد + تست کاربر** |
| ۱۱.۴ | بعد از fix → **دوباره قفل** |

### ۱۱.۳ لاگ باز کردن قفل (تاریخچه)

| تاریخ | کامپوننت | تغییر | تأیید کاربر | وضعیت |
|---|---|---|---|---|
| ۱۴۰۴/۰۷/۲۱ | **دسترسی دائمی** | ✅ کاربر اجازه دائمی برای بازبینی/اصلاح همه کامپوننت‌های قفل‌شده داد | ✅ صریح | ✅ فعال |
| ۱۴۰۴/۰۷/۲۱ | `ui/Field.tsx` | ستاره قرمز `*` برجسته‌تر (اندازه + وزن + aria-label) | ✅ صریح | ✅ دوباره قفل شد |
| ۱۴۰۴/۰۷/۲۱ | `ui/Field.tsx` | حذف آیکون ⚠️ از error (فقط متن قرمز) + `dir="rtl"` + `textAlign: right` | ✅ صریح | ✅ دوباره قفل شد |
| ۱۴۰۴/۰۷/۲۱ | `ui/Form.tsx` (ErrorBox) | حذف آیکون ⚠️ (فقط متن قرمز) | ✅ صریح | ✅ دوباره قفل شد |
| ۱۴۰۴/۰۷/۲۱ | `DependentSelect.tsx` | prop `emptyMode: 'warning' \| 'select'` — Select غیرفعال به جای warning | ✅ صریح | ✅ دوباره قفل شد |

---

## بخش ۱۳ — قوانین مدل داده (Data Model)

| # | قانون |
|---|---|
| ۱۳.۱ | **مدل سه‌سطحی:** گونه → پرنده → نژاد |
| ۱۳.۲ | **هدف پرورش روی نژاد** (نه پرنده) |
| ۱۳.۳ | پرنده = فقط گونه (بدون FCR/چرخه) |
| ۱۳.۴ | گونه‌ها قابل گسترش (customSpecies) |
| ۱۳.۵ | حداکثر ۲ هدف برای هر نژاد |
| ۱۳.۶ | بدون auto-fill — کاربر انتخاب می‌کنه |
| ۱۳.۷ | Migration با version number |

> جزئیات کامل: `FOUNDATION-PATTERNS.md` بخش ۱۱ و ۱۲

---

## بخش ۱۲ — منابع

| سند | نقش |
|---|---|
| `FOUNDATION.md` (این) | توکن + Contracts + ۱۱ بخش قوانین |
| `FOUNDATION-PATTERNS.md` | ۸ الگوی تفکر سیستمی |
| `HANDOFF.md` | وضعیت + مشکلات + برنامه |
| `ARCHITECTURE.md` | نقشه فایل‌ها + وابستگی |
| `AI-RULES.md` | قوانین کار با کاربر |
| `STANDARDS.md` | استانداردهای UI/UX |
| `AUDIT.md` | چک‌لیست ممیزی |
| `STATUS.md` | وضعیت زنده + نقشه راه |

---

*این سند پایه‌ی همه‌ی کارهای بعده. قبل از هر تغییر مرورش کن.*
*آخرین به‌روزرسانی: ۱۴۰۴/۰۷/۲۰ — افزودن بخش‌های ۵ تا ۱۲ (قوانین بصری، داده، منبع، فرآیند، تست، بازبینی، بازگشت، قفل)*
