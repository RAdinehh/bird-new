# 🔍 AUDIT-BRD.md — ممیزی ماژول پرنده و نژاد

> ماژول: `brd` (پرنده‌ها + نژادها)
> وضعیت: 🟡 در جریان
> شروع: ۱۴۰۴/۰۷/۲۰
> مرجع: `docs/AUDIT.md` (چک‌لیست ۷ محوره)

---

## 📊 نمای کلی ماژول

| فایل | خط | نقش |
|---|---|---|
| BirdsPage.tsx | 466 | صفحه پرنده‌ها ⚠️ > ۴۰۰ |
| BreedsPage.tsx | 415 | صفحه نژادها ⚠️ > ۴۰۰ |
| _source.ts | 214 | تشخیص منبع |
| BreedNameField.tsx | 166 | فیلد نام نژاد |
| store.ts | 124 | Zustand store |
| BirdNameField.tsx | 111 | فیلد نام پرنده |
| index.tsx | 95 | tab wrapper |
| _display.ts | 92 | helper نمایش |
| presets.ts | 56 | پیش‌فرض‌ها |
| Placeholder.tsx | 10 | ❓ احتمالاً unused |

---

## 📋 چک‌لیست ۷ محوره (نمره از ۱۰۰)

### ۱. Functional Suitability — ۱۵ نمره ✅
- [ ] CRUD کامل
- [ ] ذخیره/بارگذاری درست
- [ ] اعتبارسنجی Zod
- [ ] Undo
- [ ] مدیریت خطا
- [ ] حالت‌های لبه‌ای

### ۲. UX — ۲۰ نمره ✅
- [x] Progressive Disclosure
- [x] Empty/Loading/Error
- [x] Inline Validation
- [x] State Persistence
- [x] Read-only ≠ Disabled
- [x] Cascade درست
- [x] ≤ ۷ فیلد در هر مرحله

### ۳. UI — ۲۰ نمره ✅ (جزئی)
- [ ] فقط رنگ‌های معنایی
- [x] بدون hex هاردکد
- [x] فاصله مضرب ۸ (توکنی شد)
- [x] فونت از توکن
- [ ] هدف لمسی ≥ ۴۴×۴۴
- [ ] RTL کامل
- [ ] سلسله‌مراتب بصری

### ۴. Accessibility — ۱۵ نمره ⏳
- [ ] aria-label
- [ ] Focus trap + Esc
- [ ] ناوبری کیبورد
- [ ] کنتراست ≥ ۴.۵:۱
- [ ] Reduced motion
- [ ] Screen reader

### ۵. Performance — ۱۰ نمره ✅
- [x] بدون N+1
- [x] useMemo/useCallback
- [ ] کش
- [ ] Lazy loading

### ۶. Integration — ۱۰ نمره ⏳
- [ ] EntityLink
- [ ] فیلترهای URL
- [ ] Context passing
- [ ] AutoFill از والد

### ۷. Senior Review — ۱۰ نمره ✅
- [ ] Edge Cases
- [ ] Loading & Async
- [ ] User Control
- [ ] Empty & Error
- [ ] Data Integrity
- [ ] Cognitive Load
- [ ] Consistency
- [x] Polish (بدون alert، بدون hardcode)

---

## 🎯 نمره‌ی فعلی

**نمره: —/۱۰۰** (هنوز ممیزی شروع نشده)

---

## 📝 یادداشت‌های ممیزی

> جلسه‌ی بعد پر می‌شه.

### نقاط قوت
- (خالی)

### مشکلات کشف‌شده
- (خالی)

### پیشنهادهای بهبود
- (خالی)

---

## 🚦 وضعیت

- [x] اسکلت ساخته شد
- [x] ممیزی محور ۱ (Functional)
- [ ] ممیزی محور ۲ (UX)
- [ ] ممیزی محور ۳ (UI)
- [ ] ممیزی محور ۴ (Accessibility)
- [ ] ممیزی محور ۵ (Performance)
- [ ] ممیزی محور ۶ (Integration)
- [ ] ممیزی محور ۷ (Senior Review)
- [ ] Gap Analysis
- [ ] تصمیم‌گیری نهایی

---

*جلسه‌ی بعد: شروع ممیزی محور ۱ — Functional Suitability*

---

