/**
 * D8 — negative test برای inc atomic (addHatch/deleteHatch + flk cascade)
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { useInc } from '../mod/inc/store';
import { useFlk } from '../mod/flk/store';

const makeEntry = (): any => ({
  id: 'e1',
  birdId: 'b1',
  breedId: 'br1',
  date: '1405/11/01',
  eggs: 100,
  status: 'complete',
  createdAt: '2026-01-01',
});

const makeHatch = (): any => ({
  eggEntryId: 'e1',
  date: '1405/11/21',
  hatched: 80,
  maleCount: 40,
  femaleCount: 40,
  unknownCount: 0,
  avgWeight: 0.04,
});

describe('D8 — inc atomic cascade', () => {
  beforeEach(() => {
    useInc.setState({ devices: [], eggEntries: [makeEntry()], candlings: [], hatches: [], hatchGroups: [] } as any);
    useFlk.setState({ flocks: [], groups: [], groupMembers: [], consumptionEvents: [] } as any);
  });

  it('happy: addHatch → گله ساخته می‌شود', () => {
    const before = useFlk.getState().flocks.length;
    useInc.getState().addHatch(makeHatch());
    expect(useInc.getState().hatches).toHaveLength(1);
    expect(useFlk.getState().flocks.length).toBe(before + 1);
    expect(useInc.getState().hatches[0].generatedFlockId).toBeTruthy();
  });

  it('failure: flk.add throws → hatches + flocks rollback', () => {
    const originalAdd = useFlk.getState().add;
    useFlk.setState({
      add: () => { throw new Error('simulated flk failure'); },
    } as any);

    try {
      expect(() => useInc.getState().addHatch(makeHatch())).toThrow();
      expect(useInc.getState().hatches).toHaveLength(0);
      expect(useFlk.getState().flocks).toHaveLength(0);
    } finally {
      useFlk.setState({ add: originalAdd } as any);
    }
  });

  it('failure: deleteHatch — flk.remove throws → hatches rollback', () => {
    useInc.getState().addHatch(makeHatch());
    const hatchId = useInc.getState().hatches[0].id;
    expect(useInc.getState().hatches).toHaveLength(1);

    const originalRemove = useFlk.getState().remove;
    useFlk.setState({
      remove: () => { throw new Error('simulated flk remove failure'); },
    } as any);

    try {
      expect(() => useInc.getState().deleteHatch(hatchId)).toThrow();
      expect(useInc.getState().hatches).toHaveLength(1);
      expect(useInc.getState().hatches[0].id).toBe(hatchId);
    } finally {
      useFlk.setState({ remove: originalRemove } as any);
    }
  });

  it('structural: inc.store از snapshot + throw استفاده می‌کند', async () => {
    const fs = await import('node:fs');
    const content = fs.readFileSync('src/mod/inc/store.ts', 'utf-8');
    expect(content).toContain('__prevHatches');
    expect(content).toContain('__prevFlks');
    expect(content).toContain('خطا در ثبت هچ');
    expect(content).toContain('خطا در حذف هچ');
  });
});
