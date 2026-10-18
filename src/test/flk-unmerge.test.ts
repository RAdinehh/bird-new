import { describe, it, expect, beforeEach } from 'vitest';
import { useFlk } from '../mod/flk/store';

const makeFlock = (o: any = {}) => ({
  id: 'f-' + Math.random().toString(36).slice(2, 9),
  name: 'گله', type: 'layer', status: 'active',
  birdId: 'b1', breedId: 'br1', hallId: '', zoneId: '',
  initialCount: 100, currentCount: 100,
  maleCount: null, femaleCount: null,
  layingStartDay: 140, vaccineScheduleId: '',
  hatchDate: '', purchaseDate: '', startDate: '1405/01/01', endDate: '',
  source: '', purchasePrice: 0, deliveryCost: 0, otherCosts: 0,
  notes: '', events: [],
  createdAt: '2026-01-01', updatedAt: '2026-01-01',
  ...o,
});

beforeEach(() => {
  useFlk.setState({ flocks: [], groups: [], groupMembers: [] } as any);
});

describe('unmergeFlocks — لغو ادغام', () => {
  it('لغو ادغام → source برمی‌گرده و target کم می‌شه', () => {
    const target = makeFlock({ name: 'T', initialCount: 100, currentCount: 100 });
    const source = makeFlock({ name: 'S', initialCount: 50, currentCount: 50 });
    useFlk.setState({ flocks: [target, source] } as any);

    useFlk.getState().mergeFlocks(target.id, source.id, {
      targetAgeDays: 100, sourceAgeDays: 80,
    } as any);

    let flocks = useFlk.getState().flocks;
    expect(flocks.find(f => f.id === target.id)?.currentCount).toBe(150);
    expect(flocks.find(f => f.id === source.id)?.status).toBe('merged');
    expect(flocks.find(f => f.id === source.id)?.currentCount).toBe(0);

    useFlk.getState().unmergeFlocks(target.id);

    flocks = useFlk.getState().flocks;
    expect(flocks.find(f => f.id === target.id)?.currentCount).toBe(100);
    expect(flocks.find(f => f.id === source.id)?.status).toBe('active');
    expect(flocks.find(f => f.id === source.id)?.currentCount).toBe(50);
    expect(flocks.find(f => f.id === source.id)?.mergedInto).toBeUndefined();
  });

  it('لغو ادغام روی گله بدون mergedInfo → no-op', () => {
    const f = makeFlock();
    useFlk.setState({ flocks: [f] } as any);
    useFlk.getState().unmergeFlocks(f.id);
    expect(useFlk.getState().flocks[0].status).toBe('active');
  });

  it('لغو ادغام روی گله ناموجود → no-op (بدون throw)', () => {
    expect(() => useFlk.getState().unmergeFlocks('non-existent')).not.toThrow();
  });

  it('چند merge پشت‌سرهم → فقط آخرین لغو می‌شه', () => {
    const t = makeFlock({ name: 'T', initialCount: 100, currentCount: 100 });
    const s1 = makeFlock({ name: 'S1', initialCount: 50, currentCount: 50 });
    const s2 = makeFlock({ name: 'S2', initialCount: 30, currentCount: 30 });
    useFlk.setState({ flocks: [t, s1, s2] } as any);

    useFlk.getState().mergeFlocks(t.id, s1.id, { targetAgeDays: 100, sourceAgeDays: 80 } as any);
    useFlk.getState().mergeFlocks(t.id, s2.id, { targetAgeDays: 100, sourceAgeDays: 90 } as any);

    let flocks = useFlk.getState().flocks;
    expect(flocks.find(f => f.id === t.id)?.currentCount).toBe(180);

    useFlk.getState().unmergeFlocks(t.id);

    flocks = useFlk.getState().flocks;
    expect(flocks.find(f => f.id === t.id)?.currentCount).toBe(150);
    expect(flocks.find(f => f.id === s2.id)?.status).toBe('active');
    expect(flocks.find(f => f.id === s1.id)?.status).toBe('merged');
  });
});
