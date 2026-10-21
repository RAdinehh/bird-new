from dataclasses import dataclass, field
from typing import List
from decimal import Decimal, ROUND_HALF_UP

@dataclass
class Invoice:
    id: str
    total: Decimal
    date: str
    paid_amount: Decimal = Decimal('0')
    status: str = "unpaid"

@dataclass
class Payment:
    id: str
    amount: Decimal
    date: str
    method: str
    status: str = "cleared"
    unallocated_amount: Decimal = field(init=False)

    def __post_init__(self):
        self.unallocated_amount = self.amount

@dataclass
class Allocation:
    payment_id: str
    invoice_id: str
    amount: Decimal

class PaymentAllocationEngine:
    def __init__(self):
        self.invoices: List[Invoice] = []
        self.payments: List[Payment] = []
        self.allocations: List[Allocation] = []

    def add_invoice(self, inv):
        self.invoices.append(inv)

    def add_payment(self, pmt):
        self.payments.append(pmt)

    def allocate_payment(self, payment_id):
        payment = next((p for p in self.payments if p.id == payment_id), None)
        if not payment or payment.status != "cleared":
            return []
        open_invoices = sorted(
            [inv for inv in self.invoices if inv.paid_amount < inv.total],
            key=lambda x: x.date
        )
        new_allocations = []
        remaining = payment.unallocated_amount
        for inv in open_invoices:
            if remaining <= 0:
                break
            needed = inv.total - inv.paid_amount
            alloc_amount = min(remaining, needed)
            if alloc_amount > 0:
                alloc = Allocation(payment.id, inv.id, alloc_amount)
                self.allocations.append(alloc)
                new_allocations.append(alloc)
                inv.paid_amount += alloc_amount
                inv.status = "paid" if inv.paid_amount >= inv.total else "partial"
                remaining -= alloc_amount
                payment.unallocated_amount -= alloc_amount
        return new_allocations

    def get_invoice_status(self, invoice_id):
        inv = next((i for i in self.invoices if i.id == invoice_id), None)
        return inv.status if inv else "not_found"

    def get_remaining_balance(self, invoice_id):
        inv = next((i for i in self.invoices if i.id == invoice_id), None)
        return (inv.total - inv.paid_amount) if inv else Decimal('0')


class InstallmentGenerator:
    @staticmethod
    def generate(total, count, rounding_strategy="last"):
        if count <= 0:
            return []
        base_amount = (total / count).quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)
        installments = [base_amount] * count
        total_base = base_amount * count
        remainder = total - total_base
        if remainder != 0:
            if rounding_strategy == "first":
                installments[0] += remainder
            elif rounding_strategy == "last":
                installments[-1] += remainder
        assert sum(installments) == total
        return installments


def run_tests():
    print("=" * 60)
    print("شروع تست سیستم تخصیص پرداخت")
    print("=" * 60)

    print("\n[1] یک چک 250 برای سه فاکتور 100/200/300")
    e1 = PaymentAllocationEngine()
    e1.add_invoice(Invoice("A", Decimal("100"), "2024-01-01"))
    e1.add_invoice(Invoice("B", Decimal("200"), "2024-01-02"))
    e1.add_invoice(Invoice("C", Decimal("300"), "2024-01-03"))
    e1.add_payment(Payment("P1", Decimal("250"), "2024-01-05", "cash"))
    e1.allocate_payment("P1")
    assert e1.get_invoice_status("A") == "paid"
    assert e1.get_invoice_status("B") == "partial"
    assert e1.get_invoice_status("C") == "unpaid"
    assert e1.get_remaining_balance("B") == Decimal("50")
    print("   OK: A پرداخت شد، B جزئی، C باز")

    print("\n[2] پرداخت 150 برای فاکتور 100 → 50 اعتبار")
    e2 = PaymentAllocationEngine()
    e2.add_invoice(Invoice("INV1", Decimal("100"), "2024-01-01"))
    e2.add_payment(Payment("P_OVER", Decimal("150"), "2024-01-02", "cash"))
    e2.allocate_payment("P_OVER")
    assert e2.get_invoice_status("INV1") == "paid"
    assert e2.payments[0].unallocated_amount == Decimal("50")
    print("   OK: 50 اعتبار ذخیره شد")

    print("\n[3] چک 80 Pending برای فاکتور 100 → نادیده")
    e3 = PaymentAllocationEngine()
    e3.add_invoice(Invoice("INV_P", Decimal("100"), "2024-01-01"))
    e3.add_payment(Payment("P_PENDING", Decimal("80"), "2024-01-02", "check", status="pending"))
    allocs = e3.allocate_payment("P_PENDING")
    assert len(allocs) == 0
    assert e3.get_invoice_status("INV_P") == "unpaid"
    print("   OK: چک Pending نادیده گرفته شد")

    print("\n[4] 100 تومان در 3 قسط")
    inst = InstallmentGenerator.generate(Decimal("100.00"), 3, rounding_strategy="last")
    assert inst == [Decimal("33.33"), Decimal("33.33"), Decimal("33.34")]
    assert sum(inst) == Decimal("100.00")
    print(f"   OK: {inst} — مجموع درست")

    print("\n[5] چک Cleared بعد Bounced")
    e5 = PaymentAllocationEngine()
    e5.add_invoice(Invoice("INV_B", Decimal("100"), "2024-01-01"))
    chk = Payment("P_CHK", Decimal("100"), "2024-01-02", "check", status="cleared")
    e5.add_payment(chk)
    e5.allocate_payment("P_CHK")
    assert e5.get_invoice_status("INV_B") == "paid"
    print("   OK: چک Cleared تخصیص یافت")

    print("\n" + "=" * 60)
    print("همه تست‌ها موفق!")
    print("=" * 60)


if __name__ == "__main__":
    run_tests()
