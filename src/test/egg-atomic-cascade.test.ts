/**
 * D.7 Phase 4a — negative test برای egg atomic (end-to-end)
 *
 * نکته: registerEggWhsHandlers باید صدا زده شود تا emitSync handler داشته باشد.
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { useEgg } from '../mod/egg/store';
import { useWhs } from '../mod/whs/store';
import { registerEggWhsHandlers } from '../mod/whs/handlers';

const makeProd = (overrides: any = {}): any => ({
  flockId: 'f1',
  date: '1405/11/08',
  eatingCount: 100,
  fertileCount: 0,
  totalCount: 100,
  brokenCount: 0,
  softCount: 0,
  dirtyCount: 0,
  avgWeight: null,
  notes: '',
  ...overrides,
});

describe('D.7 — egg atomic cascade (end-to-end)', () => {
  let unregister: () => void;

  beforeEach(() => {
    useEgg.setState({ productions: [], sales: [], discards: [] } as any);
    useWhs.setState({ items: [], movements: [] } as any);
    unregister = registerEggWhsHandlers();
  });

  afterEach(() => {
    if (unregister) unregister();
  });

  it('happy: addProduction → whs movement ساخته می‌شود', () => {
    const prodId = useEgg.getState().addProduction(makeProd());
    expect(typeof prodId).toBe('string');
    expect(prodId.length).toBeGreaterThan(0);
    expect(useEgg.getState().productions).toHaveLength(1);
    expect(useWhs.getState().movements.length).toBeGreaterThan(0);
    expect(useWhs.getState().items.length).toBeGreaterThan(0);
  });

  it('failure: whs.addMovement throws → productions + whs rollback', () => {
    const originalAddMovement = useWhs.getState().addMovement;
    useWhs.setState({
      addMovement: () => { throw new Error('simulated whs failure'); },
    } as any);

    try {
      expect(() => useEgg.getState().addProduction(makeProd())).toThrow();
      expect(useEgg.getState().productions).toHaveLength(0);
      expect(useWhs.getState().movements).toHaveLength(0);
    } finally {
      useWhs.setState({ addMovement: originalAddMovement } as any);
    }
  });

  it('failure: deleteProduction — whs.deleteMovement throws → productions rollback', () => {
    const prodId = useEgg.getState().addProduction(makeProd());
    expect(useEgg.getState().productions).toHaveLength(1);

    const originalDeleteMovement = useWhs.getState().deleteMovement;
    useWhs.setState({
      deleteMovement: () => { throw new Error('simulated delete failure'); },
    } as any);

    try {
      expect(() => useEgg.getState().deleteProduction(prodId)).toThrow();
      expect(useEgg.getState().productions).toHaveLength(1);
      expect(useEgg.getState().productions[0].id).toBe(prodId);
    } finally {
      useWhs.setState({ deleteMovement: originalDeleteMovement } as any);
    }
  });

  it('structural: egg.store از emitSync + snapshot استفاده می‌کند', async () => {
    const fs = await import('node:fs');
    const content = fs.readFileSync('src/mod/egg/store.ts', 'utf-8');
    expect(content).toContain('bus.emitSync');
    expect(content).toContain('prevWhsItems');
    expect(content).toContain('prevWhsMovs');
    expect(content).toContain('useWhs.setState({ items: prevWhsItems, movements: prevWhsMovs })');
  });
});
