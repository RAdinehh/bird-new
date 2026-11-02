import { describe, it, expect } from 'vitest';
import { getDealPaymentFormSchema } from '../shr/validation/rules/tra';

const MAX = 100_000;

describe('getDealPaymentFormSchema (L11)', () => {
  const valid = {
    date: '1405/08/01',
    amount: 50_000,
    direction: 'in' as const,
    method: 'cash' as const,
    notes: '',
    checkNo: '',
    bank: '',
    dueDate: '',
  };

  it('valid input → passes', () => {
    const r = getDealPaymentFormSchema(MAX).safeParse(valid);
    expect(r.success).toBe(true);
  });

  it('amount = 0 → error', () => {
    const r = getDealPaymentFormSchema(MAX).safeParse({ ...valid, amount: 0 });
    expect(r.success).toBe(false);
    if (!r.success) expect(r.error.issues.some(i => i.path[0] === 'amount')).toBe(true);
  });

  it('amount < 0 → error', () => {
    const r = getDealPaymentFormSchema(MAX).safeParse({ ...valid, amount: -1 });
    expect(r.success).toBe(false);
  });

  it('amount > maxAmount → error', () => {
    const r = getDealPaymentFormSchema(MAX).safeParse({ ...valid, amount: MAX + 1 });
    expect(r.success).toBe(false);
    if (!r.success) expect(r.error.issues.some(i => i.path[0] === 'amount')).toBe(true);
  });

  it('amount = maxAmount → OK (boundary)', () => {
    const r = getDealPaymentFormSchema(MAX).safeParse({ ...valid, amount: MAX });
    expect(r.success).toBe(true);
  });

  it('empty date → error', () => {
    const r = getDealPaymentFormSchema(MAX).safeParse({ ...valid, date: '' });
    expect(r.success).toBe(false);
    if (!r.success) expect(r.error.issues.some(i => i.path[0] === 'date')).toBe(true);
  });

  it('invalid direction → error', () => {
    const r = getDealPaymentFormSchema(MAX).safeParse({ ...valid, direction: 'sideways' });
    expect(r.success).toBe(false);
  });

  it('invalid method → error', () => {
    const r = getDealPaymentFormSchema(MAX).safeParse({ ...valid, method: 'crypto' });
    expect(r.success).toBe(false);
  });

  it('method=check without checkNo → error', () => {
    const r = getDealPaymentFormSchema(MAX).safeParse({ ...valid, method: 'check', checkNo: '' });
    expect(r.success).toBe(false);
    if (!r.success) expect(r.error.issues.some(i => i.path[0] === 'checkNo')).toBe(true);
  });

  it('method=check with checkNo → OK', () => {
    const r = getDealPaymentFormSchema(MAX).safeParse({ ...valid, method: 'check', checkNo: '12345' });
    expect(r.success).toBe(true);
  });

  it('method=cash without checkNo → OK', () => {
    const r = getDealPaymentFormSchema(MAX).safeParse({ ...valid, method: 'cash', checkNo: '' });
    expect(r.success).toBe(true);
  });

  it('zero maxAmount (no debt) + amount>0 → error', () => {
    const r = getDealPaymentFormSchema(0).safeParse({ ...valid, amount: 1 });
    expect(r.success).toBe(false);
  });
});
