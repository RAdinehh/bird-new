# 🤝 HANDOFF.md — سند تحویل به AI بعدی

> اول این رو کامل بخون. آخرین به‌روزرسانی: ۱۴۰۴/۰۷/۲۱ (جلسه ۱۲)

## 📌 خلاصه وضعیت

**Bird-new** — PWA مدیریت مرغداری (React + TS + Vite + Zustand + Zod)

| مورد | وضعیت |
|---|---|
| **tsc** | ✅ ۰ خطا |
| **تست** | ✅ ۱۰۶۸ pass |
| **build** | ✅ موفق |
| **ماژول‌ها** | ۱۸ فعال |
| **Stores** | ۱۴ persist |
| **Event Bus** | ⚠️ فقط ۲/۱۸ فعال |

## 📊 درصد پیشرفت کلی

| لایه | درصد |
|---|---|
| معماری پایه | ۹۵٪ |
| UI/UX | ۹۰٪ |
| اتصالات بین‌ماژولی | ۴۰٪ ⚠️ |
| Event Bus | ۱۱٪ 🔴 |
| پاکسازی any | ۳۰٪ |
| رفع فایل‌های بزرگ | ۳۰٪ |

## 🔒 ماژول‌های قفل‌شده

- ✅ `set` — با وجود ۱۲۲ any نیاز به بازبینی
- ✅ `brd` — با وجود ۶۱ any نیاز به بازبینی
- ✅ `hal` — ۱۰۰/۱۰۰ (جلسه ۱۰)
- ✅ `doc` — کامل
- 🟡 `flk` — ۹۵٪ (فقط store 819 و Groups 531 مونده)

## 📚 مستندات مرجع (به ترتیب مطالعه)

| # | فایل | نقش |
|---|---|---|
| ۱ | HANDOFF.md (این) | وضعیت + برنامه |
| ۲ | FOUNDATION.md | قوانین آهنین |
| ۳ | FOUNDATION-PATTERNS.md | الگوهای تفکر |
| ۴ | ARCHITECTURE.md | نقشه کامل |
| ۵ | EVENT-BUS.md | قرارداد ایونت |
| ۶ | AI-RULES.md | پروتکل کار |
| ۷ | STANDARDS.md | UI/UX |
| ۸ | AUDIT.md | چک‌لیست |
| ۹ | TYPE-REGISTRY.md | تایپ‌ها |
| ۱۰ | UX-FORM-RULES.md | ۷۰ دستور |

## 🚨 بدهی فنی (به ترتیب اولویت)

### 🔴 فوری

| # | کار | مقدار | ریسک |
|---|---|---|---|
| ۱ | **Event Bus فعال‌سازی** | ۱۶/۱۸ غیرفعال | بالا — معماری |
| ۲ | **catch خالی hal** | ۷ مورد | باگ خاموش |
| ۳ | **any در inc** | ۱۵۵ مورد | بدهی |
| ۴ | **showAlert → Toast** | ۱۵ مورد | قانون |

### 🟡 مهم

| # | کار | مقدار |
|---|---|---|
| ۵ | any در set | ۱۲۲ |
| ۶ | refactor flk/store | 819 خط |
| ۷ | refactor alt/rules | 589 خط |
| ۸ | refactor flk/GroupsPage | 531 خط |
| ۹ | any در shr | ۸۸ |
| ۱۰ | any در whs | ۶۴ |
| ۱۱ | any در brd (قفل‌شده) | ۶۱ |

### 🟢 قابل تعویق

- ۱۳ فایل ۴۰۰-۵۰۰ خط
- ۱۰ اتصالات بین‌ماژولی ناقص
- i18n، E2E، Virtualization

## 📮 Event Bus — نقشه راه فعال‌سازی

**وضعیت فعلی:** فقط `dlg → flk` کار می‌کنه

**باید فعال شن:**

| ناشر | ایونت | مشترک هدف |
|---|---|---|
| tra | invoice:created | egg, whs, dsh, rep |
| egg | production:created | dsh, rep |
| inc | hatch:created | flk (growing flock) |
| whs | movement:created | hal, alt |
| dlg | deaths/vaccine/medication | flk, alt, rep |

**الگو:** هر ماژول `handlers.ts` بسازه + در `main.tsx` ثبت شه

## 👥 سیستم گروه‌بندی گله

**ساخته شده ولی کشف‌نشده!**

