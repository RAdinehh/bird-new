/**
 * flk-sale-sex-invariant.test.ts — TDD فاز ۴b
 *
 * ۶ تست که قبل از fix باید FAIL بدهند:
 *   B1: shortage جنسیتی باید throw کند، نه clamp
 *   B1r: restore invoice هم باید throw کند
 *   B2: sex:'mixed' هاردکد → sex صحیح
 *   B3: sexBalanceEvents برای فروش ثبت نمی‌شود
 *   B7: sell events بعد از restore un-revoke نمی‌شوند
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { useFlk } from '../mod/flk/store';
import { useBrd } from '../mod/brd/store';
import { applyInvoiceFlocks } from '../mod/tra/invoiceHelpers';

const makeInvoice = (o: any = {}): any => ({
  id: 'inv-' + Math.random().toString(36).slice(2, 9),
  type: 'sale', number: 'S' + Date.now(),
  date: '1405/08/10', deliveryDate: '1405/08/10',
  partyId: 'p1', category: 'adult',
  items: [], total: 0, payments: [], dueDate: '',
  relatedFlockId: '', relatedEntryId: '',
  notes: '', createdAt: '2026-01-01', updatedAt: '2026-01-01',
  ...o,
});

const makeItem = (o: any = {}): any => ({
  id: 'i-' + Math.random().toString(36).slice(2, 9),
  description: 'مرغ', category: 'adult',
  birdId: 'b1', breedId: 'br1',
  unit: 'pcs', quantity: 0, unitPrice: 10000, total: 0,
  ...o,
});

const makeFlock = (o: any = {}): any => ({
  id: 'f-' + Math.random().toString(36).slice(2, 9),
  name: 'گله', type: 'layer', status: 'active',
  birdId: 'b1', breedId: 'br1',
  hallId: '', zoneId: '',
  initialCount: 0, currentCount: 0,
  maleCount: 0, femaleCount: 0, unknownCount: 0,
  layingStartDay: 0, endOfCycleDay: null,
  vaccineScheduleId: '', hatchDate: '', purchaseDate: '', startDate: '',
  source: '', purchasePrice: 0, deliveryCost: 0, otherCosts: 0,
  notes: '', events: [], sexingEvents: [], sexBalanceEvents: [],
  genderSplitAt: null,
  createdAt: '2026-01-01', updatedAt: '2026-01-01',
  ...o,
});

const S = (g: any) => (g.maleCount ?? 0) + (g.femaleCount ?? 0) + (g.unknownCount ?? 0);

beforeEach(() => {
  useFlk.setState({ flocks: [], groups: [], groupMembers: [] } as any);
  useBrd.setState({ birds: [], breeds: [] } as any);
});

// ═══════════════════════════════════════════════════════════════
// B1 — shortage باید throw کند (نه clamp)
// ═══════════════════════════════════════════════════════════════
describe('B1 — shortage باید throw کند', () => {
  it('male shortage: sale 30 male از 20 → throw', () => {
    useFlk.setState({
      flocks: [makeFlock({
        id: 'f1', initialCount: 100, currentCount: 100,
        maleCount: 20, femaleCount: 80, unknownCount: 0,
        genderSplitAt: '1405/08/01',
      })],
      groups: [], groupMembers: [],
    } as any);

    expect(() => {
      applyInvoiceFlocks(makeInvoice({
        items: [makeItem({ quantity: 30, maleCount: 30, flockId: 'f1', total: 300000 })],
        total: 300000,
      }));
    }).toThrow();

    // flock دست‌نخورده
    const g = useFlk.getState().flocks[0];
    expect(g.currentCount).toBe(100);
    expect(S(g)).toBe(100);
  });

  it('بدون shortage: sale 10 male از 50 → OK', () => {
    useFlk.setState({
      flocks: [makeFlock({
        id: 'f1', currentCount: 100, initialCount: 100,
        maleCount: 50, femaleCount: 50, unknownCount: 0,
        genderSplitAt: '1405/08/01',
      })],
      groups: [], groupMembers: [],
    } as any);

    applyInvoiceFlocks(makeInvoice({
      items: [makeItem({ quantity: 10, maleCount: 10, flockId: 'f1', total: 100000 })],
      total: 100000,
    }));

    const g = useFlk.getState().flocks[0];
    expect(g.currentCount).toBe(90);
    expect(S(g)).toBe(90);
    expect(g.maleCount).toBe(40);
  });
});

// ═══════════════════════════════════════════════════════════════
// B2 — event.sex صحیح (نه mixed)
// ═══════════════════════════════════════════════════════════════
describe('B2 — event.sex صحیح', () => {
  it('sale 10 male → event.sex=male', () => {
    useFlk.setState({
      flocks: [makeFlock({
        id: 'f1', currentCount: 100, initialCount: 100,
        maleCount: 50, femaleCount: 50, unknownCount: 0,
        genderSplitAt: '1405/08/01',
      })],
      groups: [], groupMembers: [],
    } as any);

    applyInvoiceFlocks(makeInvoice({
      items: [makeItem({ quantity: 10, maleCount: 10, flockId: 'f1', total: 100000 })],
      total: 100000,
    }));

    const g = useFlk.getState().flocks[0];
    const sells = (g.events || []).filter((e: any) => e.type === 'sell' && !e.revoked);
    expect(sells.length).toBeGreaterThan(0);
    for (const ev of sells) expect(ev.sex).toBe('male');
    expect(sells.reduce((s: number, e: any) => s + (e.count || 0), 0)).toBe(10);
  });

  it('sale 10 male + 5 female → event جدا', () => {
    useFlk.setState({
      flocks: [makeFlock({
        id: 'f1', currentCount: 100, initialCount: 100,
        maleCount: 50, femaleCount: 50, unknownCount: 0,
        genderSplitAt: '1405/08/01',
      })],
      groups: [], groupMembers: [],
    } as any);

    applyInvoiceFlocks(makeInvoice({
      items: [makeItem({ quantity: 15, maleCount: 10, femaleCount: 5, flockId: 'f1', total: 150000 })],
      total: 150000,
    }));

    const g = useFlk.getState().flocks[0];
    const sells = (g.events || []).filter((e: any) => e.type === 'sell' && !e.revoked);
    const bySex: Record<string, number> = {};
    for (const ev of sells) bySex[ev.sex] = (bySex[ev.sex] || 0) + (ev.count || 0);
    expect(bySex['male']).toBe(10);
    expect(bySex['female']).toBe(5);
  });
});

// ═══════════════════════════════════════════════════════════════
// B3 — sexBalanceEvents audit
// ═══════════════════════════════════════════════════════════════
describe('B3 — sexBalanceEvents audit', () => {
  it('sale 10 male → audit با type=sale', () => {
    useFlk.setState({
      flocks: [makeFlock({
        id: 'f1', currentCount: 100, initialCount: 100,
        maleCount: 50, femaleCount: 50, unknownCount: 0,
        genderSplitAt: '1405/08/01',
      })],
      groups: [], groupMembers: [],
    } as any);

    applyInvoiceFlocks(makeInvoice({
      items: [makeItem({ quantity: 10, maleCount: 10, flockId: 'f1', total: 100000 })],
      total: 100000,
    }));

    const g = useFlk.getState().flocks[0];
    const audits = (g.sexBalanceEvents || []).filter((ev: any) => ev.type === 'sale');
    expect(audits.length).toBe(1);
    expect(audits[0].before.male).toBe(50);
    expect(audits[0].after.male).toBe(40);
    expect(audits[0].delta.male).toBe(-10);
  });
});

// ═══════════════════════════════════════════════════════════════
// SAFETY — invariant محفوظ
// ═══════════════════════════════════════════════════════════════
describe('SAFETY — invariant', () => {
  it('unsplit item: redistribution محفوظ', () => {
    useFlk.setState({
      flocks: [makeFlock({
        id: 'f1', currentCount: 100, initialCount: 100,
        maleCount: 20, femaleCount: 80, unknownCount: 0,
        genderSplitAt: '1405/08/01',
      })],
      groups: [], groupMembers: [],
    } as any);

    applyInvoiceFlocks(makeInvoice({
      items: [makeItem({ quantity: 30, flockId: 'f1', total: 300000 })],
      total: 300000,
    }));

    const g = useFlk.getState().flocks[0];
    expect(g.currentCount).toBe(70);
    expect(S(g)).toBe(70);
  });
});
