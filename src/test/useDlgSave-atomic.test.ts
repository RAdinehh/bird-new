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
import { useDlgSave } from '../mod/dlg/hooks/useDlgSave';
import { useDlg } from '../mod/dlg/store';
import { useWhs } from '../mod/whs/store';
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
  temperature: '', temperatureMin: '', temperatureMax: '',
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

const makeLogRecord = (overrides: any = {}) => ({
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

const makeParams = (overrides: Partial<any> = {}) => ({
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
let origAddMovement: any;
let origRemove: any;

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
    (checkStock as any).mockReturnValueOnce([
      { name: 'test-item', need: 10, have: 5, unit: 'kg' },
    ]);
    const { showConfirmAsync } = await import('../cor/store/dialog');
    (showConfirmAsync as any).mockResolvedValueOnce(false);

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
    useWhs.setState({ addMovement: (() => '') as any });
    useWhs.setState({
      items: [{
        id: 'item-1', name: 'feed', category: 'feed',
        currentStock: 100, lastPrice: 1000, unit: 'kg',
        initialStock: 100, minStock: 0, supplierId: '',
        expireDate: '', storage: 'room', notes: '',
        createdAt: '', updatedAt: '',
      } as any],
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
    useWhs.setState({ addMovement: origAddMovement });
  });

  it('4) deleteLog موفق → log حذف شد', async () => {
    const logId = useDlg.getState().add(makeLogRecord() as any);
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
    useDlg.getState().add(makeLogRecord({ entryTime: '08:00' }) as any);
    useDlg.getState().add(makeLogRecord({ entryTime: '12:00' }) as any);
    const logs = [...useDlg.getState().logs];
    expect(logs).toHaveLength(2);

    (showConfirmAsync as any).mockClear();

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
