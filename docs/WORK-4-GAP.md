# سند شکاف — کار ۴: بازطراحی رکورد-محور dlg

وضعیت: سند تصمیم (قبل از کد)
تاریخ: 1405/08/27
پیش‌نیاز: کار ۱ تمام · کار ۲ تمام · کار ۳ لایه ۱ تمام

== ۱. مسئله ==

pm-dlg در IndexedDB یک کلید-مقدار تکی است:

  DB: pm-state -> store: zustand -> key: "pm-dlg" -> value: "[{...},{...},...]"

کل آرایه لاگ‌ها به صورت یک رشته JSON ذخیره می‌شود. نتیجه:

  ۱. ذخیره یک لاگ = serialize و نوشتن کل آرایه
     یک سال = ۶۷ تا ۱۶۸ مگابایت در هر ذخیره
  ۲. بارگذاری = parse کل آرایه در RAM
     Zustand کل آرایه را نگه می‌دارد (دو تا سه برابر خام)
  ۳. فیلتر = array.filter در حافظه
     ۶۴ عملیات آرایه‌ای در ۱۹ فایل
  ۴. آرشیو = بریدن همان بلاب
     فقط جابه‌جایی، نه درمان

معیار پذیرش نهایی (از سند معماری): یک رکورد = یک ردیف.

== ۲. نقشه واقعی (اندازه‌گیری‌شده، نه حدس) ==

  ارجاع مستقیم .logs ............ ۶۲
  فایل یکتا ..................... ۱۹
  فایل بیشتر از ۵۰۰ خط .......... ۴
  عملیات آرایه‌ای ................ ۶۴
  نقاط نوشتن .................... ۸

۲.۱ هسته نوشتن (۲ فایل — قفل‌شده)

  src/mod/dlg/store.ts (۵۴۳ خط)
    logs: DailyLog[] در خط ۱۷۰
    logs: [] در خط ۱۹۴
    add در خط ۲۱۱
    update در خط ۲۱۵
    corrections در خط ۲۳۴ تا ۲۷۹
    remove در خط ۲۹۱
    restore در خط ۲۹۳
    خط ۲۹۸

  src/mod/dlg/hooks/useDlgSave.ts (۷۷۸ خط)
    save
    deleteLog در خط ۴۸۵
    restoreLogFull
    applyCorrectionAtomic
    revokeCorrectionAtomic

خبر خوب: نوشتن متمرکز است.
خبر بد: ۷۷۸ خط دیده‌نشده.

۲.۲ خواننده سنگین (۴ فایل بیشتر از ۵۰۰ خط)

  flk/components/FlockHistoryModal.tsx (۱۰۵۰ خط)
    rawLogs.map(applyCorrections) — کل آرایه — ریسک بالا

  dlg/hooks/useDlgSave.ts (۷۷۸ خط)
    هسته — ریسک بالا

  alt/rules.ts (۶۱۳ خط)
    قواعد — ریسک متوسط

  dsh/hooks/useDashboardData.ts (۵۱۵ خط)
    const { logs: rawLogs } = useDlg() — بدون selector — باگ کارایی

۲.۳ خواننده سبک (۱۳ فایل)

  DlgTabPanel (۶۳)
  AggregateTabPanel (۲۱)
  FlockPickerSheet (۲۷)
  useDlgForm (۸۷)
  useGroupKpi (۸۴ و ۲۱۲)
  useGlobalSearch (۴۶)
  flocksCalc
  analytics (۹۸ و ۱۰۵ و ۱۱۲)
  helpers-audit (۱۵۴)
  migrations-feed (۲۷)
  storageDebug (۸۹ و ۹۲)
  storageBench (۸۱)
  atomic/stores (۲۲)
  storage/index
  storage/local
  storage/types
  main.tsx
  cal/store.ts

۲.۴ دو یافته جانبی

الف) atomic/stores.ts خط ۲۲ — undo سراسری:

  restore: (snap) => useDlg.setState({ logs: snap }),

هر بازطراحی باید snapshot و restore را پوشش دهد، وگرنه undo می‌شکند.

ب) storageDebug.ts خط ۹۲ و storageBench.ts خط ۸۱ از JSON خام می‌خوانند:

  logs = Array.isArray(parsed?.state?.logs) ? parsed.state.logs : [];

این دو مقاوم به بازطراحی‌اند. هارنس سنجش بعد از کار ۴ هم کار می‌کند.

== ۳. استاندارد جهانی ==

  شکل ذخیره ..... object store با keyPath: 'id' .... MDN IndexedDB, idb docs
  ایندکس ......... date, flockId, status ........... rxdb.info/slow-indexeddb
  خواندن ......... cursor و limit، نه getAll ....... Google web.dev/idb
  تقسیم افقی ..... object store جدا برای هر موجودیت . rxdb.info
  حذف نرم ........ active=false (Odoo) ............. Odoo data_cleaning
  ممیزی .......... ALCOA+ / 21 CFR Part 11 ......... سند معماری

