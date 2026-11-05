# 🤖 HANDOFF — v3 (جلسه ۸.۶)
> آخرین به‌روزرسانی: ۱۴۰۵/۱۱/۰۶

## 🎯 وضعیت فعلی

| مورد | مقدار |
|---|---|
| آخرین commit | f84fa199 |
| تست‌ها | ۱۳۶ سبز (tra) |
| tsc | ✅ |
| شاخه | main |

## ✅ کارهای جلسه ۸.۶ (۷ commit)

### `74a5060c` — fix(tra): ۳ باگ فعال
- A:  clearPartyPayment  → sync creditBalance
- A': bouncePartyPayment → sync creditBalance
- B:  depositPartyPayment → sync deals[].payments[] + creditBalance
- C:  computeUpcomingDeals → filter nextReminderAt

### `faf54f76` — test(tra): ۱۰ تست regression

### `b5fba6e2` — docs: HANDOFF v2

### `0474bad2` — ui(tra): ReminderModal polish
- کانال: flex-wrap + minWidth 70px
- gap استاندارد (10→8)
- آیکون‌های 📤📋 (gap 0→6، size 28→32)

### `5664b3bd` — fix(tra): StatementModal
- LineKind: 'advance' | 'refund'
- type-aware rendering + unapplied advances

### `c163c92b` — feat(tra): ApplyAdvanceModal
- تخصیص پیش‌پرداخت به فاکتور موجود (FIFO)
- دکمه ⚡ در Aging

### `f84fa199` — fix(tra): MultiPayModal
- auto-select همه بدهی‌ها با انتخاب طرف‌حساب
- دکمه‌های «همه» / «هیچ»

## ⚠️ نکات مهم برای جلسه بعد

### ۱. مشکل «داده پرید» — HMR/dev-only بود
- سناریو: در dev server (localhost:3000) بعد از پرداخت ۲۵٪ و refresh، `invoices: []` می‌شد
- تشخیص: persist + StrictMode + HMR race (۷ commit در یک روز = HMR هزاران بار)
- تست: production build (port 4173) → مشکل تکرار نشد ✅
- **درس:** بین commit‌ها dev server را restart کنید
- **توصیه:** patch محافظ persist را در جلسه بعد بزنید (~۵۰ خط، صفر ریسک)

### ۲. تست‌های regression گم‌شده (L11)
- StatementModal: بدون تست
- ApplyAdvanceModal: بدون تست
- MultiPayModal auto-select: بدون تست
- **توصیه:** ~۶۰ خط تست، ۱ commit

### ۳. فایل debug
- `public/debug.html` — ابزار بررسی pm-tra
- آدرس: `http://localhost:4173/debug.html` (بعد از preview)
- در build production هم کار می‌کند

## 🚨 PENDING (اولویت‌بندی)

| # | کار | حجم | اولویت |
|---|---|---|---|
| 1 | patch محافظ persist | ~۵۰ خط | متوسط |
| 2 | تست‌های regression (Statement + Apply + MultiPay) | ~۶۰ خط | متوسط |
| 3 | Phase F — Lot Tracking | بزرگ | کم |
| 4 | Phase G-2 — migration ۴۰ فایل | بزرگ | کم |

## 🎯 شروع جلسه بعد

دستورات (به ترتیب):

    cd ~/Bird-new
    git log --oneline -5
    git status --short
    npx tsc --noEmit
    npx vitest run 2>&1 | tail -10
    
    # ۶ فایل مقدس
    cat AGENTS.md
    cat docs/CONSTITUTION.md
    cat docs/UI-PATTERNS.md
    tail -50 docs/DECISIONS.md
    cat docs/ERROR-HANDLING.md
    cat docs/UX-FORM-RULES.md

    # چک سریع
    ls src/mod/tra/components/ | tail -10

## 📐 قوانین آمر

- **L1**: state فقط از store
- **L4**: showAlert ممنوع → showToast
- **L5**: any فقط کاهش (ratchet)
- **L6**: catch {} خالی ممنوع
- **L7**: فایل > ۵۰۰ خط = خطر
- **L10**: قفل‌شده: Field, Input, SmartSelect, EntityLink, Modal
- **L11**: هر store action با side-effect → تست
- **L12**: تصمیم معماری → docs/DECISIONS.md
- **L13**: اول بگرد، بعد بساز
- **L14**: autoClamp حین تایپ ممنوع

## 🔧 الگوی patch (Termux)

Python line-based + brace counting.

**Termux quirks:**
- `python3 - << 'PYEOF'` (نه `<<-`)
- whitespace → `sed -n 'X,Yp' file | cat -A`
- anchor string-based با متن فارسی = مشکل
- brace counting با نادیده گرفتن string/comment

**Workflow اجباری:**
    verify → patch → tsc → vitest → commit → push

هر خطا → rollback اتوماتیک.

## 💡 درس‌های جلسه ۸.۶

1. **کد = سند**. `docs/CONSTITUTION.md` + `AGENTS.md` مرجع اصلی
2. **HMR race** در dev می‌تواند باگ‌های کاذب بسازد — همیشه production build تست کنید
3. **Console/DevTools روی گوشی** جواب نمی‌دهد → `public/debug.html` جایگزین عالی است
4. **قبل از هر set({invoices})**، sessionStorage backup به ذهن بسپارید

## 🎯 خلاصه یک‌خطی

Aging + AR + Credit + Advance + ApplyAdvance + MultiPay auto-select همگی کامل و تست شده. ۷ commit امروز. مشکل «داده پرید» HMR-only بود. باقی: patch محافظ persist + تست‌های regression Statement/Apply/MultiPay.
