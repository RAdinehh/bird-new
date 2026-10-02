import { describe, it, expect, beforeEach } from 'vitest';
import {
  useTra,
  generateInvoiceNumber, calcDueDate,
  nextWorkflowStatus, prevWorkflowStatus, workflowTone,
  calcItemTotal, calcItemDiscount,
  checkTone, pendingChecksSum, pendingChecks,
  itemTotal, itemsSum, paidSum,
  invoiceStatus, remaining, ageDays, agingBucket,
  PAYMENT_TERMS_LABEL, WORKFLOW_LABEL, CHECK_STATUS_LABEL,
  STATUS_LABEL, DEAL_LABEL, PAYMENT_LABEL,
} from '../mod/tra/store';

const makeInvoice = (overrides: any = {}) => ({
  type: 'purchase',
  number: 'P1405010001',
  date: '1405/01/01',
  dueDate: '1405/02/01',
  total: 100000,
  items: [],
  payments: [],
  ...overrides,
});

const makePayment = (amount: number, method: 'cash'|'check' = 'cash', status?: 'pending'|'cleared'|'bounced') => ({
  id: 'p' + Math.random(),
  amount,
  method,
  status,
  date: '1405/01/01',
});

beforeEach(() => {
  useTra.setState({ invoices: [], deals: [] });
});

// ═══════════════════════════════════════════════
// generateInvoiceNumber
// ═══════════════════════════════════════════════
describe('generateInvoiceNumber', () => {
  it('اولین فاکتور → suffix 001', () => {
    const num = generateInvoiceNumber('purchase', '1405/07/09', []);
    expect(num).toBe('P140507001');
  });

  it('sale → prefix S', () => {
    const num = generateInvoiceNumber('sale', '1405/07/09', []);
    expect(num).toBe('S140507001');
  });

  it('فاکتور قبلی → suffix +1', () => {
    const existing = [makeInvoice({ type: 'purchase', number: 'P140507001' })];
    const num = generateInvoiceNumber('purchase', '1405/07/09', existing);
    expect(num).toBe('P140507002');
  });

  it('suffix بر اساس بزرگترین', () => {
    const existing = [
      makeInvoice({ type: 'purchase', number: 'P140507005' }),
      makeInvoice({ type: 'purchase', number: 'P140507003' }),
    ];
    const num = generateInvoiceNumber('purchase', '1405/07/09', existing);
    expect(num).toBe('P140507006');
  });

  it('فاکتور sale روی purchase تأثیر نداره', () => {
    const existing = [makeInvoice({ type: 'purchase', number: 'P1405070005' })];
    const num = generateInvoiceNumber('sale', '1405/07/09', existing);
    expect(num).toBe('S140507001');
  });

  it('ماه متفاوت → pattern متفاوت', () => {
    const existing = [makeInvoice({ type: 'purchase', number: 'P140506001' })];
    const num = generateInvoiceNumber('purchase', '1405/07/09', existing);
    expect(num).toBe('P140507001');
  });

  it('تاریخ خالی → fallback 1400/01', () => {
    const num = generateInvoiceNumber('purchase', '', []);
    expect(num).toBe('P140001001');
  });

  it('suffix عدد 4 رقمی → درست پارس میشه', () => {
    const existing = [makeInvoice({ type: 'purchase', number: 'P140507010' })];
    const num = generateInvoiceNumber('purchase', '1405/07/09', existing);
    expect(num).toBe('P140507011');
  });
});

