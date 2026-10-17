# 🚀 AI-BOOT — هر AI اول این را بخوان

> پروژه Bird-new — نرم‌افزار مدیریت مرغداری (PWA فارسی، RTL، آفلاین)
> این فایل، **نقطه شروع** است. عمق در فایل‌های دیگر است.
> **آخرین بازنویسی: جلسه ۱۴ (1404/07/28)** — پس از کشف اینکه اسناد قبلی غیرقابل‌اعتماد بودند.

---

## 🚨 پنج فایل مقدس — قبل از هر کار

**بدون خواندن این ۵ فایل، هیچ تغییری مجاز نیست.**

۱. `docs/CONSTITUTION.md` — ۱۳ قانون کد + ratchet
۲. `docs/UI-PATTERNS.md` — ۱۳ بخش الگوهای UI
۳. `docs/DECISIONS.md` — تاریخچه تصمیمات (۳۰ خط اول)
۴. `docs/PARADIGM.md` — پارادایم‌های درمانی (مدرن/سنتی)
۵. `docs/COMPLEX-SCENARIOS.md` — سناریوهای پیچیده

**قبل از هر commit:**
~~~bash
bash scripts/check.sh
~~~

---

## 🚨 ۱۰ قانون حیاتی UX فرم (بخوان، حفظ کن، اجرا کن)

**این ۱۰ قانون از ۷۰ دستور `UX-FORM-RULES.md` استخراج شده — قبل از هر تغییر UI، چک کن:**

| # | قانون | چک سریع |
|---|---|---|
| ۱ | Error فقط بعد از `saveAttempted` | `grep -n "saveAttempted\|setSaveAttempted"` |
| ۲ | Error با تایپ پاک شود | `grep -n "onErrorClear\|setErr('')"` |
| ۳ | Error blame-free، کنار فیلد، پیام مخصوص هر فیلد | `grep -n "Field.*error"` |
| ۴ | بدون emoji در error (⚠️/💡 ممنوع) | `grep -rn "⚠️\|💡" src/mod/*/components/*Modal.tsx` |
| ۵ | دکمه ذخیره فعال بماند (نه disabled) | `grep -n "disabled.*save\|disabled.*ذخیره"` |
| ۶ | Placeholder = مثال، نه تکرار label | ذهنی |
| ۷ | Auto-fill فارسی (`toFa`) + Override کاربر | `grep -n "toFa\|autoFields"` |
| ۸ | Grid2 برای کوتاه، Row برای بلند | ذهنی |
| ۹ | Single Source of Truth (مثلاً تجهیزات فقط از تجهیزات) | `grep -n "ventilationSystem\|feederType"` |
| ۱۰ | قبل از fix، grep. tsc خطا → rollback نه fix | فرایند |

**قوانین کامل (۷۰ دستور):** `docs/UX-FORM-RULES.md` — قبل از هر ماژول جدید مرور کن.

**اولویت‌بندی کاربردی:**
۱. **۶۵-۷۰** (روش کار) — همیشه
۲. **۱۲-۲۲** (Error + پیام پویا) — مهم‌ترین UX
۳. **۳۱-۳۵** (Sync + Single Source) — جلوگیری از باگ
۴. **۳۶-۴۱** (Layout) — یکدستی بصری
۵. **۱-۱۱** (Placeholder + Required) — ظاهر
۶. **۴۲-۶۱** (KPI + مدال + تجهیزات)
۷. **۶۲-۶۴** (Legacy)

---

## 🎯 اصل اول — کد مرجع است، سند نیست

اسناد قدیمی (`EVENT-BUS.md` قدیمی، `NEXT.md` قدیمی، `AI-BOOT.md` قدیمی) **اثبات شده که اشتباه بودند**:
- ادعا کردند `dlg:feed:consumed` فعال است — نبود
- ادعا کردند `flk/store.ts` ۸۱۹ any دارد — ۸۱۹ خط بود، ۲ any
- ادعا کردند `inc` ماژول دست‌نخورده — فعال بود، وابستگی غیرمستقیم داشت

**قانون طلایی:** قبل از هر تصمیم، **grep بزن**. حافظه و سند، اعتبار ندارند.

~~~bash
grep -rn "bus\.emit\|bus\.on" src/ --include="*.ts"
grep -rn "useWhs\|useFlk\|useEgg\|useTra" src/mod/<module>/ --include="*.ts" --include="*.tsx"
git status --short
~~~

---

## 📊 وضعیت ماژول‌ها (تأیید‌شده روی کد، جلسه ۱۴)

### ✅ کامل (هدف: فقط تعمیر)

| ماژول | any | تست | گروه |
|---|---|---|---|
| `flk` | ۰ | ۷/۷ پاس | Farmbrite-aligned |
| `whs` | ۶۹ | دارد | bus handler دارد |
| `tra` | ۴۰ | — | bus emit دارد |
| `egg` | ۲۰ | — | bus emit دارد |
| `dlg` | ۲۵ | دارد | bus emit دارد |
| `hal` | ۸ | — | — |
| `alt` | ۱۲ | — | — |

