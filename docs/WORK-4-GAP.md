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

== ۳-ب. شواهد استاندارد جهانی (نقل قول مستقیم) ==

منبع ۱ — web.dev (Google)، Philip Walton
  آدرس: web.dev/articles/indexeddb-best-practices-app-state

  «While IndexedDB makes it possible to store large, nested objects as a
   single record (and doing so is admittedly quite convenient), this
   practice should be avoided. The reason is because when IndexedDB stores
   an object, it must first create a structured clone of that object, and
   the structured cloning process happens on the main thread. The larger
   the object, the longer the blocking time will be.»

  «most of the popular state management libraries work by managing your
   entire state tree as a single JavaScript object ... storing the entire
   state tree as a single record in IndexedDB ... will result in
   unnecessary blocking of the main thread, it will increase the likelihood
   of write errors, and in some cases it will even cause the browser tab to
   crash or become unresponsive.»

  «Instead of storing the entire state tree in a single record, you should
   break it up into individual records and only update the records that
   actually change.»

  «you should always be measuring the performance impact of the code you
   write ... It's important to measure so you understand what you're
   optimizing for.»

  نتیجه: pm-dlg دقیقا همان الگوی ممنوعه است. کار ۱ (هارنس pm-bench) همان
         اندازه گیری مورد درخواست این سند بود.

منبع ۲ — RxDB، slow-indexeddb
  آدرس: rxdb.info/slow-indexeddb.html

  «Inserting 1k documents with one transaction per write, takes about 2
   seconds. Interestingly if we increase the document size to be 100x
   bigger, it still takes about the same time to store them. This makes
   clear that the limiting factor to IndexedDB performance is the
   transaction handling, not the data throughput.»

  «Partitioning the documents horizontally into multiple IndexedDB stores,
   has shown to have a big performance improvement in write- and read
   operations ... sharding should always be done by IDBObjectStore and not
   by database.»

  نتیجه: ترس از «تراکنش زیاد کند است» بی پایه است — ما تعداد تراکنش را
         زیاد نمی کنیم (هر ذخیره یک لاگ است، نه N لاگ). و اگر روزی لازم
         شد، شکستن در سطح object store درست است، نه ساخت دیتابیس جدید.

منبع ۳ — مستندات رسمی Zustand
  آدرس: zustand.docs.pmnd.rs/reference/integrations/persisting-store-data

  «using an asynchronous storage does come with a cost ... With
   asynchronous hydration, the Zustand store will be hydrated later on, in
   a microtask ... the store will not be hydrated at the initial render.»

  نتیجه: onRehydrateStorage با isLoading در dlg/store.ts خط 312-319 همان
         الگوی رسمی Zustand است، نه اختراع ما. درست است.

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

== ۴-ب. تصمیم معماری نهایی (تصویب شد) ==

تاریخ تصویب: 1405/08/27
انتخاب: گزینه ۳ — Hybrid

تعریف:
  IndexedDB  = منبع حقیقت (source of truth)
  آرایه RAM  = کش خواندن (read cache)، نه منبع حقیقت

قواعد:
  1. هر نوشتن: اول IDB، بعد کش RAM. اگر IDB شکست خورد، کش عوض نمی شود.
  2. هر خواندن: از کش RAM (سریع). کش با باز شدن برنامه از IDB پر می شود.
  3. آرایه از RAM حذف نمی شود (قید R10).
  4. سیزده بلوک migrate دست نمی خورند (R8).
  5. restore در atomic/stores.ts باید IDB را هم برگرداند (R7).
  6. ۱۹ خواننده فعلی بدون تغییر کار می کنند؛ بازنویسی شان کار ۴-ج است.

گزینه های رد شده و دلیل:
  گزینه ۱ (write-through ساده): دیوار نوشتن حل نمی شود — web.dev صریحا
    می گوید نوشتن کل state tree در هر تغییر ممنوع است.
  گزینه ۲ (حذف آرایه از RAM): خلاف توصیه صریح web.dev درباره private
    browsing و کمبود فضا (R10).

معیار پذیرش:
  الف) grep -c "s => s.logs" src/ برابر ۰ شود (در فاز ۴-ج)
  ب) یک رکورد = یک ردیف در IDB، نه یک رشته کل آرایه
  ج) undo پس از reload هم کار کند (نه فقط در همان نشست)
  د) count(hot) + count(archive) برابر count(کل)
  ه) پشتیبان/بازیابی کار ۲ نشکند

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

== ۶-ب. ریسک‌های تازه (R7 تا R10) — پس از خواندن کامل کد ==

پس از خواندن کامل سه فایل زیر، چهار ریسک تازه پیدا شد که در نسخه اول این سند نبود:

  src/mod/dlg/hooks/useDlgSave.ts   (778 خط)
  src/mod/dlg/store.ts              (543 خط)
  src/cor/atomic/stores.ts          (167 خط)

R7 — undo فقط در حافظه کار می‌کند، نه در IndexedDB
  محل: src/cor/atomic/stores.ts خط 22
  کد: restore: (snap) => useDlg.setState({ logs: snap })
  مشکل: این خط فقط آرایه RAM را برمی گرداند. اگر logs رکورد-محور شود و
        ذخیره در IDB انجام شود، undo یک no-op بی صدا می شود روی دیسک.
        دقیقا همان الگوی باگ «بازیابی بی صدا» کار ۲.
  راه حل: restore باید هم RAM و هم IDB را برگرداند (در گزینه ۳).

R8 — سیزده بلوک migrate روی persisted.logs.map کار می کنند
  محل: src/mod/dlg/store.ts خطوط 321 تا 455
  مشکل: هر ۱۳ بلوک مهاجرت شکل persisted.logs را به عنوان آرایه فرض
        می کنند. اگر کلید یا شکل عوض شود، هر ۱۳ بلوک می شکنند.
  راه حل: در گزینه ۳ آرایه در pm-dlg باقی می ماند، پس migrate دست
        نمی خورد. مهاجرت به IDB یک بار و جداگانه انجام می شود.

R9 — هشت نقطه نوشتن، هر بار کل آرایه را سریالایز می کند
  محل: src/mod/dlg/store.ts خطوط 211، 214، 233، 250، 265، 278، 291، 292، 297
  مشکل: add/update/addCorrection/revokeCorrection/addEvent/revokeEvent/
        remove/archive/restore همه با map یا filter کل آرایه را می سازند،
        و persist کل آرایه را به یک رشته تبدیل و در IDB می نویسد.
        این همان دیوار نوشتن است.
  راه حل: در گزینه ۳ نوشتن از IDB شروع می شود (یک رکورد)، سپس کش RAM.

R10 — آرایه نباید از RAM حذف شود (قید طراحی، نه انتخاب)
  منبع: web.dev، بخش «Writes to storage may fail»
  نقل قول: «it's generally a good idea to keep application state in memory
            (in addition to storing it), so the UI doesn't break when
            running in private browsing mode or when storage space isn't
            available.»
  پیامد: گزینه ۲ (حذف کامل آرایه از RAM) رد می شود. آرایه باید بماند،
         اما فقط به عنوان کش خواندن.

== ۷. چیزی که در این سند نیست (عمدی) ==

  کد — این سند تصمیم است، نه پیاده‌سازی
  عدد آستانه آرشیو — از لایه ۰ می‌آید
  UI — کار ۶
  سرور — کار ۱۰
