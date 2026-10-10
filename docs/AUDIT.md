# 🔍 AUDIT.md — چک‌لیست کامل ممیزی ماژول‌ها

> **قاعده طلایی:** هر ماژول تا نمره ۹۰+ نگیره، قفل نمی‌شه.
> **منابع:** Apple HIG + Google Play + Microsoft Store + ISO/IEC 25010 + WCAG 2.1 + INSO ایران

---

## 📋 چک‌لیست ۷ محوره (۱۰۰ نمره)

### ۱. Functional Suitability (عملکردی) — ۱۵ نمره
- [ ] CRUD کامل (افزودن، ویرایش، حذف)
- [ ] ذخیره و بارگذاری درست
- [ ] اعتبارسنجی ورودی (Zod)
- [ ] Undo برای عملیات مخرب
- [ ] مدیریت خطا و fallback
- [ ] پوشش حالت‌های لبه‌ای (۰، منفی، خالی، تکراری)

### ۲. UX (تجربه کاربری) — ۲۰ نمره
- [ ] Progressive Disclosure (افشای تدریجی)
- [ ] حالت‌های Empty / Loading / Error
- [ ] Inline Validation (اعتبارسنجی زیر فیلد)
- [ ] State Persistence (ذخیره فیلتر، تب، اسکرول)
- [ ] Read-only ≠ Disabled
- [ ] فیلدهای آبشاری (Cascade) درست
- [ ] حداکثر ۷ فیلد در هر مرحله (Form Rules)

### ۳. UI (رابط بصری) — ۲۰ نمره
- [ ] فقط رنگ‌های معنایی (`--accent`, `--warn`, `--danger`, `--info`, `--muted`)
- [ ] رنگ hex هاردکد ممنوع
- [ ] فاصله‌ها مضرب ۸ (`--sp-*`)
- [ ] فونت از توکن‌ها (`--fs-*`)
- [ ] حداقل هدف لمسی ۴۴×۴۴
- [ ] RTL کامل (تأیید راست، لغو چپ)
- [ ] سلسله‌مراتب بصری درست

### ۴. Accessibility (دسترس‌پذیری) — ۱۵ نمره
- [ ] aria-label برای آیکون‌های تنها
- [ ] Focus trap + Esc در مودال‌ها
- [ ] ناوبری با کیبورد (Tab, Enter, Esc)
- [ ] کنتراست ≥ ۴.۵:۱
- [ ] Reduced motion
- [ ] Screen reader

### ۵. Performance (کارایی) — ۱۰ نمره
- [ ] بدون N+1 (کوئری‌های تکراری)
- [ ] useMemo/useCallback برای محاسبات سنگین
- [ ] کش کردن داده‌های سنگین
- [ ] Lazy loading

### ۶. Integration (اتصالات) — ۱۰ نمره
- [ ] لینک‌های بین‌ماژولی (EntityLink)
- [ ] فیلترهای URL (useUrlFilter)
- [ ] Context passing
- [ ] AutoFill از والد

### ۷. Senior Review (بازبینی ارشد) — ۱۰ نمره
- [ ] **Edge Cases:** ۰، منفی، ۹۹۹۹۹۹، کاراکتر خاص، تاریخ نامعتبر، null، تکراری
- [ ] **Loading & Async:** Skeleton، Error state، Retry
- [ ] **User Control:** Undo، Confirmation، Esc
- [ ] **Empty & Error:** پیام آموزنده، اکشن قابل انجام
- [ ] **Data Integrity:** Auto-save draft، Cascade delete
- [ ] **Cognitive Load:** فرم ≤ ۷ فیلد، Helper text
- [ ] **Consistency:** Spacing tokens، Color semantics، Button styles
- [ ] **Polish:** بدون alert()، بدون hardcode، بدون TODO

---

## 📊 جدول نمره‌دهی

| نمره | رتبه |
|:---:|---|
| ۹۵-۱۰۰ | Google/Apple Quality |
| ۹۰-۹۴ | Production Ready |
| ۸۰-۸۹ | Needs polish |
| ۷۰-۷۹ | Needs work |
| < ۷۰ | Not ready |

---

## 🚀 فرآیند AUDIT

