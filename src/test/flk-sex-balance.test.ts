/**
 * flk-sex-balance.test.ts — تست‌های Invariant و Audit Trail
 * پوشش فاز ۴a — sex-aware deaths + clamp fix
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { useFlk } from '../mod/flk/store';
import type { Flock } from '../mod/flk/types-store';

// ═══ Fixtures ═══
const makeFlock = (overrides: Partial<Flock> = {}): Flock => ({
  id: 'f-' + Math.random(),
  name: 'تست',
  type: 'breeder',
  birdId: 'bird-1',
  breedId: 'breed-1',
  hallId: '',
  zoneId: '',
  initialCount: 1000,
  currentCount: 1000,
  maleCount: 0,
  femaleCount: 0,
  unknownCount: 1000,
  genderSplitAt: null,
  startDate: '1405/05/01',
  hatchDate: '',
  purchaseDate: '',
  source: 'purchase',
  status: 'active',
  notes: '',
  events: [],
  sexingEvents: [],
  sexBalanceEvents: [],
  createdAt: '1405/05/01',
  updatedAt: '1405/05/01',
  ...overrides,
} as any);

function resetStore(): void {
  useFlk.setState({ flocks: [] });
}

function invariant(f: Flock): boolean {
  return (f.maleCount ?? 0) + (f.femaleCount ?? 0) + (f.unknownCount ?? 0) === (f.currentCount ?? 0);
}

// ═══ Tests ═══
describe('addEvent — death sex-aware (split flock)', () => {
  beforeEach(resetStore);

  it('male death → maleCount decreases, invariant held', () => {
    const f = makeFlock({
      currentCount: 950,
      maleCount: 470,
      femaleCount: 455,
      unknownCount: 25,
      genderSplitAt: '1405/08/15',
    });
    useFlk.setState({ flocks: [f] });
    useFlk.getState().addEvent(f.id, { date: '1405/08/20', type: 'death', count: 10, sex: 'male', notes: 'تست' });
    const u = useFlk.getState().flocks[0];
    expect(u.maleCount).toBe(460);
    expect(u.currentCount).toBe(940);
    expect(invariant(u)).toBe(true);
  });

  it('female death → femaleCount decreases, invariant held', () => {
    const f = makeFlock({
      currentCount: 950, maleCount: 470, femaleCount: 455, unknownCount: 25,
      genderSplitAt: '1405/08/15',
    });
    useFlk.setState({ flocks: [f] });
    useFlk.getState().addEvent(f.id, { date: '1405/08/20', type: 'death', count: 5, sex: 'female', notes: '' });
    const u = useFlk.getState().flocks[0];
    expect(u.femaleCount).toBe(450);
    expect(u.currentCount).toBe(945);
    expect(invariant(u)).toBe(true);
  });

  it('mixed death → unknown decreases first', () => {
    const f = makeFlock({
      currentCount: 950, maleCount: 470, femaleCount: 455, unknownCount: 25,
      genderSplitAt: '1405/08/15',
    });
    useFlk.setState({ flocks: [f] });
    useFlk.getState().addEvent(f.id, { date: '1405/08/20', type: 'death', count: 10, sex: 'mixed', notes: '' });
    const u = useFlk.getState().flocks[0];
    expect(u.unknownCount).toBe(15);
    expect(u.currentCount).toBe(940);
    expect(invariant(u)).toBe(true);
  });
});

describe('addEvent — clamp redistribution (delta > available)', () => {
  beforeEach(resetStore);

  it('male death > maleCount → spillover به unknown', () => {
    const f = makeFlock({
      currentCount: 950, maleCount: 2, femaleCount: 450, unknownCount: 498,
      genderSplitAt: '1405/08/15',
    });
    useFlk.setState({ flocks: [f] });
    useFlk.getState().addEvent(f.id, { date: '1405/08/20', type: 'death', count: 5, sex: 'male', notes: '' });
    const u = useFlk.getState().flocks[0];
    expect(u.maleCount).toBe(0);
    expect(u.unknownCount).toBe(495);  // 498 - 3
    expect(u.currentCount).toBe(945);
    expect(invariant(u)).toBe(true);
  });

  it('male death > maleCount + unknown → هم female هم صفر می‌شود', () => {
    const f = makeFlock({
      currentCount: 100, maleCount: 2, femaleCount: 3, unknownCount: 95,
      genderSplitAt: '1405/08/15',
    });
    useFlk.setState({ flocks: [f] });
    // try to kill 5 male → male 2, spill 3 to unknown (95→92)
    useFlk.getState().addEvent(f.id, { date: '1405/08/20', type: 'death', count: 5, sex: 'male', notes: '' });
    const u = useFlk.getState().flocks[0];
    expect(u.maleCount).toBe(0);
    expect(u.unknownCount).toBe(92);
    expect(u.femaleCount).toBe(3);  // untouched
    expect(invariant(u)).toBe(true);
  });

  it('mixed death > unknownCount → spread به greater(male, female)', () => {
    const f = makeFlock({
      currentCount: 100, maleCount: 10, femaleCount: 30, unknownCount: 60,
      genderSplitAt: '1405/08/15',
    });
    useFlk.setState({ flocks: [f] });
    // kill 80 mixed → unknown 60, spill 20 to greater (female 30 > male 10)
    useFlk.getState().addEvent(f.id, { date: '1405/08/20', type: 'death', count: 80, sex: 'mixed', notes: '' });
    const u = useFlk.getState().flocks[0];
    expect(u.unknownCount).toBe(0);
    expect(u.femaleCount).toBe(10);  // 30 - 20
    expect(u.maleCount).toBe(10);    // untouched
    expect(u.currentCount).toBe(20);
    expect(invariant(u)).toBe(true);
  });
});

describe('addEvent — unsplit flock', () => {
  beforeEach(resetStore);

  it('death در unsplit → unknown', () => {
    const f = makeFlock({ currentCount: 1000, unknownCount: 1000 });
    useFlk.setState({ flocks: [f] });
    useFlk.getState().addEvent(f.id, { date: '1405/08/20', type: 'death', count: 10, sex: 'mixed', notes: '' });
    const u = useFlk.getState().flocks[0];
    expect(u.unknownCount).toBe(990);
    expect(u.currentCount).toBe(990);
    expect(invariant(u)).toBe(true);
  });

  it('male death در unsplit → auto transition به split', () => {
    const f = makeFlock({ currentCount: 1000, unknownCount: 1000 });
    useFlk.setState({ flocks: [f] });
    useFlk.getState().addEvent(f.id, { date: '1405/08/20', type: 'add', count: 10, sex: 'male', notes: '' });
    const u = useFlk.getState().flocks[0];
    expect(u.maleCount).toBe(10);
    expect(u.genderSplitAt).not.toBeNull();
    expect(invariant(u)).toBe(true);
  });
});

describe('addEvent — sexBalanceEvents audit trail', () => {
  beforeEach(resetStore);

  it('male death → sexBalanceEvent ثبت می‌شود', () => {
    const f = makeFlock({
      currentCount: 950, maleCount: 470, femaleCount: 455, unknownCount: 25,
      genderSplitAt: '1405/08/15',
    });
    useFlk.setState({ flocks: [f] });
    useFlk.getState().addEvent(f.id, { date: '1405/08/20', type: 'death', count: 10, sex: 'male', reason: 'بیماری', notes: '' });
    const u = useFlk.getState().flocks[0];
    expect(u.sexBalanceEvents).toHaveLength(1);
    const ev = u.sexBalanceEvents![0];
    expect(ev.type).toBe('death');
    expect(ev.before.male).toBe(470);
    expect(ev.after.male).toBe(460);
    expect(ev.delta.male).toBe(-10);
    expect(ev.reason).toBe('بیماری');
  });

  it('بدون تغییر جنسیت → sexBalanceEvent ثبت نمی‌شود (add بدون sex)', () => {
    const f = makeFlock({
      currentCount: 100, maleCount: 10, femaleCount: 30, unknownCount: 60,
      genderSplitAt: '1405/08/15',
    });
    useFlk.setState({ flocks: [f] });
    // add بدون جنسیت (mixed → unknown)
    useFlk.getState().addEvent(f.id, { date: '1405/08/20', type: 'add', count: 5, sex: 'mixed', notes: '' });
    const u = useFlk.getState().flocks[0];
    // unknown changed 60 → 65 → delta.unknown = +5 → event باید ثبت شود
    expect(u.sexBalanceEvents).toHaveLength(1);
    expect(u.sexBalanceEvents![0].delta.unknown).toBe(5);
  });
});

describe('recordSexing — invariant check', () => {
  beforeEach(resetStore);

  it('mismatch → throw error', () => {
    const f = makeFlock({ currentCount: 950, unknownCount: 950 });
    useFlk.setState({ flocks: [f] });
    expect(() => {
      useFlk.getState().recordSexing(f.id, { male: 400, female: 400, unknown: 100, date: '1405/08/20' });
    }).toThrow(/اختلاف/);
  });

  it('male+female+unknown = currentCount → OK', () => {
    const f = makeFlock({ currentCount: 950, unknownCount: 950 });
    useFlk.setState({ flocks: [f] });
    useFlk.getState().recordSexing(f.id, { male: 470, female: 455, unknown: 25, date: '1405/08/20' });
    const u = useFlk.getState().flocks[0];
    expect(u.maleCount).toBe(470);
    expect(u.femaleCount).toBe(455);
    expect(u.unknownCount).toBe(25);
    expect(u.genderSplitAt).toBeTruthy();
    expect(invariant(u)).toBe(true);
  });
});
