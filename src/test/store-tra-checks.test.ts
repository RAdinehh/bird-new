import { describe, it, expect, beforeEach } from 'vitest';
import { useTra } from '../mod/tra/store';
import type { PartyPayment, Invoice, Deal, CheckStatus } from '../mod/tra/types';

// ═══════════════════════════════════════════════
// Fixtures
// ═══════════════════════════════════════════════

const makePartyPayment = (overrides: Partial<PartyPayment> = {}): PartyPayment => ({
  id: 'pp-' + Math.random(),
  partyId: 'party-1',
  date: '1405/08/01',
  amount: 1000000,
  method: 'check',
  type: 'regular',
  checkNo: '123456',
  bank: 'ملت',
  dueDate: '1405/09/01',
  notes: '',
  status: 'pending',
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
  ...overrides,
});

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

const makeDeal = (overrides: Partial<Deal> = {}): Deal => ({
  id: 'deal-' + Math.random(),
  type: 'consignment',
  date: '1405/08/01',
  partyId: 'party-1',
  description: 'معامله تست',
  value: 1000000,
  percent: null,
  dueDate: '1405/09/01',
  status: 'open',
  notes: '',
  dealNumber: 'D1405010001',
  goods: [],
  deliveries: [],
  sales: [],
  payments: [],
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
  ...overrides,
});

function resetStore() {
  useTra.setState({
    partyPayments: [],
    invoices: [],
    deals: [],
  });
}

function getPpStatus(ppId: string): CheckStatus | undefined {
  return useTra.getState().partyPayments.find(p => p.id === ppId)?.status;
}

function getInvPaymentStatus(ppId: string): string | undefined {
  const inv = useTra.getState().invoices[0];
  return inv?.payments?.find(p => p.partyPaymentId === ppId)?.status as string | undefined;
}

function getDealPaymentStatus(ppId: string): string | undefined {
  const deal = useTra.getState().deals[0];
  return deal?.payments?.find(p => p.partyPaymentId === ppId)?.status as string | undefined;
}

// ═══════════════════════════════════════════════
// depositPartyPayment
// ═══════════════════════════════════════════════

describe('depositPartyPayment', () => {
  beforeEach(resetStore);

  it('partyPayment → in_transit', () => {
    const pp = makePartyPayment({ status: 'pending' });
    useTra.setState({ partyPayments: [pp] });
    useTra.getState().depositPartyPayment(pp.id);
    expect(getPpStatus(pp.id)).toBe('in_transit');
  });

  it('invoice payment → in_transit (sync)', () => {
    const pp = makePartyPayment();
    const inv = makeInvoice({
      payments: [{ id: 'p1', date: '1405/08/01', amount: 1000000, method: 'check', checkNo: '123456', bank: 'ملت', dueDate: '1405/09/01', notes: '', partyPaymentId: pp.id }],
    });
    useTra.setState({ partyPayments: [pp], invoices: [inv] });
    useTra.getState().depositPartyPayment(pp.id);
    expect(getInvPaymentStatus(pp.id)).toBe('in_transit');
  });

  it('deal payment → in_transit (sync)', () => {
    const pp = makePartyPayment();
    const deal = makeDeal({
      payments: [{ id: 'dp1', date: '1405/08/01', amount: 1000000, direction: 'in', method: 'check', partyPaymentId: pp.id }],
    });
    useTra.setState({ partyPayments: [pp], deals: [deal] });
    useTra.getState().depositPartyPayment(pp.id);
    expect(getDealPaymentStatus(pp.id)).toBe('in_transit');
  });

  it('all 3 in sync at once', () => {
    const pp = makePartyPayment();
    const inv = makeInvoice({ payments: [{ id: 'p1', date: '1405/08/01', amount: 1000000, method: 'check', checkNo: '', bank: '', dueDate: '', notes: '', partyPaymentId: pp.id }] });
    const deal = makeDeal({ payments: [{ id: 'dp1', date: '1405/08/01', amount: 1000000, direction: 'in', method: 'check', partyPaymentId: pp.id }] });
    useTra.setState({ partyPayments: [pp], invoices: [inv], deals: [deal] });
    useTra.getState().depositPartyPayment(pp.id);
    expect(getPpStatus(pp.id)).toBe('in_transit');
    expect(getInvPaymentStatus(pp.id)).toBe('in_transit');
    expect(getDealPaymentStatus(pp.id)).toBe('in_transit');
  });

  it('pp not found → no crash, no change', () => {
    const pp = makePartyPayment();
    useTra.setState({ partyPayments: [pp] });
    expect(() => useTra.getState().depositPartyPayment('nonexistent')).not.toThrow();
    expect(getPpStatus(pp.id)).toBe('pending');
  });

  it('other payments not touched', () => {
    const pp1 = makePartyPayment({ id: 'pp1' });
    const pp2 = makePartyPayment({ id: 'pp2' });
    useTra.setState({ partyPayments: [pp1, pp2] });
    useTra.getState().depositPartyPayment('pp1');
    expect(getPpStatus('pp1')).toBe('in_transit');
    expect(getPpStatus('pp2')).toBe('pending');
  });
});

