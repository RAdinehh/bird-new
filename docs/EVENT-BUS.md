# 📮 EVENT-BUS.md — سیستم رویداد محور Bird-new

> این سند قرارداد رسمی Event Bus است. هر event جدید باید اینجا ثبت شه.
> آخرین به‌روزرسانی: جلسه ۱۲

---

## بخش ۱ — چرا Event Bus؟

**مسئله:** ماژول‌های زیاد (۲۰+) → وابستگی مستقیم = circular dependency

**راه‌حل:** ناشر یه پیام می‌ذاره، مشترک‌ها گوش می‌دن — بدون دونستن از هم.


~~~
❌ روش سنتی:     dlg ─import─► flk     (اگه flk عوض شه، dlg می‌شکنه)
✅ Event Bus:    dlg ─emit─► 📮 bus ─on─► flk     (بی‌خبر از هم)
~~~

### ۶ مزیت کلیدی
| مزیت | توضیح |
|---|---|
| Decoupling | dlg نمی‌دونه flk وجود داره |
| توسعه‌پذیری | ماژول جدید می‌تونه به همون event گوش بده |
| بدون Circular Dep | A→bus→B جای A↔B |
| تست راحت | هر ماژول جدا |
| قابلیت ردیابی | هر رویداد traceId داره |
| History | ۲۰۰ رویداد اخیر برای دیباگ |

---

## بخش ۲ — معماری

### فایل‌ها (src/cor/events/)
| فایل | نقش |
|---|---|
| bus.ts | کلاس EventBus + singleton |
| events.ts | تعریف type-safe همه event ها |
| types.ts | EventMeta، BusHistoryEntry، EmitOptions |
| index.ts | re-export |
| DebugPanel.tsx | UI دیباگ (dev mode) |

### Active handlers (src/mod/*/handlers.ts)
هر ماژول یه register*Handlers() داره که توی main.tsx صدا زده می‌شه:

~~~
// main.tsx
import { registerFlkHandlers } from './mod/flk/handlers';
registerFlkHandlers();
~~~


---

## بخش ۳ — API کامل

| متد | امضا | کار |
|---|---|---|
| bus.on | (event, handler, opts?) => off | اشتراک (return تابع لغو) |
| bus.off | (event, handler) => void | لغو دستی |
| bus.once | (event, handler) => off | یک‌بار مصرف |
| bus.emit | async (event, data, meta?) => result | انتشار (async) |
| bus.getHistory | () => BusHistoryEntry[] | ۲۰۰ رویداد اخیر |
| bus.clearHistory | () => void | پاک کردن history |
| bus.getListeners | (event?) => any[] | لیست listenerها |
| bus.setDevMode | (on: boolean) => void | فعال دیباگ |
| bus.reset | () => void | تست |

### خروجی emit
~~~
{
  traceId: string;      // شناسه زنجیره علیت
  duration: number;     // میلی‌ثانیه
  handlerCount: number; // چند listener
  errors: any[];        // خطاهای handler ها
}
~~~

### Options برای on
~~~
bus.on('event', handler, {
  once: true,      // یک‌بار مصرف
  id: 'custom-id'  // شناسه دلخواه (پیش‌فرض auto)
})
~~~

---

## بخش ۴ — Type Safety

همه event ها توی events.ts به صورت interface تعریف می‌شن:

~~~
export interface AppEvents {
  'dlg:deaths:recorded': DlgDeathsRecorded;
  'dlg:log:deleted': DlgLogDeleted;
}

export type AppEventName = keyof AppEvents;
export type AppEventData<K extends AppEventName> = AppEvents[K];
~~~

**نتیجه:** TypeScript خودش چک می‌کنه که data با event match ئه.

---

## بخش ۵ — الگوی نام‌گذاری

~~~
{module}:{entity}:{action}

مثال‌ها:
  dlg:deaths:recorded
  dlg:log:deleted
  tra:invoice:created
  flk:flock:archived
~~~

**قواعد:**
- اسم ماژول: از mod/ (dlg, flk, tra, ...)
- entity: مفرد، snake_case
- action: گذشته ساده (created, recorded, deleted)


---

## بخش ۶ — Events فعلی

### فعال (۲ event)

| event | emitter | listener | کار |
|---|---|---|---|
| dlg:deaths:recorded | useDlgSave.ts:176 · DlgTabPanel.tsx:102 | flk/handlers.ts:5 | کاهش currentCount + ثبت death event |
| dlg:log:deleted | useDlgSave.ts:210 | flk/handlers.ts:69 | برگرداندن currentCount |

### تعریف‌شده ولی متصل‌نشده (۱۶ event)

| event | ماژول | roadmap |
|---|---|---|
| dlg:feed:consumed | dlg | کاهش موجودی انبار |
| dlg:vaccine:given | dlg | هشدار cal |
| dlg:medication:given | dlg | هشدار cal |
| dlg:egg:recorded | dlg | به‌روز egg stock |
| tra:invoice:created | tra | به‌روز whs + egg |
| tra:invoice:updated | tra | بازگشت موجودی قبلی |
| tra:invoice:deleted | tra | حذف اثرات |
| flk:flock:created | flk | به‌روز dsh |
| flk:flock:updated | flk | رفرش KPI |
| flk:flock:archived | flk | حذف از alt + dsh |
| egg:production:created | egg | به‌روز dsh |
| egg:production:updated | egg | رفرش KPI |
| egg:production:deleted | egg | بازگشت stock |
| inc:hatch:created | inc | ساخت گله خودکار |
| inc:hatch:deleted | inc | حذف اثرات |
| whs:movement:created | whs | هشدار کم‌موجودی |

