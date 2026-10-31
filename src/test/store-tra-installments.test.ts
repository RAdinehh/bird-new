/**
 * store-tra-installments.test.ts — تست‌های L11 برای اقساط
 * پوشش: generateInstallments + applyPaymentsToInstallments (FIFO/بازپرداخت/چک برگشتی)
 */
import { describe, it, expect } from 'vitest';
import { generateInstallments, applyPaymentsToInstallments } from '../mod/tra/calc';
import type { Installment, Payment } from '../mod/tra/types';

// ─── Builders ───
const mkInst = (o: Partial<Installment> = {}): Installment => ({
  id: 'inst-1', number: 1, dueDate: '1410/01/01', amount: 1000000,
  status: 'pending', paid: false, paidDate: '', ...o,
});

const mkPayment = (o: Partial<Payment> = {}): Payment => ({
  id: 'pay-1', date: '1405/08/15', amount: 1000000,
  method: 'cash', checkNo: '', bank: '', dueDate: '', notes: '',
  ...o,
} as Payment);

// ══════════════════════════════════════════════════════════
// generateInstallments
// ══════════════════════════════════════════════════════════
describe('generateInstallments', () => {
  it('سه قسط مساوی', () => {
    const inst = generateInstallments(3000000, 3, 30, '1405/08/01');
    expect(inst).toHaveLength(3);
    expect(inst[0].amount).toBe(1000000);
    expect(inst[1].amount).toBe(1000000);
    expect(inst[2].amount).toBe(1000000);
    expect(inst[0].status).toBe('pending');
    expect(inst[0].number).toBe(1);
  });

  it('باقیمانده به قسط آخر', () => {
    const inst = generateInstallments(100000, 3, 30, '1405/08/01');
    expect(inst).toHaveLength(3);
    const total = inst.reduce((s, x) => s + x.amount, 0);
    expect(total).toBe(100000);
    expect(inst[2].amount).toBeGreaterThanOrEqual(inst[0].amount);
  });

  it('پیش‌پرداخت از مبلغ کسر می‌شه', () => {
    const inst = generateInstallments(3000000, 3, 30, '1405/08/01', 500000);
    const total = inst.reduce((s, x) => s + x.amount, 0);
    expect(total).toBe(2500000);
  });

  it('count=0 → آرایه خالی', () => {
    expect(generateInstallments(1000000, 0, 30, '1405/08/01')).toEqual([]);
  });

  it('totalAmount=0 → آرایه خالی', () => {
    expect(generateInstallments(0, 3, 30, '1405/08/01')).toEqual([]);
  });

  it('dueDate هر قسط gapDays به بعد از قبلیه', () => {
    const inst = generateInstallments(3000000, 3, 30, '1405/08/01');
    expect(inst[0].dueDate > '1405/08/01').toBe(true);
    expect(inst[1].dueDate > inst[0].dueDate).toBe(true);
    expect(inst[2].dueDate > inst[1].dueDate).toBe(true);
  });
});

// ══════════════════════════════════════════════════════════
// applyPaymentsToInstallments — FIFO cascade
// ══════════════════════════════════════════════════════════
describe('applyPaymentsToInstallments — FIFO cascade', () => {
  it('بدون پرداخت → همه pending (سرسید آینده)', () => {
    const inst = [mkInst({ number: 1 }), mkInst({ id: 'i2', number: 2 })];
    const result = applyPaymentsToInstallments(inst, []);
    expect(result.every(x => x.status === 'pending')).toBe(true);
    expect(result.every(x => x.paidAmount === 0)).toBe(true);
  });

  it('پرداخت کامل قسط ۱ → paid', () => {
    const inst = [
      mkInst({ id: 'i1', number: 1, amount: 1000000 }),
      mkInst({ id: 'i2', number: 2, amount: 1000000 }),
    ];
    const result = applyPaymentsToInstallments(inst, [mkPayment({ amount: 1000000 })]);
    expect(result[0].status).toBe('paid');
    expect(result[0].paidAmount).toBe(1000000);
    expect(result[0].paid).toBe(true);
    expect(result[1].status).toBe('pending');
    expect(result[1].paidAmount).toBe(0);
  });

  it('پرداخت جزئی → pending با paidAmount', () => {
    const inst = [mkInst({ id: 'i1', number: 1, amount: 1000000 })];
    const result = applyPaymentsToInstallments(inst, [mkPayment({ amount: 500000 })]);
    expect(result[0].status).toBe('pending');
    expect(result[0].paidAmount).toBe(500000);
  });

  it('FIFO: پرداخت ۱.۲M → قسط ۱ و ۲ paid، قسط ۳ pending', () => {
    const inst = [
      mkInst({ id: 'i1', number: 1, amount: 500000 }),
      mkInst({ id: 'i2', number: 2, amount: 500000 }),
      mkInst({ id: 'i3', number: 3, amount: 500000 }),
    ];
    const result = applyPaymentsToInstallments(inst, [mkPayment({ amount: 1200000 })]);
    expect(result[0].status).toBe('paid');
    expect(result[1].status).toBe('paid');
    expect(result[2].status).toBe('pending');
    expect(result[2].paidAmount).toBe(200000);
  });

  it('چک برگشتی در pool حساب نمی‌شه', () => {
    const inst = [mkInst({ id: 'i1', number: 1, amount: 1000000 })];
    const pay = [mkPayment({ amount: 1000000, method: 'check', status: 'bounced' } as any)];
    const result = applyPaymentsToInstallments(inst, pay);
    expect(result[0].status).toBe('pending');
    expect(result[0].paidAmount).toBe(0);
  });

  it('refund در pool حساب نمی‌شه', () => {
    const inst = [mkInst({ id: 'i1', number: 1, amount: 1000000 })];
    const pay = [mkPayment({ amount: 1000000, type: 'refund' } as any)];
    const result = applyPaymentsToInstallments(inst, pay);
    expect(result[0].status).toBe('pending');
  });

  it('سرسید گذشته + پرداخت نکرده → overdue', () => {
    // 1400/01/01 قطعاً گذشته (today = 1405/08/09)
    const inst = [mkInst({ id: 'i1', number: 1, amount: 1000000, dueDate: '1400/01/01' })];
    const result = applyPaymentsToInstallments(inst, []);
    expect(result[0].status).toBe('overdue');
  });

  it('سرسید گذشته + کامل پرداخت‌شده → paid (نه overdue)', () => {
    const inst = [mkInst({ id: 'i1', number: 1, amount: 1000000, dueDate: '1400/01/01' })];
    const result = applyPaymentsToInstallments(inst, [mkPayment({ amount: 1000000 })]);
    expect(result[0].status).toBe('paid');
  });

  it('idempotent: اجرای دوباره همون نتیجه', () => {
    const inst = [mkInst({ id: 'i1', number: 1, amount: 1000000 })];
    const pay = [mkPayment({ amount: 500000 })];
    const r1 = applyPaymentsToInstallments(inst, pay);
    const r2 = applyPaymentsToInstallments(r1, pay);
    expect(r2[0].paidAmount).toBe(r1[0].paidAmount);
    expect(r2[0].status).toBe(r1[0].status);
  });

  it('آرایه installments خالی → خروجی خالی', () => {
    expect(applyPaymentsToInstallments([], [mkPayment()])).toEqual([]);
  });
});
