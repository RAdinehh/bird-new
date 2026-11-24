# DATA-ARCHITECTURE.md — معماری داده و تاریخچه (Data & History Architecture)

> **آخرین آپدیت:** 1405/09/04
> **وضعیت:** لایه‌های ۱، ۲، ۴، ۵، ۶ کامل — لایه ۳ در ۹۵٪ — ۷ تا ۱۰ باقی
> **استانداردها:** ALCOA+ / 21 CFR Part 11 / W3C Storage API / PWA Best Practices
> **هدف:** یکپارچه‌سازی ذخیره‌سازی، تاریخچه (Audit Trail)، آرشیو سرد و آمادگی برای حالت سرور/چندکاربره.

## 🗺️ نقشه راه ۱۰ لایه‌ای (10-Layer Plan)

### لایه ۱: هسته ذخیره‌سازی (Storage Core) — [✅ کامل شد]
- [x] `idbStorage.ts` — موتور IndexedDB برای Zustand.
- [x] `hybridStorage.ts` — مهاجرت تنبل (اول IndexedDB، بعد localStorage).
- [x] `migrate.ts` — اسکریپت مهاجرت یک‌باره.
- [x] `rawStore.ts` — لایه دسترسی خام (IDB + LS) برای پشتیبان‌گیری.
- [x] اتصال ۱۰ استور (`dlg`, `flk`, `whs`, `tra`, `egg`, `brd`, `hal`, `ctc`, `fed`, `inc`) به IndexedDB.
- [x] `set` عمداً در localStorage (جلوگیری از فلیکر تم — اسکریپت `<head>` در `index.html`).

### لایه ۲: مدیریت ظرفیت (Storage Health) — [✅ کامل شد]
- [x] `health.ts` — `navigator.storage.persist` + `estimate`.
- [x] هشدار در ۸۰٪ ظرفیت (toast).
- [x] دروازه لودینگ (`LoadingScreen`) با تایمر ۲۰۰ms + شبکه ایمنی ۵ ثانیه.

### لایه ۳: آرشیو سرد (Cold Storage) — [~۹۵٪ کامل]
- [x] `historyArchive.ts` (~40KB) — DB `pm-archive` نسخه ۲.
- [x] استورها: `logs`, `summaries`, `dlg_logs`, `tra_invoices`, `flk_closed`, `whs_moves`, `inc_batches`.
- [x] سیاست دوگانه: `maxAgeMonths=6` **یا** `maxHotLogs=800` + هیسترزیس.
- [x] چهار سطح آرشیو: `flock-closed`, `count-threshold`, `age`, `ancient`.
- [x] اتصال به همه ماژول‌ها: `dlg.archiveFlockLogs`, `flk.archive`, `whs`, `tra`, `inc`.
- [x] بازگردانی اتمیک (`restoreManyFromArchive` + `purgeArchiveIds`).
- [x] تست پذیرش: `count(hot) + count(archive) == count(total)` (کامیت `5f76c9e5`).
- [ ] **اجرای خودکار `archiveOldLogs`** در `main.tsx` (یک بار در روز) — تنها کار باقی‌مانده.
- [ ] **`FlockArchiveSummary`** — خلاصه تجمیعی برای مقایسه سریع (در IDEA مطرح شده).
- [ ] **`fact_daily_kpi`** (Star Schema) — تحلیل چندگانه (در IDEA مطرح شده).

**کامیت‌های کلیدی:** `a078403b`, `aedfad78`, `c09dc3f2`, `3ef1881d`, `61a99e78`, `0675ab44`, `bc7035ab`, `d5026968`, `4c92c76d`, `6f5b7405`

### لایه ۴: موتور پشتیبان (Backup Engine) — [✅ کامل شد]
- [x] `backup.ts` شامل `data['__archive_logs']` (pm-archive).
- [x] `exportAll` آرشیو را در بر می‌گیرد.
- [x] `importAll` بازگردانی آرشیو (replace + merge).
- [x] `getStats` آمار آرشیو (تخمینی).
- [x] `clearAllData` پاک‌سازی آرشیو.
- [x] `rawStore.ts` برای دسترسی یکپارچه (IDB + LS).

**کامیت کلیدی:** `036f468b`

### لایه ۵: موتور بازیابی (Restore Engine) — [✅ کامل شد]
- [x] `restoreManyFromArchive` — بازگردانی دسته‌ای.
- [x] `purgeArchiveIds` — حذف پس از بازگردانی (انتقال، نه کپی).
- [x] Atomic cascade restore — بازگردانی با undo.
- [x] حالت `merge` و `replace` در `importAll`.

