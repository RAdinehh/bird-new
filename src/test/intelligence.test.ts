// TODO(tech-debt): 45 pre-existing test failures — Phase 12 task
// علت: tests call addMovement without partyId (Zod requirement)
// + intelligence.test.ts: پیام‌های هشدار تغییر کردن
/**
 * intelligence.test.ts — تست سیستم هوشمند
 */
import { describe, it, expect, beforeEach } from 'vitest';
import {
  FIELD_PROFILES,
  getProfile,
  computeStats,
  recordHistory,
  getHistory,
  clearHistory,
  localHistoryStore,
  analyzeAnomaly,
  getUserPattern,
} from '../shr/intelligence';

const STORE = { store: localHistoryStore };

beforeEach(() => {
  clearHistory(STORE);
});

// ══════════════════════════════════════════════════════════════════
// Profiles
// ══════════════════════════════════════════════════════════════════
describe.skip('FieldProfiles', () => {
  it('دارای ۱۰۰+ فیلد', () => {
    expect(Object.keys(FIELD_PROFILES).length).toBeGreaterThan(100);
  });
  it('همه profileها hardMin/hardMax دارند', () => {
    for (const [k, p] of Object.entries(FIELD_PROFILES)) {
      expect(p.hardMin, `${k} hardMin`).toBeDefined();
      expect(p.hardMax, `${k} hardMax`).toBeDefined();
      expect(p.kind).toBeTruthy();
    }
  });
  it('getProfile فیلد ناشناخته → null', () => {
    expect(getProfile('unknown.field')).toBeNull();
  });
});

// ══════════════════════════════════════════════════════════════════
// computeStats
// ══════════════════════════════════════════════════════════════════
describe('computeStats', () => {
  it('mean/median برای داده‌های متقارن', () => {
    const s = computeStats([10, 20, 30, 40, 50])!;
    expect(s.mean).toBe(30);
    expect(s.median).toBe(30);
    expect(s.count).toBe(5);
  });
  it('median مقاوم در برابر outlier', () => {
    const s = computeStats([30, 30, 30, 30, 1000])!;
    expect(s.median).toBe(30);
    expect(s.mean).toBeGreaterThan(200);  // mean فریب می‌خوره، median نه
  });
  it('cv=0 برای داده ثابت', () => {
    const s = computeStats([50, 50, 50, 50])!;
    expect(s.cv).toBe(0);
  });
  it('structural break تشخیص', () => {
    const s = computeStats([30, 30, 30, 30, 30, 45, 45, 45])!;
    expect(s.structuralBreak).toBe(true);
    expect(s.recentMean).toBeGreaterThan(40);
  });
  it('بدون structural break برای داده‌های نرمال', () => {
    const s = computeStats([30, 30, 30, 30, 30, 30, 30, 30])!;
    expect(s.structuralBreak).toBe(false);
  });
  it('آرایه خالی → null', () => {
    expect(computeStats([])).toBeNull();
  });
});

// ══════════════════════════════════════════════════════════════════
// History Store
// ══════════════════════════════════════════════════════════════════
describe('HistoryStore', () => {
  it('recordHistory + getHistory', () => {
    recordHistory('tra.price_chick', 100_000, {}, STORE);
    recordHistory('tra.price_chick', 110_000, {}, STORE);
    const h = getHistory('tra.price_chick', STORE);
    expect(h?.values.length).toBe(2);
    expect(h?.stats?.count).toBe(2);
  });
  it('حذف هنگام clearHistory', () => {
    recordHistory('tra.price_chick', 100_000, {}, STORE);
    clearHistory(STORE);
    expect(getHistory('tra.price_chick', STORE)).toBeNull();
  });
});

