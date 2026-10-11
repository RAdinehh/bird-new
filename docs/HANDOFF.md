# 🤝 HANDOFF.md — سند تحویل کامل به AI بعدی

> **این فایل رو کامل بخون قبل از هر کاری.**
> آخرین به‌روزرسانی: ۱۴۰۴/۰۷/۲۰

---

## 📌 بخش ۱ — خلاصه وضعیت

### پروژه چیه؟
Bird-new — PWA مدیریت مرغداری (React 18 + TypeScript + Vite + Zustand + Zod + date-fns-jalali)

### وضعیت کلی
- tsc pass
- build موفق
- همه چی commit شده
- **کاربر از جلسه‌ی امروز ناراضی بود** — چند بار کامپوننت‌های سالم رو دست زدیم و خراب کردیم

### آخرین commit
cd7d8ad docs: مستند استثنای معماری set→hal در ARCHITECTURE.md

---

## 📚 بخش ۲ — فایل‌های مرجع

| فایل | چی داره | چرا مهمه |
|---|---|---|
| docs/HANDOFF.md (این فایل) | وضعیت + کارها | اول این |
| docs/ARCHITECTURE.md | نقشه فایل‌ها + وابستگی‌ها | ساختار کل |
| docs/AI-RULES.md | قوانین کار با کاربر | خیلی مهم |
| docs/STANDARDS.md | استانداردهای UI/UX | مرجع طراحی |
| docs/AUDIT.md | چک‌لیست ممیزی ۷ محوره | برای AUDIT ماژول‌ها |
| docs/STATUS.md | وضعیت زنده + نقشه راه | تاریخ پروژه |
| ~/full_audit.md | اسکن خودکار | مشکلات ساختاری |
| ~/deep_scan.md | اسکن عمیق | تحلیل معماری |

---

## 🚨 بخش ۳ — درس‌های حیاتی از جلسه امروز

### اشتباهات AI قبلی (تکرار نکن!)

1. **کامپوننت‌های سالم رو دست زد** — SelectSheetShell رو ۵ بار تغییر داد بدون این‌که لازم باشه. ۳ ساعت وقت تلف شد.
2. **آزمون و خطا** — به‌جای تحلیل درست، چند تا راه‌حل حدسی امتحان کرد.
3. **درخواست‌های چندگانه رو گم کرد** — کاربر ۴ تا کار گفت، فقط ۲ تا انجام داد.
4. **حذف چیزهایی که کاربر نگفته بود** — بدون اجازه hint حذف کرد.

### کارهای درست AI قبلی

1. ARCHITECTURE.md ساخت — نقشه کامل پروژه
2. PROJECT-GUIDE.md حذف کرد (تکراری با STATUS بود)
3. ساختار پوشه‌ها رو مستند کرد
4. set → hal رو تحلیل کرد و به عنوان استثنای آگاهانه ثبت کرد


---

## 🧠 بخش ۴ — قوانین طلایی کار با این کاربر

### قاعده ۱: کاربر کدنویس نیست
- اسکریپت Python کوتاه (زیر ۵۰ خط)
- کاربر فقط کپی/پیست می‌کنه
- به فارسی جواب بده

### قاعده ۲: یه تغییر در هر مرحله
- نکن چند تا کار با هم
- بعد از هر تغییر: python3 ~/auto_fast.py "پیام"

### قاعده ۳: کامپوننت‌های قفل‌شده (بدون اجازه صریح دست نزن!)

~~~
shr/components/SelectSheetShell.tsx
shr/components/SmartSelect.tsx
shr/components/EditableSelect.tsx
shr/components/AutocompleteSheet.tsx
shr/components/ui/Field.tsx
shr/components/ui/Input.tsx
shr/components/EntityLink.tsx
shr/components/OverrideHint.tsx
shr/components/ExpandableCard.tsx
shr/components/DependentSelect.tsx
~~~

اگه کاربر گفت «خرابه»:
1. git log --oneline -20 -- <file> بزن
2. آخرین نسخه سالم رو پیدا کن
3. git checkout <commit> -- <file>
4. commit

ممنوع: خودت fix کنی روی اینا.

### قاعده ۴: قبل از تغییر بزرگ، تأیید بگیر
- تغییر در shr/
- تغییر در layout پایه
- اضافه کردن prop به کامپوننت موجود
- تغییر در store/logic

### قاعده ۵: درخواست‌های چندگانه
اگه کاربر چند تا کار گفت:
1. همه رو لیست کن
2. لیست رو به کاربر نشون بده
3. یکی‌یکی انجام بده
4. بعد از هر مورد تیک بزن
5. آخر همه رو یادآوری کن

### قاعده ۶: کامیت‌ها

~~~
cd ~/Bird-new && python3 ~/auto_fast.py "پیام commit"
~~~

