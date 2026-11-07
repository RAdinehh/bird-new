import { describe, it, expect, beforeEach } from 'vitest';
import { useFlk } from '../mod/flk/store';

const makeFlock = (o: any = {}) => ({
  id: 'f-' + Math.random().toString(36).slice(2, 9),
  name: 'گله', type: 'layer', status: 'active',
  birdId: 'b1', breedId: 'br1', hallId: '', zoneId: '',
  initialCount: 100, currentCount: 100,
  maleCount: 0, femaleCount: 0, unknownCount: 100,
  layingStartDay: 140, vaccineScheduleId: '',
  hatchDate: '', purchaseDate: '', startDate: '1405/01/01', endDate: '',
  source: '', purchasePrice: 0, deliveryCost: 0, otherCosts: 0,
  notes: '', events: [], sexingEvents: [], sexBalanceEvents: [],
  genderSplitAt: null,
  createdAt: '2026-01-01', updatedAt: '2026-01-01',
  ...o,
});

beforeEach(() => {
  useFlk.setState({ flocks: [], groups: [], groupMembers: [], consumptionEvents: [] } as any);
});

describe('recordSexing — اولیه', () => {
  it('تفکیک اولیه ۵۰/۵۰ → sexingEvents=1، balanceEvents=1، genderSplitAt', () => {
    const f = makeFlock({ currentCount: 100, unknownCount: 100 });
    useFlk.setState({ flocks: [f] } as any);
    useFlk.getState().recordSexing(f.id, { male: 50, female: 50, unknown: 0, date: '1405/08/01' });
    const u = useFlk.getState().flocks[0];
    expect(u.maleCount).toBe(50);
    expect(u.femaleCount).toBe(50);
    expect(u.unknownCount).toBe(0);
    expect(u.genderSplitAt).toBeTruthy();
    expect(u.sexingEvents).toHaveLength(1);
    expect(u.sexBalanceEvents).toHaveLength(1);
    expect(u.sexingEvents![0].source).toBe('purchase');
    expect(u.sexingEvents![0].male).toBe(50);
    expect(u.sexBalanceEvents![0].type).toBe('sexing');
    expect(u.sexBalanceEvents![0].before).toEqual({ male: 0, female: 0, unknown: 100 });
    expect(u.sexBalanceEvents![0].after).toEqual({ male: 50, female: 50, unknown: 0 });
    expect(u.initialMaleCount).toBe(50);
    expect(u.initialFemaleCount).toBe(50);
  });

  it('تفکیک اولیه ناقص (unknown باقی می‌ماند) → source=partial', () => {
    const f = makeFlock({ currentCount: 100, unknownCount: 100 });
    useFlk.setState({ flocks: [f] } as any);
    useFlk.getState().recordSexing(f.id, { male: 20, female: 30, unknown: 50, date: '1405/08/01' });
    const u = useFlk.getState().flocks[0];
    expect(u.sexingEvents![0].source).toBe('partial');
    expect(u.unknownCount).toBe(50);
  });
});

describe('recordSexing — مجدد', () => {
  it('تفکیک مجدد → ۲ sexingEvents، قبلی حفظ شده', () => {
    const f = makeFlock({
      currentCount: 100, maleCount: 50, femaleCount: 50, unknownCount: 0,
      genderSplitAt: '1405/08/01',
      sexingEvents: [{
        id: 'se-1', date: '1405/08/01', male: 50, female: 50, unknown: 0,
        source: 'purchase' as const, createdAt: '2026-01-01',
      }],
    });
    useFlk.setState({ flocks: [f] } as any);
    useFlk.getState().recordSexing(f.id, { male: 60, female: 40, unknown: 0, date: '1405/08/05' });
    const u = useFlk.getState().flocks[0];
    expect(u.maleCount).toBe(60);
    expect(u.femaleCount).toBe(40);
    expect(u.sexingEvents).toHaveLength(2);
    expect(u.sexingEvents![0].id).toBe('se-1');
    expect(u.sexingEvents![1].male).toBe(60);
    expect(u.sexBalanceEvents).toHaveLength(1);
    expect(u.sexBalanceEvents![0].before).toEqual({ male: 50, female: 50, unknown: 0 });
    expect(u.sexBalanceEvents![0].after).toEqual({ male: 60, female: 40, unknown: 0 });
  });

  it('تفکیک مجدد تکمیل (unknown → 0) → source=final', () => {
    const f = makeFlock({
      currentCount: 100, maleCount: 20, femaleCount: 30, unknownCount: 50,
      genderSplitAt: '1405/08/01',
    });
    useFlk.setState({ flocks: [f] } as any);
    useFlk.getState().recordSexing(f.id, { male: 50, female: 50, unknown: 0, date: '1405/08/05' });
    const u = useFlk.getState().flocks[0];
    expect(u.sexingEvents![0].source).toBe('final');
    expect(u.unknownCount).toBe(0);
  });
});

describe('recordSexing — validation', () => {
  it('sum != currentCount → throw', () => {
    const f = makeFlock({ currentCount: 100, unknownCount: 100 });
    useFlk.setState({ flocks: [f] } as any);
    expect(() => {
      useFlk.getState().recordSexing(f.id, { male: 40, female: 40, unknown: 0, date: '1405/08/01' });
    }).toThrow(/اختلاف/);
    expect(useFlk.getState().flocks[0].genderSplitAt).toBeNull();
  });

  it('male+female=0 → throw', () => {
    const f = makeFlock({ currentCount: 100, unknownCount: 100 });
    useFlk.setState({ flocks: [f] } as any);
    expect(() => {
      useFlk.getState().recordSexing(f.id, { male: 0, female: 0, unknown: 100, date: '1405/08/01' });
    }).toThrow(/حداقل یکی/);
  });

  it('flock ناموجود → no-op بدون throw', () => {
    expect(() => {
      useFlk.getState().recordSexing('nonexistent', { male: 50, female: 50, unknown: 0, date: '1405/08/01' });
    }).not.toThrow();
  });

  it('male منفی → ۰ (Math.max)', () => {
    const f = makeFlock({ currentCount: 100, unknownCount: 100 });
    useFlk.setState({ flocks: [f] } as any);
    useFlk.getState().recordSexing(f.id, { male: -10, female: 100, unknown: 0, date: '1405/08/01' });
    const u = useFlk.getState().flocks[0];
    expect(u.maleCount).toBe(0);
    expect(u.femaleCount).toBe(100);
  });
});
