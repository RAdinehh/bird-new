# 📝 DECISIONS — تاریخچه تصمیمات

> **append-only**. جدیدترین بالا.
> AI قبل از تغییر ساختاری، ۳۰ خط اول را بخواند.

---

## فرمت

~~~
[DATE] عنوان
- تصمیم:
- دلیل:
- جایگزین رد شده:
- عواقب:
- فایل‌های متاثر:
~~~

---

## تاریخچه

### [1405/08/09] Placeholder استاندارد (SAP Fiori / Odoo)
- **تصمیم:** Placeholder != Label. Placeholder = راهنمای فرمت/واحد. Placeholder != "مثلاً داده".
- **دلیل:** SAP Fiori Design Guidelines + Odoo UX. کاربر داده‌ی نمونه را با داده‌ی واردشده اشتباه می‌گیرد.
- **جایگزین رد شده:** Placeholder = Label (تکرار) — رد شد. Placeholder = "مثلاً X" (اشتباه کاربر) — رد شد.
- **عواقب:** `getPricePlaceholder` حالا "تومان" برمی‌گرداند. `getDescriptionPlaceholder` راهنمای محتوا.
- **فایل‌های متاثر:** `tra/components/InvoiceFormModal.tsx`.

---

### [1405/08/09] «قیمت هر واحد» یکدست
- **تصمیم:** Form fields = `قیمت هر واحد`. Table headers (چاپ) = `قیمت واحد`. Hint labels (FIELD_LABELS) = `قیمت {category}`.
- **دلیل:** هر ۳ مفهوم متفاوت‌اند، نه ناهمسانی.
- **جایگزین رد شده:** همه یکسان — رد شد، context هر کدام متفاوت است.
- **عواقب:** `DealsPage:1322` تغییر کرد. بقیه دست نخوردن.
- **فایل‌های متاثر:** `tra/DealsPage.tsx`.

---

### [1405/08/09] MSG helper = استاندارد پیام خطا
- **تصمیم:** پیام جدید → اول در `MSG`، بعد استفاده. hardcode فقط در پیام‌های شرطی خاص.
- **دلیل:** یکدستی پیام‌ها. جلوگیری از تکرار.
- **جایگزین رد شده:** hardcode در همه‌جا — رد شد.
- **عواقب:** flk.ts ۵ پیام به MSG. tra.ts از قبل ۲۷ بار.
- **فایل‌های متاثر:** `validation/rules/flk.ts`.

---

### [1405/08/09] Gap ۶ (species_temp) رها به آخر
- **تصمیم:** `species_temp` resolver و `biologicalRange` signal در anomalyDetector رها می‌شود به آخر پروژه.
- **دلیل:** `set/standards/` از قبل incubation standards دارد (setterTemp: 37.7, hatcherTemp: 37.2). `fieldProfiles.ts` static است و به store دسترسی ندارد. نیاز به معماری استانداردها.
- **جایگزین رد شده:** هاردکد در profile — رد شد، چون standards از قبل هست.
- **عواقب:** `inc.temperature` و `inc.humidity` فعلاً bio range ندارند. `dlg.temperature` هم signal biological تولید نمی‌کند.
- **فایل‌های متاثر:** `intelligence/fieldProfiles.ts`, `intelligence/anomalyDetector.ts`.

---

### [1405/08/09] chickWeight بدون پیشوند (نه Gap)
- **تصمیم:** `chickWeight` پیشوند `tra.` یا `inc.` نمی‌گیرد.
- **دلیل:** در ۳ ماژول استفاده می‌شود (flk, inc, tra). مفهوم بین‌ماژولی است.
- **جایگزین رد شده:** تغییر به `inc.chickWeight` — رد شد.
- **عواقب:** `chickWeight` exception در naming convention.
- **فایل‌های متاثر:** ندارد (بدون تغییر).

---

### [1405/08/09] سیستم standards/ از قبل بالغ است
- **تصمیم:** هر Gap مربوط به استانداردها (دمای جوجه‌کشی، FCR، ADG، وزن استاندارد) باید `set/standards/` را ببیند، نه هاردکد در profile.
- **دلیل:** `set/standards/` از قبل `BirdStandard` interface، `data.ts` (شامل CHICKEN_INCUBATION)، `data-breeds/` و `_override.ts` را دارد.
- **جایگزین رد شده:** هاردکد مقادیر استاندارد در `fieldProfiles.ts` — رد شد.
- **عواقب:** هر AI بعدی باید قبل از افزودن bio range، `set/standards/` را بررسی کند.
- **فایل‌های متاثر:** همه Gap های مرتبط با standards.

---


---

