/**
 * flk-merge-sex.test.ts — TDD فاز ۵
 *
 * ۴ تست که قبل از fix باید FAIL بدهند:
 *   1. snapshot sexingEvents را حفظ می‌کند
 *   2. merge → audit با type='merge'
 *   3. unmerge → sexingEvents برگردانده می‌شود
 *   4. unmerge → audit با type='unmerge'
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { useFlk } from '../mod/flk/store';

const makeFlock = (o: any = {}) => ({
  id: 'f-' + Math.random().toString(36).slice(2, 9),
  name: 'گله', type: 'layer', status: 'active',
  birdId: 'b1', breedId: 'br1', hallId: '', zoneId: '',
  initialCount: 100, currentCount: 100,
  maleCount: null, femaleCount: null, unknownCount: 100,
  layingStartDay: 140, vaccineScheduleId: '',
  hatchDate: '', purchaseDate: '', startDate: '1405/01/01', endDate: '',
  source: '', purchasePrice: 0, deliveryCost: 0, otherCosts: 0,
  notes: '', events: [], sexingEvents: [], sexBalanceEvents: [],
  createdAt: '2026-01-01', updatedAt: '2026-01-01',
  ...o,
});

beforeEach(() => {
  useFlk.setState({ flocks: [], groups: [], groupMembers: [] } as any);
});

describe('فاز ۵ — merge/unmerge با sexing', () => {
  it('1. merge → sexingEvents و sexBalanceEvents در snapshot', () => {
    const target = makeFlock({ name: 'T', initialCount: 100, currentCount: 100 });
    const source = makeFlock({
      name: 'S', initialCount: 50, currentCount: 50,
      maleCount: 25, femaleCount: 25, unknownCount: 0,
      genderSplitAt: '1405/08/01',
      sexingEvents: [{
        id: 'se-1', date: '1405/08/01', male: 25, female: 25, unknown: 0,
        source: 'purchase', createdAt: '2026-01-01',
      } as any],
      sexBalanceEvents: [{
        id: 'sbe-1', date: '1405/08/01', type: 'sexing',
        before: { male: 0, female: 0, unknown: 50 },
        after: { male: 25, female: 25, unknown: 0 },
        delta: { male: 25, female: 25, unknown: -50 },
        createdAt: '2026-01-01',
      } as any],
    });
    useFlk.setState({ flocks: [target, source] } as any);

    useFlk.getState().mergeFlocks(target.id, source.id, {
      targetAgeDays: 100, sourceAgeDays: 80,
    } as any);

    const t = useFlk.getState().flocks.find(f => f.id === target.id)!;
    const src = t.mergedInfo?.sources?.find((s: any) => s.flockId === source.id);
    expect(src).toBeDefined();
    expect(src!.sexingEvents).toBeDefined();
    expect(src!.sexingEvents).toHaveLength(1);
    expect(src!.sexBalanceEvents).toHaveLength(1);
  });

  it('2. merge → audit با type=merge', () => {
    const target = makeFlock({ name: 'T', initialCount: 100, currentCount: 100,
      maleCount: 50, femaleCount: 50, unknownCount: 0, genderSplitAt: '1405/07/01' });
    const source = makeFlock({ name: 'S', initialCount: 50, currentCount: 50,
      maleCount: 20, femaleCount: 30, unknownCount: 0, genderSplitAt: '1405/08/01' });
    useFlk.setState({ flocks: [target, source] } as any);

    useFlk.getState().mergeFlocks(target.id, source.id, {
      targetAgeDays: 100, sourceAgeDays: 80,
    } as any);

    const t = useFlk.getState().flocks.find(f => f.id === target.id)!;
    const audits = (t.sexBalanceEvents || []).filter((e: any) => e.type === 'merge');
    expect(audits.length).toBe(1);
    expect(audits[0].before.male).toBe(50);   // فقط target
    expect(audits[0].after.male).toBe(70);    // 50 + 20
    expect(audits[0].delta.male).toBe(20);
    expect(audits[0].delta.female).toBe(30);
  });

  it('3. unmerge → sexingEvents و sexBalanceEvents برگردانده می‌شوند', () => {
    const target = makeFlock({ name: 'T', initialCount: 100, currentCount: 100 });
    const source = makeFlock({
      name: 'S', initialCount: 50, currentCount: 50,
      maleCount: 25, femaleCount: 25, unknownCount: 0,
      genderSplitAt: '1405/08/01',
      initialMaleCount: 25, initialFemaleCount: 25,
      sexingEvents: [{ id: 'se-1', date: '1405/08/01', male: 25, female: 25, unknown: 0,
        source: 'purchase', createdAt: '2026-01-01' } as any],
      sexBalanceEvents: [{ id: 'sbe-1', date: '1405/08/01', type: 'sexing',
        before: { male: 0, female: 0, unknown: 50 },
        after: { male: 25, female: 25, unknown: 0 },
        delta: { male: 25, female: 25, unknown: -50 },
        createdAt: '2026-01-01' } as any],
    });
    useFlk.setState({ flocks: [target, source] } as any);

    useFlk.getState().mergeFlocks(target.id, source.id, {
      targetAgeDays: 100, sourceAgeDays: 80,
    } as any);
    useFlk.getState().unmergeFlocks(target.id, source.id);

    const s = useFlk.getState().flocks.find(f => f.id === source.id)!;
    expect(s.sexingEvents).toHaveLength(1);
    expect(s.sexingEvents![0].id).toBe('se-1');
    expect(s.sexBalanceEvents).toHaveLength(1);
    expect(s.sexBalanceEvents![0].id).toBe('sbe-1');
    expect(s.initialMaleCount).toBe(25);
    expect(s.initialFemaleCount).toBe(25);
  });

  it('4. unmerge → audit با type=unmerge', () => {
    const target = makeFlock({ name: 'T', initialCount: 100, currentCount: 100,
      maleCount: 50, femaleCount: 50, unknownCount: 0, genderSplitAt: '1405/07/01' });
    const source = makeFlock({ name: 'S', initialCount: 50, currentCount: 50,
      maleCount: 20, femaleCount: 30, unknownCount: 0, genderSplitAt: '1405/08/01' });
    useFlk.setState({ flocks: [target, source] } as any);

    useFlk.getState().mergeFlocks(target.id, source.id, {
      targetAgeDays: 100, sourceAgeDays: 80,
    } as any);
    useFlk.getState().unmergeFlocks(target.id, source.id);

    const t = useFlk.getState().flocks.find(f => f.id === target.id)!;
    const audits = (t.sexBalanceEvents || []).filter((e: any) => e.type === 'unmerge');
    expect(audits.length).toBe(1);
    expect(audits[0].before.male).toBe(70);
    expect(audits[0].after.male).toBe(50);
    expect(audits[0].delta.male).toBe(-20);
  });
});
