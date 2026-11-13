/**
 * dlg-corrections.test.ts — تست applyCorrections (Stage 1)
 */
import { describe, it, expect } from 'vitest';
import { applyCorrections } from '../mod/dlg/api/applyCorrections';
import type { DailyLog, DailyLogCorrection } from '../mod/dlg/store';

const baseLog = (overrides: Partial<DailyLog> = {}): DailyLog => ({
  id: 'log-1',
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
  eatingEggs: 100,
  fertileEggs: 0,
  otherEggs: 0,
  deathsCount: 5,
  deaths: [],
  vaccines: [],
  medications: [],
  notes: '',
  status: 'active',
  birdAgeDays: 30,
  createdAt: '2025-01-01T00:00:00.000Z',
  updatedAt: '2025-01-01T00:00:00.000Z',
  corrections: [],
  ...overrides,
});

const corr = (overrides: Partial<DailyLogCorrection> = {}): DailyLogCorrection => ({
  id: 'corr-1',
  timestamp: '20:00',
  reason: 'اشتباه شمارش',
  changes: {},
  createdAt: '2025-01-02T00:00:00.000Z',
  ...overrides,
});

describe('applyCorrections', () => {
  it('بدون corrections → مقدار اصلی', () => {
    const log = baseLog({ corrections: [] });
    expect(applyCorrections(log).deathsCount).toBe(5);
  });

  it('یک correction → مقدار جدید', () => {
    const log = baseLog({ corrections: [corr({ changes: { deathsCount: 3 } })] });
    const result = applyCorrections(log);
    expect(result.deathsCount).toBe(3);
    expect(result.temperature).toBe(25); // untouched
  });

  it('correction revoked → نادیده گرفته می‌شود', () => {
    const log = baseLog({
      corrections: [corr({ revoked: true, changes: { deathsCount: 3 } })],
    });
    expect(applyCorrections(log).deathsCount).toBe(5);
  });

  it('دو correction → آخرین برنده', () => {
    const log = baseLog({
      corrections: [
        corr({ id: 'a', changes: { deathsCount: 8 } }),
        corr({ id: 'b', changes: { deathsCount: 3 } }),
      ],
    });
    expect(applyCorrections(log).deathsCount).toBe(3);
  });
});
