import { describe, it, expect, beforeEach } from 'vitest';
import { useTra } from '../mod/tra/store';
import type { Invoice, Payment } from '../mod/tra/types';

const makeInvoice = (overrides: Partial<Invoice> = {}): Invoice => ({
  id: 'inv-' + Math.random(),
  type: 'sale',
  number: 'S1405010001',
  date: '1405/08/01',
  partyId: 'party-1',
  category: 'chick',
  items: [],
  payments: [],
  total: 1000000,
  dueDate: '1405/09/01',
  relatedFlockId: '',
  relatedEntryId: '',
  notes: '',
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
  ...overrides,
});

const makePayment = (id: string, amount: number): Payment => ({
  id,
  date: '1405/08/01',
  amount,
  method: 'cash',
  checkNo: '',
  bank: '',
  dueDate: '',
  notes: '',
  type: 'regular',
});

function payInvoice(invoiceId: string, paymentId: string, amount: number) {
  useTra.setState({
    invoices: useTra.getState().invoices.map(x =>
      x.id === invoiceId
        ? { ...x, payments: [...(x.payments || []), makePayment(paymentId, amount)] }
        : x
    ),
  });
  useTra.getState().addAllocation({
    paymentId,
    invoiceId,
    amount,
    date: '1405/08/01',
  });
}

describe('addAllocation — C5 gap auto-cancel', () => {
  beforeEach(() => {
    useTra.setState({ invoices: [], partyPayments: [], allocations: [] });
  });

  it('fully paid → nextReminderAt cleared', () => {
    const inv = makeInvoice({ id: 'inv1', total: 1000000, nextReminderAt: '1405/09/15' });
    useTra.setState({ invoices: [inv] });
    payInvoice('inv1', 'p1', 1000000);
    expect(useTra.getState().invoices[0].nextReminderAt).toBeUndefined();
  });

  it('partially paid → nextReminderAt preserved', () => {
    const inv = makeInvoice({ id: 'inv1', total: 1000000, nextReminderAt: '1405/09/15' });
    useTra.setState({ invoices: [inv] });
    payInvoice('inv1', 'p1', 400000);
    expect(useTra.getState().invoices[0].nextReminderAt).toBe('1405/09/15');
  });

  it('two allocations together fully pay → cancel on second', () => {
    const inv = makeInvoice({ id: 'inv1', total: 1000000, nextReminderAt: '1405/09/15' });
    useTra.setState({ invoices: [inv] });
    payInvoice('inv1', 'p1', 400000);
    expect(useTra.getState().invoices[0].nextReminderAt).toBe('1405/09/15');
    payInvoice('inv1', 'p2', 600000);
    expect(useTra.getState().invoices[0].nextReminderAt).toBeUndefined();
  });

  it('no reminder → no crash', () => {
    const inv = makeInvoice({ id: 'inv1', total: 1000000 });
    useTra.setState({ invoices: [inv] });
    expect(() => payInvoice('inv1', 'p1', 1000000)).not.toThrow();
  });

  it('invoice not found → no crash', () => {
    expect(() => useTra.getState().addAllocation({
      paymentId: 'p1', invoiceId: 'nonexistent', amount: 1000000, date: '1405/08/01',
    })).not.toThrow();
  });

  it('over-allocation (sum > total) → cleared', () => {
    const inv = makeInvoice({ id: 'inv1', total: 1000000, nextReminderAt: '1405/09/15' });
    useTra.setState({ invoices: [inv] });
    payInvoice('inv1', 'p1', 1500000);
    expect(useTra.getState().invoices[0].nextReminderAt).toBeUndefined();
  });

  it('clearPartyPayment → reminder canceled on fully-paid invoice', () => {
    const inv = makeInvoice({
      id: 'inv1',
      total: 1000000,
      nextReminderAt: '1405/09/15',
      payments: [{
        id: 'p1', date: '1405/08/01', amount: 1000000, method: 'check',
        checkNo: '123', bank: 'ملت', dueDate: '1405/09/01', notes: '',
        type: 'regular', status: 'pending', partyPaymentId: 'pp1',
      }],
    });
    const pp = {
      id: 'pp1', partyId: 'party-1', date: '1405/08/01', amount: 1000000,
      method: 'check', type: 'regular' as const, checkNo: '123', bank: 'ملت',
      dueDate: '1405/09/01', notes: '', status: 'in_transit' as const,
      createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z',
    };
    useTra.setState({
      invoices: [inv],
      partyPayments: [pp],
      allocations: [{ id: 'a1', paymentId: 'p1', invoiceId: 'inv1', amount: 1000000, date: '1405/08/01' }],
    });
    useTra.getState().clearPartyPayment('pp1');
    expect(useTra.getState().invoices[0].nextReminderAt).toBeUndefined();
  });

  it('clearPartyPayment → reminder preserved if still partial', () => {
    const inv = makeInvoice({
      id: 'inv1',
      total: 1000000,
      nextReminderAt: '1405/09/15',
      payments: [{
        id: 'p1', date: '1405/08/01', amount: 400000, method: 'check',
        checkNo: '123', bank: 'ملت', dueDate: '1405/09/01', notes: '',
        type: 'regular', status: 'pending', partyPaymentId: 'pp1',
      }],
    });
    const pp = {
      id: 'pp1', partyId: 'party-1', date: '1405/08/01', amount: 400000,
      method: 'check', type: 'regular' as const, checkNo: '123', bank: 'ملت',
      dueDate: '1405/09/01', notes: '', status: 'in_transit' as const,
      createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z',
    };
    useTra.setState({
      invoices: [inv],
      partyPayments: [pp],
      allocations: [{ id: 'a1', paymentId: 'p1', invoiceId: 'inv1', amount: 400000, date: '1405/08/01' }],
    });
    useTra.getState().clearPartyPayment('pp1');
    expect(useTra.getState().invoices[0].nextReminderAt).toBe('1405/09/15');
  });

  it('check payment pending → not counted, reminder preserved', () => {
    const inv = makeInvoice({ id: 'inv1', total: 1000000, nextReminderAt: '1405/09/15' });
    const checkPayment: Payment = {
      id: 'p1', date: '1405/08/01', amount: 1000000, method: 'check',
      checkNo: '123', bank: 'ملت', dueDate: '1405/09/01', notes: '',
      type: 'regular', status: 'pending',
    };
    useTra.setState({
      invoices: [{ ...inv, payments: [checkPayment] }],
      allocations: [],
    });
    useTra.getState().addAllocation({ paymentId: 'p1', invoiceId: 'inv1', amount: 1000000, date: '1405/08/01' });
    expect(useTra.getState().invoices[0].nextReminderAt).toBe('1405/09/15');
  });
});
