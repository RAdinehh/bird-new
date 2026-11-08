# 🤖 HANDOFF v11 — تحویل به AI جدید

> تاریخ: 1405/11/08
> جلسات: 9 + 10 + 11
> آخرین commit: bc503023 (origin/main)

---

## 🎯 پروژه چیست

Bird-new — نرم‌افزار مدیریت مرغداری (PWA فارسی، RTL، آفلاین، multi-user آماده)

Stack: React 18 + TypeScript + Vite + Zustand + Vitest

مسیر: ~/Bird-new
Dev: localhost:3000

---

## 📊 وضعیت git

HEAD = origin/main = bc503023
tsc: پاس
tests: ۱۹۲۳ پاس + ۱۷ skip
working tree: تمیز

قبل از هر کار:
  cd ~/Bird-new
  git log --oneline -5
  git status --short
  npx tsc --noEmit
  npx vitest run   (۵ دقیقه)

⚠️ تست کامل ۵ دقیقه. برای verify سریع از تست‌های هدف استفاده کنید.

---

## 🎯 ۳ جلسه — خلاصه

### جلسه ۹ (۴۶ commit)
- audit ۹ فاز dlg (۳۴ فیلد)
- C1 (۱۶): موتور calc — ۱۴۰ تست
- C2 (۴): اتصال calc به dlg
- D (۴): validation dlg — ۲۲ تست
- D4 (۴): Intelligence standards-aware — ۲۰ تست
- A (۵): مدل داده dlg (shift, birdAgeDays, feedConsumed)
- A3 (۱): sourceType + double-count fix
- C7 (۴): پاک‌سازی (shift, brokenTarget, EggDiscard)
- C3 (۷): اتصال calc به dsh/flk (hen-day, feedConsumed, ۸ alert)

### جلسه ۱۰ (۴ commit)
- D5.1: cor/atomic/ (transaction + stores)
- D5.2: cor/storage/ (StorageAdapter)
- D5.3: cor/outbox/ (Outbox Pattern)

### جلسه ۱۱ (۱۲ commit)
- D5.5-B1b: flockId/date guard
- D5.5-B1c: activeWithdrawal cleanup (minimal)
- D5.5-B2: save() atomic
- D5.5-B3: deleteLog atomic + bulk fix
- D5.5-B4: ۵ تست atomic
- D5.5-B5: docs update
- B4-Recalc: activeWithdrawal recompute (کامل)

---

## 🏛️ معماری D5 — Atomic (فعال)

### src/cor/atomic/
- types.ts — AtomicStore, AtomicOptions, AtomicResult
- transaction.ts — atomicTransaction (preflight → snapshot → execute → rollback/commit)
- stores.ts — ۵ store ثبت‌شده (dlg, whs, egg, flk, tra)
- index.ts

### src/cor/storage/
- types.ts — StorageAdapter interface
- local.ts — LocalStorageAdapter (Zustand persist)
- index.ts — singleton `storage`

### src/cor/outbox/
- types.ts — OutboxEvent, OutboxProcessor
- outbox.ts — Outbox کلاس (publish/subscribe/retry، persist)
- processors.ts — ۱۷ processor برای AppEvents
- index.ts — singleton `outbox`

### مصرف‌کننده فعلی
- dlg (via useDlgSave) ✅

### مصرف‌کنندگان آینده (~۳۰ دقیقه هر کدام)
- tra (D6), egg (D7), inc (D8), flk (D9), whs (D10)

---

## ✅ ۷ باگ حل‌شده در D5

1. orphan movement (atomicTransaction rollback)
2. orphan egg (rollback)
3. activeWithdrawal orphan (B1c + B4-Recalc)
4. catch {} خالی (L6) — حذف
5. flockId/date تغییر در ویرایش (guard)
6. bulk delete silent باگ (DlgTabPanel)
7. activeWithdrawal logId orphan (B4-Recalc recompute)

---

## 📈 آمار ۳ جلسه

- جلسه ۹: ۴۶ commit، ~۲۵۰ تست جدید
- جلسه ۱۰: ۴ commit
- جلسه ۱۱: ۱۲ commit، ۵ تست جدید
- جمع: ۶۲ commit، ~۲۵۵ تست جدید

تست کل: ۱۹۲۳ پاس + ۱۷ skip
صفر regression در ۳ جلسه