### [1405/08/09] Origin Tracking — relatedSettlementId + sourceType
- **تصمیم:** `Invoice` دارای `relatedSettlementId?: string` و `sourceType?: 'manual' | 'deal' | 'settlement' | 'flock'`.
- **دلیل:** ردیابی دوطرفه (تسویه ↔ فاکتور) مشابه الگوی گله (`Flock.sourceInvoiceId`). امکان undo/reopen.
- **جایگزین رد شده:** فقط `relatedDealId` — رد شد، چون نمی‌شد فاکتور را دقیقاً به تسویه‌ی خاص نسبت داد.
- **عواقب:** فاکتورهای قدیمی (بدون relatedSettlementId) lock نمی‌شن ولی cascade restore کار می‌کند (از `Settlement.invoiceId`).
- **فایل‌های متاثر:** `types.ts`, `store.ts`, `settlement.ts`, `InvoiceFormModal.tsx`, `DealsPage.tsx`.

---

### [1405/08/09] کمیسیون تسویه — line item جداگانه
- **تصمیم:** `createInvoiceFromSettlement` کمیسیون را به‌عنوان آیتم منفی در `items[]` اضافه می‌کند. `total = netPayable` بدون تغییر می‌ماند.
- **دلیل:** استاندارد Odoo/SAP — شفافیت در چاپ فاکتور («کمیسیون نماینده: -X تومان»).
- **جایگزین رد شده:** قرار دادن در `discount` — رد شد، شفافیت چاپ فاکتور از دست می‌رفت.
- **عواقب:** تعداد `items` در تست‌ها از ۱ به ۲. کاربر در فرم ویرایش فاکتور، آیتم کمیسیون را می‌بیند (قفل).
- **فایل‌های متاثر:** `settlement.ts`, `deal-journey.test.ts`.

---

### [1405/08/09] bird/breed از گله استخراج می‌شود
- **تصمیم:** اگر `DealGood.existingFlockId` وجود دارد، `createInvoiceFromSettlement` فیلدهای `birdId`, `breedId`, `flockId`, `flockName` را از Flock می‌خواند.
- **دلیل:** `DealGood` این فیلدها را ندارد و Zod روی ذخیره fail می‌دهد.
- **جایگزین رد شده:** اضافه کردن فیلدها به DealGood + UI — رد شد، ۴-۶ ساعت کار و overlap با گله.
- **عواقب:** استخراج یک‌طرفه (Deal→Flock). تغییر بعدی گله، فاکتور را تغییر نمی‌دهد.
- **فایل‌های متاثر:** `settlement.ts`.

---

### [1405/08/09] گارد تسویه تکراری — بدون بررسی status
- **تصمیم:** `addSettlement` فقط با `dealId + periodStart + periodEnd` بررسی می‌کند، بدون `status`.
- **دلیل:** باگ قبلی (`status === 'draft'`) اجازه می‌داد تسویه‌ی invoiced → تسویه‌ی جدید ساخته شود.
- **جایگزین رد شده:** allow-if-not-draft — رد شد، همان باگ.
- **عواقب:** کاربر برای ساخت تسویه‌ی جدید در همان بازه، باید اول undo/حذف کند.
- **فایل‌های متاثر:** `store.ts`.

---

### [1405/08/09] UI Lock فیلدهای required در فاکتورهای از تسویه
- **تصمیم:** `date`, `category`, `partyId`, `deliveryDate`, `items[]` قفل می‌شوند اگر `relatedSettlementId` یا `sourceType === 'settlement'`. `relatedDealId` آزاد می‌ماند.
- **دلیل:** داده‌های مالی از تسویه آمده، تغییرشان باعث ناسازگاری می‌شود. الگوی گله (`FlockDetailsSection`) مرجع.
- **جایگزین رد شده:** قفل کامل شامل `relatedDealId` — رد شد، الگوی گله لینک را آزاد می‌گذارد.
- **عواقب:** کاربر برای اصلاح فیلدهای قفل، باید undo و دوباره convert کند.
- **فایل‌های متاثر:** `InvoiceFormModal.tsx`.

---

### [1405/08/09] فیلتر مخاطبین در معاملات خاص — فقط customers
- **تصمیم:** `SmartSelect` در فرم معامله فقط مخاطبین با `roles.includes('customer')` را نشان می‌دهد.
- **دلیل:** معاملات خاص خرید ندارد. طرف مقابل همیشه گیرنده است (مشتری/شریک/آمانت‌گیر).
- **جایگزین رد شده:** همه مخاطبین — رد شد، انتخاب فروشنده/کارگر خطا می‌داد.
- **عواقب:** اگر شریک/آمانت‌گیر با نقش «فروشنده» ثبت شده، دیده نمی‌شود (کاربر باید نقشش را اضافه کند).
- **فایل‌های متاثر:** `DealsPage.tsx`.

---

