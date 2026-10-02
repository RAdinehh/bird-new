import { describe, it, expect, beforeEach } from 'vitest';
import {
  useDlg, waterFeedRatio, tempWarning, humidityWarning,
  mortalityRate, avgWeight, sumWeight, cvWeight, totalWater, lightWarning,
} from '../mod/dlg/store';

const makeLog = () => ({
  flockId: 'flock-1',
  date: '1405/07/09',
  entryTime: '08:00',
  temperature: 22, temperatureMin: 20, temperatureMax: 25,
  humidity: 55, humidityMin: 50, humidityMax: 60,
  ventilation: 'ok', litter: 'dry', lightHours: 16,
  behavior: 'active', distribution: 'uniform', appearance: 'normal', sound: 'normal',
  feedType: 'starter', feedAmount: 100, feedRemaining: 50,
  feedSourceType: '', feedSourceId: '', feedMethod: '', feedMovementIds: [],
  waterAmount: 200, waterMethod: 'manual', waterFillCount: null, waterFillVolume: null,
  weightSamples: [], weightGender: '',
  eggsCount: null, brokenEggs: null, dirtyEggs: null,
  deathsCount: 0, deaths: [],
  vaccines: [], medications: [], activities: [],
  notes: '',
});

beforeEach(() => {
  useDlg.setState({ logs: [] });
});

describe('useDlg — store', () => {
  it('add → id برمیگردونه', () => {
    const id = useDlg.getState().add(makeLog() as any);
    expect(id).toBeTruthy();
    expect(typeof id).toBe('string');
  });

  it('add → رکورد اضافه میشه با status=active', () => {
    useDlg.getState().add(makeLog() as any);
    const logs = useDlg.getState().logs;
    expect(logs).toHaveLength(1);
    expect(logs[0].status).toBe('active');
    expect(logs[0].createdAt).toBeTruthy();
    expect(logs[0].updatedAt).toBeTruthy();
  });

  it('add → id یکتا', () => {
    const s = useDlg.getState();
    const id1 = s.add(makeLog() as any);
    const id2 = s.add(makeLog() as any);
    expect(id1).not.toBe(id2);
  });

  it('update → فقط هدف', () => {
    const s = useDlg.getState();
    const id1 = s.add({ ...makeLog(), notes: 'A' } as any);
    s.add({ ...makeLog(), notes: 'B' } as any);

    s.update(id1, { notes: 'A-edited', temperature: 25 });
    const logs = useDlg.getState().logs;
    expect(logs[0].notes).toBe('A-edited');
    expect(logs[0].temperature).toBe(25);
    expect(logs[1].notes).toBe('B');
  });

  it('remove → فقط هدف', () => {
    const s = useDlg.getState();
    const id1 = s.add({ ...makeLog(), notes: 'A' } as any);
    s.add({ ...makeLog(), notes: 'B' } as any);
    s.remove(id1);
    const logs = useDlg.getState().logs;
    expect(logs).toHaveLength(1);
    expect(logs[0].notes).toBe('B');
  });

  it('archive → status=archived', () => {
    const s = useDlg.getState();
    const id = s.add(makeLog() as any);
    s.archive(id);
    expect(useDlg.getState().logs[0].status).toBe('archived');
  });

  it('restore → status=active', () => {
    const s = useDlg.getState();
    const id = s.add(makeLog() as any);
    s.archive(id);
    s.restore(id);
    expect(useDlg.getState().logs[0].status).toBe('active');
  });

  it('update نامعتبر → خطا نمیده', () => {
    const s = useDlg.getState();
    s.add(makeLog() as any);
    s.update('nonexistent', { notes: 'X' });
    expect(useDlg.getState().logs[0].notes).toBe('');
  });
});

describe('waterFeedRatio', () => {
  it('محاسبه درست', () => {
    expect(waterFeedRatio(200, 100)).toBe(2);
  });
  it('null ها → 0', () => {
    expect(waterFeedRatio(null, 100)).toBe(0);
    expect(waterFeedRatio(200, null)).toBe(0);
    expect(waterFeedRatio(null, null)).toBe(0);
  });
  it('feed=0 → 0 (نه Infinity)', () => {
    expect(waterFeedRatio(200, 0)).toBe(0);
  });
});

