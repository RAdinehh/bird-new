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

[2026/10/18 07:27] refactor(flk): استخراج SmartRuleEditor + GroupKpiRow از GroupsPage (529→? خط، زیر ۵۰۰)

[2026/10/18 07:38] refactor(alt): استخراج alerts-inc + alerts-helpers از rules.ts (589→? خط، زیر ۵۰۰)

[2026/10/18 07:46] docs(DECISIONS): ثبت استثنای L7 برای DevicesPage — split رد شد (ریسک > فایده)

[2026/10/18 07:54] fix(UX): showAlert → showToast در ۸ مورد (set, egg, dlg) — L4: ۱۰→۰

[2026/10/18 08:05] refactor(alt): حذف ۶ any از rules.ts — تایپ دقیق Item, AlertCategory, BirdStandard

[2026/10/18 08:16] refactor(inc): کاهش ۱۸ any + فیکس importها و bird optional (EggEntryCard)

[2026/10/18 08:26] fix(flk/groups): محاسبه تلفات از events + هزینه جاری از whs (خوراک/واکسن/دارو) — ۶ تست

[2026/10/18 08:35] fix(tra→flk): نوع گله از category فاکتور + layingStartDay/endOfCycleDay از استاندارد نژاد

[2026/10/18 08:48] feat(flk): unknownCount (v9) + deliveryCost/startDate در applyInvoiceToForm + migrate کامل

[2026/10/18 08:57] fix(UI): MultiSelectBar اسکرول افقی + مدال حذف سالن دقیق + هدر GroupsPage منظم

[2026/10/18 09:27] feat(flk): GuidedEmptyState — راهنمای سه‌مسیره برای ساخت گله (NN/g + SAP Fiori)

[2026/10/18 09:38] feat(flk): Pre-check auto-link برای فاکتور→گله — جلوگیری از تکرار (۸ تست) + فیکس hatchId

[2026/10/18 09:49] feat(flk): فیلد unknownCount در FlocksModal — فرم گله + validation + mismatch check

[2026/10/18 10:04] feat(inc): Preview Modal ساخت گله — نمایش و ویرایش خودکار مقادیر از هچ/تخم/استاندارد نژاد

[2026/10/18 10:13] refactor(inc): حذف ۵ any از HatchesPage — HatchInput.unknownCount + تایپ دقیق

[2026/10/18 10:40] feat(flk): badge «بدون سند» در FlockCard — راهنمای اتصال گله orphan به فاکتور/هچ

[2026/10/18 10:49] feat(flk): Undo برای mergeFlocks — unmergeFlocks + UndoBar (۴ تست)

[2026/10/18 11:05] fix(UI): بازسازی ۳ پچ — هدر GroupsPage منظم + MultiSelectBar اسکرول + FilterGroupBody L13

[2026/10/18 11:38] fix(UI): MultiSelectBar زیر Modal (zIndex 90) + حذف bullet point از متن مدال‌ها

[2026/10/18 12:43] feat(flk): FAB سه‌حالته — ۰ گله مخفی، ۱-۴ ثابت، ۵+ wake با اسکرول و تایمر ۳ث

[2026/10/18 13:01] feat(FAB): سه‌حالته سراسری — مخفی در Empty CTA، ثابت در کوتاه، wake در اسکرول‌پذیر

[2026/10/18 13:53] feat(flk): footer ۵۰/۵۰ (گروه جدید | Import/Export/Compare) + back button خاکستری

[2026/10/18 14:47] feat(flk): بهبود فرم گروه — حذف color مرده + placeholder هوشمند + description در لیست + cascade parent filter

[2026/10/18 14:54] feat(flk): چیدمان ۲ ستونه فرم گروه — نام بالا، نوع+والد کنار هم، smart rule زیرشان