### [1405/08/09] BadgeOverflow — کامپوننت مشترک برای +N
- **تصمیم:** استخراج `BadgeOverflow` به `src/shr/components/ui/BadgeOverflow.tsx`. FlockCard و DealsPage از آن استفاده می‌کنند. InvoiceCard (فقط ۲ بج) نیاز ندارد.
- **دلیل:** DRY. کاهش ۹۶ خط از FlockCard. هماهنگی بین کارت‌ها.
- **جایگزین رد شده:** کپی منطق در هر فایل — رد شد، maintenance cost.
- **عواقب:** تغییر آینده‌ی overflow logic فقط در یک فایل.
- **فایل‌های متاثر:** `BadgeOverflow.tsx` (جدید), `FlockCard.tsx`, `DealsPage.tsx`.

---

### [1405/08/09] تفکیک Badge (metadata) از Stats (financial)
- **تصمیم:** Badge = metadata (status, age, count). Stats = financial/read-only (value, percent, dueDate). Interactive elements در stats ممنوع.
- **دلیل:** استاندارد FlockCard/InvoiceCard. جلوگیری از click conflict.
- **جایگزین رد شده:** دکمه در stats (DealsPage قبلی) — رد شد.
- **عواقب:** اکشن‌های interactive در بدنه (وقتی باز) یا headerAction.
- **فایل‌های متاثر:** `DealsPage.tsx`, `UI-PATTERNS.md` (باید به‌روز شود).

---

### [1405/08/09] CardActions — استاندارد کارت‌های اصلی
- **تصمیم:** `CardActions` از `src/shr/components/ui/CardActions.tsx` — grid auto-fit، هر دکمه `flex:1`. `stopPropagation` داخلی. اکشن اصلی `primary`، حذف `danger`، ثانویه `outline`.
- **دلیل:** هماهنگی با FlockCard (استاندارد طلایی). جلوگیری از event bubbling.
- **جایگزین رد شده:** grid دستی — رد شد، کد تکراری.
- **عواقب:** همه کارت‌های اصلی از CardActions استفاده می‌کنند.
- **فایل‌های متاثر:** `CardActions.tsx`, `DealsPage.tsx`.

---


### [1404/07/28] DevicesPage — استثنا در L7

- **تصمیم:** `inc/DevicesPage.tsx` (۵۰۶ خط) به‌عنوان استثنای L7 می‌ماند. split نمی‌شود.
- **دلیل:** JSX داخلی ۵۰۰ خط با ~۱۵ متغیر useMemo/useState و handlerهای مشترک درهم تنیده شده. هر split نیاز به ~۱۵ prop داره یا context. ریسک شکستن > فایده خط‌شمار.
- **جایگزین رد شده:** split به `DeviceReadingsSection` + `DeviceMaintenanceSection` — رد شد، چون مرزهای JSX با nested braces قابل اطمینان نیستند (rollback در تلاش اول).
- **عواقب:** L7 cap از ۴ به ۱ کاهش یافت (فقط `inc/DevicesPage.tsx` باقی می‌ماند). این یک استثنای پذیرفته‌شده است.
- **فایل متاثر:** `src/mod/inc/DevicesPage.tsx` (دست‌نخورده)

---

### [1404/07/28] L13: توقف کاهش type=number — مرز بین فیلتر و مبلغ

- **تصمیم:** L13 cap روی ۲۹ می‌مونه. FilterGroupBody برگشت به `type="number"`. کاهش متوقف.
- **دلیل:** `FilterGroupBody` فیلتر عددی است، و `Input.tsx` با `inputMode="numeric"` وارد حالت number می‌شود که `formatNumWhileTyping` را فعال می‌کند → مقدار فرمت‌شده به parent می‌رسد → `Number()` در onChange مقدار `NaN` می‌دهد. این باگ جدید می‌سازد.
- **جایگزین رد شده:** ادامه کاهش بدون fix — رد، چون باگ می‌سازد.
- **درس:** `type="number"` در فیلترها استاندارد قابل قبول است. تمرکز L13 روی مبالغ/وزن/درصد باشد که کاربر واقعاً فارسی تایپ می‌کند، نه فیلترها.
- **عواقب:** ۲۹ مورد باقی مانده در `set/standards/*` (۲۷) + `GroupsPage` (۰ — قبلاً fix شد) + این فایل (۲ — برگشت). هدف بعدی: `set/standards` با رویکرد درست (parseFaNum در onChange).

---

### [1404/07/28] UX ratchet: ۱۲ emoji + ۶ save disabled موجود