## 🔬 ممیزی BirdsPage (محور ۱ — Functional)

**تاریخ:** ۱۴۰۴/۰۷/۲۰
**ممیزی‌شده:** `src/mod/brd/BirdsPage.tsx` (۴۶۶ خط)
**روش:** خواندن کامل کد + تحلیل ۷ محوره

### 📊 نمره‌ی محور ۱

| معیار | نمره | توضیح |
|---|---|---|
| CRUD کامل | ۱۵/۱۵ | افزودن، ویرایش، حذف، حذف گروهی |
| ذخیره/بارگذاری | ۱۲/۱۵ | کد `as any` پخش شده |
| Zod validation | ۳/۱۵ | ❌ هیچ Zod استفاده نشده |
| Undo | ۱۵/۱۵ | تکی + گروهی |
| مدیریت خطا | ۵/۱۰ | catch خالی |
| حالت‌های لبه‌ای | ۶/۱۰ | ناقص |
| **جمع** | **۵۶/۸۰** | **~۷۰/۱۰۰ — Needs Work** |

### ✅ نقاط قوت

1. جلوگیری از نام تکراری (save + dedupe)
2. Undo برای حذف تکی و گروهی
3. Draft خودکار فرم (useFormDraft)
4. MultiSelect با تأیید
5. Empty state آموزشی
6. HelpBanner خوب
7. SourceBadge + OverrideHint (کاربر می‌فهمه مقدار از کجاست)
8. EntityLink به نژادها
9. Focus param از URL (?focus=xxx)

---

## ⚠️ مشکلات کشف‌شده

### 🔴 سطح ساختاری (بلوکر حرفه‌ای شدن)

**۱. فایل ۴۶۶ خطی با کامپوننت ۴۲۰ خطی**
- `BirdsPage` از خط ۴۳ تا ۴۶۳ → تک کامپوننت غول
- مودال inline (خط ۳۷۹-۴۶۳)
- کارت لیست inline
- **راه‌حل:** جدا کردن به `BirdForm.tsx` + `BirdCard.tsx` + `BirdStats.tsx`

**۲. فرم با string ذخیره می‌کنه، بعد دستی پارس می‌کنه**
- `cycleDays: string` توی F → بعد `parseInt(toEn(...)) || null`
- **هیچ Zod استفاده نشده** درحالی که `src/shr/validation/rules/brd.ts` وجود داره
- **راه‌حل:** استفاده از Zod (طبق FOUNDATION ۲.۴)

**۳. اعتبارسنجی ناقص**
- فقط `!form.name.trim()` چک می‌شه
- بازه `cycleDays` (min/max) validate نمی‌شه
- تناقض `purpose: 'layer'` با `cycleDays: 42` چک نمی‌شه
- `fcrStandard` فقط autoClamp

**۴. فیلد ghost `category`**
- `const category = getCategoryInfo((b as any).category)` توی UI خونده می‌شه
- ولی `category` توی interface `Bird` نیست!
- **این یه باگ خاموشه** — همیشه undefined برمی‌گرده، بج نشون داده نمی‌شه

**۵. `dedupeBirds` و `dedupeBreeds` توی State public هستن ولی استفاده نمی‌شن**
- هیچ جا توی UI صدا زده نمی‌شن
- فقط توی migrate منطق dedup هست
- **راه‌حل:** حذف از State، انتقال به helper

**۶. `save` async بی‌دلیل + Double-submit**
- `save` async هست ولی هیچ `await` نداره
- کاربر می‌تونه سریع دوبار کلیک کنه → دو پرنده ساخته می‌شه
- **راه‌حل:** غیر-async یا دکمه disable حین save

### 🟡 سطح UX

**۷. پیام «انتخاب چندتایی» دو بار تکرار شده**
- یه بار HelpBanner، یه بار div خط ۲۰۳

**۸. Undo timer ناهماهنگ**
- حذف تکی: ۶ ثانیه
- حذف گروهی: ۸ ثانیه

### 🟡 سطح UI (عدم یکدستی)

**۹. مقادیر هاردکد پخش‌شده:**
- `borderRadius: 10, 8, 12` (باید `--r-md/lg`)
- `fontSize: 10, 10.5, 12, 9.5, 14` (باید `--fs-*`)
- `padding: '2px 8px', '6px 10px'` (باید `--pad-*`)

