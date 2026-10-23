# Safety Net — چرا این تست‌ها هستن

## invariants-extended.test.ts

هر تست اینجا یه باگ واقعی رو encode می‌کنه که قبلاً رخ داد.
**حذف نکن، تغییر نده** — اگه fail شد، یه باگ برگشته.

| تست | باگ قبلی |
|------|----------|
| `sum(items)===total` | calcInvoiceTotal بدون round |
| `remaining=0→credit=0` | computePartyCredit بدون cashDiscount |
| `delete(add(inv))→no orphan` | deleteInvoice فاقد revert |
| `currentCount >= 0` | addEvent منفی |
| `bounced check→paidSum=0` | چک برگشتی اشتباه |
| `aging از dueDate` | daysUntilDue با new Date میلادی |

## tra-formulas.test.ts

قواعد formulas.ts (single source of truth).
هر تغییر در `remaining`, `agingBucketFromDue`, `partyBalance` → این تست‌ها باید پاس شن.

## cascade-contract.test.ts

قرارداد cascade:
- `add(inv) → delete(inv)` → orphan صفر
- `add(inv) → delete(inv)` → whs movement balanced

## قوانین طلایی

1. **Pre-commit hook** — `git commit --no-verify` نزن مگر اورژانس
2. **CI Gate** — main فقط از PR + CI pass merge
3. **Branch Protection** — این repo: main محافظت شده
4. **Invariants** — این فایل‌های تست، تاریخچه باگ‌ها هستن
5. **Formulas** — هر محاسبه business از `formulas.ts` یا `calc.ts`

## اگه تست invariants fail شد

1. **rollback تغییر** — `git revert <commit>`
2. **یا invariant رو تغییر بده** — فقط اگه با تصمیم business جدید
3. **هرگز تست رو حذف نکن**