1. انتخاب ماژول (مثلاً `brd`)
2. تب‌به‌تب بررسی (پرنده‌ها → نژادها)
3. نمره‌دهی طبق ۷ محور
4. Fix تا رسیدن به ۹۰+
5. قفل ماژول
6. ماژول بعدی

---

## 🔬 ممیزی سطح-فیلد

### برای هر فیلد چک کن:
1. **منبع داده‌اش کجاست؟** دستی / استاندارد / والد (آبشاری) / preset / محاسباتی
2. **auto-fill داره؟** مقدار از کجا؟ کاربر عوضش کرد → OverrideHint؟
3. **اعتبارسنجی داره؟** min/max، required، حالت لب
4. **دو ستونه یا تک؟** کوتاه → Grid2، بلند → full-width، حداکثر ۲ ستون
5. **واحدش درسته؟** m/kg/°C/تومان (MoneyField)

---

## 🔗 ممیزی آبشاری (Cascade)

### برای هر فیلد وابسته:
1. والد چی داره؟
2. فرزند از والد تغذیه می‌کنه؟
3. تا انتخاب والد → فرزند غیرفعاله؟
4. پاک کردن والد → فرزند پاک می‌شه؟
5. عمق آبشار چند سطحه؟ (حداکثر ۲)
6. DependentSelect استفاده شده یا Select ساده؟

الگو:

---

## 🎛️ ممیزی فیلترها

### برای هر فیلتر:
1. ترتیب منطقیه؟ (زمان → طرف → اقلام → مالی)
2. فیلتر وابسته داره؟ (سالن → بخش)
3. همه فیلترها URL param دارن؟ (useUrlFilter)
4. Empty state فیلتر داره؟
5. دکمه «پاک کردن همه» داره؟
6. فیلترهای پایه‌ای وجود دارن؟ (تاریخ، وضعیت، پرنده، نژاد)
7. مرتب‌سازی چطوریه؟ (نام، تاریخ، مقدار)

---

## 🧩 ممیزی اتصالات بین-ماژولی

### برای هر اتصال:
1. EntityLink هست؟ (کلیک روی اسم → می‌ره ماژول مقصد)
2. AutoFill از والد داره؟
3. URL param برای focus داره؟ (?focus=xxx)
4. Cascade delete داره؟
5. منبع مالی/انباری: sourceInvoiceId، warehouseItemId متصله؟

---

## 🏗️ ممیزی ساختاری

### برای هر فایل:
1. اندازه ≤ ۴۰۰ خط؟ (استثنا: data, test)
2. در جای درست؟ (shr/ عمومی، mod/xxx اختصاصی)
3. hex هاردکد صفر؟ (فقط var)
4. fontSize هاردکد صفر؟ (فقط fs-*)
5. spacing مضرب ۸؟ (sp-*)
6. Undo + Confirm + Toast برای عملیات مخرب
7. Auto-save Draft (useFormDraft) برای فرم >۵ فیلد
8. Skeleton برای بارگذاری داده سنگین
9. حالت‌های Empty / Loading / Error همه جا

---

## 🌍 استاندارد مرجع (Reference Standard)

### قبل از هر ممیزی:

#### ۱. استاندارد نرم‌افزاری
- [ ] ISO/IEC 25010 (تناسب عملکردی، کارایی، سازگاری، قابلیت استفاده، پایداری، امنیت، قابلیت نگهداری، قابلیت انتقال)
- [ ] Microsoft Store (کامل بودن، بدون placeholder یا قابلیت شکسته)
- [ ] Google Play (چهار ستون: ارزش، UX، فنی، امنیت)
- [ ] Apple HIG (یکپارچگی طراحی، حس درست)

#### ۲. استاندارد صنعتی (طیور)
- [ ] استانداردهای نژاد (Cobb, Ross, Hy-Line, Lohmann)
- [ ] Big Dutchman / Pas Reform / Odoo Poultry 360
- [ ] ISO 11788 (ADED) — تبادل داده کشاورزی
- [ ] برنامه جوجه‌کشی Pas Reform (شرایط محلی)

#### ۳. استاندارد بومی ایران
- [ ] INSO 3662 (نگهداری تخم جوجه‌کشی)
- [ ] INSO 3207, 605, 2387 (خوراک طیور)
- [ ] INSO 3834 (کشتار طیور)
- [ ] نرم‌افزارهای بومی: فارم چک، نوین فارم