auto_fast.py خودش: tsc → build → commit → push (با rollback در صورت خطا)

### قاعده ۷: .bak ها commit نشن
.gitignore داره. حواست باشه.

---

## 📊 بخش ۵ — مشکلات کشف‌شده (بازبینی‌شده ۱۴۰۴/۰۷/۲۰)

> ⚠️ **بازبینی مهم:** هر ۵ مشکل گزارش‌شده با فایل واقعی مقایسه شد.
> نتیجه: **۳ مورد از ۵ مورد false positive** بودن (گزارش خودکار قدیمی/نادرست).
> فقط ۲ مورد واقعی موند که اونا هم **باگ نیستن، فقط عدم یکدستی سبک‌ان**.

### ❌ False Positive ها (قبلاً حل شده یا اصلاً مشکل نبوده)

**۱. Store بدون نام (cal و doc) — FALSE POSITIVE**
- `src/mod/cal/store.ts` اصلاً Zustand store نیست — یه ماژول aggregate است که از storeهای دیگه داده می‌گیره. داده‌ی خودش رو نداره که persist کنه.
- `src/mod/doc/store.ts` از **IndexedDB** استفاده می‌کنه، نه Zustand persist. خودش دائمی و مستقل است.
- **نتیجه:** داده‌ی تقویم و اسناد درست ذخیره می‌شه. هیچ باگی نیست.

**۲. فایل‌های .bak — قبلاً پاک شده**
- سه فایل گزارش‌شده اصلاً وجود ندارن. در جلسه‌ی قبلی پاک شدن. `.gitignore` هم درست تنظیم است.

**۳. dsh ناقص — FALSE POSITIVE**
- `dsh` ماژول تک‌صفحه‌ایه (فقط داشبورد). به `index.tsx` نیازی نداره چون tab wrapper نیست.
- داده رو از storeهای دیگه از طریق `hooks/useDashboardData.ts` می‌گیره. پس `store.ts` جدا لازم نداره.
- **مقایسه:** `brd` چون ۲ تب داره، `index.tsx` داره.

### 🟡 مشکلات واقعی (فقط عدم یکدستی — نه باگ)

**۴. رنگ‌های hex هاردکد — ۳۱ مورد واقعی (نه ۷۰)**
- اکثرشون `color: '#fff'` برای متن دکمه‌ها — در حالی که `--avatar-text: #ffffff` تعریف شده.
- چند مورد خاص مثل `#3b82f6` در `ExpandableCard.tsx` که توکن معادل نداره.
- فایل‌های مجاز (skip): applyTheme.ts, DebugPanel.tsx, export.ts, InvoicePrint.tsx
- **راه‌حل:** جایگزینی با توکن‌های موجود، فایل به فایل.

**۵. padding هاردکد — ۸۱ مورد واقعی (نه ۵۱۹)**
- بعضی مخصوص SVG چارت‌هاست (padding: 30, 40 در Charts).
- `padding: 0` ها از شمارش حذف شدن (reset طبیعی).
- توکن‌ها کاملن: `--sp-1..8`, `--pad-tight/normal/comfy/loose`, `--gap-xs/sm/md/lg`
- **راه‌حل:** جایگزینی با توکن‌های موجود، فایل به فایل.

### 🟢 موارد قبلی (بدون تغییر)

**۶. فایل‌های بزرگ > ۴۲۰ خط (۱۰ فایل):**
Charts.tsx (488)، BirdsPage.tsx (467)، DevicesPage.tsx (449)، ReceivablesPage.tsx (440)، InvoicePage.tsx (440)، EquipmentPage.tsx (437)، ItemsPage.tsx (436)، useDashboardData.ts (433)، EditableSelect.tsx (429 — 🔒 قفل)، StatsPage.tsx (427)

**۷. آبشار ناقص:**
فقط ۲ جا DependentSelect استفاده شده: FlocksModal, HallsFormModal

**۸. کامپوننت‌های unused:**
EmojiPicker, Skeleton, useVisualViewport — تصمیم: حذف یا استفاده؟

**۹. TODO/FIXME:**
فقط LockScreen.tsx (۲ مورد)

### 📌 نتیجه‌ی مهم برای AI بعدی

**گزارش‌های خودکار `~/full_audit.md` و `~/deep_scan.md` قدیمی و نویزدارن.**
نباید کورکورانه بهشون اعتماد کرد. هر گزارش باید با فایل واقعی verify شه.

---

---

## 🏗 بخش ۶ — معماری فعلی

### لایه‌ها

~~~
cor/    ← هسته (store, router, theme, dialog, toast, logger)
shr/    ← زیرساخت مشترک (components, hooks, filter, validation, utils)
mod/    ← ۱۷ ماژول کاربردی
test/   ← تست‌ها
docs/   ← مستندات
~~~

