from datetime import date, timedelta
from decimal import Decimal, ROUND_HALF_UP

# ═══════════════════════════════════════════════
# موتور استاندارد تولید اقساط
# ═══════════════════════════════════════════════
def generate_installments(total, count, gap_days, start_date, advance=0):
    """
    استاندارد Oracle/SAP/Mambu:
    - تاریخ‌ها صعودی
    - DueDate_n = DueDate_1 + (n-1)*gap
    - مجموع = total - advance
    - باقیمانده به آخرین قسط
    """
    if count <= 0:
        raise ValueError("تعداد اقساط باید مثبت باشد")
    remaining = total - advance
    if remaining <= 0:
        return []
    
    base = (remaining / count).quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)
    amounts = [base] * count
    residual = remaining - sum(amounts)
    if residual != 0:
        amounts[-1] += residual  # استاندارد Mambu: آخرین قسط
    
    result = []
    for i in range(count):
        due = start_date + timedelta(days=gap_days * (i + 1))
        result.append({"number": i + 1, "due_date": due, "amount": amounts[i]})
    return result

# ═══════════════════════════════════════════════
# تست‌ها
# ═══════════════════════════════════════════════
PASS = 0
FAIL = 0

def check(name, condition, msg=""):
    global PASS, FAIL
    if condition:
        print(f"  ✅ {name}")
        PASS += 1
    else:
        print(f"  ❌ {name} → {msg}")
        FAIL += 1

def assert_standard(result, total, advance=0):
    """بررسی استانداردهای اصلی"""
    remaining = total - advance
    # ۱. مجموع = total - advance
    s = sum(x["amount"] for x in result)
    check("جمع اقساط = مبلغ باقیمانده", s == remaining, f"{s} != {remaining}")
    # ۲. تاریخ‌ها صعودی
    dates = [x["due_date"] for x in result]
    check("تاریخ‌ها صعودی", all(dates[i] < dates[i+1] for i in range(len(dates)-1)),
          f"dates: {dates}")
    # ۳. مبلغ همه مثبت
    check("همه مبالغ > ۰", all(x["amount"] > 0 for x in result),
          f"amounts: {[str(x['amount']) for x in result]}")

# ─── سناریو ۱: تقسیم مساوی ───
print("\n[۱] ۱۰۰۰ ÷ ۳ قسط")
r = generate_installments(Decimal("1000"), 3, 30, date(2024, 1, 1))
assert_standard(r, Decimal("1000"))
check("باقیمانده به آخرین قسط", r[-1]["amount"] == Decimal("333.34"),
      f"last: {r[-1]['amount']}")

# ─── سناریو ۲: تست باگ اسکرین‌شات ───
print("\n[۲] بازتولید باگ اسکرین‌شات: ۹,۹۰۰,۰۰۰ ÷ ۲")
r = generate_installments(Decimal("9900000"), 2, 30, date(2024, 1, 1))
assert_standard(r, Decimal("9900000"))
check("قسط ۲ بعد از قسط ۱", r[1]["due_date"] > r[0]["due_date"],
      f"d1={r[0]['due_date']}, d2={r[1]['due_date']}")
check("هر قسط = ۴,۹۵۰,۰۰۰", r[0]["amount"] == Decimal("4950000"), f"{r[0]['amount']}")
check("جمع = ۹,۹۰۰,۰۰۰", sum(x["amount"] for x in r) == Decimal("9900000"))

# ─── سناریو ۳: پیش‌پرداخت ───
print("\n[۳] ۱۰,۰۰۰,۰۰۰ با پیش‌پرداخت ۳,۰۰۰,۰۰۰ و ۲ قسط")
r = generate_installments(Decimal("10000000"), 2, 30, date(2024, 1, 1), Decimal("3000000"))
assert_standard(r, Decimal("10000000"), Decimal("3000000"))
check("هر قسط = ۳,۵۰۰,۰۰۰", r[0]["amount"] == Decimal("3500000"))

