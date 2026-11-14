# NOW.md — وضعیت لحظه‌ای

> بازنویسی می‌شود، نه append.
> آخرین آپدیت: 1405/11/14

## HEAD
0282bfd5 — fix(dlg): رفع تکرار ایموجی منبع + حذف نمایش ۰ اولیه در سلامت
✅ sync با origin (push شد)

## 🔨 کار جاری
**فاز ۰/۳ Design System + بهبود بخش‌های فرم ثبت روزانه (dlg).**

- ✅ بازنویسی کامل EggsWeightSection (کارت expandable + CV هوشمند + واحد گرم)
- ✅ رفع تکرار ایموجی در FeedSection (SmartSelect)
- ✅ رفع نمایش عدد ۰ اولیه در HealthSection (تلفات/واکسن/دارو)
- 🆕 **قانون جدید:** استفاده از `./safe-commit.sh` برای همه کامیت‌ها (چک tsc + rollback خودکار + push)

## ✅ این جلسه (1405/11/14)
- بازنویسی EggsWeightSection (UI + منطق + رفع باگ)
- ثبت IDEA-32 (آستانه پویای CV بر اساس نژاد)
- رفع تکرار ایموجی منبع + عدد صفر
- ساخت `safe-commit.sh` (ابزار خودکارسازی کامیت امن)
- commit 0282bfd5 + push

## ⚠️ هشدارها
- tsc: ۰ خطا ✅
- ۲۴ فایل > ۵۰۰ خط (نقض قانون ۳۲)
- BUG باز: ۱ (BUG-2)

## 🎯 قدم بعدی (به ترتیب)
1. BUG-2 (رطوبت — dlg/LogCard.tsx)
2. شکستن tra/store.ts (۱۳۲۵ خط) — طبق MASTER-ROADMAP
3. IDEA-30 (هوشمندسازی FeedSection) یا IDEA-32

## 📋 منبع حقیقت
docs/MASTER-ROADMAP.md ← اول این
AGENTS.md (۲۷ قانون)
BUGS.md (۱ باگ باز)
docs/DESIGN-CONSISTENCY.md (قانون ۳۴)
safe-commit.sh (ابزار کامیت امن)