- **تصمیم:** cap روی مقدار فعلی (۱۲، ۶). کاهش تدریجی در جلسات بعد.
- **دلیل:** این violations از قبل بوده‌اند، نه این جلسه. ratchet از مقدار فعلی، نه ایده‌آل صفر.
- **جایگزین رد شده:** صفر کردن الان — رد، چون کاری خارج از scope جلسه است و ۱۸ جا باید فیکس شود.
- **عواقب:** `scripts/check.sh` این‌ها را نمایش می‌دهد به عنوان ⚠️ نه ❌. تا کاهش پیدا کنند.
- **فایل‌های متاثر:** ۱۲ `*Modal.tsx` با emoji، ۶ دکمه save با `disabled`.

---

### [1404/07/28] Event Bus برای side-effect، نه خواندن

- **تصمیم:** `bus.emit` فقط برای آگاه‌کردن ماژول دیگر. خواندن state از bus ممنوع.
- **دلیل:** bus برای decoupling است، نه پل sync. اگر return value لازم است، معماری اشتباه است.
- **جایگزین رد شده:** `await bus.emit` برای return — رد، چون async شدن مسیرهای sync را خراب می‌کند.
- **عواقب:** برای انتقال `movementId` از handler به caller، از **mutable ref** در payload استفاده کن (`items: TraInvoiceItemRef[]`).
- **فایل‌های متاثر:** `cor/events/bus.ts`، `mod/whs/handlers.ts`، `mod/tra/store.ts`، `mod/egg/store.ts`

---

### [1404/07/28] مهاجرت tra→whs و egg→whs به Bus

- **تصمیم:** `tra:invoice:*` و `egg:production:*` از bus استفاده کنند.
- **دلیل:** این دو مسیر side-effect واقعی روی whs داشتند (add/delete movement). مستقیم = coupling.
- **جایگزین رد شده:** نگه‌داشتن مستقیم — رد، چون AI بعدی نمی‌فهمد چرا یک مسیر bus دارد و دیگری ندارد.
- **عواقب:** `applyInvoiceMovements` و `eggCascade` از ماژول مبدأ حذف شدند، منطق به `whs/handlers.ts` رفت.
- **فایل‌های متاثر:** `mod/tra/store.ts`، `mod/tra/invoiceHelpers.ts`، `mod/egg/store.ts`، `mod/whs/handlers.ts`، `cor/events/events.ts`

---

### [1404/07/28] `hasActiveFilters` نباید `sortState` را شامل شود

- **تصمیم:** `sortState` از `hasActiveFilters` حذف شد.
- **دلیل:** مرتب‌سازی ≠ فیلتر. `sortState` با `initialSort` همیشه پر بود → `hasActiveFilters` دائماً true → دکمه «افزودن» در Empty state هرگز رندر نمی‌شد.
- **جایگزین رد شده:** فیکس در `FlockTabPanel` — رد، چون همه ماژول‌ها همین باگ را داشتند.
- **فایل متاثر:** `shr/filter/useFilterSort.ts`

---

### [1404/07/28] تست `FlocksPage` pre-existing fail بود

- **تصمیم:** قبل از fix، با `git stash` ثابت شد که روی کد قبلی هم fail است.
- **دلیل:** جلوگیری از blame کردن تغییرات جدید برای باگ قدیمی.
- **جایگزین رد شده:** بدون چک، مستقیم fix — رد، چون ممکن بود کد سالم را خراب کند.
- **درس:** قبل از blame، stash. در CONSTITUTION.md ثبت شد.

---

### [1404/07/28] `Empty` و `PageContainer` تایپ `action` دارند

- **تصمیم:** اگر `action` prop بگیرند، باید رندر کنند.
- **دلیل:** قبلاً فرض شده بود نادیده می‌گیرند — کد نشان داد رندر می‌کنند. باگ واقعی نبود.
- **فایل متاثر:** (بدون تغییر)

---

### [1404/07/28] پارادایم چندگانه درمانی — طرح

- **تصمیم:** مدل `Paradigm` + `StandardValue<T>` + `ParadigmProfile`.
- **دلیل:** کاربر می‌تواند مدرن، سنتی، یا هر دو را بخواهد. حقایق متضاد (رطوبت ۶۰٪ vs ۳۰٪) نباید یکی را حذف کنند.
- **وضعیت:** فقط طراحی.
- **جایگزین رد شده:** یک مقدار ثابت — رد، چون کاربر سنتی مجبور به استفاده از مدرن می‌شود.
- **فایل متاثر:** (هنوز بدون تغییر — رجوع `PARADIGM.md`)

---

### [1404/07/28] `FlockBreed` چندریختی (standard/mixed)

- **تصمیم:** `Flock.breedId: string` به `FlockBreed` تبدیل شود.
- **دلیل:** کاربر ممکن است گله مختلط یا نژاد محلی داشته باشد. اجبار به استاندارد = دروغ.
- **وضعیت:** فقط طراحی.
- **جایگزین رد شده:** `breedId + breedName?` — رد، چون ambiguity داشت.
- **فایل متاثر:** (هنوز بدون تغییر — رجوع `COMPLEX-SCENARIOS.md`)

