# 🤝 HANDOFF.md — سند تحویل به AI بعدی

> **این سند نقشه‌ی راه توئه. اول این رو کامل بخون.**
> آخرین به‌روزرسانی: ۱۴۰۴/۰۷/۲۰

---

## 📌 بخش ۱ — خلاصه وضعیت

### پروژه چیه؟
**Bird-new** — PWA مدیریت مرغداری (React + TS + Vite + Zustand + Zod + date-fns-jalali)

### وضعیت کلی
- tsc ✅ ۰ خطا
- تست‌ها: ✅ ۱۰۶۴/۱۰۶۴ pass
- build ✅ موفق

### آمار
| مورد | مقدار |
|---|---|
| ماژول | ۲۰ |
| خطوط کد | ~۶۵٬۰۰۰ |
| فایل تست | ۱۴۵ |
| Bundle | ~۱.۹ MB |
| درصد کلی | ~۸۵٪ |

### قفل‌شده (تموم و تأییدشده)
- ✅ `set` (تنظیمات + استانداردها)
- ✅ `brd` (پرنده و نژاد)
- ✅ `hal` (سالن‌ها + بخش‌ها + تجهیزات)
- ✅ `doc` (اسناد)
---

## 📚 بخش ۲ — مستندات مرجع

**ترتیب مطالعه:**

| # | فایل | نقش | اولویت |
|---|---|---|---|
| ۱ | `HANDOFF.md` (این) | وضعیت + برنامه | 🔴 اول |
| ۲ | `FOUNDATION.md` | قوانین آهنین (۱۳ بخش) | 🔴 |
| ۳ | `FOUNDATION-PATTERNS.md` | الگوهای تفکر (۱۶ بخش) | 🔴 |
| ۴ | `ARCHITECTURE.md` | نقشه فایل‌ها + وابستگی | 🟡 |
| ۵ | `AI-RULES.md` | پروتکل کار با کاربر | 🟡 |
| ۶ | `STANDARDS.md` | استانداردهای UI/UX | 🟢 |
| ۷ | `AUDIT.md` | چک‌لیست ۷ محوره | 🟢 |
| ۸ | `AUDIT-BRD.md` | ممیزی brd | مرجع |
| ۹ | `AUDIT-HAL.md` | ممیزی hal | مرجع |
| ۱۰ | `STATUS.md` | نقشه راه (قدیمی — فقط کارها) | 🟢 |

**قانون:** اگه بین `STATUS.md` و `FOUNDATION.md` تضاد دیدی، **FOUNDATION برنده‌ست**.
---

## 📊 بخش ۳ — وضعیت ماژول‌ها

| ماژول | وضعیت | نکته |
|---|---|---|
| `set` تنظیمات | ✅ ۹۰٪ | استانداردها |
| `brd` پرنده/نژاد | ✅ ۱۰۰٪ | قفل‌شده، ممیزی کامل |
| `hal` سالن | ✅ ۹۰٪ | ممیزی‌شده |
| `ctc` مخاطبین | ✅ ۸۵٪ | — |
| `flk` گله | 🟡 ۷۰٪ | cascade نیمه |
| `dlg` ثبت روزانه | 🟡 ۷۰٪ | cascade نیمه |
| `egg` تخم | ✅ ۹۰٪ | — |
| `whs` انبار | ✅ ۸۵٪ | — |
| `fed` جیره | 🟡 ۷۵٪ | cascade نیمه |
| `inc` جوجه‌کشی | 🟡 ۷۰٪ | cascade نیمه |
| `tra` معاملات | 🟡 ۷۰٪ | — |
| `alt` هشدارها | 🟡 ۶۰٪ | validation نیست |
| `cal` تقویم | 🟡 ۷۰٪ | — |
| `dsh` داشبورد | 🟡 ۷۰٪ | — |
| `rep` گزارش | 🟡 ۷۰٪ | — |
| `doc` اسناد | ✅ ۱۰۰٪ | — |
| `arc` آرشیو | 🟡 ۷۰٪ | — |
---

