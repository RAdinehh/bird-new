# 🤖 HANDOFF v10 — تحویل به AI جدید

> تاریخ: 1405/11/08
> جلسه: 9 (audit + C1-D4 + A + C7 + C3)
> آخرین commit: fc6b82f9 (روی origin/main)

---

## 🎯 پروژه چیست

Bird-new — نرم‌افزار مدیریت مرغداری (PWA فارسی، RTL، آفلاین)

Stack: React 18 + TypeScript + Vite + Zustand + Vitest
ماژول‌ها: flk, tra, dlg, whs, hal, brd, egg, inc, dsh, set, ctc, fed, alt, cal
مسیر: ~/Bird-new
Dev: localhost:3000

---

## 📊 وضعیت git

آخرین commit: fc6b82f9
origin/main: fc6b82f9 (push شده)
tsc: پاس (exit 0)
tests: 1918 passed | 17 skipped (1935)
working tree: تمیز

قبل از هر کار:
  cd ~/Bird-new
  git log --oneline -5
  git status --short
  npx tsc --noEmit 2>&1 | tail -5
  npx vitest run 2>&1 | tail -5

⚠️ تست کامل ۵ دقیقه طول می‌کشد (۳۱۱ ثانیه). برای verify سریع از تست‌های هدف استفاده کنید.

---

## 🎯 کاری که جلسه ۹ انجام شد (۴۵ commit)

### C1 — موتور محاسباتی (۱۶ commit)
- C1.1 اسکلت + C1.2a/b (۸ فرمول فنی) + C1.3 (getThresholds)
- C1.4a/b/c (economics: 4 هزینه + totalCost/perKg/perEgg/revenue/profit + averages)
- C1.5a (Bovans) + C1.5b (biological cleanup)
- ۱۴۰ تست

### C2 — اتصال calc به dlg (۴ commit)
- environment warnings در calc
- LogCard از calc
- حذف ۶ تابع مرده از dlg/store

### D — Validation dlg (۴ commit)
- sumDeaths fix
- hen-day با femaleCount
- water + feedRemaining soft
- ۲۲ تست

### D4 — Intelligence standards-aware (۴ commit)
- D4a: دما/رطوبت از standards
- D4b: species/species_curve ۲۱ فیلد
- D4d: context در FeedSection + EggsWeightSection
- ۲۰ تست

### A — مدل داده dlg (۵ commit)
- A1a/A1b: shift + birdAgeDays + migration v10
- A2b/A2c: rename feedAmount→feedDelivered + feedConsumed
- A2d: FeedSystem ۵ مقدار
- A3: sourceType + duplicate check + حذف double-count inc

### C7 — پاک‌سازی (۴ commit)
- C7a: حذف shift
- C7b: حذف brokenTarget/otherTarget
- C7d: birdAgeDays نمایش در LogCard
- EggDiscard: interface + UI + calcStock

### C3 — اتصال calc به dsh/flk (۷ commit)
- C3a: hen-day با layingAliveCount (sexed-aware)
- C3b: feedConsumed در LogCard + dsh
- C3c: feedConsumed در ۶ نقطه باقی
- C3d: ۴ alert جدید (humidity/ventilation/litter/behavior)
- C3e: ۴ alert جدید (sound/distribution/water/feed)
- C3f: useGroupKpi bug fix
- C3g-fix: rename feedAmount→feedDelivered در ۵ تست

### Docs (۲ commit)
- HANDOFF v8، v9

---

## 📈 آمار دقیق جلسه ۹

- commits: ۴۵
- تست‌های جدید: ~۲۵۰ (۱۹۱۸ - ۱۷۰۰ قبل)
- تست کل: ۱۹۳۵
- فایل‌های جدید: ~۴۰
- فیلدهای مرده حذف: shift، brokenTarget، otherTarget
- فیلدهای زنده‌شده: birdAgeDays، EggDiscard، EggStock، calcStock
- باگ‌های fix: ۶
- شکاف‌های حل: hen-day sexed، feedConsumed در همه‌جا، ۸ alert جدید، دور ریخت تخم

---

## 🗂️ فایل‌های کلیدی جلسه

