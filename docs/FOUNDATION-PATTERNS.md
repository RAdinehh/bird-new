# 🧠 FOUNDATION-PATTERNS.md — تفکر سیستمی Bird-new

> این سند مکمل FOUNDATION.md است.
> ۸ الگوی تفکر که از باگ‌های واقعی جلسه ۱۴۰۴/۰۷/۲۰ استخراج شدن.

---

## ۱۰.۱ — منبع حقیقت یکی ئه (Single Source of Truth)

**اصل:** هر داده یه منبع رسمی داره، بقیه فقط ارجاع می‌دن.

| وضعیت | راه‌حل |
|---|---|
| داده توی ۲+ جا ذخیره می‌شه | یه منبع + بقیه `key` |
| snapshot لازمه (dedup/filter) | منبع + display layer جدا |

**مثال واقعی:** `nameFa` (استاندارد) vs `bird.name` (snapshot) → helper جدا.

---

## ۱۰.۲ — لایه‌ی نمایش ≠ لایه‌ی داده

**اصل:** نمایش و ذخیره‌سازی مسئولیت‌های متفاوتن.

- **Display Layer:** از منبع زنده می‌خونه (helper مثل `getXxxDisplayName`)
- **Data Layer:** snapshot استاتیک (dedup، form، filter)
- **قانون:** هر فیلدی که «معنای نمایشی» داره → helper مخصوص

---

## ۱۰.۳ — Proactive Sweep (جاروی پیشگیرانه) 🔥

**مهم‌ترین قانون:**

> وقتی یه باگ توی یه جا پیدا شد → **فوراً** همه‌ی جاهای مشابه رو چک کن.

**مثال:** EntityLink توی BreedCard استاتیک بود → بگرد همه‌ی EntityLink های دیگه رو چک کن.

**مراحل:**
1. باگ رو fix کن
2. `grep` بزن همه‌ی موارد مشابه
3. یکی‌یکی چک و fix
4. یه commit واحد

---

## ۱۰.۴ — Taxonomy Matrix

**اصل:** برای هر ترکیب دسته‌بندی، ماتریس بساز.

**قبل از قفل ماژول:**
- هیچ خانه‌ای خالی نمونه (یا برچسب «بعداً»)
- مثال: ۵ گونه × ۵ هدف = ۲۵ خانه

**الگو:**
| | broiler | layer | breeder | dual | ornamental |
|---|---|---|---|---|---|
| chicken | ✅ | ✅ | ✅ | ✅ | ✅ |
| duck | ✅ | ❌ | ✅ | ✅ | ❌ |
| turkey | ✅ | ❌ | ✅ | ❌ | ❌ |

---

## ۱۰.۵ — Cascade کامل

**اصل:** والد → فرزند با هم.

- همیشه `parentKind` **و** `parentPurpose` جدا چک شن
- تغییر والد → ریست یا فیلتر فرزند
- «dual همیشه مجاز» → قانون صریح

---

## ۱۰.۶ — Semantic Auto-fill

**اصل:** Auto-fill فقط از منبع معنایی درست.

- «FCR مادر ≠ FCR گوشتی» — نه از «هر چیزی که در دسترسه»
- اگه شک داری → **پر نکن، کاربر انتخاب کنه**
- همیشه Override قابل بازگشت

---

## ۱۰.۷ — Prop Chain Verification

**اصل:** اگه یه prop اضافه کردی → زنجیره‌ی کامل رو چک کن.

**زنجیره:** Store → Page → Form → Field → UI

**مثال:** `customStandards` باید از Store به Page، به Form، به Field برسه.

---

## ۱۰.۸ — Grep قبل از تغییر

**اصل:** قبل از تغییر هر فیلد، grep کن همه‌جا خونده/نوشته می‌شه.

grep -rn "fieldName" src/ --include="*.ts" --include="*.tsx"

- اگه ۲+ نقش داره → helper یا split
- اگه ۰ مورد → کد مرده (حذف)

---

## ۱۱ — Taxonomy Design (طراحی دسته‌بندی)

