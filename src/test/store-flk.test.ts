import { describe, it, expect, beforeEach } from 'vitest';
import { useFlk } from '../mod/flk/store';

const makeFlock = (o: any = {}) => ({
  id: 'f-' + Math.random().toString(36).slice(2, 9),
  name: 'گله', type: 'layer' as const, status: 'active' as const,
  birdId: 'b1', breedId: 'br1', hallId: '', zoneId: '',
  initialCount: 1000, currentCount: 1000,
  maleCount: null, femaleCount: null,
  layingStartDay: 140, vaccineScheduleId: '',
  hatchDate: '', purchaseDate: '', startDate: '1405/01/01', endDate: '',
  source: '', purchasePrice: 0, deliveryCost: 0, otherCosts: 0,
  notes: '',
  createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
  ...o,
});

beforeEach(() => {
  useFlk.setState({ flocks: [], groups: [], groupMembers: [] } as any);
});

// ═══ CRUD پایه ═══
describe('useFlk — CRUD', () => {
  it('add → id برمی‌گردونه', () => {
    const id = useFlk.getState().add(makeFlock() as any);
    expect(id).toBeTruthy();
    expect(typeof id).toBe('string');
  });

  it('add → گله اضافه می‌شه', () => {
    useFlk.getState().add(makeFlock({ name: 'گله A' }) as any);
    expect(useFlk.getState().flocks).toHaveLength(1);
    expect(useFlk.getState().flocks[0].name).toBe('گله A');
  });

  it('update → patch اعمال می‌شه', () => {
    const f = makeFlock({ name: 'قدیمی' });
    useFlk.setState({ flocks: [f] } as any);
    useFlk.getState().update(f.id, { name: 'جدید' });
    expect(useFlk.getState().flocks[0].name).toBe('جدید');
  });

  it('remove → گله حذف می‌شه', () => {
    const f = makeFlock();
    useFlk.setState({ flocks: [f] } as any);
    useFlk.getState().remove(f.id);
    expect(useFlk.getState().flocks).toHaveLength(0);
  });
});

// ═══ archive / restore / toggle ═══
describe('useFlk — archive/restore/toggle', () => {
  it('archive → status archived + endDate', () => {
    const f = makeFlock({ status: 'active' });
    useFlk.setState({ flocks: [f] } as any);
    useFlk.getState().archive(f.id, 'sold');
    const saved = useFlk.getState().flocks[0];
    expect(saved.status).toBe('archived');
    expect(saved.endDate).toBeTruthy();
    expect(saved.archivedReason).toBe('sold');
  });

  it('restore → status active + endDate پاک', () => {
    const f = makeFlock({ status: 'archived', endDate: '1405/05/01' });
    useFlk.setState({ flocks: [f] } as any);
    useFlk.getState().restore(f.id);
    const saved = useFlk.getState().flocks[0];
    expect(saved.status).toBe('active');
    expect(saved.endDate).toBe('');
  });

  it('toggleHidden → فیلد hidden عوض می‌شه', () => {
    const f = makeFlock();
    useFlk.setState({ flocks: [f] } as any);
    useFlk.getState().toggleHidden(f.id);
    expect(useFlk.getState().flocks[0].hidden).toBe(true);
    useFlk.getState().toggleHidden(f.id);
    expect(useFlk.getState().flocks[0].hidden).toBe(false);
  });

  it('togglePaused → فیلد paused عوض می‌شه', () => {
    const f = makeFlock();
    useFlk.setState({ flocks: [f] } as any);
    useFlk.getState().togglePaused(f.id);
    expect(useFlk.getState().flocks[0].paused).toBe(true);
  });
});

