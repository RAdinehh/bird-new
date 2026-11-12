# NOW.md — وضعیت لحظه‌ای

> بازنویسی می‌شود، نه append. هر checkpoint آپدیت.
> آخرین آپدیت: 1405/11/12

## HEAD
ce4f0554 + مستندسازی MASTER-ROADMAP

## 🔨 کار جاری
فاز ۰ — تثبیت مستندسازی. پس از اتمام → فاز ۱ (L7).

## ✅ امروز (1405/11/12)
- Audit کامل پروژه (کد واقعی، بدون حدس)
- Baseline ثبت: ۲۳۶ تست، ۱۲/۱۲ zod، ۳۶۱۱ توکن، ۷ ماژول anomaly
- نقاط ضعف: ۳ فایل > ۱۰۰۰ خط، ۶۹ catch {}، ۱۶۱ as any
- docs/MASTER-ROADMAP.md ساخته شد

## 🎯 قدم بعدی (فاز ۰)
1. [x] MASTER-ROADMAP.md
2. [ ] NOW.md (این)
3. [ ] RESUME.sh آپدیت
4. [ ] AGENTS.md قانون ۲۹

## 🚀 فاز ۱ (بعد از فاز ۰)
شکستن ۳ فایل بزرگ:
- tra/DealsPage.tsx (۱۶۳۵ خط)
- tra/store.ts (۱۳۲۵ خط)
- flk/FlockHistoryModal.tsx (۱۰۵۲ خط)

## ⚠️ هشدارها
- tsc: ۰ خطا ✅
- تست: ۲۳۶ فایل (وضعیت دقیق: باید اجرا شو)
- فایل‌های بزرگ: نقض L7

## ❓ سؤالات باز
- فاز ۲/۴/۵ ضروری‌ان یا اختیاری؟
- اولویت فاز ۱ (L7) یا فاز ۳ (features)؟

## 📋 منبع حقیقت
- docs/MASTER-ROADMAP.md ← اول این
- AGENTS.md (۲۲+ قانون)
- CLAUDE.md (قانون -۱: فقط فارسی)
- docs/CONSTITUTION.md
- docs/DECISIONS.md
- docs/UI-PATTERNS-REGISTRY.md