## 🔴 بخش ۴ — کارهای باقی‌مونده

### ✅ قبلاً حل شده (تأیید ۱۴۰۴/۰۷/۲۰)
- [x] **ErrorBoundary ریشه‌ای** — `main.tsx:48` + `ErrorFallback` + `logError` + تست
- [x] **Export/Import JSON** — `BackupTab.tsx` + `backup.ts` (۷ تابع) + `AutoBackup` فعال در `App.tsx`

### 🔴 بحرانی باقی‌مونده
- [ ] **Decimal.js** — بررسی عمیق‌تر (فعلاً `parseFloat` ساده در `fa.ts`)

### 🟡 مهم
- [ ] **اتصالات باقی‌مونده:**
  - `tra → egg` (فروش تخم)
  - `fed → dlg` (جیره فعال)
  - `inc → flk` (candling)
  - `cal → inc/dlg` (واکسن)
  - `alt rules` (هشدار خودکار)
- [ ] **Multi-Select گله**
- [ ] **Event Bus** (کاهش circular dependency)

### 🟢 کم‌اهمیت
- [ ] Refactor فایل‌های بزرگ (DailyLogsPage ۱۱۸۸، EggEntriesPage ۱۱۳۹، FlocksPage ۱۰۰۱)
- [ ] حذف کد تکراری (`num`, `int`, `toFa` توی ۱۵+ فایل)
- [ ] UI/UX یکدست‌سازی
- [ ] i18n پایه
- [ ] Virtualization (TanStack Virtual)
- [ ] تقویم حرفه‌ای (Doran Calendar)

### 🔵 بلندمدت
- [ ] PWA offline کامل
- [ ] Backend (multi-user)
- [ ] React Native
- [ ] E2E tests (Playwright)
---

## 🧠 بخش ۵ — پروتکل کار با کاربر

### قاعده ۱: کاربر کدنویس نیست
- اسکریپت Python کوتاه (زیر ۱۰۰ خط)
- کاربر فقط کپی/پیست می‌کنه
- **پاسخ فارسی، بدون اصطلاح پیچیده**
- کاربر توکن محدود داره → خلاصه و دقیق

### قاعده ۲: قبل از هر تغییر
- **فایل واقعی رو ببین** (`cat` یا `sed -n`)
- **گمان نزن** — anchor حدسی نزن
- اگه شک داری، **بهترین راه‌حل رو خودت انتخاب کن**

### قاعده ۳: یه تغییر در هر مرحله
- نکن چند کار با هم
- بعد از هر تغییر: `python3 ~/auto_fast.py "پیام"`
- اگه tsc خطا داد → **rollback، نه fix**

### قاعده ۴: کامپوننت‌های قفل‌شده 🔒
`SelectSheetShell`, `SmartSelect`, `EditableSelect`, `AutocompleteSheet`, `DependentSelect`, `Field`, `Input`, `EntityLink`, `OverrideHint`, `ExpandableCard`

**بدون اجازه‌ی صریح کاربر، دست نزن.**

### قاعده ۵: درخواست‌های چندگانه
1. لیست کن
2. به کاربر نشون بده
3. یکی‌یکی انجام بده
4. آخر همه رو یادآوری کن

### قاعده ۶: کامیت
```
cd ~/Bird-new && python3 ~/auto_fast.py "پیام commit"
```
خودش: tsc → build → commit → push → rollback اگه خطا
---

## 🚦 بخش ۶ — از کجا شروع کنی

### گام ۰: verify وضعیت
```bash
cd ~/Bird-new
git log --oneline -5
git status -s
npx tsc --noEmit 2>&1 | tail -3
```

### گام ۱: بخون (ترتیب بخش ۲)
- `FOUNDATION.md`
- `FOUNDATION-PATTERNS.md`
- `ARCHITECTURE.md`