### src/shr/calc/ (موتور محاسباتی — ۲۳ فایل)
- formulas/: fcr، mortality، egg، weight، feed، water، stocking، epef، environment (۹ فایل)
- economics/: feedCost، vaccineCost، medicationCost، litterCost، totalCost، perKgCost، perEggCost، revenue، profit، averages (۱۰ فایل)
- thresholds/: index
- species-expected.ts (D4b)
- types.ts (۴۳۰ خط)
- index.ts

### src/shr/validation/biological-constants.ts (۱۳۳ خط — بعد از حذف ۵ تابع یتیم)

### src/mod/dlg/ (مدل داده + UI)
- store.ts (version 13)
- types.ts
- api/buildData.ts (feedConsumed، birdAgeDays)
- components/LogCard.tsx (birdAgeDays، calc برای temp/humidity)
- components/FormModal.tsx

### src/mod/egg/ (بعد از EggDiscard)
- store.ts (version 3، EggDiscard، calcStock با discards)
- components/DiscardFormModal.tsx (جدید)
- ProductionsPage.tsx

### src/mod/alt/ (سیستم هشدار)
- store.ts (AlertCategory گسترش: humidity، ventilation، litter، behavior، water، feed)
- rules.ts (۸ alert جدید)

---

## 🔍 یافته‌های مهم C1-D4 (قبل از A-C3)

### C1 — موتور calc
- ۸ فرمول فنی + ۱۱ فرمول اقتصادی + getThresholds
- ۱۴۰ تست
- یافته: biological.ts یتیم نبود (grep اول ناقص بود) — فقط ۵ تابع یتیم حذف شد
- یافته: standards/layers.ts production نداشت — باگ ۹ ماهه (Hy-Line/Lohmann)
- یافته: calculateFCR در helpers-audit.ts:246 فرمول غلط (feed/liveWeight به‌جای feed/weightGain)

### C2 — اتصال calc به dlg
- environment warnings در calc (d8df5b8e)
- LogCard از calc (620ec597)
- حذف ۴ تابع مرده (dada4388)
- حذف tempWarning + humidityWarning (383ab287)
- صفر regression

### D — Validation dlg
- D2: sumDeaths مستقل از flockAlive (3ff4547e) — باگ
- D3a: hen-day با femaleCount (3db7fd96) — فقط Zod، dsh بعداً در C3a fix شد
- D3b+D3c: water + feedRemaining soft (a5aa12f2)

### D4 — Intelligence standards-aware
- D4a: temperature با standards (bf07dee1) — ۷ تست
- D4b: species/species_curve ۲۱ فیلد (51303f5e) — ۱۳ تست
- D4d: context در FeedSection + EggsWeightSection (d0f25873)
- کشف: Intelligence ۳۶٪ شکسته بود (۲۶ فیلد species تعریف شده، صفر پیاده)

---

## 🔍 یافته‌های A-C7-C3 (این جلسه اصلی)

### A — مدل داده dlg (نیمه‌کاره)

**A1a+A1b1 (`7e556fea`) — مدل پایه:**
- shift اضافه شد ❌ (کد مرده)
- birdAgeDays اضافه شد (نیمه‌کاره — C7d fix کرد)
- brokenTarget/otherTarget بازنام‌گذاری شد ❌ (کد مرده — C7b حذف کرد)
- migration v10 (shift + birdAgeDays + target rename)
- **migration v6/v7 reorder درست — این باید نگه داشته شود**

**A1b2+b3+b4 (`08e7f0ea`) — UI + snapshot:**
- UI shift ❌ (C7a حذف کرد)
- getBirdAgeAt helper (حالا در C7d استفاده می‌شود)
- birdAgeDays snapshot

**A2b+A2c (`a3bb65a4`) — rename:**
- rename feedAmount → feedDelivered (۶۹ نقطه) ✅
- feedConsumed مشتق (C1s/formulas/feed.ts) ✅
- migration v11 (backward compat)
- **ولی ۱۶ consumer همچنان feedDelivered می‌خواندند — C3b + C3c fix کرد**

**A2d (`4c836434`) — FeedSystem ۵ مقدار:**
- FeedSystem گسترش به ۵ مقدار calc
- migration v12
- cast در buildData حذف شد

**A3 (`69d6a675`) — double-count fix:**
- sourceType در EggProduction
- duplicate check در ProductionsPage
- حذف addProduction از inc
- **این commit موفق بود** ✅

### C7 — پاک‌سازی (`7bc2ae37`، `0c28be12`، `2bc5c02c`)

