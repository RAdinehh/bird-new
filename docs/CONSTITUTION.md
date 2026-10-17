# 🏛 CONSTITUTION — قوانین آهنین Bird-new

> **قانون اجرایی**، نه سند نصیحت.
> هر قانون یک چک grep دارد که در `scripts/check.sh` اجرا می‌شود.
> هر commit باید از check.sh پاس شود.
> حداکثر ۱۵ قانون — بیشتر از این نادیده گرفته می‌شود.

---

## 🎯 اصل ratchet

**عددی که امروز داری، سقف فردا ست.** هر commit باید ≤ باشد. کاهش تعهد، افزایش ممنوع.
- هدف بلندمدت: صفر
- مسیر: فقط کاهش یا ثابت

---

## 📜 ۱۳ قانون

### L1 — state فقط از store

هر ماژول state خودش را در `mod/<x>/store.ts` نگه می‌دارد.
- کامپوننت‌ها برای خواندن → `useXxx(s => s.field)`
- فقط `api/`, `handlers.ts`, `store.ts` مجاز به `useXxx.getState()` ان
- mutation فقط از action store

**چک:**
~~~
grep -rn "\.getState()" src/mod/ --include="*.tsx" | grep -v "/api/\|/handlers"
~~~
🎯 هدف: صفر.

---

### L2 — Event Bus برای side-effect، نه خواندن

`bus.emit` فقط برای آگاه‌کردن. خواندن state از bus → ممنوع.
همه emitها باید `{ source: 'moduleName' }` داشته باشند.

**چک:**
~~~
python3 scripts/checks/bus-emit-source.py
~~~
🎯 هدف: صفر.

---

### L3 — Validation از `shr/validation/`

zod خام در `store.ts` یا `components/` → ممنوع. همه از `validate(schema, data)`.

**چک:**
~~~
grep -rn "\.parse(\|\.safeParse(" src/mod/ --include="*.ts" --include="*.tsx" | grep -v "/rules/" | grep -v "JSON.parse"
~~~
🎯 هدف: صفر.

---

### L4 — showAlert ممنوع، showToast

**چک:**
~~~
grep -rn "showAlert(" src/ --include="*.ts" --include="*.tsx" | wc -l
~~~
🔻 ratchet. هدف نهایی: ۰.

---

### L5 — any ratchet

**چک:**
~~~
grep -rc ": any\|<any>\|as any" src/mod/ --include="*.ts" --include="*.tsx" | awk -F: '{s+=$2} END{print s+0}'
~~~
🔻 ratchet.

**ماژول‌های کامل (هدف صفر):** flk, whs, tra, egg, dlg, hal, alt.
**در جریان (کاهش تدریجی):** inc, set, brd.

---

### L6 — catch خالی ممنوع

`catch {}` بدون log → ممنوع.
- ✅ `catch (e) { try { console.error(...); } catch {} }` — double-catch مجاز
- ❌ `catch {}` یا `catch (e) {}`

**چک:**
~~~
grep -rn "catch {}\|catch (e) {}\|catch(e) {}" src/mod/ --include="*.ts" --include="*.tsx" | wc -l
~~~
🔻 ratchet.

---

### L7 — فایل > ۵۰۰ خط = علامت خطر

**چک:**
~~~
find src/mod -name "*.ts" -o -name "*.tsx" | while read f; do
  n=$(wc -l < "$f"); [ "$n" -gt 500 ] && echo "$n $f"
done
~~~
🔻 ratchet. هر commit ≤ ۴.

**وضعیت فعلی:**
- `flk/store.ts` ۸۲۰
- `flk/components/GroupsPage.tsx` ۵۳۱
- `alt/rules.ts` ۵۸۹
- `inc/DevicesPage.tsx` ۵۰۶

---

### L8 — نام‌گذاری فایل

- صفحه → `XxxPage.tsx`
- مودال → `XxxModal.tsx`
- hook → `hooks/useXxx.ts`
- منطق خالص → `api/xxx.ts`
- helper → `helpers.tsx`
- تایپ → `types-xxx.ts`

---

### L9 — import بین ماژول‌ها فقط از store

`from '../xxx/store'` مجاز. `from '../xxx/components/...'` یا `from '../xxx/hooks/...'` → ممنوع.
فقط در `api/`, `handlers.ts`, `store.ts` مجاز.

**چک:**
~~~
grep -rn "from '\.\./[a-z]*/components\|from '\.\./[a-z]*/hooks" src/mod/ --include="*.ts" --include="*.tsx" | grep -v "/api/\|/handlers"
~~~
🎯 هدف: صفر.

---

### L10 — کامپوننت‌های قفل‌شده

بدون تأیید صریح کاربر، دست نزن:
`SelectSheetShell` · `SmartSelect` · `EditableSelect` · `AutocompleteSheet` · `DependentSelect` · `Field` · `Input` · `EntityLink` · `OverrideHint` · `ExpandableCard`

---

### L11 — هر store action = یک تست

هر action در `mod/<x>/store.ts` که اثر جانبی دارد (add/update/remove/bulk) → تست در `src/test/store-<x>.test.ts` یا `mod/<x>/handlers.test.ts`.

---

### L12 — هر تصمیم معماری → DECISIONS.md

هر تصمیم غیرمشهود در `docs/DECISIONS.md` ثبت شود، append-only.
هر AI جدید قبل از تغییر، `tail -30 docs/DECISIONS.md` بخواند.

---

### L13 — «اول بگرد، بعد بساز»

قبل از ساخت هر کامپوننت، `shr/components/ui` را چک کن. اگر مشابه هست:
1. استفاده کن
2. یا توسعه بده
3. ساخت جدید **ممنوع** بدون ثبت در DECISIONS.md

---

## 🚨 چطور استفاده کنیم

**قبل از هر commit:**
~~~
bash scripts/check.sh
~~~

**قبل از هر تغییر در ماژول جدید:**
~~~
grep -rn "bus\.emit\|bus\.on" src/ --include="*.ts"
grep -rn "useWhs\|useFlk\|useEgg\|useTra" src/mod/<module>/ --include="*.ts" --include="*.tsx"
git status --short
~~~

**اگر AI جدید آمد — بدون این سه، هیچ تغییری مجاز نیست:**
1. `cat docs/CONSTITUTION.md`
2. `bash scripts/check.sh`
3. `tail -30 docs/DECISIONS.md`

---

*این فایل زنده است. بازبینی: هر ۳ جلسه.*
