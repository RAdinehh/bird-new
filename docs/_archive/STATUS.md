# 📊 STATUS.md — تاریخچه و نقشه راه Bird-new

> آخرین به‌روزرسانی: ۱۴۰۴/۰۷/۲۱ (جلسه ۱۲)
> وضعیت فعلی → `HANDOFF.md` · معماری → `ARCHITECTURE.md`

## ✅ تاریخ فازها

### فاز ۱ — پایه (تموم)
- زیرساخت React/TS/Vite/PWA
- ۱۸ ماژول CRUD
- ۱۰۶۸ تست pass
- استاندارد ۲۳ نژاد
- Multi-Select، آبشاری، Toast، FAB، Dialog
- Feature flag واکسن/دارو

### فاز ۲ — شکستن فایل‌های بزرگ (تموم)
- `filter/configs.tsx` → ۱۴ فایل
- `shr/components/ui.tsx` → ۱۰ فایل
- `FilterBar.tsx` → ۴ فایل
- `tra/store.ts` → ۴ فایل
- `data-breeds.ts` → ۸ فایل

### فاز ۳ — Capacitor + APK (تموم)
- نصب Capacitor
- پوشه `android/`
- GitHub Actions APK
- هر push → APK جدید (~۳ دقیقه)

### فاز ۴ — A11y (تموم)
- Focus Visible
- useKeyboardSafeFocus
- حذف ۵۵۱ فایل `.bak` (۱۴ MB)
- سند استانداردها

### فاز ۵ — brd (تموم)
- ممیزی کامل (`AUDIT-BRD.md`)
- ۱۱ fix موفق
- refactor BirdForm/BirdCard/BreedForm/BreedCard
- Single Resolver
- Master Data
- ⚠️ **ولی ۶۱ any مونده** (جلسه ۱۲ کشف شد)

### فاز ۶ — hal (تموم)
- ممیزی کامل (`AUDIT-HAL.md`)
- EquipmentPage: ۴۳۷ → ۳۱۱ خط
- ZonesPage: ۴۱۴ → ۳۵۷ → دوباره ۴۴۴
- استخراج useEquipmentForm + ZoneFormModal
- توکنی‌سازی ۷۰+ مورد

### فاز ۷ — FOUNDATION (تموم)
- `FOUNDATION.md` (۱۳ بخش)
- `FOUNDATION-PATTERNS.md` (۲۸ بخش — ۳۰+ الگو)

### فاز ۸ — ابزارها + hal نهایی (تموم)
- ESLint + config
- GitHub Actions CI
- `scripts/check-any.py`
- `docs/TYPE-REGISTRY.md`
- Aliases پروژه (`af`, `chk`, ...)
- hal صفر any (۹۶ → ۶ migration)
- ESLint --fix روی ۱۵ ماژول
- rename `*Payload` vs `*FormData`
- ۱۰۶۸ تست pass

### فاز ۹ — انکوباسیون + استاندارد بستر (تموم)
- استاندارد بستر per-material (`kgPerM2ByMaterial`)
- کاهش وزن تخم + هشدار alt
- پروفایل دما/رطوبت روز‌به‌روز (`IncubationPhase`)
- `IncubationProfileEditor`
- EST + CO₂/O₂ + چرخش
- `inc/needs.ts` — ۶ تابع pure
- پایش زنده + نمودار روند (`DeviceReading`)

### فاز ۱۰ — hal نهایی + UX فرم (تموم)
- ۲۵+ fix روی hal
- ۹ باگ پنهان کشف شد:
  - `zoneId` در buildPayload نبود
  - `litter_roll ≠ paper_roll` (۱۰ برابر خطا!)
  - `birdId` از `breedId` مشتق می‌شد
  - `fan_tunnel stdKey` غلط
  - `lamp_led stdKey` غلط
  - و ۴ مورد دیگر
- گروه‌بندی بصری فرم‌ها (۵ + ۴ گروه)
- حذف گروه ⚙️ سیستم‌ها (Single Source)
- sync کامل Hall ↔ Equipment
- `saveAttempted` + `onErrorClear`
- auto-fill فارسی + اعداد فارسی
- KPI Cards دو ستونه
- استاندارد دانخوری/آبخوری ۸ نژاد
- ۲۲ hint استاندارد

### فاز ۱۱ — Zones بهبود (تموم)
- `crossError` — بلاک save اگر مجموع > سالن
- توکنی‌سازی کارت «ارثی از سالن»
- استخراج `ZoneCard.tsx`
- ZonesPage ۴۱۹ → ۳۹۰ (⚠️ بعداً دوباره ۴۴۴ شد)
- صفر any در Zone*
- حذف ایموجی ⚠️
- رنگ `--warn` → `--danger`

### فاز ۱۲ — تجهیزات hal (تموم)
- حذف کد تکراری EquipmentFormModal
- hook `useBodyScrollLock`
- HallEquipSection زیر ۴۰۰

### فاز ۱۳ — hal قفل نهایی (تموم)
- **hal ۱۰۰٪** — صفر any واقعی
- تب آرشیو (Segmented Control)
- ۲ زیرنوع جدید feeder + ۱ drinker
- ۶ دسته گم‌شده اضافه
- KPI Cards تجهیزات
- Zod limits واقع‌بینانه
- `autoClamp` در blur (نه تایپ)
- placeholder داینامیک
- EquipmentCard ۲۳۷ → ۱۵۹
- useBodyScrollLock ساده