# ─── سناریو ۴: تعداد = ۱ ───
print("\n[۴] تک‌قسط")
r = generate_installments(Decimal("5000000"), 1, 30, date(2024, 1, 1))
check("۱ قسط", len(r) == 1)
check("مبلغ = کل", r[0]["amount"] == Decimal("5000000"))
assert_standard(r, Decimal("5000000"))

# ─── سناریو ۵: تعداد = ۰ ───
print("\n[۵] تعداد صفر → خطا")
try:
    generate_installments(Decimal("1000"), 0, 30, date(2024, 1, 1))
    check("باید خطا بدهد", False, "خطا نداد")
except ValueError:
    check("خطا داد", True)

# ─── سناریو ۶: مبلغ صفر ───
print("\n[۶] مبلغ صفر → لیست خالی")
r = generate_installments(Decimal("0"), 3, 30, date(2024, 1, 1))
check("لیست خالی", r == [])

# ─── سناریو ۷: پیش‌پرداخت >= total ───
print("\n[۷] پیش‌پرداخت = کل → بدون قسط")
r = generate_installments(Decimal("1000"), 3, 30, date(2024, 1, 1), Decimal("1000"))
check("لیست خالی", r == [])

# ─── سناریو ۸: ۱۰۰ ÷ ۷ (باقیمانده) ───
print("\n[۸] ۱۰۰ ÷ ۷ (باقیمانده ۰.۰۳)")
r = generate_installments(Decimal("100"), 7, 30, date(2024, 1, 1))
assert_standard(r, Decimal("100"))
check("۶ قسط اول = ۱۴.۲۹", all(x["amount"] == Decimal("14.29") for x in r[:6]))
check("قسط آخر = ۱۴.۲۶", r[-1]["amount"] == Decimal("14.26"), f"{r[-1]['amount']}")

# ─── سناریو ۹: ۳۱ روز ───
print("\n[۹] فاصله ۳۱ روز")
r = generate_installments(Decimal("1000"), 3, 31, date(2024, 1, 1))
check("d1 = 2024-02-01", r[0]["due_date"] == date(2024, 2, 1))
check("d2 = 2024-03-03", r[1]["due_date"] == date(2024, 3, 3))

# ─── سناریو ۱۰: ۱ روز ───
print("\n[۱۰] فاصله ۱ روز")
r = generate_installments(Decimal("1000"), 3, 1, date(2024, 1, 1))
check("d1 = 01-02", r[0]["due_date"] == date(2024, 1, 2))
check("d3 = 01-04", r[2]["due_date"] == date(2024, 1, 4))

# ─── سناریو ۱۱: فاصله ۰ ───
print("\n[۱۱] فاصله صفر → همه یک‌روز")
r = generate_installments(Decimal("1000"), 3, 0, date(2024, 1, 1))
check("همه تاریخ‌ها یکسان", all(x["due_date"] == date(2024, 1, 1) for x in r))

# ─── سناریو ۱۲: سال کبیسه ───
print("\n[۱۲] سال کبیسه")
r = generate_installments(Decimal("1000"), 2, 366, date(2024, 1, 1))
check("d1 = 2025-01-01", r[0]["due_date"] == date(2025, 1, 1))

# ─── سناریو ۱۳: ۱۲ قسط ۳۰ روزه ───
print("\n[۱۳] ۱۲ قسط")
r = generate_installments(Decimal("12000000"), 12, 30, date(2024, 1, 1))
assert_standard(r, Decimal("12000000"))
check("۱۲ قسط", len(r) == 12)

# ─── سناریو ۱۴: مبلغ خیلی کم ───
print("\n[۱۴] ۱۰ تومان ÷ ۳ قسط → خطای مبلغ صفر")
r = generate_installments(Decimal("10"), 3, 30, date(2024, 1, 1))
check("قسط ۰.۰۱", r[0]["amount"] == Decimal("3.33"))

# ─── سناریو ۱۵: مبلغ = ۱ ÷ ۳ ───
print("\n[۱۵] ۱ ÷ ۳ → قسط ۰.۳۳ و ۰.۳۴")
r = generate_installments(Decimal("1"), 3, 30, date(2024, 1, 1))
assert_standard(r, Decimal("1"))
check("مبلغ نهایی ۰.۳۴", r[-1]["amount"] == Decimal("0.34"))

