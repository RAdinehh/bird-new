# FLK-COST-ANALYSIS.md — منطق هزینه‌های گله

> **وضعیت:** سند طراحی (deferred) — پیاده‌سازی در جلسه آینده
> **تاریخ:** ۱۴۰۵/۱۱/۰۲
> **منبع:** بررسی استاندارد جهانی (SAP B1، Odoo Poultry، FAO TCP) + feedback کاربر

---

## 🚨 مشکل فعلی

### کارت گله (FlockCard) — کادر «قیمت پرنده‌ها»

**فرمول فعلی:**
```
قیمت پرنده‌ها = قیمت هر پرنده × تعداد اولیه
جمع کل = قیمت پرنده‌ها + هزینه حمل + سایر هزینه‌ها
هر پرنده = جمع کل ÷ تعداد اولیه
```

**نمایش فعلی (مثال واقعی):**
```
قیمت پرنده‌ها: 46,865,000 ت
هزینه حمل: 2,000,000 ت
جمع کل: 48,865,000 ت
💰 هر پرنده: 107,396 ت
```

### ⚠️ چرا این نمایش گمراه‌کننده است

۱. **اسم گمراه‌کننده:** «قیمت پرنده‌ها» → کاربر فکر می‌کند **بهای تمام‌شده واقعی** است.
۲. **ناقص:** فقط خرید + حمل + سایر اولیه را شامل می‌شود — نه دان، دارو، کارگر، برق.
۳. **مخرج اشتباه:** `initialCount` (نه `currentCount`) — پرنده‌های مرده هزینه‌ای پرداخت کرده‌اند که بین بازمانده‌ها تقسیم نمی‌شود.
۴. **statique در برابر live:** در حالی که بهای واقعی هر روز بالاتر می‌رود (دان، دارو) این عدد ثابت است.

### مثال گمراه‌کنندگی

```
455 جوجه خرید 107,396/پرنده

اگر 100 جوجه بمیرند → 355 باقی
- تقسیم بر 455 (فعلی): هر پرنده 107,396 ← گمراه‌کننده
- تقسیم بر 355 (استاندارد): هر پرنده 137,648 ← بهای واقعی هر پرنده زنده
- تفاوت: 30,252 ت × 355 = 10,739,460 ت هزینه پنهان
```

**در یک چرخه کامل (۴۰ روز گوشتی):**
```
خرید + حمل: 48,865,000 (26%)
دان: ~54,000,000 (52%)   ← بزرگترین هزینه!
دارو + واکسن: ~3,000,000 (3%)
کارگر + برق + آب: ~8,000,000 (8%)
استهلاک: ~5,000,000 (5%)
────────────────────────────────────
بهای واقعی هر پرنده زنده: ~254,000 ت
(نه 107,396 ت)
```

---

## 🌍 استاندارد جهانی

### SAP B1 (Controlling / Cost Center)

- **Cost Center** جداگانه برای هر گله
- **Cost Component** جداگانه: feed (60-70٪)، labor، medicine، overhead
- **Per Unit Cost** به‌صورت **روزانه** (Daily Cost Roll-up)
- **گزارش استاندارد:** Total Cost of Production (TOP) per Bird to Date

### Odoo (Poultry Module)

- **Cost Line** برای هر روز (feed_consumed، medicine، labor_hours)
- **Roll-up خودکار** به flock
- **Real-time Cost per Bird** در dashboard

### FAO Guidelines

- **Fixed Costs** (خرید گله، زیرساخت) → محاسبه یک‌بار
- **Variable Costs** (دان، دارو، برق) → جمع‌بندی روزانه
- **Total Cost per Bird** = (Fixed + Σ Variable) / current_birds

### خلاصه اصول استاندارد

| اصل | پیاده‌سازی |
|---|---|
| مخرج = `currentCount` | هزینه پرنده‌های مرده بین بازمانده‌ها تقسیم می‌شود |
| جدا کردن fixed از variable | snapshot در برابر live |
| تفکیک category (feed/labor/medicine) | هر دسته جدا گزارش می‌شود |
| Roll-up روزانه (نه لحظه‌ای) | performance + ذهنی برای کاربر |

---

## 🏗 معماری پیشنهادی (سه لایه)

### لایه ۱ — ذخیره داده (Data Sources)

