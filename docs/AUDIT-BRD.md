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

### ۱. Functional Suitability — ۱۵ نمره ⏳
- [ ] CRUD کامل
- [ ] ذخیره/بارگذاری درست
- [ ] اعتبارسنجی Zod
- [ ] Undo
- [ ] مدیریت خطا
- [ ] حالت‌های لبه‌ای

### ۲. UX — ۲۰ نمره ⏳
- [ ] Progressive Disclosure
- [ ] Empty/Loading/Error
- [ ] Inline Validation
- [ ] State Persistence
- [ ] Read-only ≠ Disabled
- [ ] Cascade درست
- [ ] ≤ ۷ فیلد در هر مرحله

### ۳. UI — ۲۰ نمره ⏳
- [ ] فقط رنگ‌های معنایی
- [ ] بدون hex هاردکد
- [ ] فاصله مضرب ۸
- [ ] فونت از توکن
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

### ۵. Performance — ۱۰ نمره ⏳
- [ ] بدون N+1
- [ ] useMemo/useCallback
- [ ] کش
- [ ] Lazy loading

### ۶. Integration — ۱۰ نمره ⏳
- [ ] EntityLink
- [ ] فیلترهای URL
- [ ] Context passing
- [ ] AutoFill از والد

### ۷. Senior Review — ۱۰ نمره ⏳
- [ ] Edge Cases
- [ ] Loading & Async
- [ ] User Control
- [ ] Empty & Error
- [ ] Data Integrity
- [ ] Cognitive Load
- [ ] Consistency
- [ ] Polish

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
- [ ] ممیزی محور ۱ (Functional)
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
