# 📚 TYPE-REGISTRY.md — جدول تایپ‌های پروژه Bird-new

> **هدف:** جلوگیری از `any`. قبل از نوشتن `any` → اینجا رو ببین.
> آخرین به‌روزرسانی: ۱۴۰۴/۰۷/۲۱

---

## 🎯 قانون طلایی

قبل از نوشتن `: any` → **۳ گام:**

1. **اینجا رو ببین** — شاید تایپ آماده باشه
2. **اگه هست** → import کن
3. **اگه نیست** → `unknown` استفاده کن، یا تایپ جدید تعریف کن

---

## 📦 تایپ‌های ماژول‌ها

| ماژول | تایپ‌ها | مسیر import |
|---|---|---|
| **alt** | `AlertLevel` · `AlertCategory` · `AlertStatus` · `Alert` | `import type { ... } from "@mod/alt/store"` |
| **brd** | `Bird` · `Breed` | `import type { ... } from "@mod/brd/store"` |
| **cal** | `EventType` · `EventStatus` · `CalEvent` | `import type { ... } from "@mod/cal/store"` |
| **ctc** | `Role` · `Person` | `import type { ... } from "@mod/ctc/store"` |
| **dlg** | `Death` · `LogStatus` · `WeightSample` · `Vaccine` · `Medication` · `Activity` · `DailyLog` | `import type { ... } from "@mod/dlg/store"` |
| **doc** | `DocFile` · `DocCategory` | `import type { ... } from "@mod/doc/store"` |
| **egg** | `EggType` · `EggProduction` · `EggStock` · `EggSale` | `import type { ... } from "@mod/egg/store"` |
| **fed** | `IngredientCategory` · `Ingredient` · `Requirement` · `FormulaLine` · `Formula` | `import type { ... } from "@mod/fed/store"` |
| **flk** | `FlockType` · `FlockStatus` · `FlockEventType` · `FlockEventSex` · `FlockEvent` · `FlockMergeSource` · `FlockMergeInfo` · `Flock` · `Lifecycle` | `import type { ... } from "@mod/flk/store"` |
| **hal** | `HallSource` · `Hall` · `Zone` · `EquipmentKind` · `EquipmentStatus` · `EquipmentCategory` · `EquipmentUnit` · `Equipment` | `import type { ... } from "@mod/hal/store"` |
| **inc** | `DeviceMode` · `DeviceStatus` · `DealType` · `DealStatus` · `EntryStatus` · `MaintenanceLog` · `DeviceCapacity` · `Device` · `HatchGroup` · `EggEntry` · `Candling` · `HatchResult` | `import type { ... } from "@mod/inc/store"` |
| **set** | `Settings` | `import type { ... } from "@mod/set/store"` |
| **whs** | `ItemCategory` · `ItemUnit` · `MovementType` · `MovementReason` · `Item` · `Movement` | `import type { ... } from "@mod/whs/store"` |

---

## 🪝 Hooks و تایپ‌های برگشتی

| Hook | خروجی | مسیر |
|---|---|---|
| `useBreedStandard()` | `breedStd` — استانداردهای نژاد | `shr/hooks/useBreedStandard.ts` |
| `useFormat()` | `fmt` — فرمت اعداد فارسی | `shr/units` |
| `useMultiSelect<T>()` | `MultiSelectState<T>` | `shr/multiSelect/useMultiSelect.ts` |
| `useValidation()` | `{ errors: Record<string, string> }` | `shr/validation/useValidation.ts` |

---

## 🎯 قاعده‌های جایگزینی `any`

| به جای | استفاده کن |
|---|---|
| `(x: any)` در `.map` | `(x: <تایپ دقیق>)` از جدول بالا |
| `useState<any[]>` | `useState<<تایپ>[]>` |
| `Record<string, any>` | `Record<string, unknown>` |
| `(v: any) => ...` در callback | `(v: <تایپ دقیق>)` |
| `props: any` | `props: <Props>` |
| `as any` | `as <تایپ دقیق>` یا `as unknown as <تایپ>` |

---

## ⚠️ استثناها (مورد قبول)

موارد زیر `any` دارن ولی **مجاز** هستن:

- **کتابخانه‌های خارجی** بدون تایپ رسمی → با comment توضیح
- **`JSON.parse()`** → `any` یا `unknown` + چک
- **پروتوتایپ سریع** → با TODO برای بعد

---

## 🚨 اگه شک داری

- **`any`** = خاموش کردن TypeScript → **ممنوع**
- **`unknown`** = امن + چک لازم → **خوب**
- **تایپ دقیق** = بهترین → **هدف ما**

---

*این سند زنده است — با هر تایپ جدید تکمیل می‌شه.*
