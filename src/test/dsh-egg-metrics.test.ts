/**
 * dsh — brokenRate7 fix
 *
 * باگ قبلی: total = totalCount + brokenCount = (eating + fertile + broken + other) + broken
 *          → broken دوبار شمرده می‌شد
 * بعد از fix: total = totalCount = eating + fertile + broken + other
 */
import { describe, it, expect } from 'vitest';
import { aggregateEggMetrics } from '../shr/calc/formulas/egg';

describe('aggregateEggMetrics — 7 روزه', () => {
  it('۷ روز، هر روز ۱۰۰ سالم + ۳۰ شکسته + ۲۰ کثیف → rate درست', () => {
    const result = aggregateEggMetrics(
      7,
      7 * 100,  // ۷۰۰ سالم
      7 * 30,   // ۲۱۰ شکسته
      7 * 20,   // ۱۴۰ کثیف
      900,      // alive today
      1000,     // initial
      90,       // standard hen-day
      85,       // standard hen-housed
    );

    // totalToday روزانه = 100 + 30 + 20 = 150
    // brokenRate روزانه = 30 / 150 = 20%
    expect(result.brokenRatePct).toBe(20);
    // dirtyRate روزانه = 20 / 150 = 13.3%
    expect(result.dirtyRatePct).toBeCloseTo(13.3, 1);
  });

  it('fix بدل: brokenCount نباید دوبار شمرده شود', () => {
    // یک روز: 100 سالم + 30 شکسته + 20 کثیف
    const result = aggregateEggMetrics(1, 100, 30, 20, 900, 1000, null, null);
    // totalToday = 150, brokenRate = 30/150 = 20%
    // اگر double-count بود: totalToday = 180, brokenRate = 30/180 = 16.7%
    expect(result.brokenRatePct).toBe(20);
  });

  it('zero eggs → zero rates', () => {
    const result = aggregateEggMetrics(7, 0, 0, 0, 900, 1000, null, null);
    expect(result.brokenRatePct).toBe(0);
    expect(result.dirtyRatePct).toBe(0);
    expect(result.henDayPct).toBe(0);
  });

  it('henDay: ۷ روز ۷۰۰ سالم، alive=900، days=7 → 700 / (900*7) = 11.1%', () => {
    // Bug در aggregateEggMetrics: از calculateEggMetrics استفاده می‌کند که
    // eggsToday / aliveToday است، نه تقسیم بر days
    // این تست فقط درستی wrapper را چک می‌کند
    const result = aggregateEggMetrics(7, 700, 0, 0, 900, 1000, null, null);
    // 700/7 = 100 روزانه، 100/900 = 11.1%
    expect(result.henDayPct).toBeCloseTo(11.1, 1);
  });
});