---

### [1404/07/28] مقیاس ۴dp برای اندازه‌ها

- **تصمیم:** همه spacing/padding/margin مضرب ۴. CSS variable `--sp-*` استفاده شود.
- **دلیل:** MD3 + Atlassian — یکدستی بصری.
- **جایگزین رد شده:** اعداد دلبخواه — رد، چون بعد از ۶ ماه ۴۰ اندازه مختلف داری.
- **عواقب:** `scripts/check.sh` اعداد خام را ریپورت می‌کند (ratchet).

---

### [1404/07/28] `type="text"` برای اعداد، نه `type="number"`

- **تصمیم:** همه ورودی‌های عددی → `type="text"` + `Intl.NumberFormat`.
- **دلیل:** `type="number"` به جداکننده پیش‌فرض مرورگر محدود است. فارسی پشتیبانی نمی‌شود.
- **وضعیت:** در `UI-PATTERNS.md` I2 ثبت شد. پیاده‌سازی جلسات بعد.

---

### [1404/07/28] Modular Monolith — مرزهای روشن

- **تصمیم:** ماژول‌ها از `store` همدیگر را می‌بینند، نه `components` یا `hooks`. Side-effect cross-module از `bus.emit`.
- **دلیل:** Modular Monolith (SAP، Odoo) — توسعه‌پذیری بدون شکستن.
- **وضعیت:** در CONSTITUTION.md (L1, L9) ثبت شد. ratchet.

---

*آخرین تصمیم: [1404/07/28] — جلسه ۱۴*

---

### [1405/11/01] استاندارد مدیریت خطا (4-Layer)

**تصمیم:** خطاها در ۴ لایه نمایش داده می‌شن.

| نوع | روش |
|---|---|
| Field validation | inline (Field error) |
| Business error | ErrorBox |
| Prerequisite | toastMsg.error |
| System error | toastMsg.error |

**دلیل:** NN/g + Material 3 + Fluent 2 — خطای inline نزدیک فیلد، بقیه toast. متن‌ها از MSG helper (نه دستی).

**Anti-pattern (حذف‌شده):**
- toastMsg.error برای validation
- «X اجباری است» به جای MSG.select('X')

**مرجع:** docs/ERROR-HANDLING.md

*آخرین تصمیم: [1405/11/01] — جلسه ۱۵*

## جلسه ۱۴۰۵/۱۱/۰۱ — ATP + Auto-merge + Toast + UI chick

### ۱. UI chick: weight + quantity دوستونه
- **فایل:** `InvoiceFormModal.tsx`, `ItemDetailsForm.tsx`
- **قانون:** `quantityField` prop از والد → `ItemDetailsForm` در Grid2 بعد از وزن اولیه
- **دلیل:** مطابق الگوی DealsPage و UI-PATTERNS (Grid2 = ۲ ستون)

### ۲. ATP Check فروش (Zod + Defense in depth)
- **فایل:** `tra.ts`, `invoiceHelpers.ts`, `store.ts`, `useInvoiceForm.ts`
- **قانون:** فروش از گله/انبار > موجودی → Zod error (نه clamp)
- **Edit:** `available = currentCount + prevQty`
- **Multi-item:** تجمیع per flockId/stockItemId (نه چک تک‌تک)
- **Defense in depth:** `applyInvoiceFlocks` throw + `store.ts` re-throw
- **متن خطا:** `تعداد فروش (X) بیش از موجودی گله (Y) است`
- **دلیل:** قبلاً `Math.max(0, ...)` = جوجه فانتوم

### ۳. Auto-merge قلم تکراری
- **فایل:** `useInvoiceForm.ts`
- **Identity:** category+unit+unitPrice+flockId+hatchId+stockItemId+birdId+breedId+description
- **Merge:** quantity/healthy/male/female/unknown/liveWeight جمع می‌شن
- **دلیل:** هماهنگ با DealsPage.handleSourceChange

### ۴. TOAST_DURATION استاندارد
- **فایل:** `toast.ts`
- **SHORT = 3000ms** (success)، **STANDARD = 3500ms** (info/warn/error)
- **دلیل:** W3C WCAG 2.2 (≥۳s) + نظر کاربر (۳-۳.۵s، نه بیشتر)
- **قانون:** هر toast جدید از `TOAST_DURATION` استفاده کنه، نه عدد مستقیم

## جلسه ۱۴۰۵/۱۱/۰۲ — مستندسازی Intelligence (بدون کد)