### ۱۱.۱ مدل سه‌سطحی

سطح ۱: گونه (Species) → 🐔 مرغ · 🦆 اردک · 🦃 بوقلمون · ...
سطح ۲: پرنده (Bird) → فقط گونه (بدون FCR/چرخه/هدف)
سطح ۳: نژاد (Breed) → نژاد + purpose + fcr + standardKey

### ۱۱.۲ هدف پرورش روی نژاد

**چرا؟**
- نژاد «راس ۳۰۸» فقط گوشتی ئه
- نژاد «مرندی» می‌تونه تخم‌گذار، مادر، یا دوگانه باشه
- **کاربر انتخاب می‌کنه** کدوم هدف رو می‌خواد

**نتیجه:**
- پرنده بدون هدف
- نژاد با ۱ یا ۲ هدف

### ۱۱.۳ چک‌باکس هدف (نه لیست ثابت)

| حالت | مجاز؟ |
|---|---|
| ۱ هدف | ✅ |
| ۲ هدف | ✅ (هر ترکیبی) |
| ۳+ هدف | ❌ |

**بدون auto-fill:** کاربر خودش انتخاب می‌کنه، نه استاندارد.

### ۱۱.۴ گسترش توسط کاربر

- کاربر می‌تونه گونه‌ی جدید بسازه (کبک، شترمرغ، ...)
- کاربر می‌تونه استاندارد سفارشی بسازه (`customStandards`)
- نرم‌افزار نباید محدودیت داشته باشه

---

## ۱۲ — Data Evolution (تکامل داده)

### ۱۲.۱ Migration با version

هر تغییر ساختاری → version جدید توی persist:

version: 3 → حذف purpose/categoryId از Bird
version: 4 → تغییرات minor
version: 5 → حذف cycleDays/fcrStandard از Bird

### ۱۲.۲ نگه‌داری فیلد legacy

قانون: اگه فیلدی ۱۰+ مصرف‌کننده داره:

1. اول @deprecated روش بزن
2. helper جدید بساز (getBreedCycleDays)
3. مصرف‌کننده‌ها یکی‌یکی مهاجرت کنن
4. آخر: حذف فیلد + migration

### ۱۲.۳ Grep قبل از تغییر

grep -rn "fieldName" src/ --include="*.ts" --include="*.tsx"

- ۰ مورد → کد مرده (حذف)
- ۱ مورد → ساده (همون‌جا fix)
- ۲-۹ مورد → fix تدریجی
- ۱۰+ مورد → migration پله‌ای

### ۱۲.۴ حذف با اطمینان

قبل از حذف فیلد از interface:
- همه‌ی error TS2339 رو fix کن
- بعد حذف نهایی
- tsc باید ۰ خطا بده


---

## ۱۳ — UI/UX Patterns (الگوهای رابط)

### ۱۳.۱ Border روی wrapper، نه هر عنصر

**اشتباه:** input + button هرکدوم border جدا → خط عمودی بینشون
**درست:** border روی wrapper → یه کادر یکپارچه

### ۱۳.۲ کارت اطلاعات خواناتر

- فونت: --fs-sm (نه --fs-xxs)
- Line-height: 1.7
- Padding: --pad-normal

### ۱۳.۳ Empty State راهنما

اگه لیست خالیه → پیام آموزشی، نه لیست پر از نژاد نامرتبط.
مثال: پرنده‌ی کبک نژاد نداره → پیام: «نژاد بساز» — نه اینکه نژادهای مرغ رو نشون بده.


### ۱۳.۴ Toast vs Disabled

اشتباه: disabled button بدون توضیح — کاربر نمی‌فهمه چرا
درست: button فعال + toast توضیحی

مثال: [گوشتی] → کلیک → toast: «حداکثر ۲ هدف»

درس: کاربر باید بفهمه چرا نمی‌تونه کاری بکنه.

### ۱۳.۵ Grid2 برای فیلدهای ساده