### 🟡 در جریان

| ماژول | any | نکته |
|---|---|---|
| `inc` | ۱۵۵ | بزرگ، دستگاه‌ها، جوجه‌کشی |
| `set` | ۱۲۲ | تنظیمات |
| `brd` | ۶۱ | پرنده و نژاد |
| `dsh`, `fed`, `rep`, `cal`, `ctc` | مجموع ۱۰۲ | — |

### 🔴 دست‌نخورده

`whs/warnings`, `arc`

---

## 🏛 قوانین آهنین (خلاصه — تفصیل در CONSTITUTION.md)

| # | قانون |
|---|---|
| L1 | state فقط از store، خواندن با hook |
| L2 | Event Bus برای side-effect، نه خواندن |
| L4 | showAlert ممنوع — showToast |
| L5 | any ratchet — فقط کاهش |
| L6 | catch خالی ممنوع |
| L7 | فایل > ۵۰۰ خط = علامت خطر |
| L9 | cross-module فقط از store |
| L13 | اول بگرد، بعد بساز |

---

## 🎨 UI (خلاصه — تفصیل در UI-PATTERNS.md)

- **RTL ریشه است**
- **مقیاس ۴dp** (CSS variable `--sp-*`)
- **`type="text"`** برای عدد (نه number)
- **onBlur** اعتبارسنجی
- **خطا کنار فیلد**، نه بنر
- **۴۴×۴۴** حداقل لمس
- **WCAG 2.2 AA**
- **تضاد پارادایم = نمایش هر دو با برچسب** (PARADIGM.md)

---

## 🔒 کامپوننت‌های قفل‌شده

بدون تأیید صریح کاربر، دست نزن:
`SelectSheetShell` · `SmartSelect` · `EditableSelect` · `AutocompleteSheet` · `DependentSelect` · `Field` · `Input` · `EntityLink` · `OverrideHint` · `ExpandableCard`

---

## 📋 پروتکل پاسخ‌دهی

هر پاسخ با هدر شروع:
~~~
📍 کار: [نام] | قدم: [X/Y]
~~~

بعد از هر قدم: `✅ X/Y` + قدم بعد.

هر ۳ پیام یک re-anchor:
~~~
⏸ re-anchor: کار=X، قدم=Y، NEXT.md می‌گه Z
~~~

**خروج از NEXT.md بدون تأیید ممنوع.**

---

## 🎬 شروع سریع (چک‌لیست AI جدید)

- [ ] `cat docs/CONSTITUTION.md`
- [ ] `cat docs/UI-PATTERNS.md`
- [ ] `tail -30 docs/DECISIONS.md`
- [ ] `cat docs/PARADIGM.md`
- [ ] `cat docs/COMPLEX-SCENARIOS.md`
- [ ] `bash scripts/check.sh` — وضعیت فعلی
- [ ] `git status --short` + `git log --oneline -5`
- [ ] اسکن ماژول مد نظر با grep
- [ ] بعد شروع کن

**بدون این ۸ قدم، شروع نکن.**

---

## ⚠️ اشتباهات AI قبلی (تکرار نکن)

۱. ادعای بی‌پشتوانه از سند قدیمی — همیشه grep
۲. مهاجرت چیزی که از مسیر غیرمستقیم کار می‌کرد (`inc→whs`)
۳. کار در ماژول بدون تست (الان تست دارد)
۴. فرض کردن `Empty`/`PageContainer` نمی‌توانند `action` رندر کنند — با کد چک کن
۵. rollback کردن به‌خاطر خطای تایپ خودش — fix ساده امن‌تر است
۶. نوشتن همه چیز در یک پیام — تکه‌تکه بده

---

## ✅ چک‌لیست پایان هر قدم

- [ ] `npx tsc --noEmit` پاس؟
- [ ] `npx vitest run` — تست‌های مربوطه پاس؟
- [ ] `bash scripts/check.sh` پاس؟
- [ ] `docs/DECISIONS.md` آپدیت (اگر تصمیم معماری بود)؟
- [ ] `python3 ~/auto_fast.py "پیام commit"`

---

## 📌 اسناد قدیمی — دیگر استناد نکن

- ~~`AI-BOOT.md` قدیمی~~ (این جایگزینش)
- ~~`NEXT.md` قدیمی~~ (این جایگزینش)
- ~~`EVENT-BUS.md` قدیمی~~ — بخش وضعیت تصحیح شد، ولی مرجع نهایی نیست
- ~~`PROGRESS.md`~~ — فقط تاریخچه commit، نه وضعیت فعلی

---

*این فایل DNA پروژه است. بعد از هر جلسه بازبینی کن.*
