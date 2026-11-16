# DATA-ARCHITECTURE.md — معماری داده و تاریخچه (Data & History Architecture)

> **وضعیت:** در حال پیاده‌سازی (فاز ۱)
> **استانداردها:** ALCOA+ / 21 CFR Part 11 / W3C Storage API / PWA Best Practices
> **هدف:** یکپارچه‌سازی ذخیره‌سازی، تاریخچه (Audit Trail)، آرشیو سرد و آمادگی برای حالت سرور/چندکاربره.

## 🗺️ نقشه راه ۱۰ لایه‌ای (10-Layer Plan)

### لایه ۱: هسته ذخیره‌سازی (Storage Core) — [در حال انجام]
- [ ] ارتقای `StorageAdapter` در `src/cor/storage` برای پشتیبانی از `IndexedDB`.
- [ ] مکانیزم مهاجرت (Migration) از `localStorage` به `IndexedDB` برای همه استورها.
- [ ] اتصال `navigator.storage.persist` برای جلوگیری از پاک‌شدن خودکار.

### لایه ۲: مدیریت ظرفیت (Storage Health) — [در حال انجام]
- [ ] ساخت `health.ts` برای بررسی مداوم فضای مصرفی.
- [ ] نمایش بنر هشدار در ۸۰٪ ظرفیت.
- [ ] دکمه «ارتقا به حالت حرفه‌ای».

### لایه ۳: آرشیو سرد (Cold Storage) — [در انتظار]
- [ ] ساخت `historyArchive.ts` با استفاده از `idb`.
- [ ] انتقال داده‌های قدیمی‌تر از ۶ ماه (فقط رویدادهای عادی).
- [ ] نگهداری دائمی رویدادهای «اصلاحات» و «تلفات».

### لایه ۴: موتور پشتیبان (Backup Engine) — [در انتظار]
- [ ] ارتقای `backup.ts` برای خواندن/نوشتن از `StorageAdapter`.
- [ ] پشتیبانی از پشتیبان‌گیری تدریجی (Chunked) برای فایل‌های بالای ۵۰ مگابایت.
- [ ] چک‌سام دقیق‌تر.

### لایه ۵: موتور بازیابی (Restore Engine) — [در انتظار]
- [ ] ارتقای `RestoreModal.tsx` برای ادغام هوشمند رکوردها.
- [ ] افزودن حالت «بازیابی انتخابی».

### لایه ۶: تاریخچه و Audit Trail (History) — [در انتظار]
- [ ] ساخت `HistoryModalShell` در `src/shr/components/history`.
- [ ] مهاجرت ۴ کامپوننت تاریخچه به این پوسته.
- [ ] افزودن `userId` و `userName`.

### لایه ۷: مدیریت داده در تنظیمات (Settings Data Management) — [در انتظار]
- [ ] تب جدید «مدیریت داده‌ها».
- [ ] نمایش آمار حجم.
- [ ] دکمه‌های «آرشیو دستی»، «پاک‌سازی»، «بازیابی».

### لایه ۸: حذف نرم و بازگردانی (Soft Delete) — [در انتظار]
- [ ] یکدست‌سازی `HiddenOptionsTab` با `historyArchive`.
- [ ] منطق بازگردانی از `IndexedDB`.

### لایه ۹: عملکرد و مقیاس‌پذیری (Performance) — [در انتظار]
- [ ] صفحه‌بندی (Pagination).
- [ ] Virtualization برای لیست‌های بالای ۱۰۰ ردیف.
- [ ] بهینه‌سازی `applyCorrections`.

### لایه ۱۰: مستندسازی و آمادگی سرور (Documentation & Server-Ready) — [در حال انجام]
- [x] ساخت این فایل (`DATA-ARCHITECTURE.md`).
- [ ] ساخت `ServerStorageAdapter` (اسکلت).
- [ ] آپدیت نهایی `NOW.md`.

## 🧠 تصمیمات کلیدی (Key Decisions)
۱. **IndexedDB به جای localStorage**: به دلیل سقف ۵ مگابایتی و همگام بودن.
۲. **Event Sourcing / Append-only**: تاریخچه هرگز حذف نمی‌شود، فقط رویداد جدید اضافه می‌شود.
۳. **StorageAdapter**: لایه واسط برای سوییچ بین Local و Server در آینده.
