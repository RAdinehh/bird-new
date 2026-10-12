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

## 📚 مرجع

- FOUNDATION.md — قوانین اصلی (۱۳ بخش)
- FOUNDATION-PATTERNS.md (این) — الگوهای تفکر (۱۵ بخش)
- AUDIT.md — چک‌لیست ممیزی
- HANDOFF.md — وضعیت و برنامه

---

*این سند زنده است — با هر الگوی جدید تکمیل می‌شه.*
