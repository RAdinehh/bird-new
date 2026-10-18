# 📊 PROGRESS — تاریخچه commit‌ها

> این فایل **append-only** ئه. `auto_fast.py` هر commit موفق رو اینجا ثبت می‌کنه.
> AI هر چند پیام یک بار `tail -30 docs/PROGRESS.md` بزنه → می‌فهمه کجاست.

## فرمت هر ورودی

~~~
[YYYY/MM/DD HH:MM] پیام commit
  Files: N | Lines: +A/-B
~~~

---

## تاریخچه

[2026/10/17 22:37] docs: AI-BOOT + NEXT + PROGRESS + auto_fast append

[2026/10/17 22:42] docs: تمیزکاری README

[2026/10/17 23:33] feat(whs): فعال‌سازی event bus tra→whs (invoice created/updated/deleted)

[2026/10/17 23:41] feat(whs): فعال‌سازی event bus egg→whs (production created/updated/deleted)

[2026/10/17 23:48] docs: تصحیح EVENT-BUS و NEXT بر اساس واقعیت کد (جلسه ۱۳)

[2026/10/18 00:03] fix(filter): hasActiveFilters — حذف sortState (sort ≠ filter)

[2026/10/18 00:09] fix(flk): catch خالی در hasRefs با console.error

[2026/10/18 00:20] refactor(flk): حذف ۲ any در migrate v6→v7 + تکمیل flk

[2026/10/18 01:10] docs: پایه‌سازی استاندارد — CONSTITUTION + UI-PATTERNS + DECISIONS + PARADIGM + COMPLEX-SCENARIOS + check.sh + AI-BOOT + NEXT

[2026/10/18 01:24] docs: پاک‌سازی — حذف STANDARDS (تکراری)، حفظ FOUNDATION + FOUNDATION-PATTERNS + UX-FORM-RULES

[2026/10/18 01:28] feat(scripts): session-start.sh + ۱۰ قانون UX در AI-BOOT + ۳ چک UX در check.sh (ratchet)

[2026/10/18 01:39] feat(flk): FlockBreed additive — breedKind/breedLabel + UI مختلط + ۳ تست

[2026/10/18 05:37] feat(flk): نمایش گله مختلط در FlockCard — breedLabel با badge 🔀

[2026/10/18 05:45] fix(flk): حذف type=number در GroupsPage — inputMode=numeric کافی است (ratchet 31→29)

[2026/10/18 06:09] fix(L13): توقف کاهش type=number — برگشت FilterGroupBody (formatNumWhileTyping باگ می‌ساخت) + cap→29 + DECISIONS

[2026/10/18 06:14] fix(UX): حذف emoji از ۷ پیام خطا/هشدار در Modal (ratchet 12→5)

[2026/10/18 06:30] refactor(whs): حذف ۱۶ any در MoveFormModal — تایپ F از MovesPage، Person از ctc، React.ChangeEvent (ratchet 599→583)

[2026/10/18 06:41] refactor(whs): حذف ۱۰ any در MovesPage — Movement[] و undoData تایپ‌دار (ratchet 583→573)

[2026/10/18 07:08] refactor(flk): split store.ts → helpers-store.ts (833→692 خط) — برچسب‌ها و helpers جدا شدند

[2026/10/18 07:18] refactor(flk): استخراج migrate از store.ts → migrations.ts (691→490 خط، زیر ۵۰۰)