**C7a — حذف shift:**
- types.ts، store.ts، buildData.ts، useDlgForm.ts، FormModal.tsx
- migration v13 (shift + brokenTarget/otherTarget حذف از داده)
- ۵ فایل تست به‌روز

**C7b — حذف brokenTarget/otherTarget:**
- types.ts، store.ts، buildData.ts، DailyLogsPage.tsx، rules/dlg.ts
- ۲ fixture تست

**C7d — birdAgeDays نمایش:**
- LogCard subtitle: «۱۴۰۵/۰۸/۱۷ • 07:30 • ۲۵ روز • پرنده نام»
- صفر تغییر در منطق

**EggDiscard (`ae573922`) — feature کامل:**
- EggDiscard interface (type، reason، count)
- addDiscard + deleteDiscard actions
- DiscardFormModal.tsx (۱۲۵ خط)
- calcStock با discards (broken - discarded)
- migration v3 در egg
- **این feature از صفر بود — طراحی + implementation + UI + migration + tests**

### C3 — اتصال calc به dsh/flk

**C3a (`ab24ff89`) — hen-day sexed:**
- layingAliveCount جدید (layer/breeder + femaleCount)
- henDay7 از aliveCount به layingAliveCount
- fix: گله broiler در مخرج + نر در مخرج

**C3b (`917a029a`) — feedConsumed در LogCard + dsh:**
- LogCard: label «دان داده‌شده» (به‌جای «مصرفی»)
- LogCard: Row «دان مصرف‌شده» (اگر متفاوت)
- LogCard: waterFeedRatio با feedConsumed
- dsh: fcr + waterFeedRatio با feedConsumed

**C3c (`ac330f92`) — ۶ مصرف‌کننده باقی:**
- flk/useGroupKpi (۲)
- rep/analytics (۱)
- rep/FlockReportPage (۱)
- rep/ExportButtons (۱)
- dsh/BenchmarkCard (۱)
- shr/filter/configs/dlg (۱)

**C3d (`7ed19857`) — ۴ alert جدید:**
- humidity: از `stdEnv.humidity` (fallback ۴۰-۷۰)
- ventilation: `'low'` → important
- litter: `'wet'` → important، `'clumped'` → info
- behavior: `'lethargic'` → important
- AlertCategory گسترش: humidity، ventilation، litter، behavior

**C3e (`4795ea0b`) — ۴ alert جدید:**
- sound: `'cough'`/`'sneeze'` → important (بیماری تنفسی)
- distribution: `'cornered'` → important (سرما/استرس)
- water: نسبت > ۲.۵ → important، < ۱.۲ → info
- feed: feedDelivered > 0 ولی feedConsumed = 0 → info
- AlertCategory گسترش: water، feed

**C3f (`06b9a7b1`) — useGroupKpi bug:**
- totalDeaths از `Math.max(0, totalInitial - totalCurrent)` (تخمین غلط) به sum of death/cull events (واقعی)
- **باگ: فروش پرنده به‌عنوان تلفات حساب می‌شد**

**C3g-fix (`fc6b82f9`) — rename در تست‌ها:**
- ۵ فایل تست: analytics، flk-migrations-feed-trigger، flk-migrations-feed، intelligence-integration، intelligence
- rename feedAmount → feedDelivered


---

## 🎯 مسیر جلسه ۱۰

### D5 — Atomic آماده-آینده ✅ کامل شد

زیرفازهای D5:

| # | زیرفاز | commit | وضعیت |
|---|---|---|---|
| D5.1 | infrastructure atomic | 25501955 | ✅ |
| D5.2 | StorageAdapter | 67811088 | ✅ |
| D5.3 | Outbox Pattern | 5616e461 | ✅ |
| D5.4 | `_v`/`_txid` + migration | — | ⏸ کنسل (جلسه ۱۲) |
| D5.5 | Refactor useDlgSave | 88b8d6e0, 816f5fa8, 30735781, 5de7d548 | ✅ |
| D5.6 | ۵ تست atomic | (commit آخر) | ✅ |

۵ باگ فاجعه‌بار حل شد (orphan movement، egg، activeWithdrawal، catch خالی، flockId تغییر).

TODO — جلسه ۱۲:
- D5.4 (`_v`/`_txid`) — همراه server
- B4-Recalc (activeWithdrawal recompute) — ~۳۰ دقیقه
- act() warning در تست ۳ — cosmetic

