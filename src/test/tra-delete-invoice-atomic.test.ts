/**
 * D.4-B — negative test (vi.hoisted fix)
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';

const { mockSetPartyCredit } = vi.hoisted(() => ({
  mockSetPartyCredit: vi.fn(),
}));

vi.mock('../mod/ctc/store', async () => {
  const actual = await vi.importActual<any>('../mod/ctc/store');
  return {
    ...actual,
    setPartyCredit: mockSetPartyCredit,
  };
});

import { useTra } from '../mod/tra/store';
import { useFlk } from '../mod/flk/store';
import { useWhs } from '../mod/whs/store';
import { useEgg } from '../mod/egg/store';

const makeInvoice = (id: string): any => ({
  id,
  partyId: 'p1',
  type: 'purchase',
  category: 'chick',
  items: [],
  number: id,
  date: '1405/11/08',
  payments: [],
  paidAt: null,
  allocations: [],
  status: 'active',
});

describe('D.4-B — atomic deleteInvoice', () => {
  beforeEach(() => {
    mockSetPartyCredit.mockReset();
    useTra.setState({
      invoices: [],
      settlements: [],
      deals: [],
      allocations: [],
    } as any);
    useFlk.setState({
      flocks: [],
      groups: [],
      groupMembers: [],
      consumptionEvents: [],
    } as any);
    useWhs.setState({ items: [], movements: [] } as any);
    useEgg.setState({ productions: [], sales: [], discards: [] } as any);
  });

  it('happy path: deleteInvoice کامل می‌شود', () => {
    mockSetPartyCredit.mockImplementation(() => {});
    useTra.setState({ invoices: [makeInvoice('inv1')] } as any);
    expect(() => useTra.getState().deleteInvoice('inv1')).not.toThrow();
    expect(useTra.getState().invoices).toHaveLength(0);
    expect(mockSetPartyCredit).toHaveBeenCalled();
  });

  it('failure: setPartyCredit throws → rollback فاکتور', () => {
    mockSetPartyCredit.mockImplementation(() => {
      throw new Error('simulated ctc failure');
    });
    useTra.setState({ invoices: [makeInvoice('inv2')] } as any);

    expect(() => useTra.getState().deleteInvoice('inv2')).toThrow();

    // ← این خط مهم‌ترین است: mock واقعاً صدا زده شد؟
    expect(mockSetPartyCredit).toHaveBeenCalled();

    // ← rollback: فاکتور برگشته؟
    expect(useTra.getState().invoices).toHaveLength(1);
    expect(useTra.getState().invoices[0].id).toBe('inv2');
  });

  it('non-existent: no-op', () => {
    mockSetPartyCredit.mockImplementation(() => {});
    expect(() => useTra.getState().deleteInvoice('nonexistent')).not.toThrow();
    expect(useTra.getState().invoices).toHaveLength(0);
  });

  it('structural: کد atomic wrapper + 16 throw دارد', async () => {
    const fs = await import('node:fs');
    const content = fs.readFileSync('src/mod/tra/store.ts', 'utf-8');
    expect(content).toContain('const __snaps = ALL_STORES.map');
    expect(content).toContain('store.restore(snap)');
    expect(content).toContain('throw __err');
    const throwCount = (content.match(/throw e; }/g) || []).length;
    expect(throwCount).toBeGreaterThanOrEqual(15);
  });
});
