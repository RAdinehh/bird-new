# TRA-DEALS-GUIDE.md — راهنمای AI برای معاملات خاص

> **این سند برای کیه؟** هر AI یا توسعه‌دهنده‌ای که می‌خواد روی `DealsPage.tsx` یا هر فایل مرتبط با معاملات خاص کار کنه.
>
> **چرا این سند؟** چون این بخش پیچیده‌ترین بخش نرم‌افزاره (Consignment/Partnership/Barter/Conditional) و AI بدون این راهنما، حدس می‌زنه.
>
> **قانون طلایی:** قبل از هر خط کد، این سند رو **کامل** بخون.

---

## 📐 اصول سه‌گانه (قانون طلایی معماری)

هر تغییر در این بخش باید **هر سه** اصل رو رعایت کنه:

### اصل ۱ — هماهنگی بصری (از خرید و فروش)
**منبع الهام:** `InvoiceCard.tsx` و `InvoiceFormModal.tsx`

- استفاده از `Row`, `SectionTitle`, `BtnRow`, `CardActions`, `Badge`
- رنگ‌بندی، فاصله‌گذاری، تایپوگرافی استاندارد
- **دلیل:** کاربر این الگوها رو دیده و عادت کرده

### اصل ۲ — منطق اختصاصی (از معاملات خاص)
**منبع الهام:** `DealsPage.tsx`, `applyDeal.ts`, `settlement.ts`

- معامله ≠ فاکتور (یکی قرارداده، دیگری سند مالی)
- تسویه = محاسبه دوره‌ای، نه فاکتور
- **دلیل:** کپی کردن workflow فاکتور در معامله، ناهماهنگی منطقی می‌سازه

### اصل ۳ — الگوهای مکمل (از گله، پرنده، نژاد)
**منبع الهام:** `FlockCard.tsx`, `FlockHistoryModal.tsx`

- وقتی خرید/فروش چیزی نداره (مثلاً نمایش تاریخچه با modal)
- `EntityLink` برای ارتباط بین ماژول‌ها
- **دلیل:** قبلاً حل شده، از صفر نسازیم

---
## 🗺 نقشه‌ی صفحه (نمودار درختی)

~~~
DealsPage.tsx
├── PageContainer
│   ├── Header (فیلتر، جستجو، سبد زباله)
│   ├── FilterBar
│   ├── ExpandableCard (per deal)
│   │   ├── Header: badge, stats, title, subtitle, accent
│   │   └── Body (وقتی باز):
│   │       ├── 📋 اطلاعات قرارداد       → Row
│   │       ├── 📦 کالاها و موجودی        → Row (per good)
│   │       ├── 💰 خلاصه مالی             → Row
│   │       ├── 📝 توضیحات                → Row
│   │       ├── 📝 یادداشت                → Row (optional)
│   │       └── 📅 تسویه‌های دوره‌ای        → Row + Modal
│   │
│   └── CardActions (پایین کارت): تسویه شد | 📅 تسویه | ✏️ ویرایش | 🗑 حذف
│
├── SettlementModal (ساخت تسویه جدید)
├── SettlementDetailModal (جدید — جزئیات تسویه)
├── SettlementPrint (چاپ تسویه)
├── DealRecycleBinModal (سبد حذف‌شده‌ها)
└── Modal (فرم ایجاد/ویرایش معامله)
~~~

---

## 📦 الگوی هر فرزند (Child)

| فرزند | الگو | اکشن | دلیل |
|-------|------|------|------|
| **اطلاعات قرارداد** | Row | ❌ | فقط نمایش |
| **کالاها (DealGood)** | Row | ❌ | فقط نمایش |
| **تحویل‌ها (DealDelivery)** | Row (داخل کالا) | ❌ | فقط نمایش |
| **فروش‌ها (DealSale)** | Row (داخل کالا) | ❌ | فقط نمایش |
| **پرداخت‌ها (DealPayment)** | خلاصه در خلاصه مالی | ❌ | فقط نمایش |
| **تسویه‌ها (Settlement)** | **Row + کلیک → Modal** | **✅ داخل Modal** | نیاز به ۳+ اکشن |

**قانون:** فرزند با ۳+ اکشن → Modal. فرزند با ۰-۲ اکشن → Row ساده.