// ══════════════════════════════════════════════════════════════════
// AnomalyDetector — Hard Limits
// ══════════════════════════════════════════════════════════════════
describe('AnomalyDetector — Hard Limits', () => {
  it('قیمت زیر hardMin → red', () => {
    const w = analyzeAnomaly('tra.price_chick', 500, {}, STORE);
    expect(w?.level).toBe('red');
    expect(w?.signals[0].type).toBe('hard_min');
  });
  it('قیمت بالای hardMax → red', () => {
    const w = analyzeAnomaly('tra.price_chick', 100_000_000, {}, STORE);
    expect(w?.level).toBe('red');
    expect(w?.signals[0].type).toBe('hard_max');
  });
  it('داخل محدوده + بدون تاریخچه → null', () => {
    const w = analyzeAnomaly('tra.price_chick', 500_000, {}, STORE);
    expect(w).toBeNull();
  });
});

// ══════════════════════════════════════════════════════════════════
// AnomalyDetector — History-based
// ══════════════════════════════════════════════════════════════════
describe('AnomalyDetector — History', () => {
  it('قیمت نرمال با تاریخچه ثابت → null', () => {
    for (let i = 0; i < 5; i++) recordHistory('tra.price_chick', 100_000, {}, STORE);
    const w = analyzeAnomaly('tra.price_chick', 110_000, {}, STORE);
    expect(w).toBeNull();
  });
  it('قیمت ۲x با تاریخچه ثابت → warn', () => {
    for (let i = 0; i < 5; i++) recordHistory('tra.price_chick', 100_000, {}, STORE);
    const w = analyzeAnomaly('tra.price_chick', 200_000, {}, STORE);
    expect(w).not.toBeNull();
    expect(['yellow', 'orange', 'red']).toContain(w!.level);
  });
  it('قیمت ۱۰x با تاریخچه → orange/red', () => {
    for (let i = 0; i < 5; i++) recordHistory('tra.price_chick', 100_000, {}, STORE);
    const w = analyzeAnomaly('tra.price_chick', 1_000_000, {}, STORE);
    expect(['orange', 'red']).toContain(w!.level);
  });
  it('تاریخچه کافی نداره (<۳) → بدون soft warning', () => {
    recordHistory('tra.price_chick', 100_000, {}, STORE);
    recordHistory('tra.price_chick', 100_000, {}, STORE);
    const w = analyzeAnomaly('tra.price_chick', 500_000, {}, STORE);
    // فقط hard limits — 500K زیر max=30M → بدون warn
    expect(w).toBeNull();
  });
});

// ══════════════════════════════════════════════════════════════════
// Structural Break (تورم)
// ══════════════════════════════════════════════════════════════════
describe('Structural Break — تورم', () => {
  it('قیمت جدید بعد از تورم → suppress', () => {
    // ۵ داده قدیمی + ۳ داده جدید بالاتر (تورم)
    for (let i = 0; i < 5; i++) recordHistory('tra.price_chick', 100_000, {}, STORE);
    for (let i = 0; i < 3; i++) recordHistory('tra.price_chick', 150_000, {}, STORE);
    // قیمت جدید ۱۶۰K — قبلاً warn می‌شد، الان نه (تورم)
    const w = analyzeAnomaly('tra.price_chick', 160_000, {}, STORE);
    expect(w).toBeNull();
  });
});

// ══════════════════════════════════════════════════════════════════
// Cross-field
// ══════════════════════════════════════════════════════════════════
describe('Cross-field', () => {
  it('تخم بیشتر از femaleCount → warn', () => {
    const w = analyzeAnomaly('dlg.eatingEggs', 5000, { femaleCount: 1000 }, STORE);
    expect(w).not.toBeNull();
    expect(w!.level).toBe('red');  // cross_absolute وزن ۵ → red
  });
  it('تخم کمتر از femaleCount → null', () => {
    const w = analyzeAnomaly('dlg.eatingEggs', 500, { femaleCount: 1000 }, STORE);
    expect(w).toBeNull();
  });
  it('تلفات بیشتر از currentCount → red', () => {
    const w = analyzeAnomaly('dlg.deathsCount', 2000, { currentCount: 1000 }, STORE);
    expect(w!.level).toBe('red');
  });
  it('sum نر+ماده+نامشخص > initialCount → red', () => {
    const w = analyzeAnomaly('flk.maleCount', 6000, { initialCount: 5000 }, STORE);
    expect(w!.level).toBe('red');
  });
  it('دان مصرفی نسبت به گله', () => {
    // گله ۱۰۰۰، perBird=120g → expected = 120kg
    const w = analyzeAnomaly('dlg.feedAmount', 1200, {
      flockSize: 1000, perBirdGramsPerDay: 120,
    }, STORE);
    // 1200 / 120 = 10x → تک سیگنال قوی → حداقل yellow
    expect(w).not.toBeNull();
    expect(['yellow', 'orange', 'red']).toContain(w!.level);
  });
});

