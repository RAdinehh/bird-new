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
| D.3b as any | ۵ عدد | **۱ عدد** (خط `:573`) |
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
- **Phase E.1a** — `handleSave` block on errors (`637a2ae5`)
- **Phase E.1b** — `LogCard` نمایش تخم ✅

### 🚧 In progress — D6 (tra atomic)

| فاز | کار | برآورد | وضعیت |
|---|---|---|---|
| ~~D.3a-fix~~ | ~~fix ۲ خطای tsc~~ | ✅ انجام شد | ✅ |
| ~~E.1a~~ | ~~handleSave block~~ | ✅ `637a2ae5` | ✅ |
| ~~E.1b~~ | ~~LogCard تخم~~ | ✅ | ✅ |
| **E.2a** | `aliveCount: flockAliveCount` در buildData | ۳۰ دقیقه | ⏳ |
| **E.2b** | `?? 0` به‌جای `\|\| 0` در ۳ rep | ۳۰ دقیقه | ⏳ |
| D.3b | حذف ۱ `as any` (خط ۵۷۳) | ۲۰ دقیقه | ⏳ |
| D.4 | `deleteInvoice` atomic | **۳ ساعت PR-risk** | ⏳ |
| E | `updateInvoice` atomic | **۵ ساعت PR-risk** | ⏳ |
| F | `add` atomic | ۳ ساعت | ⏳ |
| G | tests | ۲ ساعت | ⏳ |

**جمع D6: ۱۲-۱۴ ساعت = ۳-۴ جلسه**

### ⏳ بعدی — به ترتیب پیشنهادی

1. **فاز E — UI/UX فرم ۴۷ فیلدی dlg** ← **مهم‌ترین برای کاربر**
2. D7-D10 (egg/inc/flk/whs atomic) — ~۳۰ دقیقه هر کدام
3. F, G, H
4. C8 (EggSale.quality)
5. D5.4 (`_v`/`_txid`) — همراه server

## 🐛 شکاف‌های باز (از DLG-AUDIT)

- **۷ تابع calc orphan** — FCR, Mortality, Egg, Weight, Stocking, EPEF, Water
- **`softCount: 0` هاردکد** در `toEgg.ts:52`
- **`checkStock` formula ناقص** در `checkStock.ts:55`
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

1. **E.2a** — `aliveCount: flockAliveCount` + نمایش warning در LogCard (۳۰ دقیقه)
2. **E.2b** — `?? 0` به‌جای `|| 0` در ۳ rep (۳۰ دقیقه)
3. **E.3** — `checkStock` formula (۱ ساعت، PR-risk بالا)
4. **E.4** — `UndoBar` کامل (۲ ساعت)
5. بعد: D.3b → D.4 → D7-D10

## 📝 آپدیت این فایل

**در پایان هر جلسه:**
- **SHA را این‌جا هاردکد نکن** — همیشه یک commit عقب می‌افتد
- برای HEAD فعلی: `cat docs/STATUS.md` (bootstrap خودکار)
- فاز فعلی را حرکت بده
- یافته جدید → بخش 🐛
