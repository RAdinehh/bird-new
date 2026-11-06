# 🗺️ ROADMAP — Sexing & Merge (نقشه راه تفکیک جنسیت و ادغام)

> سند زنده — هر جلسه به‌روز می‌شود
> آخرین به‌روزرسانی: ۱۴۰۵/۱۱/۰۶

---

## 📌 تصمیمات قطعی (۱۶ سؤال)

| # | سؤال | تصمیم |
|---|---|---|
| 1 | تفکیک وقتی currentCount=0 | دکمه نمایش، disabled با tooltip |
| 2 | Override سن تفکیک | دو سطح: نژاد (استاندارد) + گله (override) |
| 3 | تفکیک در گله گوشتی | دکمه همه‌جا، هشدار در modal، badge فقط برای breeder |
| 4 | تلفات قبل تفکیک با جنسیت | sexBreakdown در event، شمارنده دست نمی‌خورد |
| 5 | تفکیک مجدد | بی‌نهایت + کانفرم دوباره |
| 6 | اختلاف شمارش | ثبت خودکار تلفات اصلاحی + تأیید دوم اگر > ۱۰٪ |
| 7 | مبنای تفکیک | از زنده‌های فعلی + تاریخچه |
| 8 | سن تفکیک | از BirdStandard + override گله |
| 9 | تعادل پیوسته | delta-based، هر بار فقط جدیدها |
| 10 | Backdated events | مجاز، در sexBalanceEvents با تاریخ واقعی |
| 11 | Merge: Unmerge source | Modal بپرسد کدام source |
| 12 | Merge: sexingAgeOverride | Modal بپرسد (استاندارد/حداکثر/سفارشی) |
| 13 | Merge: تلفات بین merge-unmerge | Modal بپرسد (pro-rata / همه به target) |
| 14 | Merge: شرایط مجاز | birdKind + type الزامی، breed/hall هشدار |
| 15 | Merge: genderSplitAt | هر دو sexed → min، وگرنه null |
| 16 | Merge: sexBalanceEvents | concat با tag source |

---

## 🏗️ Invariants (قوانین ریاضی)

هر set() که این‌ها را تغییر می‌دهد باید validate شود:

1. maleCount + femaleCount + unknownCount === currentCount
2. currentCount >= 0 (نه Math.max(0) — throw)
3. sum(returns) <= sum(sells) برای هر فاکتور
4. initialCount ثابت (فقط با correction عوض می‌شود)
5. initialCount - sum(deaths) - sum(sells) + sum(returns) + sum(transfers) === currentCount

اگر نقض شد:
- dev: throw Error (fail-fast)
- prod: console.error + toast warning + data freeze

---

## 🗺️ نقشه راه — ۷ فاز

### ✅ فاز ۱ — Fix باگ‌های موجود (~۳۰۰ خط، ۳ commit)
- [ ] Unmerge: snapshot کامل
- [ ] Unmerge Modal: انتخاب source
- [ ] Merge: چک سازگاری
- [ ] Merge: کانفرم
- [ ] Double-save guard
- [ ] Recycle-bin: duplicate check
- [ ] deleteInvoice: warning لیست linked
- [ ] Zod silent fail → نمایش
- [ ] Group audit

**Checkpoint 1:** تست merge+unmerge ۳ بار → داده سالم

### 📦 فاز ۲ — زیرساخت sexing (~۱۵۰ خط، ۱ commit)
- [ ] BiologyStandard.sexingAgeDay
- [ ] مقادیر ۱۵+ نژاد
- [ ] Flock.sexingAgeOverride
- [ ] Flock.sexingEvents
- [ ] Flock.sexBalanceEvents
- [ ] Flock.initialMaleCount/initialFemaleCount
- [ ] Migration
- [ ] validateSexBalance()

**Checkpoint 2:** tsc + ۷۴ تست standards

### ⚥ فاز ۳ — Sexing core (~۴۵۰ خط، ۲ commit)
- [ ] recordSexing() action
- [ ] SexingModal (تفکیک جدید + مجدد)
- [ ] SexingHistoryModal
- [ ] Badge ⏰ در FlockCard
- [ ] نمایش نر/ماده/نامشخص
- [ ] Zod validation
- [ ] کانفرم دوم
- [ ] sexingAgeOverride در فرم ویرایش

**Checkpoint 3:** تفکیک ۲ بار، history صحیح