---

## 🎬 درخت تصمیم — اکشن کجا بره؟

~~~
آیا اکشن روی کل کارت معامله اثر می‌ذاره؟
│
├─ بله → CardActions پایین کارت
│   مثال: «تسویه شد»، «✏️ ویرایش»، «🗑 حذف»، «📅 تسویه»
│
└─ نه، روی یه فرزند خاص اثر می‌ذاره
    │
    ├─ فرزند فقط نمایشی → هیچ اکشنی
    │   مثال: کالاها، تحویل‌ها، فروش‌ها، پرداخت‌ها
    │
    └─ فرزند نیاز به اکشن داره
        │
        ├─ ۱-۲ اکشن → دکمه inline کوچک (استثنا)
        │   مثال: «حذف» تسویه draft (اختیاری)
        │
        └─ ۳+ اکشن → Modal جدا ⭐ پیش‌فرض
            مثال: تسویه (چاپ، تبدیل، لغو، بازگشت)
            الگو: FlockHistoryModal
~~~

---
## 🚫 Anti-Patterns (ممنوع مطلق)

| # | Anti-Pattern | چرا ممنوع | راه‌حل |
|---|--------------|-----------|---------|
| ۱ | **Card داخل Card** | کاربر گیج می‌شه، سلسله‌مراتب از بین می‌ره | فرزند = Row، اکشن = Modal |
| ۲ | **بیش از ۱ دکمه inline در ردیف فرزند** | شلوغی بصری | همه در Modal |
| ۳ | **Modal با ۵+ دکمه** | شلوغی، اسکرول | Tab یا Step |
| ۴ | **`whiteSpace: nowrap` روی label** | شکستن عمودی متن | فقط روی value |
| ۵ | **`overflowWrap: anywhere` روی Row** | شکستن اعداد | فقط `wordBreak: break-word` |
| ۶ | **`as any`** | TypeScript خاموش | `unknown` + Type Guard |
| ۷ | **`catch {}` خالی** | خطا خفه می‌شه | `console.error('[tag]', e)` |
| ۸ | **پچ بدون grep** | rollback | grep/sed قبل از پچ |
| ۹ | **کامپوننت قفل‌شده بدون تأیید** | نقض L10 | تأیید صریح کاربر |
| ۱۰ | **دکمه inline در stats کارت** | interactive در read-only | Badge یا CardActions |

---

## 📁 فایل‌های مرتبط (File Map)

| فایل | نقش | خط تقریبی |
|------|-----|-----------|
| `DealsPage.tsx` | صفحه اصلی (**هدف: < 500 خط**) | ~1400 |
| `helpers.tsx` | Row, SectionTitle, chip, Line, RowGrid | ~123 |
| `components/SettlementModal.tsx` | ساخت تسویه (input) | ~100 |
| `components/SettlementPrint.tsx` | چاپ سند | ~190 |
| `components/SettlementDetailModal.tsx` | **جدید** — جزئیات تسویه + اکشن‌ها | **~150** |
| `components/DealRecycleBinModal.tsx` | سبد حذف‌شده‌ها | ~178 |
| `applyDeal.ts` | منطق cascade | ~206 |
| `settlement.ts` | computeSettlement + createInvoice | ~150 |
| `store.ts` | state + cascade delete/restore | ~833 |

---

## 📐 الگوهای مرجع (Reference Patterns)

| نیاز | فایل مرجع | الگو |
|------|-----------|------|
| کارت بازشونده (پایه) | `shr/components/ExpandableCard.tsx` | props: title, subtitle, badge, stats, isOpen, onToggle |
| کارت با فرزند + modal | `flk/components/FlockCard.tsx` | کارت + دکمه در CardActions → Modal |
| Modal با KPI + filter + list | `flk/components/FlockHistoryModal.tsx` | KPI + Chip filter + group + BtnRow |
| Modal فرم ساده | `tra/components/SettlementModal.tsx` | Field + DatePicker + BtnRow |
| لیست Row در کارت | `tra/components/InvoiceCard.tsx` (اقساط) | Row + Tag، بدون دکمه |
| Badge overflow | `shr/components/ui/BadgeOverflow.tsx` | +N + modal |
| دکمه‌های کارت | `shr/components/ui/CardActions.tsx` | grid auto-fit + danger/outline/primary |
| Row دو ستونه | `shr/components/ui/RowGrid` | 1fr 1fr |
| دکمه‌های کنار هم | `shr/components/ui/BtnRow` | flex 1:1 |
| نمایش اعداد فارسی | `shr/utils/fa.ts` → `toFa` | همه‌جا استفاده |
| فاکتور از تسویه | `tra/settlement.ts` | origin tracking + cascade |

