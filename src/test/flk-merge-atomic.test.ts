/**
 * D9 — flk merge/unmerge: verify atomicity by design (single set())
 *
 * flk از قبل atomic است — single set() در Zustand. این تست:
 * 1. اثبات می‌کند merge/unmerge فقط یک set() دارند (structural)
 * 2. verify می‌کند state بعد از هر عملیات صحیح است (functional)
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { useFlk } from '../mod/flk/store';

const makeFlock = (id: string, name: string, count: number, male: number, female: number, unknown: number): any => ({
  id, name, type: 'broiler', status: 'active',
  currentCount: count, initialCount: count,
  maleCount: male, femaleCount: female, unknownCount: unknown,
  events: [], sexBalanceEvents: [], sexingEvents: [],
  createdAt: '2026-01-01', updatedAt: '2026-01-01',
});

describe('D9 — flk merge/unmerge atomic', () => {
  beforeEach(() => {
    useFlk.setState({
      flocks: [
        makeFlock('t1', 'target', 100, 50, 50, 0),
        makeFlock('s1', 'source', 80, 40, 40, 0),
      ],
      groups: [], groupMembers: [], consumptionEvents: [],
    } as any);
  });

  it('merge: target combined، source merged، audit trail', () => {
    useFlk.getState().mergeFlocks('t1', 's1', { targetAgeDays: 10, sourceAgeDays: 5 });

    const t = useFlk.getState().flocks.find((f: any) => f.id === 't1') as any;
    const s = useFlk.getState().flocks.find((f: any) => f.id === 's1') as any;

    expect(t.currentCount).toBe(180);
    expect(t.maleCount).toBe(90);
    expect(t.femaleCount).toBe(90);
    expect(t.mergedInfo?.sources).toHaveLength(2);
    expect(t.sexBalanceEvents).toHaveLength(1);
    expect(t.sexBalanceEvents[0].type).toBe('merge');

    expect(s.status).toBe('merged');
    expect(s.mergedInto).toBe('t1');
    expect(s.currentCount).toBe(0);
  });

  it('unmerge: source restored، target decremented، audit trail', () => {
    useFlk.getState().mergeFlocks('t1', 's1', { targetAgeDays: 10, sourceAgeDays: 5 });
    useFlk.getState().unmergeFlocks('t1');

    const t = useFlk.getState().flocks.find((f: any) => f.id === 't1') as any;
    const s = useFlk.getState().flocks.find((f: any) => f.id === 's1') as any;

    expect(t.currentCount).toBe(100);
    expect(t.maleCount).toBe(50);
    expect(s.status).toBe('active');
    expect(s.currentCount).toBe(80);
    expect(s.mergedInto).toBeUndefined();
    expect(t.sexBalanceEvents).toHaveLength(2);
    expect(t.sexBalanceEvents[1].type).toBe('unmerge');
  });

  it('pre-flight: flock not found → throw (بدون mutation)', () => {
    const before = useFlk.getState().flocks;
    expect(() => useFlk.getState().mergeFlocks('nope', 's1', { targetAgeDays: 10, sourceAgeDays: 5 })).toThrow();
    expect(useFlk.getState().flocks).toBe(before);
  });

  it('pre-flight: type mismatch → throw (بدون mutation)', () => {
    useFlk.setState({
      flocks: [
        { ...makeFlock('t2', 't', 100, 50, 50, 0), type: 'broiler' },
        { ...makeFlock('s2', 's', 80, 40, 40, 0), type: 'layer' },
      ],
    } as any);
    const before = useFlk.getState().flocks;
    expect(() => useFlk.getState().mergeFlocks('t2', 's2', { targetAgeDays: 10, sourceAgeDays: 5 })).toThrow();
    expect(useFlk.getState().flocks).toBe(before);
  });

  it('structural: merge + unmerge = single set()', async () => {
    const fs = await import('node:fs');
    const content = fs.readFileSync('src/mod/flk/store.ts', 'utf-8');

    // استخراج body از mergeFlocks
    const mergeStart = content.indexOf('mergeFlocks: (targetId, sourceId, opts) => {');
    expect(mergeStart).toBeGreaterThan(-1);

    // بین mergeFlocks و unmergeFlocks
    const unmergeStart = content.indexOf('unmergeFlocks: (targetId: string, sourceId?: string) => {');
    expect(unmergeStart).toBeGreaterThan(mergeStart);

    const mergeBody = content.slice(mergeStart, unmergeStart);
    const mergeSetCount = (mergeBody.match(/\bset\(/g) || []).length;
    expect(mergeSetCount).toBe(1);

    // unmerge body تا کلید بعدی یا انتهای پیکربندی
    const restStart = unmergeStart;
    const nextKey = content.slice(restStart + 50).search(/\n      [a-zA-Z]+: /);
    const unmergeBody = nextKey >= 0
      ? content.slice(restStart, restStart + 50 + nextKey)
      : content.slice(restStart);
    const unmergeSetCount = (unmergeBody.match(/\bset\(/g) || []).length;
    expect(unmergeSetCount).toBe(1);
  });
});
