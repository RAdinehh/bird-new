import { describe, it, expect } from 'vitest';
import { findOrphanMatches } from '../mod/flk/helpers-store';

const makeFlock = (o: any = {}) => ({
  id: 'f-' + Math.random().toString(36).slice(2, 9),
  name: 'گله', type: 'layer', status: 'active',
  birdId: 'b1', breedId: 'br1', hallId: '', zoneId: '',
  initialCount: 100, currentCount: 100,
  maleCount: null, femaleCount: null,
  layingStartDay: 140, vaccineScheduleId: '',
  hatchDate: '', purchaseDate: '', startDate: '1405/01/01', endDate: '',
  source: '', purchasePrice: 0, deliveryCost: 0, otherCosts: 0,
  notes: '',
  createdAt: '2026-01-01', updatedAt: '2026-01-01',
  ...o,
});

describe('findOrphanMatches — auto-link detection', () => {
  it('تک match → یک گله برمی‌گردونه', () => {
    const f = makeFlock({ birdId: 'b1', breedId: 'br1' });
    const r = findOrphanMatches({ birdId: 'b1', breedId: 'br1', flocks: [f] });
    expect(r).toHaveLength(1);
    expect(r[0].id).toBe(f.id);
  });

  it('دو match → دو گله برمی‌گردونه', () => {
    const f1 = makeFlock({ birdId: 'b1', breedId: 'br1', name: 'A' });
    const f2 = makeFlock({ birdId: 'b1', breedId: 'br1', name: 'B' });
    const r = findOrphanMatches({ birdId: 'b1', breedId: 'br1', flocks: [f1, f2] });
    expect(r).toHaveLength(2);
  });

  it('گله با sourceInvoiceId → orphan نیست', () => {
    const f = makeFlock({ birdId: 'b1', breedId: 'br1', sourceInvoiceId: 'inv-1' });
    const r = findOrphanMatches({ birdId: 'b1', breedId: 'br1', flocks: [f] });
    expect(r).toHaveLength(0);
  });

  it('گله با hatchId → orphan نیست', () => {
    const f = makeFlock({ birdId: 'b1', breedId: 'br1', hatchId: 'h-1' });
    const r = findOrphanMatches({ birdId: 'b1', breedId: 'br1', flocks: [f] });
    expect(r).toHaveLength(0);
  });

  it('گله archived → orphan نیست', () => {
    const f = makeFlock({ birdId: 'b1', breedId: 'br1', status: 'archived' });
    const r = findOrphanMatches({ birdId: 'b1', breedId: 'br1', flocks: [f] });
    expect(r).toHaveLength(0);
  });

  it('نژاد متفاوت → match نیست', () => {
    const f = makeFlock({ birdId: 'b1', breedId: 'br2' });
    const r = findOrphanMatches({ birdId: 'b1', breedId: 'br1', flocks: [f] });
    expect(r).toHaveLength(0);
  });

  it('بدون birdId → خالی برمی‌گردونه (safety)', () => {
    const f = makeFlock({ birdId: 'b1', breedId: 'br1' });
    const r = findOrphanMatches({ birdId: '', breedId: 'br1', flocks: [f] });
    expect(r).toHaveLength(0);
  });

  it('گله مختلط (breedId="") فقط با breedId="" match می‌شه', () => {
    const f = makeFlock({ birdId: 'b1', breedId: '' });
    const r1 = findOrphanMatches({ birdId: 'b1', breedId: '', flocks: [f] });
    const r2 = findOrphanMatches({ birdId: 'b1', breedId: 'br1', flocks: [f] });
    expect(r1).toHaveLength(1);
    expect(r2).toHaveLength(0);
  });
});
