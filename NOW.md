# NOW.md
> آخرین آپدیت: 1405/09/04
> وضعیت: پروژه در مرحله بلوغ — آرشیو سرد کامل، ابزارهای مشترک UI تثبیت‌شده

## HEAD
9d073069 — feat(tra): show EntityLink for selected warehouse stock item in ItemDetailsForm

## ⚠️ UNCOMMITTED (نیاز به تصمیم فوری)
- `src/mod/tra/components/InvoiceSmartSummary.tsx` — تغییرات ناتمام
- `NOW.md` — همین فایل (پس از کامیت)

## 🎯 لایه‌های کامل‌شده

### لایه ۱ — هسته ذخیره‌سازی (IndexedDB) ✅
- ۱۰ استور منتقل شد: `dlg, flk, whs, tra, egg, brd, hal, ctc, fed, inc`
- `set` عمداً در localStorage (جلوگیری از فلیکر تم)
- `health.ts` — navigator.storage.persist + estimate
- `hybridStorage.ts` — مهاجرت تنبل
- `rawStore.ts` (جدید) — لایه دسترسی خام (IDB + LS) برای پشتیبان‌گیری
- دروازه لودینگ ضد فلیکر در `App.tsx` (تایمر ۲۰۰ms + شبکه ایمنی ۵s)

### لایه ۲ — مدیریت ظرفیت ✅
- بررسی خودکار ۸۰٪ سهمیه
- هشدار toast به کاربر

### لایه ۳ — آرشیو سرد (Cold Storage) ✅ ۹۵٪
- `historyArchive.ts` (40KB) — DB `pm-archive` نسخه ۲
- استورها: `logs, summaries, dlg_logs, tra_invoices, flk_closed, whs_moves, inc_batches`
- سیاست دوگانه: `maxAgeMonths=6` **یا** `maxHotLogs=800` + هیسترزیس
- **۴ سطح آرشیو:**
  - `flock-closed` — فوری هنگام بسته شدن گله
  - `count-threshold` — تعداد بیش از حد
  - `age` — تاریخ
  - `ancient` — تور اطمینان
- اتصال به همه ماژول‌ها: `dlg.store.archiveFlockLogs`, `flk.archive`, `whs`, `tra`, `inc`
- بازگردانی اتمیک (`purgeArchiveIds`)
- کامیت‌های کلیدی: `a078403b`, `aedfad78`, `c09dc3f2`, `3ef1881d`, `61a99e78`, `0675ab44`, `bc7035ab`, `d5026968`, `4c92c76d`, `6f5b7405`
- تست پذیرش: `5f76c9e5` — hot+archive invariant
- **باقی‌مانده:** اجرای خودکار `archiveOldLogs` در `main.tsx` (سطح ۲ خودکار نیست)

### لایه ۴ — پشتیبان‌گیری از آرشیو ✅ ۱۰۰٪
- `036f468b` — backup از pm-archive
- `exportAll` شامل `data['__archive_logs']`
- `importAll` بازگردانی آرشیو
- `getStats` آمار آرشیو (تخمینی)
- `clearAllData` پاک‌سازی آرشیو

### لایه ۵ — موتور بازیابی ✅ ۱۰۰٪
- `restoreManyFromArchive` + `purgeArchiveIds`
- atomic cascade restore
- تست: `5f76c9e5`

### لایه ۶ — تاریخچه مشترک ✅ ۱۰۰٪
- `src/shr/components/history/HistoryModalShell.tsx`
- مهاجرت ۴ کامپوننت: `FlockHistoryModal`, `DlgHistoryModal`, `SexingHistoryModal`, `DeferHistoryModal`

## ✅ کارهای اخیر (بعد از آرشیو)

### `tra` (معاملات) — بازطراحی گسترده
- فرم فاکتور: پیش‌نمایش مجموع، تبدیل واحد، مبلغ، دسته‌بندی
- حالت ایجاد کالای جدید در انبار (`5cebd99b`)
- فیلترها، placeholderها، ریست فیلدها
- PickFlockModal بازنویسی با `SelectSheetShell` (`25e02c19`)
- PickInvoiceModal, PickHatchModal (unified)
- EntityLink در `ItemDetailsForm` (`9d073069`)

### `ui` (رابط مشترک) — ارتقای بزرگ
- **`EntityLink`** — کامپوننت یکپارچه لینک بین موجودیت‌ها
  - طرح chip با underline نقطه‌چین
  - حذف آیکون اضافی
  - هماهنگ با فونت و وزن متن اطراف
- **Focus Spotlight** — هاله تمرکز روی کارت هدف (slate-blue)
  - اسکرول هوشمند (فقط اگر کارت خارج از دید باشد)
- **`SelectSheetShell`** — پوسته مشترک برای همه انتخاب‌گرها
  - دکمه جستجو در هدر
  - پاک‌سازی خودکار query هنگام بستن
  - هماهنگی بین PickFlockModal, PickInvoiceModal, PickHatchModal
- کامیت‌های کلیدی: `19bbc698`, `2352acb9`, `62d3e4c3`, `0b1051da`, `9958205b`, `ef6feeea`, `7c3a049b`, `fa2242f8`, `b0391601`

### `dialog` — بهبود DialogHost
- حذف آیکون/نقطه/رقم فارسی از ابتدای متن (`7c972d91`)
- حفظ بج آیکون وضعیت بالای مودال (`11bc6639`)