---
## 🎨 توکن‌های طراحی (فقط از این‌ها استفاده کن)

### رنگ‌ها
| نقش | متغیر | استفاده |
|-----|-------|---------|
| اصلی (اکشن) | `var(--accent)` | تبدیل به فاکتور، ذخیره |
| اطلاعات (آبی) | `var(--info)` | وضعیت confirmed، بنر |
| هشدار (نارنجی) | `var(--warn)` | وضعیت draft، age badge |
| خطر (قرمز) | `var(--danger)` | حذف، لغو، overdue |
| غیرفعال (خاکستری) | `var(--muted)` | text-secondary |
| کارت | `var(--card-solid)` | background |
| ورودی | `var(--input-bg)` | فیلدها، Row |

### فاصله‌ها
| نقش | متغیر |
|-----|-------|
| بسیار کم | `var(--sp-1)` |
| کم | `var(--sp-2)` |
| معمولی | `var(--sp-3)` |
| بخش | `var(--sp-4)` |
| padding داخلی Row | `var(--pad-tight)` |
| padding کارت | `var(--pad-normal)` |

### Radius
- `var(--r-sm)` — Row، دکمه کوچیک
- `var(--r-md)` — Modal، Btn
- `var(--r-lg)` — Card

### فونت
- `var(--fs-2xs)` — کوچک‌ترین (metadata)
- `var(--fs-xs)` — small
- `var(--fs-sm)` — normal (Row value)
- `var(--fs-base)` — base
- `var(--fs-md)` — عنوان بخش

---

## 🎯 محتوای Modal تسویه (SettlementDetailModal)

**⚠️ این محتوا از `SettlementPrint.tsx` گرفته شده — بدون اختراع چیز جدید.**

### 📋 اطلاعات
- شماره قرارداد
- نوع معامله (`DEAL_LABEL[deal.type]`)
- طرف حساب (`party?.name`)
- وضعیت (`statusLabel` با `Tag tone`)
- از تاریخ
- تا تاریخ

### 📦 فروش‌های دوره (`settlement.salesSnapshot`)
- per sale: `Row` با `good?.name`, `qty`, `unitPrice`, `total`
- اگه خالی: `Empty` با متن «فروشی در این دوره ثبت نشده است»

### 💰 خلاصه مالی
- فروش کل (`grossSales`)
- کمیسیون (`commission`)
- خالص قابل پرداخت (`netPayable`)
- دریافت‌شده (`paidAmount`)
- مانده (`balance` = `netPayable - paidAmount`)

### اکشن‌ها (BtnRow)
| وضعیت | دکمه‌ها |
|--------|---------|
| `draft` | 🖨️ چاپ + 🧾 تبدیل به فاکتور + 🗑 حذف |
| `confirmed` | 🖨️ چاپ + 🧾 تبدیل به فاکتور + ✏️ بازگشت به پیش‌نویس |
| `invoiced` | 🖨️ چاپ + 📄 مشاهده فاکتور + ↩️ لغو تبدیل |

---
## 📋 چک‌لیست قبل از هر پچ

قبل از commit، **همه‌ی** اینا رو چک کن:

- [ ] آیا `grep -n "marker" src/...` زدم که این چیز از قبل نیست؟
- [ ] آیا فایل مرجع رو توی جدول بالا دیدم؟
- [ ] آیا از `Row` / `CardActions` / `BtnRow` / `BadgeOverflow` موجود استفاده کردم؟
- [ ] آیا بیش از ۱ دکمه inline در ردیف فرزند گذاشتم؟ (اگر بله → Modal)
- [ ] آیا `whiteSpace: nowrap` یا `overflowWrap: anywhere` استفاده کردم؟ (ممنوع)
- [ ] آیا `as any` جدید اضافه کردم؟ (ممنوع)
- [ ] آیا `catch {}` خالی دارم؟ (ممنوع)
- [ ] آیا کامپوننت قفل‌شده (Field, Input, SmartSelect, ExpandableCard, CardActions) رو دست زدم؟ (تأیید صریح لازم)
- [ ] `npx tsc --noEmit` سبزه؟
- [ ] `npx vitest run` سبزه؟
- [ ] ≤ ۵ فایل در commit؟

