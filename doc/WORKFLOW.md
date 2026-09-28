# WORKFLOW.md — قوانین کار

نسخه ۱.۰

## قوانین طلایی با AI
۱. قبل از هر تغییر، توضیح
۲. یک فایل در هر مرحله
۳. کد تکه‌تکه
۴. تغییر ۳+ فایل → توقف
۵. پیش‌نمایش قبل از React
۶. بازنویسی کامل ممنوع

## اصل تأیید
مرحله ۱: توضیح
مرحله ۲: پیش‌نمایش
مرحله ۳: انتظار تأیید
مرحله ۴: اعمال
مرحله ۵: گزارش

هیچ تغییر بدون تأیید. هیچ کد بدون پیش‌نمایش.

## گردش کار
۱. کاربر وضعیت
۲. AI توضیح
۳. تأیید
۴. کد تکه‌ای
۵. پیست + ذخیره
۶. تست
۷. PROJECT-LOG

## Snapshot
cp -r src src-backup-$(date +%Y%m%d-%H%M)
بازیابی: rm -rf src && mv src-backup-xxx src

## مدیریت چت
هر چت: یک کار
چت جدید: اول PROJECT-LOG پیست
بعد درخواست

## محیط
Termux + nano + موبایل
پورت 3000

## تصمیمات قفل
TypeScript strict: بله
Form: React Hook Form + Zod
State: Zustand + persist
ID: UUID v4
Backup: نسخه‌دار
MVP: ۸ ماژول

## MVP
set, brd, hal, flk, inc, dlg, whs, sal

## فاز ۲
egg, fed, med, tmd, dea, cus, wrk, rep, alt, arc, dsh
