# 🌿 PARADIGM — پارادایم‌های درمانی

> **سند طراحی** — تعریف می‌کند نرم‌افزار چطور هم مدرن و هم سنتی باشد، بدون حذف یکی.
> هر کد مرتبط باید به این فایل ارجاع دهد.

---

## 🎯 مسئله

| موضوع | مدرن | سنتی |
|---|---|---|
| رطوبت جوجه هفته ۱ | ۶۰٪ | ۳۰٪ |
| مصرف گندم در جیره | X گرم/روز | Y گرم/روز |
| اسپند دود کردن | بی‌اثر | توصیه‌شده |
| لباس محافظ | اجباری | اختیاری |

**نمی‌شود** «هر دو را نشان بده» — تناقض گیج می‌کند.
**نمی‌شود** «یکی را انتخاب کن» — کاربر مجبور به دروغ می‌شود.
**راه‌حل:** پارادایم فعال + رجیستری + هشدار تضاد.

---

## 🧬 مدل

### Paradigm

~~~ts
type Paradigm = 'modern' | 'traditional' | 'herbal' | 'mixed';
~~~

### ParadigmProfile

~~~ts
interface ParadigmProfile {
  active: Paradigm[];
  primary: Paradigm;
  respectConflicts: boolean;
}
~~~

### StandardValue<T>

~~~ts
interface StandardValue<T> {
  value: T;
  paradigm: Paradigm;
  source?: string;
  notes?: string;
}
~~~

### Standard<T>

~~~ts
interface Standard<T> {
  key: string;
  label: string;
  unit?: string;
  values: StandardValue<T>[];
}
~~~

---

## 📋 نمونه رجیستری

~~~ts
const standards: Standard<any>[] = [
  {
    key: 'humidity-chick-week1',
    label: 'رطوبت جوجه هفته ۱',
    unit: '٪',
    values: [
      { value: 60, paradigm: 'modern', source: 'ASABE poultry standard' },
      { value: 30, paradigm: 'traditional', source: 'طب سنتی' },
    ],
  },
  {
    key: 'feed-wheat-ratio',
    label: 'نسبت گندم در جیره',
    unit: '٪',
    values: [
      { value: 50, paradigm: 'modern', source: 'NRC poultry' },
      { value: 30, paradigm: 'traditional', source: 'روش سنتی' },
    ],
  },
  {
    key: 'esfand-burning',
    label: 'اسپند دود کردن',
    values: [
      { value: false, paradigm: 'modern' },
      { value: true, paradigm: 'traditional', source: 'توصیه سنتی' },
    ],
  },
];
~~~

---

## 🎨 رفتار UI

### تک‌پارادایمی

`active = ['modern']`:
- فقط مقدار `modern` نمایش داده می‌شود
- مقدار سنتی حتی نشان داده نمی‌شود
- کاربر حتی نمی‌داند گزینه دیگر هست

### ترکیبی

`active = ['modern', 'traditional']`:
- هر مقدار با **برچسب پارادایم**
- تضاد → هشدار (نه خطا)
- پیش‌فرض مقدار پارادایم `primary`
- کاربر می‌تواند مرجع انتخاب کند

### فقط سنتی

`active = ['traditional']`:
- فقط سنتی در همه جا

---

## 🔌 لایه ایمنی

~~~ts
interface InteractionWarning {
  severity: 'info' | 'warn' | 'danger';
  message: string;
  sources: string[];
}

function checkParadigmConflicts(
  activeValues: Record<string, StandardValue<any>>
): InteractionWarning[];
~~~

- هشدار با برچسب: «منبع سنتی می‌گوید X — تصمیم با شما»
- نرم‌افزار تصمیم نمی‌گیرد

---

## 🧩 ماژول‌ها

### کتابخانه‌ها

- `library/modern` — دارو شیمیایی، واکسن، استانداردهای بین‌المللی
- `library/herbal` — گیاهان دارویی
- `library/traditional` — نسخه‌های سنتی (قانون ابن‌سینا)
- `library/supportive` — درمان حمایتی

### بارگذاری

کتابخانه اختیاری. اگر `active` شامل `herbal` نباشد، بارگذاری نمی‌شود.

---

## 🔗 ارتباط با TreatmentLine

~~~ts
type TreatmentLine = {
  paradigm: Paradigm;
  refId: string;
  dose?: string;
  notes?: string;
};
~~~

یک نسخه = چند `TreatmentLine` (مدرن + گیاهی + حمایتی). تداخل → `checkParadigmConflicts`.

---

## 📊 کجا استفاده شود

| بخش | استفاده |
|---|---|
| تنظیمات کاربر | `ParadigmProfile` |
| فرم ثبت روزانه | مقدار با برچسب |
| فرم تجویز | کتابخانه + خطوط |
| گزارش | مرجع پارادایم در پایین |
| هشدارها | `checkParadigmConflicts` |

---

## ⚠️ چه نمی‌کند

- ❌ تصمیم نمی‌گیرد کدام پارادایم درست است
- ❌ مقادیر را خودکار انتخاب نمی‌کند
- ❌ کاربر را مجبور به انتخاب نمی‌کند
- ❌ توصیه پزشکی نمی‌کند

---

## 🎯 پیاده‌سازی

| مرحله | کار |
|---|---|
| ۱ | `shr/paradigm/types.ts` + `registry.ts` (۳-۴ استاندارد) |
| ۲ | `useParadigm` hook |
| ۳ | کامپوننت `StandardHint` |
| ۴ | اتصال به `DlgTabPanel` |
| ۵ | `checkParadigmConflicts` |
| ۶ | کتابخانه `traditional` |
| ۷ | اتصال به فرم تجویز |

---

*این فایل طراحی است. پیاده‌سازی هنوز آغاز نشده.*