| منبع هزینه | ماژول | Action | وضعیت |
|---|---|---|---|
| خرید جوجه | `tra` | فاکتور خرید | ✅ |
| حمل | `tra`/`flk` | فیلد `deliveryCost` | ✅ |
| سایر اولیه | `flk` | فیلد `otherCosts` | ✅ |
| **دان مصرفی** | `dlg` | `feedAmount` روزانه | ⚠️ ثبت می‌شود، جمع‌بندی به گله ندارد |
| **دارو/واکسن** | `dlg` | بخش سلامت | ⚠️ ثبت می‌شود، جمع‌بندی ندارد |
| **کارگر/برق/آب** | ❌ **هیچ‌جا نیست** | باید UI ثبت اضافه شود | 🔴 **GAP** |
| **استهلاک تجهیزات** | ❌ | باید اضافه شود | 🔴 **GAP** |

### لایه ۲ — محاسبه (Service Layer)

**فایل جدید:** `src/mod/flk/api/costService.ts`

```typescript
export interface CostBreakdown {
  purchaseCostPerBird: number;
  dynamicCostPerBird: number;
  totalCostPerBird: number;
  currentCount: number;
  feedCost: number;
  medicineCost: number;
  laborCost: number;
  otherCost: number;
}

export function computeLiveCostPerBird(
  flockId: string,
  date: string,
): CostBreakdown { ... }
```

**فرمول استاندارد:**
```
Total Cost = purchaseCost + Σ(daily_feed + daily_medicine + daily_labor + daily_other)
Cost per Bird = Total Cost / currentCount
```

### لایه ۳ — نمایش (UI — دو جای جداگانه)

#### 📍 جای ۱ — کارت گله (snapshot خرید)

```
💵 بهای خرید:
   قیمت پرنده‌ها: 46,865,000 ت
   هزینه حمل: 2,000,000 ت
   سایر: 0 ت
   ─────────────────
   بهای خرید هر پرنده: 107,396 ت

   ℹ️ این فقط هزینه خرید است — برای دیدن بهای واقعی، به تب «هزینه‌ها» بروید
```

#### 📍 جای ۲ — تب جدید «هزینه‌ها» (Cost Dashboard)

```
📊 بهای واقعی — گله «مرندی قدیم»

┌─ خلاصه ─────────────────────────────┐
│ بهای خرید: 48,865,000 ت              │
│ بهای جاری: 54,000,000 ت (دان + دارو) │
│ بهای کل: 102,865,000 ت               │
└──────────────────────────────────────┘

┌─ هر پرنده ─────────────────────────┐
│ خرید: 107,396 ت                     │
│ جاری: 118,681 ت                     │
│ ─────────────────                    │
│ کل: 226,077 ت per bird              │
│ (مبنا: 455 پرنده زنده)              │
└──────────────────────────────────────┘

┌─ تفکیک ─────────────────────────────┐
│ 🌾 دان: 54M (52٪) → 118,681/پرنده   │
│ 💊 دارو: 3M (3٪) → 6,593/پرنده       │
│ 🚚 حمل: 2M (2٪) → 4,395/پرنده        │
│ 🐣 خرید: 46.8M (43٪) → 102,857/پرنده │
└──────────────────────────────────────┘

📈 Trend: هر روز X تومان اضافه می‌شود
💡 پیش‌بینی برداشت: ~254,000 ت/پرنده
```

---

## 📋 سه فاز پیاده‌سازی

### 🟢 فاز ۱ — تغییر اسم (سریع، ۱۰ دقیقه)

**هدف:** صادقانه کردن snapshot فعلی، بدون تغییر منطق.

**تغییرات:**
- `FlockCard.tsx`: «قیمت پرنده‌ها» → «بهای خرید پرنده‌ها»
- `FlockCard.tsx`: «هر پرنده» → «بهای خرید هر پرنده»
- خط info جدید: «فقط هزینه خرید — نه بهای تمام‌شده. برای بهای واقعی، تب «هزینه‌ها» (به‌زودی)»

**فایل‌ها:**
- `src/mod/flk/components/FlockCard.tsx` (یا `FlockDetailsSection.tsx`)

### 🟠 فاز ۲ — Cost Dashboard (متوسط، ۳-۴ ساعت)

**هدف:** محاسبه بهای واقعی از داده‌های موجود (`dlg` + `fed`).

**تغییرات:**
1. **`costService.ts` (جدید):**
   - `computeLiveCostPerBird(flockId, date)` — فرمول بالا
   - `rollupFeedCost(flockId, from, to)` — Σ `dlg.feedAmount × feed.unitPrice`
   - `rollupMedicineCost(flockId, from, to)` — Σ `dlg.medicine.amount`
2. **تب جدید «هزینه‌ها» در FlockCard:**
   - Component جدید `FlockCostTab.tsx`
   - نمایش خلاصه + تفکیک + trend