- فیلد ساده (input، عدد، تاریخ) → Grid2 (۲ ستونه)
- فیلد مرکب (autocomplete، آبشاری) → full-width
- چک‌باکس هدف → Grid2 (۲ ستونه)

### ۱۳.۶ ترتیب منطقی فیلدها

- پرنده → نژاد → هدف → FCR → اطلاعات استاندارد
- چک‌باکس هدف: تخم‌گذار · مادر · گوشتی · تزئینی

### ۱۳.۷ نمایش اطلاعات استاندارد (read-only)

اطلاعات استاندارد (تخم/سال، باروری، هچ) → فقط نمایش، نه ذخیره.
اگه کاربر خواست عوض کنه → بره تنظیمات → استانداردها.
ذخیره‌ی محلی → منبع حقیقت رو می‌شکنه.


---

## ۱۴ — Input Integrity (یکپارچگی ورودی)

### ۱۴.۱ Stale Value Bug

**اصل:** اگه فیلد A با فیلد B وابسته‌ست، تغییر A باید B رو ریست کنه.

**مثال:** نام نژاد ↔ standardKey
- کاربر «مرندی» انتخاب می‌کنه → standardKey = 'marandi'
- کاربر نام رو عوض می‌کنه → standardKey باید پاک شه

**راه‌حل:** onChange(A) → clear B

### ۱۴.۲ No Match Verification

**اصل:** قبل از save، چک کن فیلدهای همبسته با هم match هستن.

**مثال:** name ≠ standardKey.nameFa → خطا

### ۱۴.۳ Stale Derived State

**اصل:** محاسبات useMemo از منبع فعلی بخونن، نه از کش قدیمی.

**مثال:** آمار پرنده باید از form.name بخونه، نه از form.birdKind قدیمی.

### ۱۴.۴ Validation Layer Leak

**اصل:** Zod فقط شکل داده رو چک کنه، نه مقادیر محدود.

**اشتباه:** birdKind: oneOf(['chicken', 'duck', ...])
**درست:** birdKind: optionalStr(100)

**چرا؟** چون custom species (کبک، شترمرغ) رد می‌شن.

### ۱۴.۵ Side-Effect in setState

**اصل:** toast/console/navigation بیرون از setForm/setState.

**چرا؟** React StrictMode در dev دو بار setForm رو صدا می‌زنه → toast دوبار ظاهر می‌شه.

**راه‌حل:** اعتبارسنجی رو اول چک کن، بعد setForm:

- if (badCondition) { toastMsg.error(...); return; }
- setForm(f => ({ ...f, ... }));

### ۱۴.۶ Unique ID Generation

**اصل:** ID باید شامل: slug + timestamp + random باشه.

**اشتباه:** 'کبک'.replace(/[^a-z0-9-]/g, '') → خالی می‌شه (فارسی پاک می‌شه)

**درست:** 'custom-' + slug + '-' + Date.now().toString(36)

**چرا؟** چون دو species فارسی ممکنه ID یکسان بگیرن.

### ۱۴.۷ Action vs Value

**اصل:** گزینه‌های اکشن (مثل «مدیریت پرنده‌ها») نباید value رو ست کنن.

**اشتباه:** کاربر «مدیریت پرنده‌ها» کلیک → input = «مدیریت پرنده‌ها»

**درست:** actionValues={[ADD_NEW_VALUE]} → فقط onSelect صدا زده شه، value ست نشه.

### ۱۴.۸ Border on Wrapper

**اصل:** مرز روی container، نه روی عناصر داخلی.

**اشتباه:** input + button هر کدوم border جدا → خط عمودی بینشون
**درست:** border روی wrapper، داخل بدون border.

### ۱۴.۹ Clear Error on Input Change

**اصل:** وقتی کاربر ورودی رو تغییر می‌ده، خطای قبلی باید پاک شه.

**راه‌حل:** onChange و onPick هر دو onErrorClear?.() صدا بزنن.

### ۱۴.۱۰ Empty State with Guidance

**اصل:** Empty state باید بگه «چیکار کنی»، نه فقط «چیزی نیست».

