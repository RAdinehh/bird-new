import { describe, it, expect, beforeEach } from 'vitest';
import { useFlk } from '../mod/flk/store';

const makeFlock = () => ({
  name: 'گله ۱',
  type: 'layer' as const,
  birdId: 'bird-1',
  breedId: 'breed-1',
  hallId: 'hall-1',
  zoneId: '',
  initialCount: 100,
  currentCount: 100,
  maleCount: null,
  femaleCount: null,
  layingStartDay: 140,
  vaccineScheduleId: '',
  hatchDate: '',
  purchaseDate: '',
  startDate: '1405/01/01',
  endDate: '',
  source: '',
  purchasePrice: 50000,
  deliveryCost: 0,
  otherCosts: 0,
  status: 'active' as const,
  notes: '',
});

beforeEach(() => {
  useFlk.setState({ flocks: [] });
});

describe('useFlk — گله‌ها', () => {
  it('مقدار اولیه خالی', () => {
    expect(useFlk.getState().flocks).toEqual([]);
  });

  it('add → گله جدید با id', () => {
    useFlk.getState().add(makeFlock() as any);
    const f = useFlk.getState().flocks;
    expect(f).toHaveLength(1);
    expect(f[0].id).toBeTruthy();
    expect(f[0].name).toBe('گله ۱');
    expect(f[0].createdAt).toBeTruthy();
  });

  it('update → فقط هدف رو عوض میکنه', () => {
    const s = useFlk.getState();
    s.add({ ...makeFlock(), name: 'A' } as any);
    s.add({ ...makeFlock(), name: 'B' } as any);
    const idA = useFlk.getState().flocks[0].id;
    s.update(idA, { name: 'A-edited', currentCount: 90 });
    const f = useFlk.getState().flocks;
    expect(f[0].name).toBe('A-edited');
    expect(f[0].currentCount).toBe(90);
    expect(f[1].name).toBe('B');
  });

  it('remove → حذف فقط هدف', () => {
    const s = useFlk.getState();
    s.add({ ...makeFlock(), name: 'A' } as any);
    s.add({ ...makeFlock(), name: 'B' } as any);
    const idA = useFlk.getState().flocks[0].id;
    s.remove(idA);
    expect(useFlk.getState().flocks).toHaveLength(1);
    expect(useFlk.getState().flocks[0].name).toBe('B');
  });

  it('archive → status=archived و endDate ست میشه', () => {
    const s = useFlk.getState();
    s.add(makeFlock() as any);
    const id = useFlk.getState().flocks[0].id;
    s.archive(id);
    const f = useFlk.getState().flocks[0];
    expect(f.status).toBe('archived');
    expect(f.endDate).toBeTruthy();
  });

  it('archive → گله‌های دیگه دست‌نخورده میمونن', () => {
    const s = useFlk.getState();
    s.add({ ...makeFlock(), name: 'A' } as any);
    s.add({ ...makeFlock(), name: 'B' } as any);
    const idA = useFlk.getState().flocks[0].id;
    s.archive(idA);
    expect(useFlk.getState().flocks[1].status).toBe('active');
  });

  it('restore → status=active و endDate پاک میشه', () => {
    const s = useFlk.getState();
    s.add(makeFlock() as any);
    const id = useFlk.getState().flocks[0].id;
    s.archive(id);
    s.restore(id);
    const f = useFlk.getState().flocks[0];
    expect(f.status).toBe('active');
    expect(f.endDate).toBe('');
  });

  it('archive/restore روی id نامعتبر → خطا نمیده', () => {
    const s = useFlk.getState();
    s.add(makeFlock() as any);
    s.archive('nonexistent');
    s.restore('nonexistent');
    expect(useFlk.getState().flocks[0].status).toBe('active');
  });
});