نتیجه: pm-dlg باید یک object store مستقل با keyPath: 'id' باشد،
نه یک کلید در zustand.

== ۴. چهار مرحله — هرکدام تصویب جدا ==

مرحله ۴-الف — useDashboardData selector-دار

  فایل ........... src/mod/dsh/hooks/useDashboardData.ts (۵۱۵ خط)
  تغییر .......... const { logs: rawLogs } = useDlg()
                   تبدیل به
                   const rawLogs = useDlg(s => s.logs)
  خط ............. ۵۸
  ریسک ........... صفر — رفتار یکسان، فقط re-render کمتر
  معیار پذیرش .... tsc پاس + داشبورد کار کند +
                   grep -c "= useDlg();" صفر شود
  وابستگی ........ هیچ

مرحله ۴-ب — dlg/store.ts رکورد-محور

  فایل ........... src/mod/dlg/store.ts (۵۴۳) + useDlgSave.ts (۷۷۸)
  تغییر .......... logs: DailyLog[] در حافظه بماند (سازگاری)،
                   ولی نوشتن به object store برود
  الگو ........... Write-through cache
                   حافظه منبع نمایش، IDB منبع حقیقت
  API جدید ....... getLogsByFlock(flockId, from?, to?, limit?)
                   getLogById(id)
                   putLog(log)
                   deleteLogById(id)
  API سازگار ..... logs getter که آرایه بارگذاری‌شده را برمی‌گرداند
                   (برای ۱۹ خواننده)
  ریسک ........... بالا — undo، corrections، پشتیبان
  معیار پذیرش .... ۱. pm-dlg دیگر رشته آرایه نباشد
                   ۲. undo کار کند
                   ۳. count(hot) + count(archive) == count(کل)
                   ۴. پشتیبان و بازیابی کار ۲ نشکند
  وابستگی ........ ۴-الف

مرحله ۴-ج — مهاجرت ۱۳ خواننده سبک

  فایل‌ها ......... ۱۳
  تغییر .......... useDlg(s => s.logs)
                   تبدیل به
                   useDlg(s => s.getLogsByFlock(...))
  ریسک ........... متوسط — هر فایل یک تست
  معیار پذیرش .... grep -c "s => s.logs" صفر شود
  وابستگی ........ ۴-ب

مرحله ۴-د — شکستن ۴ فایل غول و مهاجرت

  فایل‌ها ......... FlockHistoryModal (۱۰۵۰)
                   useDlgSave (۷۷۸)
                   alt/rules (۶۱۳)
                   useDashboardData (۵۱۵)
  تغییر .......... شکستن به کمتر از ۵۰۰ خط (قانون ۳۲)
                   و مهاجرت به API جدید
  ریسک ........... بالا
  معیار پذیرش .... هیچ فایل بیشتر از ۵۰۰ خط که logs را لمس کند
  وابستگی ........ ۴-ج

== ۵. سیاست‌های تصویب‌شده (بدون تغییر) ==

  ۱. هرگز حذف نکن، همیشه نگه دار، فقط جابه‌جا کن ..... تصمیم کاربر
  ۲. آستانه از اندازه‌گیری، نه حدس ................... سند لایه ۳
  ۳. count(hot) + count(archive) == count(before) .... معیار پذیرش
  ۴. undo باید همیشه کار کند ........................ atomic/stores.ts
  ۵. پشتیبان کار ۲ نباید بشکند ...................... کامیت 3563f790
  ۶. هر تغییر = کامیت و push ........................ safe-commit.sh

== ۶. ریسک‌های شناخته‌شده ==

  ۱. useDlgSave.ts ۷۷۸ خط دیده‌نشده
     کاهش: قبل از ۴-ب کامل خوانده شود
  ۲. undo سراسری می‌شکند
     کاهش: تست undo قبل و بعد
  ۳. corrections روی آرایه کار می‌کنند
     کاهش: applyCorrections باید با رکورد کار کند
  ۴. پشتیبان pm-dlg را کلید می‌داند
     کاهش: rawStore باید store جدید را بشناسد
  ۵. مهاجرت داده موجود
     کاهش: اسکریپت یک‌باره + تست روی داده واقعی
  ۶. alt/rules.ts قواعد را از آرایه می‌خواند
     کاهش: باید ورودی‌محور شود

== ۷. چیزی که در این سند نیست (عمدی) ==

  کد — این سند تصمیم است، نه پیاده‌سازی
  عدد آستانه آرشیو — از لایه ۰ می‌آید
  UI — کار ۶
  سرور — کار ۱۰
