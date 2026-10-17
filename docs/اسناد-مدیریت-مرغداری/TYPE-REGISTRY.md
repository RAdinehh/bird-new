# 📚 TYPE-REGISTRY.md — جدول تایپ‌های پروژه Bird-new

> **هدف:** جلوگیری از `any`. قبل از نوشتن `any` → اینجا رو ببین.
> آخرین به‌روزرسانی: ۱۴۰۴/۰۷/۲۱ (جلسه ۱۲) — استخراج‌شده از store‌های واقعی

## 🎯 قانون طلایی

قبل از نوشتن `: any` → **۳ گام:**

1. **اینجا رو ببین** — شاید تایپ آماده باشه
2. **اگه هست** → import کن
3. **اگه نیست** → `unknown` استفاده کن، یا تایپ جدید تعریف کن

## 📦 تایپ‌های ماژول‌ها

| ماژول | تایپ‌ها | مسیر import |
|---|---|---|
| **alt** | `AlertLevel` · `AlertCategory` · `AlertStatus` · `Alert` | `@mod/alt/store` |
| **brd** | `Bird` · `Breed` | `@mod/brd/store` |
| **cal** | `EventType` · `EventStatus` · `CalEvent` | `@mod/cal/store` |
| **ctc** | `Role` · `Person` | `@mod/ctc/store` |
| **dlg** | `Death` · `LogStatus` · `WeightSample` · `Vaccine` · `Medication` · `Activity` · `DailyLog` | `@mod/dlg/store` |
| **doc** | `DocFile` · `DocCategory` | `@mod/doc/store` |
| **egg** | `EggType` · `EggProduction` · `EggStock` · `EggSale` | `@mod/egg/store` |
| **fed** | `IngredientCategory` · `Ingredient` · `Requirement` · `FormulaLine` · `Formula` | `@mod/fed/store` |
| **flk** | `FlockType` · `FlockStatus` · `FlockEventType` · `FlockEventSex` · `FlockEvent` · `FlockMergeSource` · `FlockMergeInfo` · `FlockDealType` · `FlockDealData` · `FlockGroupType` · `FlockGroupRule` · `FlockGroup` · `FlockGroupMember` · `Flock` · `Lifecycle` | `@mod/flk/store` |
| **hal** | `HallSource` · `Hall` · `Zone` · `EquipmentKind` · `EquipmentStatus` · `EquipmentCategory` · `EquipmentUnit` · `Equipment` | `@mod/hal/store` |
| **inc** | `DeviceMode` · `DeviceStatus` · `DealType` · `DealStatus` · `EntryStatus` · `MaintenanceLog` · `DeviceCapacity` · `DeviceReading` · `Device` · `HatchGroup` · `EggEntry` · `Candling` · `HatchResult` | `@mod/inc/store` |
| **set** | `Settings` | `@mod/set/store` |
| **tra** | `InvoiceType` · `PaymentMethod` · `InvoiceStatus` · `DealType` · `PaymentTerms` · `WorkflowStatus` · `CheckStatus` · `Installment` · `Deferral` · `InvoiceItem` · `Payment` · `Invoice` · `Deal` · `State` | `@mod/tra/types` |
| **whs** | `ItemCategory` · `ItemUnit` · `MovementType` · `MovementReason` · `Item` · `Movement` | `@mod/whs/store` |

## 🏷 تایپ‌های Payload vs FormData (قانون ۱۸)

**قانون:** دو تایپ متفاوت با یه اسم → ممنوع!

| تایپ | نقش | منبع | نوع داده |
|---|---|---|---|
| `*Payload` | Zod (نهایی) | `shr/validation/` | `number` |
| `*FormData` | Form state | `hooks/use*Form` | `string` |

**مثال‌ها:**

~~~
// ✅ درست
export type HallPayload = z.infer<typeof HallSchema>;      // number
export interface HallFormData { length: string; }          // string

// ❌ غلط — تضاد!
export type HallFormData = z.infer<typeof HallSchema>;
~~~