describe('tempWarning', () => {
  it('null → ok', () => {
    expect(tempWarning(null)).toBe('ok');
  });
  it('18-26 → ok', () => {
    expect(tempWarning(22)).toBe('ok');
    expect(tempWarning(18)).toBe('ok');
    expect(tempWarning(26)).toBe('ok');
  });
  it('15-18 یا 26-30 → warn', () => {
    expect(tempWarning(16)).toBe('warn');
    expect(tempWarning(28)).toBe('warn');
  });
  it('<15 یا >30 → danger', () => {
    expect(tempWarning(10)).toBe('danger');
    expect(tempWarning(35)).toBe('danger');
  });
});

describe('humidityWarning', () => {
  it('40-70 → ok', () => {
    expect(humidityWarning(55)).toBe('ok');
  });
  it('30-40 یا 70-80 → warn', () => {
    expect(humidityWarning(35)).toBe('warn');
    expect(humidityWarning(75)).toBe('warn');
  });
  it('<30 یا >80 → danger', () => {
    expect(humidityWarning(20)).toBe('danger');
    expect(humidityWarning(90)).toBe('danger');
  });
});

describe('mortalityRate', () => {
  it('محاسبه درست (در هزار)', () => {
    expect(mortalityRate(5, 1000)).toBe(5);
  });
  it('بدون داده → 0', () => {
    expect(mortalityRate(0, 1000)).toBe(0);
    expect(mortalityRate(5, null)).toBe(0);
  });
});

describe('avgWeight', () => {
  it('خالی → 0', () => {
    expect(avgWeight([])).toBe(0);
  });
  it('میانگین', () => {
    const samples = [
      { id: '1', weight: 1.2 },
      { id: '2', weight: 1.4 },
      { id: '3', weight: 1.3 },
    ];
    expect(avgWeight(samples)).toBe(1.3);
  });
});

describe('sumWeight', () => {
  it('مجموع', () => {
    const samples = [
      { id: '1', weight: 1.2 },
      { id: '2', weight: 1.4 },
    ];
    expect(sumWeight(samples)).toBe(2.6);
  });
});

describe('cvWeight', () => {
  it('کمتر از ۲ نمونه → 0', () => {
    expect(cvWeight([])).toBe(0);
    expect(cvWeight([{ id: '1', weight: 1.2 }])).toBe(0);
  });
  it('CV معقول (نه منفی، نه NaN)', () => {
    const samples = [
      { id: '1', weight: 1.0 },
      { id: '2', weight: 1.2 },
      { id: '3', weight: 1.1 },
    ];
    const cv = cvWeight(samples);
    expect(cv).toBeGreaterThan(0);
    expect(cv).toBeLessThan(100);
  });
});

describe('totalWater', () => {
  it('محاسبه', () => {
    expect(totalWater(5, 4)).toBe(20);
  });
  it('null → null', () => {
    expect(totalWater(null, 4)).toBeNull();
    expect(totalWater(5, null)).toBeNull();
  });
});

describe('lightWarning', () => {
  it('null → ok', () => {
    expect(lightWarning(null, 'layer')).toBe('ok');
  });
  it('layer: 14-17 → ok', () => {
    expect(lightWarning(16, 'layer')).toBe('ok');
  });
  it('layer: 12-14 → warn', () => {
    expect(lightWarning(13, 'layer')).toBe('warn');
  });
  it('layer: <12 → danger', () => {
    expect(lightWarning(8, 'layer')).toBe('danger');
  });
  it('broiler: 18-24 → ok', () => {
    expect(lightWarning(20, 'broiler')).toBe('ok');
  });
  it('broiler: <18 → danger', () => {
    expect(lightWarning(15, 'broiler')).toBe('danger');
  });
});
