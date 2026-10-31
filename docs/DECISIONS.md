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