### گراف وابستگی (خلاصه)

~~~
set    ← پایه (همه بهش وابسته)
  |
brd    ← hal, flk, egg, inc, tra, alt, rep, cal
  |
hal    ← flk, arc, dsh, dlg, whs, inc
  |
whs    ← tra, egg, fed, dlg, hal, alt, cal, dsh
~~~

### استثناهای آگاهانه
- **set → hal** — فایل HiddenOptionsTab.tsx چک می‌کنه آپشن سفارشی توی سالن استفاده شده یا نه. رها شد.

---

## 🎯 بخش ۷ — برنامه‌ی AI بعدی

> کاربر تصمیم گرفته استاندارد کامل انجام بشه ولی **بدون شکستن پروژه‌ی فعلی**.

### فاز A — کشف دقیق (بدون تغییر)
- کامل خوندن همه‌ی فایل‌های doc
- اجرای اسکنرها اگه نیاز شد
- فهم کامل ساختار فعلی

### فاز B — سند FOUNDATION.md (فقط مستند)
- قرارداد توکن‌ها (رنگ، فاصله، فونت، radius)
- Contracts (store, filter, entity, module)
- قوانین آهنین

### فاز C — پایه‌سازی بدون شکستن
- اضافه کردن توکن‌های جاافتاده به global.css
- فقط اضافه، نه حذف

### فاز D — یکدست‌سازی تدریجی (فایل به فایل)
- هر فایل: رنگ‌های hex → توکن
- یه commit جدا برای هر فایل
- تست بعد هر تغییر

### فاز E — Registry و اتصالات
- Entity Registry (برای EntityLink)
- Filter Registry (به‌جای ۱۳ فایل دستی)
- Store Factory (استانداردسازی)

---

## 💬 بخش ۸ — حرف‌های خود کاربر

> «من می‌گم مثل ویندوز، ویندوزو چجوری می‌سازن؟ هزاران مهندس ارشد نشستن براش فکر کردن. می‌خوام اونا رو تو انجام بدی برا من تا هر جایی که می‌تونیم.»

> «این نرم‌افزاری که الان ساختیم خیلی جلو رفته. به این کاری نکنیم که سفرش کنیم. یه جاهایی مستندسازی می‌کنیم، یه جاهایی طراحی از اول، یه جاهایی عیب‌ها رو رفع می‌کنیم. شکل اصلی نرم‌افزار خیلی خوبه.»

> «مثل ویندوز همه بخشا کار خودشون رو می‌کنن، ولی تغییرات توی همه یه‌دست می‌شن.»

**ترجمه:**
- پایه رو حفظ کن
- قوانین آهنین بذار
- هر ماژول باید خودکفا باشه ولی از پایه تغذیه کنه
- مثل لایه‌های ویندوز، شفاف و مشخص


---

## 🚦 بخش ۹ — از کجا شروع کنی (AI بعدی)

### گام ۱: قبل از هر کاری

~~~
cd ~/Bird-new && git log --oneline -5 && git status -s && npx tsc --noEmit 2>&1 | tail -3 && echo "ALL OK"
~~~

### گام ۲: مستندات رو بخون (به ترتیب)
1. docs/HANDOFF.md (این)
2. docs/ARCHITECTURE.md
3. docs/AI-RULES.md
4. docs/STANDARDS.md
5. docs/STATUS.md (فقط بخش وضعیت فعلی)

### گام ۳: از کاربر بپرس
«از کجا شروع کنیم؟»
- اگه گفت «کارهای فوری» → بخش ۵ (مشکلات)
- اگه گفت «استاندارد کامل» → بخش ۷ (فاز A-E)
- اگه گفت «ادامه‌ی کار قبلی» → بپرس چی

### گام ۴: شروع کن
- یه تغییر در هر مرحله
- python3 ~/auto_fast.py "پیام" بعد هر تغییر
- اگه شکستی، **برگرد** نه این‌که fix کنی

---

## 📞 بخش ۱۰ — تماس سریع

### دستورات مهم

~~~
cd ~/Bird-new
npm run dev -- --host 0.0.0.0 --port 3000
npx tsc --noEmit
python3 ~/auto_fast.py "پیام"
git log --oneline -10
~~~

### فایل‌های کلیدی
- src/shr/styles/global.css — توکن‌ها
- src/cor/router/AppRouter.tsx — روتر
- src/shr/filter/ — سیستم فیلتر
- src/shr/validation/rules/ — Zod schemas
- src/shr/icons/equipment.tsx — آیکون‌های تجهیزات

