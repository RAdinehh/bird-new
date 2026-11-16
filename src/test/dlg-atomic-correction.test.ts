/**
 * dlg-atomic-correction.test.ts — تست applyCorrectionAtomic + revokeCorrectionAtomic
 * استاندارد: ALCOA+ / 21 CFR Part 11 §11.10(e)
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useDlg, type DailyLog } from '../mod/dlg/store';
import { applyCorrections } from '../mod/dlg/api/applyCorrections';
import { useDlgSave } from '../mod/dlg/hooks/useDlgSave';

vi.mock('../cor/outbox', () => ({
  outbox: { publish: vi.fn(() => Promise.resolve()) },
}));

vi.mock('../cor/store/toast', () => ({
  toastMsg: { saved: vi.fn(), error: vi.fn() },
}));

const makeLog = (): Omit<DailyLog, 'id' | 'status' | 'createdAt' | 'updatedAt'> => ({
  flockId: 'flk-1', date: '1405/11/15', entryTime: '07:00',
  temperature: 25, temperatureMin: null, temperatureMax: null,
  humidity: 50, humidityMin: null, humidityMax: null,
  ventilation: 'ok', litter: 'dry', behavior: 'active', distribution: 'uniform',
  appearance: '', sound: 'normal', feedType: '',
  feedDelivered: 50, feedConsumed: 50, feedRemaining: 0,
  feedSourceType: '', feedSourceId: '', feedMethod: 'scoop', feedMovementIds: [],
  waterAmount: 80, waterMethod: 'manual',
  waterFillCount: null, waterFillVolume: null,
  weightSamples: [], weightGender: '',
  brokenEggs: 0, deathsCount: 5, deaths: [],
  vaccines: [], medications: [], activities: [], notes: '', birdAgeDays: 30,
});

const setupHook = () => {
  const noop = () => {};
  return renderHook(() => useDlgSave({
    form: {} as any, saving: false, setSaving: noop, setOpen: noop, setErr: noop,
    setForm: noop as any, selectedFlock: undefined, flockAliveCount: 100,
    isLayerFlock: false, num: () => null, int: () => null,
  }));
};

describe('Correction Atomic — Immutable Log + Event Sourcing', () => {
  beforeEach(() => {
    useDlg.setState({ logs: [] });
  });

  it('applyCorrectionAtomic → corrections[] اضافه، log اصلی دست‌نخورده', async () => {
    const id = useDlg.getState().add(makeLog());
    const { result } = setupHook();

    let ok = false;
    await act(async () => {
      ok = await result.current.applyCorrectionAtomic(id, { deathsCount: 3 }, 'اشتباه شمارش');
    });
    expect(ok).toBe(true);

    const log = useDlg.getState().logs.find(l => l.id === id)!;
    expect(log.deathsCount).toBe(5);
    expect(log.corrections).toHaveLength(1);
    expect(log.corrections![0].changes.deathsCount).toBe(3);
    expect(applyCorrections(log).deathsCount).toBe(3);
  });

  it('revokeCorrectionAtomic → effective برمی‌گردد به مقدار اصلی', async () => {
    const id = useDlg.getState().add(makeLog());
    const { result } = setupHook();

    await act(async () => {
      await result.current.applyCorrectionAtomic(id, { deathsCount: 3 }, 'اشتباه شمارش');
    });
    const log1 = useDlg.getState().logs.find(l => l.id === id)!;
    const corrId = log1.corrections![0].id;

    let ok = false;
    await act(async () => {
      ok = await result.current.revokeCorrectionAtomic(id, corrId);
    });
    expect(ok).toBe(true);

    const log2 = useDlg.getState().logs.find(l => l.id === id)!;
    expect(log2.deathsCount).toBe(5);
    expect(log2.corrections![0].revoked).toBe(true);
    expect(applyCorrections(log2).deathsCount).toBe(5);
  });

  it('applyCorrectionAtomic → Audit Trail ثبت می‌شود', async () => {
    const id = useDlg.getState().add(makeLog());
    const { result } = setupHook();

    await act(async () => {
      await result.current.applyCorrectionAtomic(id, { feedWaste: 10 }, 'خطا در ثبت');
    });

    const log = useDlg.getState().logs.find(l => l.id === id)!;
    const events = (log as any).events || [];
    const wasteEv = events.find((e: any) => e.field === 'feedWaste');
    expect(wasteEv).toBeTruthy();
    expect(wasteEv.before).toBe(null);
    expect(wasteEv.after).toBe(10);
    expect(wasteEv.reason).toBe('خطا در ثبت');
  });

  it('applyCorrectionAtomic → log ناموجود false برمی‌گرداند', async () => {
    const { result } = setupHook();
    let ok = true;
    await act(async () => {
      ok = await result.current.applyCorrectionAtomic('non-existent', { deathsCount: 3 }, 'x');
    });
    expect(ok).toBe(false);
  });

  it('revokeCorrectionAtomic روی correction قبلاً revoked → false', async () => {
    const id = useDlg.getState().add(makeLog());
    const { result } = setupHook();

    await act(async () => {
      await result.current.applyCorrectionAtomic(id, { deathsCount: 3 }, 'x');
    });
    const corrId = useDlg.getState().logs.find(l => l.id === id)!.corrections![0].id;
    await act(async () => {
      await result.current.revokeCorrectionAtomic(id, corrId);
    });

    let again = true;
    await act(async () => {
      again = await result.current.revokeCorrectionAtomic(id, corrId);
    });
    expect(again).toBe(false);
  });
});