3. **Roll-up در store:**
   - `flk` یا `dlg` — cached cost breakdown per flock
   - به‌روزرسانی روزانه (نه لحظه‌ای)

**فایل‌های درگیر:**
- `src/mod/flk/api/costService.ts` (جدید)
- `src/mod/flk/components/FlockCostTab.tsx` (جدید)
- `src/mod/flk/components/FlockCard.tsx` (استفاده)

### 🔴 فاز ۳ — Labor/Utility UI (بزرگ، ۵-۶ ساعت)

**هدف:** پر کردن GAP‌های داده (کارگر، برق، آب، استهلاک).

**گزینه‌های معماری:**
- **A)** بخش جدید در `dlg` (روزانه): «هزینه‌های جاری» — labor_hours، electricity_kwh، water_liters
- **B)** ماژول جدید `acc` (حسابداری): هزینه‌های عمومی که به گله تخصیص می‌یابند
- **C)** فیلدهای جدید در `flk` (ماهانه): `monthlyLaborCost`, `monthlyUtilityCost`

**پیشنهاد:** گزینه A — هم‌راستا با `dlg` (روزانه)

**فایل‌های درگیر:**
- `src/mod/dlg/components/` — بخش جدید «هزینه‌های جاری»
- `src/mod/dlg/store.ts` — داده‌های جدید
- `costService.ts` — شامل labor/utility
- `src/test/store-dlg.test.ts` — تست جدید

---

## 🚨 GAP ها (نیازمند پیاده‌سازی)

| # | GAP | فاز | اولویت |
|---|---|---|---|
| ۱ | اسم snapshot فعلی گمراه‌کننده است | ۱ | 🔴 فوری |
| ۲ | دان/دارو جمع‌بندی نمی‌شوند در گله | ۲ | 🟠 |
| ۳ | `currentCount` به عنوان مخرج استفاده نمی‌شود | ۲ | 🟠 |
| ۴ | کارگر/برق/آب جایی برای ثبت ندارد | ۳ | 🟠 |
| ۵ | استهلاک تجهیزات محاسبه نمی‌شود | ۳ | 🟡 |
| ۶ | پیش‌بینی برداشت (projected cost) ندارد | ۳ | 🟡 |
| ۷ | مقایسه با استاندارد Ross 308 ندارد | ۳ | 🟡 |

---

## 📊 تصمیمات کلیدی

### تصمیم ۱ — جدا کردن snapshot از live
- **چرا:** دو نوع داده با هدف متفاوت — snapshot خرید (حسابداری) و live cost (مدیریت روزانه)
- **منبع:** SAP B1 — Cost Center جداگانه برای هر type

### تصمیم ۲ — مخرج = `currentCount` برای بهای زنده
- **چرا:** هزینه پرنده مرده بین بازمانده‌ها تقسیم می‌شود
- **منبع:** Ross 308 Manual, FAO TCP

### تصمیم ۳ — Roll-up روزانه (نه لحظه‌ای)
- **چرا:** perf + ذهنی برای کاربر
- **منبع:** Odoo — daily roll-up نه real-time

### تصمیم ۴ — UI جداگانه برای snapshot و live
- **چرا:** کاربر نباید snapshot تاریخی را با live مقایسه کند
- **منبع:** SAP Fiori — دو view جداگانه

---

## 🎯 دستورالعمل برای AI بعدی

**قبل از شروع فاز ۲:**
1. `grep -n "feedAmount\|medicine" src/mod/dlg/store.ts` — ببین داده‌ها در کجا ذخیره می‌شن
2. `grep -n "calcCosts" src/mod/flk/` — ببین تابع فعلی چطور کار می‌کنه
3. verify که `dlg.feedAmount` به `flock` roll-up می‌شه یا نه
4. **اگر roll-up نشده:** اول roll-up بساز، بعد costService

**قبل از فاز ۳:**
1. با کاربر تصمیم بگیر: `dlg` vs `acc` vs `flk` برای labor/utility
2. L11 test الزامی (طبق AGENTS.md)

---

## 🔗 منابع

- `src/mod/flk/components/FlockCard.tsx` — نمایش فعلی
- `src/mod/flk/components/FlockDetailsSection.tsx` — بخش هزینه‌ها
- `src/mod/flk/store.ts` → `calcCosts()` — محاسبه فعلی
- `src/mod/dlg/store.ts` → `deathsCount`, `feedAmount`, `medicine` — data sources
- `docs/modules/validation-intelligence-map.md` — الگوی Gap documentation

---

*این سند deferred است — پیاده‌سازی در جلسه آینده، بعد از معاملات و مطالبات.*
