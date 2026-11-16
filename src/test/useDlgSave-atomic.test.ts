/**
 * useDlgSave-atomic.test.ts — B4 / D5.5
 *
 * تست‌های atomic برای save() و deleteLog().
 *
 * Ref:
 * - useDlgSave.ts (B2 save atomic + B3 deleteLog atomic)
 * - cor/atomic/transaction.ts
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useDlgSave, type UseDlgSaveParams } from '../mod/dlg/hooks/useDlgSave';
import { useDlg, type DailyLog } from '../mod/dlg/store';
import { useWhs, type Item } from '../mod/whs/store';
import { useEgg } from '../mod/egg/store';
import { useFlk } from '../mod/flk/store';
import type { F } from '../mod/dlg/types';

// ═══ mocks ═══
vi.mock('../cor/store/dialog', () => ({
  showConfirmAsync: vi.fn().mockResolvedValue(true),
  showAlert: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('../cor/store/toast', () => ({
  toastMsg: {
    saved: vi.fn(), deleted: vi.fn(), deletedBulk: vi.fn(),
    error: vi.fn(), info: vi.fn(), warn: vi.fn(),
    added: vi.fn(), updated: vi.fn(), archived: vi.fn(),
    archivedBulk: vi.fn(), restored: vi.fn(), restoredBulk: vi.fn(),
    hidden: vi.fn(), visible: vi.fn(),
    paused: vi.fn(), activated: vi.fn(),
  },
  showToast: vi.fn(),
}));

vi.mock('../cor/outbox', () => ({
  outbox: {
    publish: vi.fn().mockResolvedValue('mock-event-id'),
    subscribe: vi.fn(),
    processPending: vi.fn(),
    getState: () => ({ events: [] }),
    clearDone: vi.fn(),
  },
}));

vi.mock('../mod/dlg/api/checkStock', () => ({
  checkStock: vi.fn().mockReturnValue([]),
}));

vi.mock('../shr/intelligence', () => ({
  recordHistory: vi.fn(),
}));

// ═══ helpers ═══
const emptyForm = (): F => ({
  flockId: 'flock-1',
  date: '1405/08/08',
  entryTime: '08:00',
  temperature: '25', temperatureMin: '20', temperatureMax: '30',
  humidity: '', humidityMin: '', humidityMax: '',
  ventilation: 'ok', litter: 'dry', lightHours: '',
  behavior: 'active', distribution: 'uniform', appearance: '', sound: 'normal',
  feedType: '', feedDelivered: '', feedRemaining: '',
  feedSourceType: '', feedSourceId: '', feedMovementIds: [], feedMethod: '',
  waterMethod: '', waterAmount: '', waterFillCount: '', waterFillVolume: '',
  weightSamples: [], weightGender: '',
  eatingEggs: '', fertileEggs: '', brokenEggs: '', otherEggs: '',
  deaths: [], vaccines: [], medications: [], activities: [], notes: '',
});

const makeLogRecord = (overrides: Partial<Omit<DailyLog, 'id' | 'status' | 'createdAt' | 'updatedAt'>> = {}): Omit<DailyLog, 'id' | 'status' | 'createdAt' | 'updatedAt'> => ({
  flockId: 'flock-1',
  date: '1405/08/08',
  entryTime: '08:00',
  temperature: null, temperatureMin: null, temperatureMax: null,
  humidity: null, humidityMin: null, humidityMax: null,
  ventilation: 'ok', litter: 'dry', lightHours: null,
  behavior: 'active', distribution: 'uniform', appearance: '', sound: 'normal',
  feedType: '', feedDelivered: null, feedConsumed: null, feedRemaining: null,
  feedSourceType: '', feedSourceId: '', feedMethod: '', feedMovementIds: [],
  waterMethod: '', waterAmount: null, waterFillCount: null, waterFillVolume: null,
  weightSamples: [], weightGender: '',
  brokenEggs: null,
  deathsCount: 0, deaths: [], vaccines: [], medications: [], activities: [], notes: '',
  birdAgeDays: null,
  ...overrides,
});

const makeParams = (overrides: Partial<UseDlgSaveParams> = {}): UseDlgSaveParams => ({
  form: emptyForm(),
  setForm: vi.fn(),
  saving: false,
  setSaving: vi.fn(),
  setErr: vi.fn(),
  setOpen: vi.fn(),
  selectedFlock: undefined,
  flockAliveCount: 1000,
  isLayerFlock: false,
  num: (s: string) => { const v = parseFloat(s); return isNaN(v) ? null : v; },
  int: (s: string) => { const v = parseInt(s); return isNaN(v) ? null : v; },
  ...overrides,
});

// ═══ setup ═══
type WhsState = ReturnType<typeof useWhs.getState>;
type DlgState = ReturnType<typeof useDlg.getState>;
let origAddMovement: WhsState['addMovement'] | undefined;
let origRemove: DlgState['remove'] | undefined;

beforeEach(() => {
  if (!origAddMovement) origAddMovement = useWhs.getState().addMovement;
  if (!origRemove) origRemove = useDlg.getState().remove;

  useDlg.setState({ logs: [], remove: origRemove });
  useWhs.setState({ items: [], movements: [], addMovement: origAddMovement });
  useEgg.setState({ productions: [], sales: [], discards: [] });
  useFlk.setState({ flocks: [], groups: [], groupMembers: [], consumptionEvents: [] });
  vi.clearAllMocks();
});

// ═══ tests ═══
describe('useDlgSave — B4 atomic', () => {
  it('1) save موفق → logId، log در dlg store', async () => {
    const params = makeParams();
    const { result } = renderHook(() => useDlgSave(params));
    let ok = false;
    await act(async () => {
      ok = await result.current.save();
    });
    expect(ok).toBe(true);
    const logs = useDlg.getState().logs;
    expect(logs).toHaveLength(1);
    expect(logs[0].flockId).toBe('flock-1');
    expect(logs[0].date).toBe('1405/08/08');
  });

  it('2) save shortage + reject → false، صفر mutation', async () => {
    const { checkStock } = await import('../mod/dlg/api/checkStock');
    vi.mocked(checkStock).mockReturnValueOnce([
      { name: 'test-item', need: 10, have: 5, unit: 'kg' },
    ]);
    const { showConfirmAsync } = await import('../cor/store/dialog');
    vi.mocked(showConfirmAsync).mockResolvedValueOnce(false);

    const params = makeParams();
    const { result } = renderHook(() => useDlgSave(params));
    let ok = true;
    await act(async () => {
      ok = await result.current.save();
    });
    expect(ok).toBe(false);
    expect(useDlg.getState().logs).toHaveLength(0);
    expect(useWhs.getState().movements).toHaveLength(0);
  });

  it('3) save fail در cascade → rollback کامل', async () => {
    // mock addMovement → '' → atomic throw
    useWhs.setState({ addMovement: () => '' });
    useWhs.setState({
      items: [{
        id: 'item-1', name: 'feed', category: 'feed',
        currentStock: 100, lastPrice: 1000, unit: 'kg',
        initialStock: 100, minStock: 0, supplierId: '',
        expireDate: '', storage: 'room', notes: '',
        withdrawalDays: null,
        createdAt: '', updatedAt: '',
      } as Item],
    });

    const params = makeParams({
      form: {
        ...emptyForm(),
        feedDelivered: '50',
        feedSourceType: 'item',
        feedSourceId: 'item-1',
      },
    });
    const { result } = renderHook(() => useDlgSave(params));
    let ok = true;
    await act(async () => {
      ok = await result.current.save();
    });
    expect(ok).toBe(false);
    // rollback: dlg logs still empty
    expect(useDlg.getState().logs).toHaveLength(0);
    // rollback: whs movements still empty
    expect(useWhs.getState().movements).toHaveLength(0);
    // restore
    if (origAddMovement) useWhs.setState({ addMovement: origAddMovement });
  });

  it('6) second movement fails after first mutation → restore snapshots', async () => {
    useWhs.setState({
      items: [{
        id: 'item-1', name: 'feed', category: 'feed',
        currentStock: 100, lastPrice: 1000, unit: 'kg',
        initialStock: 100, minStock: 0, supplierId: '',
        expireDate: '', storage: 'room', notes: '',
        withdrawalDays: null, createdAt: '', updatedAt: '',
      } as Item],
    });

    const snapshot = () => {
      const dlg = useDlg.getState();
      const whs = useWhs.getState();
      const egg = useEgg.getState();
      const flk = useFlk.getState();
      return JSON.parse(JSON.stringify({
        logs: dlg.logs,
        items: whs.items,
        movements: whs.movements,
        productions: egg.productions,
        sales: egg.sales,
        discards: egg.discards,
        flocks: flk.flocks,
        groups: flk.groups,
        groupMembers: flk.groupMembers,
        consumptionEvents: flk.consumptionEvents,
      }));
    };

    const before = snapshot();
    const realAddMovement = useWhs.getState().addMovement;
    let calls = 0;
    let firstId = '';
    let stockAfterFirst: number | undefined;
    let movementsAfterFirst = 0;

    useWhs.setState({
      addMovement: (...args: Parameters<WhsState['addMovement']>) => {
        calls++;
        if (calls === 2) return '';
        firstId = realAddMovement(...args);
        const state = useWhs.getState();
        stockAfterFirst = state.items.find(x => x.id === 'item-1')?.currentStock;
        movementsAfterFirst = state.movements.length;
        return firstId;
      },
    });

    let ok = true;
    try {
      const params = makeParams({
        form: {
          ...emptyForm(),
          feedDelivered: '30',
          feedSourceType: 'item',
          feedSourceId: 'item-1',
          feedSources: [
            { type: 'item', refId: 'item-1', quantity: 10 },
            { type: 'item', refId: 'item-1', quantity: 20 },
          ],
        },
      });
      const { result } = renderHook(() => useDlgSave(params));
      await act(async () => {
        ok = await result.current.save();
      });
    } finally {
      useWhs.setState({ addMovement: realAddMovement });
    }

    expect(calls).toBe(2);
    expect(firstId).toBeTruthy();
    expect(movementsAfterFirst).toBe(1);
    expect(stockAfterFirst).toBe(90);
    expect(ok).toBe(false);
    expect(snapshot()).toEqual(before);

    const { outbox } = await import('../cor/outbox');
    const { toastMsg } = await import('../cor/store/toast');
    expect(outbox.publish).not.toHaveBeenCalled();
    expect(toastMsg.saved).not.toHaveBeenCalled();
  });

  it('4) deleteLog موفق → log حذف شد', async () => {
    const logId = useDlg.getState().add(makeLogRecord());
    const log = useDlg.getState().logs.find(l => l.id === logId)!;
    expect(log).toBeTruthy();

    const params = makeParams();
    const { result } = renderHook(() => useDlgSave(params));
    let ok = false;
    await act(async () => {
      const r = await result.current.deleteLog(log);
      ok = r.ok;
    });
    expect(ok).toBe(true);
    expect(useDlg.getState().logs).toHaveLength(0);
  });

  it('5) deleteLog bulk (skipConfirm) → بدون prompt', async () => {
    const { showConfirmAsync } = await import('../cor/store/dialog');

    // 2 logs
    useDlg.getState().add(makeLogRecord({ entryTime: '08:00' }));
    useDlg.getState().add(makeLogRecord({ entryTime: '12:00' }));
    const logs = [...useDlg.getState().logs];
    expect(logs).toHaveLength(2);

    vi.mocked(showConfirmAsync).mockClear();

    const params = makeParams();
    const { result } = renderHook(() => useDlgSave(params));
    await act(async () => {
      for (const log of logs) {
        await result.current.deleteLog(log, { skipConfirm: true });
      }
    });

    expect(useDlg.getState().logs).toHaveLength(0);
    // skipConfirm → showConfirmAsync never called
    expect(showConfirmAsync).not.toHaveBeenCalled();
  });
});


// DLG_ZERO_AND_AUDIT_REGRESSION_V1
describe('dlg — zero values and atomic audit regression', () => {
  it('dailyLogToForm preserves zero numeric values', async () => {
    const { dailyLogToForm } = await import('../mod/dlg/hooks/useDlgForm');
    const { toEn } = await import('../shr/utils/fa');
    const log = {
      ...makeLogRecord(),
      id: 'zero-log', status: 'active',
      createdAt: '', updatedAt: '',
      temperature: 0, temperatureMin: 0, temperatureMax: 0,
      humidity: 0, humidityMin: 0, humidityMax: 0,
      eatingEggs: 0, fertileEggs: 0, brokenEggs: 0, otherEggs: 0,
    } as DailyLog;
    const form = dailyLogToForm(log);
    const fields = [
      'temperature', 'temperatureMin', 'temperatureMax',
      'humidity', 'humidityMin', 'humidityMax',
      'eatingEggs', 'fertileEggs', 'brokenEggs', 'otherEggs',
    ] as const;
    for (const field of fields) {
      expect(toEn(String(form[field]))).toBe('0');
    }
  });

  it('useDlgForm numeric parsers preserve Persian and English zero', async () => {
    const { useDlgForm } = await import('../mod/dlg/hooks/useDlgForm');
    const { result, unmount } = renderHook(() => useDlgForm({
      activeFlocks: [], halls: [], todayStr: '1405/08/08',
    }));
    try {
      expect(result.current.num('0')).toBe(0);
      expect(result.current.num('۰')).toBe(0);
      expect(result.current.int('0')).toBe(0);
      expect(result.current.int('۰')).toBe(0);
      expect(result.current.num('')).toBeNull();
      expect(result.current.int('')).toBeNull();
    } finally {
      unmount();
    }
  });

  it('initial audit failure rolls back the newly created log', async () => {
    const realAddEvent = useDlg.getState().addEvent;
    const { result, unmount } = renderHook(() => useDlgSave(makeParams()));
    let ok = true;
    try {
      act(() => {
        useDlg.setState({
          addEvent: () => { throw new Error('audit-test-failure'); },
        });
      });
      await act(async () => {
        ok = await result.current.save();
      });
      expect(ok).toBe(false);
      expect(useDlg.getState().logs).toHaveLength(0);
      const { outbox } = await import('../cor/outbox');
      expect(outbox.publish).not.toHaveBeenCalled();
    } finally {
      act(() => { useDlg.setState({ addEvent: realAddEvent }); });
      unmount();
    }
  });

  it('edit audit failure restores the previous log value', async () => {
    const id = useDlg.getState().add(makeLogRecord({
      temperature: 10, temperatureMin: null, temperatureMax: null,
    }));
    const before = JSON.parse(JSON.stringify(useDlg.getState().logs));
    const realAddEvent = useDlg.getState().addEvent;
    const params = makeParams({
      form: {
        ...emptyForm(), id,
        temperature: '20', temperatureMin: '', temperatureMax: '',
      },
    });
    const { result, unmount } = renderHook(() => useDlgSave(params));
    let ok = true;
    try {
      act(() => {
        useDlg.setState({
          addEvent: () => { throw new Error('audit-edit-test-failure'); },
        });
      });
      await act(async () => {
        ok = await result.current.save();
      });
      expect(ok).toBe(false);
      expect(useDlg.getState().logs).toEqual(before);
      const { outbox } = await import('../cor/outbox');
      expect(outbox.publish).not.toHaveBeenCalled();
    } finally {
      act(() => { useDlg.setState({ addEvent: realAddEvent }); });
      unmount();
    }
  });
});