---

## 🔍 دستورات اجباری قبل از شروع کار

~~~bash
# ۱. ببین صفحه چه شکلیه
wc -l src/mod/tra/DealsPage.tsx
grep -n "SectionTitle" src/mod/tra/DealsPage.tsx
grep -n "CardActions" src/mod/tra/DealsPage.tsx

# ۲. ببین چه فایل‌هایی هستن
ls src/mod/tra/components/

# ۳. ببین تست‌ها سبزن
npx vitest run src/test/deal-journey.test.ts src/test/store-tra-settlement.test.ts src/test/store-tra-installments.test.ts

# ۴. ببین TSC سبزه
npx tsc --noEmit
~~~

**اگه هر کدوم از این ۴ مرحله fail داد، اول اون رو fix کن، بعد شروع کن.**

---
## 📚 تصمیمات کلیدی مرتبط (از `DECISIONS.md`)

| تصمیم | تأثیر |
|-------|-------|
| Origin tracking (`relatedSettlementId`, `sourceType`) | فاکتور از تسویه، فیلدهای required قفل می‌شن |
| کمیسیون = آیتم منفی | `total = netPayable`، نه `-discount` |
| UI lock برای فاکتور از تسویه | `date`, `partyId`, `category`, `items[]` قفل |
| BadgeOverflow مشترک | همه‌ی کارت‌ها با بج زیاد، از این استفاده می‌کنن |
| تفکیک Badge/Stats | Badge = metadata، Stats = financial فقط |
| CardActions استاندارد | grid auto-fit، `stopPropagation` داخلی |
| فیلتر مخاطبین | فقط `roles.includes('customer')` در SmartSelect |

---

## 🎯 وضعیت فعلی (این نسخه)

**تاریخ:** ۱۴۰۵/۰۸/۰۹
**آخرین commit:** `2c9d6cc5` (docs: complete tra types)

### ✅ DONE
- origin tracking
- cascade delete/restore (settlement ↔ invoice)
- UI lock (فیلدهای required)
- duplicate guard
- bird/breed از گله
- کمیسیون line item
- فیلتر مخاطبین (customers)
- EntityLink در کارت تسویه
- Undo/Reopen Settlement
- CardActions/BtnRow استاندارد
- Badge/Stats استاندارد
- BadgeOverflow مشترک
- helpers.tsx مشترک (Row, SectionTitle, chip)

### ⏸ PENDING (اولویت‌بندی‌شده)
1. 🔴 **Split DealsPage** (۱۵۰۷ → ~۳۰۰ خط)
   - `SettlementDetailModal.tsx` جدید (بازطراحی تسویه‌ها)
   - `DealCard.tsx` جدا
   - `DealsFormModal.tsx` جدا
2. 🟠 `ReceivablesPage` — نمایش اقساط
3. 🟠 `Undo/Reopen Invoice` (فاکتور فروش)
4. 🟡 Lot Tracking (Phase F)
5. 🟡 قرارداد پرورش (FCR/EPEF)

---

## 🚀 نکته نهایی برای AI

**اگه این سند رو تا آخر خوندی:**
- ✅ حالا می‌دونی چه الگویی برای چی استفاده کن
- ✅ می‌دونی Anti-Patternها کدومن
- ✅ می‌دونی قبل از هر پچ چه چیزهایی رو چک کنی

**اگه فقط یه چیز یادت بمونه:**
> **قبل از هر خط کد، `grep` بزن. بعد تصمیم بگیر. نه برعکس.**

**شروع کن:**
~~~bash
cd ~/Bird-new
git log --oneline -3
cat docs/modules/tra-deals.md
npx vitest run src/test/deal-journey.test.ts
~~~

---

*این سند زنده است — با هر تغییر مهم در DealsPage آپدیت کن.*
*آخرین به‌روزرسانی: ۱۴۰۵/۰۸/۰۹*
