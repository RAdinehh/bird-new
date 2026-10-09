# 🔍 AUDIT.md — چک‌لیست ممیزی ماژول‌ها

> **قاعده طلایی:** هر ماژول تا نمره ۹۰+ نگیره، قفل نمیشه.
> **منابع:** Apple HIG + Google Core App Quality + Microsoft Store + ISO/IEC 25010 + WCAG 2.1

---

## 📋 چک‌لیست ۷ محوره (۱۰۰ نمره)

### ۱. Functional Suitability (عملکردی) — ۱۵ نمره
- [ ] CRUD کامل (افزودن، ویرایش، حذف)
- [ ] ذخیره و بارگذاری درست
- [ ] اعتبارسنجی ورودی (Zod)
- [ ] Undo برای عملیات مخرب
- [ ] مدیریت خطا و fallback
- [ ] پوشش حالت‌های لبه‌ای (۰، منفی، خالی، تکراری)

### ۲. UX (تجربه کاربری) — ۲۰ نمره
- [ ] Progressive Disclosure (افشای تدریجی)
- [ ] حالت‌های Empty / Loading / Error
- [ ] Inline Validation (اعتبارسنجی زیر فیلد)
- [ ] State Persistence (ذخیره فیلتر، تب، اسکرول)
- [ ] Read-only ≠ Disabled
- [ ] فیلدهای آبشاری (Cascade) درست
- [ ] حداکثر ۷ فیلد در هر مرحله (Form Rules)

### ۳. UI (رابط بصری) — ۲۰ نمره
- [ ] فقط رنگ‌های معنایی (`--accent`, `--warn`, `--danger`, `--info`, `--muted`)
- [ ] رنگ hex هاردکد ممنوع
- [ ] فاصله‌ها مضرب ۸ (`--sp-*`)
- [ ] فونت از توکن‌ها (`--fs-*`)
- [ ] حداقل هدف لمسی ۴۴×۴۴
- [ ] RTL کامل (تأیید راست، لغو چپ)
- [ ] سلسله‌مراتب بصری درست

### ۴. Accessibility (دسترس‌پذیری) — ۱۵ نمره
- [ ] aria-label برای آیکون‌های تنها
- [ ] Focus trap + Esc در مودال‌ها
- [ ] ناوبری با کیبورد (Tab, Enter, Esc)
- [ ] کنتراست ≥ ۴.۵:۱
- [ ] Reduced motion
- [ ] Screen reader

### ۵. Performance (کارایی) — ۱۰ نمره
- [ ] بدون N+1 (کوئری‌های تکراری)
- [ ] useMemo/useCallback برای محاسبات سنگین
- [ ] کش کردن داده‌های سنگین
- [ ] Lazy loading

### ۶. Integration (اتصالات) — ۱۰ نمره
- [ ] لینک‌های بین‌ماژولی (EntityLink)
- [ ] فیلترهای URL (useUrlFilter)
- [ ] Context passing
- [ ] AutoFill از والد

### ۷. Senior Review (بازبینی ارشد) — ۱۰ نمره
- [ ] **Edge Cases:** ۰، منفی، ۹۹۹۹۹۹، کاراکتر خاص، تاریخ نامعتبر، null، تکراری
- [ ] **Loading & Async:** Skeleton، Error state، Retry
- [ ] **User Control:** Undo، Confirmation، Esc
- [ ] **Empty & Error:** پیام آموزنده، اکشن قابل انجام
- [ ] **Data Integrity:** Auto-save draft، Cascade delete
- [ ] **Cognitive Load:** فرم ≤ ۷ فیلد، Helper text
- [ ] **Consistency:** Spacing tokens، Color semantics، Button styles
- [ ] **Polish:** بدون alert()، بدون hardcode، بدون TODO

---

## 📊 جدول نمره‌دهی

| نمره | رتبه |
|:---:|---|
| ۹۵-۱۰۰ | Google/Apple Quality |
| ۹۰-۹۴ | Production Ready |
| ۸۰-۸۹ | Needs polish |
| ۷۰-۷۹ | Needs work |
| < ۷۰ | Not ready |

---

## 🚀 فرآیند AUDIT

1. انتخاب ماژول (مثلاً `brd`)
2. تب‌به‌تب بررسی (پرنده‌ها → نژادها)
3. نمره‌دهی طبق ۷ محور
4. Fix تا رسیدن به ۹۰+
5. قفل ماژول
6. ماژول بعدی

---

## 🔒 الگوهای قفل‌شده

### OverrideHint
- کامپوننت: `src/shr/components/OverrideHint.tsx`
- hook: `src/shr/hooks/useOverride.ts`
- استفاده: `const { hint } = useOverride({...}); <OverrideHint {...hint} />`
- طراحی: متن زرد + خط نقطه‌چین زیر فیلد، کلیک → بازگشت

### فلش SVG استاندارد
`<path d="m6 9 6 6 6-6" />` — ۱۶×۱۶، stroke=var(--muted)
اعمال در: `SmartSelect.tsx`, `AutocompleteSheet.tsx`

### SourceBadge
- فقط آیکون ۱۶×۱۶ داخل برچسب فیلد
- `manual` یا `none` → هیچ آیکونی
- ✓ سبز=استاندارد | ⚡ آبی=preset | ⬆ زرد=والد

---

## 📌 نحوه فرمان دادن

| فرمان | معنی |
|---|---|
| «AUDIT brd» | بررسی ماژول پرنده و نژاد |
| «AUDIT hal» | بررسی ماژول سالن |
| «AUDIT flk» | بررسی ماژول گله |

---

*سند زنده — با هر ماژول تموم‌شده، به‌روز می‌شه.*