---

## بخش ۷ — Events پیشنهادی (roadmap)

| event | ناشر | مشترک‌ها | کار |
|---|---|---|---|
| hal:hall:deleted | hal | flk, dsh, alt | هشدار گله بدون سالن |
| hal:zone:deleted | hal | flk | پاک کردن zoneId گله‌ها |
| brd:breed:updated | brd | flk, hal, egg | رفرش استانداردها |
| set:standards:changed | set | همه | رفرش Single Resolver |
| whs:item:low-stock | whs | alt, dsh | هشدار سفارش |
| cal:event:approaching | cal | alt, dsh | هشدار واکسن |
| inc:hatch:completed | inc | flk | پیشنهاد ساخت گله |


---

## بخش ۸ — قوانین (کِی event بسازیم؟)

### event بساز وقتی:
- ۲+ ماژول باید از یه رویداد باخبر شن
- ناشر و شنونده نباید مستقیم هم رو بشناسن
- عملیات async ئه و می‌شه decouple کرد
- می‌خوای traceability داشته باشی

### event نساز وقتی:
- فقط ۱ listener داری (مستقیم import کن)
- داده‌ی sync لازمه (event async ئه)
- عملیات خیلی ساده‌ست (over-engineering)

### نکات مهم:
۱. async ئه — نمی‌تونی منتظر نتیجه باشی
۲. ترتیب تضمین نمی‌شه — اگه order مهمه، صریح باش
۳. خطاها collect می‌شن ولی emit متوقف نمی‌شه
۴. memory leak: همیشه unsubscribe کن (return on)

---

## بخش ۹ — مثال Publisher / Subscriber

### Publisher (dlg — ثبت تلفات)

~~~
// useDlgSave.ts
import { bus } from '../../../cor/events';

await bus.emit('dlg:deaths:recorded', {
  logId: log.id,
  flockId: log.flockId,
  date: log.date,
  count: totalDeaths,
  deaths: log.deaths,
  isEdit,
  prevCount,
  prevFlockId,
}, { source: 'dlg' });
~~~

### Subscriber (flk — گوش می‌ده)

~~~
// flk/handlers.ts
import { bus } from '../../cor/events';
import { useFlk } from './store';

export function registerFlkHandlers(): () => void {
  const off = bus.on('dlg:deaths:recorded', (data, meta) => {
    const flk = useFlk.getState();
    // کاهش currentCount
    // ثبت event
  });
  return off;  // لغو در unmount
}
~~~

### ثبت در main.tsx

~~~
import { registerFlkHandlers } from './mod/flk/handlers';

registerFlkHandlers();  // یک‌بار در startup
~~~


---

## بخش ۱۰ — نکات مهم

### async بودن
~~~
// غلط
const result = bus.emit('event', data);
console.log(result.handlerCount); // Promise!

// درست
const result = await bus.emit('event', data);
console.log(result.handlerCount);
~~~

### Memory Leak
~~~
// غلط (در useEffect)
useEffect(() => {
  bus.on('event', handler); // unsubscribe نمی‌شه
}, []);

// درست
useEffect(() => {
  const off = bus.on('event', handler);
  return off; // cleanup
}, []);
~~~

### ترتیب مشترک‌ها
listenerها به ترتیب ثبت صدا زده می‌شن. اگه order مهمه، با id صریح ذخیره کن.

### traceId
هر emit یه traceId می‌گیره که به همه listenerها پاس داده می‌شه — برای دیباگ زنجیره علیت.

---

## بخش ۱۱ — تست

~~~
import { bus } from './bus';

beforeEach(() => bus.reset());

it('event رو می‌فرسته', async () => {
  const handler = vi.fn();
  bus.on('dlg:deaths:recorded', handler);

  await bus.emit('dlg:deaths:recorded', { /* data */ });

  expect(handler).toHaveBeenCalledOnce();
});

it('once فقط یک‌بار', async () => {
  const handler = vi.fn();
  bus.once('event', handler);
  await bus.emit('event', {});
  await bus.emit('event', {});
  expect(handler).toHaveBeenCalledOnce();
});
~~~

bus.reset() برای پاک کردن همه listenerها و history.


---

## بخش ۱۲ — Dev Mode + DebugPanel

~~~
bus.setDevMode(true);  // فعال دیباگ
bus.getHistory();      // ۲۰۰ رویداد اخیر
~~~

DebugPanel.tsx یه UI برای مشاهده زنده history ئه (فقط dev).

---

## بخش ۱۳ — چک‌لیست event جدید

قبل افزودن event جدید:

- توی events.ts interface تعریف شد؟
- توی AppEvents map اضافه شد؟
- توی سند (بخش ۶) ثبت شد؟
- حداقل ۱ listener داره؟ (اگه نه، dead code)
- unsubscribe در unmount رعایت شد؟
- داده‌ها JSON-serializable هستن؟

---

## مرجع

- src/cor/events/bus.ts — پیاده‌سازی
- src/cor/events/events.ts — تعریف events
- src/cor/events/types.ts — تایپ‌ها
- src/mod/flk/handlers.ts — مثال subscriber
- src/mod/dlg/hooks/useDlgSave.ts — مثال publisher

---

*سند زنده — با هر event جدید تکمیل می‌شه.*