**کامیت‌های کلیدی:** `c09dc3f2`, `aedfad78`

### لایه ۶: تاریخچه و Audit Trail (History) — [✅ کامل شد]
- [x] `src/shr/components/history/HistoryModalShell.tsx` — پوسته مشترک.
- [x] مهاجرت ۴ کامپوننت: `FlockHistoryModal`, `DlgHistoryModal`, `SexingHistoryModal`, `DeferHistoryModal`.
- [ ] افزودن `userId` و `userName` — به لایه ۱۰ موکول شد.

### لایه ۷: مدیریت داده در تنظیمات (Settings Data Management) — [در انتظار]
- [ ] تب جدید «مدیریت داده‌ها» (نمایش آمار).
- [ ] دکمه «آرشیو دستی».
- [ ] تنظیم آستانه آرشیو (maxHotLogs, maxAgeMonths).
- [ ] لیست گله‌های آرشیو + دکمه «بازگردانی».

### لایه ۸: حذف نرم و بازگردانی (Soft Delete) — [در انتظار]
- [ ] یکدست‌سازی `HiddenOptionsTab` با `historyArchive`.
- [ ] منطق بازگردانی از `IndexedDB` (soft delete → cold archive).

### لایه ۹: عملکرد و مقیاس‌پذیری (Performance) — [در انتظار]
- [ ] Virtualization برای لیست‌های بالای ۱۰۰ ردیف.
- [ ] Memoize `applyCorrections` (WeakMap).
- [ ] صفحه‌بندی در `DailyLogsPage` (بر اساس ماه).
- [ ] شکستن فایل‌های بالای ۵۰۰ خط (قانون ۳۲).

### لایه ۱۰: مستندسازی و آمادگی سرور (Documentation & Server-Ready) — [در حال انجام]
- [x] `DATA-ARCHITECTURE.md` + `NOW.md` (آپدیت 1405/09/04).
- [x] `docs/WORK-4-GAP.md` — تحلیل شکاف pm-dlg رکورد-محور.
- [ ] `userId` و `userName` در `DlgEvent` و `FlockEvent`.
- [ ] `ServerStorageAdapter` (اسکلت، بدون پیاده‌سازی).

---

## 🎨 زیرساخت‌های مشترک UI (خارج از ۱۰ لایه — اما حیاتی)

این‌ها در حین کار روی آرشیو و مقایسه ساخته شدند و به بلوغ رسیدند:

### `EntityLink` — لینک یکپارچه بین موجودیت‌ها
- طرح chip با underline نقطه‌چین
- حذف آیکون اضافی (هماهنگ با متن اطراف)
- هم‌فونت و هم‌وزن با متن اطراف
- اسکرول هوشمند (فقط اگر کارت هدف خارج از دید باشد)
- Focus Spotlight (slate-blue)
- **کامیت‌ها:** `19bbc698`, `2352acb9`, `62d3e4c3`, `0b1051da`, `9958205b`, `ef6feeea`, `7c3a049b`, `fa2242f8`, `b0391601`

### `SelectSheetShell` — پوسته مشترک انتخاب‌گرها
- دکمه جستجو در هدر
- پاک‌سازی خودکار query هنگام بستن
- هماهنگی بین `PickFlockModal`, `PickInvoiceModal`, `PickHatchModal`
- **کامیت‌ها:** `25e02c19`, `fc199137`, `57fe661d`, `ff4e3cfd`

### `ActionPresets` — دیکشنری مشترک دکمه‌های کارت
- `src/shr/constants/cardActions.ts`
- ۶ preset: EDIT, CORRECT, HISTORY, ARCHIVE, RESTORE, DELETE
- اولویت‌بندی (priority) برای مرتب‌سازی خودکار
- گروه‌بندی (هم‌خانواده‌ها: تفکیک جنسیت + سابقه تفکیک)

### `CardActions` — مرتب‌سازی هوشمند
- `getLayout` — چیدمان ۱ تا ۶ دکمه (۳+۱، ۳+۲، ۳+۳)
- `priority` — اولویت‌بندی خودکار
- `group` — گروه‌بندی هم‌خانواده‌ها
- دکمه «بیشتر» برای بالای ۶

---

## 🎨 صفحه آرشیو و مقایسه گله (Arc)