// ═══════════════════════════════════════════════
// clearPartyPayment
// ═══════════════════════════════════════════════

describe('clearPartyPayment', () => {
  beforeEach(resetStore);

  it('partyPayment → cleared + clearedDate', () => {
    const pp = makePartyPayment({ status: 'in_transit' });
    useTra.setState({ partyPayments: [pp] });
    useTra.getState().clearPartyPayment(pp.id);
    const updated = useTra.getState().partyPayments.find(p => p.id === pp.id);
    expect(updated?.status).toBe('cleared');
    expect(updated?.clearedDate).toBeTruthy();
    expect(updated?.bouncedDate).toBe('');
  });

  it('invoice sync → cleared', () => {
    const pp = makePartyPayment();
    const inv = makeInvoice({ payments: [{ id: 'p1', date: '1405/08/01', amount: 1000000, method: 'check', checkNo: '', bank: '', dueDate: '', notes: '', partyPaymentId: pp.id }] });
    useTra.setState({ partyPayments: [pp], invoices: [inv] });
    useTra.getState().clearPartyPayment(pp.id);
    expect(getInvPaymentStatus(pp.id)).toBe('cleared');
  });

  it('deal sync → cleared', () => {
    const pp = makePartyPayment();
    const deal = makeDeal({ payments: [{ id: 'dp1', date: '1405/08/01', amount: 1000000, direction: 'in', method: 'check', partyPaymentId: pp.id }] });
    useTra.setState({ partyPayments: [pp], deals: [deal] });
    useTra.getState().clearPartyPayment(pp.id);
    expect(getDealPaymentStatus(pp.id)).toBe('cleared');
  });

  it('pp not found → no crash', () => {
    expect(() => useTra.getState().clearPartyPayment('nonexistent')).not.toThrow();
  });
});

// ═══════════════════════════════════════════════
// bouncePartyPayment
// ═══════════════════════════════════════════════

describe('bouncePartyPayment', () => {
  beforeEach(resetStore);

  it('partyPayment → bounced + bouncedDate', () => {
    const pp = makePartyPayment({ status: 'in_transit' });
    useTra.setState({ partyPayments: [pp] });
    useTra.getState().bouncePartyPayment(pp.id);
    const updated = useTra.getState().partyPayments.find(p => p.id === pp.id);
    expect(updated?.status).toBe('bounced');
    expect(updated?.bouncedDate).toBeTruthy();
    expect(updated?.clearedDate).toBe('');
  });

  it('invoice sync → bounced', () => {
    const pp = makePartyPayment();
    const inv = makeInvoice({ payments: [{ id: 'p1', date: '1405/08/01', amount: 1000000, method: 'check', checkNo: '', bank: '', dueDate: '', notes: '', partyPaymentId: pp.id }] });
    useTra.setState({ partyPayments: [pp], invoices: [inv] });
    useTra.getState().bouncePartyPayment(pp.id);
    expect(getInvPaymentStatus(pp.id)).toBe('bounced');
  });

  it('deal sync → bounced', () => {
    const pp = makePartyPayment();
    const deal = makeDeal({ payments: [{ id: 'dp1', date: '1405/08/01', amount: 1000000, direction: 'in', method: 'check', partyPaymentId: pp.id }] });
    useTra.setState({ partyPayments: [pp], deals: [deal] });
    useTra.getState().bouncePartyPayment(pp.id);
    expect(getDealPaymentStatus(pp.id)).toBe('bounced');
  });

  it('multiple invoices — only target payment touched', () => {
    const pp = makePartyPayment();
    const inv1 = makeInvoice({ id: 'inv1', payments: [{ id: 'p1', date: '1405/08/01', amount: 1000000, method: 'check', checkNo: '', bank: '', dueDate: '', notes: '', partyPaymentId: pp.id }] });
    const inv2 = makeInvoice({ id: 'inv2', payments: [{ id: 'p2', date: '1405/08/01', amount: 500000, method: 'check', checkNo: '', bank: '', dueDate: '', notes: '', partyPaymentId: 'other-pp' }] });
    useTra.setState({ partyPayments: [pp], invoices: [inv1, inv2] });
    useTra.getState().bouncePartyPayment(pp.id);
    const inv2Payments = useTra.getState().invoices.find(i => i.id === 'inv2')?.payments;
    expect(inv2Payments?.[0]?.status).toBeUndefined();
  });
});