### تصمیم
- `validation-intelligence-map.md` بازسازی ساختاری (نه بازنویسی): ۵ تناقض تصحیح + ۵ بخش جدید (~۳۰۰ خط)
- `AI-BOOT.md`: پنج فایل مقدس → شش فایل (اضافه شدن Intelligence Map)

### چرا
- AI قبلی ۱ ساعت برای فهم Intelligence کد خواند — این سند جلوی تکرار را می‌گیرد
- ۵ تناقض داخلی (structuralBreak ۱۸ vs ۱۶، biologicalRange ۱۲ vs ۸، Coverage Matrix غلط، ...) AI را گمراه می‌کرد

### محتوای جدید
1. **الگوریتم structuralBreak** (کد + ۵ محدودیت + مثال ایران ۳۶٪)
2. **۱۴ سناریو** (تنوع تأمین‌کننده، تخفیف حجمی، فصلی، typo، ...) — فاز ۱/۲/۳
3. **Gap ۸**: Unit normalization (۱L vs 500ml → هشدار کاذب)
4. **Gap ۹**: Rule mode برای n≥2 (تجهیزات ۵M→۱۰M)
5. **Gap ۱۰**: Dedup + Time-span (۶ رکورد در ۲ دقیقه = trigger)
6. **Gap ۱۱**: الگوی فرم tra (wrapper setErr، خلاف HallsPage)
7. **Gap ۱۲** (بحرانی): AI-BOOT بدون لینک به این سند
8. **چک‌لیست v2** (۵ بخش: Profile, Unit+History, UI, پیام, AI Discovery, تست)
9. **Known Naming Issues** (chickWeight، tra.price_chick با ۳ اسم مختلف)

### تصمیم درباره پیاده‌سازی
- **Deferred:** فاز ۱ کد (unit + dedup + time-span + rule mode + form pattern) — جلسه جدا
- **Deferred:** فاز ۲ و ۳ سناریوها (فصلی، الگوی کاربر، وارداتی، ...)

### محدودیت‌های پذیرفته‌شده
- structuralBreak فعلی: ۶ رکورد بدون زمان، فقط صعودی، mean نه median
- ۱۱ از ۱۴ سناریو در فاز ۱/۲/۳ پیاده نشده

### مرجع
- commits: 796abdaf, ee3d24a7, 3392aa3c
- سند: `docs/modules/validation-intelligence-map.md`

*آخرین تصمیم: 1405/11/02*


## جلسه ۱۴۰۵/۱۱/۰۶ (۸.۸) — verify و تصحیح تناقضات مستند↔کد

**کشف:** verify عمیق فاز ۴b (۵ Batch کد + Docs) نشان داد کد شکسته است ولی سند می‌گوید ✅.

**تصحیح شد:**
- `CROSS-INTEGRATIONS.md`: `tra↔flk` از ✅ → 🚨 (کشف مسیر موازی `applyInvoiceFlocks` بدون `addEvent`)
- `TYPE-REGISTRY.md`: افزودن `FlockSexingEvent` + `FlockSexBalanceEvent` (موجود در کد، گم‌شده در سند)
- `HANDOFF-COMPLETE.md` (۸۱ بایت، خراب) → `_archive/HANDOFF-COMPLETE-BROKEN-1405-11-06.md`

**درس:** «کد = حقیقت»، سند فقط فرضیه. verify قبل از هر patch.

**باز:** فاز ۴b — سه باگ B1/B2/B3 در `applyInvoiceFlocks` + revoke logic در `updateInvoice`.

## جلسه 1405/11/08 (9 — C1 موتور محاسباتی)

آخرین commit: 6d5395b1

تصمیم 1 — موتور محاسباتی متمرکز در src/shr/calc/
دلیل: 3 نسخه FCR، 3 henDay، 2 mortality پراکنده → یک منبع حقیقت

تصمیم 2 — FCR استاندارد Aviagen
فرمول: feedConsumedKg / ((finalWeightKg - initialWeightKg) × aliveCount)
جایگزین فرمول قدیم helpers-audit.ts:246 که غلط بود

تصمیم 3 — Mortality مخرج اصلاح شد
قبل: deaths / aliveToday
بعد: deaths / (aliveToday + deathsToday)

تصمیم 4 — hen-housed اضافه شد (کنار hen-day)

تصمیم 5 — Uniformity = درصد در بازه ±10٪ میانگین

تصمیم 6 — Feed mode بر اساس سالن
scoop/bag/semi_auto: precision اگر remaining موجود
auto_sensor: همیشه precision
auto_chain: همیشه simple

تصمیم 7 — getThresholds از standards
hardcode فقط: cvPct=12، uniformityPct=70، waterFeedRatio={min:1.5,max:2.5}
weeklyPct تخمین: dailyPct × 5

