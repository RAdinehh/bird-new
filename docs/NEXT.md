# 🎯 NEXT — جلسه ۱۴ (تصحیح‌شده با واقعیت کد)

> این فایل با **واقعیت کد** نوشته شده، نه ادعا.
> آخرین بازنویسی: بعد جلسه ۱۳ (مهاجرت tra→whs و egg→whs).

---

## ✅ انجام‌شده در جلسه ۱۳

- مهاجرت tra:invoice:* → whs به bus (۶ تست)
- مهاجرت egg:production:* → whs به bus
- تصحیح EVENT-BUS.md (بخش وضعیت)
- **درس:** inc, dlg, flk مسیرهای غیرمستقیم دارن — قبل از هر activation، grep بزن

---

## 🎯 هدف واقعی جلسه ۱۴

**کاهش any در inc یا brd** — اول باید عدد واقعی رو دربیاریم.

### قدم ۱ — اسکن واقعی
grep -c ': any\|<any>\|as any' src/mod/inc/store.ts src/mod/brd/store.ts

### قدم ۲ — لیست دقیق
grep -n ': any\|<any>\|as any' src/mod/inc/store.ts | head -30

### قدم ۳ — تصمیم بر اساس حجم واقعی (نه ادعای AI-BOOT.md)

---

## 🟢 صف بعدی (بر اساس واقعیت)

1. any-کاهی از کم‌حجم‌ترین ماژول (inc یا brd)
2. dlg:vaccine:given → cal (بعد از تأیید واقعی مرده بودن)
3. showAlert → showToast (بعد از grep واقعی)
4. catch خالی hal (بعد از grep واقعی)

---

## ⚠️ کارهایی که الان نکن

- refactor فایل‌های بزرگ (flk/store, alt/rules) — بدون برنامه
- فعال‌سازی مرده بر اساس EVENT-BUS.md قدیمی — همیشه اول grep
- مهاجرت چیزهایی که از مسیر غیرمستقیم کار می‌کنن (inc→whs که از طریق tra/egg فعاله)

---

## 🔴 قانون جلسه ۱۴

قبل از هر تغییر بزرگ:

grep -rn 'bus\.emit\|bus\.on' src/ --include='*.ts' --include='*.tsx'
grep -rn 'useWhs\|useFlk\|useEgg\|useTra' src/mod/<module>/ --include='*.ts' --include='*.tsx'
git status --short

**هیچ‌وقت به این فایل، EVENT-BUS.md یا AI-BOOT.md بدون تأیید grep اعتماد نکن.**

---

*آخرین به‌روزرسانی: بعد جلسه ۱۳*
