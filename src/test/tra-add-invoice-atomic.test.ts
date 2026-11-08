/**
 * D.6-F — negative test برای addInvoice atomic
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

const makeInput = (): any => ({
  partyId: 'p1',
  type: 'purchase',
  category: 'feed',
  items: [],
  date: '1405/11/08',
  payments: [],
  allocations: [],
});

describe('D.6-F — atomic addInvoice', () => {
  beforeEach(() => {
    mockSetPartyCredit.mockReset();
    useTra.setState({ invoices: [], settlements: [], deals: [], allocations: [] } as any);
    useFlk.setState({ flocks: [], groups: [], groupMembers: [], consumptionEvents: [] } as any);
    useWhs.setState({ items: [], movements: [] } as any);
    useEgg.setState({ productions: [], sales: [], discards: [] } as any);
  });

  it('happy: addInvoice برمی‌گرداند id، بدون throw', () => {
    mockSetPartyCredit.mockImplementation(() => {});
    const id = useTra.getState().addInvoice(makeInput());
    expect(typeof id).toBe('string');
    expect(id.length).toBeGreaterThan(0);
    expect(useTra.getState().invoices).toHaveLength(1);
    expect(useTra.getState().invoices[0].id).toBe(id);
    expect(mockSetPartyCredit).toHaveBeenCalled();
  });

  it('failure: setPartyCredit throws → rollback (فاکتور اضافه نمی‌شود)', () => {
    mockSetPartyCredit.mockImplementation(() => { throw new Error('simulated ctc failure'); });
    expect(() => useTra.getState().addInvoice(makeInput())).toThrow();
    expect(mockSetPartyCredit).toHaveBeenCalled();
    // ← rollback: هیچ فاکتوری نباید اضافه شده باشد
    expect(useTra.getState().invoices).toHaveLength(0);
  });

  it('structural: atomic wrapper + throw count', async () => {
    const fs = await import('node:fs');
    const content = fs.readFileSync('src/mod/tra/store.ts', 'utf-8');
    expect(content).toContain('const __snaps = ALL_STORES.map');
    expect(content).toContain('store.restore(snap)');
    expect(content).toContain('خطا در ثبت فاکتور');
    const throwCount = (content.match(/throw e;/g) || []).length;
    expect(throwCount).toBeGreaterThanOrEqual(28);
  });
});
