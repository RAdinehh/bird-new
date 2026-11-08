import { describe, it, expect } from 'vitest';
import { applyCorrections } from '../mod/dlg/api/applyCorrections';
import type { DailyLog } from '../mod/dlg/store';

function makeLog(overrides: Partial<DailyLog> = {}): DailyLog {
  return {
    id: 'test', flockId: 'f1', date: '1405/11/08', entryTime: '08:00',
    temperature: 25, temperatureMin: 25, temperatureMax: 25,
    humidity: 60, humidityMin: 60, humidityMax: 60,
    ventilation: 'ok', litter: 'dry', behavior: 'active',
    distribution: 'uniform', appearance: '', sound: 'normal',
    feedType: '', feedDelivered: 100, feedConsumed: 20, feedRemaining: 80,
    feedSourceType: '', feedSourceId: '', feedMethod: '', feedMovementIds: [],
    waterAmount: null, waterMethod: '', waterFillCount: null, waterFillVolume: null,
    weightSamples: [], weightGender: '',
    brokenEggs: null, eatingEggs: null, fertileEggs: null, otherEggs: null,
    deathsCount: 5,
    deaths: [{ id: 'd1', count: 5, cause: 'sick', notes: '' }],
    vaccines: [], medications: [], activities: [], notes: '',
    status: 'active', birdAgeDays: null,
    createdAt: '2024-01-01', updatedAt: '2024-01-01',
    corrections: [],
    ...overrides,
  };
}

describe('applyCorrections — recompute مشتق‌ها', () => {
  it('بدون correction → همان لاگ (identity)', () => {
    const log = makeLog();
    expect(applyCorrections(log)).toBe(log);
  });

  it('correction روی tempMin → temperature recompute', () => {
    const log = makeLog({
      temperatureMin: 25, temperatureMax: 28, temperature: 26.5,
      corrections: [{
        id: 'c1', timestamp: '10:00', reason: 'اشتباه',
        changes: { temperatureMin: 15 }, revoked: false, createdAt: '2024-01-01',
      }],
    });
    const r = applyCorrections(log);
    expect(r.temperatureMin).toBe(15);
    expect(r.temperature).toBe(21.5);
  });

  it('correction روی feedDelivered → feedConsumed recompute', () => {
    const log = makeLog({
      feedDelivered: 100, feedRemaining: 80, feedConsumed: 20,
      corrections: [{
        id: 'c1', timestamp: '10:00', reason: 'اشتباه',
        changes: { feedDelivered: 120 }, revoked: false, createdAt: '2024-01-01',
      }],
    });
    const r = applyCorrections(log);
    expect(r.feedDelivered).toBe(120);
    expect(r.feedConsumed).toBe(40);
  });

  it('correction روی deathsCount (تک‌رکورد) → deaths sync', () => {
    const log = makeLog({
      deathsCount: 5, deaths: [{ id: 'd1', count: 5, cause: 'sick', notes: '' }],
      corrections: [{
        id: 'c1', timestamp: '10:00', reason: 'اشتباه',
        changes: { deathsCount: 4 }, revoked: false, createdAt: '2024-01-01',
      }],
    });
    const r = applyCorrections(log);
    expect(r.deathsCount).toBe(4);
    expect(r.deaths[0].count).toBe(4);
  });

  it('correction روی deathsCount (چند‌رکورد) → deathsCount=sum (safety)', () => {
    const log = makeLog({
      deathsCount: 5,
      deaths: [
        { id: 'd1', count: 3, cause: 'sick', notes: '' },
        { id: 'd2', count: 2, cause: 'heat', notes: '' },
      ],
      corrections: [{
        id: 'c1', timestamp: '10:00', reason: 'اشتباه',
        changes: { deathsCount: 4 }, revoked: false, createdAt: '2024-01-01',
      }],
    });
    const r = applyCorrections(log);
    expect(r.deathsCount).toBe(5);
  });

  it('correction revoked → skip', () => {
    const log = makeLog({
      temperature: 25,
      corrections: [{
        id: 'c1', timestamp: '10:00', reason: 'اشتباه',
        changes: { temperature: 99 }, revoked: true, createdAt: '2024-01-01',
      }],
    });
    const r = applyCorrections(log);
    expect(r.temperature).toBe(25);
  });
});