// ═══════════════════════════════════════════════
// calcDueDate — BUG CANDIDATE
// ═══════════════════════════════════════════════
describe('calcDueDate', () => {
  it('cash → تاریخ فاکتور', () => {
    expect(calcDueDate('cash', '1405/07/09')).toBe('1405/07/09');
  });

  it('custom → customDueDate', () => {
    expect(calcDueDate('custom', '1405/07/09', '1405/09/15')).toBe('1405/09/15');
  });

  it('custom بدون customDueDate → تاریخ فاکتور', () => {
    expect(calcDueDate('custom', '1405/07/09')).toBe('1405/07/09');
  });

  it('تاریخ خالی → customDueDate یا خالی', () => {
    expect(calcDueDate('installment', '')).toBe('');
    expect(calcDueDate('installment', '', '1405/12/01')).toBe('1405/12/01');
  });

  it('installment: 30 روز بعد = 8 آبان? (NOT 8 بهمن)', () => {
    // شمسی: مهر 30 روز، آبان 30 روز
    // 9 مهر + 30 روز = 9 آبان
    // این تست باید fail بشه اگه باگ باشه
    const due = calcDueDate('installment', '1405/07/09', undefined, 30);
    // انتظار: 1405/08/09
    expect(due).toBe('1405/08/09');
  });

  it('installment: 60 روز بعد از 9 مهر = 9 آذر', () => {
    const due = calcDueDate('installment', '1405/07/09', undefined, 60);
    // مهر 30 + آبان 30 = 60 → 9 آذر
    expect(due).toBe('1405/09/09');
  });

  it('installment: بدون gap → پیش‌فرض 30', () => {
    const due = calcDueDate('installment', '1405/07/09');
    expect(due).toBe('1405/08/09');
  });
});

// ═══════════════════════════════════════════════
// workflow
// ═══════════════════════════════════════════════
describe('workflow', () => {
  it('next: draft → confirmed', () => {
    expect(nextWorkflowStatus('draft')).toBe('confirmed');
  });
  it('next: received → paid', () => {
    expect(nextWorkflowStatus('received')).toBe('paid');
  });
  it('next: paid → null', () => {
    expect(nextWorkflowStatus('paid')).toBeNull();
  });
  it('next: undefined → confirmed', () => {
    expect(nextWorkflowStatus(undefined)).toBe('confirmed');
  });

  it('prev: confirmed → draft', () => {
    expect(prevWorkflowStatus('confirmed')).toBe('draft');
  });
  it('prev: draft → null', () => {
    expect(prevWorkflowStatus('draft')).toBeNull();
  });
  it('prev: undefined → null', () => {
    expect(prevWorkflowStatus(undefined)).toBeNull();
  });

  it('tone: draft → gray', () => {
    expect(workflowTone('draft')).toBe('gray');
  });
  it('tone: received → amber', () => {
    expect(workflowTone('received')).toBe('amber');
  });
  it('tone: paid → green', () => {
    expect(workflowTone('paid')).toBe('green');
  });
});

// ═══════════════════════════════════════════════
// item calculations
// ═══════════════════════════════════════════════
describe('calcItemTotal', () => {
  it('بدون تخفیف', () => {
    expect(calcItemTotal(5, 1000)).toBe(5000);
  });
  it('تخفیف درصدی', () => {
    expect(calcItemTotal(5, 1000, 'percent', 10)).toBe(4500);
  });
  it('تخفیف مبلغی', () => {
    expect(calcItemTotal(5, 1000, 'amount', 500)).toBe(4500);
  });
  it('تخفیف بیشتر از مبلغ → 0 (نه منفی)', () => {
    expect(calcItemTotal(5, 1000, 'amount', 10000)).toBe(0);
  });
  it('null/undefined → 0', () => {
    expect(calcItemTotal(0, 0)).toBe(0);
  });
});

describe('calcItemDiscount', () => {
  it('بدون تخفیف → 0', () => {
    expect(calcItemDiscount(5, 1000)).toBe(0);
  });
  it('تخفیف درصدی → مقدار درست', () => {
    expect(calcItemDiscount(5, 1000, 'percent', 10)).toBe(500);
  });
  it('تخفیف مبلغی', () => {
    expect(calcItemDiscount(5, 1000, 'amount', 500)).toBe(500);
  });
});

describe('itemTotal, itemsSum, paidSum', () => {
  it('itemTotal', () => {
    expect(itemTotal(3, 100)).toBe(300);
    expect(itemTotal(0, 100)).toBe(0);
  });
  it('itemsSum', () => {
    expect(itemsSum([
      { total: 100 } as any,
      { total: 200 } as any,
    ])).toBe(300);
  });
  it('itemsSum خالی → 0', () => {
    expect(itemsSum([])).toBe(0);
  });
  it('paidSum', () => {
    expect(paidSum([
      makePayment(100),
      makePayment(200),
    ] as any)).toBe(300);
  });
});