---

## 🔍 تحلیل شکاف (Gap Analysis)

### ۴ دسته شکاف:

| نوع | معنی | اقدام |
|---|---|---|
| Missing | کاملاً وجود نداره | افزودن |
| Incomplete | ناقصه | تکمیل |
| Incorrect | اشتباه پیاده شده | بازنویسی |
| Redundant | اضافیه | حذف |

### ۵ سؤال کلیدی برای هر بخش:
1. مقایسه با استانداردهای جهانی چطوره؟
2. پوشش ISO 25010 چطوره؟
3. عمق داده‌های کشاورزی کافیه؟
4. شکاف‌های شناسایی‌شده چیه؟
5. اولویت‌بندی: Critical / Important / Minor

### خروجی:
پس از پاسخ، **نمره انطباق (Compliance Score)** از ۱۰۰ محاسبه می‌شه.

---

## 🎬 ممیزی UX-عمیق (Interaction Design)

### ۶ سؤال برای هر فرم:

#### ۱. ترتیب فیلدها منطقیه؟
- [ ] عمومی → خاص → هویتی
- [ ] مهم‌ترین فیلد اول
- [ ] فیلد محاسباتی بعد از فیلدهای ورودی
- [ ] فیلد اسم/برچسب آخر (نه اول)

#### ۲. کاربر می‌دونه چیکار می‌کنه؟
- [ ] HelpBanner بالای فرم
- [ ] تعداد فیلدها ≤ ۷
- [ ] هر فیلد راهنما یا placeholder
- [ ] فیلدهای پیشرفته در «بخش بیشتر»

#### ۳. فیلدها به هم ربط دارن؟
- [ ] محاسبات خودکار
- [ ] فرمول زیر فیلد نشون داده بشه
- [ ] والد عوض شد → فرزند ریست
- [ ] کاربر مقدار auto عوض کرد → OverrideHint

#### ۴. کاربر می‌فهمه کارش درست بوده؟
- [ ] Inline Validation زنده
- [ ] پیش‌نمایش نتیجه
- [ ] Tooltip برای اصطلاحات فنی
- [ ] Toast تأیید بعد از ذخیره

#### ۵. فیلدهای آبشاری درستن؟
- [ ] والد انتخاب نشده → فرزند غیرفعال
- [ ] والد عوض شد → فرزند ریست
- [ ] حداکثر عمق ۲ سطح
- [ ] DependentSelect نه Select ساده

#### ۶. حالت‌های لب پوشش داده شدن؟
- [ ] Empty → پیام آموزشی
- [ ] Full → scroll / virtualization
- [ ] Error → پیام واضح + بازیابی
- [ ] Loading → Skeleton
- [ ] Double-submit جلوگیری
- [ ] فرم نیمه‌کاره → Draft یا هشدار
- [ ] Cancel → تأیید یا انصراف نرم

---

## ✅ ممیزی اعتبارسنجی هوشمند

### سه لایه اعتبارسنجی:

#### لایه ۱ — لحظه‌ای (Inline)
- [ ] بعد از blur (نه هر keystroke)
- [ ] پیام خطا زیر فیلد
- [ ] blame-free: «شماره باید ۱۱ رقم باشد»
- [ ] رنگ قرمز + آیکون هشدار
- [ ] aria-invalid + aria-describedby

#### لایه ۲ — بین‌فیلدی (Cross-field)
- [ ] فرزند ≤ والد
- [ ] تاریخ پایان ≥ شروع
- [ ] مجموع اقلام = جمع کل
- [ ] نژاد هم‌خانواده با پرنده

#### لایه ۳ — کسب‌وکاری (Business Rules)
- [ ] نام تکراری → جلوگیری + پیشنهاد
- [ ] حذف با وابسته → هشدار
- [ ] خارج بازه منطقی → هشدار
- [ ] تناقض داده → پیشنهاد اصلاح

---

## 🧮 ممیزی محاسبات

### ۴ سؤال:

#### ۱. منبع فرمول کجاست؟
- [ ] استاندارد نژاد / قانون ریاضی / استاندارد صنعت
- [ ] مستند شده؟

#### ۲. دقت عددی
- [ ] واحدها درست (m, kg, °C)
- [ ] اعشار درست (FCR ۲، دما ۱)
- [ ] Math.floor نه round
- [ ] toFa نمایش / toEn ذخیره

