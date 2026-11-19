import { describe, it, expect } from 'vitest';
import { splitMovementsForArchive, applyMovementCheckpoint } from '../mod/whs/archivePolicy';
import { recalcStock, recalcAvgPrice, type Item, type Movement } from '../mod/whs/store';

function makeItem(overrides: Partial<Item> = {}): Item {
  return {
    id: 'item-1',
    name: 'دان استارتر',
    category: 'feed',
    unit: 'kg',
    minStock: 100,
    currentStock: 500,
    lastPrice: 20000,
    avgPrice: 20000,
    supplierId: '',
    expireDate: '',
    withdrawalDays: null,
    storage: 'room',
    notes: '',
    initialStock: 0,
    initialStockByLocation: { stock: 0 },
    createdAt: '2025-01-01T00:00:00.000Z',
    updatedAt: '2025-01-01T00:00:00.000Z',
    ...overrides,
  };
}

function makeMove(overrides: Partial<Movement>): Movement {
  return {
    id: overrides.id ?? 'mv-1',
    itemId: overrides.itemId ?? 'item-1',
    type: 'in',
    quantity: 100,
    unitPrice: 20000,
    reason: 'purchase',
    date: '1404/01/10',
    partyId: '',
    notes: '',
    createdAt: '2025-01-10T00:00:00.000Z',
    locationId: 'stock',
    ...overrides,
  };
}

describe('whs archivePolicy & balance checkpoint', () => {
  it('archives movements up to cutoffIso and preserves stock & weighted average across archival', () => {
    const cutoffIso = '2025-01-02T23:59:59.000Z';
    const moves: Movement[] = [
      makeMove({ id: 'm1', type: 'in', quantity: 500, unitPrice: 20000, createdAt: '2025-01-01T00:00:00.000Z' }),
      makeMove({ id: 'm2', type: 'out', quantity: 200, unitPrice: 0, reason: 'consumption', createdAt: '2025-01-02T00:00:00.000Z' }),
      makeMove({ id: 'm3', type: 'in', quantity: 100, unitPrice: 24000, createdAt: '2025-01-03T00:00:00.000Z' }),
      makeMove({ id: 'm4', type: 'adjust', quantity: 350, unitPrice: 0, reason: 'adjustment', createdAt: '2025-01-04T00:00:00.000Z' }),
    ];

    const baseItem = makeItem({ currentStock: 350 });
    const stockBefore = recalcStock(baseItem, moves);
    const avgBefore = recalcAvgPrice(baseItem, moves);

    const split = splitMovementsForArchive(moves, [baseItem], { cutoffIso });
    expect(split.toArchive.map(m => m.id)).toEqual(['m1', 'm2']);
    expect(split.keep.map(m => m.id)).toEqual(['m3', 'm4']);

    const checkpointItem = applyMovementCheckpoint(baseItem, split.toArchive);
    const stockAfter = recalcStock(checkpointItem, split.keep);
    const avgAfter = recalcAvgPrice(checkpointItem, split.keep);

    expect(stockAfter.expected).toBe(stockBefore.expected);
    expect(avgAfter.avg).toBe(avgBefore.avg);
  });
});
