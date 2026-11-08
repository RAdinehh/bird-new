/**
 * D.6-E — negative test برای updateInvoice atomic
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';

const { mockSetPartyCredit } = vi.hoisted(() => ({
  mockSetPartyCredit: vi.fn(),
}));

vi.mock('../mod/ctc/store', async () => {
  const actual = await vi.importActual<any>('../mod/ctc/store');
  return { ...actual, setPartyCredit: mockSetPartyCredit };
});

import { useTra } from '../mod/tra/store';
import { useFlk } from '../mod/flk/store';
import { useWhs } from '../mod/whs/store';
import { useEgg } from '../mod/egg/store';

const makeInvoice = (id: string, notes = 'original'): any => ({
  id, partyId: 'p1', type: 'purchase', category: 'feed',
  items: [], number: id, date: '1405/11/08',
  payments: [], paidAt: null, allocations: [], status: 'active', notes,
});

describe('D.6-E — atomic updateInvoice', () => {
  beforeEach(() => {
    mockSetPartyCredit.mockReset();
    useTra.setState({ invoices: [], settlements: [], deals: [], allocations: [] } as any);
    useFlk.setState({ flocks: [], groups: [], groupMembers: [], consumptionEvents: [] } as any);
    useWhs.setState({ items: [], movements: [] } as any);
    useEgg.setState({ productions: [], sales: [], discards: [] } as any);
  });

  it('happy: update notes، بدون throw', () => {
    mockSetPartyCredit.mockImplementation(() => {});
    useTra.setState({ invoices: [makeInvoice('inv1', 'orig')] } as any);
    expect(() => useTra.getState().updateInvoice('inv1', { notes: 'updated' })).not.toThrow();
    expect(useTra.getState().invoices[0].notes).toBe('updated');
    expect(mockSetPartyCredit).toHaveBeenCalled();
  });

  it('failure: setPartyCredit throws → rollback notes', () => {
    mockSetPartyCredit.mockImplementation(() => { throw new Error('simulated ctc failure'); });
    useTra.setState({ invoices: [makeInvoice('inv2', 'orig')] } as any);
    expect(() => useTra.getState().updateInvoice('inv2', { notes: 'updated' })).toThrow();
    expect(mockSetPartyCredit).toHaveBeenCalled();
    expect(useTra.getState().invoices[0].notes).toBe('orig');
  });

  it('non-existent: no-op', () => {
    mockSetPartyCredit.mockImplementation(() => {});
    expect(() => useTra.getState().updateInvoice('nonexistent', { notes: 'x' })).not.toThrow();
    expect(useTra.getState().invoices).toHaveLength(0);
  });

  it('structural: atomic wrapper + throw count', async () => {
    const fs = await import('node:fs');
    const content = fs.readFileSync('src/mod/tra/store.ts', 'utf-8');
    expect(content).toContain('const __snaps = ALL_STORES.map');
    expect(content).toContain('store.restore(snap)');
    expect(content).toContain('خطا در ویرایش');
    const throwCount = (content.match(/throw e;/g) || []).length;
    expect(throwCount).toBeGreaterThanOrEqual(24);
  });
});
