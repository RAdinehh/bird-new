/**
 * intelligence-integration.test.ts — تست end-to-end سیستم Intelligence
 */
import { describe, it, expect, beforeEach } from 'vitest';
import {
  recordHistory, analyzeAnomaly, clearHistory, localHistoryStore,
  formatWarning, getHistory,
} from '../shr/intelligence';

const STORE = { store: localHistoryStore };

beforeEach(() => {
  clearHistory(STORE);
});

describe('Integration — end-to-end', () => {
  it('دمای سالن: ۵ بار ۳۳°C → ۴۲°C هشدار', () => {
    // 42°C = biological (>35) + zscore (>2) → 2 signals → yellow
    // 39°C با تاریخچه ثابت 33°C فقط 18٪ اختلاف دارد → زیر آستانه (درست)
    for (let i = 0; i < 5; i++) {
      recordHistory('dlg.temperature', 33, {}, STORE);
    }
    const w = analyzeAnomaly('dlg.temperature', 42, {}, STORE);
    expect(w).not.toBeNull();
    expect(w!.level).toMatch(/yellow|orange|red/);
    expect(w!.signals.length).toBeGreaterThanOrEqual(2);
  });

  it('قیمت جوجه: ۱۰ برابر → هشدار + متن فارسی', () => {
    for (let i = 0; i < 5; i++) {
      recordHistory('tra.price_chick', 500_000, {}, STORE);
    }
    const w = analyzeAnomaly('tra.price_chick', 5_000_000, {}, STORE);
    expect(w).not.toBeNull();
    expect(w!.level).toMatch(/orange|red/);
    const msg = formatWarning(w!);
    expect(msg).toContain('قیمت جوجه');
    expect(msg).toMatch(/برابر|بیشتر|کمتر|غیرعادی/);
    expect(msg).toMatch(/[ا-ی]/);
  });

  it('feedAmount: cascade fallback از cross_field به history', () => {
    // بدون perBirdGramsPerDay → cross_field null → fallback history
    for (let i = 0; i < 5; i++) {
      recordHistory('dlg.feedAmount', 120, { flockSize: 1000 }, STORE);
    }
    const w = analyzeAnomaly('dlg.feedAmount', 720, { flockSize: 1000 }, STORE);
    expect(w).not.toBeNull();
    expect(w!.level).toMatch(/orange|red/);
  });

  it('TTL: تاریخچه ۲۰۱ روز پیش منقضی می‌شه', () => {
    localHistoryStore.set('dlg.temperature', {
      values: [{ v: 33, ctx: {}, date: '2024-01-01', confirmed: false, outlier: false }],
      stats: null,
      lastUpdate: '2024-01-01',
    });
    const h = getHistory('dlg.temperature', { ...STORE, today: '2024-07-20' });
    expect(h).toBeNull();
  });

  it('TTL: تاریخچه ۱۲۰ روز پیش نگه‌داری می‌شه', () => {
    localHistoryStore.set('dlg.temperature', {
      values: [{ v: 33, ctx: {}, date: '2024-01-01', confirmed: false, outlier: false }],
      stats: null,
      lastUpdate: '2024-01-01',
    });
    const h = getHistory('dlg.temperature', { ...STORE, today: '2024-05-01' });
    expect(h).not.toBeNull();
    expect(h!.values.length).toBe(1);
  });

  it('formatWarning — همه انواع بدون متن فنی انگلیسی', () => {
    const cases = [
      { path: 'tra.price_chick', value: 500 },
      { path: 'dlg.deathsCount', value: 999, ctx: { currentCount: 100 } },
      { path: 'dlg.temperature', value: 45 },
    ];
    for (const c of cases) {
      const w = analyzeAnomaly(c.path, c.value, c.ctx ?? {}, STORE);
      if (w) {
        const m = formatWarning(w);
        expect(m).not.toMatch(/^[a-z_]+$/i);
        expect(m).toMatch(/[ا-ی]/);
      }
    }
  });
});