### گام ۲: از کاربر بپرس
«از کجا شروع کنیم؟»
- **کارهای فوری** → بخش ۴ بحرانی
- **استاندارد کامل** → فاز A→E
- **ماژول خاص** → بپرس کدوم

### گام ۳: شروع کن
- یه تغییر در هر مرحله
- commit بعد هر تغییر
- اگه شکستی، برگرد نه fix

---

## 📞 بخش ۷ — دستورات سریع

```bash
cd ~/Bird-new

# اجرا
npm run dev -- --host 0.0.0.0 --port 3000

# تست
npm test -- --run

# TypeScript
npx tsc --noEmit

# Build
npm run build

# کامیت + push
python3 ~/auto_fast.py "پیام"

# Git
git log --oneline -10
git tag before-XXX-YYYYMMDD
```
---

## ⚠️ بخش ۸ — نکات حیاتی

### ۱. localStorage کلیدها
`pm-settings`, `pm-brd`, `pm-hal`, `pm-ctc`, `pm-flk`, `pm-inc`, `pm-egg`, `pm-dlg`, `pm-whs`, `pm-fed`, `pm-tra`, `pm-alt`, `pm-cal-manual`, `pm-theme`, `pm-custom-options`, `pm-custom-species`

### ۲. قوانین بیولوژیکی (biological.ts)
- Hen-Day: زیر ۱۰۲٪
- تخم: وزن ۳۵-۸۵ گرم
- جوجه: وزن ۲۰-۶۰ گرم
- Chick yield: ۶۴-۷۱٪
- FCR: ۱.۰-۵.۰
- دان/پرنده: ۱۰-۲۶۰ گرم/روز

### ۳. نکات محیطی
- °C در DB، °F فقط نمایش
- استانداردها بر اساس نژاد، نه فقط پرنده
- DB تومان پایه
- 100svh نه 100dvh روی موبایل
- کش PWA مشکل اصلی تست: **Unregister Service Worker** قبل تست

### ۴. Master Data vs Operations (قانون ۱۶)
- استانداردها فقط توی `/set`
- پرنده‌ها فقط توی `مدیریت پرنده‌ها`
- توی `/brd`: فقط انتخاب، نه ساخت
---

## 🎬 بخش ۹ — تاریخ جلسات

### جلسه ۱ (۱۴۰۴/۰۷/۲۰)
- ممیزی اولیه brd
- ۳ false positive کشف شد
- ساخت `FOUNDATION.md` و `AUDIT-BRD.md`

### جلسه ۲ (۱۴۰۴/۰۷/۲۰ — بعد)
- ۱۱ fix موفق روی brd
- refactor BirdForm, BirdCard, BreedForm, BreedCard
- Zod + توکنی‌سازی کامل

### جلسه ۳ (۱۴۰۴/۰۷/۲۰ — دوم)
- اضافه شدن ۳ استاندارد مرغ مادر
- اضافه شدن turkeys (۴)، ducks (۵)، geese (۵)
- `_display-name` + `_display-values` (Single Resolver)
- `species.ts` + `customSpecies`
- Master Data vs Operations (قانون ۱۶)
- ممیزی کامل hal + تمیزکاری
- `AUDIT-HAL.md`

### جلسه ۴ (۱۴۰۴/۰۷/۲۰ — سوم)
- بازنویسی کامل `HANDOFF.md`
- حذف تکراری‌ها
- یک سند مرجع

---

## ⚠️ بخش ۱۰ — هشدار نهایی

**پروژه ۶+ ماه کار و سرمایه‌گذاری کاربره. احترام بذار.**

۱. **قبل از هر تغییر، ۳ بار فکر کن.**
۲. **اگه شک داری، نکن.**
۳. **اگه کاربر گفت «کار می‌کنه»، دست نزن.**
۴. **اگه کاربر گفت «خرابه»، برگرد به نسخه سالم — نه fix.**

**هدف نهایی:** نرم‌افزار سطح اپل/گوگل برای مدیریت مرغداری.

**موفق باشی!** 🐦
