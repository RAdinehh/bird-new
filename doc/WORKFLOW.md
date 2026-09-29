# WORKFLOW.md — قوانین کار

نسخه ۱.۱ | آخرین به‌روز: ۱۴۰۵/۰۷/۰۷

## قوانین طلایی با AI

۱. قبل از هر تغییر، توضیح
۲. یک فایل در هر مرحله
۳. کد تکه‌تکه
۴. تغییر ۳+ فایل → توقف
۵. پیش‌نمایش قبل از React
۶. بازنویسی کامل ممنوع (مگر با تأیید)

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

- TypeScript strict: بله
- State: Zustand + persist
- ID: UUID v4
- Backup: نسخه‌دار
- داده: localStorage + IndexedDB

---

## فازها

### ✅ فاز ۱ (MVP) — کامل
set, brd, hal, ctc, flk, inc, egg, dlg, tra, whs, fed, rep, alt, dsh, arc

### ✅ فاز ۲ — تکمیل‌شده
cal (تقویم), doc (اسناد)

### 🎯 ادغام‌شده در فاز ۳ (v0.7.0)

این ماژول‌های برنامه‌ریزی‌شده ادغام شدند:

| Placeholder | ادغام در | دلیل |
|---|---|---|
| cus | ctc (تب مشتری) | کاربر چندنقشه |
| wrk | ctc (تب کارگر) | مخاطبین یکپارچه |
| med | whs (دسته کالا) | انبار یکپارچه |
| tmd | ItemDetailsForm | جریان بهتر |
| dea | tra (تب خاص) | کاربر یک‌جا |
| sal | ⏳ تصمیم آینده | — |

### 🟡 فاز ۴ (آینده)
- sal (حقوق کارگر) — اگه لازم شد
- تحلیل پیشرفته (Pareto، Benchmark)
- اعلان‌های بیرونی

---

## نام‌گذاری

- ماژول: ۳ حرف کوچک (set, brd, tra)
- Store: use{Module} — مثل useTra
- کامپوننت: PascalCase
- فایل: PascalCase.tsx
- تابع: camelCase

---

## الگوی اسکریپت پایتون

cd ~/Bird-new && python3 << 'PYEOF'
# کد اینجا
PYEOF

## الگوی جایگزین امن

old = "متن قدیمی"
new = "متن جدید"
s = open('file.tsx', encoding='utf-8').read()
if old in s:
    s = s.replace(old, new, 1)
    open('file.tsx', 'w', encoding='utf-8').write(s)
    print('✅ اعمال شد')
else:
    print('⚠️ پیدا نشد')

## الگوی تست

بعد از هر تغییر:
npm run build 2>&1 | tail -5

## الگوی commit

git add . && git commit -m "نوع(ماژول): توضیح"

انواع: feat, fix, refactor, style, docs, chore
