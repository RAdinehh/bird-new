import { describe, it, expect } from 'vitest';
import { SEX_AUDIT_META, formatSexDelta } from '../mod/flk/helpers-audit';

describe('SEX_AUDIT_META — همه typeها پوشش داده شده', () => {
  it('۸ type اصلی با icon و label', () => {
    const types = ['sexing', 'death', 'sale', 'return', 'correction', 'merge', 'unmerge', 'pre_sexing_observation'] as const;
    for (const t of types) {
      expect(SEX_AUDIT_META[t]).toBeDefined();
      expect(SEX_AUDIT_META[t].icon).toBeTruthy();
      expect(SEX_AUDIT_META[t].label).toBeTruthy();
      expect(SEX_AUDIT_META[t].tone).toMatch(/^var\(--/);
    }
  });
});

describe('formatSexDelta — متن کوتاه', () => {
  it('male only', () => {
    expect(formatSexDelta({ male: -10, female: 0, unknown: 0 })).toBe('♂ -10');
  });
  it('mixed', () => {
    expect(formatSexDelta({ male: 5, female: -3, unknown: 0 })).toBe('♂ +5 · ♀ -3');
  });
  it('zero → خالی', () => {
    expect(formatSexDelta({ male: 0, female: 0, unknown: 0 })).toBe('');
  });
  it('all three', () => {
    expect(formatSexDelta({ male: -1, female: 2, unknown: 3 })).toBe('♂ -1 · ♀ +2 · ? +3');
  });
});

// ═════════════════════════════════════════════════════════════
// فاز ۷.۲ — aggregateDeathsBySex + toneFromRate
// ═════════════════════════════════════════════════════════════
import { aggregateDeathsBySex, toneFromRate } from '../mod/flk/helpers-audit';

const makeEv = (type: any, deltaM: number, deltaF: number, deltaU: number) => ({
  id: 'e-' + Math.random(),
  type,
  date: '1405/08/01',
  before: { male: 50, female: 50, unknown: 0 },
  after: { male: 50 + deltaM, female: 50 + deltaF, unknown: deltaU },
  delta: { male: deltaM, female: deltaF, unknown: deltaU },
  createdAt: '2026-01-01',
});

describe('aggregateDeathsBySex', () => {
  it('بدون sexBalanceEvents → hasData=false', () => {
    const r = aggregateDeathsBySex(undefined, 50, 50);
    expect(r.hasData).toBe(true); // initial موجود است، ولی deaths=0
    expect(r.male.deaths).toBe(0);
    expect(r.female.deaths).toBe(0);
  });

  it('بدون initialMale/Female → hasData=false', () => {
    const r = aggregateDeathsBySex([makeEv('death', -10, 0, 0)], 0, 0);
    expect(r.hasData).toBe(false);
  });

  it('male death -10 با initial=50 → rate=20٪', () => {
    const r = aggregateDeathsBySex([makeEv('death', -10, 0, 0)], 50, 50);
    expect(r.male.deaths).toBe(10);
    expect(r.male.rate).toBe(20);
    expect(r.female.deaths).toBe(0);
  });

  it('چند death event → جمع درست', () => {
    const r = aggregateDeathsBySex([
      makeEv('death', -5, 0, 0),
      makeEv('death', -3, -2, 0),
      makeEv('death', 0, -1, 0),
    ], 50, 50);
    expect(r.male.deaths).toBe(8);
    expect(r.female.deaths).toBe(3);
  });

  it('type=sale → حساب نمی‌شود', () => {
    const r = aggregateDeathsBySex([
      makeEv('death', -10, 0, 0),
      makeEv('sale', -20, -20, 0),
    ], 50, 50);
    expect(r.male.deaths).toBe(10); // فقط death، نه sale
  });

  it('delta مثبت (add) → نادیده', () => {
    const r = aggregateDeathsBySex([
      makeEv('death', -10, 0, 0),
      makeEv('death', 5, 0, 0), // غیرمعمول ولی نادیده
    ], 50, 50);
    expect(r.male.deaths).toBe(10);
  });

  it('unknown deaths جمع جدا', () => {
    const r = aggregateDeathsBySex([makeEv('death', 0, 0, -7)], 50, 50);
    expect(r.unknown.deaths).toBe(7);
  });
});

describe('toneFromRate', () => {
  it('rate<10 → text', () => expect(toneFromRate(5)).toBe('var(--text)'));
  it('rate=10 → warn', () => expect(toneFromRate(10)).toBe('var(--warn)'));
  it('rate=19.9 → warn', () => expect(toneFromRate(19.9)).toBe('var(--warn)'));
  it('rate=20 → danger', () => expect(toneFromRate(20)).toBe('var(--danger)'));
  it('rate=50 → danger', () => expect(toneFromRate(50)).toBe('var(--danger)'));
});

// ═════════════════════════════════════════════════════════════
// فاز ۷.۳ — CSV export
// ═════════════════════════════════════════════════════════════
import { eventsToCSV, auditToCSV } from '../mod/flk/helpers-audit';

describe('eventsToCSV', () => {
  it('خالی → فقط header', () => {
    const csv = eventsToCSV([]);
    expect(csv.split('\n').length).toBe(1);
    expect(csv).toContain('تاریخ');
  });
  it('یک event → header + ردیف', () => {
    const csv = eventsToCSV([
      { id: '1', date: '1405/08/01', type: 'death', count: 10, sex: 'male', reason: 'بیماری', notes: 'تست', revoked: false } as any,
    ]);
    const lines = csv.split('\n');
    expect(lines.length).toBe(2);
    expect(lines[1]).toContain('1405/08/01');
    expect(lines[1]).toContain('death');
    expect(lines[1]).toContain('10');
    expect(lines[1]).toContain('male');
    expect(lines[1]).toContain('خیر');
  });
  it('revoked → بله', () => {
    const csv = eventsToCSV([
      { id: '1', date: '1405/08/01', type: 'sell', count: 5, sex: 'mixed', reason: '', notes: '', revoked: true } as any,
    ]);
    expect(csv).toContain('بله');
  });
  it('کاراکتر کاما در cell → escape با quote', () => {
    const csv = eventsToCSV([
      { id: '1', date: '1405/08/01', type: 'death', count: 1, sex: 'male', reason: 'بیماری, ضعف', notes: '', revoked: false } as any,
    ]);
    expect(csv).toContain('"بیماری, ضعف"');
  });
});

describe('auditToCSV', () => {
  it('خالی → فقط header', () => {
    const csv = auditToCSV([]);
    expect(csv.split('\n').length).toBe(1);
    expect(csv).toContain('نر قبل');
    expect(csv).toContain('نر بعد');
  });
  it('یک audit → header + ردیف با delta', () => {
    const csv = auditToCSV([{
      id: 'a1', date: '1405/08/01', type: 'sale',
      before: { male: 50, female: 50, unknown: 0 },
      after: { male: 40, female: 50, unknown: 0 },
      delta: { male: -10, female: 0, unknown: 0 },
      note: 'فروش',
      createdAt: '2026-01-01',
    } as any]);
    const lines = csv.split('\n');
    expect(lines.length).toBe(2);
    expect(lines[1]).toContain('-10');
    expect(lines[1]).toContain('sale');
    expect(lines[1]).toContain('"فروش"');
  });
});

// ═════════════════════════════════════════════════════════════
// فاز ۷.۴ — weightBySexFromLogs
// ═════════════════════════════════════════════════════════════
import { weightBySexFromLogs } from '../mod/flk/helpers-audit';

const mkLog = (flockId: string, gender: string, weights: number[]) => ({
  flockId,
  weightGender: gender,
  weightSamples: weights.map(w => ({ weight: w })),
});

describe('weightBySexFromLogs', () => {
  it('بدون logs → hasData=false', () => {
    const r = weightBySexFromLogs([], 'f1');
    expect(r.hasData).toBe(false);
    expect(r.delta).toBeNull();
  });
  it('یک log نر → male.hasData=true', () => {
    const r = weightBySexFromLogs([mkLog('f1', 'male', [2.8, 2.9, 2.7])], 'f1');
    expect(r.male.hasData).toBe(true);
    expect(r.male.avg).toBeCloseTo(2.8, 2);
    expect(r.male.count).toBe(3);
    expect(r.female.hasData).toBe(false);
  });
  it('نر و ماده → delta درست', () => {
    const r = weightBySexFromLogs([
      mkLog('f1', 'male', [3.0]),
      mkLog('f1', 'female', [2.4]),
    ], 'f1');
    expect(r.male.avg).toBeCloseTo(3.0, 2);
    expect(r.female.avg).toBeCloseTo(2.4, 2);
    expect(r.delta).toBeCloseTo(0.6, 2);
  });
  it('CV محاسبه می‌شود', () => {
    const r = weightBySexFromLogs([mkLog('f1', 'male', [2, 4])], 'f1');
    expect(r.male.cv).toBeCloseTo(33.3, 1);
  });
  it('mixed جدا ذخیره می‌شود (delta نمی‌گیرد)', () => {
    const r = weightBySexFromLogs([mkLog('f1', 'mixed', [2.5])], 'f1');
    expect(r.mixed.hasData).toBe(true);
    expect(r.delta).toBeNull();
  });
  it('flockId متفاوت → ignore', () => {
    const r = weightBySexFromLogs([mkLog('f2', 'male', [2.8])], 'f1');
    expect(r.hasData).toBe(false);
  });
  it('چند log نر → جمع', () => {
    const r = weightBySexFromLogs([
      mkLog('f1', 'male', [2.8]),
      mkLog('f1', 'male', [3.0]),
    ], 'f1');
    expect(r.male.count).toBe(2);
    expect(r.male.avg).toBeCloseTo(2.9, 2);
  });
  it('وزن صفر → فیلتر', () => {
    const r = weightBySexFromLogs([mkLog('f1', 'male', [0, 2.8])], 'f1');
    expect(r.male.count).toBe(1);
  });
  it('weightGender خالی → mixed', () => {
    const r = weightBySexFromLogs([mkLog('f1', '', [2.5])], 'f1');
    expect(r.mixed.hasData).toBe(true);
  });
});

// ═════════════════════════════════════════════════════════════
// فاز ۸c — consumptionToCSV
// ═════════════════════════════════════════════════════════════
import { consumptionToCSV } from '../mod/flk/helpers-audit';

describe('consumptionToCSV', () => {
  it('خالی → header فقط', () => {
    const csv = consumptionToCSV([]);
    expect(csv.split('\n').length).toBe(1);
    expect(csv).toContain('تاریخ');
    expect(csv).toContain('مقدار');
  });
  it('feed + water → ۲ ردیف', () => {
    const csv = consumptionToCSV([
      { id: '1', flockId: 'f1', type: 'feed', date: '1405/08/01', amount: 25, unit: 'kg', sex: 'male', source: 'bulk_manual', confidence: 'exact', createdAt: '', updatedAt: '' } as any,
      { id: '2', flockId: 'f1', type: 'water', date: '1405/08/02', amount: 50, unit: 'L', sex: '', source: 'daily_manual', confidence: 'exact', createdAt: '', updatedAt: '' } as any,
    ]);
    const lines = csv.split('\n');
    expect(lines.length).toBe(3);
    expect(lines[1]).toContain('دان');
    expect(lines[1]).toContain('25');
    expect(lines[1]).toContain('نر');
    expect(lines[2]).toContain('آب');
    expect(lines[2]).toContain('50');
  });
  it('source label فارسی', () => {
    const csv = consumptionToCSV([
      { id: '1', flockId: 'f1', type: 'feed', date: '1405/08/01', amount: 25, unit: 'kg', sex: '', source: 'sensor_scale', confidence: 'exact', createdAt: '', updatedAt: '' } as any,
    ]);
    expect(csv).toContain('سنسور وزن');
  });
});

// ═════════════════════════════════════════════════════════════
// فاز ۸d — calculateFCR
// ═════════════════════════════════════════════════════════════
import { calculateFCR } from '../mod/flk/helpers-audit';

const agg = (feedKg: number) => ({
  totalFeedKg: feedKg, totalWaterL: 0,
  byType: { feed: feedKg, water: 0 },
  bySource: {}, bySex: { male: 0, female: 0, mixed: 0, unknown: 0 },
  confidence: 'exact' as const, eventCount: 1, hasData: feedKg > 0,
});

const wEmpty = { male: { avg: 0, count: 0, cv: 0, hasData: false }, female: { avg: 0, count: 0, cv: 0, hasData: false }, mixed: { avg: 0, count: 0, cv: 0, hasData: false }, delta: null, hasData: false };

describe('calculateFCR — insufficient', () => {
  it('بدون دان → fcr=null، confidence=insufficient', () => {
    const r = calculateFCR(agg(0), wEmpty, { currentCount: 100 }, 2.5);
    expect(r.fcr).toBeNull();
    expect(r.confidence).toBe('insufficient');
  });
});

describe('calculateFCR — exact', () => {
  it('دان ۵۰۰ + وزن کامل (male+female) → FCR=۲.۵', () => {
    const w = { ...wEmpty,
      male: { avg: 2.0, count: 10, cv: 5, hasData: true },
      female: { avg: 1.5, count: 100, cv: 5, hasData: true },
      hasData: true,
    };
    // live weight = 2.0*10 + 1.5*100 = 20 + 150 = 170
    // FCR = 500 / 170 = 2.94
    const r = calculateFCR(agg(500), w, { currentCount: 110, maleCount: 10, femaleCount: 100, unknownCount: 0 });
    expect(r.confidence).toBe('exact');
    expect(r.fcr).toBeCloseTo(2.94, 1);
    expect(r.totalLiveWeightKg).toBe(170);
  });
  it('unsplit (فقط mixed) → exact', () => {
    const w = { ...wEmpty, mixed: { avg: 1.8, count: 50, cv: 5, hasData: true }, hasData: true };
    const r = calculateFCR(agg(360), w, { currentCount: 100, maleCount: 0, femaleCount: 0, unknownCount: 100 });
    expect(r.confidence).toBe('exact');
    expect(r.fcr).toBeCloseTo(2, 1);  // 360 / 180
  });
});

describe('calculateFCR — standard fallback', () => {
  it('بدون وزن، با standard → FCR از استاندارد', () => {
    const r = calculateFCR(agg(500), wEmpty, { currentCount: 100 }, 2.3);
    expect(r.confidence).toBe('standard');
    expect(r.fcr).toBe(2.3);
    expect(r.totalLiveWeightKg).toBeNull();
  });
  it('بدون وزن، بدون standard → fcr=null', () => {
    const r = calculateFCR(agg(500), wEmpty, { currentCount: 100 }, null);
    expect(r.fcr).toBeNull();
    expect(r.confidence).toBe('insufficient');
  });
  it('وزن ناقص (male هست، female نیست ولی گله female دارد) → fallback استاندارد', () => {
    const w = { ...wEmpty, male: { avg: 2, count: 10, cv: 5, hasData: true }, hasData: true };
    const r = calculateFCR(agg(500), w, { currentCount: 110, maleCount: 10, femaleCount: 100, unknownCount: 0 }, 2.5);
    expect(r.confidence).toBe('standard');
  });
});
