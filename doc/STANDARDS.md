# STANDARDS.md — استانداردهای پروژه Bird-new

نسخه 1.0 | تاریخ ۱۴۰۵/۰۷/۰۷ | Baseline b687201

هدف: قواعد اجباری برای همه کد، فیلد، کامپوننت، کامیت.

قاعده کلی: هر خط کد که این استاندارد را نقض کند → Code Review رد می‌شود.

---

## ۱. استاندارد ۱۰ نقطه‌ای فیلد

هر فیلد باید این ۱۰ مورد را چک کند:

۱. لیبل درست — label="نام"
۲. placeholder مناسب — "مثلاً: ذرت"
۳. RTL/LTR اعداد — dir="ltr" + inputMode="numeric"
۴. unit — unit="kg" یا unit="تومان"
۵. min/max — اجباری برای عددی‌ها
۶. required — فقط وقتی واقعاً لازم
۷. hint — راهنمای کوتاه
۸. validation — خطای واضح زیر فیلد
۹. ذخیره — لاتین در store، نمایش فارسی
۱۰. نمایش کارت — با واحد درست

مثال درست:

Field label="حداقل دما" hint="۱۵-۳۰ درجه" required
  Input mode=number dir=ltr unit=°C min=-10 max=50 autoClamp
  placeholder=۲۰
  error={err}

---

## ۲. قواعد RTL و LTR

- کل صفحه: RTL
- اعداد: dir=ltr + inputMode=numeric
- دکمه تایید: راست، لغو: چپ
- اعداد فارسی نمایش، لاتین ذخیره
- tabular-nums برای ترازبندی
- placeholder: در RTL باید متن فارسی قبل از واحد بیاید

## ۳. قواعد Empty State

- هر لیست خالی → Empty با آیکون، عنوان، توضیح، دکمه
- هر summary خالی → hint آموزشی (نه ۰ یا NaN)
- مثال: اگر نمونه وزن نیست → «حداقل ۳ نمونه اضافه کن تا میانگین محاسبه شود»
- کارت خالی → پنهان شود، نه نمایش با عنوان «رکورد ۱»

## ۴. قواعد Validation

- validation در blur + submit
- پیام خطا زیر فیلد (error prop)
- هشدار با warn (زرد)
- خطا با error (قرمز)
- نمایش فارسی، بدون اصطلاح فنی

## ۵. قواعد a11y (WCAG 2.1 AA)

- هر button: aria-label یا محتوای معنادار
- هر modal: role=dialog، aria-modal، aria-labelledby
- Focus trap در modal
- Esc بسته شود
- کنتراست ≥ 4.5:1
- aria-pressed برای toggle
- aria-hidden برای تزئینی‌ها

## ۶. قواعد نام‌گذاری

- ماژول: ۳ حرف کوچک (tra, dlg, flk)
- Store: use{Module} (useTra)
- کامپوننت: PascalCase (SalesPage)
- فایل: PascalCase.tsx
- تابع: camelCase
- ثابت: UPPER_SNAKE
- تایپ: PascalCase
- CSS var: --kebab-case

## ۷. قواعد Export

روش رسمی: export function/const (named)
استثنا: default فقط برای کامپوننت‌های صفحه (Page)
دلیل: هماهنگی، تست ساده، IntelliSense بهتر

## ۸. قواعد Git Commit

فرمت: نوع(ماژول): توضیح
انواع: feat | fix | refactor | style | docs | chore | test | perf
مثال: feat(Input): add Enter key navigation
هر commit = یک تغییر منطقی
پیام فارسی یا انگلیسی (یکسان در همه)

## ۹. قواعد تست قبل commit

اجباری:
- npm run build موفق باشد
- tsc --noEmit بدون خطا
- صفحه مورد تغییر باز شود

## ۱۰. لیست سیاه (ممنوع)

- position absolute برای بازشو
- margin دستی
- رنگ هاردکد
- !important
- انیمیشن > 300ms
- کد تکراری (DRY)
- فایل .bak/.save در src
- Import default برای کامپوننت‌های مشترک

## ۱۱. الگوهای اجباری

- همه کارت‌ها: ExpandableCard
- همه Modal: از ui.tsx
- فیلد عددی: NumField (بعد از ساخت)
- فیلد مبلغ: MoneyField (بعد از ساخت)
- لیست‌های >8 آیتم: SmartSelect

## ۱۲. Definition of Done هر ماژول

- همه فیلدها ۱۰ نقطه‌ای OK
- Empty State هوشمند
- Validation کامل
- RTL/LTR درست
- a11y چک‌شده
- build موفق
- آدیت ثبت‌شده در AUDIT-REPORT

## ۱۳. پیگیری

بازبینی: هر فاز
به‌روزرسانی: فقط با commit جدید
مرجع: AUDIT-REPORT + TECH-DEBT

پایان · v1.0 · ۱۴۰۵/۰۷/۰۷
