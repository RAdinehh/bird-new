/**
 * phase7-reopen.test.ts — تست integration برای reopen فاکتور + guard
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { useTra } from '../mod/tra/store';

function resetStore() {
  useTra.setState({ invoices: [], partyPayments: [], deals: [] } as any);
}

function addBasicInvoice(): string {
  return useTra.getState().addInvoice({
    type: 'purchase',
    date: '1404/07/29',
    partyId: '',
    category: 'feed',
    items: [],
    total: 0,
    payments: [],
    dueDate: '',
    relatedFlockId: '',
    relatedEntryId: '',
    notes: 'initial',
  } as any);
}

function setPaid(id: string) {
  useTra.setState({
    invoices: useTra.getState().invoices.map(i =>
      i.id === id ? { ...i, paidAt: '2024-10-20', workflowStatus: 'paid' as any } : i
    ),
  } as any);
}

describe('Phase 7 — Invoice Reopen + Lock', () => {
  beforeEach(resetStore);

  it('reopenInvoice on non-paid → no-op', () => {
    const id = addBasicInvoice();
    const before = useTra.getState().invoices.find(i => i.id === id)!;
    expect(before.paidAt).toBeFalsy();
    useTra.getState().reopenInvoice(id);
    const after = useTra.getState().invoices.find(i => i.id === id)!;
    expect(after.paidAt).toBeFalsy();
  });

  it('reopenInvoice on paid → clears paidAt + workflowStatus confirmed', () => {
    const id = addBasicInvoice();
    setPaid(id);
    expect(useTra.getState().invoices.find(i => i.id === id)!.paidAt).toBe('2024-10-20');
    useTra.getState().reopenInvoice(id);
    const after = useTra.getState().invoices.find(i => i.id === id)!;
    expect(after.paidAt).toBe('');
    expect(after.workflowStatus).toBe('confirmed');
  });

  it('updateInvoice on paid → blocked (guard)', () => {
    const id = addBasicInvoice();
    setPaid(id);
    useTra.getState().updateInvoice(id, { notes: 'should not change' } as any);
    const after = useTra.getState().invoices.find(i => i.id === id)!;
    expect(after.notes).toBe('initial');
  });

  it('updateInvoice after reopen → allowed', () => {
    const id = addBasicInvoice();
    setPaid(id);
    useTra.getState().reopenInvoice(id);
    useTra.getState().updateInvoice(id, { notes: 'edited' } as any);
    const after = useTra.getState().invoices.find(i => i.id === id)!;
    expect(after.notes).toBe('edited');
  });
});
