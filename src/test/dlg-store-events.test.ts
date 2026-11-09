/**
 * dlg-store-events.test.ts — تست addEvent + revokeEvent (v16)
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { useDlg, type DailyLog } from '../mod/dlg/store';

const minimalLog: Omit<DailyLog, 'id' | 'status' | 'createdAt' | 'updatedAt'> = {
  flockId: 'flk-1',
  date: '1405/08/18',
  entryTime: '08:00',
  temperature: null,
  temperatureMin: null,
  temperatureMax: null,
  humidity: null,
  humidityMin: null,
  humidityMax: null,
  ventilation: 'ok',
  litter: 'dry',
  behavior: 'active',
  distribution: 'uniform',
  appearance: '',
  sound: 'normal',
  feedType: '',
  feedDelivered: null,
  feedConsumed: null,
  feedRemaining: null,
  feedSourceType: '',
  feedSourceId: '',
  feedMethod: 'scoop',
  feedMovementIds: [],
  waterAmount: null,
  waterMethod: '',
  waterFillCount: null,
  waterFillVolume: null,
  weightSamples: [],
  weightGender: '',
  brokenEggs: null,
  deathsCount: 0,
  deaths: [],
  vaccines: [],
  medications: [],
  activities: [],
  notes: '',
  birdAgeDays: null,
};

describe('useDlg — events actions (v16)', () => {
  beforeEach(() => {
    useDlg.setState({ logs: [] });
  });

  it('addEvent — event به events[] اضافه می‌شود', () => {
    const logId = useDlg.getState().add(minimalLog);
    useDlg.getState().addEvent(logId, {
      date: '1405/08/18',
      entryTime: '08:00',
      type: 'reading',
      field: 'temperature',
      value: 25,
    });
    const log = useDlg.getState().logs.find(l => l.id === logId);
    expect(log?.events?.length).toBe(1);
    expect(log?.events?.[0].value).toBe(25);
    expect(log?.events?.[0].type).toBe('reading');
  });

  it('addEvent — id برمی‌گرداند', () => {
    const logId = useDlg.getState().add(minimalLog);
    const evId = useDlg.getState().addEvent(logId, {
      date: '1405/08/18',
      entryTime: '08:00',
      type: 'create',
    });
    expect(typeof evId).toBe('string');
    expect(evId.length).toBeGreaterThan(0);
  });

  it('revokeEvent — revoked=true می‌شود', () => {
    const logId = useDlg.getState().add(minimalLog);
    const evId = useDlg.getState().addEvent(logId, {
      date: '1405/08/18',
      entryTime: '08:00',
      type: 'death',
      count: 3,
    });
    const ok = useDlg.getState().revokeEvent(logId, evId);
    expect(ok).toBe(true);
    const log = useDlg.getState().logs.find(l => l.id === logId);
    expect(log?.events?.[0].revoked).toBe(true);
  });

  it('revokeEvent — event ناموجود → false', () => {
    const logId = useDlg.getState().add(minimalLog);
    const ok = useDlg.getState().revokeEvent(logId, 'not-exist');
    expect(ok).toBe(false);
  });
});