**اشتباه:** «موردی یافت نشد»
**درست:** «کبوتر نژادی نداره — برو تنظیمات → استانداردها بسازش»
---

## ۱۵ — Single Resolver Pattern

### ۱۵.۱ اصل

هر مفهوم با منبع واحد (مثل Standard) باید فقط از طریق یه helper خونده شه.

**اشتباه:**

DEFAULT_STANDARDS[k].nameFa
DEFAULT_STANDARDS[k].source
customOverrides[k]?.nameFa   (فراموش می‌شه)

**درست:**

const std = resolveStandard(k, customStandards, customOverrides);
std.nameFa
std.source
std.growth.weightByAge

### ۱۵.۲ چرا؟

| قبل | بعد |
|---|---|
| ۱۰+ جای مختلف merge دستی | یه helper واحد |
| هر جای جدید → باگ جدید | فقط از helper استفاده کن |
| تغییر ساختار → همه‌جا fix | فقط یه فایل |

### ۱۵.۳ الگو در Bird-new

- `resolveStandard(key, customStandards, customOverrides)` — در `_display-values.ts`
- `getBreedDisplayName(b, { customStandards, customOverrides })` — نمایش نام
- `getBreedFcr(b, customStandards, customOverrides)` — FCR نهایی

### ۱۵.۴ چک‌لیست

اگه فیلد جدید از standard خونده می‌شه:

- از `resolveStandard` استفاده کن، نه `DEFAULT_STANDARDS[key]` مستقیم
- `customOverrides` رو حتماً پاس بده
- helper اختصاصی بساز (مثل `getBreedFcr`) اگه منطق پیچیده‌ست

### ۱۵.۵ درس واقعی

این الگو از باگ‌های زیر کشف شد:

- کاربر نام استاندارد رو عوض کرد → کارت آپدیت نشد
- کاربر FCR رو عوض کرد → داشبورد آپدیت نشد
- کاربر منبع رو عوض کرد → BreedForm آپدیت نشد

**راه‌حل ریشه‌ای:** Single Resolver.
---

## ۱۶ — Master Data vs Operations

### ۱۶.۱ اصل

**Master Data** (استانداردها، تنظیمات) فقط از **ماژول خودش** ساخته/ویرایش می‌شه.

**Operations** (پرنده، نژاد، گله، معامله) فقط **مصرف‌کننده**ی Master ئه.

### ۱۶.۲ مثال در Bird-new

- Master: /set?tab=standards — استانداردها
- Operations: /brd?tab=breeds — نژادها (مصرف‌کننده)

### ۱۶.۳ قاعده

- کاربر توی Operations چیزی خواست که نیست → راهنمایی به Master
- پیام واضح + دکمه‌ی «رفتن به Master»
- نه auto-create توی Operations

### ۱۶.۴ چرا؟

| قبل (شلوغ) | بعد (Master جدا) |
|---|---|
| هر ماژول خودش می‌سازه | فقط Master Module |
| تکرار داده | یه منبع |
| Audit پراکنده | Audit متمرکز |
| دسترسی سخت | Access Control ساده |

### ۱۶.۵ استاندارد صنعت

- Big Dutchman: Setup جدا از Operations
- Odoo Poultry: Master Data جدا
- MTech: Standards Setup جدا
- Pas Reform: Hatchery Standards جدا
- فارم‌چک / نوین‌فارم (ایران): همون الگو

### ۱۶.۶ پیاده‌سازی

```
کاربر توی /brd چیزی می‌خواد که نیست
  ↓
پیام واضح + دکمه «رفتن به تنظیمات»
  ↓
کاربر می‌ره /set → می‌سازه
  ↓
برمی‌گرده /brd → حالا موجوده
```

### ۱۶.۷ استثناها

- Data Cache (مثل _display-name): OK — فقط نمایش
- Override (کاربر تنظیمات رو تغییر می‌ده): OK
- Auto-fill (پر کردن از استاندارد): OK

