/**
 * tra-cascade-property.test.ts — property-based testing برای cascade
 * ۱۰۰۰+ سناریوی تصادفی → invariant sum = current
 */
import { describe, it, expect, beforeEach } from 'vitest';
import fc from 'fast-check';
import { useFlk } from '../mod/flk/store';
import { useBrd } from '../mod/brd/store';
import { applyInvoiceFlocks } from '../mod/tra/invoiceHelpers';

const makeInvoice = (o: any = {}): any => ({
  id: 'inv-' + Math.random().toString(36).slice(2, 9),
  type: 'purchase', number: 'P' + Date.now(),
  date: '1405/08/02', partyId: 'p1', category: 'chick',
  items: [], total: 0, payments: [], dueDate: '',
  relatedFlockId: '', relatedEntryId: '',
  notes: '', createdAt: '2026-01-01', updatedAt: '2026-01-01',
  ...o,
});

const makeItem = (o: any = {}): any => ({
  id: 'i-' + Math.random().toString(36).slice(2, 9),
  description: 'جوجه', category: 'chick',
  birdId: 'b1', breedId: 'br1', unit: 'pcs',
  quantity: 0, unitPrice: 10000, total: 0,
  ...o,
});

const makeFlock = (o: any = {}): any => ({
  id: 'f-' + Math.random().toString(36).slice(2, 9),
  name: 'گله', type: 'layer', status: 'active',
  birdId: 'b1', breedId: 'br1', hallId: '', zoneId: '',
  initialCount: 0, currentCount: 0,
  maleCount: 0, femaleCount: 0, unknownCount: 0,
  layingStartDay: 0, endOfCycleDay: null,
  vaccineScheduleId: '', hatchDate: '', purchaseDate: '', startDate: '',
  source: '', purchasePrice: 0, deliveryCost: 0, otherCosts: 0,
  notes: '', events: [], genderSplitAt: null,
  createdAt: '2026-01-01', updatedAt: '2026-01-01',
  ...o,
});

beforeEach(() => {
  useFlk.setState({ flocks: [], groups: [], groupMembers: [] } as any);
  useBrd.setState({ birds: [], breeds: [] } as any);
});

const S = (g: any) => (g.maleCount ?? 0) + (g.femaleCount ?? 0) + (g.unknownCount ?? 0);

describe('PROPERTY: applyInvoiceFlocks — sum = current', () => {
  it('purchase unsplit → new flock', () => {
    fc.assert(
      fc.property(fc.integer({ min: 1, max: 1000 }), (qty) => {
        useFlk.setState({ flocks: [], groups: [], groupMembers: [] } as any);
        applyInvoiceFlocks(makeInvoice({
          items: [makeItem({ quantity: qty, total: qty * 10000 })],
          total: qty * 10000,
        }));
        const flocks = useFlk.getState().flocks;
        expect(flocks.length).toBe(1);
        const g = flocks[0];
        expect(g.currentCount).toBe(qty);
        expect(S(g)).toBe(qty);
        expect(g.genderSplitAt).toBeFalsy();
      }),
      { numRuns: 200 }
    );
  });

  it('purchase with split → genderSplitAt set', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 2, max: 1000 }),
        fc.integer({ min: 1, max: 500 }),
        fc.integer({ min: 0, max: 500 }),
        (total, male, female) => {
          if (male + female > total) return;
          if (male + female === 0) return;
          const unknown = total - male - female;
          useFlk.setState({ flocks: [], groups: [], groupMembers: [] } as any);
          applyInvoiceFlocks(makeInvoice({
            items: [makeItem({
              quantity: total, total: total * 10000,
              maleCount: male, femaleCount: female, unknownCount: unknown,
            })],
            total: total * 10000,
          }));
          const g = useFlk.getState().flocks[0];
          expect(g.currentCount).toBe(total);
          expect(g.genderSplitAt).toBeTruthy();
          expect(S(g)).toBe(total);
        }
      ),
      { numRuns: 200 }
    );
  });

  it('sale from unsplit flock → sync', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 2, max: 1000 }),
        fc.integer({ min: 1, max: 999 }),
        (total, saleQty) => {
          if (saleQty >= total) return;
          useFlk.setState({
            flocks: [makeFlock({
              id: 'f1', initialCount: total, currentCount: total,
              maleCount: 0, femaleCount: 0, unknownCount: total,
              genderSplitAt: null,
            })],
            groups: [], groupMembers: [],
          } as any);
          applyInvoiceFlocks(makeInvoice({
            type: 'sale',
            items: [makeItem({ quantity: saleQty, total: saleQty * 10000, flockId: 'f1' })],
            total: saleQty * 10000,
          }));
          const g = useFlk.getState().flocks.find((f: any) => f.id === 'f1');
          expect(g).toBeDefined();
          expect(g!.currentCount).toBe(total - saleQty);
          expect(S(g)).toBe(g!.currentCount);
        }
      ),
      { numRuns: 200 }
    );
  });

  it('sale with sex from split flock → invariant', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 10, max: 1000 }),
        fc.integer({ min: 1, max: 3 }),
        (total, saleMale) => {
          const male = Math.max(5, Math.floor(total / 2));
          const female = total - male;
          if (saleMale > male) return;
          useFlk.setState({
            flocks: [makeFlock({
              id: 'f1', initialCount: total, currentCount: total,
              maleCount: male, femaleCount: female, unknownCount: 0,
              genderSplitAt: '1405/08/02',
            })],
            groups: [], groupMembers: [],
          } as any);
          applyInvoiceFlocks(makeInvoice({
            type: 'sale',
            items: [makeItem({
              quantity: saleMale, total: saleMale * 10000,
              flockId: 'f1',
              maleCount: saleMale, femaleCount: 0, unknownCount: 0,
            })],
            total: saleMale * 10000,
          }));
          const g = useFlk.getState().flocks.find((f: any) => f.id === 'f1');
          expect(g).toBeDefined();
          expect(S(g)).toBe(g!.currentCount);
        }
      ),
      { numRuns: 200 }
    );
  });

  it('idempotent: apply(inv, inv) → no change', () => {
    fc.assert(
      fc.property(fc.integer({ min: 1, max: 500 }), (qty) => {
        useFlk.setState({ flocks: [], groups: [], groupMembers: [] } as any);
        const inv = makeInvoice({
          items: [makeItem({ quantity: qty, total: qty * 10000 })],
          total: qty * 10000,
        });
        applyInvoiceFlocks(inv);
        const before = useFlk.getState().flocks.map((f: any) => ({
          id: f.id, current: f.currentCount, unknown: f.unknownCount,
        }));
        applyInvoiceFlocks(inv, inv);
        const after = useFlk.getState().flocks.map((f: any) => ({
          id: f.id, current: f.currentCount, unknown: f.unknownCount,
        }));
        expect(JSON.stringify(before)).toBe(JSON.stringify(after));
      }),
      { numRuns: 100 }
    );
  });
});
