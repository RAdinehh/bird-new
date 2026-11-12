# NOW.md — وضعیت لحظه‌ای

> بازنویسی می‌شود، نه append.
> آخرین آپدیت: 1405/11/12

## HEAD
cc8a88d6 — docs: قانون ۳۴ (رنگ semantic) + مستند dlg-daily + BUG-2

## 🔨 کار جاری
**Design System (قانون ۳۴) رسمی شد — دlg مهاجرت جزئی.**

- ✅ `--success` مستقل از `--accent` (commit `382eca3f`)
- ✅ `AlertBox` ساخته شد (commit `7de8d8a2`)
- ✅ ۴ کادر هشدار به AlertBox مهاجرت شد (commit `8160c5d8`)
- ✅ قانون ۳۴ در AGENTS.md + مستند `dlg-daily.md`
- 🔴 BUG-2 (ناسازگاری رطوبت) — ثبت، بررسی نشده

**قدم بعدی پیشنهادی:**
- BUG-2 (ناسازگاری رطوبت در LogCard)
- feature dlg: entryTime zod / Anomaly FeedSection (IDEA-30)
- refactor tra (متوقف، طبق قانون ۳۲)

## ✅ امروز (1405/11/12)
- Audit کامل (۲۳۶ تست، ۱۲/۱۲ zod، ۳۶۱۱ توکن، ۷ anomaly)
- MASTER-ROADMAP + NOW + RESUME + AGENTS ۲۹+۳۰+۳۱
- session-end.sh
- BUGS.md (باگ‌های معلق)
- استاندارد شکستن (Two Hats + معیار + مثال DealsPage)
- قانون ۳۲ (No Rework) + ۳۳ (Handoff Contract)
- قانون ۳۴ (Design System — رنگ semantic)
- `--success` + `AlertBox` + مهاجرت ۴ نقطه
- BUG-1 بسته شد، BUG-2 ثبت شد
- مستند `dlg-daily.md` ساخته شد

## ⚠️ هشدارها
- tsc: ۰ خطا ✅
- تست کامل: ۱۹۸۷ pass / ۱۳ fail (dlg/flk — از قبل)
- BUG-1 (handoff-mismatch tra) ✅ بسته شد
- BUG-2 (ناسازگاری رطوبت dlg) — باز، بررسی نشده
- ۲۴ فایل > ۵۰۰ خط (نقض قانون ۳۲ — قانون جدید است، عقب‌گرد نمی‌کنیم)

## 📋 منبع حقیقت
docs/MASTER-ROADMAP.md ← اول این
AGENTS.md (۳۱ قانون)
BUGS.md (باگ‌های معلق)