- `GroupsPage.tsx` (۵۳۱ خط) — صفحه اصلی
- `FlockGroupType`: season · breed · cohort · farm · owner · custom · **smart**
- `MergeFlocksModal`, `GroupTimeline`, `GroupComparisonModal`, `GroupReportModal`, `useGroupKpi`
- `FlockDealType`: own · partnership · consignment · rent

**نیاز:** refactor `GroupsPage` به زیر ۴۰۰

## 🛠 ابزارها

### Aliases (~/.bashrc)

| Alias | کار |
|---|---|
| `af` | `python3 ~/auto_fast.py` |
| `chk` | چک any |
| `hal` / `brd` / `flk` | پرش ماژول |
| `tsc` / `vit` | چک سریع |

### GitHub Actions

- `.github/workflows/ci.yml` — tsc + test + build
- `.github/workflows/build-apk.yml` — APK

### ESLint

- `.eslintrc` → `no-unused-imports`, `no-explicit-any`, `prefer-const`

## 🎯 پروتکل کار

### قاعده ۱ — کاربر کدنویس نیست
- اسکریپت کوتاه (زیر ۵۰ خط)
- کپی/پیست
- **پاسخ فارسی، بدون اصطلاح پیچیده**

### قاعده ۲ — قبل از هر تغییر
- فایل واقعی رو ببین (`cat` / `sed -n`)
- **حدس نزن** — anchor حدسی نزن

### قاعده ۳ — یه تغییر در هر مرحله
- بعد هر تغییر: `python3 ~/auto_fast.py "پیام"`
- tsc خطا داد → rollback، نه fix

### قاعده ۴ — کامپوننت‌های قفل‌شده 🔒
`SelectSheetShell`, `SmartSelect`, `EditableSelect`, `AutocompleteSheet`, `DependentSelect`, `Field`, `Input`, `EntityLink`, `OverrideHint`, `ExpandableCard`

### قاعده ۵ — git tag قبل از تغییر بزرگ

## 🚦 از کجا شروع کنیم

### مسیر ۱ — رفع بدهی (توصیه)
1. Event Bus فعال‌سازی
2. catch خالی hal
3. any در inc (۱۵۵)
4. showAlert → Toast

### مسیر ۲ — refactor بزرگ‌ها
1. flk/store (819)
2. alt/rules (589)
3. flk/GroupsPage (531)

### مسیر ۳ — قابلیت جدید
- بستگی به کاربر

## 📞 دستورات سریع

~~~
cd ~/Bird-new

npm run dev -- --host 0.0.0.0 --port 3000
npm test -- --run
npx tsc --noEmit
npm run build

python3 ~/auto_fast.py "پیام commit"

git log --oneline -10
git tag before-XXX-YYYYMMDD
~~~

## ⚠️ نکات حیاتی

### localStorage
`pm-settings`, `pm-brd`, `pm-hal`, `pm-flk`, `pm-inc`, `pm-egg`, `pm-dlg`, `pm-whs`, `pm-fed`, `pm-alt`, `pm-cal-manual`, `pm-ctc`, `pm-tra`, `pm-doc`, `pm-theme`, `pm-custom-options`, `pm-custom-species`

### قوانین بیولوژیکی
- Hen-Day < ۱۰۲٪
- تخم ۳۵-۸۵ گرم
- FCR ۱.۰-۵.۰
- Chick yield ۶۴-۷۱٪

### نکات محیطی
- °C در DB، °F فقط نمایش
- استاندارد بر اساس نژاد
- 100svh نه 100dvh
- کش PWA → Unregister Service Worker

## 📅 تاریخ جلسات

### جلسه ۱-۷
brd, hal, set, doc, foundation

### جلسه ۸-۱۱
- hal قفل نهایی
- flk + carousel + smart capacity
- استفاده از useFormErrors و useCarousel v4
- separator `•` در ۶۹ فایل

### جلسه ۱۲ (این جلسه)
- ✅ بازنویسی ARCHITECTURE
- ✅ بازنویسی HANDOFF
- 🟡 کشف: Event Bus ۲/۱۸
- 🟡 کشف: سیستم گروه‌بندی flk کامل
- 🟡 کشف: بدهی فنی واقعی

---

**هدف نهایی:** نرم‌افزار سطح اپل/گوگل برای مدیریت مرغداری.

**قبل از هر تغییر:** ۳ بار فکر کن. شک داری؟ نکن.
