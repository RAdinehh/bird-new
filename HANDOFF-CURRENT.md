# 🤖 HANDOFF-CURRENT — وضعیت فعلی

> **این فایل دستی نوشته می‌شود. STATUS.md خودکار است.**
> آخرین آپدیت: 1405/11/08
> **برای HEAD فعلی: `cat docs/STATUS.md` — این فایل SHA هاردکد نمی‌کند.**

## ⚠️ قبل از هر کار

    cd ~/Bird-new
    bash bootstrap.sh
    cat docs/STATUS.md

## 🚨 وضعیت واقعی (verify شده با git + tsc)

| مورد | ادعای HANDOFF v11 | واقعیت (verify شده) |
|---|---|---|
| HEAD (ادعای v11) | `bc503023` | **الان: `docs/STATUS.md` را ببین** |
| tsc | پاس | **۰** ✅ (D.3a-fix ✅) |
| D.3b as any | ۵ عدد | **۰ عدد** ✅ (D.3b کامل) |
| D6 برآورد | ۳۰ دقیقه | **۳-۴ جلسه** (v11 خودش: ۱۲-۱۴ ساعت) |

**درس:** قبل از اعتماد به HANDOFF، `git log`, `npx tsc --noEmit` را خودت اجرا کن.

## 🗺️ نقشه راه

### ✅ Done (تا HEAD فعلی)
- **dlg**: مدل داده + منطق + atomic + cascade — **۱۰۰٪ کامل**
- ۶۲ commit، ۱۹۲۳ تست (طبق v11 — verify نشده)
- ۷ باگ در D5 حل شد
- D5.5 (save/delete atomic dlg)
- D6-B, C, C.1, D.0-prod, D.0-test, D.1, D.2, D.3a
- **D.3a-fix** — narrow cast EquipmentCategory/Unit (tsc ۰)
- **Phase E.1a** — `handleSave` block on errors ✅
- **Phase E.1b** — `LogCard` نمایش تخم ✅
- **Phase E.2a** — `flockAliveCount` + دان/پرنده در LogCard ✅
- **Phase E.2b** — `?? 0` به‌جای `|| 0` در ۳ rep ✅
- **Phase E.3** — `checkStock` فرمول (جلوگیری negative stock) ✅
- **Phase E.4a** — Undo امن (hadCascades flag) ✅
- **Phase E.4b** — Undo کامل (snapshot + restoreLogFull) ✅
- **Phase D.3b** — آخرین `as any` در deleteInvoice ✅
- **Phase D.4-A** — `ctcStore` به `ALL_STORES` ✅
- **Phase D.4-B** — `deleteInvoice` atomic (snapshot + 16 throw + **negative test اثبات rollback**) ✅
- **Phase D.6-E** — `updateInvoice` atomic (8 throw + test) ✅
- **Phase D.6-F** — `addInvoice` atomic (4 throw + test) ✅
- **Phase D.6-G** — integration tests (توالی add/update/delete + rollback) ✅
- **allocations** — در traStore snapshot/restore ✅
- **Phase D.7-P1** — `bus.emitSync` (پایه sync atomic events) ✅
- **Phase D.7-P2** — `egg.store` atomic (3 action + snapshot + rollback) ✅
- **Phase D.7-P3** — `whs.handlers` egg cascade (6 swallow → throw) ✅
- **Phase D.7-P4a** — negative test (اثبات atomic end-to-end egg↔whs) ✅
- **Phase D.7-P4b** — `ProductionsPage` bulk atomic + silent catch رفع ✅
- **Phase D.8** — inc atomic (`addHatch`/`deleteHatch` + flk cascade، ۴ تست) ✅
- **Phase D.9** — flk merge/unmerge atomic by design (single set، ۵ تست + DECISIONS) ✅
- **Phase D.10** — whs atomic by design (single set، ۸ تست + DECISIONS) ✅
- **dlg negative tests** — `deleteLog`/`restoreLogFull` rollback اثبات (۴ تست، `d4f9dd23`) ✅
- **Phase E-cleanup** — حذف `lightHours` (فیلد مرده) + migration v14 ✅
- **Phase E-hints-cleanup** — حذف ۲۴ hint، ۴ حیاتی باقی ✅
- **Phase E-layout** — ۴ SectionTitle استاندارد در FormModal ✅
- **Phase E-section-1** — `dlg.Section` → `LogSection` (شامل تست) ✅
- **Phase E-section-2** — `egg.Section` → `StatsCard` ✅
- **Phase E-section-3** — `rep.Section` → `Layout.tsx` (استاندارد رسمی) ✅
- **Phase E-section-4** — `set.Section` → `Layout.tsx` (یکسان‌سازی) ✅
- **Phase F-A** — ۶ رویداد dlg publish می‌شوند (feed/egg/vaccine/medication) ✅
- **FCR calc orphan** — اصلاح باگ (feed/liveWeight → feed/weightGain) + ۵ تست ✅
- **EPEF calc orphan** — متصل در FlockHistoryModal (broiler + FCR دقیق) ✅
- **brokenRate7 fix** — double-count bug در dsh + aggregateEggMetrics helper ✅
- **Egg سایر** — برچسب ساده + HelpIcon «نرم، کثیف، ترک‌خورده...» ✅
- **Mortality calc** — متصل در FlockHistoryModal (نرخ تلفات تجمعی + ۱۱ تست) ✅
- **Weight calc** — متصل در EggsWeightSection (≥3 نمونه، fallback legacy برای ۲) + uniformity ✅

