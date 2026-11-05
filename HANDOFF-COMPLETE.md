# 🤖 HANDOFF — v2 (جلسه ۸.۵)
> آخرین به‌روزرسانی: ۱۴۰۵/۱۱/۰۵

## 🎯 وضعیت فعلی (قطعی)

| مورد | مقدار |
|---|---|
| آخرین commit | faf54f76 |
| تست‌ها | ~1600+ سبز |
| tsc | ✅ |
| شاخه | main |

## ✅ کارهای امروز (جلسه ۸.۵)

### 74a5060c — fix(tra): ۳ باگ فعال
- A:  clearPartyPayment  → sync creditBalance
- A': bouncePartyPayment → sync creditBalance
- B:  depositPartyPayment → sync deals[].payments[] + creditBalance
- C:  computeUpcomingDeals → filter nextReminderAt (snoozed)

### faf54f76 — test(tra): ۱۰ تست regression
- ۳ تست در store-tra-checks.test.ts
- ۷ تست در tra-helpers.test.ts

## 🚨 ۴ باگ باقی‌مانده (از جلسه ۷)

ReminderModal — دست نخورده، نیازمند verify اول:

1. stale snapshot — reminderInvoiceId (string) جایگزین reminderTarget؟
2. layout پیچیده — بین ۱، ۲، ۳ ستون
3. gap ناهماهنگ — بین کانال/پیام/یادآوری/یادداشت
4. آیکون‌های پیام (📤📋) — جای‌گذاری و اندازه

⚠️ بدون cat + تحلیل، هیچ‌کدام قطعی نیستند.

## 🎯 شروع جلسه بعد

دستورات (به ترتیب):

    cd ~/Bird-new
    git log --oneline -5
    npx tsc --noEmit
    npx vitest run 2>&1 | tail -10

    cat AGENTS.md
    cat docs/CONSTITUTION.md
    cat docs/UI-PATTERNS.md
    tail -50 docs/DECISIONS.md

    cat src/mod/tra/components/ReminderModal.tsx

## 📐 قوانین آمر

- L1:  state فقط از store
- L4:  showAlert ممنوع → showToast
- L5:  any فقط کاهش (ratchet)
- L6:  catch {} خالی ممنوع
- L7:  فایل > ۵۰۰ خط = خطر
- L10: قفل‌شده: Field, Input, SmartSelect, EntityLink, Modal
- L11: هر store action با side-effect → تست
- L12: تصمیم معماری → docs/DECISIONS.md
- L13: اول بگرد، بعد بساز
- L14: autoClamp حین تایپ ممنوع

## 🔧 الگوی patch (Termux)

Python line-based + brace counting.

Termux quirks:
- python3 - << 'PYEOF'  (نه <<-)
- whitespace → sed -n 'X,Yp' file | cat -A
- anchor string-based با متن فارسی = مشکل
- brace counting با نادیده گرفتن string/comment

Workflow اجباری:
    verify → patch → tsc → vitest → commit → push

هر خطا → rollback اتوماتیک.

## 🎯 وضعیت قابلیت‌های tra

| قابلیت | فایل | وضعیت |
|---|---|---|
| Aging IFRS 9 | calc.ts | ✅ |
| Aging معاملات | ReceivablesPage | ✅ |
| MultiPay FIFO | MultiPayModal | ✅ |
| Credit limit check | useInvoiceForm | ✅ |
| Advance (unapplied) | store.ts | ✅ |
| useAdvance UI | InvoiceFormModal | ✅ |
| Badge ⚡ (creditBalance) | ReceivablesPage | ✅ |
| ChecksModal | ChecksModal | ✅ |
| computeUpcomingDeals | helpers.tsx | ✅ |
| ReminderModal ۴ باگ | ReminderModal | ❓ نیازمند verify |

## 🎯 خلاصه یک‌خطی

Aging + AR + Credit + Advance کامل است. ۳ باگ فعال در 74a5060c fix شد. ۱۰ تست regression در faf54f76. باقی: ReminderModal ۴ باگ — نیازمند cat + verify.

## 📚 مرجع

- کد = سند. docs/CONSTITUTION.md + AGENTS.md مرجع اصلی
- git log برای تاریخ کامل
- docs/DECISIONS.md برای تصمیمات معماری