### 📊 فاز ۴ — تلفات/فروش با جنسیت (~۴۰۰ خط، ۲ commit)
- [ ] Accordion تلفات با sex در dlg
- [ ] useDlgSave پشتیبانی sexBreakdown
- [ ] handlers کاهش دقیق
- [ ] Backdated death
- [ ] Sale Modal با جنسیت
- [ ] Return با جنسیت
- [ ] گزارش sexBreakdown
- [ ] sexBalanceEvents ثبت همه

**Checkpoint 4:** ثبت ۳ تلفات → شمارنده دقیق

### 🔗 فاز ۵ — Merge/Unmerge با Sex (~۲۵۰ خط، ۱ commit)
- [ ] sexBalanceEvents concat
- [ ] genderSplitAt منطق
- [ ] sexingAgeOverride در Modal
- [ ] Unmerge snapshot کامل
- [ ] Pro-rata تلفات
- [ ] Unmerge Modal: انتخاب source
- [ ] Merge/Unmerge در sexBalanceEvents

**Checkpoint 5:** Merge + Unmerge → داده دقیقاً همان

### 👥 فاز ۶ — Group audit (~۸۰ خط)
- [ ] Audit با sexed
- [ ] Breakdown در aggregate
- [ ] هشدار گله unsexed

### 📈 فاز ۷ — گزارش‌ها (~۳۰۰ خط، ۲ commit)
- [ ] Dashboard widget «🕐 زمان تفکیک»
- [ ] گزارش نرخ تلفات نر/ماده
- [ ] Export CSV با جنسیت
- [ ] FCR به تفکیک جنس
- [ ] Audit log
- [ ] HelpIcon

---

## 🎨 قاعده طلایی طراحی

**قبل از هر UI جدید (Modal، Accordion، Error، Badge، Field):**
حتماً `docs/DESIGN-CONSISTENCY.md` را بخوان.

**۱۲ چک اجباری:**
1. کامپوننت موجود (نه اختراع)
2. رنگ از `var(--...)`
3. فونت `var(--fs-...)`
4. padding `var(--pad-...)`
5. `toFa` برای اعداد
6. جداکننده خودکار
7. واحد درست
8. `<Field label>`
9. validation بعد از `saveAttempted`
10. `toastMsg` نه `showAlert`
11. RTL
12. تست در build (port 4173)

**ضدالگوها:**
- `<div flex space-between>` → `<Row>`
- `<input type="text">` → `<Input>`
- `showAlert` → `toastMsg`
- Accordion دستی → `<ExpandableCard>`

---

## 🛡️ قوانین آهنین هر فاز

1. هر commit ≤ ۳۰۰ خط
2. هر commit → tsc پاس + تست‌های موجود سبز
3. هر commit → regression test
4. هر فاز → تست دستی
5. اگر باگ دیدیم → فاز بعد شروع نمی‌شود
6. rollback اتوماتیک هر خطا

---

## ⚠️ خطرات اصلی

| خطر | mitigation |
|---|---|
| Invariant نقض | validateSexBalance() در هر set |
| Migration خراب | توقف + بکاپ localStorage |
| Double-decrement | هر عمل فقط یک set |
| HMR dev bugs | تست در build (port 4173) |
| UI گیج‌کننده | تست دستی بعد از هر فاز |

---

## 📋 باگ‌های شناخته‌شده (فاز ۱)

| # | باگ | فایل | اثر |
|---|---|---|---|
| 1 | Unmerge: male/female صفر | store.ts | داده از دست |
| 2 | Unmerge: initialCount اشتباه | store.ts | تاریخچه |
| 3 | Merge: genderSplitAt همیشه min | store.ts | گیج‌کننده |
| 4 | Merge: بدون سازگاری/کانفرم | MergeFlocksModal | فاجعه |
| 5 | Merge: unmerge فقط آخرین | store.ts | محدود |
| 6 | Double-save | onSave | ۲ گله |
| 7 | Recycle-bin duplicate | tra/store | ۲ فاکتور |
| 8 | deleteInvoice بدون warning | tra/store | داده از دست |
| 9 | Zod silent fail | FlocksPage | کاربر گیج |

---

## 🎯 شروع هر جلسه

دستورات (به ترتیب):

    cd ~/Bird-new
    git log --oneline -5
    git status --short
    npx tsc --noEmit
    npx vitest run 2>&1 | tail -10
    cat docs/ROADMAP-SEXING.md
