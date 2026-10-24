# AGENTS.md — پروتکل اجباری AI (نسخه ۱)

## 🔴 هر پیام کاربر — ۴ گام اجباری

### گام ۱: بخوان
- PROGRESS.md (وضعیت لحظه‌ای)
- CONCEPTS.md (۲۰۵ مفهوم)

### گام ۲: تعیین CURRENT
- اگه PROGRESS.CURRENT خالی → اولین PENDING
- اگه نیمه‌کاره → از فاز فعلی ادامه بده

### گام ۳: اجرا (چرخه)
verify (grep/sed) → implement (≤۵ فایل) → test → تایید کاربر

### گام ۴: آپدیت PROGRESS
- DONE شد → از PENDING حذف، به DONE اضافه
- CURRENT = PENDING[0]

## 🚫 ممنوع مطلق
- رفتن به مفهوم بعدی بدون «تایید» کاربر
- ادعای «پیاده شد» بدون شاهد (file:line یا test)
- تغییر >۵ فایل در یک concept
- commit بدون آپدیت PROGRESS.md
- silent catch (قانون ۷)
- as any بدون کامنت (قانون ۶)

## 📋 قالب گزارش (اجباری)
CURRENT: #X نام — فاز: [verify|implement|test|approve]
وضعیت: [خلاصه]
شاهد: [file:line یا test name]
بعد: #X+1 نام
پرسش: تایید؟

## 🎯 قوانین ۷ Invariant (data)
1. currentCount = male + female + unknown
2. unsplit → unknown=currentCount
3. split → sum=currentCount
4. male>0||female>0 → genderSplitAt=now
5. cascade: sum(items)=total، delete(add(x))=no-op
6. بدون any بدون دلیل
7. بدون silent catch

## 🔄 حلقه
- کاربر «ادامه» → concept بعدی
- کاربر «تایید» → مفهوم فعلی DONE، بعدی