---

---

## 📋 قوانین آهنین (بدون تغییر از جلسه ۹)

- ❌ کد بدون verify — grep + sed + backup
- ❌ commit بدون test — L11
- ❌ as any جدید — L5 ratchet
- ❌ catch {} خالی — L6
- ❌ بیش از ۵ فایل در یک concept — AGENTS
- ❌ heredoc با __EOF__ در markdown — شکسته می‌شود
- ❌ /tmp در Termux — ندارد
- ❌ anchor بدون verify — content.count(anchor) == 1
- ❌ rename بزرگ بدون npx vitest run کامل (۵ دقیقه) الزامی
- ✅ END_BLOCK_1/2/3/4/5 برای heredoc
- ✅ ~/.bird_bak/ برای اسکریپت‌های موقت
- ✅ git --no-pager diff (نه git diff)
- ✅ یک تغییر، یک verify، یک commit
- ✅ هر feature باید consumer داشته باشد در همان commit

---

## 📖 درس‌های کلیدی جلسه ۹

### درس ۱ — بعد از rename بزرگ، تست کامل الزامی
A2b (rename ۶۹ نقطه) ۱۲ تست را شکست. فقط ۴ ساعت بعد (در C3g-verify) کشف شد. قاعده: npx vitest run کامل (۵ دقیقه) الزامی.

### درس ۲ — END_BLOCK بجای __EOF__ در markdown
HANDOFF v8 با cat << '__EOF__' شکست (markdown bold). HANDOFF v10 با ENDBLOCK1/2/3/4/5 موفق.

### درس ۳ — anchor line-based مقاوم‌تر از text-replace
۵ بار rollback در D3b/c به‌خاطر anchor طولانی. استفاده از شماره خط + brace counting.

### درس ۴ — rename + cascade در یک جلسه
feedConsumed در A2 ساخته شد، ۱۶ consumer feedDelivered می‌خواندند. C3b + C3c (۲ commit بعد) fix کرد.

### درس ۵ — audit قبل از کد
AUDIT ۹ فاز (۳۴ فیلد dlg) نشان داد ۶ فیلد مرده. اگر audit نبود، C7 و C3 انجام نمی‌شد.

### درس ۶ — کد نوشته شده، وصل نشده = الگوی این جلسه
۱۱ orphan calc در C1، feedConsumed در A2، birdAgeDays در A1، EggSale/EggStock/calcStock قبل از جلسه. درس: هر feature باید consumer داشته باشد در همان commit.

### درس ۷ — توقف بعد از milestone
C1 (۱۶ commit) → C2 (۴) → D (۴) → D4 (۴) → A (۵) → C7 (۴) → C3 (۷). هر milestone یک نقطه امن برای commit + verify + توقف.

---

## 🚀 شروع سریع برای AI جدید

### گام ۱ — setup

    cd ~/Bird-new
    git log --oneline -5
    git status --short
    npx tsc --noEmit 2>&1 | tail -5
    npx vitest run 2>&1 | tail -5

### گام ۲ — خواندن اجباری

    cat HANDOFF-v10.md
    cat AGENTS.md
    cat docs/CONSTITUTION.md
    tail -100 docs/DECISIONS.md
    cat ~/.bird_bak/DLG-AUDIT.md

### گام ۳ — تست UI

- /flocks → گله «بو قلمون برنز»
- ثبت روزانه → فیلد shift حذف شده
- LogCard → birdAgeDays در subtitle
- /egg → دکمه «🗑 ثبت دور ریخت»
- /alt → ۸ alert جدید (humidity/ventilation/litter/behavior/sound/distribution/water/feed)

### گام ۴ — کار اولویت‌دار

D5 (atomicSave) — اولین کار جلسه ۱۰

---

## 🎯 خط یک‌خطی

جلسه ۹: ۴۵ commit، ۱۹۱۸ تست پاس، audit + C1-D4 + A + C7 + C3. dlg حالا standards-aware (temp/humidity)، feedConsumed در همه‌جا استفاده می‌شود، hen-day sexed-aware، ۸ alert جدید در alt، EggDiscard feature کامل. باقی: D5 (atomicSave — اولویت بالا)، E (UI/UX)، F (cross-module). صفر regression.

---