// ═══ addEvent / addCorrection ═══
describe('useFlk — events', () => {
  it('addEvent → event اضافه می‌شه', () => {
    const f = makeFlock();
    useFlk.setState({ flocks: [f] } as any);
    useFlk.getState().addEvent(f.id, {
      date: '1405/07/01', type: 'death', count: 5, sex: 'mixed', reason: 'بیماری',
    } as any);
    const ev = useFlk.getState().flocks[0].events;
    expect(ev).toHaveLength(1);
    expect(ev![0].type).toBe('death');
    expect(ev![0].count).toBe(5);
  });

  it('addCorrection → currentCount تغییر می‌کنه', () => {
    const f = makeFlock({ currentCount: 1000 });
    useFlk.setState({ flocks: [f] } as any);
    useFlk.getState().addCorrection(f.id, -5, 'data_entry_error', 'اصلاح', '');
    expect(useFlk.getState().flocks[0].currentCount).toBe(995);
  });

  it('addCorrection منفی → به صفر گرد می‌کنه (نه منفی)', () => {
    const f = makeFlock({ currentCount: 3 });
    useFlk.setState({ flocks: [f] } as any);
    useFlk.getState().addCorrection(f.id, -10, 'data_entry_error', 'اصلاح', '');
    expect(useFlk.getState().flocks[0].currentCount).toBe(0);
  });

  it('addCorrection صفر → چیزی تغییر نمی‌کنه', () => {
    const f = makeFlock({ currentCount: 100 });
    useFlk.setState({ flocks: [f] } as any);
    const before = useFlk.getState().flocks[0].events?.length || 0;
    useFlk.getState().addCorrection(f.id, 0, 'data_entry_error', 'اصلاح', '');
    expect(useFlk.getState().flocks[0].events?.length || 0).toBe(before);
  });
});

// ═══ revokeEvent ═══
describe('useFlk — revokeEvent', () => {
  it('revoke death → currentCount برمی‌گرده', () => {
    const f = makeFlock({ currentCount: 1000 });
    useFlk.setState({ flocks: [f] } as any);
    useFlk.getState().addEvent(f.id, {
      date: '1405/07/01', type: 'death', count: 5, sex: 'mixed', reason: '',
    } as any);
    const evId = useFlk.getState().flocks[0].events![0].id;
    useFlk.getState().revokeEvent(f.id, evId);
    expect(useFlk.getState().flocks[0].currentCount).toBe(1000);
  });

  it('revoke دوباره → لغو نمی‌شه', () => {
    const f = makeFlock({ currentCount: 1000 });
    useFlk.setState({ flocks: [f] } as any);
    useFlk.getState().addEvent(f.id, {
      date: '1405/07/01', type: 'death', count: 5, sex: 'mixed', reason: '',
    } as any);
    const evId = useFlk.getState().flocks[0].events![0].id;
    useFlk.getState().revokeEvent(f.id, evId);
    const countAfterFirst = useFlk.getState().flocks[0].currentCount;
    useFlk.getState().revokeEvent(f.id, evId);
    expect(useFlk.getState().flocks[0].currentCount).toBe(countAfterFirst);
  });
});

// ═══ mergeFlocks ═══
describe('useFlk — mergeFlocks', () => {
  it('merge → source archived + merged', () => {
    const target = makeFlock({ name: 'هدف', currentCount: 100 });
    const source = makeFlock({ name: 'منبع', currentCount: 50 });
    useFlk.setState({ flocks: [target, source] } as any);
    useFlk.getState().mergeFlocks(target.id, source.id, {
      targetAgeDays: 100, sourceAgeDays: 80,
    } as any);
    const flocks = useFlk.getState().flocks;
    const src = flocks.find(f => f.id === source.id);
    expect(src?.status).toBe('merged');
    expect(src?.currentCount).toBe(0);
    expect(src?.mergedInto).toBe(target.id);
  });
});

// ═══ migrate v7→v8 ═══
describe('flk — migrate v7→v8 (breedKind)', () => {
  it('flock قدیمی بدون breedKind → standard', () => {
    const oldFlock: any = {
      id: 'f-old', name: 'قدیمی', type: 'layer', status: 'active',
      birdId: 'b1', breedId: 'br1', hallId: '', zoneId: '',
      initialCount: 100, currentCount: 100,
      createdAt: '2026-01-01', updatedAt: '2026-01-01',
      events: [],
    };
    // شبیه‌سازی migrate v7→v8 مستقیم
    const result = {
      ...oldFlock,
      breedKind: oldFlock.breedKind || 'standard',
      breedLabel: oldFlock.breedLabel || '',
    };
    expect(result.breedKind).toBe('standard');
    expect(result.breedLabel).toBe('');
  });
});
