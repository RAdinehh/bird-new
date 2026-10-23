/**
 * cascade-contract.test.ts — قرارداد cascade
 * ═════════════════════════════════════════════════════
 * هر cascade باید idempotent باشه:
 *   add(X) → delete(X) = no-op (بدون orphan)
 * ═════════════════════════════════════════════════════
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { useTra } from '../mod/tra/store';
import { useFlk } from '../mod/flk/store';
import { useEgg } from '../mod/egg/store';
import { useWhs } from '../mod/whs/store';
import { useHal } from '../mod/hal/store';

const now = () => new Date().toISOString();

const makeInv = (o: any = {}): any => ({
  id: 'inv-' + Math.random().toString(36).slice(2, 9),
  number: 'T' + Date.now(),
  date: '1405/07/01',
  dueDate: '1405/07/31',
  partyId: 'p1',
  type: 'purchase',
  category: 'other',
  items: [],
  total: 0,
  payments: [],
  relatedFlockId: '',
  relatedEntryId: '',
  notes: '',
  createdAt: now(),
  updatedAt: now(),
  ...o,
});

beforeEach(() => {
  useTra.setState({ invoices: [], allocations: [], partyPayments: [], deals: [] } as any);
  useFlk.setState({ flocks: [], groups: [], groupMembers: [] } as any);
  useEgg.setState({ productions: [], sales: [] } as any);
  useWhs.setState({ items: [], movements: [] } as any);
  useHal.setState({ equipment: [] } as any);
});

describe('CASCADE: purchase chick → delete = no orphan flock', () => {
  it('گله orphan صفر', () => {
    const inv = makeInv({
      type: 'purchase',
      category: 'chick',
      items: [{
        id: 'i1', description: 'جوجه', category: 'chick',
        birdId: 'b1', breedId: 'br1', unit: 'pcs',
        quantity: 100, healthyCount: 95, unitPrice: 10000, total: 950000,
      }],
      total: 950000,
    });

    const id = useTra.getState().addInvoice(inv);
    const afterAdd = useFlk.getState().flocks.filter((f: any) => f.sourceInvoiceId === id);
    expect(afterAdd.length).toBeGreaterThanOrEqual(1);

    useTra.getState().deleteInvoice(id);
    const orphans = useFlk.getState().flocks.filter((f: any) => f.sourceInvoiceId === id);
    expect(orphans.length).toBe(0);
  });
});

describe('CASCADE: sale egg → delete = no orphan sale', () => {
  it('فروش تخم orphan صفر', () => {
    const inv = makeInv({
      type: 'sale',
      category: 'egg',
      items: [{
        id: 'i1', description: 'تخم', category: 'egg',
        unit: 'pcs', quantity: 100, unitPrice: 500, total: 50000,
      }],
      total: 50000,
    });

    const id = useTra.getState().addInvoice(inv);
    const afterAdd = useEgg.getState().sales.filter((s: any) => s.sourceInvoiceId === id);
    expect(afterAdd.length).toBeGreaterThanOrEqual(1);

    useTra.getState().deleteInvoice(id);
    const orphans = useEgg.getState().sales.filter((s: any) => s.sourceInvoiceId === id);
    expect(orphans.length).toBe(0);
  });
});

describe('CASCADE: purchase feed → delete = whs balanced', () => {
  it('حرکت in + reversal out', () => {
    const inv = makeInv({
      type: 'purchase',
      category: 'feed',
      items: [{
        id: 'i1', description: 'دان', category: 'feed',
        unit: 'kg', quantity: 50, unitPrice: 100, total: 5000,
      }],
      total: 5000,
    });

    const id = useTra.getState().addInvoice(inv);
    const afterAdd = useWhs.getState().movements.filter((m: any) => m.sourceId === id);
    const inCount = afterAdd.filter((m: any) => m.type === 'in').length;
    expect(inCount).toBeGreaterThanOrEqual(1);

    useTra.getState().deleteInvoice(id);
    const afterDelete = useWhs.getState().movements.filter((m: any) => m.sourceId === id);
    const outCount = afterDelete.filter((m: any) => m.type === 'out').length;
    expect(outCount).toBeGreaterThanOrEqual(1);
  });
});

describe('CASCADE: purchase equipment با سالن → delete = no orphan equipment', () => {
  it('تجهیزات orphan صفر', () => {
    const inv = makeInv({
      type: 'purchase',
      category: 'equipment',
      items: [{
        id: 'i1', description: 'بخاری', category: 'equipment',
        equipmentKind: 'asset', hallId: 'hall-1',
        equipmentCategory: 'heater', equipmentType: 'gas',
        unit: 'pcs', quantity: 1, unitPrice: 1000000, total: 1000000,
      }],
      total: 1000000,
    });

    const id = useTra.getState().addInvoice(inv);

    useTra.getState().deleteInvoice(id);
    const orphans = useHal.getState().equipment.filter((e: any) => e.sourceInvoiceId === id);
    expect(orphans.length).toBe(0);
  });
});