// ═══════════════════════════════════════════════
// invoiceStatus — مالی مهم
// ═══════════════════════════════════════════════
describe('invoiceStatus', () => {
  it('بدون پرداخت → unpaid', () => {
    expect(invoiceStatus(makeInvoice({ total: 1000 }) as any)).toBe('unpaid');
  });

  it('پرداخت کامل → paid', () => {
    expect(invoiceStatus(makeInvoice({ total: 1000, payments: [makePayment(1000)] }) as any)).toBe('paid');
  });

  it('پرداخت ناقص → partial', () => {
    expect(invoiceStatus(makeInvoice({ total: 1000, payments: [makePayment(500)] }) as any)).toBe('partial');
  });

  it('پرداخت بیشتر از مبلغ → paid', () => {
    expect(invoiceStatus(makeInvoice({ total: 1000, payments: [makePayment(1500)] }) as any)).toBe('paid');
  });

  it('چند پرداخت → جمع درست', () => {
    expect(invoiceStatus(makeInvoice({ total: 1000, payments: [makePayment(300), makePayment(400)] }) as any)).toBe('partial');
  });
});

// ═══════════════════════════════════════════════
// remaining
// ═══════════════════════════════════════════════
describe('remaining', () => {
  it('بدون پرداخت → total', () => {
    expect(remaining(makeInvoice({ total: 1000 }) as any)).toBe(1000);
  });
  it('پرداخت جزئی → باقی', () => {
    expect(remaining(makeInvoice({ total: 1000, payments: [makePayment(300)] }) as any)).toBe(700);
  });
  it('پرداخت کامل → 0', () => {
    expect(remaining(makeInvoice({ total: 1000, payments: [makePayment(1000)] }) as any)).toBe(0);
  });
  it('پرداخت بیشتر → 0 (نه منفی)', () => {
    expect(remaining(makeInvoice({ total: 1000, payments: [makePayment(1500)] }) as any)).toBe(0);
  });
});

// ═══════════════════════════════════════════════
// check helpers
// ═══════════════════════════════════════════════
describe('checkTone', () => {
  it('pending → gray', () => {
    expect(checkTone('pending')).toBe('gray');
  });
  it('cleared → green', () => {
    expect(checkTone('cleared')).toBe('green');
  });
  it('bounced → red', () => {
    expect(checkTone('bounced')).toBe('red');
  });
  it('undefined → gray', () => {
    expect(checkTone(undefined)).toBe('gray');
  });
});

describe('pendingChecksSum', () => {
  it('فقط چک‌های pending', () => {
    const payments = [
      makePayment(100, 'cash'),
      makePayment(500, 'check', 'pending'),
      makePayment(300, 'check', 'cleared'),
      makePayment(200, 'check'),  // بدون status → pending
    ];
    expect(pendingChecksSum(payments as any)).toBe(700);
  });

  it('بدون چک pending → 0', () => {
    const payments = [
      makePayment(500, 'check', 'cleared'),
    ];
    expect(pendingChecksSum(payments as any)).toBe(0);
  });
});

// ═══════════════════════════════════════════════
// aging
// ═══════════════════════════════════════════════
describe('agingBucket', () => {
  it('<=15 → 0-15', () => {
    expect(agingBucket(0)).toBe('0-15');
    expect(agingBucket(15)).toBe('0-15');
  });
  it('16-30 → 16-30', () => {
    expect(agingBucket(16)).toBe('16-30');
    expect(agingBucket(30)).toBe('16-30');
  });
  it('31-60', () => {
    expect(agingBucket(31)).toBe('31-60');
    expect(agingBucket(60)).toBe('31-60');
  });
  it('61-90', () => {
    expect(agingBucket(61)).toBe('61-90');
    expect(agingBucket(90)).toBe('61-90');
  });
  it('>90 → +90', () => {
    expect(agingBucket(91)).toBe('+90');
    expect(agingBucket(365)).toBe('+90');
  });
});

// ═══════════════════════════════════════════════
// constants
// ═══════════════════════════════════════════════
describe('constants', () => {
  it('PAYMENT_TERMS_LABEL', () => {
    expect(PAYMENT_TERMS_LABEL.cash).toBeTruthy();
  });
  it('WORKFLOW_LABEL', () => {
    expect(WORKFLOW_LABEL.draft).toBeTruthy();
  });
  it('CHECK_STATUS_LABEL', () => {
    expect(CHECK_STATUS_LABEL.pending).toBeTruthy();
  });
  it('STATUS_LABEL', () => {
    expect(STATUS_LABEL.paid).toBeTruthy();
  });
});
