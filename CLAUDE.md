# ⚠️ AI جدید — قبل از هر کار

## قانون صفر — سه دستور، همیشه

    cd ~/Bird-new
    bash bootstrap.sh
    cat docs/STATUS.md
    cat HANDOFF-CURRENT.md

## 🚨 HANDOFF های قبلی ممکن است دروغ بگویند

**مثال واقعی:** HANDOFF v11 می‌گوید `tsc: پاس` ولی `store.ts` دو خطای tsc دارد.

**قانون:** قبل از اعتماد به هر ادعای HANDOFF، خودت verify کن:
- `git log --oneline -1` (نه متن HANDOFF)
- `npx tsc --noEmit` (نه "tsc: پاس")
- `npx vitest run` (نه "تست پاس")

## قوانین آهنین (خلاصه)

- ❌ patch بدون `grep -n` + `sed -n` + backup
- ❌ commit بدون test
- ❌ `as any` جدید (L5 ratchet)
- ❌ `catch {}` خالی (L6)
- ❌ بیش از ۵ فایل در یک concept (AGENTS)
- ✅ یک تغییر، یک verify، یک commit
- ✅ HEREDOC: `END_BLOCK_N` (نه `__EOF__`)
- ✅ Termux: `/tmp` ندارد → `~/.bird_bak/`

## ترتیب کار

1. `docs/STATUS.md` — وضعیت واقعی
2. `HANDOFF-CURRENT.md` — فاز فعلی + نقشه راه
3. `docs/CONSTITUTION.md` — L1-L14
4. `docs/DECISIONS.md` — تاریخ تصمیمات

## اگر ابهام داشتی

**حدس نزن. `grep` کن. `sed -n` کن. `cat` کن.** حدس = همان اشتباهی که ۱۵ بار rollback داد.