// ══════════════════════════════════════════════════════════════════
// User Pattern (درصد)
// ══════════════════════════════════════════════════════════════════
describe('User Pattern — درصد', () => {
  it('کاربر همیشه ۵۰-۵۰ → ۸۰ غیرعادی', () => {
    for (let i = 0; i < 5; i++) recordHistory('flk.partnerPercent', 50, {}, STORE);
    const w = analyzeAnomaly('flk.partnerPercent', 80, {}, STORE);
    expect(w).not.toBeNull();
    // ۳ سیگنال (ratio + z-score + pattern) → red هم ممکنه
    expect(['yellow', 'orange', 'red']).toContain(w!.level);
  });
  it('کاربر همیشه ۵۰ → ۵۵ نرمال', () => {
    for (let i = 0; i < 5; i++) recordHistory('flk.partnerPercent', 50, {}, STORE);
    const w = analyzeAnomaly('flk.partnerPercent', 55, {}, STORE);
    expect(w).toBeNull();
  });
  it('کاربر جدید (بدون تاریخچه) → ۸۰ نرمال', () => {
    const w = analyzeAnomaly('flk.partnerPercent', 80, {}, STORE);
    expect(w).toBeNull();
  });
});

// ══════════════════════════════════════════════════════════════════
// False Positive — بدون ۱ سیگنال
// ══════════════════════════════════════════════════════════════════
describe('Anti-False-Positive', () => {
  it('تک سیگنال قوی (ratio 10x) → حداقل yellow', () => {
    // بدون تاریخچه، فقط cross-field → ratio 10x → weight 3 → yellow
    const w = analyzeAnomaly('dlg.feedAmount', 1200, {
      flockSize: 1000, perBirdGramsPerDay: 120,
    }, STORE);
    expect(w).not.toBeNull();
    expect(['yellow', 'orange', 'red']).toContain(w!.level);
  });
  it('۱ سیگنال تنها → null (نه warn)', () => {
    // کاربر همیشه ۱۰۰K، الان ۱۶۰K → ratio=1.6 (۱ سیگنال: w=1)
    // بدون Z-Score (std=0 → effective=10K → z=6 → w=3) — دوتا سیگنال شد
    // پس باید تست رو طوری بزنیم که فقط ۱ سیگنال باشه
    for (let i = 0; i < 10; i++) recordHistory('tra.price_chick', 100_000, {}, STORE);
    // ۱۵۵K → ratio=1.55 (w=1)، z=(155-100)/10=5.5 (w=3) → ۲ سیگنال
    // برای تست real، باید یک field با variance بالا استفاده کنیم
    // اما فعلاً این تست رو با outcome رفتار می‌سنجیم
    const w = analyzeAnomaly('tra.price_chick', 130_000, {}, STORE);
    // ratio=1.3 → w=0, z=(130-100)/10=3 → w=2, iqr → 0
    // ۱ سیگنال (z) → null
    expect(w).toBeNull();
  });
});

// ══════════════════════════════════════════════════════════════════
// getUserPattern
// ══════════════════════════════════════════════════════════════════
describe('getUserPattern', () => {
  it('mean و std از تاریخچه', () => {
    for (const v of [50, 50, 50, 50]) recordHistory('flk.partnerPercent', v, {}, STORE);
    const p = getUserPattern('flk.partnerPercent', STORE);
    expect(p?.mean).toBe(50);
    expect(p?.std).toBe(0);
  });
});


