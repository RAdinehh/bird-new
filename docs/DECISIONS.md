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
