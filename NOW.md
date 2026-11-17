# NOW.md
> آخرین آپدیت: 1405/11/17
> وضعیت: لایه ۱، ۲، ۶ کامل — در حال انجام لایه ۳ (آرشیو سرد)

## HEAD
f5a8893f — refactor(history): مهاجرت DlgHistoryModal به HistoryModalShell

## ✅ لایه ۱ و ۲ — کامل شد (۵۰٪ نقشه راه)
### هسته ذخیره‌سازی (Storage Core)
- `src/cor/storage/idbStorage.ts` — موتور IndexedDB برای Zustand
- `src/cor/storage/hybridStorage.ts` — مهاجرت تنبل (اول IndexedDB، بعد localStorage)
- `src/cor/storage/migrate.ts` — اسکریپت مهاجرت یک‌باره
- `src/cor/storage/health.ts` — `navigator.storage.persist` + `estimate`
- `src/cor/storage/index.ts` — StorageAdapter (قبلاً موجود بود)

### دروازه لودینگ (Loading Gate)
- `App.tsx`: `LoadingScreen` با تایمر ۲۰۰ms (ضد فلیکر) + شبکه ایمنی ۵ ثانیه‌ای
- `partialize`: `isLoading` ذخیره نمی‌شود (همیشه با `true` شروع می‌شود)
- `onRehydrateStorage`: در هر استور، پس از لود داده‌ها `isLoading` را `false` می‌کند

### استورهای متصل‌شده به IndexedDB (۱۰ از ۱۰):
- `dlg` (ثبت روزانه)
- `flk` (گله)
- `whs` (انبار)
- `tra` (معاملات)
- `egg` (تخم)
- `brd` (پرنده/نژاد)
- `hal` (سالن)
- `ctc` (مخاطبین)
- `fed` (جیره)
- `inc` (جوجه‌کشی)

### استورهای عمداً در localStorage (طبق W3C):
- `set` (تنظیمات) — برای جلوگیری از فلیکر تم (اسکریپت `<head>` در `index.html`)


### لایه ۶: تاریخچه مشترک (History Shell) — ✅ کامل شد
- `src/shr/components/history/HistoryModalShell.tsx` — پوسته مشترک (Modal + footer + CSV + بستن)
- مهاجرت ۴ کامپوننت:
  - `FlockHistoryModal` (گله) ✅
  - `DlgHistoryModal` (ثبت روزانه) ✅
  - `SexingHistoryModal` (تفکیک جنسیت) ✅
  - `DeferHistoryModal` (تعویق فاکتورها) ✅

## 🎯 کار بعدی (اولویت)
### لایه ۳: آرشیو سرد (Cold Storage) — در حال انجام
- [ ] ساخت `src/cor/storage/historyArchive.ts` با `idb`
- [ ] انتقال داده‌های قدیمی‌تر از ۶ ماه (فقط رویدادهای عادی)
- [ ] نگهداری دائمی اصلاحات و تلفات (21 CFR Part 11)
- [ ] UI در تنظیمات برای اجرای دستی آرشیو

📌 **جزئیات کامل ۱۰ لایه:** `docs/DATA-ARCHITECTURE.md`

## 📝 نکات کلیدی AI بعدی
- **مستند مرجع:** `docs/DATA-ARCHITECTURE.md` را بخوان.
- **الگوی موفق برای استور جدید:** دقیقاً همان الگوی `dlg/store.ts` (چهار تغییر: import, isLoading در interface, isLoading:true در initial, storage+partialize+onRehydrateStorage).
- **`set` را به IndexedDB نبر** — فلیکر تم را ایجاد می‌کند.
- **دروازه لودینگ:** `App.tsx` از `||` بین همه `isLoading`ها استفاده می‌کند. اگر استور جدید اضافه شد، `App.tsx` را هم آپدیت کن.
- **تست‌های از پیش موجود که fail می‌شوند (بی‌ربط به ما):**
  - `src/test/flk-audit-display.test.ts` (خط ۲۹۷ — FCR)
  - `src/test/whs-atomic-verify.test.ts` (خط ۱۰۵ — structural)

## 🗺️ نقشه راه کلی
- [x] لایه ۱: هسته ذخیره‌سازی
- [x] لایه ۲: مدیریت ظرفیت
- [ ] لایه ۳: آرشیو سرد
- [ ] لایه ۴: موتور پشتیبان
- [ ] لایه ۵: موتور بازیابی
- [x] لایه ۶: تاریخچه مشترک
- [ ] لایه ۷: مدیریت داده در تنظیمات
- [ ] لایه ۸: حذف نرم یکدست
- [ ] لایه ۹: Virtualization
- [ ] لایه ۱۰: آمادگی سرور