**۱۰. کد تکراری:**
- الگوی «div + flex + space-between» ۳ بار تکرار شده
- باید کامپوننت `StatRow` بشه

### 🟡 سطح Performance

**۱۱. `breeds.filter` توی map (N+1)**
- با ۵۰ پرنده × ۲۰۰ نژاد = ۱۰,۰۰۰ عملیات
- **راه‌حل:** `useMemo` + `Map` گروه‌بندی

**۱۲. محاسبه `stdData` توی هر کارت**
- fallback پیچیده تکرارشونده

### 🟡 سطح Senior Review

**۱۳. `showAlert` استفاده شده** — طبق AUDIT.md ممنوع
**۱۴. «نام انگلیسی: —» همیشه dash** — اضافی
**۱۵. catch خالی:** `try { deleteBird(id); } catch {}` → باگ مخفی

---

## 🎯 اولویت‌بندی رفع مشکلات

| اولویت | مشکل | ریسک | زمان تخمینی |
|---|---|---|---|
| 🔴 ۱ | رفع باگ `category` ghost | کم | ۵ دقیقه |
| 🔴 ۲ | حذف `showAlert` + catch خالی | کم | ۵ دقیقه |
| 🔴 ۳ | جدا کردن `BirdForm.tsx` | کم (refactor) | ۳۰ دقیقه |
| 🔴 ۴ | جدا کردن `BirdCard.tsx` | کم (refactor) | ۳۰ دقیقه |
| 🟡 ۵ | اتصال Zod به فرم | متوسط | ۴۵ دقیقه |
| 🟡 ۶ | رفع هاردکدهای UI | کم | ۲۰ دقیقه |
| 🟡 ۷ | بهینه `useMemo` (N+1) | کم | ۱۵ دقیقه |
| 🟡 ۸ | حذف `dedupe*` از State | کم | ۱۰ دقیقه |
| 🟡 ۹ | رفع double-submit | کم | ۱۰ دقیقه |
| 🟢 ۱۰ | یکدست کردن Undo timer | کم | ۵ دقیقه |
| 🟢 ۱۱ | کامپوننت `StatRow` | کم | ۱۵ دقیقه |

**ترتیب پیشنهادی:** ۱ → ۲ → ۷ → ۸ → ۹ → ۱۰ → ۱۱ → ۳ → ۴ → ۵ → ۶

از کم‌ریسک‌ترین و سریع‌ترین شروع می‌کنیم، کم‌کم سنگین‌تر.

---

## 📋 چک‌لیست محور ۱ (به‌روزشده)

### ۱. Functional Suitability — ۵۶/۸۰ (~۷۰٪) 🟡
- [x] CRUD کامل
- [x] ذخیره/بارگذاری درست (با احتیاط: `as any`)
- [ ] اعتبارسنجی Zod
- [x] Undo
- [~] مدیریت خطا (catch خالی)
- [~] حالت‌های لبه‌ای

---

## 🚦 وضعیت ممیزی

- [x] ممیزی محور ۱ (Functional)
- [ ] ممیزی محور ۲ (UX)
- [ ] ممیزی محور ۳ (UI)
- [ ] ممیزی محور ۴ (Accessibility)
- [ ] ممیزی محور ۵ (Performance)
- [ ] ممیزی محور ۶ (Integration)
- [ ] ممیزی محور ۷ (Senior Review)
- [ ] ممیزی `BreedsPage`
- [ ] Gap Analysis نهایی
- [x] شروع فاز بهبود — ۱۱ fix اعمال شد

---

## 📌 یادداشت مهم

**اولویت‌بندی کلی پروژه (طبق توافق کاربر):**
۱. `brd` (پرنده و نژاد) ← **الان اینجاییم**
۲. `hal` (سالن)
۳. `ctc` (مخاطبین)
۴. `flk` (گله)
۵. `dlg` (ثبت روزانه)
۶. بقیه ماژول‌ها

**بین ممیزی و fix:** به تشخیص کاربر، می‌تونیم بین ممیزی و fix جابه‌جا شیم. ولی **fix ها باید کم‌ریسک و کوچک باشن** تا هیچی نشکنه.

---

*آخرین به‌روزرسانی: ۱۴۰۴/۰۷/۲۰ — ممیزی BirdsPage (محور ۱) کامل شد.*
