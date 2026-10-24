/**
 * flk-property.test.ts — Property-Based Testing
 * ۱۰۰۰ سناریوی تصادفی، invariant چک
 */
import { describe, it, expect, beforeEach } from 'vitest';
import fc from 'fast-check';
import { useFlk } from '../mod/flk/store';

const makeFlock = (o: any = {}) => ({
  id: 'f-' + Math.random().toString(36).slice(2, 9),
  name: 'گله',
  type: 'layer' as const,
  status: 'active' as const,
  birdId: 'b1', breedId: 'br1', hallId: '', zoneId: '',
  initialCount: 0, currentCount: 0,
  maleCount: 0, femaleCount: 0, unknownCount: 0,
  layingStartDay: 0, endOfCycleDay: null,
  vaccineScheduleId: '', hatchDate: '', purchaseDate: '', startDate: '',
  source: '', purchasePrice: 0, deliveryCost: 0, otherCosts: 0,
  notes: '', events: [],
  createdAt: '2026-01-01', updatedAt: '2026-01-01',
  genderSplitAt: null,
  ...o,
});

beforeEach(() => {
  useFlk.setState({ flocks: [], groups: [], groupMembers: [] } as any);
});

describe('PROPERTY: sum = current بعد از هر عملیات', () => {
  it('add با هر ترکیب', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 1000 }),
        fc.integer({ min: 0, max: 500 }),
        fc.integer({ min: 0, max: 500 }),
        (total, male, female) => {
          if (male + female > total) return;  // invalid
          const unknown = total - male - female;
          useFlk.setState({ flocks: [], groups: [], groupMembers: [] } as any);
          useFlk.getState().add(makeFlock({
            currentCount: total,
            maleCount: male,
            femaleCount: female,
            unknownCount: unknown,
          }) as any);
          const g = useFlk.getState().flocks[0];
          const sum = (g.maleCount ?? 0) + (g.femaleCount ?? 0) + (g.unknownCount ?? 0);
          expect(sum).toBe(g.currentCount);
        }
      ),
      { numRuns: 500 }
    );
  });

  it('addEvent death → sync', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 1000 }),
        fc.integer({ min: 0, max: 999 }),
        (total, deathCount) => {
          if (deathCount >= total) return;
          useFlk.setState({ flocks: [], groups: [], groupMembers: [] } as any);
          const id = useFlk.getState().add(makeFlock({
            currentCount: total,
            unknownCount: total,
          }) as any);
          
          useFlk.getState().addEvent(id, {
            type: 'death', count: deathCount, date: '1405/08/02', sex: 'mixed', notes: '',
          } as any);
          
          const g = useFlk.getState().flocks[0];
          const sum = (g.maleCount ?? 0) + (g.femaleCount ?? 0) + (g.unknownCount ?? 0);
          expect(sum).toBe(g.currentCount);
          expect(g.unknownCount).toBe(total - deathCount);
        }
      ),
      { numRuns: 300 }
    );
  });

  it('addEvent sale → sync', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 1000 }),
        fc.integer({ min: 0, max: 999 }),
        (total, saleCount) => {
          if (saleCount >= total) return;
          useFlk.setState({ flocks: [], groups: [], groupMembers: [] } as any);
          const id = useFlk.getState().add(makeFlock({
            currentCount: total, unknownCount: total,
          }) as any);
          
          useFlk.getState().addEvent(id, {
            type: 'sell', count: saleCount, date: '1405/08/02', sex: 'mixed', notes: '',
          } as any);
          
          const g = useFlk.getState().flocks[0];
          const sum = (g.maleCount ?? 0) + (g.femaleCount ?? 0) + (g.unknownCount ?? 0);
          expect(sum).toBe(g.currentCount);
        }
      ),
      { numRuns: 300 }
    );
  });

  it('revokeEvent برگشت به حالت اول', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 2, max: 1000 }),
        fc.integer({ min: 1, max: 999 }),
        (total, eventCount) => {
          if (eventCount >= total) return;
          useFlk.setState({ flocks: [], groups: [], groupMembers: [] } as any);
          const id = useFlk.getState().add(makeFlock({
            currentCount: total, unknownCount: total,
          }) as any);
          
          useFlk.getState().addEvent(id, {
            type: 'death', count: eventCount, date: '1405/08/02', sex: 'mixed', notes: '',
          } as any);
          
          const afterAdd = useFlk.getState().flocks[0].currentCount;
          const evId = useFlk.getState().flocks[0].events![0].id;
          
          useFlk.getState().revokeEvent(id, evId);
          
          const g = useFlk.getState().flocks[0];
          expect(g.currentCount).toBe(total);  // ← برگشت
          const sum = (g.maleCount ?? 0) + (g.femaleCount ?? 0) + (g.unknownCount ?? 0);
          expect(sum).toBe(g.currentCount);
        }
      ),
      { numRuns: 200 }
    );
  });

  it('genderSplitAt state consistency', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 1000 }),
        (total) => {
          useFlk.setState({ flocks: [], groups: [], groupMembers: [] } as any);
          
          // Add بدون split
          const id1 = useFlk.getState().add(makeFlock({
            currentCount: total, unknownCount: total,
            maleCount: 0, femaleCount: 0,
          }) as any);
          const g1 = useFlk.getState().flocks.find(f => f.id === id1);
          expect(g1?.genderSplitAt).toBeNull();
          
          // Add با split
          useFlk.setState({ flocks: [], groups: [], groupMembers: [] } as any);
          const id2 = useFlk.getState().add(makeFlock({
            currentCount: total, unknownCount: 0,
            maleCount: Math.floor(total / 2),
            femaleCount: Math.ceil(total / 2),
          }) as any);
          const g2 = useFlk.getState().flocks.find(f => f.id === id2);
          expect(g2?.genderSplitAt).not.toBeNull();
        }
      ),
      { numRuns: 100 }
    );
  });
});