### صفحه آرشیو و مقایسه گله
- `src/mod/arc/ArchivePage.tsx` (47KB ≈ ۱۲۰۰ خط) — ۳ تب: `flocks / logs / stores`
- `src/mod/arc/FlockComparisonPanel.tsx` (38KB ≈ ۱۰۰۰ خط)
- `src/mod/arc/ComparisonTable.tsx` (15KB ≈ ۴۰۰ خط) ✅
- `src/mod/arc/FlockPickerModal.tsx` (9.6KB ≈ ۲۵۰ خط) ✅
- `src/mod/arc/comparisonHelpers.ts` (5.3KB ≈ ۱۳۰ خط) ✅
- کامیت‌های کلیدی: `70778394`, `68ca2094`, `6ed57dd4`, `a36ebf28`, `dfd7cb5f`, `51c91d27`, `77622057`
- فیلتر فعال/آرشیو + جستجو + گروه‌بندی سالانه
- ذخیره مقایسه‌ها (presets)
- خروجی CSV + PDF
- HelpIcon centered popover

## 🚧 کارهای باقی‌مانده

### 🔴 فوری
1. **`InvoiceSmartSummary.tsx` uncommitted** — نیاز به کامیت یا بازگردانی
2. **اجرای خودکار `archiveOldLogs`** در `main.tsx` (یک بار در روز)
3. **آپدیت `DATA-ARCHITECTURE.md`** (پس از این فایل)

### 🟠 نقض قانون ۳۲ (فایل‌های بالای ۵۰۰ خط که مستقیم به کار جاری مربوط‌اند)
- `src/mod/arc/ArchivePage.tsx` — ~۱۲۰۰ خط
- `src/mod/arc/FlockComparisonPanel.tsx` — ~۱۰۰۰ خط
- `src/cor/storage/historyArchive.ts` — ~۱۰۰۰ خط

### 🟡 لایه‌های باقی‌مانده نقشه راه
- لایه ۷ — تب مدیریت داده در تنظیمات (آمار آرشیو، آستانه، آرشیو دستی)
- لایه ۸ — حذف نرم یکدست (`HiddenOptionsTab` ↔ `pm-archive`)
- لایه ۹ — Virtualization + بهینه‌سازی (applyCorrections memoize)
- لایه ۱۰ — آمادگی سرور + `userId`/`userName` در رویدادها

### 🔵 ایده‌های مطرح‌شده که پیاده نشده
- `FlockArchiveSummary` (خلاصه تجمیعی برای مقایسه سریع)
- `fact_daily_kpi` (Star Schema برای تحلیل چندگانه)
- صفحه مقایسه گله‌ها با ۵ تب (انتخاب، KPI، نمودار overlay، جدول، تحلیل)
- ورودی‌های مالی جدید (هزینه کارگر، آب، برق، گاز، قیمت هر تخم/مرغ)

## 📝 نکات کلیدی AI بعدی

### الگوهای موفق (نگه‌داری شوند)
- **الگوی استور جدید:** `dlg/store.ts` (import + isLoading + partialize + onRehydrateStorage)
- **`set` را به IndexedDB نبر** — فلیکر تم
- **دروازه لودینگ:** `App.tsx` با `||` بین همه `isLoading`
- **آرشیو سرد:** `historyArchive.ts` — DB کاملاً مستقل از `pm-state`
- **سیاست آرشیو:** OR بین `maxAgeMonths` و `maxHotLogs` + هیسترزیس
- **`EntityLink`** — همیشه برای لینک به موجودیت‌ها (نه chipهای دستی)
- **`SelectSheetShell`** — برای همه انتخاب‌گرها (نه مودال‌های جداگانه)
- **Focus Spotlight** — کلاس مشترک برای هایلایت کارت هدف
- **`rawStore.ts`** — لایه دسترسی خام برای پشتیبان‌گیری (IDB + LS)

### تست‌های از پیش موجود که fail می‌شوند (بی‌ربط به ما)
- `src/test/flk-audit-display.test.ts` (خط ۲۹۷ — FCR)
- `src/test/whs-atomic-verify.test.ts` (خط ۱۰۵ — structural)

### معیار پذیرش آرشیو (تأیید شده)
- `count(hot) + count(archive) == count(total)` — تست `5f76c9e5`

### مستندات مرتبط
- `docs/DATA-ARCHITECTURE.md` — نقشه راه ۱۰ لایه (در حال آپدیت)
- `docs/WORK-4-GAP.md` — تحلیل شکاف pm-dlg رکورد-محور

## 🗺️ نقشه راه کلی
- [x] لایه ۱: هسته ذخیره‌سازی
- [x] لایه ۲: مدیریت ظرفیت
- [~] لایه ۳: آرشیو سرد (۹۵٪ — اجرای خودکار سطح ۲ باقی)
- [x] لایه ۴: موتور پشتیبان
- [x] لایه ۵: موتور بازیابی
- [x] لایه ۶: تاریخچه مشترک
- [ ] لایه ۷: مدیریت داده در تنظیمات
- [ ] لایه ۸: حذف نرم یکدست
- [ ] لایه ۹: Virtualization
- [ ] لایه ۱۰: آمادگی سرور
