import { describe, it, expect, beforeEach } from 'vitest';
import { useTra, remaining } from '../mod/tra/store';
import type { Invoice } from '../mod/tra/types';

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

describe('AR: markDispute / resolveDispute', () => {
  beforeEach(() => useTra.setState({ invoices: [], partyPayments: [], allocations: [] }));

  it('markDispute sets status open + reason + note', () => {
    const inv = makeInvoice({ id: 'inv1' });
    useTra.setState({ invoices: [inv] });
    useTra.getState().markDispute('inv1', 'price', 'مشتری می‌گه ۵ میلیون کمتره');
    const updated = useTra.getState().invoices[0];
    expect(updated.disputeStatus).toBe('open');
    expect(updated.disputeReason).toBe('price');
    expect(updated.disputeNote).toBe('مشتری می‌گه ۵ میلیون کمتره');
    expect(updated.disputeOpenedAt).toBeTruthy();
  });

  it('resolveDispute sets status resolved + resolvedAt', () => {
    const inv = makeInvoice({ id: 'inv1', disputeStatus: 'open', disputeReason: 'quantity' });
    useTra.setState({ invoices: [inv] });
    useTra.getState().resolveDispute('inv1');
    const updated = useTra.getState().invoices[0];
    expect(updated.disputeStatus).toBe('resolved');
    expect(updated.disputeResolvedAt).toBeTruthy();
  });

  it('resolveDispute appends note', () => {
    const inv = makeInvoice({ id: 'inv1', disputeStatus: 'open', disputeNote: 'قبلی' });
    useTra.setState({ invoices: [inv] });
    useTra.getState().resolveDispute('inv1', 'توافق شد');
    expect(useTra.getState().invoices[0].disputeNote).toBe('قبلی | توافق شد');
  });

  it('markDispute on non-existent invoice → no crash', () => {
    expect(() => useTra.getState().markDispute('nonexistent', 'price', '')).not.toThrow();
  });
});

describe('AR: writeOffInvoice', () => {
  beforeEach(() => useTra.setState({ invoices: [], partyPayments: [], allocations: [] }));

  it('writeOffInvoice sets writtenOff + amount + reason + at', () => {
    const inv = makeInvoice({ id: 'inv1', total: 1000000 });
    useTra.setState({ invoices: [inv] });
    useTra.getState().writeOffInvoice('inv1', 1000000, 'وصول نشد');
    const updated = useTra.getState().invoices[0];
    expect(updated.writtenOff).toBe(true);
    expect(updated.writtenOffAmount).toBe(1000000);
    expect(updated.writtenOffReason).toBe('وصول نشد');
    expect(updated.writtenOffAt).toBeTruthy();
  });

  it('remaining after writeOff → 0', () => {
    const inv = makeInvoice({ id: 'inv1', total: 1000000 });
    useTra.setState({ invoices: [inv] });
    useTra.getState().writeOffInvoice('inv1', 1000000, 'test');
    const updated = useTra.getState().invoices[0];
    expect(remaining(updated, [])).toBe(0);
  });

  it('remaining after partial writeOff', () => {
    const inv = makeInvoice({ id: 'inv1', total: 1000000 });
    useTra.setState({ invoices: [inv] });
    useTra.getState().writeOffInvoice('inv1', 300000, 'test');
    const updated = useTra.getState().invoices[0];
    expect(remaining(updated, [])).toBe(700000);
  });

  it('writeOff + paid → remaining 0', () => {
    const inv = makeInvoice({
      id: 'inv1', total: 1000000,
      payments: [{ id: 'p1', date: '1405/08/01', amount: 500000, method: 'cash', checkNo: '', bank: '', dueDate: '', notes: '', type: 'regular' }],
    });
    useTra.setState({ invoices: [inv] });
    useTra.getState().writeOffInvoice('inv1', 500000, 'test');
    expect(remaining(useTra.getState().invoices[0], [])).toBe(0);
  });
});

describe('AR: addReminder with promisedDate', () => {
  beforeEach(() => useTra.setState({ invoices: [], partyPayments: [], allocations: [] }));

  it('promisedDate → nextReminderAt = promisedDate', () => {
    const inv = makeInvoice({ id: 'inv1' });
    useTra.setState({ invoices: [inv] });
    useTra.getState().addReminder('inv1', {
      method: 'other',
      note: 'قول داد',
      intervalDays: 7,
      promisedDate: '1405/09/15',
    });
    const updated = useTra.getState().invoices[0];
    expect(updated.nextReminderAt).toBe('1405/09/15');
  });

  it('promisedDate saved in reminderLog', () => {
    const inv = makeInvoice({ id: 'inv1' });
    useTra.setState({ invoices: [inv] });
    useTra.getState().addReminder('inv1', {
      method: 'other',
      note: 'قول',
      intervalDays: 7,
      promisedDate: '1405/09/15',
    });
    const log = useTra.getState().invoices[0].reminderLog;
    expect(log?.[0]?.promisedDate).toBe('1405/09/15');
  });

  it('without promisedDate → fallback to intervalDays', () => {
    const inv = makeInvoice({ id: 'inv1' });
    useTra.setState({ invoices: [inv] });
    useTra.getState().addReminder('inv1', {
      method: 'other',
      note: '',
      intervalDays: 7,
    });
    const updated = useTra.getState().invoices[0];
    // nextReminderAt باید ~۷ روز بعد باشه (not promised)
    expect(updated.nextReminderAt).toBeTruthy();
    expect(updated.reminderLog?.[0]?.promisedDate).toBeUndefined();
  });
});
