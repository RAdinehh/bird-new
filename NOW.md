# NOW.md — وضعیت لحظه‌ای

> بازنویسی می‌شود، نه append.
> آخرین آپدیت: 1405/11/14

## HEAD
89bbc421 — feat(dlg): وزن‌کشی تخم — کارت expandable + خلاصه هوشمند CV + واحد گرم
✅ sync با origin (push شد)

## 🔨 کار جاری
**فاز ۰/۳ Design System + بهبود بخش‌های فرم ثبت روزانه (dlg).**

- ✅ بازنویسی کامل EggsWeightSection:
  - کارت‌های نمونه expandable (border accent سبز هنگام باز)
  - خلاصه هوشمند CV داخل کارت باز (بدون تکرار)
  - جنسیت دو ستونه کنار وزن
  - واحد kg → گرم (رفع تناقض)
  - رفع باگ NaN + محاسبه با نمونه خالی
  - HelpIcon ? با راهنمای آستانه‌های ۸/۱۰/۱۲

## ✅ این جلسه (1405/11/14)
- بازنویسی EggsWeightSection (UI + منطق + رفع باگ)
- ثبت IDEA-32 (آستانه پویای CV بر اساس نژاد)
- commit 89bbc421 + push

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
