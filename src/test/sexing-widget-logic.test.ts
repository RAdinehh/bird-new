import { describe, it, expect, vi } from 'vitest';
import { computeSexingStats } from '../mod/dsh/sexingWidgetLogic';

vi.mock('../mod/flk/store', () => ({
  getAgeDays: (f: any) => f.__ageDays ?? 0,
}));

const makeFlock = (o: any = {}) => ({
  id: 'f1', type: 'breeder', genderSplitAt: null, breedId: 'br1',
  sexingAgeOverride: null, __ageDays: 0, ...o,
});
const breeds = [{ id: 'br1', name: 'Marandi' }];
const stdOk = (name: string) => name === 'Marandi' ? 56 : null;
const stdNull = () => null;

describe('computeSexingStats', () => {
  it('age=60, std=56 → overdue=1', () => {
    expect(computeSexingStats([makeFlock({ __ageDays: 60 })], breeds, stdOk).overdue).toBe(1);
  });
  it('age=52, std=56 → thisWeek=1', () => {
    expect(computeSexingStats([makeFlock({ __ageDays: 52 })], breeds, stdOk).thisWeek).toBe(1);
  });
  it('age=45, std=56 → twoWeeks=1', () => {
    expect(computeSexingStats([makeFlock({ __ageDays: 45 })], breeds, stdOk).twoWeeks).toBe(1);
  });
  it('age=30 → total=0', () => {
    expect(computeSexingStats([makeFlock({ __ageDays: 30 })], breeds, stdOk).total).toBe(0);
  });
  it('sexed (genderSplitAt != null) → ignore', () => {
    expect(computeSexingStats([makeFlock({ __ageDays: 60, genderSplitAt: '1405/08/01' })], breeds, stdOk).total).toBe(0);
  });
  it('type=layer → ignore', () => {
    expect(computeSexingStats([makeFlock({ __ageDays: 60, type: 'layer' })], breeds, stdOk).total).toBe(0);
  });
  it('sexingAgeOverride=40 اولویت', () => {
    expect(computeSexingStats([makeFlock({ __ageDays: 45, sexingAgeOverride: 40 })], breeds, stdOk).overdue).toBe(1);
  });
  it('breed ناموجود → ignore', () => {
    expect(computeSexingStats([makeFlock({ __ageDays: 60, breedId: 'x' })], breeds, stdOk).total).toBe(0);
  });
  it('std null → ignore', () => {
    expect(computeSexingStats([makeFlock({ __ageDays: 60 })], breeds, stdNull).total).toBe(0);
  });
  it('چند گله → جمع درست', () => {
    const flocks = [
      makeFlock({ id: 'a', __ageDays: 60 }),
      makeFlock({ id: 'b', __ageDays: 52 }),
      makeFlock({ id: 'c', __ageDays: 45 }),
      makeFlock({ id: 'd', __ageDays: 30 }),
    ];
    const r = computeSexingStats(flocks, breeds, stdOk);
    expect(r.overdue).toBe(1);
    expect(r.thisWeek).toBe(1);
    expect(r.twoWeeks).toBe(1);
    expect(r.total).toBe(3);
  });
});
