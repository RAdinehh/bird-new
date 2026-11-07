# HANDOFF v8 — تحویل به AI جدید

تاریخ: 1405/11/08
جلسه: 9 (C1 — موتور محاسباتی)
آخرین commit: 6d5395b1

---

## پروژه چیست

Bird-new — نرم‌افزار مدیریت مرغداری (PWA فارسی، RTL، آفلاین)
Stack: React 18 + TypeScript + Vite + Zustand + Vitest
مسیر: ~/Bird-new
Dev: localhost:3000

---

## وضعیت git

آخرین commit: 6d5395b1
origin/main: 6d5395b1 (push شده)
tsc: پاس
tests: 129 calc + 30+ قدیمی
working tree: تمیز

قبل از هر کار:
cd ~/Bird-new
git log --oneline -5
git status --short
npx tsc --noEmit 2>&1 | tail -5
npx vitest run src/test/calc-*.test.ts 2>&1 | tail -5

---

## کاری که جلسه 9 انجام شد (C1 — 16 commit)

C1.1 — اسکلت (5d8322a9): shr/calc/types.ts (430 خط)، index.ts
C1.2a — FCR + Mortality + Egg + Weight (4 commits: 9de7c802, 6b461f74, 136c3cda, dd86caf6)
C1.2b — Feed + Water + Stocking + EPEF (4 commits: 001dc684, d9b73844, 0313f958, e0567d62)
C1.3 — getThresholds (753f4245) + fix standards production (8750af46)
C1.4a — 4 هزینه پایه (eee5c18c)
C1.4b — totalCost + perKg + perEgg + revenue + profit (879a2c9a)
C1.4c — averages (4a90c09c)
C1.5a — Bovans Brown (4f4b1b50)
C1.5b — biological → biological-constants (6d5395b1)

---

## فایل‌های calc (22 فایل، ~1500 خط)

formulas/ — 8 فایل: fcr, mortality, egg, weight, feed, water, stocking, epef
economics/ — 11 فایل: _shared, feedCost, vaccineCost, medicationCost, litterCost, totalCost, perKgCost, perEggCost, revenue, profit, averages
thresholds/ — index.ts
index.ts + types.ts (430 خط)

تست‌ها: 12 فایل، 129 تست، 1800 خط

---

## 20 تصمیم کلیدی

1. FCR فرمول: feed / ((final-initial) * alive) — نه feed/liveWeight
2. FCR tone: 5 سطح با آستانه پایین (خیلی پایین = danger)
3. Mortality مخرج: aliveToday + deathsToday
4. Mortality weekly: dailyPct * 5
5. hen-housed کنار hen-day
6. Uniformity: درصد در بازه ±10٪ میانگین
7. Feed mode: simple vs precision بر اساس feedMethod
8. auto_sensor: همیشه precision
9. auto_chain: همیشه simple
10. Stocking: guard برای hallArea=0
11. EPEF: فقط گوشتی
12. Thresholds: از standards نه hardcode
13. CV/uniformity/waterRatio: hardcode عمومی
14. Feed cost: reason=consumption + category=feed
15. Medication: chemical + herbal جدا
16. Revenue: hybrid (invoices اولویت، prices fallback)
17. Averages: InputLog با feedConsumedKg/waterAmountL
18. InputMovement/InputItem: typeهای محلی در calc (L9)
19. biological.ts بازنشسته، 5 تابع یتیم حذف
20. Hy-Line/Lohmann production از استاندارد 2023-2024

---

## یافته‌های مهم verify این جلسه

یافته 1: biological.ts یتیم نبود (grep اول ناقص بود، 6 import فعال)
یافته 2: standards/layers.ts production نداشت (باگ 9 ماهه)
یافته 3: calculateFCR در helpers-audit.ts:246 فرمول غلط دارد (feed/liveWeight)
یافته 4: 3 نسخه FCR، 3 henDay، 2 mortality در کد فعلی

---

## گام بعدی — 3 گزینه

A: C2 — اتصال calc به dlg (useDlgSave → calculateFCR، calculateFeedMetrics)
B: D — validation dlg (rules/dlg.ts با آستانه‌های calc)
C: C3 — اتصال calc به dsh و flk

---

## درس‌های مهم این جلسه

1. Heredoc با __EOF__ در markdown شکسته می‌شود → PATCHEND استفاده کن
2. Termux /tmp ندارد → ~/.bird_bak/ استفاده کن
3. Anchor باید یکتا باشد → content.count(anchor) == 1
4. grep pattern را روی نمونه واقعی تست کن
5. تست = مشخصات مطلوب نه رفتار فعلی

---

## قوانین آهنین

- کد بدون verify = ممنوع (grep + sed + backup)
- commit بدون test = ممنوع (L11)
- as any جدید = ممنوع (L5)
- catch {} خالی = ممنوع (L6)
- > 5 فایل در یک concept = نقض AGENTS
- heredoc با __EOF__ = شکسته می‌شود
- /tmp در Termux = ندارد
- anchor بدون verify = خطر
- PATCHEND = انتخاب درست
- ~/.bird_bak/ = جای اسکریپت‌ها
- git --no-pager diff (نه git diff)
- یک تغییر، یک verify، یک commit

---

## خط یک‌خطی

C1 کامل شد: 16 commit، 129 تست، 22 فایل، 27 شاخص استاندارد. موتور محاسباتی آماده است ولی هنوز به ماژول‌ها وصل نشده. بعدی: C2 (اتصال به dlg) یا D (validation dlg).