**چرا؟**
- کاربر تایپ می‌کنه → string
- Zod اعتبارسنجی می‌کنه → number
- اگه اسم یکسان باشه → تضاد بی‌پایان

## 🪝 Hooks و تایپ برگشتی

| Hook | خروجی | مسیر |
|---|---|---|
| `useBreedStandard()` | `breedStd` — استانداردهای نژاد | `shr/hooks/useBreedStandard.ts` |
| `useFormat()` | `fmt` — فرمت اعداد فارسی | `shr/units` |
| `useMultiSelect<T>()` | `MultiSelectState<T>` | `shr/multiSelect/useMultiSelect.ts` |
| `useValidation()` | `{ errors: Record<string, string> }` | `shr/validation/useValidation.ts` |
| `useFormErrors()` | `{ markTouched, showError, attemptSave }` | `shr/hooks/useFormErrors.ts` |
| `useCarousel()` | `{ active, go, next, prev, panelRef }` | `shr/hooks/useCarousel.ts` |
| `useTabBadge()` | `Record<string, number>` | `shr/hooks/useTabBadge.ts` |
| `useBodyScrollLock()` | `void` | `shr/hooks/useBodyScrollLock.ts` |
| `useFlocksForm()` | `{ form, set, vErrors, save }` | `mod/flk/hooks/useFlocksForm.ts` |
| `useFlocksKpi()` | KPI آمار گله | `mod/flk/hooks/useFlocksKpi.ts` |
| `useGroupKpi()` | KPI آمار گروه | `mod/flk/hooks/useGroupKpi.ts` |

## 🎯 قاعده‌های جایگزینی `any`

| به جای | استفاده کن |
|---|---|
| `(x: any)` در `.map` | `(x: <تایپ دقیق>)` از جدول بالا |
| `useState<any[]>` | `useState<<تایپ>[]>` |
| `Record<string, any>` | `Record<string, unknown>` |
| `(v: any) => ...` در callback | `(v: <تایپ دقیق>)` |
| `props: any` | `props: <Props>` |
| `as any` | `as <تایپ دقیق>` یا `as unknown as <تایپ>` |
| `Map<string, any[]>` | `Map<string, <تایپ>[]>` |
| `Function` | `(...args: unknown[]) => unknown` |
| `Object` | `Record<string, unknown>` |
| `event: any` | `React.ChangeEvent<HTMLInputElement>` |
| `ref: any` | `React.RefObject<HTMLDivElement>` |

## 📊 وضعیت `any` فعلی (جلسه ۱۲)

| ماژول | any | وضعیت |
|---|---|---|
| `inc` | ۱۵۵ | 🔴 فوری |
| `set` | ۱۲۲ | 🔴 |
| `shr` | ۸۸ | 🟡 |
| `whs` | ۶۴ | 🟡 |
| `brd` | ۶۱ | 🟡 (قفل‌شده ولی!) |
| `tra` | ۴۰ | 🟡 |
| `cor` | ۲۸ | 🟢 |
| `dsh` | ۲۷ | 🟢 |
| `dlg` | ۲۵ | 🟢 |
| `fed` | ۲۴ | 🟢 |
| `egg` | ۱۸ | 🟢 |
| `rep` | ۱۷ | 🟢 |
| `cal` | ۱۶ | 🟢 |
| `alt` | ۱۲ | 🟢 |
| `hal` | ۸ | ✅ |
| `ctc` | ۳ | ✅ |
| `flk` | ۲ | ✅ |
| **مجموع** | **~۷۱۰** | |

## 🛡 Type Guards — جایگزین امن `any`

### الگوی پایه

~~~
// ✅ Type Guard برای event handler
function isInvoice(obj: unknown): obj is Invoice {
  return typeof obj === 'object' && obj !== null && 'id' in obj && 'type' in obj;
}

bus.on('tra:invoice:created', (payload) => {
  if (!isInvoice(payload)) return;
  // حالا payload از نوع Invoice است
});
~~~

### Type Guard های رایج

| موقعیت | الگو |
|---|---|
| Form data خام | `typeof x === 'string'` |
| آپشن‌های داینامیک | `Array.isArray(x)` |
| داده از `JSON.parse` | `is<T>(obj, keys)` |
| `unknown` از API | تایپ اختصاصی + `is` |
| رویداد Event Bus | `is<EventName>(payload)` |