تصمیم 8 — Economics با InputMovement محلی (L9)

تصمیم 9 — Revenue hybrid: invoices اولویت، prices fallback

تصمیم 10 — biological.ts بازنشسته، 5 تابع یتیم حذف

تصمیم 11 — Hy-Line/Lohmann production اضافه شد
Hy-Line W36: peak 97٪، eggsPerYear 420، eggWeight 63.3g
Lohmann Brown: peak 96٪، eggsPerYear 405، eggWeight 64.2g
منبع: Hy-Line 2023، Lohmann 2024

تصمیم 12 — Bovans Brown اضافه شد
peak 95٪، eggsPerYear 400، eggWeight 63g
منبع: Hendrix Genetics 2024

درس‌های این جلسه:
1. Heredoc __EOF__ در markdown شکسته می‌شود → PATCHEND
2. Termux /tmp ندارد → ~/.bird_bak/
3. Anchor باید یکتا باشد → content.count(anchor) == 1
4. grep pattern ناقص = نتیجه اشتباه
5. تست = مشخصات مطلوب، باگ production در standards کشف شد

آخرین تصمیم: 1405/11/08

## جلسه 1405/11/08 (9 ادامه — C2 + D کامل)

آخرین commit: d0f25873

### C2 — اتصال calc به dlg

تصمیم C2.1 — environment warnings در calc/environment.ts
دلیل: tempWarning/humidityWarning از dlg/store.ts به calc منتقل شدند
نتیجه: LogCard از calc استفاده می‌کند، دما/رطوبت استاندارد می‌شوند

تصمیم C2.2 — حذف 6 تابع مرده از dlg/store.ts
حذف شده: waterFeedRatio، mortalityRate، totalWater، lightWarning، tempWarning، humidityWarning
جایگزین: calculateWaterMetrics، calculateMortality، calculateFeedMetrics، calculateEnvironmentWarnings
دلیل: صفر مصرف‌کننده در UI، جایگزین در calc

### D — Validation dlg

تصمیم D1 — sumDeaths check مستقل از flockAlive
دلیل: اگر flockAlive=0 (بدون context)، چک skipped می‌شد (باگ)
باگ کشف شده توسط تست baseline

تصمیم D2 — hen-day با femaleCount
قبل: (eatingEggs+fertileEggs) / flockAlive * 100
بعد: (eatingEggs+fertileEggs) / femaleForRate * 100
که femaleForRate = femaleCount اگر >0، وگرنه flockAlive
دلیل: گله sexed (500 نر + 500 ماده): 450 تخم = 90% hen-day واقعی، نه 45%

تصمیم D3 — water balance soft warning (tolerance 20%)
دلیل: کاربر می‌تواند waterAmount دستی وارد کند که با waterFillCount×waterFillVolume فرق دارد
soft (fatal: false) → block نمی‌کند، فقط هشدار

تصمیم D4 — feedRemaining soft warning
آستانه: feedRemaining > feedAmount × 3 → warning
دلیل: باقی‌مانده دیروز ممکن است بالاتر باشد

### D4 — Intelligence standards-aware

تصمیم D4a — species_temp با standards
قبل: getTempIdeal (33°C ثابت برای همه)
بعد: getThresholds(ctx) (Ross 308 روز 21: 21-25°C)
کد تکراری حذف شد (دو بلوک species_temp یکسان)

تصمیم D4b — species/species_curve با getSpeciesExpected
فایل جدید: shr/calc/species-expected.ts (21 فیلد)
منابع: getThresholds، getStandardFor، getEffectiveGrowth، findInRange
دسته‌ها: FCR/ADG، humidity، feed nutrients، space، production، egg weight، weight curve

تصمیم D4d — گسترش context در FeedSection + EggsWeightSection
breedKey + ageDays + flockType در FieldHint
دلیل: بدون breedKey، getSpeciesExpected null برمی‌گرداند

### درس‌های session (27 commit، 185+ تست)
1. heredoc __EOF__ در markdown شکسته می‌شود → PATCHEND
2. Termux /tmp ندارد → ~/.bird_bak/
3. anchor line-based مقاوم‌تر از text-replace
4. 3 بار rollback در D3b/c به‌خاطر anchor طولانی
5. تست baseline، باگ‌های 9 ماهه کشف می‌کند (production Hy-Line/Lohmann)

آخرین تصمیم: 1405/11/08

## جلسه 1405/11/08 (9 ادامه — audit + C7 + C3)

آخرین commit: fc6b82f9

### یافته‌های audit (۹ فاز، ۳۴ فیلد)