### کامپوننت‌های کلیدی
- SmartSelect — انتخاب‌گر ساده
- EditableSelect — انتخاب‌گر با افزودن/ویرایش
- AutocompleteSheet — autocomplete با Bottom Sheet
- SelectSheetShell — پوسته مشترک هر سه تا
- EntityLink — لینک بین ماژول‌ها
- OverrideHint — نمایش تغییر استاندارد

---

## ⚠️ بخش ۱۱ — هشدار نهایی

**این پروژه ۶ ماه کاره و خیلی جلو رفته.** کاربر روش سرمایه‌گذاری کرده.

**اگه یه چیز خراب شه، ممکنه کاربر واقعاً ناراحت شه.** پس:
1. قبل از هر تغییر، ۳ بار فکر کن
2. اگه شک داری، **نکن**
3. اگه کاربر گفت «کار می‌کنه»، دست نزن
4. اگه کاربر گفت «خرابه»، **برگرد به نسخه‌ی سالم**، نه fix

**هدف نهایی:** نرم‌افزاری در سطح اپل/گوگل برای مدیریت مرغداری.

**موفق باشی!**

---

*ساخته‌شده در جلسه‌ی ۱۴۰۴/۰۷/۲۰*

---

## 🆕 به‌روزرسانی جلسه‌ی بعدی (۱۴۰۴/۰۷/۲۰)

### کارهای انجام‌شده در این جلسه

**۱. کشف ۳ false positive در گزارش‌های خودکار:**
- store بدون name در cal/doc → false (نه store هستن، نه persist دارن)
- ۳ فایل .bak → قبلاً پاک شده بودن
- dsh ناقص → false (طراحی متفاوت، تک‌صفحه‌ایه)

**۲. مستندات جدید:**
- `docs/FOUNDATION.md` — توکن‌ها + Contracts + قوانین آهنین (پایه‌ی معماری)
- `docs/AUDIT-BRD.md` — ممیزی کامل `brd` (محور ۱)

**۳. ممیزی + بهبود brd (۱۱ fix):**
- 🐛 رفع باگ `category` ghost
- 🔄 تبدیل `showAlert` → inline error
- 🧹 حذف catch خالی
- ⚡ رفع N+1 (Map گروه‌بندی)
- 🎨 توکنی کردن همه fontSize/borderRadius/padding
- 🏗 استخراج `BirdForm.tsx` و `BirdCard.tsx`
- ✅ افزودن Zod validation (`rules/brd.ts`)

**۴. آمار قبل/بعد:**
| فایل | قبل | بعد |
|---|---|---|
| `BirdsPage.tsx` | ۴۶۶ | ۲۶۶ |
| `BirdForm.tsx` | — | ۱۳۲ |
| `BirdCard.tsx` | — | ۱۷۷ |

### کارهای باقی‌مونده برای جلسه‌ی بعد

1. **`BreedsPage` refactor** (مثل BirdsPage: BreedForm + BreedCard + Zod)
2. **ادامه‌ی ممیزی brd:** محور ۴ (Accessibility) + محور ۶ (Integration)
3. **ماژول بعدی در زنجیره:** `hal` (سالن)

### نکات مهم برای AI بعدی

- **قبل از fix، همیشه با فایل واقعی verify کن** — گزارش‌های خودکار نویزدارن
- **FOUNDATION.md رو بخون** قبل از هر تغییر
- **هر fix، یه commit** — طبق دستور، نه چند تا با هم
- **توکن‌های جدید اضافه شدن:** `--fs-2xs`, `--pad-chip`, `--pad-chip-xs`, `--pad-btn-sm`, `--pad-box`


### 🆕 به‌روزرسانی دوم (۱۴۰۴/۰۷/۲۰ — جلسه‌ی دوم)

**`BreedsPage` refactor شد:**
- `BreedForm.tsx` (۱۱۷ خط) — استخراج از BreedsPage
- `BreedCard.tsx` (۱۰۵ خط) — استخراج از BreedsPage
- `BreedsPage.tsx`: از ۴۱۱ → **۲۵۹ خط** (-۳۷٪)
- حذف dead code: `fcrFromStd`, `chip`
- حذف ۲۴ import بی‌استفاده

**fix جدید:**
- افزودن `useFocusParam` به `BreedsPage` (هماهنگ با BirdsPage)
- رفع باگ: `parentPurpose` با `birdKind` پاس می‌شد (به‌جای birdType)

**ممیزی کامل شد:**
- همه ۷ محور `brd` تیک خوردن (✅)
- جزئیات در `AUDIT-BRD.md`

**آمار نهایی brd:**

| فایل | خطوط |
|---|---|
| BirdsPage | 246 |
| BreedsPage | 259 |
| BirdForm | 132 |
| BreedForm | 117 |
| BirdCard | 177 |
| BreedCard | 105 |

**همه زیر ۳۰۰ خط.** ✅
