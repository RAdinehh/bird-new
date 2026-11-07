# HANDOFF v9 — تحویل به AI جدید

تاریخ: 1405/11/08
جلسه: 9 (C1 + C2 + D کامل)
آخرین commit: d0f25873 (origin/main)

---

## پروژه چیست

Bird-new — نرم‌افزار مدیریت مرغداری (PWA فارسی، RTL، آفلاین)
Stack: React 18 + TypeScript + Vite + Zustand + Vitest
مسیر: ~/Bird-new
Dev: localhost:3000

---

## وضعیت git

آخرین commit: d0f25873
origin/main: d0f25873 (push شده)
tsc: پاس
tests: 185+ این جلسه، صفر regression
working tree: تمیز

قبل از هر کار:
  cd ~/Bird-new
  git log --oneline -5
  git status --short
  npx tsc --noEmit 2>&1 | tail -5
  npx vitest run src/test/calc-*.test.ts 2>&1 | tail -5

---

## کاری که جلسه 9 انجام شد (28 commit)

### C1 — موتور محاسباتی (16 commit)
- C1.1: اسکلت shr/calc/ (types only) — 5d8322a9
- C1.2a: FCR + Mortality + Egg + Weight — 4 commits
- C1.2b: Feed + Water + Stocking + EPEF — 4 commits
- C1.3: getThresholds + fix standards production — 2 commits
- C1.4a: 4 هزینه پایه — eee5c18c
- C1.4b: totalCost + perKg + perEgg + revenue + profit — 879a2c9a
- C1.4c: averages — 4a90c09c
- C1.5a: Bovans Brown — 4f4b1b50
- C1.5b: biological -> biological-constants — 6d5395b1

### C2 — اتصال calc به dlg (4 commit)
- C2a: environment warnings در calc — d8df5b8e
- C2b.1: LogCard از calc — 620ec597
- C2b.3: حذف 4 تابع مرده — dada4388
- C2b.4: حذف tempWarning + humidityWarning — 383ab287

### D — Validation dlg (4 commit)
- D2: sumDeaths + 17 تست baseline — 3ff4547e
- D3a: hen-day با femaleCount — 3db7fd96
- D3b+D3c: water balance + feedRemaining soft — a5aa12f2

### D4 — Intelligence standards-aware (4 commit)
- D4a: dlg temperature standards-aware — bf07dee1
- D4b: species/species_curve (21 فیلد) — 51303f5e
- D4d: گسترش context FeedSection + EggsWeightSection — d0f25873

### Docs
- HANDOFF v8 — f442d32b

---

## آمار دقیق این جلسه

- commits: 28
- فایل‌های تست جدید: 17
- تست‌های جدید: ~185
- فایل‌های جدید: ~35
- فایل حذف‌شده: biological.ts -> biological-constants.ts (133 خط)
- باگ fix شده: 5 (FCR فرمول، production Hy-Line/Lohmann، sumDeaths، hen-day femaleCount، temp warning)

---

## فایل‌های کلیدی calc (22 فایل، ~1500 خط)

formulas/ — 8 فایل: fcr, mortality, egg, weight, feed, water, stocking, epef, environment
economics/ — 11 فایل: _shared, feedCost, vaccineCost, medicationCost, litterCost, totalCost, perKgCost, perEggCost, revenue, profit, averages
thresholds/ — index.ts
species-expected.ts — standards-aware (D4b)
index.ts + types.ts (430 خط)

تست‌ها: 17 فایل، ~185 تست، ~2500 خط

---

## Intelligence حالا standards-aware

قبل از جلسه 9:
- Intelligence از biological-constants (33°C ثابت) می‌خواند
- 26 فیلد species/species_curve/species_temp تعریف شده بود ولی پیاده نشده (36% شکسته)

بعد از جلسه 9:
- D4a: دما/رطوبت dlg با استاندارد نژاد + سن
- D4b: 21 فیلد species از getSpeciesExpected (FCR/ADG/feed/space/production/weight)
- D4d: context در FeedSection + EggsWeightSection

