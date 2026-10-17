# 🎯 NEXT — جلسه ۱۵ (پس از پایه‌سازی)

> **نوشته‌شده بر اساس واقعیت کد، نه ادعا.**
> AI از این خارج نشود بدون تأیید صریح کاربر.

---

## ✅ جلسه ۱۴ — انجام‌شده

- مهاجرت `tra→whs` و `egg→whs` به Event Bus
- فیکس `hasActiveFilters` (sort ≠ filter)
- فیکس catch خالی در `hasRefs`
- حذف ۲ any در `flk/store.ts`
- تست گروه‌های گله (۷/۷ پاس)
- **پایه‌سازی استاندارد:**
  - `CONSTITUTION.md` (۱۳ قانون)
  - `UI-PATTERNS.md` (۱۳ بخش)
  - `DECISIONS.md` (۱۱ تصمیم)
  - `PARADIGM.md` (طراحی)
  - `COMPLEX-SCENARIOS.md` (طراحی)
  - `scripts/check.sh` (اجرایی)
  - `AI-BOOT.md` بازنویسی

---

## 🎯 جلسه ۱۵ — هدف

**اولین پیاده‌سازی از پایه‌های جدید: `FlockBreed` چندریختی**

### چرا این اولین

- کوچک، قابل تست
- پایه‌ی سناریوهای پیچیده (گله مختلط، نژاد محلی)
- بدون شکستن چیزی (migration v7→v8)

### قدم‌ها (۴ قدم)

#### قدم ۱ — مدل داده
- [ ] `types-flocks.ts`: `FlockBreed` تعریف شود
- [ ] `Flock.breedId: string` → `Flock.breedKind` + `Flock.breedId?`
- [ ] migrate در `flk/store.ts` (v7→v8)
- [ ] `tsc` پاس

#### قدم ۲ — UI
- [ ] `FlocksModal`: حالت مختلط (دکمه «نژاد مناسب پیدا نکردم»)
- [ ] حالت استاندارد: بدون تغییر ظاهری
- [ ] `tsc` پاس

#### قدم ۳ — گزارش
- [ ] `useGroupKpi` و `FlocksKpi` — گله‌های مختلط در دسته جدا
- [ ] `tsc` پاس

#### قدم ۴ — تست + commit
- [ ] تست `flk-breed.test.ts` (۳ سناریو)
- [ ] `npx vitest run` پاس
- [ ] `bash scripts/check.sh` پاس
- [ ] `auto_fast.py "feat(flk): FlockBreed چندریختی — پشتیبانی گله مختلط"`

---

## 🟢 صف بعدی (بر اساس واقعیت)

۱. `ParadigmProfile` + `registry` (قدم ۱ در PARADIGM.md)
۲. `StandardHint` کامپوننت (قدم ۳)
۳. اتصال به `DlgTabPanel` (قدم ۴)
۴. کاهش `any` در `flk/store.ts` → صفر (الان ۰ ✅)
۵. کاهش `any` در `whs` (۶۹ → کمتر)
۶. کاهش `showAlert` در ماژول‌های فعال

---

## ⚠️ کارهایی که الان نکن

- ❌ refactor `flk/store.ts` (۸۲۰ خط) — بعد از `FlockBreed`
- ❌ `alt/rules.ts` (۵۸۹ خط) — خارج scope
- ❌ فعال‌سازی مرده‌ای که از مسیر غیرمستقیم کار می‌کند — اول grep
- ❌ مهاجرت مستقیم → bus بدون grep

---

## 🔴 قانون جلسه ۱۵

**قبل از هر تغییر، سه چک:**

~~~bash
bash scripts/check.sh
grep -rn "breedId" src/mod/flk/ --include="*.ts" --include="*.tsx"
git status --short
~~~

**بدون این سه، تغییر ممنوع.**

---

## 📌 یادآوری — اسناد قدیمی معتبر نیستند

- `docs/EVENT-BUS.md` — بخش وضعیت تصحیح شده، ولی مرجع نهایی نیست
- `docs/PROGRESS.md` — فقط تاریخچه commit
- `docs/STATUS.md` — بازبینی نشده
- **مرجع واقعی: `docs/CONSTITUTION.md` + `docs/UI-PATTERNS.md` + `docs/DECISIONS.md`**

---

*آخرین به‌روزرسانی: پایان جلسه ۱۴ — 1404/07/28*