---

## 🎯 مسیر جلسه ۱۲

### D6-D10 — atomic برای ۵ ماژول باقی

| # | ماژول | کار | حجم |
|---|---|---|---|
| D6 | tra | updateInvoice، deleteInvoice | ~۳۰ دقیقه |
| D7 | egg | saveProduction + cascade | ~۳۰ دقیقه |
| D8 | inc | saveEggEntry + invoice | ~۳۰ دقیقه |
| D9 | flk | mergeFlocks، unmergeFlocks | ~۳۰ دقیقه |
| D10 | whs | batch movements | ~۳۰ دقیقه |

الگو برای هر ماژول:
  atomicTransaction({
    preflight: () => validate(),
    stores: [ownStore, whsStore, eggStore, flkStore],
    execute: () => cascade(),
    onSuccess: () => outbox.publish('module:entity:action', payload),
    onError: (err) => toast.error('خطا: ' + err.message),
  })

### بعد از D6-D10

- D5.4 (_v/_txid + migration v14) — همراه server
- E (UI/UX فرم ۴۷ فیلدی) — چند جلسه
- F (cross-module events) — ~۴ ساعت
- G (Draft Mode) — ~۳ ساعت
- H (گزارش/CSV) — ~۲ ساعت
- C8 (EggSale.quality در tra) — ~۲ ساعت

---

## 📋 قوانین آهنین

- ❌ کد بدون verify — grep + sed + backup
- ❌ commit بدون test — L11
- ❌ as any جدید — L5 ratchet
- ❌ catch {} خالی — L6
- ❌ > ۵ فایل در یک concept — AGENTS
- ❌ heredoc با __EOF__ در markdown — شکسته می‌شود
- ❌ /tmp در Termux — ندارد
- ❌ anchor بدون verify
- ❌ rename بزرگ بدون npx vitest run کامل
- ❌ bus.emit بدون AppEvents typed (چک کن قبل از وصل)
- ✅ ENDHANDOFF / ENDDEC / ENDPROG / END_BLOCK_N
- ✅ ~/.bird_bak/ برای اسکریپت‌های موقت
- ✅ git --no-pager diff
- ✅ یک تغییر، یک verify، یک commit
- ✅ هر feature consumer داشته باشد

---

## 📖 درس‌های کلیدی ۳ جلسه

1. بعد از rename بزرگ، npx vitest run کامل الزامی
2. ENDHANDOFF بجای __EOF__ در markdown
3. anchor line-based مقاوم‌تر از text-replace
4. rename + cascade در یک جلسه
5. audit قبل از کد (۳۴ فیلد audit = ۶ فیلد مرده)
6. هر feature consumer داشته باشد
7. توقف بعد از هر milestone
8. bus.emit رویدادهای typed (AppEvents)
9. atomic + outbox + storage = infrastructure زیرساختی
10. B4-Recalc: recompute از همه لاگ‌ها

---

## 🚀 شروع سریع

گام ۱ — setup:
  cd ~/Bird-new
  git log --oneline -5
  git status --short
  npx tsc --noEmit
  npx vitest run

گام ۲ — خواندن:
  cat HANDOFF-v11.md
  cat HANDOFF-v10.md
  cat AGENTS.md
  cat docs/CONSTITUTION.md
  tail -100 docs/DECISIONS.md
  cat ~/.bird_bak/DLG-AUDIT.md

گام ۳ — تست UI:
  /dlg (ثبت روزانه) — shift حذف شد، birdAgeDays در LogCard
  /egg — دکمه «ثبت دور ریخت»
  /alt — ۸ alert جدید
  ثبت روزانه → ذخیره → if error → «همه تغییرات لغو شد»

گام ۴ — کار اولویت‌دار:
  D6 (tra atomic) — اولین ماژول دوم

---

## 🎯 خط یک‌خطی

۳ جلسه، ۶۲ commit، ۱۹۲۳ تست پاس، صفر regression. D5 کامل: atomic + storage + outbox + dlg atomic. ۷ باگ حل. ۵ ماژول باقی (tra, egg, inc, flk, whs) — هر کدام ~۳۰ دقیقه. بعد: بخش E (UI/UX)، F، G، H.

*آخرین به‌روزرسانی: 1405/11/08*