- ۶ فیلد ۱۰۰٪ مرده: shift، lightHours، brokenTarget، otherTarget، feedConsumed، softCount
- ۷ فیلد نیمه‌کاره: ventilation، litter، behavior، distribution، sound، appearance، feedType
- ۹ فیلد کاملاً سالم: id، flockId، date، temperatureMin/Max، humidityMin/Max، feedDelivered، feedRemaining، waterAmount، weightSamples

### تصمیمات C7 (پاک‌سازی)

C7a — حذف shift:
دلیل: entryTime کافی است، shift صفر مصرف‌کننده
commit: 7bc2ae37

C7b — حذف brokenTarget/otherTarget:
دلیل: صفر UI، صفر cascade، صفر intelligence
commit: 0c28be12

C7d — birdAgeDays به LogCard:
حل: display در subtitle، صفر منطق جدید
commit: 2bc5c02c

EggDiscard — feature جدید:
دلیل: شکاف دور ریخت تخم (انباشت در calcStock)
commit: ae573922

### تصمیمات C3 (اتصال calc به dsh/flk)

C3a — hen-day با layingAliveCount:
قبل: (totalHealthy / (aliveCount * days)) * 100
بعد: (totalHealthy / (layingAliveCount * days)) * 100
layingAliveCount = layer/breeder فقط + femaleCount برای sexed
commit: ab24ff89

C3b — feedConsumed در LogCard + dsh:
label: «دان داده‌شده» (به‌جای «مصرفی»)
Row «دان مصرف‌شده» (اگر متفاوت)
waterFeedRatio با feedConsumed (fallback به feedDelivered)
commit: 917a029a

C3c — ۶ مصرف‌کننده باقی:
flk/useGroupKpi، rep/*، dsh/BenchmarkCard، filter
همه با fallback: l.feedConsumed || l.feedDelivered || 0
commit: ac330f92

C3d — ۴ alert جدید:
humidity (از stdEnv)، ventilation ('low')، litter ('wet'/'clumped')، behavior ('lethargic')
AlertCategory گسترش
commit: 7ed19857

C3e — ۴ alert جدید:
sound ('cough'/'sneeze')، distribution ('cornered')، water (نسبت)، feed (مصرف‌نشده)
commit: 4795ea0b

C3f — useGroupKpi bug fix:
قبل: totalDeaths = Math.max(0, totalInitial - totalCurrent) — تخمین غلط (فروش = تلفات)
بعد: sum of death/cull events
commit: 06b9a7b1

C3g-fix — rename در ۵ تست:
rename feedAmount → feedDelivered در analytics، flk-migrations-feed*، intelligence*
commit: fc6b82f9

### درس‌های جلسه ۹ (ادامه)

۷. بعد از rename بزرگ، npx vitest run کامل (۵ دقیقه) الزامی
۸. END_BLOCK بجای __EOF__ در markdown
۹. anchor line-based مقاوم‌تر از text-replace
۱۰. rename + cascade در یک جلسه (نه جدا)
۱۱. audit قبل از کد (۳۴ فیلد audit = ۶ فیلد مرده)
۱۲. هر feature باید consumer داشته باشد در همان commit
۱۳. توقف بعد از هر milestone

آخرین تصمیم: 1405/11/08


## جلسه 1405/11/08 (11 — D5 Atomic کامل)

### D5.5 — Refactor useDlgSave (atomic)

**B1b — flockId/date guard (88b8d6e0)**
قبل: کاربر می‌توانست flockId/date را در ویرایش عوض کند → orphan egg
بعد: guard + toast خطا

**B1c — activeWithdrawal cleanup (816f5fa8)**
قبل: اگر دارو حذف شود، activeWithdrawal orphan
بعد: else branch + guard `logId === current` (B4-Recalc در جلسه ۱۲)

**B2 — save() atomic (30735781)**
atomicTransaction + outbox + حذف catch {} خالی (L6) + throw در silent fails

**B3 — deleteLog atomic + bulk fix (5de7d548)**
- deleteLog: atomicTransaction + outbox + remove داخل atomic
- bulk delete (DlgTabPanel): قبلاً remove خالص (silent باگ) → حالا onDeleteLog atomic

### D5.4 کنسل شد

`_v`/`_txid` صفر consumer، صفر ارزش فوری. همراه با server در جلسه ۱۲.

### درس‌های جلسه ۱۱

1. atomic + outbox + storage infrastructure = ~۹۰۰ خط، ۳ commit (D5.1-D5.3)
2. consumer متصل (D5.5) = ~۲۰۰ خط تغییر، ۴ commit (B1b+B1c+B2+B3)
3. تست atomic = ۵ تست (B4)
4. باگ پنهان bulk delete (DlgTabPanel) — از قبل، بدون cascade
5. `AppEvents` typed — قبل از وصل به bus، چک کن
6. act() warning در تست — cosmetic، صفر ریسک

آخرین تصمیم: 1405/11/08
