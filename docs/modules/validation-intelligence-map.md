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
| flk | بله (۱۴ فیلد) | rules/flk.ts | خیر (۰) | بله (۴ فایل) |
| tra | بله (۱۴ فیلد) | rules/tra.ts | بله (۲۷ بار) | خیر |
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

## Gaps شناسایی‌شده (بدون حدس — از کد)

### Gap ۱ — Intelligence فقط در ۲ ماژول UI
- brd/BreedForm.tsx — FieldHint
- flk/components/* (۴ فایل) — FieldHint
- ۱۰ ماژول دیگر از Intelligence استفاده نمی‌کنن (tra, whs, inc, hal, egg, dlg, fed, ctc, alt, set)

### Gap ۲ — tra.deal.* profile هست ولی UI وصل نیست
- ۴ profile برای معاملات خاص: tra.deal.value, tra.deal.quantity, tra.deal.unitPrice, tra.deal.payment
- UI: DealsPage.tsx — FieldHint import نشده
- نتیجه: زیرساخت آماده، UI وصل نیست

### Gap ۳ — MSG فقط در tra.ts
- tra.ts: ۲۷ بار MSG.*
- whs.ts, flk.ts, inc.ts, hal.ts, egg.ts, dlg.ts, fed.ts, brd.ts: ۰ بار
- بقیه از helper (requiredStr, requiredId) یا hardcoded

### Gap ۴ — hardcoded پیام در flk.ts
- خط ۹۳: message: حداقل یکی از تاریخ‌های هچ، خرید یا شروع را وارد کنید
- خط ۱۱۰: message: مبلغ اجاره را وارد کنید
- خط ۲۱۵: message: برای منبع جوجه‌کشی خودم تاریخ هچ را وارد کنید
- خط ۲۲۳: message: برای منبع خریداری تاریخ خرید را وارد کنید
- این‌ها باید در MSG باشن.

### Gap ۵ — لیبل‌های ناهمسان

| مفهوم | FIELD_LABELS | InvoiceFormModal | DealsPage |
|-------|----------------|--------------------|----|
| chick price | قیمت جوجه | قیمت هر جوجه | 🐣 جوجه یک‌روزه |
| feed price | قیمت دان | قیمت هر... | - |
| medicine price | قیمت دارو | قیمت هر... | - |

### Gap ۶ — chickWeight بدون پیشوند
- در FIELD_LABELS: chickWeight (بدون tra. یا inc.)
- در profiles: احتمالاً chickWeight (نیاز به verify)

### Gap ۷ — inc.temperature در bio range ندارد
- Q3 (دما و رطوبت): dlg.temperature bio range داره، ولی inc.temperature نداره
- (طبق خروجی، فقط ۱۲ فیلد bio دارند و inc.temperature نیست)

---

## اولویت‌بندی Gap ها

| # | Gap | اهمیت | پیچیدگی |
|---|-----|--------|---------|
| ۱ | Intelligence در tra وصل نیست | بالا | متوسط |
| ۲ | MSG فقط در tra | بالا | متوسط |
| ۳ | لیبل ناهمسان | متوسط | کم (فقط متن) |
| ۴ | hardcoded در flk | متوسط | کم |
| ۵ | Intelligence در whs/inc/hal/egg | پایین | بالا |
| ۶ | inc.temperature bio range | پایین | کم |
| ۷ | chickWeight پیشوند | خیلی پایین | صفر |

---

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

## چک‌لیست قبل از پچ

- [ ] آیا fieldPath در FIELD_PROFILES هست؟
- [ ] آیا FIELD_LABELS[fieldPath] تعریف شده؟
- [ ] اگر قیمت هست، structuralBreakAware: true؟
- [ ] اگر دما/رطوبت هست، biologicalRange؟
- [ ] اگر مقایسه با فیلد دیگه هست، crossFieldRule؟
- [ ] آیا FieldHint در UI هست؟ (اگر نه، profile بی‌فایده)
- [ ] آیا MSG استفاده شده؟ (نه hardcoded)
- [ ] npx tsc --noEmit سبزه؟
- [ ] npx vitest run src/test/intelligence.test.ts سبزه؟

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
- crossFieldRule = مقایسه با فیلد دیگر (۲۳ فیلد، ۸ قاعده)

۳ قانون طلایی:
۱. Zod != Intelligence (بلاک vs هشدار)
۲. FIELD_LABELS = Source of Truth لیبل‌ها
۳. MSG = استاندارد پیام خطا

---

*این سند زنده است — با هر فیلد/profile/قاعده‌ی جدید آپدیت کن.*
*آخرین به‌روزرسانی: ۱۴۰۵/۰۸/۰۹*