### فاز ۱۴ — flk + Carousel + Smart Capacity (تموم)
- flk قفل ۹۵٪ — FilterBar + smart capacity + KPI + touched errors
- Carousel در alt/ctc/dlg
- useFormErrors hook (Reward Early/Punish Late)
- useCarousel v4 (deps + MutationObserver)
- `hallCapacity` با منطق کامل + ۱۱ تست
- separator `•` در ۶۹ فایل
- ⚠️ باقی‌مانده: FlocksModal ۴۲۴ · ZonesPage ۴۴۵ · Debug box

### فاز ۱۵ — Event Bus + گروه‌بندی گله (جلسه ۱۲)
- ✅ ساخته شده: `cor/events/` (۵ فایل)
- ✅ ۱۸ event type تعریف شده
- ⚠️ **فقط ۲/۱۸ فعال** (فقط `dlg → flk`)
- ✅ سیستم گروه‌بندی کامل:
  - GroupsPage (۵۳۱)
  - FlockGroup + FlockGroupRule + FlockGroupMember
  - FlockGroupType: season/breed/cohort/farm/owner/custom/smart
  - MergeFlocksModal + GroupTimeline + GroupComparisonModal
  - FlockDealType: own/partnership/consignment/rent
- 🟡 **در اسناد قبلی کشف‌نشده بود**

## 📋 Roadmap — کارهای آینده

### 🔴 بحرانی (اولویت ۱)

| # | کار | زمان | ریسک |
|---|---|---|---|
| ۱ | **Event Bus فعال‌سازی** (۱۶/۱۸) | ۲-۳ روز | معماری |
| ۲ | **catch خالی hal** (۷ مورد) | ۱ ساعت | باگ خاموش |
| ۳ | **showAlert → Toast** (۱۵ مورد) | ۲ ساعت | قانون |
| ۴ | **any در inc** (۱۵۵) | ۲ روز | بدهی |
| ۵ | **any در set** (۱۲۲) | ۲ روز | بدهی |

### 🟡 مهم (اولویت ۲)

| # | کار | زمان |
|---|---|---|
| ۶ | refactor flk/store (819) | ۱ روز |
| ۷ | refactor alt/rules (589) | ۱ روز |
| ۸ | refactor flk/GroupsPage (531) | ۱ روز |
| ۹ | refactor inc/DevicesPage (506) | ۱ روز |
| ۱۰ | refactor hal/ZonesPage (444) | نیم روز |
| ۱۱ | any در shr (۸۸) | ۱ روز |
| ۱۲ | any در whs (۶۴) | ۱ روز |
| ۱۳ | any در brd (۶۱) | ۱ روز |
| ۱۴ | refactor tra/ReceivablesPage (438) | نیم روز |

### 🟢 قابل تعویق (اولویت ۳)

- ۱۳ فایل ۴۰۰-۵۰۰ خط باقی‌مانده
- ۱۰ اتصالات بین‌ماژولی ناقص
- `Decimal.js` (دقت اعشاری)
- Multi-Select گله‌ها
- TanStack Virtual
- تقویم Doran Calendar
- i18n پایه
- Driver.js (تور آموزشی)
- E2E Tests (Playwright)

### 🔵 بلندمدت

- PWA offline کامل
- Backend (Supabase multi-user)
- Auth + Cloud Sync
- iOS (Capacitor)
- React Native

## ❓ سؤال‌های باز (منتظر جواب کاربر)

### سؤال ۱ — داکتور
منظور «داکتور» کدومه؟
- A) پوشه `docs/` (مستندات) ← **این جلسه انجام شد**
- B) ماژول دامپزشک (Doctor)
- C) داکیومنت برای کاربر نهایی

### سؤال ۲ — گروه‌بندی گله
سیستم کامل ساخته شده (`GroupsPage` ۵۳۱ خط) ولی در اسناد کشف‌نشده بود:
- refactor به زیر ۴۰۰؟
- قابلیت جدید اضافه شه؟

### سؤال ۳ — Event Bus
۱۶/۱۸ ایونت غیرفعال:
- فعال‌سازی کامل (کدوم اولویت؟)
- یا فقط `dlg→flk` کافیه؟

### سؤال ۴ — فایل‌های بزرگ
refactor چه ترتیبی؟
- بزرگ‌ترین اول (flk/store)
- یا کم‌ریسک‌ترین اول (hal/ZonesPage)

## 📊 آمار پیشرفت

| فاز | وضعیت |
|---|---|
| ۱-۷ (پایه) | ✅ ۱۰۰٪ |
| ۸-۱۳ (hal + ابزار) | ✅ ۱۰۰٪ |
| ۱۴ (flk) | 🟡 ۹۵٪ |
| ۱۵ (Event Bus) | 🟡 ۱۱٪ |
| بدهی فنی | 🟡 ۳۰٪ |

## 🎯 ترتیب پیشنهادی اجرا

### هفته ۱ — زیرساخت
1. Event Bus فعال‌سازی (اولویت اصلی)
2. catch خالی hal
3. showAlert → Toast

### هفته ۲ — پاکسازی
4. any در inc
5. any در set
6. refactor flk/store

### هفته ۳ — refactor
7. alt/rules
8. flk/GroupsPage
9. inc/DevicesPage
10. hal/ZonesPage

### هفته ۴ — قابلیت جدید
11. Multi-Select گله‌ها
12. Decimal.js
13. TanStack Virtual

## 📌 یادداشت مهم

**ترتیب اولویت کاربر:**
۱. رفع بدهی فنی (Event Bus، catch، any)
۲. refactor فایل‌های بزرگ
۳. قابلیت جدید
۴. بلندمدت

**قانون:** قبل از هر قابلیت جدید → بدهی موجود رفع شه.

---

*آخرین به‌روزرسانی: ۱۴۰۴/۰۷/۲۱ — جلسه ۱۲*
*این سند تاریخچه + Roadmap است. وضعیت فعلی → `HANDOFF.md`*
