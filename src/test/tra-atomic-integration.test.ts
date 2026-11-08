/**
 * D.6-G — integration: توالی add/update/delete + rollback
 *
 * هدف: verify که state بین ۳ عملیات متوالی leak نمی‌کند و
 * rollback در میانه، فاکتور را به حالت درست برمی‌گرداند.
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';

const { mockSetPartyCredit, mockState } = vi.hoisted(() => ({
  mockSetPartyCredit: vi.fn(),
  mockState: { throwOnCall: -1, calls: 0 },
}));

vi.mock('../mod/ctc/store', async () => {
  const actual = await vi.importActual<any>('../mod/ctc/store');
  return {
    ...actual,
    setPartyCredit: (...args: any[]) => {
      mockState.calls++;
      if (mockState.throwOnCall >= 0 && mockState.calls === mockState.throwOnCall) {
        throw new Error('simulated ctc failure at call ' + mockState.calls);
      }
      return mockSetPartyCredit(...args);
    },
  };
});

import { useTra } from '../mod/tra/store';
import { useFlk } from '../mod/flk/store';
import { useWhs } from '../mod/whs/store';
import { useEgg } from '../mod/egg/store';

const makeInput = (notes = 'original'): any => ({
  partyId: 'p1',
  type: 'purchase',
  category: 'feed',
  items: [],
  date: '1405/11/08',
  payments: [],
  allocations: [],
  notes,
});

describe('D.6-G — integration: add/update/delete', () => {
  beforeEach(() => {
    mockSetPartyCredit.mockReset();
    mockSetPartyCredit.mockImplementation(() => {});
    mockState.throwOnCall = -1;
    mockState.calls = 0;
    useTra.setState({ invoices: [], settlements: [], deals: [], allocations: [] } as any);
    useFlk.setState({ flocks: [], groups: [], groupMembers: [], consumptionEvents: [] } as any);
    useWhs.setState({ items: [], movements: [] } as any);
    useEgg.setState({ productions: [], sales: [], discards: [] } as any);
  });

  it('توالی کامل: add → update → delete (همه موفق)', () => {
    const id = useTra.getState().addInvoice(makeInput());
    expect(useTra.getState().invoices).toHaveLength(1);
    expect(useTra.getState().invoices[0].id).toBe(id);
    expect(useTra.getState().invoices[0].notes).toBe('original');

    useTra.getState().updateInvoice(id, { notes: 'v2' });
    expect(useTra.getState().invoices[0].notes).toBe('v2');

    useTra.getState().deleteInvoice(id);
    expect(useTra.getState().invoices).toHaveLength(0);
    expect(useTra.getState().allocations).toHaveLength(0);
  });

  it('Update fail → فاکتور به notes=original برمی‌گردد', () => {
    const id = useTra.getState().addInvoice(makeInput());

    mockState.calls = 0;
    mockState.throwOnCall = 1;

    expect(() => useTra.getState().updateInvoice(id, { notes: 'v2' })).toThrow();
    expect(useTra.getState().invoices).toHaveLength(1);
    expect(useTra.getState().invoices[0].notes).toBe('original');
  });

  it('Delete fail بعد از update → فاکتور با notes=v2 برمی‌گردد', () => {
    const id = useTra.getState().addInvoice(makeInput());
    useTra.getState().updateInvoice(id, { notes: 'v2' });
    expect(useTra.getState().invoices[0].notes).toBe('v2');

    mockState.calls = 0;
    mockState.throwOnCall = 1;

    expect(() => useTra.getState().deleteInvoice(id)).toThrow();
    expect(useTra.getState().invoices).toHaveLength(1);
    expect(useTra.getState().invoices[0].notes).toBe('v2');
  });

  it('Multi-invoice isolation: delete یکی fail، دومی سالم', () => {
    const id1 = useTra.getState().addInvoice(makeInput('inv1'));
    const id2 = useTra.getState().addInvoice(makeInput('inv2'));
    expect(useTra.getState().invoices).toHaveLength(2);

    mockState.calls = 0;
    mockState.throwOnCall = 1;

    expect(() => useTra.getState().deleteInvoice(id1)).toThrow();
    expect(useTra.getState().invoices).toHaveLength(2);
    const notes = useTra.getState().invoices.map((i: any) => i.notes).sort();
    expect(notes).toEqual(['inv1', 'inv2']);
  });
});