**ممنوع:** create-everything توی Operations.

---

## ۱۷ — ESLint Safety Pattern

### ۱۷.۱ اصل
ESLint --fix ابزار قدرتمندیه ولی می‌تونه فایل رو خراب کنه.

### ۱۷.۲ قوانین
- قبل از --fix: git tag بزن
- فقط یه ماژول — نه کل پروژه
- بعد از fix: git diff رو بخون
- اگه مشکوک: git checkout برگردون

### ۱۷.۳ چرا؟
ESLint نمی‌فهمه:
- side-effect import ها
- re-export ها
- dynamic imports

### ۱۷.۴ درس واقعی (جلسه ۵)
ESLint --fix روی set/standards/data-breeds/turkey_goose.ts فایل ۳۰۰+ خط رو ۸ خط کرد.
راه‌حل: git checkout HEAD -- src/mod/set/

---

## ۱۸ — Type Naming Convention

### ۱۸.۱ اصل
دو تایپ متفاوت با یه اسم → ممنوع.

### ۱۸.۲ الگو
| تایپ | نقش | منبع |
|---|---|---|
| *Payload | Zod (number) | validation/rules/ |
| *FormData | Form (string) | useXxxForm.ts |

### ۱۸.۳ چرا؟
- Form: کاربر تایپ می‌کنه → string
- Zod: بعد از اعتبارسنجی → number
- اگه اسم یکسان باشه → تضاد

### ۱۸.۴ مثال
- export type HallPayload = z.infer<typeof HallSchema>  ✅
- export interface HallFormData { length: string }  ✅
- export type HallFormData = z.infer<...>  ❌ تضاد

---

## ۱۹ — DependentSelect Pattern

### ۱۹.۱ اصل
فیلد آبشاری باید DependentSelect باشه، نه SmartSelect manual.

### ۱۹.۲ چرا؟
DependentSelect:
- والد انتخاب نشده → پیام واضح
- لیست خالیه → پیام راهنما
- استاندارد Apple HIG / Material 3

### ۱۹.۳ الگو
<DependentSelect
  parentValue={form.hallId}
  parentLabel="سالن"
  emptyListMessage="این سالن بخشی ندارد"
/>

### ۱۹.۴ مثال
EquipmentFormModal: فیلد بخش → DependentSelect (به جای manual)

---

## ۲۰ — Save-Attempted Error Display 🆕

### ۲۰.۱ اصل
خطاهای فرم **فقط بعد از کلیک «ذخیره»** نمایش داده می‌شن — نه دائمی.

### ۲۰.۲ چرا؟
- **UX بهتر:** کاربر توی حالت تایپ گیج نمی‌شه
- **طبق Apple HIG:** خطا باید در پاسخ به اقدام کاربر باشه
- **کاهش اضطراب:** کاربر تازه فرم رو باز کرده، همه چی قرمز ئه → بد

### ۲۰.۳ الگو
در Page یه state به اسم `saveAttempted` بساز:
- اول `false`
- در `save` → `setSaveAttempted(true)`
- در `openNew`/`openEdit` → `setSaveAttempted(false)`
- به Modal پاس بده: `vErrors={saveAttempted ? vErrors : {}}`

### ۲۰.۴ درس واقعی
جلسه ۷: فرم سالن باز می‌شد و **همه فیلدها خطا داشتن** (چون خالی بودن) — کاربر وحشت می‌کرد.

---

## ۲۱ — RowGrid Pattern 🆕

### ۲۱.۱ اصل
برای `Row` های **کوتاه** (عدد، تاریخ، لینک)، از گرید ۲ ستونه استفاده کن. برای `Row` های **بلند** (متن، لیست) تک‌ستونه.

### ۲۱.۲ چرا؟
- **فشرده‌تر:** ۵۰٪ کوتاه‌تر
- **یک نگاه:** کاربر همه چیز رو می‌بینه
- **طبق Big Dutchman + Material 3**

