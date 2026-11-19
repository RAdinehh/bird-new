import { describe, it, expect } from 'vitest';
import { splitFlocksForArchive } from '../mod/flk/archivePolicy';
import type { Flock } from '../mod/flk/store';

function makeFlock(overrides: Partial<Flock>): Flock {
  return {
    id: overrides.id ?? 'flk-1',
    name: overrides.name ?? 'گله آزمایشی',
    type: 'broiler',
    birdId: 'bird-1',
    breedId: 'breed-1',
    hallId: 'hall-1',
    zoneId: 'zone-1',
    initialCount: 100,
    currentCount: 100,
    maleCount: 50,
    femaleCount: 50,
    unknownCount: 0,
    layingStartDay: 150,
    endOfCycleDay: 42,
    vaccineScheduleId: '',
    hatchDate: '1404/01/01',
    purchaseDate: '1404/01/01',
    startDate: '1404/01/01',
    source: 'purchase',
    purchasePrice: 1000,
    deliveryCost: 0,
    otherCosts: 0,
    status: 'active',
    notes: '',
    createdAt: '2025-01-01T00:00:00.000Z',
    updatedAt: '2025-01-01T00:00:00.000Z',
    ...overrides,
  };
}

describe('flk archivePolicy & balance invariants', () => {
  it('locks active and merged flocks while allowing archived/sold flocks to archive', () => {
    const flocks: Flock[] = [
      makeFlock({ id: 'f-active', status: 'active', currentCount: 200 }),
      makeFlock({ id: 'f-merged', status: 'merged', mergedInto: 'f-active', currentCount: 0 }),
      makeFlock({ id: 'f-merged-ref', status: 'archived', mergedInto: 'f-active', currentCount: 10 }),
      makeFlock({ id: 'f-archived', status: 'archived', currentCount: 80 }),
      makeFlock({ id: 'f-sold', status: 'sold', currentCount: 50 }),
    ];

    const split = splitFlocksForArchive(flocks);
    expect(split.toArchive.map(f => f.id)).toEqual(['f-archived', 'f-sold']);
    expect(split.keep.map(f => f.id)).toEqual(['f-active', 'f-merged', 'f-merged-ref']);

    const totalBefore = flocks.reduce((acc, f) => acc + (f.currentCount ?? 0), 0);
    const totalAfterSplit = [...split.toArchive, ...split.keep].reduce(
      (acc, f) => acc + (f.currentCount ?? 0),
      0
    );
    expect(totalAfterSplit).toBe(totalBefore);
  });
});
