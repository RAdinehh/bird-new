/**
 * dlg-store-corrections.test.ts — تست addCorrection + revokeCorrection
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { useDlg, type DailyLog } from '../mod/dlg/store';
import { applyCorrections } from '../mod/dlg/api/applyCorrections';

const makeInput = (): Omit<DailyLog, 'id' | 'status' | 'createdAt' | 'updatedAt'> => ({
  flockId: 'flk-1',
  date: '1405/11/09',
  entryTime: '07:00',
  temperature: 25,
  temperatureMin: null,
  temperatureMax: null,
  humidity: 50,
  humidityMin: null,
  humidityMax: null,
  ventilation: 'ok',
  litter: 'dry',
  behavior: 'active',
  distribution: 'uniform',
  appearance: '',
  sound: 'normal',
  feedType: '',
  feedDelivered: 50,
  feedConsumed: 50,
  feedRemaining: 0,
  feedSourceType: '',
  feedSourceId: '',
  feedMethod: 'scoop',
  feedMovementIds: [],
  waterAmount: 80,
  waterMethod: 'manual',
  waterFillCount: null,
  waterFillVolume: null,
  weightSamples: [],
  weightGender: '',
  brokenEggs: 0,
  deathsCount: 5,
  deaths: [],
  vaccines: [],
  medications: [],
  activities: [],
  notes: '',
  birdAgeDays: 30,
});

describe('useDlg — corrections actions', () => {
  beforeEach(() => {
    useDlg.setState({ logs: [] });
  });

  it('addCorrection → correction در log + applyCorrections', () => {
    const id = useDlg.getState().add(makeInput());
    const corrId = useDlg.getState().addCorrection(id, { deathsCount: 3 }, 'اشتباه شمارش');
    expect(corrId).toBeTruthy();

    const log = useDlg.getState().logs.find(l => l.id === id)!;
    expect(log.corrections).toHaveLength(1);
    expect(log.corrections![0].reason).toBe('اشتباه شمارش');
    expect(log.corrections![0].revoked).toBe(false);

    expect(applyCorrections(log).deathsCount).toBe(3);
  });

  it('addCorrection برای log ناموجود → null', () => {
    const corrId = useDlg.getState().addCorrection('non-existent', { deathsCount: 3 }, 'reason');
    expect(corrId).toBeNull();
  });

  it('revokeCorrection → correction.revoked=true + مقدار اصلی برگشت', () => {
    const id = useDlg.getState().add(makeInput());
    const corrId = useDlg.getState().addCorrection(id, { deathsCount: 3 }, 'اشتباه')!;

    const ok = useDlg.getState().revokeCorrection(id, corrId);
    expect(ok).toBe(true);

    const log = useDlg.getState().logs.find(l => l.id === id)!;
    expect(log.corrections![0].revoked).toBe(true);
    expect(applyCorrections(log).deathsCount).toBe(5); // original
  });

  it('revokeCorrection دوباره → false (idempotent)', () => {
    const id = useDlg.getState().add(makeInput());
    const corrId = useDlg.getState().addCorrection(id, { deathsCount: 3 }, 'خطا')!;
    useDlg.getState().revokeCorrection(id, corrId);
    const again = useDlg.getState().revokeCorrection(id, corrId);
    expect(again).toBe(false);
  });

  it('revokeCorrection برای corr ناموجود → false', () => {
    const id = useDlg.getState().add(makeInput());
    const ok = useDlg.getState().revokeCorrection(id, 'non-existent');
    expect(ok).toBe(false);
  });
});