مسیر:
FieldHint -> useAnomalyHint -> analyzeAnomaly -> getSpeciesExpected -> calc/thresholds -> set/standards

---

## یافته‌های مهم جلسه 9

یافته 1: biological.ts کاملا یتیم نبود (grep اول ناقص بود، 6 import فعال)
       - 5 تابع یتیم حذف شد، 9 ثابت + getTempIdeal به biological-constants.ts
       - 6 فایل import آپدیت

یافته 2: standards/layers.ts production نداشت (باگ 9 ماهه)
       - Hy-Line W36 و Lohmann production null بودند
       - با تست calc-thresholds کشف شد
       - fix: Hy-Line 2023 + Lohmann 2024

یافته 3: calculateFCR در helpers-audit.ts:246 فرمول غلط دارد (feed/liveWeight نه feed/weightGain)
       - هنوز در FlockHistoryModal استفاده می‌شود
       - fix در جلسه بعد یا در C3

یافته 4: Intelligence 36% شکسته بود (26 از 92 فیلد)
       - species/species_curve/species_temp هیچ‌کدام پیاده نشده بودند
       - با D4a+D4b+D4d fix شد

یافته 5: 3 نسخه FCR، 3 نسخه henDay، 2 نسخه mortality در کد فعلی
       - حالا در shr/calc متمرکز (صفر تکرار در کد جدید)
       - ولی dsh/flk/helpers-audit هنوز از نسخه قدیم استفاده می‌کنند (C3)

---

## باقی‌مانده (جلسات بعدی)

### D5 — Pre-flight در useDlgSave (از نقشه D)
- atomicSave (بخش B1 که طراحی شد ولی پیاده نشد)
- snapshot + rollback
- getStandardsWarnings در pre-flight

### C3 — اتصال calc به dsh و flk
- useDashboardData -> calculateFCR, calculateMortality
- useGroupKpi -> همه metricها
- helpers-audit calculateFCR جایگزین شود

### بخش‌های دیگر dlg (E, F, G, H از تحلیل اولیه)
- E: UI/UX (فرم 47 فیلدی)
- F: cross-module (رویدادها، دوطرفه whs/egg/flk)
- G: Draft Mode (autosave + recovery)
- H: گزارش و خروجی (CSV، LogCard)

### بخش‌های A و B dlg (تحلیل شد، پیاده نشد)
- A: مدل داده (shift، feedConsumed، birdAge، migration v9)
- B: زنجیره اتمیک (8 تصمیم ثبت شد، پیاده نشد)

---

## درس‌های مهم این جلسه

درس 1: Heredoc با __EOF__ در markdown شکسته می‌شود (bold می‌کند)
        -> از PATCHEND یا SCRIPTEND بدون underscore استفاده کن

درس 2: Termux /tmp ندارد
        -> از ~/.bird_bak/ استفاده کن

درس 3: Anchor باید یکتا باشد -> content.count(anchor) == 1
        -> line-based fix مقاوم‌تر از text-replace

درس 4: grep pattern را روی نمونه واقعی تست کن
        -> الگوی from.*biological ناقص بود

درس 5: تست = مشخصات مطلوب، نه رفتار فعلی
        -> باگ production در standards با تست calc-thresholds کشف شد

درس 6: اگر anchor شبیه است ولی match نمی‌شود، از line-based approach استفاده کن
        -> 3 بار rollback در D3b/c به‌خاطر anchor طولانی

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
- PATCHEND (بدون underscore) = انتخاب درست
- ~/.bird_bak/ = جای اسکریپت‌ها
- git --no-pager diff (نه git diff)
- یک تغییر، یک verify، یک commit

---

## خط یک‌خطی

C1 کامل (موتور calc، 140 تست)، C2 کامل (اتصال calc به dlg، 4 commit)، D کامل (validation dlg 22 تست + D4 Intelligence standards-aware 20 تست). 28 commit این جلسه، 185+ تست، صفر regression. باقی: D5 (atomicSave)، C3 (calc به dsh/flk)، بخش A/B dlg (تحلیل شده، پیاده نشده)، E/F/G/H dlg.