### 🚧 In progress — D6 (tra atomic)

| فاز | کار | وضعیت |
|---|---|---|
| **D.6-D.10** | D-Series (tra/egg/inc/flk/whs atomic) | ✅ |
| **Phase E-Cleanup** | lightHours، hint، SectionTitle، Section | ✅ |
| **Phase F-A** | ۶ رویداد dlg publish | ✅ |
| **Phase F-B** | reactive alt/dsh (رد شد — monolithic frontend) | ❌ |

**🏆 این جلسه: ۹ commit، ۶ رویداد dlg زنده، Sectionها تفکیک شدند، hint‌ها پاک‌سازی شدند**

### ⏳ بعدی — به ترتیب پیشنهادی

1. **Stocking** orphan — چگالی گله در سالن
2. **Water** orphan — نسبت آب/دان
3. **`entryTime` Zod mismatch**
4. **`dsh` استفاده از `aggregateEggMetrics`** (helper آماده)
5. بعد: G (Draft), H (CSV), C8 (EggSale.quality)
6. D5.4 (`_v`/`_txid`) — همراه server

## 🐛 شکاف‌های باز (از DLG-AUDIT)

- **۷ تابع calc orphan** — FCR, Mortality, Egg, Weight, Stocking, EPEF, Water
- **`softCount: 0` هاردکد** در `toEgg.ts:52`
- **`calculateFCR` helpers-audit:246 فرمول غلط** — FlockHistoryModal
- **`entryTime` Zod mismatch**
- **۳ نسخهٔ موازی avgWeight**

## 📚 فایل‌های کلیدی

| فایل | چیست |
|---|---|
| `HANDOFF-CURRENT.md` | این فایل — وضعیت دستی |
| `docs/STATUS.md` | auto-generated توسط `bootstrap.sh` |
| `CLAUDE.md` | قانون صفر برای AI |
| `docs/CONSTITUTION.md` | L1-L14 |
| `docs/DECISIONS.md` | تاریخ تصمیمات |
| `HANDOFF-v11.md` | آخرین HANDOFF رسمی (header کهنه) |
| `~/.bird_bak/DLG-AUDIT.md` | audit dlg (روی `69d6a675`) |

## 📋 قوانین آهنین (خلاصه)

- ❌ patch بدون `grep -n` + `sed -n` + backup
- ❌ commit بدون test
- ❌ `as any` جدید (L5)
- ❌ `catch {}` خالی (L6)
- ❌ > ۵ فایل در یک concept (AGENTS)
- ❌ HEREDOC با `__EOF__`
- ❌ `/tmp` (Termux ندارد → `~/.bird_bak/`)
- ✅ یک تغییر، یک verify، یک commit
- ✅ `git --no-pager diff`
- ✅ `END_BLOCK_N` / `ENDHANDOFF`

## 🎯 ترتیب بعدی

**→ این ترتیب با «⏳ بعدی» بالا یکسان است — بخش قبلی (Phase E) تکمیل شد.**

1. **۷ calc orphan** — FCR, Mortality, Egg, Weight, Stocking, EPEF, Water
2. **`softCount: 0`** — `toEgg.ts:52`
3. **`calculateFCR` helpers-audit:246**
4. **`entryTime` Zod mismatch**
5. **۳ نسخهٔ موازی avgWeight**
6. بعد: G (Draft), H (CSV), C8 (EggSale.quality)
7. D5.4 (`_v`/`_txid`) — همراه server

## 📝 آپدیت این فایل

**در پایان هر جلسه:**
- **SHA را این‌جا هاردکد نکن** — همیشه یک commit عقب می‌افتد
- برای HEAD فعلی: `cat docs/STATUS.md` (bootstrap خودکار)
- فاز فعلی را حرکت بده
- یافته جدید → بخش 🐛
