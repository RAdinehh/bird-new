# NOW.md

> آخرین آپدیت: 1405/11/15

## ✅ این جلسه
- fb509d78 — رفع باگ deleteItem (حفظ movements)
- d4fe68eb — UI تک‌کارت: حذف/آرشیو هوشمند
- afc4164f — حذف گروهی هوشمند
- مستندسازی: docs/DELETION-RULES.md

## 🧠 کشف مهم
قاعده واحد از قبل وجود دارد. تنها باگ واقعی whs.deleteItem بود که رفع شد.

## 🎯 قدم بعدی
1. BUGS.md — علامت [x] روی BUG-2
2. تست بصری انبار
3. محاسبه feed در موتور سلامت
4. مهاجرت ماژول‌ها به ExpandableCard inner
5. شکستن tra/store.ts

## ⚠️ هشدار
- tsc: ۰ خطا
- BUG-2 حل شد ولی [ ] — جلسه بعد [x] بزن

## 📝 نکات AI بعدی
1. حذف/آرشیو → DELETION-RULES.md
2. کارت بازشونده → ExpandableCard inner
3. کارت خلاصه → SummaryCard/SummarySection/SummaryRow
4. کامیت → safe-commit.sh فقط
5. هرگز movements.filter در delete
