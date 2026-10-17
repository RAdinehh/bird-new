# 📮 EVENT-BUS.md — سیستم رویداد محور Bird-new

> قرارداد رسمی Event Bus. هر event جدید باید اینجا ثبت شه.
> آخرین به‌روزرسانی: ۱۴۰۴/۰۷/۲۱ (جلسه ۱۲)

## ⚠️ وضعیت واقعی (اسکن جلسه ۱۲)

| مورد | مقدار |
|---|---|
| ایونت‌های تعریف‌شده | ۱۸ |
| **فعال (ناشر + شنونده)** | **۲** ✅ |
| غیرفعال | ۱۶ 🔴 |
| فایل‌های `handlers.ts` | فقط `flk` |
| فایل‌های ناشر (`bus.emit`) | فقط `dlg` (۲ محل) |

**فقط یک مسیر کار می‌کنه: `dlg → flk`**

## بخش ۱ — چرا Event Bus؟

**مسئله:** ماژول‌های زیاد (۱۸+) → وابستگی مستقیم = circular dependency

**راه‌حل:** ناشر پیام می‌ذاره، مشترک‌ها گوش می‌دن — بدون دونستن از هم.

~~~
❌ روش سنتی:     dlg ─import─► flk     (اگه flk عوض شه، dlg می‌شکنه)
✅ Event Bus:    dlg ─emit─► 📮 bus ─on─► flk     (بی‌خبر از هم)
~~~

### ۶ مزیت
| مزیت | توضیح |
|---|---|
| Decoupling | dlg نمی‌دونه flk وجود داره |
| توسعه‌پذیری | ماژول جدید می‌تونه به همون event گوش بده |
| بدون Circular Dep | A→bus→B جای A↔B |
| تست راحت | هر ماژول جدا |
| قابلیت ردیابی | هر رویداد traceId داره |
| History | ۲۰۰ رویداد اخیر برای دیباگ |

## بخش ۲ — معماری

### فایل‌ها (`src/cor/events/`)

| فایل | نقش |
|---|---|
| `bus.ts` | کلاس EventBus + singleton |
| `events.ts` | تعریف type-safe همه event ها |
| `types.ts` | `EventMeta`، `BusHistoryEntry`، `EmitOptions` |
| `index.ts` | re-export |
| `DebugPanel.tsx` | UI دیباگ (dev mode) |

### Handlers (`src/mod/*/handlers.ts`)

هر ماژول یه `register*Handlers()` داره که در `main.tsx` صدا زده می‌شه:

~~~
// main.tsx
import { registerFlkHandlers } from './mod/flk/handlers';
registerFlkHandlers();
~~~

**⚠️ فعلاً فقط `flk` ثبت شده.**

## بخش ۳ — API کامل

| متد | امضا | کار |
|---|---|---|
| `bus.on` | `(event, handler, opts?) => off` | اشتراک (return تابع لغو) |
| `bus.off` | `(event, handler) => void` | لغو دستی |
| `bus.emit` | `(event, payload, opts?) => void` | انتشار |
| `bus.history` | `(limit?) => BusHistoryEntry[]` | تاریخچه |
| `bus.clear` | `() => void` | پاک کردن تاریخچه |

### `EmitOptions`
- `traceId?` — برای ردیابی
- `source?` — نام ماژول ناشر
- `silent?` — بدون لاگ

## بخش ۴ — جدول کامل ۱۸ ایونت

### dlg — ثبت روزانه (۶ ایونت)

| ایونت | ناشر | emit? | handler? | مشترک هدف |
|---|---|---|---|---|
| `dlg:deaths:recorded` | `useDlgSave` | ✅ | ❌ | flk (کاهش تعداد)، alt، rep |
| `dlg:feed:consumed` | `useDlgSave` | ✅ | ❌ | whs (کاهش دان)، fed |
| `dlg:vaccine:given` | `DlgTabPanel` | ❌ | ❌ | cal، alt |
| `dlg:medication:given` | `DlgTabPanel` | ❌ | ❌ | cal، alt |
| `dlg:egg:recorded` | — | ❌ | ❌ | egg، flk |
| `dlg:log:deleted` | — | ❌ | ❌ | flk، whs |

### flk — گله (۳ ایونت)

| ایونت | ناشر | emit? | handler? | مشترک هدف |
|---|---|---|---|---|
| `flk:flock:created` | flk/store | ❌ | ✅ | dsh، rep |
| `flk:flock:updated` | flk/store | ❌ | ✅ | dsh، rep، hal |
| `flk:flock:archived` | flk/store | ❌ | ❌ | hal (آزادسازی ظرفیت) |

### tra — معاملات (۳ ایونت)

| ایونت | ناشر | emit? | handler? | مشترک هدف |
|---|---|---|---|---|
| `tra:invoice:created` | tra/store | ❌ | ❌ | whs (موجودی)، egg، dsh |
| `tra:invoice:updated` | tra/store | ❌ | ❌ | whs، dsh |
| `tra:invoice:deleted` | tra/store | ❌ | ❌ | whs (rollback)، dsh |

### egg — تولید تخم (۳ ایونت)

| ایونت | ناشر | emit? | handler? | مشترک هدف |
|---|---|---|---|---|
| `egg:production:created` | egg/store | ❌ | ❌ | dsh، rep، whs |
| `egg:production:updated` | egg/store | ❌ | ❌ | dsh، rep |
| `egg:production:deleted` | egg/store | ❌ | ❌ | dsh، rep، whs |

### inc — جوجه‌کشی (۲ ایونت)

| ایونت | ناشر | emit? | handler? | مشترک هدف |
|---|---|---|---|---|
| `inc:hatch:created` | inc/store | ❌ | ❌ | flk (گله جدید)، whs |
| `inc:hatch:deleted` | inc/store | ❌ | ❌ | flk، whs |