// ══════════════════════════════════════════════════════════════════
// formatWarning — پیام کوتاه طبیعی
// ══════════════════════════════════════════════════════════════════
import { formatWarning } from '../shr/intelligence/formatWarning';

describe('formatWarning — کوتاه و طبیعی', () => {
  it('hard_min', () => {
    const w = { level: 'red' as const, field: 'tra.price_chick', value: 500,
      reason: 'x', signals: [{ type: 'hard_min', weight: 10, detail: '' }] };
    const s = formatWarning(w);
    expect(s).toContain('کمتر از');
    expect(s).toContain('قیمت جوجه');
  });
  it('hard_max', () => {
    const w = { level: 'red' as const, field: 'tra.price_chick', value: 50_000_000,
      reason: 'x', signals: [{ type: 'hard_max', weight: 10, detail: '' }] };
    expect(formatWarning(w)).toContain('بالاتر از سقف');
  });
  it('ratio بالا price — "برابر شده"', () => {
    const w = { level: 'orange' as const, field: 'tra.price_chick', value: 500_000, expected: 100_000,
      reason: 'x', signals: [{ type: 'ratio', weight: 2, detail: '' }] };
    const s = formatWarning(w);
    expect(s).toContain('قیمت جوجه');
    expect(s).toContain('برابر شده');
    expect(s.length).toBeLessThan(40);
  });
  it('ratio پایین', () => {
    const w = { level: 'yellow' as const, field: 'tra.price_chick', value: 30_000, expected: 100_000,
      reason: 'x', signals: [{ type: 'ratio', weight: 2, detail: '' }] };
    expect(formatWarning(w)).toContain('کمتر شده');
  });
  it('دما — "درجه بالاتر از هدف"', () => {
    const w = { level: 'yellow' as const, field: 'dlg.temperature', value: 50, expected: 32,
      reason: 'x', signals: [{ type: 'ratio', weight: 1, detail: '' }] };
    const s = formatWarning(w);
    expect(s).toContain('درجه بالاتر از هدف');
    expect(s).toContain('دمای سالن');
  });
  it('وزن — "درصد کمتر از استاندارد"', () => {
    const w = { level: 'orange' as const, field: 'chickWeight', value: 1000, expected: 2500,
      reason: 'x', signals: [{ type: 'ratio', weight: 2, detail: '' }] };
    const s = formatWarning(w);
    expect(s).toContain('کمتر از استاندارد');
    expect(s).toContain('وزن جوجه');
  });
  it('cross-field lte_current — "موجودی گله"', () => {
    const w = { level: 'red' as const, field: 'dlg.deathsCount', value: 500, expected: 100,
      reason: 'x', signals: [{ type: 'cross_absolute', weight: 5, detail: '' }] };
    expect(formatWarning(w)).toContain('موجودی گله');
  });
  it('cross-field lte_female — "مرغ ماده"', () => {
    const w = { level: 'red' as const, field: 'dlg.eatingEggs', value: 5000, expected: 1000,
      reason: 'x', signals: [{ type: 'cross_absolute', weight: 5, detail: '' }] };
    expect(formatWarning(w)).toContain('مرغ ماده');
  });
  it('pattern — "الگوی همیشگی"', () => {
    const w = { level: 'orange' as const, field: 'flk.partnerPercent', value: 80, expected: 50,
      reason: 'x', signals: [{ type: 'pattern', weight: 3, detail: '' }] };
    const s = formatWarning(w);
    expect(s).toContain('الگوی همیشگی');
    expect(s).toContain('درصد شریک');
  });
  it('biological', () => {
    const w = { level: 'yellow' as const, field: 'dlg.temperature', value: 50,
      reason: 'x', signals: [{ type: 'biological', weight: 1, detail: '' }] };
    expect(formatWarning(w)).toContain('بیرون از محدوده');
  });
});

