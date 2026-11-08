/**
 * dlg — negative tests برای deleteLog + restoreLogFull
 *
 * D.6-F style: اثبات rollback در میانه cascade
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useDlgSave, type UseDlgSaveParams } from '../mod/dlg/hooks/useDlgSave';
import { useDlg, type DailyLog } from '../mod/dlg/store';
import { useWhs, type Item } from '../mod/whs/store';
import { useEgg } from '../mod/egg/store';
import { useFlk } from '../mod/flk/store';
import type { F } from '../mod/dlg/types';

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

const emptyForm = (): F => ({
  flockId: 'flock-1',
  date: '1405/08/08',
  entryTime: '08:00',
  temperature: '', temperatureMin: '', temperatureMax: '',
  humidity: '', humidityMin: '', humidityMax: '',
  ventilation: 'ok', litter: 'dry', lightHours: '',
  behavior: 'active', distribution: 'uniform',
  appearance: '', sound: 'normal',
  feedType: '', feedDelivered: '', feedRemaining: '',
  feedSourceType: '', feedSourceId: '', feedMovementIds: [],
  feedMethod: '',
  waterMethod: '', waterAmount: '', waterFillCount: '', waterFillVolume: '',
  weightSamples: [], weightGender: '',
  eatingEggs: '', fertileEggs: '', brokenEggs: '', otherEggs: '',
  deaths: [], vaccines: [], medications: [], activities: [], notes: '',
});

const makeItem = (id: string, stock = 100): Item => ({
  id, name: 'item-' + id, category: 'feed', unit: 'kg',
  minStock: 0, currentStock: stock, initialStock: stock,
  lastPrice: 1000, avgPrice: 1000,
  supplierId: '', expireDate: '', withdrawalDays: null,
  batchNo: '', storage: 'room', notes: '',
  createdAt: '2026-01-01', updatedAt: '2026-01-01',
} as any);

const makeLogWithCascades = (): DailyLog => ({
  id: 'log-1', flockId: 'flock-1', date: '1405/08/08', entryTime: '08:00',
  temperature: null, temperatureMin: null, temperatureMax: null,
  humidity: null, humidityMin: null, humidityMax: null,
  ventilation: 'ok', litter: 'dry', lightHours: null,
  behavior: 'active', distribution: 'uniform', appearance: '', sound: 'normal',
  feedType: '', feedDelivered: 50, feedConsumed: 50, feedRemaining: 0,
  feedSourceType: '', feedSourceId: '',
  feedMovementIds: ['mv-feed-1'],  // ← cascade marker
  feedMethod: 'scoop',
  waterMethod: '', waterAmount: null, waterFillCount: null, waterFillVolume: null,
  weightSamples: [], weightGender: '',
  eatingEggs: null, fertileEggs: null, brokenEggs: null, otherEggs: null,
  deathsCount: 0, deaths: [],
  vaccines: [], medications: [], activities: [], notes: '',
  status: 'active', birdAgeDays: null,
  createdAt: '2026-01-01', updatedAt: '2026-01-01',
} as any);

describe('dlg — deleteLog/restoreLogFull negative', () => {
  let params: UseDlgSaveParams;

  beforeEach(() => {
    useDlg.setState({ logs: [makeLogWithCascades()] } as any);
    useWhs.setState({
      items: [makeItem('feed-1')],
      movements: [{
        id: 'mv-feed-1', itemId: 'feed-1', type: 'out', quantity: 50,
        unitPrice: 1000, reason: 'consumption', date: '1405/08/08',
        partyId: '', notes: '', flockId: 'flock-1',
        createdAt: '2026-01-01',
      }] as any,
    } as any);
    useEgg.setState({ productions: [], sales: [], discards: [] } as any);
    useFlk.setState({ flocks: [], groups: [], groupMembers: [], consumptionEvents: [] } as any);

    params = {
      form: emptyForm(),
      setForm: vi.fn(),
      saving: false,
      setSaving: vi.fn(),
      setErr: vi.fn(),
      setOpen: vi.fn(),
      selectedFlock: undefined,
      flockAliveCount: 0,
      isLayerFlock: false,
      num: () => null,
      int: () => null,
    };
  });

  it('deleteLog fail در whs.deleteMovement → rollback log', async () => {
    // ← mock قبل از renderHook (hook action رو در render time destructure می‌کنه)
    const originalDeleteMovement = useWhs.getState().deleteMovement;
    useWhs.setState({
      deleteMovement: () => { throw new Error('simulated whs delete failure'); },
    } as any);

    try {
      const { result } = renderHook(() => useDlgSave(params));
      const log = useDlg.getState().logs[0];
      let res: any;
      await act(async () => {
        res = await result.current.deleteLog(log, { skipConfirm: true });
      });
      expect(res.ok).toBe(false);
      // rollback: log برگشت
      expect(useDlg.getState().logs).toHaveLength(1);
      expect(useDlg.getState().logs[0].id).toBe('log-1');
    } finally {
      useWhs.setState({ deleteMovement: originalDeleteMovement } as any);
    }
  });

  it('deleteLog happy → log حذف', async () => {
    const { result } = renderHook(() => useDlgSave(params));
    const log = useDlg.getState().logs[0];
    let res: any;
    await act(async () => {
      res = await result.current.deleteLog(log, { skipConfirm: true });
    });
    expect(res.ok).toBe(true);
    expect(useDlg.getState().logs).toHaveLength(0);
  });

  it('restoreLogFull fail در whs.addMovement → rollback log', async () => {
    // ← mock قبل از renderHook
    const originalAddMovement = useWhs.getState().addMovement;
    useWhs.setState({
      addMovement: () => { throw new Error('simulated whs add failure'); },
    } as any);

    try {
      const { result } = renderHook(() => useDlgSave(params));
      const snapshot = {
        feedMovements: [{
          id: 'mv-x', itemId: 'feed-1', type: 'out' as const, quantity: 50,
          unitPrice: 1000, reason: 'consumption' as const, date: '1405/08/08',
          partyId: '', notes: '', flockId: 'flock-1', createdAt: '2026-01-01',
        }],
        vaccineMovements: [],
        medicationMovements: [],
        production: null,
      };

      // پاک کردن log تا rollback قابل verify باشد
      useDlg.setState({ logs: [] } as any);

      let ok: boolean | undefined;
      await act(async () => {
        ok = await result.current.restoreLogFull(makeLogWithCascades(), snapshot as any);
      });
      expect(ok).toBe(false);
      // rollback: log اضافه نشد
      expect(useDlg.getState().logs).toHaveLength(0);
    } finally {
      useWhs.setState({ addMovement: originalAddMovement } as any);
    }
  });

  it('restoreLogFull happy → log بازگشت + movement جدید', async () => {
    const { result } = renderHook(() => useDlgSave(params));

    const snapshot = {
      feedMovements: [{
        id: 'mv-x', itemId: 'feed-1', type: 'out' as const, quantity: 50,
        unitPrice: 1000, reason: 'consumption' as const, date: '1405/08/08',
        partyId: '', notes: '', flockId: 'flock-1', createdAt: '2026-01-01',
      }],
      vaccineMovements: [],
      medicationMovements: [],
      production: null,
    };

    useDlg.setState({ logs: [] } as any);

    let ok: boolean | undefined;
    await act(async () => {
      ok = await result.current.restoreLogFull(makeLogWithCascades(), snapshot as any);
    });
    expect(ok).toBe(true);
    expect(useDlg.getState().logs).toHaveLength(1);
    expect(useWhs.getState().movements.length).toBeGreaterThan(0);
  });
});