#### ۳. اعتبار محاسبه
- [ ] صفر → صفر (نه NaN)
- [ ] منفی → بلاک یا اصلاح
- [ ] خیلی بزرگ → هشدار
- [ ] تقسیم بر صفر → مدیریت

#### ۴. نتایج معنادار
- [ ] نتیجه با واحد
- [ ] فرمول کنار نتیجه (مثلاً ۱۰ × ۵ × ۲.۵ = ۱۲۵)
- [ ] Tooltip برای پارامترها
- [ ] مقایسه با بازه معمول

---

## 🔄 ممیزی جریان داده (Data Flow)

### برای هر ماژول:

#### ۱. از کجا داده می‌گیره؟ (Inputs)
- [ ] Cross-Store Read
- [ ] URL params (?focus=xxx)
- [ ] localStorage مشترک
- [ ] Computed (خودکار)
- [ ] فرم دستی

#### ۲. به کجا داده می‌ده؟ (Outputs)
- [ ] ماژول دیگه (EntityLink)
- [ ] store خودش
- [ ] فاکتور/گزارش
- [ ] هشدار (alt) / تقویم (cal)

#### ۳. الگوهای استاندارد:
- [ ] Cascade Delete
- [ ] AutoFill
- [ ] EntityLink
- [ ] Focus Param
- [ ] Source Tracking

#### ۴. نقاط ضعف رایج:
- [ ] داده تولید می‌شه هیچ‌کس نمی‌خونه (Dead Data)
- [ ] داده لازمه ولی تولید نمی‌شه (Missing Link)
- [ ] دو ماژول یکسان ذخیره می‌کنن (Duplication)
- [ ] یک‌طرفه‌ست (Write-only/Read-only)

---

## 🔒 الگوهای قفل‌شده

### OverrideHint
- کامپوننت: `src/shr/components/OverrideHint.tsx`
- hook: `src/shr/hooks/useOverride.ts`
- استفاده: `const { hint } = useOverride({...}); <OverrideHint {...hint} />`
- طراحی: متن زرد + خط نقطه‌چین زیر فیلد، کلیک → بازگشت

### useFormDraft (Auto-save)
- `src/shr/hooks/useFormDraft.ts`
- استفاده: `const draft = useFormDraft('key', form, setForm); draft.clear();`

### useFocusParam (?focus=xxx)
- `src/shr/hooks/useFocusParam.ts`
- کاربرد: از URL focus بخون + scroll + خودکار از URL پاک کن

### EntityLink
- `src/shr/components/EntityLink.tsx`
- type: bird | breed | flock | hall | party | invoice | item | device | log
- حالت badge: `<EntityLink type="breed" id={...} label={...} badge badgeBg="var(--purple-soft)" />`

### Skeleton
- `src/shr/components/Skeleton.tsx`
- استفاده: `<Skeleton rows={3} />` یا `<Skeleton.Card />`

### فلش SVG استاندارد
اعمال در: SmartSelect.tsx, AutocompleteSheet.tsx

### SourceBadge
- فقط آیکون ۱۶×۱۶ داخل برچسب فیلد
- manual یا none → هیچ آیکونی
- سبز = استاندارد | آبی = preset | زرد = والد

### رنگ دسته‌بندی تجهیزات
- cat-ventilation, cat-feeding, cat-drinking, ...
- در `src/shr/styles/global.css`

---

## 📌 فرمان‌های AUDIT

| فرمان | معنی |
|---|---|
| AUDIT module | چک‌لیست ۷ محوره کامل |
| AUDIT fields | منبع/auto/آبشاری هر فیلد |
| AUDIT filters | ترتیب و منابع فیلتر |
| AUDIT connections | EntityLink بین ماژول‌ها |
| AUDIT structure | اندازه و جای فایل |
| AUDIT gaps | Gap Analysis با استانداردهای جهانی |
| AUDIT ux | UX-عمیق (۶ سؤال) |
| AUDIT validation | ۳ لایه اعتبارسنجی |
| AUDIT calc | دقت محاسبات |
| AUDIT flow | جریان داده |
| AUDIT all | همه با هم |

---

*سند زنده — با هر ماژول تموم‌شده، به‌روز می‌شه.*