*آخرین به‌روزرسانی: 1405/11/08*
*HEAD: fc6b82f9*


---

## 🏛️ معماری آماده-آینده (جلسه ۱۰ پیاده می‌شود)

### چرا آماده-آینده

نرم‌افزار در آینده:
- multi-user (چند مرغداری روی یک سرور)
- server-backed (همگام‌سازی cloud)
- offline-first (PWA)

Atomic ساده (بدون future-proof) = ۴ ساعت الان، ~۲۰ ساعت refactor بعد.
Atomic آماده-آینده = ۶.۵ ساعت الان، صفر refactor بعد.

### دو فیلد کلیدی که همه‌چیز را ممکن می‌کند

هر رکورد در هر store (dlg, whs, egg, flk, tra) دو فیلد جدید:
- _v: number — version (optimistic locking)
- _txid?: string — آخرین transaction ID (idempotency)

الان: صفر کاربرد (local single-user)
آینده: conflict resolution + retry safety

### لایه‌های جدید

src/cor/atomic/ — تراکنش اتمیک (local)
  types.ts — AtomicStore, AtomicOptions
  transaction.ts — snapshot + preflight + rollback (~۱۰۰ خط)
  stores.ts — ثبت ۵ store (dlg, whs, egg, flk, tra) (~۵۰ خط)

src/cor/storage/ — لایه انتزاعی ذخیره‌سازی
  types.ts — StorageAdapter interface (~۳۰ خط)
  local.ts — Zustand persist (فعال) (~۸۰ خط)
  indexeddb.ts — stub (آینده)
  server.ts — stub (آینده)

src/cor/outbox/ — صف رویدادها (الگوی SAP/Odoo)
  types.ts — OutboxEvent, OutboxProcessor (~۳۰ خط)
  outbox.ts — publish/subscribe/retry (~۸۰ خط)
  processors.ts — local processor + server stub (~۵۰ خط)

### StorageAdapter interface

    interface StorageAdapter {
      getAll<T>(key: string): Promise<T[]>;
      getById<T>(key: string, id: string): Promise<T | null>;
      insert<T>(key: string, item: T): Promise<void>;
      update<T>(key: string, id: string, patch: Partial<T>): Promise<void>;
      delete<T>(key: string, id: string): Promise<void>;
      beginTransaction(): Promise<string>;
      commitTransaction(txid: string): Promise<void>;
      rollbackTransaction(txid: string): Promise<void>;
      subscribe?(key: string, cb: (data: any[]) => void): () => void;
    }

الان: LocalStorage (Zustand persist)
آینده: ServerStorage (REST/GraphQL) — بدون تغییر در ماژول‌ها

### الگوی Outbox

به‌جای bus.emit مستقیم:
    outbox.publish('dlg:log:saved', { logId, txid });

مزایا:
- الان: رویداد گم نمی‌شود (اگر subscriber fail کند)
- آینده: صف به سرور می‌رود، multi-user sync خودکار
- همیشه: retry خودکار

### حجم پیاده‌سازی

    atomic (۳ فایل)         ~۲۰۰ خط  ~۲ ساعت
    storage (۲ فایل فعال)   ~۱۱۰ خط  ~۱ ساعت
    outbox (۲ فایل فعال)    ~۱۳۰ خط  ~۱ ساعت
    _v/_txid در types        ~۲۰ خط   ~۱۵ دقیقه
    migration v14            ~۲۰ خط   ~۲۰ دقیقه
    تست‌ها                  ~۱۵۰ خط   ~۱ ساعت
    Refactor useDlgSave       ~۵۰ خط  ~۱ ساعت
    جمع                     ~۶۸۰ خط  ~۶.۵ ساعت

### ۵ ماژول مصرف‌کننده (بعد از D5)

- dlg → dlg:log:saved، dlg:log:deleted
- tra → tra:invoice:saved، tra:invoice:deleted
- egg → egg:production:saved
- inc → inc:entry:saved
- flk → flk:merge، flk:unmerge

### آنچه نمی‌سازیم (جلوگیری از over-engineering)

- WebSocket client: stub بعد
- Conflict resolution UI: _v کافی است، UI بعد
- Multi-user permissions: لایه auth جدا
- Server backend: فقط interface
- IndexedDB adapter: stub
- Offline queue با merge: outbox ساده

قاعده: shapeها الان، contents بعد.
