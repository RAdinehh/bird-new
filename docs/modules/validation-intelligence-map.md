# VALIDATION-INTELLIGENCE-MAP.md — نقشه کامل اعتبارسنجی و سیستم هوشمند

> این سند برای هر AI یا توسعه‌دهنده‌ای که می‌خواد روی اعتبارسنجی، هشدار، یا Intelligence کار کنه.
>
> چرا؟ سیستم اعتبارسنجی Bird-new از ۵ لایه تشکیل شده که در ۱۵ فایل با ۱۹۷۸ خط کد پیاده شده. بدون این نقشه، هر AI حدس می‌زنه.
>
> قانون طلایی: کد = تنها معیار. قبل از هر تغییر، این سند رو کامل بخون.

---

## معماری ۵ لایه

| لایه | نام | کجا | نقش |
|------|-----|-----|-----|
| ۱ | Zod (سختگیرانه) | validation/rules/*.ts | بلاک ذخیره |
| ۲ | FieldProfiles | intelligence/fieldProfiles.ts | ۱۳۵ فیلد، تنظیم هشدار |
| ۳ | AnomalyDetector | intelligence/anomalyDetector.ts | تشخیص ۸ سیگنال |
| ۴ | HistoryStore | intelligence/historyStore.ts | تورمی (localStorage) |
| ۵ | FormatWarning + UI | intelligence/formatWarning.ts + FieldHint | ۱۲ الگوی پیام |

---

## تفکیک ۲ مفهوم مهم

### Warning = هشدار هوشمند (لایه ۳-۴)
- کاربر مقدار وارد می‌کنه → AnomalyDetector چک می‌کنه → اگه غیرعادی بود، Warning
- کاربر می‌تونه ذخیره کنه (block نیست)
- منبع: profile + history + cross-field

### Error = خطای Zod (لایه ۱)
- کاربر مقدار وارد می‌کنه → Zod چک می‌کنه → اگه نامعتبر بود، Error
- ذخیره ممکن نیست (block کامل)
- منبع: MSG / requiredStr / hardcoded

---

## فایل‌های سیستم (حجم واقعی)

| فایل | خط | نقش |
|------|-----|-----|
| intelligence/fieldProfiles.ts | ۳۳۵ | ۱۳۵ فیلد profile |
| intelligence/anomalyDetector.ts | ۳۰۰ | تشخیص ۸ سیگنال |
| intelligence/formatWarning.ts | ۲۵۲ | ۹۵ لیبل + ۱۲ الگو |
| intelligence/historyStore.ts | ۲۲۱ | تورمی |
| intelligence/types.ts | ۱۲۲ | ۱۵ نوع TypeScript |
| intelligence/useAnomalyHint.ts | ۴۴ | Hook |
| intelligence/AnomalyHint.tsx | ۴۵ | کامپوننت |
| intelligence/FieldHint.tsx | ۲۳ | کامپوننت |
| validation/helpers.ts | ۲۵۴ | Zod helpers |
| validation/biological.ts | ۱۲۹ | استاندارد زیستی |
| validation/fieldRegistry.ts | ۱۱۱ | رجیستری |
| validation/types.ts | ۴۷ | ValidationResult |
| validation/useValidation.ts | ۳۹ | Hook |
| validation/errorMessages.ts | ۳۵ | MSG helper |

جمع intelligence + validation: ۱۹۷۸ خط

---

## لایه ۲ — ۱۳ دسته FieldProfiles

**منبع:** intelligence/fieldProfiles.ts (۳۳۵ خط، ۱۳۵ فیلد)

### Q1 — دان و مواد اولیه (۱۷ فیلد)

| fieldPath | kind | expectedFrom | crossFieldRule |
|-----------|------|--------------|-----------------|
| feed.unitPrice | price | history_refbook | - |
| feed.protein | percent | species | - |
| feed.fat | percent | species | - |
| feed.fiber | percent | species | - |
| feed.calcium | percent | species | - |
| feed.phosphorus | percent | species | - |
| feed.methionine | percent | species | - |
| feed.lysine | percent | species | - |
| feed.sodium | percent | species | - |
| feed.energy | energy | species | - (bio: 2000-4000) |
| feed.perBirdGramsPerDay | feed | species | - |
| feed.bagWeight | weight | - | - |
| feed.bagCount | count | - | - |
| dlg.feedAmount | feed | cross_field | feed_vs_flock |
| dlg.feedRemaining | feed | cross_field | remaining_vs_feed |
| flk.fcr | ratio | species | - |
| flk.adg | weight | species | - |

### Q2 — تاریخ‌ها (۲۰+ فیلد)

قانون: همه hard_only، بدون soft warning.

| fieldPath | hardMin | hardMax |
|-----------|---------|---------|
| invoice.date | -730d | +30d |
| invoice.dueDate | 0d | +1825d |
| invoice.customDueDate | 0d | +1825d |
| invoice.deliveryDate | 0d | +1825d |
| payment.date | 0d | +1825d |
| payment.dueDate | 0d | +1825d |
| payment.clearedDate | -1825d | 0d |
| payment.bouncedDate | -1825d | 0d |
| flk.hatchDate | -90d | 0d |
| flk.purchaseDate | -3650d | 0d |
| flk.startDate | -3650d | 0d |
| flk.endDate | 0d | +1825d |
| inc.eggDate | -30d | 0d |
| inc.entryDate | -30d | 0d |
| inc.expectedHatchDate | 0d | +56d |
| inc.hatchDate | 0d | +70d |
| whs.expireDate | 0d | +3650d |
| whs.productionDate | -3650d | 0d |
| whs.purchaseDate | -3650d | 0d |
| whs.warrantyUntil | 0d | +3650d |
| whs.movementDate | -3650d | 0d |
| dlg.date | -3650d | 0d |

### Q3 — دما و رطوبت (۸ فیلد)

| fieldPath | kind | bio range |
|-----------|------|-----------|
| dlg.temperature | temperature | 15-35 |
| dlg.temperatureMin | temperature | 5-45 |
| dlg.temperatureMax | temperature | 5-45 |
| dlg.humidity | humidity | 15-35 |
| dlg.humidityMin | humidity | 34-39 |
| dlg.humidityMax | humidity | 30-75 |
| inc.temperature | temperature | (بدون bio) |
| inc.humidity | humidity | (بدون bio) |

### Q4 — آب (۳ فیلد)

| fieldPath | crossFieldRule |
|-----------|-----------------|
| dlg.waterAmount | water_vs_flock |
| dlg.waterFillVolume | - |
| dlg.waterFillCount | - |

### Q5 — تخم و هچ (۱۶ فیلد)

| fieldPath | crossFieldRule |
|-----------|-----------------|
| dlg.eatingEggs | lte_female |
| dlg.fertileEggs | lte_female |
| dlg.brokenEggs | lte_female |
| dlg.otherEggs | lte_female |
| egg.eatingCount | lte_egg_count |
| egg.fertileCount | lte_egg_count |
| egg.brokenCount | lte_egg_count |
| egg.softCount | lte_egg_count |
| egg.dirtyCount | lte_egg_count |
| inc.count | - |
| inc.hatched | - |
| inc.unhatched | - |
| inc.deadInShell | - |
| inc.pipped | - |
| inc.other | - |
| inc.avgWeight | - |

### Q6 — وزن (۴ فیلد)

| fieldPath | kind |
|-----------|------|
| flk.weightGram | weight |
| chickWeight | weight |
| egg.avgWeight | weight |
| inc.avgWeight | weight |

### Q7 — تلفات (۵ فیلد)

| fieldPath | crossFieldRule |
|-----------|-----------------|
| dlg.deathsCount | lte_current |

### Q8 — ظرفیت‌ها (۱۲ فیلد)

| fieldPath | crossFieldRule |
|-----------|-----------------|
| hal.capacity | - |
| hal.zoneCapacity | lte_hall |
| hal.targetTemp | - |
| hal.targetHumidity | - |
| hal.density | - |
| hal.equipCount | - |
| hal.feederSpaceCm | - |
| hal.drinkerSpaceCm | - |
| inc.capacity | - |
| inc.rentAmount | - |
| inc.trays | - |
| inc.racks | - |

### Q9 — تراکم (۳ فیلد)

| fieldPath |
|-----------|
| hal.density |

### Q10 — دارو (۹ فیلد)

| fieldPath | crossFieldRule |
|-----------|-----------------|
| dlg.dose | - |
| dlg.withdrawalDays | - |
| whs.dosePerBird | dose_vs_flock |
| whs.withdrawalDays | - |

### Q11 — گله و قیمت (۱۴ فیلد)

| fieldPath | kind | structuralBreakAware |
|-----------|------|---------------------|
| flk.initialCount | count | false |
| flk.maleCount | count | false |
| flk.femaleCount | count | false |
| flk.unknownCount | count | false |
| flk.purchasePrice | price | TRUE |
| flk.deliveryCost | price | TRUE |
| flk.layingStartDay | age | false |
| flk.endOfCycleDay | age | false |
| tra.price_chick | price | TRUE |
| tra.price_adult | price | TRUE |
| tra.price_egg | price | TRUE |
| tra.price_fertile_egg | price | TRUE |
| tra.price_medicine | price | TRUE |
| tra.price_equipment | price | TRUE |
| tra.price_other | price | TRUE |
| tra.price_broken | price | TRUE |
| tra.price_manure | price | TRUE |
| tra.price_feed | price | TRUE |

### Q12 — شراکت (۵ فیلد)

| fieldPath | expectedFrom |
|-----------|--------------|
| flk.partnerPercent | user_pattern |
| flk.rentAmount | history |
| flk.rentPayments.amount | - |
| inc.partnerPercent | - |
| inc.consigneePercent | - |

### Q13 — معاملات خاص (۴ فیلد — جدید)

| fieldPath | kind | hardMin | hardMax | structuralBreakAware |
|-----------|------|---------|---------|---------------------|
| tra.deal.value | price | 0 | 1e15 | TRUE |
| tra.deal.quantity | count | 1 | 1,000,000 | false |
| tra.deal.unitPrice | price | 0 | 1e12 | TRUE |
| tra.deal.payment | price | 0 | 1e12 | TRUE |

نکته حیاتی: tra.deal.* در profiles هست، ولی UI (DealsPage, InvoiceFormModal) FieldHint رو import نکرده → زیرساخت آماده، UI وصل نیست.

---

---

## structuralBreakAware — تورمی (۱۸ فیلد)

تعریف: فیلدهایی که قیمتشون با تورم تغییر می‌کنه. سیستم هوشمند یاد می‌گیره که قیمت جدید، خطای کاربر نیست، بلکه تورم هست.

| # | fieldPath | جایگاه |
|---|-----------|--------|
| ۱ | feed.unitPrice | Q1 |
| ۲ | flk.purchasePrice | Q11 |
| ۳ | flk.deliveryCost | Q11 |
| ۴ | flk.otherCosts | Q11 |
| ۵ | flk.rentAmount | Q11 |
| ۶ | tra.price_chick | Q11 |
| ۷ | tra.price_adult | Q11 |
| ۸ | tra.price_egg | Q11 |
| ۹ | tra.price_fertile_egg | Q11 |
| ۱۰ | tra.price_medicine | Q11 |
| ۱۱ | tra.price_equipment | Q11 |
| ۱۲ | tra.price_other | Q11 |
| ۱۳ | tra.price_broken | Q11 |
| ۱۴ | tra.price_manure | Q11 |
| ۱۵ | inc.rentAmount | Q12 |
| ۱۶ | tra.deal.value | Q13 |
| ۱۷ | tra.deal.unitPrice | Q13 |
| ۱۸ | tra.deal.payment | Q13 |

منطق (از types.ts):

~~~
structuralBreakAware?: boolean;
// اگر true: هنگام بررسی ratio، اگر تغییر بزرگ باشه (تورم)، هشدار نده
// اگر false: هر تغییر بزرگ = ناهنجاری
~~~

منبع یادگیری (از historyStore.ts):
- localStorage، TTL=۱۸۰ روز
- تا ۱۰۰ رکورد per field
- structuralBreak flag در FieldStats

### الگوریتم دقیق (از historyStore.ts خط 79-105)

~~~typescript
if (n >= 6) {
  const older = values.slice(0, n - 3);           // همه به جز ۳ آخر
  const recent = values.slice(-3);                 // ۳ تا آخر
  const olderMean = mean(older);
  const rMean = mean(recent);

  if (olderMean > 0
      && rMean > olderMean * 1.3                    // شرط ۱
      && recent.every(v => v > olderMean * 1.1))    // شرط ۲
  {
    structuralBreak = true;
    recentMean = rMean;                             // ← از این بعد استفاده می‌شود
  }
}
~~~

### ۵ محدودیت شناخته‌شده

| # | محدودیت | اثر |
|---|---|---|
| ۱ | `n >= 6` **بدون شرط زمانی** | ۶ رکورد در ۲ دقیقه = trigger (بدون تورم واقعی) |
| ۲ | **فقط صعودی** | کاهش قیمت (تخفیف، رکود) تشخیص نمی‌شود |
| ۳ | **mean نه median** | یک outlier → کل baseline خراب |
| ۴ | **پنجره ثابت ۳ رکورد** | کور به روند تدریجی (۲٪ ماهانه در ۷ ماه = ۳۶٪ تورم، ولی هر گام ۳٪) |
| ۵ | **سناریوی ایران** | تورم عادی ۳-۵٪ ماهانه → structural break trigger نمی‌شود |

**مثال چرا کور است (تورم ایران):**
- فروردین ۱۰٬۰۰۰ → شهریور ۱۳٬۵۰۰ (۳۵٪ تورم واقعی)
- هر ماه ۳٪ افزایش → `rMean = 13,000`, `olderMean = 12,500` → `1.04×` (نه ۱.۳×) → **بدون trigger**

### فاز ۱ پیشنهادی (باید پیاده شود)

- **Dedup**: same day+value → no-op (نه رکورد جدید)
- **Time-span guard**: `timespan >= 7d AND n >= 6`
- **Debounce UI**: 800ms → 3000ms
- **Minimum data**: n >= 12 برای stats پایه

---

## crossFieldRule — قواعد مقایسه با فیلد دیگر (۲۳ فیلد، ۹ قاعده)

| قاعده | تعداد فیلد | معنی |
|-------|-----------|------|
| lte_female | ۹ | باید کمتر یا مساوی تعداد ماده گله |
| lte_egg_count | ۵ | باید کمتر یا مساوی تعداد کل تخم |
| lte_initial_sum | ۳ | باید کمتر یا مساوی جمع نر+ماده+نامشخص |
| feed_vs_flock | ۱ | نسبت دان به تعداد گله |
| remaining_vs_feed | ۱ | دان باقی‌مانده کمتر یا مساوی دان داده‌شده |
| water_vs_flock | ۱ | نسبت آب به تعداد گله |
| lte_current | ۱ | باید کمتر یا مساوی موجودی فعلی گله |
| lte_hall | ۱ | ظرفیت بخش کمتر یا مساوی ظرفیت سالن |
| dose_vs_flock | ۱ | دوز دارو نسبت به تعداد گله |

پیام در formatWarning.ts (خط ۳۹):

~~~
if (signals.some(s => s.type === 'cross_absolute') && expected !== undefined) {
  return label + ' از ' + crossFieldLabel(profile?.crossFieldRule) + ' (' + fmtNum(expected) + ') بیشتر است';
}
~~~

---

## biologicalRange — محدوده زیستی (۹ فیلد یکتا — ۱۱ خط در کد، ۲ تکراری = باگ)

| فیلد | محدوده | واحد |
|------|--------|------|
| feed.energy | 2000-4000 | kcal |
| dlg.temperature | 15-35 | درجه |
| dlg.temperatureMin | 5-45 | درجه |
| dlg.temperatureMax | 5-45 | درجه |
| dlg.humidity | 15-35 | درصد |
| dlg.humidityMin | 34-39 | درصد |
| dlg.humidityMax | 30-75 | درصد |
| (۴ فیلد دیگر) | ... | ... |

منطق (خط ۹۶ از formatWarning):

~~~
if (signals.some(s => s.type === 'biological') && profile?.biologicalRange) {
  return label + ' خارج از محدوده طبیعی است';
}
~~~


## FIELD_LABELS — منبع یکتای لیبل‌ها

منبع: intelligence/formatWarning.ts (~۹۵ لیبل)

قانون: این جدول باید Source of Truth باشه. اگر UI چیز دیگری نشون می‌ده، اشتباهه.

### tra (۱۰ لیبل)

| fieldPath | لیبل |
|-----------|------|
| tra.price_chick | قیمت جوجه |
| tra.price_adult | قیمت پرنده بالغ |
| tra.price_egg | قیمت تخم |
| tra.price_fertile_egg | قیمت تخم نطفه‌دار |
| tra.price_feed | قیمت دان |
| tra.price_medicine | قیمت دارو |
| tra.price_equipment | قیمت تجهیزات |
| tra.price_other | قیمت سایر |
| tra.price_broken | قیمت تخم شکسته |
| tra.price_manure | قیمت کود |

ناهمسانی کشف‌شده:
- FIELD_LABELS[tra.price_chick] = قیمت جوجه
- InvoiceFormModal.tsx:70 = قیمت هر جوجه
- DealsPage.tsx:983 = 🐣 جوجه یک‌روزه
- ۳ اسم مختلف برای یه مفهوم!

### dlg (۲۲ لیبل)

| fieldPath | لیبل |
|-----------|------|
| dlg.temperature | دمای سالن |
| dlg.temperatureMin | حداقل دما |
| dlg.temperatureMax | حداکثر دما |
| dlg.humidity | رطوبت سالن |
| dlg.humidityMin | حداقل رطوبت |
| dlg.humidityMax | حداکثر رطوبت |
| dlg.feedAmount | مقدار دان |
| dlg.feedRemaining | دان باقی‌مانده |
| dlg.waterAmount | مقدار آب |
| dlg.waterFillVolume | حجم آب |
| dlg.waterFillCount | تعداد بار آب |
| dlg.eatingEggs | تخم خوراکی |
| dlg.fertileEggs | تخم نطفه‌دار |
| dlg.brokenEggs | تخم شکسته |
| dlg.otherEggs | سایر تخم‌ها |
| dlg.deathsCount | تعداد تلفات |
| dlg.dose | دوز دارو |
| dlg.withdrawalDays | دوره پرهیز |

### flk (۱۴ لیبل)

| fieldPath | لیبل |
|-----------|------|
| flk.weightGram | وزن پرنده |
| flk.initialCount | تعداد گله |
| flk.maleCount | تعداد نر |
| flk.femaleCount | تعداد ماده |
| flk.unknownCount | تعداد نامشخص |
| flk.partnerPercent | درصد شریک |
| flk.rentAmount | مبلغ اجاره |
| flk.rentPayments.amount | مبلغ پرداخت |
| flk.layingStartDay | شروع تخم‌گذاری |
| flk.endOfCycleDay | پایان چرخه |
| flk.purchasePrice | قیمت خرید |
| flk.deliveryCost | هزینه حمل |
| flk.fcr | ضریب تبدیل |
| flk.adg | افزایش وزن روزانه |

### inc (۹ لیبل)

| fieldPath | لیبل |
|-----------|------|
| inc.temperature | دمای دستگاه |
| inc.humidity | رطوبت دستگاه |
| inc.count | تعداد تخم |
| inc.hatched | تخم هچ‌شده |
| inc.unhatched | تعداد هچ‌نشده |
| inc.deadInShell | تعداد مرده در پوسته |
| inc.pipped | تعداد نوک‌زده |
| inc.other | تعداد سایر (هچ) |
| inc.avgWeight | وزن جوجه |

### hal (۵ لیبل)

| fieldPath | لیبل |
|-----------|------|
| hal.capacity | ظرفیت سالن |
| hal.targetTemp | دمای هدف |
| hal.targetHumidity | رطوبت هدف |
| hal.zoneCapacity | ظرفیت بخش |
| hal.density | تراکم |

### egg (۱۰ لیبل)

| fieldPath | لیبل |
|-----------|------|
| egg.eatingCount | تخم خوراکی |
| egg.fertileCount | تخم نطفه‌دار |
| egg.brokenCount | تخم شکسته |
| egg.softCount | تخم نرم |
| egg.dirtyCount | تخم کثیف |
| egg.avgWeight | وزن تخم |
| egg.hatchOfTotal | درصد هچ از کل |
| egg.hatchOfFertile | درصد هچ از نطفه‌دار |
| egg.chickYieldPercent | درصد جوجه‌دهی |
| egg.henDayPercent | درصد تخم‌گذاری |

### feed (۱۳ لیبل)

| fieldPath | لیبل |
|-----------|------|
| feed.unitPrice | قیمت واحد دان |
| feed.protein | پروتئین دان |
| feed.fat | چربی دان |
| feed.fiber | فیبر دان |
| feed.calcium | کلسیم دان |
| feed.phosphorus | فسفر دان |
| feed.methionine | متیونین دان |
| feed.lysine | لیزین دان |
| feed.sodium | سدیم دان |
| feed.energy | انرژی دان |
| feed.perBirdGramsPerDay | مصرف روزانه هر پرنده |
| feed.bagWeight | وزن کیسه |
| feed.bagCount | تعداد کیسه |

### whs (۹ لیبل)

| fieldPath | لیبل |
|-----------|------|
| whs.qty_kg | مقدار (کیلوگرم) |
| whs.qty_g | مقدار (گرم) |
| whs.qty_L | مقدار (لیتر) |
| whs.qty_ml | مقدار (میلی‌لیتر) |
| whs.qty_pcs | مقدار (عدد) |
| whs.qty_vial | مقدار (ویال) |
| whs.qty_pack | مقدار (بسته) |
| whs.dosePerBird | دوز هر پرنده |
| whs.withdrawalDays | دوره پرهیز |

### سایر

| fieldPath | لیبل |
|-----------|------|
| chickWeight | وزن جوجه |

ناهمسانی کشف‌شده: chickWeight بدون پیشوند ماژول! بقیه همه با پیشوند (tra., flk., ...).

### ⚠️ Known Naming Issues (نیازمند تصمیم آینده)

| # | مشکل | مکان‌ها | راه‌حل پیشنهادی |
|---|------|--------|-----------------|
| ۱ | `chickWeight` بدون prefix | `FIELD_LABELS`, `FIELD_PROFILES` | rename به `tra.chickWeight` یا `inc.chickWeight` |
| ۲ | `tra.price_chick` = ۳ اسم | `FIELD_LABELS`: `قیمت جوجه`<br>`InvoiceFormModal.tsx:70`: `قیمت هر جوجه`<br>`DealsPage.tsx:983`: `🐣 جوجه یک‌روزه` | همه باید از `FIELD_LABELS[fieldPath]` استفاده کنند — نه string دستی |
| ۳ | `tra.price_feed` = ۲ اسم | `FIELD_LABELS`: `قیمت دان`<br>`InvoiceFormModal`: `قیمت هر...` | (همان بالا) |
| ۴ | `tra.price_medicine` = ۲ اسم | `FIELD_LABELS`: `قیمت دارو`<br>`InvoiceFormModal`: `قیمت هر...` | (همان بالا) |

**قانون:** UI باید از `getLabel(fieldPath)` استفاده کند — نه string دستی. اگر لیبل جدید لازم است، اول در `formatWarning.ts:FIELD_LABELS` تعریف شود.

---

## ۱۲ الگوی پیام — formatWarning()

منبع: intelligence/formatWarning.ts (تابع formatWarning، ~۹۰ خط)

اصول (از کامنت بالای فایل — GOV.UK standard):
- کوتاه (۳۰–۷۰ کاراکتر)
- دقیق (شامل عدد)
- مثبت و قابل اقدام
- مقایسه با میانگین شما (مالکیت‌دار)

### الگو ۱ — زیر کف سخت (hard_min)

~~~
${label} از حداقل مجاز (${minVal}) کمتر است
~~~

مثال: قیمت جوجه از حداقل مجاز (1,000) کمتر است

### الگو ۲ — بالای سقف سخت (hard_max)

~~~
${label} از سقف مجاز (${maxVal}) بیشتر است
~~~

مثال: قیمت جوجه از سقف مجاز (30,000,000) بیشتر است

### الگو ۳ — بیشتر از فیلد مرجع (cross_absolute)

~~~
${label} از ${crossFieldLabel} (${expected}) بیشتر است
~~~

مثال: تعداد تخم از تعداد ماده گله (۸۰) بیشتر است

### الگو ۴ — الگوی نامعمول (pattern)

~~~
${label} با الگوی همیشگی شما تفاوت دارد
~~~

### الگو ۵ — دمای خارج از هدف (ratio + temperature)

~~~
${label} ${diff} درجه از هدف (${expected}) بالاتر است
${label} ${diff} درجه از هدف (${expected}) پایین‌تر است
~~~

مثال: دمای سالن ۳ درجه از هدف (۲۸) بالاتر است

### الگو ۶ — رطوبت خارج از هدف (ratio + humidity)

~~~
${label} ${diff}٪ از هدف (${expected}٪) بالاتر است
${label} ${diff}٪ از هدف (${expected}٪) پایین‌تر است
~~~

### الگو ۷ — وزن نسبت به استاندارد نژاد (ratio + weight)

~~~
${label} ${pct}٪ بیشتر از استاندارد نژاد است
${label} ${pct}٪ کمتر از استاندارد نژاد است
~~~

مثال: وزن پرنده ۵٪ کمتر از استاندارد نژاد است

### الگو ۸ — ratio عمومی (>= 1.5 برابر)

~~~
${label} ${fmtMult} برابر ${sourceLabel} است
~~~

مثال: قیمت جوجه ۲.۵ برابر میانگین قبلی شما است

### الگو ۹ — ratio عمومی (< 1.5 برابر)

~~~
${label} ${pct}٪ بیشتر از ${sourceLabel} است
${label} ${pct}٪ کمتر از ${sourceLabel} است
~~~

مثال: قیمت جوجه ۳۰٪ بیشتر از میانگین قبلی شما است

### الگو ۱۰ — خارج از محدوده زیستی (biological)

~~~
${label} خارج از محدوده طبیعی است
~~~

مثال: دمای سالن خارج از محدوده طبیعی است

### الگو ۱۱ — Z-Score

~~~
این مقدار با ثبت‌های قبلی شما تفاوت چشمگیری دارد
~~~

### الگو ۱۲ — IQR (خارج از محدوده معمول)

~~~
این مقدار خارج از محدوده معمول شماست
~~~

### Fallback — اگر هیچ‌کدام

~~~
${label} نیاز به بررسی دارد
~~~

---

## منابع sourceLabel در ratio

از کد (formatWarning.ts خط ۶۵-۶۹):

| expectedSource | مقدار sourceLabel |
|------------------|---------------------|
| context | مقدار مرجع |
| cross_field | (نتیجه crossFieldLabel) |
| pattern | الگوی همیشگی شما |
| (پیش‌فرض) | میانگین قبلی شما |

---

## تابع کمکی — formatWarningDetail()

برای نمایش جزئیات بیشتر (توست، modal):

~~~
مقدار: X · مرجع: Y · حداقل: Z · سقف: W
~~~

فقط در AnomalyHint استفاده می‌شه.

---

## Coverage Matrix — کدام ماژول Intelligence دارد؟

| ماژول | Profile داره؟ | Zod Schema | MSG استفاده می‌کنه؟ | FieldHint استفاده می‌کنه؟ |
|-------|--------------|------------|---------------------|--------------------------|
| feed | بله (۱۳ فیلد) | rules/fed.ts | خیر (۰) | خیر |
| dlg | بله (۲۰+ فیلد) | rules/dlg.ts | خیر (۰) | خیر |
| flk | بله (۱۴ فیلد) | rules/flk.ts | بله (۵ بار) | بله (۴ فایل) |
| tra | بله (۱۴ فیلد) | rules/tra.ts | بله (۲۷ بار) | بله (۳ فایل) |
| whs | بله (۹ فیلد) | rules/whs.ts | خیر (۰) | خیر |
| inc | بله (۱۱ فیلد) | rules/inc.ts | خیر (۰) | خیر |
| hal | بله (۵ فیلد) | rules/hal.ts | خیر (۰) | خیر |
| egg | بله (۸ فیلد) | rules/egg.ts | خیر (۰) | خیر |
| brd | (brd.fcr) | rules/brd.ts | خیر (۰) | بله (۱ فایل) |
| invoice | بله (۴ فیلد تاریخ) | rules/tra.ts | بله (فقط tra) | خیر |
| payment | بله (۴ فیلد تاریخ) | rules/tra.ts | بله (فقط tra) | خیر |
| ctc | خیر | rules/ctc.ts | خیر | خیر |
| alt | خیر | rules/alt.ts | خیر | خیر |

---

## سناریوهای شناسایی‌شده (۱۴ سناریو — 2026/11)

### هدف
فهرست کامل از موقعیت‌هایی که سیستم فعلی Intelligence با آن روبرو می‌شود. برای هر سناریو، فاز پیاده‌سازی مشخص شده:

### جدول کامل

| # | سناریو | فاز | توضیح |
|---|--------|-----|-------|
| ۱ | تنوع تأمین‌کننده | ۲ | کلید `(field, supplierId)` — هر تأمین‌کننده تاریخچه جدا |
| ۲ | تنوع برند | ۳ | tag برند — `dan_irani` vs `dan_imported` |
| ۳ | تخفیف حجمی | ۳ | quantity-aware threshold |
| ۴ | تخفیف/پروموشن | ۲ | اگر `discount` جدا ثبت شود، تفاوت نداره |
| ۵ | برگشت/مرجوعی | ۲ | رکورد منفی vs رکورد جدگانه |
| ۶ | فصلی بودن | ۳ | seasonal decomposition (ماه، سال) |
| ۷ | وارداتی/داخلی | ۳ | tag منبع ارزی |
| ۸ | الگوی کاربر | ۳ | history per user/party |
| ۹ | زمان خرید | ۳ | timeline analysis (شنبه/جمعه، بحران) |
| ۱۰ | خرید چندقلمی | ۱ | هر قلم جدا حساب می‌شود (فعلاً OK) |
| ۱۱ | روند نزولی | ۲ | two-sided (فقط صعودی نباشد) |
| ۱۲ | نسیه vs نقدی | ۳ | payment term-aware |
| ۱۳ | خطای کاربر (typo) | ۲ | IQR outlier detection |
| ۱۴ | تحویل چندمرحله‌ای | ۳ | میانگین weighted (نه simple) |

### فاز ۱ (فاز جاری — ۵ سناریو)
- ✅ تنوع تأمین‌کننده (split by supplierId) — deferred to phase 2
- ✅ تخفیف/پروموشن (توسط `discount` handler)
- ✅ خرید چندقلمی (per-item history)
- ✅ (سایر موارد در phase 2/3)
- ⚠️ فقط ۳ سناریو در فاز ۱ (نه ۵ — تعدیل شد)

### فاز ۲ (deferred — ۴ سناریو)
- تنوع تأمین‌کننده (باید `fieldPath = ${base}_${supplierId}`)
- تخفیف/پروموشن (باید `discount` جدا باشد)
- روند نزولی (باید `two-sided` check)
- خطای کاربر (IQR — outlier زدایی)

### فاز ۳ (deferred — ۷ سناریو)
- تنوع برند، فصلی، وارداتی/داخلی، الگوی کاربر، زمان خرید، نسیه/نقدی، تحویل چندمرحله‌ای

**⚠️ نکته:** تا فاز ۳ پیاده نشود، سیستم در سناریوهای فاز ۲/۳ دچار false positive یا false negative است. این محدودیت پذیرفته شده — چون پیاده‌سازی هر سناریو نیازمند refactor جداگانه است.

---

## Gaps واقعی (اصلاح‌شده — بر اساس کد)

### ⚠️ اصلاح ۳ ادعای غلط قبلی این سند

در نسخه‌ی اولیه، این سند ۳ ادعای غلط داشت که با verify کد اصلاح شدن:

| ادعای قبلی (غلط) | واقعیت کد |
|-------------------|-----------|
| Intelligence در tra وصل نیست | tra.deal.* در ۷ جا وصل (DealsPage:868, 1186, 1190, 1246, 1320, 1324, 1388) |
| AnomalyHint استفاده نمی‌شه | از طریق FieldHint (wrapper) کار می‌کنه — FieldHint → useAnomalyHint → AnomalyHint |
| getHistory/computeStats استفاده نمی‌شن | getHistory در anomalyDetector.ts:156, 202 استفاده می‌شه |

---

### Gap ۱ — tra.price_* بدون FieldHint (فقط hard clamp)

**وضعیت فعلی:**
- recordHistory(`tra.price_${cat}`) در `useInvoiceForm.ts:555` ✅
- getProfile (فقط hardMax) برای clamp در `InvoiceFormModal.tsx:279,487` ✅
- FieldHint ❌ نیست

**نتیجه:** سیستم تورمی قیمت رو یاد می‌گیره ولی هشدار نرم نشون نمی‌ده.
اگر کاربر قیمت ۱۰ برابر میانگین قبلی وارد کنه (ولی زیر hardMax)، هیچ هشداری نمی‌بینه.

**فایل‌های درگیر:**
- `src/mod/tra/components/InvoiceFormModal.tsx`
- `src/shr/intelligence/fieldProfiles.ts` (profile آماده)
- `src/shr/intelligence/formatWarning.ts` (لیبل آماده — قیمت جوجه، قیمت تخم، ...)

**Fix پیشنهادی:** اضافه کردن `<FieldHint fieldPath={`tra.price_${cat}`} value={it.unitPrice} />` کنار فیلد قیمت — دقیقاً مثل `tra.deal.unitPrice` در `DealsPage:1324`

---

### Gap ۲ — MSG فقط در tra.ts

- tra.ts: ۲۷ بار MSG.* ✅
- whs.ts, flk.ts, inc.ts, hal.ts, egg.ts, dlg.ts, fed.ts, brd.ts: ۰ بار ❌
- بقیه از helper (requiredStr, requiredId) یا hardcoded

---

### Gap ۳ — hardcoded پیام در flk.ts

- خط ۹۳: `message: 'حداقل یکی از تاریخ‌های هچ، خرید یا شروع را وارد کنید'`
- خط ۱۱۰: `message: 'مبلغ اجاره را وارد کنید'`
- خط ۲۱۵: `message: 'برای منبع «جوجه‌کشی خودم» تاریخ هچ را وارد کنید'`
- خط ۲۲۳: `message: 'برای منبع «خریداری» تاریخ خرید را وارد کنید'`
- این‌ها باید در MSG باشن

---

### Gap ۴ — لیبل‌های ناهمسان

| مفهوم | FIELD_LABELS | InvoiceFormModal | DealsPage |
|-------|----------------|--------------------|----|
| chick price | قیمت جوجه | قیمت هر جوجه (خط ۷۰) | 🐣 جوجه یک‌روزه (خط ۹۸۳) |
| feed price | قیمت دان | قیمت هر... | - |
| medicine price | قیمت دارو | قیمت هر... | - |

---

### Gap ۵ — Intelligence در whs/inc/hal/egg (🟢 ۷۵٪ رفع‌شده — 2026/11/02)

| ماژول | قبل | بعد |
|---|---|---|
| egg | ۰ FieldHint | ✅ ۶ FieldHint (ProductionFormModal: eating/fertile/broken/soft/dirty/avgWeight) |
| inc | ۰ FieldHint | ✅ ۱ FieldHint (DeviceFormModal: temperature) |
| hal | ۰ OverrideHint | ✅ ۳ OverrideHint (HallsFormModal: capacity, targetTemp, targetHumidity) — الگوی بهتر از FieldHint (autoFrom + reset + diff با استاندارد نژاد) |
| whs | ۰ FieldHint | ⏸ PENDING (ItemsFormModal, MoveFormModal) |

**Gap ۵ باقی‌مونده:**
- whs: ۵-۶ FieldHint potential (unitPrice, currentStock, dosePerBird, withdrawalDays, ...)
- hal: density و equipCount فیلد ورودی نیستن (density از استاندارد نژاد محاسبه می‌شه، equipCount شمارش تجهیزاته)

**قانون برای AI بعدی:** برای فیلدهایی که از استاندارد نژاد میان (targetTemp, targetHumidity, capacity, density) → از `OverrideHint` استفاده کن، نه `FieldHint`. برای فیلدهای داده‌ای → `FieldHint`.

---

### Gap ۶ — inc.temperature بدون biologicalRange (✅ رفع‌شده 2026/11/02)

- **قبل:** `expectedFrom: 'species_temp'` تعریف شده بود ولی resolver وجود نداشت
- **الان:** resolver پیاده شد (`anomalyDetector.ts` + `biological.ts`)
  - `INCUBATION_TEMP`: chicken 37.8, turkey/duck/quail 37.5
  - `getTempIdeal(species, fieldPath)`: ideal temp for inc.* (incubation) and dlg/hal.* (hall)
- **وضعیت UI wiring:**
  - `dlg.temperature*`: FieldHint هست (EnvironmentSection), از `context.expected` استفاده می‌کند
  - `hal.targetTemp`: OverrideHint دارد (بهتر از FieldHint — مقایسه با استاندارد نژاد + autoFrom)
  - `inc.temperature`: FieldHint اضافه شد (2026/11/02) — DeviceFormModal.tsx
- **نتیجه:** هر ۵ فیلد متصل — resolver کامل

---

### Gap ۷ — chickWeight بدون پیشوند ماژول

- در FIELD_LABELS: `'chickWeight'` (بدون `tra.` یا `inc.`)
- در profiles: احتمالاً `'chickWeight'` (همین الگو)
- بقیه همه با پیشوند (`tra.`, `flk.`, `whs.`, ...)
- این یک exception هست

---

### Gap ۸ — Unit normalization نیست 🆕

**وضعیت فعلی:** `recordHistory('tra.price_feed', it.unitPrice)` در `useInvoiceForm.ts:535` — خام، بدون تبدیل به baseUnit.

**مشکل:**
- کاربر ۱ لیتر @ ۱۰۰,۰۰۰ ثبت می‌کند → recorded: ۱۰۰,۰۰۰
- کاربر ۵۰۰ml @ ۵۰,۰۰۰ ثبت می‌کند → recorded: ۵۰,۰۰۰ (کاهش ۵۰٪ کاذب!)
- سیستم فکر می‌کند «تورم کاهش یافت» — در حالی که قیمت هر لیتر یکسان است

**UOM helper هست (`uom.ts`)** — `factor` و `baseUnit` برای هر دسته — ولی در `recordHistory` استفاده نمی‌شود.

**فایل‌های درگیر:**
- `src/shr/units/uom.ts` (helper آماده)
- `src/mod/tra/hooks/useInvoiceForm.ts:535` (نیاز به fix)
- `src/mod/whs/ItemsPage.tsx` (نیاز به fix)
- `src/mod/whs/MovesPage.tsx:191` (نیاز به fix)

**Fix پیشنهادی:**
~~~typescript
const uom = UOM_CATEGORIES[cat];
const unitDef = uom.units.find(u => u.value === it.unit);
if (unitDef?.factor) {
  const basePrice = it.unitPrice / unitDef.factor;
  recordHistory(`tra.price_${cat}`, basePrice, {});
}
~~~

---

### Gap ۹ — Rule mode برای n≥2 (تجهیزات/اجاره) 🆕

**وضعیت فعلی:** `if (n >= 6)` در `historyStore.ts:79` → تجهیزات ۵M→۱۰M با n=2 کور است.

**مشکل:**
- خرید دماسنج ۱۴۰۳ @ ۵M، ۱۴۰۴ @ ۱۰M → n=2 → هیچ هشداری
- اجاره سالن ۱۴۰۳ @ ۱۰۰M، ۱۴۰۴ @ ۱۵۰M → n=2 → هیچ هشداری
- استاندارد SAP: برای material با خرید نادر، threshold بالاتر ولی **n=2 کافی**

**Fix پیشنهادی:**
- اضافه به `FieldProfile`: پرچم `mode: 'statistical' | 'rule'`
- برای `equipment.*` و `*.rentAmount`: `mode: 'rule'`
- در `anomalyDetector`:
~~~typescript
if (profile.mode === 'rule') {
  if (values.length < 2) return null;
  const ratio = last / prev;
  if (ratio >= 1.5) return { level: 'orange', reason: 'قیمت X٪ افزایش' };
  if (ratio <= 0.66) return { level: 'yellow', reason: 'قیمت X٪ کاهش' };
}
~~~

---

### Gap ۱۰ — Dedup + Time-span نیست 🆕

**وضعیت فعلی:**
- `recordHistory` (`historyStore.ts:137`) — بدون dedup
- `if (n >= 6)` (`historyStore.ts:79`) — بدون شرط زمانی

**مشکل ۱ — بدون dedup:**
- کاربر ۱۰ بار در یک روز عدد را تغییر می‌دهد و ذخیره می‌کند
- ۱۰ رکورد با `date: same day` ثبت می‌شود
- `structuralBreak` وقتی n=6 می‌شود trigger می‌شود

**مشکل ۲ — بدون time-span:**
- ۶ رکورد در ۷ دقیقه = ۶ رکورد در ۷ ماه
- هیچ تمایزی وجود ندارد

**Fix پیشنهادی:**
~~~typescript
// در recordHistory:
const last = freshValues[freshValues.length - 1];
if (last && last.date === today && last.v === value) return;  // no-op
if (last && last.date === today) { last.v = value; return; }  // update

// در computeStats structuralBreak:
const timeSpan = daysBetween(first.date, last.date);
if (timeSpan < 7) return null;  // skip structural break
~~~

---

### Gap ۱۱ — الگوی فرم tra (نیمه‌کاره) 🆕

**وضعیت فعلی:** `InvoicePage.tsx:461` هنوز `setErr('')` دارد (برخلاف HallsPage).

**الگوی درست** (از `HallsPage.tsx:234` و `BirdsPage.tsx:119`):
~~~typescript
const save = () => {
  attemptSave();
  if (Object.keys(vErrors).length > 0) return;  // ← فقط return، بدون setErr
  // ... business logic (تکرار، موجودی) → setError
};
~~~

**Anti-pattern فعلی در tra:**
- `InvoicePage.tsx:461`: `{ setErr(''); return; }` — خطاهای قبلی پاک می‌شود
- `useInvoiceForm.ts:329, 334, 335`: `setErr(...)` برای validation (باید فقط `return;`)

**فایل‌های درگیر:**
- `src/mod/tra/InvoicePage.tsx:461`
- `src/mod/tra/hooks/useInvoiceForm.ts` (خطوط 329, 334, 335)

---

### Gap ۱۲ — AI-BOOT بدون لینک به این سند 🆕 ⚠️ بحرانی

**وضعیت فعلی:** `docs/AI-BOOT.md` لینکی به `validation-intelligence-map.md` ندارد.

**مشکل:**
- AI جدید فقط ۵ فایل مقدس را می‌خواند (CONSTITUTION, UI-PATTERNS, DECISIONS, PARADIGM, COMPLEX-SCENARIOS)
- این سند ۸۴۲+ خطی را پیدا نمی‌کند
- خودش باید ۱ ساعت کد بخواند تا Intelligence را بفهمد

**Fix پیشنهادی:**
- اضافه به `AI-BOOT.md` بخش «پنج فایل مقدس» → **شش فایل مقدس**
- `۶. docs/modules/validation-intelligence-map.md — نقشه Intelligence (۸۴۲+ خط)`

---

## اولویت‌بندی Gap ها (اصلاح‌شده)

| # | Gap | اهمیت | پیچیدگی | اثر |
|---|-----|--------|---------|-----|
| ۱ | tra.price_* بدون FieldHint | 🔴 بالا | کم | سیستم تورمی قیمت‌ها غیرفعال |
| ۲ | MSG فقط در tra | 🟠 متوسط | متوسط | پیام‌های ناهمسان |
| ۳ | hardcoded در flk | 🟠 متوسط | کم | پیام‌های پراکنده |
| ۴ | لیبل‌های ناهمسان | 🟠 متوسط | کم | کاربر گیج |
| ۵ | Intelligence در whs/inc/hal/egg | 🟡 پایین | بالا | feature آماده ولی غیرفعال |
| ۶ | inc.temperature bio range | 🟡 پایین | کم | محدوده زیستی ناقص |
| ۷ | chickWeight پیشوند | 🟢 خیلی پایین | صفر | exception |
| ۸ | Unit normalization نبود | 🔴 بالا | متوسط | هشدار کاذب از تغییر واحد |
| ۹ | Rule mode n≥2 | 🟠 متوسط | متوسط | تجهیزات/اجاره کور |
| ۱۰ | Dedup + Time-span | 🔴 بالا | کم | false positive از تست |
| ۱۱ | الگوی فرم tra | 🟠 متوسط | کم | نیمه‌کاره (خلاف brd/hal) |
| ۱۲ | AI-BOOT بدون لینک | 🔴 بحرانی | صفر | AI بعدی سند را پیدا نمی‌کند |

## قوانین برای AI بعدی

### قانون ۱ — Zod != Intelligence
- Zod: خطای سخت (block). نمی‌تونی ذخیره کنی.
- Intelligence: هشدار نرم. می‌تونی ذخیره کنی.

### قانون ۲ — MSG = استاندارد پیام خطا
- جایگزین: requiredStr(نام کالا, 2, 80) — helper که خودش پیام می‌سازه
- ولی helper باید در MSG تعریف بشه (نه hardcoded)
- پیام جدید: اول در MSG، بعد استفاده در rules

### قانون ۳ — FIELD_LABELS = منبع یکتای لیبل
- هر لیبل جدید در formatWarning.ts تعریف بشه
- UI از همون استفاده کنه (با getLabel(fieldPath))
- UI نباید لیبل مستقل بسازه

### قانون ۴ — structuralBreakAware = فقط قیمت
- برای هر فیلد قیمت: structuralBreakAware: true
- برای غیر قیمت: false (پیش‌فرض)
- قیمت + تاریخچه = تورمی

### قانون ۵ — biologicalRange = محدوده واقعی
- برای دما، رطوبت، انرژی و مشابه
- نباید با hardMin/Max قاطی بشه
- hardMax = بلاک، biologicalRange = هشدار نرم

### قانون ۶ — crossFieldRule = مقایسه با فیلد دیگر
- ۸ قاعده موجود: lte_female, lte_egg_count, lte_initial_sum, lte_current, lte_hall, feed_vs_flock, remaining_vs_feed, water_vs_flock, dose_vs_flock
- قاعده جدید: آپدیت این سند + crossFieldLabel()

### قانون ۷ — FieldHint قبل از commit
- اگر فیلد جدید در profile اضافه کردی، باید FieldHint در UI هم اضافه بشه
- اگر نه، profile بی‌فایده‌ست

---

## چک‌لیست قبل از پچ (نسخه ۲ — 2026/11)

### A. ساختار Profile

- [ ] آیا fieldPath در `FIELD_PROFILES` هست؟
- [ ] آیا `FIELD_LABELS[fieldPath]` تعریف شده؟
- [ ] اگر قیمت هست، `structuralBreakAware: true`؟
- [ ] اگر دما/رطوبت هست، `biologicalRange`؟
- [ ] اگر مقایسه با فیلد دیگه هست، `crossFieldRule`؟
- [ ] اگر خرید نادر (equipment/rent) هست، `mode: 'rule'`؟ (Gap 9 — بعد از پیاده‌سازی)

### B. Unit + History (Gap 8, 10)

- [ ] آیا `recordHistory` برای قیمت، **نرمال‌سازی به baseUnit** دارد؟
  - `basePrice = unitPrice / unitDef.factor` (از `uom.ts`)
- [ ] آیا `recordHistory` dedup دارد؟ (same day+value → no-op)
- [ ] آیا `structuralBreak` **time-span guard** دارد؟ (`timespan >= 7d`)

### C. UI Wiring

- [ ] آیا `FieldHint` در UI هست؟ (اگر نه، profile بی‌فایده)
- [ ] آیا `showError` از `useFormErrors` به فیلد وصل است؟ (نه `setErr` دستی)
- [ ] آیا `attemptSave()` قبل از `save()` صدا زده می‌شود؟
- [ ] آیا wrapper save فقط `if (vErrors) return;` است؟ (بدون `setErr('')`)

### D. پیام‌ها

- [ ] آیا MSG استفاده شده؟ (نه hardcoded)
- [ ] آیا لیبل از `FIELD_LABELS` می‌آید؟ (نه string دستی)

### E. AI Discovery (Gap 12)

- [ ] آیا `docs/AI-BOOT.md` لینک به این سند دارد؟
- [ ] آیا این سند با تغییرات جدید آپدیت شده است؟

### F. تست

- [ ] `npx tsc --noEmit` سبز؟
- [ ] `npx vitest run src/test/intelligence.test.ts` سبز؟
- [ ] تست دستی: ۵ سناریوی فاز ۱ (خرید عادی، جهش، تغییر واحد، خرید نادر، typo)

---

## دستورات اجباری قبل از شروع

~~~
cd ~/Bird-new

# ۱. اندازه‌ها
wc -l src/shr/intelligence/*.ts src/shr/validation/*.ts

# ۲. تست‌ها
npx vitest run src/test/intelligence.test.ts 2>&1 | tail -5

# ۳. TSC
npx tsc --noEmit

# ۴. اگر روی فیلد جدید کار می‌کنی:
grep -n fieldPath src/shr/intelligence/fieldProfiles.ts
grep -n fieldPath src/shr/intelligence/formatWarning.ts
~~~

---

## خلاصه ۱ صفحه‌ای

| مفهوم | کجا | چیه |
|-------|-----|-----|
| Zod | validation/rules/*.ts | بلاک سخت (نمی‌تونی ذخیره کنی) |
| FieldProfile | intelligence/fieldProfiles.ts | ۱۳۵ فیلد، تنظیمات هشدار نرم |
| AnomalyDetector | intelligence/anomalyDetector.ts | تشخیص ۸ سیگنال |
| HistoryStore | intelligence/historyStore.ts | تورمی (localStorage، TTL=۱۸۰ روز) |
| formatWarning | intelligence/formatWarning.ts | ۱۲ الگوی پیام، ۹۵ لیبل |
| FieldHint | intelligence/FieldHint.tsx | کامپوننت هشدار کنار فیلد |
| AnomalyHint | intelligence/AnomalyHint.tsx | کامپوننت هشدار بعد از ذخیره |

۵ لایه:
۱. Zod (block) -> ۲. Profile (تنظیم) -> ۳. Detector (تشخیص) -> ۴. History (یادگیری) -> ۵. UI (نمایش)

۲ کلمه کلیدی:
- structuralBreakAware = تورمی (۱۸ فیلد قیمت)
  - الگوریتم: `n≥6 AND rMean > olderMean×1.3 AND all recent > olderMean×1.1`
  - محدودیت: بدون زمان، فقط صعودی، mean نه median (بخش ۱۴)
- crossFieldRule = مقایسه با فیلد دیگر (۲۳ فیلد، ۹ قاعده)

۳ قانون طلایی:
۱. Zod != Intelligence (بلاک vs هشدار)
۲. FIELD_LABELS = Source of Truth لیبل‌ها
۳. MSG = استاندارد پیام خطا

۲ نکته حیاتی (2026/11):
- **Gap 12 بحرانی:** AI-BOOT باید به این سند لینک بدهد (شش فایل مقدس — نه پنج)
- **۱۴ سناریو:** تنوع تأمین‌کننده، تخفیف حجمی، فصلی، typo، ... → فاز ۱ فقط ۳ سناریو، ۱۱ سناریو deferred
- **Gap 8-10:** unit normalization + dedup + time-span — قبل از فاز ۲

---

*این سند زنده است — با هر فیلد/profile/قاعده‌ی جدید آپدیت کن.*
*آخرین به‌روزرسانی: ۱۴۰۵/۰۸/۰۹*