## 📮 Event Payload Types (از `cor/events/events.ts`)

| ایونت | Payload type |
|---|---|
| `dlg:deaths:recorded` | `DlgDeathsRecorded` |
| `dlg:feed:consumed` | `DlgFeedConsumed` |
| `dlg:vaccine:given` | `DlgVaccineGiven` |
| `dlg:medication:given` | `DlgMedicationGiven` |
| `dlg:egg:recorded` | `DlgEggRecorded` |
| `dlg:log:deleted` | `DlgLogDeleted` |
| `tra:invoice:created` | `TraInvoiceCreated` |
| `tra:invoice:updated` | `TraInvoiceUpdated` |
| `tra:invoice:deleted` | `TraInvoiceDeleted` |
| `flk:flock:created` | `FlkFlockCreated` |
| `flk:flock:updated` | `FlkFlockUpdated` |
| `flk:flock:archived` | `FlkFlockArchived` |
| `egg:production:created` | `EggProductionCreated` |
| `egg:production:updated` | `EggProductionUpdated` |
| `egg:production:deleted` | `EggProductionDeleted` |
| `inc:hatch:created` | `IncHatchCreated` |
| `inc:hatch:deleted` | `IncHatchDeleted` |
| `whs:movement:created` | `WhsMovementCreated` |

**Import:** `import type { TraInvoiceCreated } from '@cor/events'`

## ⚠️ استثناها (موارد مجاز `any`)

موارد زیر `any` دارن ولی **مجاز** هستن:

| موقعیت | چرا | راه‌حل بهتر |
|---|---|---|
| کتابخانه بدون تایپ | تایپ رسمی نداره | `@types/xxx` یا issue |
| `JSON.parse()` | ذاتاً unknown ئه | `unknown` + Type Guard |
| Migration قدیمی | schema عوض شده | تایپ دقیق + comment |
| Prototype سریع | TODO | حذف TODO تا بعد |

**قانون:** هر `any` مجاز → **کامنت توضیحی بالای خط**:

~~~
// @any-justified: کتابخانه qrcode تایپ رسمی ندارد
const qr = new QRCode(el, opts as any);
~~~

## 📋 چک‌لیست قبل از commit

قبل از هر commit، این ۵ چک:

- [ ] هیچ `: any` جدیدی اضافه نشده؟
- [ ] هیچ `as any` جدیدی اضافه نشده؟
- [ ] تایپ‌های جدید در این سند ثبت شدن؟
- [ ] `npx tsc --noEmit` صفر خطا؟
- [ ] `python3 scripts/check-any.py` OK؟

## 🚨 اگه شک داری

| گزینه | نتیجه |
|---|---|
| **`any`** | ❌ خاموش کردن TypeScript — ممنوع |
| **`unknown`** | ✅ امن + چک لازم — خوب |
| **تایپ دقیق** | ✅ بهترین — هدف ما |
| **Generic** | ✅ انعطاف + امن — بهترین برای کامپوننت‌های عمومی |

## 📌 ابزارها

| ابزار | کار |
|---|---|
| `scripts/check-any.py` | چک `any` در فایل‌های staged |
| `chk` (alias) | اجرای سریع check-any |
| `npx tsc --noEmit` | چک کامل تایپ‌ها |
| `docs/TYPE-REGISTRY.md` (این) | جدول مرجع |

## 🎯 هدف

| مرحله | any فعلی | هدف |
|---|---|---|
| جلسه ۱۲ | ~۷۱۰ | — |
| جلسه ۱۴ | — | < ۵۰۰ |
| جلسه ۱۶ | — | < ۳۰۰ |
| جلسه ۱۸ | — | < ۱۰۰ |
| نهایی | — | ۰ |

---

*این سند زنده است — با هر تایپ جدید تکمیل می‌شه.*
*آخرین به‌روزرسانی: ۱۴۰۴/۰۷/۲۱ (جلسه ۱۲)*