### whs — انبار (۱ ایونت)

| ایونت | ناشر | emit? | handler? | مشترک هدف |
|---|---|---|---|---|
| `whs:movement:created` | whs/store | ❌ | ❌ | hal، alt، dsh |

## بخش ۵ — الگوی فعال‌سازی

### گام ۱ — ناشر (emit)

در store یا hook ماژول ناشر:

~~~
import { bus } from '@cor/events';

// بعد از commit موفق:
bus.emit('tra:invoice:created', {
  invoiceId: inv.id,
  partyId: inv.partyId,
  total: inv.total,
  date: inv.date,
}, { source: 'tra' });
~~~

### گام ۲ — شنونده (`handlers.ts`)

فایل جدید `src/mod/<module>/handlers.ts`:

~~~
import { bus } from '@cor/events';
import { useXxx } from './store';

export function registerXxxHandlers() {
  return bus.on('tra:invoice:created', (payload) => {
    // آپدیت موجودی انبار
    useWhs.getState().applyInvoiceImpact(payload);
  }, { source: 'xxx' });
}
~~~

### گام ۳ — ثبت در `main.tsx`

~~~
import { registerFlkHandlers } from './mod/flk/handlers';
import { registerWhsHandlers } from './mod/whs/handlers';
// ...
registerFlkHandlers();
registerWhsHandlers();
~~~

### گام ۴ — تست

هر handler باید تست جدای داشته باشه (`src/test/events.test.ts`).

## بخش ۶ — قواعد آهنین

| # | قاعده |
|---|---|
| ۱ | ایونت جدید → اول در `events.ts` تایپ شه، بعد در همین سند |
| ۲ | هر emit → `source` مشخص (نام ماژول) |
| ۳ | handler حتماً `traceId` رو log کنه (در dev) |
| ۴ | handler نباید throw کنه (catch + log) |
| ۵ | ترتیب اجرا guarantee نداره → handlerها مستقل باشن |
| ۶ | ایونت حذف‌شده → از `events.ts` هم پاک شه |
| ۷ | در prod → `silent: false` فقط برای ایونت‌های حیاتی |

## بخش ۷ — DebugPanel

**مسیر:** `src/cor/events/DebugPanel.tsx`
**فعال:** فقط در `import.meta.env.DEV` یا `?debug=1`
**نمایش:**
- ۲۰۰ رویداد اخیر
- فیلتر بر اساس event name
- traceId + source + timestamp
- payload کامل (JSON)

**دسترسی:** DevTools → زبانه `📮 Events`

## بخش ۸ — نقشه راه فعال‌سازی

### 🔴 اولویت ۱ — مالی و انبار

| ناشر | ایونت | مشترک هدف | ارزش |
|---|---|---|---|
| `tra` | `invoice:created/updated/deleted` | `whs` (موجودی) | 🔴 حیاتی |
| `dlg` | `feed:consumed` | `whs` (کاهش دان) | 🔴 حیاتی |
| `inc` | `hatch:created` | `whs`، `flk` | 🔴 حیاتی |

### 🟡 اولویت ۲ — تولید و آمار

| ناشر | ایونت | مشترک هدف | ارزش |
|---|---|---|---|
| `egg` | `production:created/updated` | `dsh`، `rep` | 🟡 |
| `dlg` | `deaths:recorded` | `flk`، `alt` | 🟡 |
| `whs` | `movement:created` | `alt` (کم‌موجودی) | 🟡 |

### 🟢 اولویت ۳ — سلامت و تقویم

| ناشر | ایونت | مشترک هدف | ارزش |
|---|---|---|---|
| `dlg` | `vaccine:given`، `medication:given` | `cal`، `alt` | 🟢 |
| `dlg` | `log:deleted` | `flk`، `whs` (rollback) | 🟢 |
| `flk` | `flock:created/updated/archived` | `dsh`، `hal`، `rep` | 🟢 |

## بخش ۹ — چک‌لیست فعال‌سازی هر ایونت

قبل از فعال‌سازی:

- [ ] تایپ payload در `events.ts` دقیق ئه؟
- [ ] ناشر در `store` بعد از commit موفق emit می‌کنه؟
- [ ] handler در `handlers.ts` جدید ساخته شد؟
- [ ] `register*Handlers()` در `main.tsx` صدا زده شد؟
- [ ] تست handler نوشته شد؟
- [ ] این سند به‌روز شد؟

## بخش ۱۰ — آنتی‌پترن‌ها

| ❌ ممنوع | ✅ جایگزین |
|---|---|
| handler که throw می‌کنه | try/catch + log |
| emit بدون `source` | `{ source: 'tra' }` |
| ایونت با payload بزرگ (>۵۰KB) | `id` بفرست، نه کل آبجکت |
| سینک بین ۲ ماژول بدون bus | از bus استفاده کن |
| handler با side-effect نامشخص | مستقل و idempotent |

## بخش ۱۱ — آمار پیشرفت

| مورد | مقدار |
|---|---|
| ایونت‌های تعریف‌شده | ۱۸ |
| ایونت‌های فعال | ۲ (۱۱٪) |
| handlers موجود | ۱ (`flk`) |
| ماژول‌های ناشر فعال | ۱ (`dlg`) |
| هدف جلسه ۱۳ | ۶ فعال (۳۳٪) |
| هدف جلسه ۱۵ | ۱۸ فعال (۱۰۰٪) |

---

*آخرین به‌روزرسانی: ۱۴۰۴/۰۷/۲۱ (جلسه ۱۲) — کشف: فقط ۲/۱۸ فعال*
