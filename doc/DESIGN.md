# DESIGN.md — سیستم طراحی

نسخه ۱.۰ — قفل‌شده

## فلسفه
۱. کاربر پسند
۲. انعطاف کامل
۳. استاندارد جهانی
۴. سازگار با ایران
۵. Progressive Disclosure

## توکن‌های رنگ (تم روشن)
--bg:#f1f5f9
--card:#fff
--border:#e2e8f0
--text:#0f172a
--muted:#64748b
--dim:#94a3b8
--accent:#16a34a
--accent-soft:rgba(22,163,74,.12)
--warn:#d97706
--danger:#dc2626
--info:#0284c7
--purple:#7c3aed
--overlay:rgba(15,23,42,.5)

## توکن‌های رنگ (تم تیره)
--bg:#0f172a
--card:#1e293b
--border:#334155
--text:#e2e8f0
--muted:#94a3b8
--dim:#64748b
--accent:#22c55e
--warn:#f59e0b
--danger:#ef4444
--info:#38bdf8
--purple:#a78bfa

## فاصله (Spacing)
--sp-1:4px --sp-2:8px --sp-3:12px --sp-4:14px
--sp-5:16px --sp-6:20px --sp-7:24px --sp-8:32px

## فونت
--fs-xs:10px --fs-sm:11px --fs-base:12.5px
--fs-md:13.5px --fs-lg:15px --fs-xl:18px --fs-2xl:22px
فونت: Vazirmatn از CDN

## گوشه
--r-sm:8px --r-md:10px --r-lg:12px --r-xl:16px --r-2xl:20px

## Z-index
--z-header:12 --z-sticky:20 --z-fab:30
--z-drawer:50 --z-modal:100 --z-toast:200

## انیمیشن
--ease-out:cubic-bezier(.16,1,.3,1)
--ease-in:cubic-bezier(.4,0,1,1)
--dur-fast:150ms --dur-base:200ms
--dur-slow:250ms --dur-enter:300ms

قانون: translateY کمتر از ۴px ممنوع (پرش)

## کامپوننت‌ها
Button: 38px ارتفاع، primary/ghost/danger/outline
Input: 38px، مقاوم‌سازی با min-width:0
Card: نوار رنگی 4px سمت راست
Modal: از پایین، Focus trap، Esc
Toast: بالا وسط، بدون پرش
Tabs: زیرخطی
Calendar: سال/ماه/روز + نمایش تاریخ
Progress: حلقه 38px

## RTL
- html dir="rtl"
- دکمه‌ها: تأیید راست، لغو چپ
- ورودی اعداد: dir="ltr"
- اعداد: tabular-nums
- نمایش فارسی، ذخیره لاتین

## قواعد فرم
فیلد کوتاه → ۲ ستونه
فیلد بلند → ۱ ستونه
گرید: minmax(0,1fr)

فیلد وابسته: grid-template-rows 0fr→1fr
با transition-delay:80ms روی محتوا

## لیست سیاه
position:absolute برای بازشو ممنوع
margin دستی ممنوع
رنگ هاردکد ممنوع
!important ممنوع
انیمیشن بیشتر از ۳۰۰ms ممنوع


## توکن‌های تکمیلی (v1.0.1)

### رنگ‌های soft (پس‌زمینه‌ی ملایم)
--accent-soft, --warn-soft, --danger-soft, --info-soft, --purple-soft

### رنگ‌های border و bg اختصاصی
--accent-border, --border-solid, --input-bg, --btn-bg, --card-solid, --header-bg

### عناصر
--avatar-text, --shadow

### Z-index (طبق لایه‌بندی استاندارد)
--z-header: 12, --z-sticky: 20, --z-fab: 30
--z-drawer: 50, --z-modal: 100, --z-toast: 200
