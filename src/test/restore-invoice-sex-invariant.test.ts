/**
 * restore-invoice-sex-invariant.test.ts — TDD فاز ۴b Commit 5
 *
 * B7: sell events بعد از restore un-revoke نمی‌شوند
 * B1r: restore با shortage جنسیتی → clamp (باید throw کند)
 *
 * نکته: restoreInvoice از removeFromRecycleBin استفاده می‌کند
 *       که از localStorage می‌خواند (نه state).
 *       → تست باید saveToRecycleBin را صدا بزند، نه useTra.setState.
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { useFlk } from '../mod/flk/store';
import { useBrd } from '../mod/brd/store';
import { useTra } from '../mod/tra/store';
import { saveToRecycleBin, clearRecycleBin } from '../shr/utils/recycleBin';

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

const makeInvoice = (o: any = {}): any => ({
  id: 'inv-' + Math.random().toString(36).slice(2, 9),
  type: 'sale', number: 'S1', date: '1405/08/10',
  partyId: 'p1', category: 'adult',
  items: [], total: 0, payments: [], dueDate: '',
  relatedFlockId: '', relatedEntryId: '',
  notes: '', createdAt: '2026-01-01', updatedAt: '2026-01-01',
  ...o,
});

beforeEach(() => {
  useFlk.setState({ flocks: [], groups: [], groupMembers: [] } as any);
  useBrd.setState({ birds: [], breeds: [] } as any);
  useTra.setState({ invoices: [] } as any);
  clearRecycleBin('tra');
});

describe('B7 — sell events باید un-revoke شوند', () => {
  it('event فروش revoked پس از restore → un-revoke', () => {
    const flockId = 'f1';
    const invoiceId = 'inv-1';
    useFlk.setState({
      flocks: [makeFlock({
        id: flockId,
        initialCount: 100, currentCount: 100,
        maleCount: 50, femaleCount: 50, unknownCount: 0,
        genderSplitAt: '1405/08/01',
        events: [{
          id: 'sell-inv-1',
          flockId,
          date: '1405/08/10',
          type: 'sell',
          count: 10,
          sex: 'male',
          direction: -1,
          invoiceId,
          notes: 'فروش اصلی',
          revoked: true,
          createdAt: '2026-01-01',
        } as any],
      })],
      groups: [], groupMembers: [],
    } as any);

    // ← درست: از saveToRecycleBin واقعی استفاده کن
    saveToRecycleBin<any>(
      'tra',
      {
        invoice: makeInvoice({ id: invoiceId }),
        linkedFlocks: [{ id: flockId, sourceCategory: 'adult', birdId: 'b1', breedId: 'br1' }],
      },
      (existing) => existing.invoice.id === invoiceId,
    );

    const ok = useTra.getState().restoreInvoice(invoiceId);
    expect(ok).toBe(true);

    const g = useFlk.getState().flocks.find((f: any) => f.id === flockId)!;
    const sellEv = (g.events || []).find((e: any) => e.id === 'sell-inv-1');
    expect(sellEv).toBeDefined();
    expect(sellEv!.revoked).toBe(false);
  });
});

describe('B1r — restore با shortage جنسیتی → throw', () => {
  it('restore که maleCount را منفی می‌کند → throw', () => {
    const flockId = 'f2';
    const invoiceId = 'inv-2';
    useFlk.setState({
      flocks: [makeFlock({
        id: flockId,
        initialCount: 100, currentCount: 100,
        maleCount: 2, femaleCount: 98, unknownCount: 0,
        genderSplitAt: '1405/08/01',
      })],
      groups: [], groupMembers: [],
    } as any);

    saveToRecycleBin<any>(
      'tra',
      {
        invoice: makeInvoice({
          id: invoiceId,
          items: [{
            id: 'i1', description: 'مرغ', category: 'adult',
            birdId: 'b1', breedId: 'br1', unit: 'pcs',
            quantity: 10, unitPrice: 10000, total: 100000,
            flockId, maleCount: 10,
          }],
          total: 100000,
        }),
        linkedFlocks: [{ id: flockId, sourceCategory: 'adult', birdId: 'b1', breedId: 'br1' }],
      },
      (existing) => existing.invoice.id === invoiceId,
    );

    expect(() => useTra.getState().restoreInvoice(invoiceId)).toThrow();

    // flock دست‌نخورده
    const g = useFlk.getState().flocks.find((f: any) => f.id === flockId)!;
    expect(g.currentCount).toBe(100);
    expect(S(g)).toBe(100);
  });
});

// ═══════════════════════════════════════════════════════════════
// B1r atomic — روی throw هیچ mutation نباید انجام شود
// ═══════════════════════════════════════════════════════════════
describe('B1r atomic — روی throw هیچ mutation نباید انجام شود', () => {
  it('بعد از throw: invoices خالی، recycleBin سالم', async () => {
    const { listRecycleBin } = await import('../shr/utils/recycleBin');
    const flockId = 'f3';
    const invoiceId = 'inv-3';
    useFlk.setState({
      flocks: [makeFlock({
        id: flockId,
        initialCount: 100, currentCount: 100,
        maleCount: 2, femaleCount: 98, unknownCount: 0,
        genderSplitAt: '1405/08/01',
      })],
      groups: [], groupMembers: [],
    } as any);

    saveToRecycleBin<any>(
      'tra',
      {
        invoice: makeInvoice({
          id: invoiceId,
          items: [{
            id: 'i1', description: 'مرغ', category: 'adult',
            birdId: 'b1', breedId: 'br1', unit: 'pcs',
            quantity: 10, unitPrice: 10000, total: 100000,
            flockId, maleCount: 10,
          }],
          total: 100000,
        }),
        linkedFlocks: [{ id: flockId, sourceCategory: 'adult', birdId: 'b1', breedId: 'br1' }],
      },
      (existing) => existing.invoice.id === invoiceId,
    );

    expect(() => useTra.getState().restoreInvoice(invoiceId)).toThrow();

    // Atomic: هیچ mutation نباید انجام شده باشد
    expect(useTra.getState().invoices.find((i: any) => i.id === invoiceId)).toBeUndefined();
    const binEntries = listRecycleBin<any>('tra');
    expect(binEntries.find((e: any) => e.item.invoice.id === invoiceId)).toBeDefined();
  });
});

// ═══════════════════════════════════════════════════════════════
// B1r cumulative — دو item روی یک flock
// ═══════════════════════════════════════════════════════════════
describe('B1r cumulative — دو item روی یک flock', () => {
  it('stacking در simulation: 10 male + 20 male → 70 male', async () => {
    const flockId = 'f4';
    const invoiceId = 'inv-4';
    useFlk.setState({
      flocks: [makeFlock({
        id: flockId,
        initialCount: 100, currentCount: 100,
        maleCount: 100, femaleCount: 0, unknownCount: 0,
        genderSplitAt: '1405/08/01',
      })],
      groups: [], groupMembers: [],
    } as any);

    saveToRecycleBin<any>(
      'tra',
      {
        invoice: makeInvoice({
          id: invoiceId,
          items: [
            {
              id: 'i1', description: 'مرغ', category: 'adult',
              birdId: 'b1', breedId: 'br1', unit: 'pcs',
              quantity: 10, unitPrice: 10000, total: 100000,
              flockId, maleCount: 10,
            },
            {
              id: 'i2', description: 'مرغ', category: 'adult',
              birdId: 'b1', breedId: 'br1', unit: 'pcs',
              quantity: 20, unitPrice: 10000, total: 200000,
              flockId, maleCount: 20,
            },
          ],
          total: 300000,
        }),
        linkedFlocks: [{ id: flockId, sourceCategory: 'adult', birdId: 'b1', breedId: 'br1' }],
      },
      (existing) => existing.invoice.id === invoiceId,
    );

    const ok = useTra.getState().restoreInvoice(invoiceId);
    expect(ok).toBe(true);

    const g = useFlk.getState().flocks.find((f: any) => f.id === flockId)!;
    // stacking: 100 - 10 - 20 = 70 (نه 80 از state اولیه)
    expect(g.currentCount).toBe(70);
    expect(g.maleCount).toBe(70);
    expect(S(g)).toBe(g.currentCount);
  });
});