# ─── سناریو ۱۶: ۵ قسط (باقیمانده بزرگ) ───
print("\n[۱۶] ۱۰۰,۰۰۰ ÷ ۵")
r = generate_installments(Decimal("100000"), 5, 30, date(2024, 1, 1))
assert_standard(r, Decimal("100000"))
check("همه = ۲۰,۰۰۰", all(x["amount"] == Decimal("20000") for x in r))

# ─── سناریو ۱۷: ۳ قسط ۹۰ روزه ───
print("\n[۱۷] ۳ قسط ۹۰ روزه")
r = generate_installments(Decimal("100000"), 3, 90, date(2024, 1, 1))
check("d1 = 2024-03-31", r[0]["due_date"] == date(2024, 3, 31))
check("d2 = 2024-06-29", r[1]["due_date"] == date(2024, 6, 29))

# ─── سناریو ۱۸: preorder (advance=total) ───
print("\n[۱۸] پیش‌پرداخت کامل")
r = generate_installments(Decimal("5000"), 3, 30, date(2024, 1, 1), Decimal("5000"))
check("لیست خالی", r == [])

# ─── سناریو ۱۹: negative total ───
print("\n[۱۹] مبلغ منفی")
r = generate_installments(Decimal("-100"), 3, 30, date(2024, 1, 1))
check("لیست خالی", r == [] or sum(x["amount"] for x in r) <= 0)

# ─── سناریو ۲۰: count منفی ───
print("\n[۲۰] تعداد منفی → خطا")
try:
    generate_installments(Decimal("1000"), -1, 30, date(2024, 1, 1))
    check("باید خطا بدهد", False)
except ValueError:
    check("خطا داد", True)

# ─── سناریو ۲۱: گپ منفی ───
print("\n[۲۱] گپ منفی")
r = generate_installments(Decimal("1000"), 3, -10, date(2024, 1, 1))
check("تاریخ‌ها صعودی نیستند (رفتار فعلی)", r[1]["due_date"] < r[0]["due_date"])

# ─── سناریو ۲۲: precision — مبالغ Decimal ───
print("\n[۲۲] دقت اعشار")
r = generate_installments(Decimal("100000.01"), 3, 30, date(2024, 1, 1))
check("جمع دقیق", sum(x["amount"] for x in r) == Decimal("100000.01"))

# ─── سناریو ۲۳: ۱۲ قسط ۱۰۰,۰۰۰ ───
print("\n[۲۳] ۱۲ قسط ۱۰۰,۰۰۰")
r = generate_installments(Decimal("100000"), 12, 30, date(2024, 1, 1))
assert_standard(r, Decimal("100000"))

# ─── سناریو ۲۴: ۳ قسط با تاریخ شروع ۳۱ ام ───
print("\n[۲۴] شروع ۳۱ ام با گپ ۳۰")
r = generate_installments(Decimal("1000"), 3, 30, date(2024, 1, 31))
check("d1 = 2024-03-01", r[0]["due_date"] == date(2024, 3, 1))
check("d2 = 2024-03-31", r[1]["due_date"] == date(2024, 3, 31))

# ─── سناریو ۲۵: صعودی بودن در همه حالت‌ها ───
print("\n[۲۵] صعودی در همه تنظیمات")
for n in [1, 2, 5, 10, 24]:
    r = generate_installments(Decimal("100000"), n, 30, date(2024, 1, 1))
    dates = [x["due_date"] for x in r]
    check(f"n={n} صعودی", all(dates[i] < dates[i+1] for i in range(len(dates)-1)))

# ═══════════════════════════════════════════════
print("\n" + "=" * 60)
print(f"نتیجه: {PASS} پاس، {FAIL} خطا")
print("=" * 60)

if FAIL == 0:
    print("\n🎉 همه تست‌ها موفق")
else:
    print(f"\n⚠️ {FAIL} تست شکست — اینا باگ‌های کد شما هستن")