### ساختار فعلی
- `src/mod/arc/ArchivePage.tsx` (~47KB ≈ ۱۲۰۰ خط — نقض ۳۲)
- `src/mod/arc/FlockComparisonPanel.tsx` (~38KB ≈ ۱۰۰۰ خط — نقض ۳۲)
- `src/mod/arc/ComparisonTable.tsx` (~15KB ≈ ۴۰۰ خط) ✅
- `src/mod/arc/FlockPickerModal.tsx` (~9.6KB ≈ ۲۵۰ خط) ✅
- `src/mod/arc/comparisonHelpers.ts` (~5.3KB ≈ ۱۳۰ خط) ✅

### قابلیت‌ها
- ۳ تب: `flocks` / `logs` / `stores`
- فیلتر فعال/آرشیو + جستجو + گروه‌بندی سالانه
- ذخیره مقایسه‌ها (presets)
- خروجی CSV + PDF
- HelpIcon centered popover
- بنر تست seed (باید پشت `import.meta.env.DEV` برود)

### کامیت‌های کلیدی
`70778394`, `68ca2094`, `6ed57dd4`, `a36ebf28`, `dfd7cb5f`, `51c91d27`, `77622057`

---

## 🧠 تصمیمات کلیدی (Key Decisions)

### ۱. IndexedDB به جای localStorage
- **دلیل:** سقف ۵ مگابایتی localStorage و همگام بودن (بلاک UI).
- **مرجع:** W3C Storage Standard، web.dev/idb.

### ۲. `set` در localStorage ماند
- **دلیل:** اسکریپت `<head>` در `index.html` برای جلوگیری از فلیکر تم، همگام نیاز دارد.
- **مرجع:** Google web.dev — «Pre-Hydration Theme Script».

### ۳. دکترین آرشیو سه‌سطحی (Hybrid)
- **سطح ۱ (اولویت اول):** گله بسته → فوری آرشیو.
- **سطح ۲:** گله فعال با بیش از `maxHotLogs` → قدیمی‌ترین‌ها.
- **سطح ۳:** لاگ قدیمی‌تر از `maxAgeMonths` → آرشیو.
- **منبع:** SAP Fiori، Salesforce، Elastic ILM، S3 Lifecycle.

### ۴. سیاست دوگانه با هیسترزیس
- **OR بین `maxAgeMonths=6` و `maxHotLogs=800`.**
- **هیسترزیس:** پس از برش، تا `trimTo=600` پایین می‌آید (جلوگیری از thrashing).
- **منبع:** Elastic ILM.

### ۵. Event Sourcing برای Correction
- **لاگ اصلی immutable.**
- **revoke = رویداد جبرانی (revoked:true).**
- **Audit Trail برای هر فیلد (DlgEvent).**
- **مرجع:** 21 CFR Part 11 §11.10(e)، ALCOA+.

### ۶. HistoryModalShell مشترک
- **یکسان‌سازی UI + کاهش کد تکراری.**
- **مرجع:** Headless Compound Components (Material, Carbon).

---

## ⚠️ نقض‌های قانون ۳۲ (فایل‌های بالای ۵۰۰ خط)

| فایل | خطوط | وضعیت |
|---|---|---|
| `src/mod/arc/ArchivePage.tsx` | ~۱۲۰۰ | 🔴 نیاز فوری |
| `src/mod/arc/FlockComparisonPanel.tsx` | ~۱۰۰۰ | 🔴 نیاز فوری |
| `src/mod/tra/DealsPage.tsx` | ۱۵۴۵ | 🟠 از قبل |
| `src/cor/storage/historyArchive.ts` | ~۱۰۰۰ | 🟡 متوسط |
| `src/mod/whs/store.ts` | ~۷۰۰ | 🟠 از قبل |
| `src/mod/dlg/hooks/useDlgSave.ts` | ۷۷۸ | 🟠 از قبل |

---

## 🚨 UNCOMMITTED (نیاز به تصمیم فوری)
- `src/mod/tra/components/InvoiceSmartSummary.tsx` — تغییرات ناتمام.

---

## 📋 معیار پذیرش آرشیو (تأیید شده)
- `count(hot) + count(archive) == count(total)` — تست `5f76c9e5`.

## 📋 تست‌های از پیش موجود که fail می‌شوند (بی‌ربط به ما)
- `src/test/flk-audit-display.test.ts` (خط ۲۹۷ — FCR)
- `src/test/whs-atomic-verify.test.ts` (خط ۱۰۵ — structural)
