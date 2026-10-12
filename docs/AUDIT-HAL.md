# 🔍 AUDIT-HAL.md — ممیزی ماژول سالن

> ماژول: `hal` (سالن‌ها + بخش‌ها + تجهیزات)
> تاریخ ممیزی: ۱۴۰۴/۰۷/۲۰
> مرجع: `docs/FOUNDATION.md` + `FOUNDATION-PATTERNS.md`

---

## 📊 وضعیت نهایی

| معیار | نتیجه |
|---|---|
| 📏 اندازه فایل ≤ ۴۰۰ | ✅ همه |
| 🎨 UI hardcode | ✅ صفر |
| 🎨 Hex hardcode | ✅ صفر |
| ⚠️ as any > ۵ | ✅ صفر |
| 🔄 Single Resolver | ✅ صفر نقض |
| 🏛 Master Data | ✅ صفر نقض |
| 🧪 tsc | ✅ ۰ خطا |

---

## 🏗 ساختار نهایی

### فایل‌های اصلی:
| فایل | خط | نقش |
|---|---|---|
| `store.ts` | 302 | Zustand store |
| `index.tsx` | 106 | Tab wrapper |
| `HallsPage.tsx` | 399 | صفحه سالن‌ها |
| `ZonesPage.tsx` | 357 | صفحه بخش‌ها |
| `EquipmentPage.tsx` | 311 | صفحه تجهیزات |
| `HallEquipSection.tsx` | 396 | بخش تجهیزات سالن |

### کامپوننت‌های استخراج‌شده:
| فایل | خط |
|---|---|
| `components/EquipmentCard.tsx` | — |
| `components/EquipmentFormModal.tsx` | — |
| `components/ZoneFormModal.tsx` | 115 |
| `components/HallEquipModals.tsx` | — |
| `components/HallEquipCatRow.tsx` | — |
| `components/CategoryPicker.tsx` | — |
| `components/HallsFormModal.tsx` | — |

### Hooks و Helpers:
| فایل | نقش |
|---|---|
| `useEquipmentForm.ts` | state + logic فرم تجهیزات |
| `_typedLabels.ts` | دسترسی type-safe به label maps |
| `_equipHelpers.ts` | helper تجهیزات |
| `_equipUnitsCore.ts` + `_equipUnitsExtras.ts` | واحدهای تجهیزات |
| `_labels.ts` | label maps |

---

## 🔧 fix های انجام‌شده

### ۱. کاهش اندازه فایل‌ها:
- `EquipmentPage`: ۴۳۷ → **۳۱۱ خط** (استخراج `useEquipmentForm`)
- `ZonesPage`: ۴۱۴ → **۳۵۷ خط** (استخراج `ZoneFormModal`)

### ۲. توکنی‌سازی UI:
- `helpers.tsx`: ۶ مورد
- `ZonesPage`: ۱ مورد
- `HallEquipSection`: ۱۷ مورد
- `HallEquipModals`: ۱۴ مورد
- `CategoryPicker`, `HallEquipCatRow`, `HallsFormModal`, `EquipmentCard`, `EquipmentFormModal`: ۳۲ مورد

### ۳. حذف `as any`:
- `EquipmentPage`: ۱۰ → ۰
- `HallsPage`: ۸ → ۳
- `HallEquipSection`: ۷ → ۵
- `EquipmentCard`: ۱۵ → ۲ (با `_typedLabels.ts`)

---

## 📝 نکات معماری

### Master Data vs Operations (قانون ۱۶):
- ✅ `hal` consumer استانداردهاست (پرنده، نژاد)
- ✅ از `useBrd` می‌خونه، نه خودش می‌سازه

### Single Resolver (قانون ۱۵):
- ✅ `hal` استانداردها رو از طریق resolver می‌خونه
- ✅ هیچ خوانش مستقیم از `DEFAULT_STANDARDS`

### Cascade:
- ✅ بخش (Zone) → سالن (Hall) → پرنده/نژاد
- ✅ `SmartSelect` برای انتخاب والد

---

## ⏳ کارهای باقی‌مانده (آینده)

### 🔴 فایل‌های نزدیک به ۴۰۰ خط:
- `HallsPage.tsx` (۳۹۹) — نیاز به جداسازی احتمالی
- `HallEquipSection.tsx` (۳۹۶) — نیاز به جداسازی احتمالی

### 🟡 بهبودهای احتمالی:
- `HallsPage` → استخراج `HallCard` و `HallsFormModal`
- `HallEquipSection` → استخراج زیرکامپوننت‌ها
- تست UI: کاربر واقعی

### 🟢 اتصالات بین‌ماژولی (بعد):
- `hal → brd`: پرنده/نژاد سالن
- `hal → flk`: گله‌های فعال توی سالن
- `hal → tra`: خرید/فروش تجهیزات
- `hal → alt`: هشدارهای تجهیزات

---

## 🎯 نتیجه

**ماژول hal آماده‌ی استفاده‌ست.** هیچ مشکل بحرانی نداره.
فقط ۲ فایل نزدیک ۴۰۰ خط که جلسه‌ی بعد می‌تونیم جدا کنیم.

---

*ممیزی‌شده در جلسه ۱۴۰۴/۰۷/۲۰*