### ۲۱.۳ الگو
در `helpers.tsx` کامپوننت جدید `RowGrid` بساز:
- `display: grid`
- `gridTemplateColumns: '1fr 1fr'`
- `gap: var(--sp-1)`

### ۲۱.۴ چه فیلدهایی ۲ ستونه؟
- ✅ اعداد، تاریخ‌ها، لینک‌ها، percent
- ❌ آدرس، یادداشت، لیست گله‌ها، روش ضدعفونی

### ۲۱.۵ نکته مهم: هم‌ترازی
- **`alignItems: 'start'`** → هر دو ستون از **بالا** شروع شن
- **label مخفی** (`visibility: 'hidden'`) → کادر محاسبه با input هم‌تراز
- **`RowWithStatus` با hint رو توی Grid2 نذار** → بهم می‌ریزه (جلسه ۷)

---

## ۲۲ — KPI Cards Pattern 🆕

### ۲۲.۱ اصل
دسته‌های تجهیزات/آمار به صورت **کارت‌های KPI دو ستونه** نمایش داده شن، نه ردیف تک‌خطی.

### ۲۲.۲ چرا؟
- **فشرده‌تر:** ۶ کارت در ۳ ردیف (جای ۶ ردیف)
- **رنگ‌بندی واضح:** 🟢/🟡/🔴 طبق Big Dutchman
- **یک نگاه:** کاربر همه چیز رو یه‌جا می‌بینه
- **طبق Material 3 (KPI Cards) + BigFarmNet**

### ۲۲.۳ الگو
ساختار کارت (سه بخش):
- **Header:** آیکون رنگی + label + emoji (🟢/🟡/🔴)
- **نوار پیشرفت:** ارتفاع ۵px، رنگ tone
- **Footer:** درصد (سمت راست) + تعداد (سمت چپ)

فایل: `HallEquipCatCard.tsx` (کامپوننت جدید)

### ۲۲.۴ رنگ‌بندی (tone)
| Tone | رنگ | معنی | emoji |
|---|---|---|---|
| `ok` | `var(--accent)` | کافی | 🟢 |
| `low` | `var(--warn)` | کم | 🟡 |
| `very-low` | `var(--danger)` | نیاز فوری | 🔴 |
| `over` | `var(--purple)` | اضافه | 🟣 |
| `none` | `var(--dim)` | ثبت نشده | ⚪ |

### ۲۲.۵ درس واقعی
جلسه ۷: `HallEquipCatRow` (تک‌خطی) → `HallEquipCatCard` (KPI دو ستونه).
- کاربر توی یه نگاه **۶ دسته** رو می‌بینه (نه ۶ ردیف اسکرول)
- رنگ‌بندی فوری: 🔴 گرمایش نیاز داره، 🟣 بستر اضافه

---

## 📚 مرجع

- FOUNDATION.md — قوانین اصلی (۱۳ بخش)
- FOUNDATION-PATTERNS.md (این) — الگوهای تفکر (۱۶ بخش)
- AUDIT.md — چک‌لیست ممیزی
- HANDOFF.md — وضعیت و برنامه

---

---

## ۲۳ — Archive Tab Pattern 🆕

### ۲۳.۱ اصل
آرشیو تب مستقله (نه فیلتر مخفی). فقط وقتی نمایش داده می‌شه که آرشیو داری.

### ۲۳.۲ چرا؟
- کاربر نباید حدس بزنه «آرشیو کجاست»
- استاندارد Gmail/iOS Mail
- تب معمولی = کاربر می‌بینه، فیلتر = مخفی

### ۲۳.۳ الگو
ساختار تب‌ها:
- [سالن‌ها] [بخش‌ها] [تجهیزات] [آرشیو (N)]
- تب آرشیو فقط اگه N > ۰

محتوای تب آرشیو:
- Segmented Control سه بخش
- هر کارت: «بازگردانی» + «حذف دائمی»
- چک وابستگی قبل از حذف دائمی

### ۲۳.۴ درس واقعی
جلسه ۱۰: hal آرشیو داشت ولی مخفی بود توی فیلتر → کاربر پیدا نمی‌کرد.

---

## ۲۴ — Dynamic Placeholder by Subtype 🆕

### ۲۴.۱ اصل
placeholder فیلد «نام» بر اساس زیرنوع انتخاب‌شده تغییر کنه.

### ۲۴.۲ چرا؟
- fan_tunnel → «فن تونلی ۱۲۰»
- nipple → «نیپل استیل»
- litter_sand → «ماسه شسته»

کاربر با دیدن placeholder می‌فهمه چی وارد کنه.

### ۲۴.۳ الگو
نقشه در _equipHelpers.ts:
- PLACEHOLDER_BY_TYPE: Record با کلید زیرنوع
- getPlaceholderForType(type) helper

### ۲۴.۴ درس واقعی
جلسه ۱۰: placeholder «لامپ LED سقفی» برای همه → کاربر گیج می‌شد.

---

## ۲۵ — AutoClamp on Blur (Not While Typing) 🆕

### ۲۵.۱ اصل
محدودسازی min/max فقط بعد از خروج از فیلد (blur)، نه در حین تایپ.

### ۲۵.۲ چرا؟
کاربر می‌خواد «۱۱» تایپ کنه (با min=۱۰,۰۰۰):
- اگه در تایپ clamp شه → فوراً «۱۰,۰۰۰» می‌شه → نمی‌تونه ادامه بده
- اگه در blur → آزاد تایپ می‌کنه، بعد خودکار clamp می‌شه

### ۲۵.۳ الگو
اشتباه: clamp در handleChange
درست: clamp در handleBlur

### ۲۵.۴ درس واقعی
جلسه ۱۰: کاربر نتونست «۱۱,۰۰۰» تایپ کنه چون autoClamp در هر keystroke اجرا می‌شد.

---

*این سند زنده است — با هر الگوی جدید تکمیل می‌شه.*

---

## ۲۶ — Touched Fields Pattern 🆕

### ۲۶.۱ اصل
خطا **فقط بعد از blur فیلد** یا **کلیک ذخیره** نشون داده می‌شه.
فیلد تازه باز: فقط `*` قرمز · بدون خطا.

### ۲۶.۲ الگو
- `useFormErrors` hook → `markTouched`, `showError`, `attemptSave`
- `Field` → `onTouch` روی `onBlurCapture`
- `showError(field)` → خطا فقط اگه `touched || saveAttempted`

### ۲۶.۳ چرا؟
طبق Luke Wroblewski: ۲۲٪ افزایش موفقیت فرم · ۴۷٪ کمتر حرکات چشم.

### ۲۶.۴ درس واقعی
جلسه ۱۱: کاربر ذخیره می‌زد → همه فیلدها خطا → اضطراب. الان فقط فیلدهای پرشده.

---

## ۲۷ — Smart Capacity Pattern 🆕

### ۲۷.۱ اصل
محاسبه ظرفیت سالن/بخش:
- **گله با بخش** → ظرفیت بخش
- **گله بدون بخش** → **کل ظرفیت سالن** (بخش‌های خالی رزرو نمی‌شن)
- **سالن بدون capacity** → area × density

### ۲۷.۲ چرا؟
- بخش‌ها = تقسیم اختیاری
- کاربر می‌تونه کل سالن رو بدون بخش داشته باشه
- بخش‌های خالی نباید از سالن کم کنن

### ۲۷.۳ نمایش
- **همیشه نشون بده** (OK سبز / overflow زرد)
- **breakdown:** هر بخش چقدر پر / چقدر باقی

### ۲۷.۴ درس واقعی
جلسه ۱۱: کاربر می‌خواست «کل سالن ۵۰۰» بدون توجه به بخش‌های خالی.

---

## ۲۸ — Carousel with Dynamic Tabs 🆕

### ۲۸.۱ اصل
Carousel با تب‌های conditional:
- `extraDeps` برای re-measure
- `MutationObserver` روی panel (اضافه/حذف کارت)
- `transition` نرم (280ms cubic-bezier)
