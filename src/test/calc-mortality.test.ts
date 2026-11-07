/**
 * calc-mortality.test.ts — تست نرخ تلفات
 *
 * استاندارد: Aviagen Ross 308
 */
import { describe, it, expect } from 'vitest';
import { calculateMortality } from '../shr/calc/formulas/mortality';

describe('calculateMortality — محاسبه پایه', () => {
  it('تلفات روزانه عادی (۵ از ۱۰۰۰)', () => {
    const r = calculateMortality({
      deathsToday: 5,
      deathsThisWeek: 10,
      deathsCumulative: 50,
      aliveToday: 995,
      initialCount: 1000,
      standardDailyPct: 0.15,
      standardWeeklyPct: 1.0,
      standardTotalPct: 5,
    });
    // beforeToday = 995 + 5 = 1000
    // daily = 5/1000 * 100 = 0.5٪
    // weekly = 10/1000 * 100 = 1.0٪
    // cum = 50/1000 * 100 = 5٪
    expect(r.dailyPct).toBe(0.5);
    expect(r.weeklyPct).toBe(1.0);
    expect(r.cumulativePct).toBe(5);
  });

  it('مخرج درست: aliveToday + deathsToday', () => {
    const r = calculateMortality({
      deathsToday: 10,
      deathsThisWeek: 20,
      deathsCumulative: 30,
      aliveToday: 990,
      initialCount: 1000,
      standardDailyPct: null,
      standardWeeklyPct: null,
      standardTotalPct: null,
    });
    // beforeToday = 990 + 10 = 1000
    // اگر به‌غلط فقط aliveToday (990) استفاده شود → 1.01٪
    // اگر درست (1000) → 1.0٪
    expect(r.dailyPct).toBe(1.0);
  });
});

describe('calculateMortality — tone', () => {
  it('تلفات زیر ۸۰٪ استاندارد → accent', () => {
    const r = calculateMortality({
      deathsToday: 1,
      deathsThisWeek: 3,
      deathsCumulative: 10,
      aliveToday: 999,
      initialCount: 1000,
      standardDailyPct: 0.15,
      standardWeeklyPct: 1.0,
      standardTotalPct: 5,
    });
    // daily = 1/1000 * 100 = 0.1٪ ; standard = 0.15٪ ; ratio = 0.67 → accent
    expect(r.dailyTone).toBe('accent');
  });

  it('تلفات برابر استاندارد → accent', () => {
    const r = calculateMortality({
      deathsToday: 1.5,
      deathsThisWeek: 5,
      deathsCumulative: 30,
      aliveToday: 998.5,
      initialCount: 1000,
      standardDailyPct: 0.15,
      standardWeeklyPct: 0.5,
      standardTotalPct: 3,
    });
    // daily = 1.5/1000 = 0.15٪ ; ratio = 1.0 → accent
    expect(r.dailyTone).toBe('accent');
  });

  it('تلفات ۱-۱.۵ برابر استاندارد → warn', () => {
    const r = calculateMortality({
      deathsToday: 2,
      deathsThisWeek: 8,
      deathsCumulative: 40,
      aliveToday: 998,
      initialCount: 1000,
      standardDailyPct: 0.15,
      standardWeeklyPct: 1.0,
      standardTotalPct: 5,
    });
    // daily = 2/1000 = 0.2٪ ; standard 0.15 ; ratio 1.33 → warn
    expect(r.dailyTone).toBe('warn');
  });

  it('تلفات بیش از ۱.۵ برابر استاندارد → danger', () => {
    const r = calculateMortality({
      deathsToday: 5,
      deathsThisWeek: 20,
      deathsCumulative: 80,
      aliveToday: 995,
      initialCount: 1000,
      standardDailyPct: 0.15,
      standardWeeklyPct: 1.0,
      standardTotalPct: 5,
    });
    // daily = 5/1000 = 0.5٪ ; standard 0.15 ; ratio 3.33 → danger
    expect(r.dailyTone).toBe('danger');
  });
});

describe('calculateMortality — diffPct', () => {
  it('diff محاسبه صحیح', () => {
    const r = calculateMortality({
      deathsToday: 3,
      deathsThisWeek: 10,
      deathsCumulative: 50,
      aliveToday: 997,
      initialCount: 1000,
      standardDailyPct: 0.15,
      standardWeeklyPct: 1.0,
      standardTotalPct: 5,
    });
    // daily = 3/1000 = 0.3٪ ; standard 0.15
    // diff = (0.3 - 0.15) / 0.15 * 100 = 100٪
    expect(r.dailyDiffPct).toBe(100);
  });

  it('diff منفی وقتی بهتر از استاندارد', () => {
    const r = calculateMortality({
      deathsToday: 0.5,
      deathsThisWeek: 3,
      deathsCumulative: 10,
      aliveToday: 999.5,
      initialCount: 1000,
      standardDailyPct: 0.15,
      standardWeeklyPct: 1.0,
      standardTotalPct: 5,
    });
    // daily = 0.5/1000 = 0.05٪ ; standard 0.15
    // diff = (0.05 - 0.15) / 0.15 * 100 = -66.7٪
    expect(r.dailyDiffPct).toBeLessThan(0);
  });
});

describe('calculateMortality — حالت‌های edge', () => {
  it('initialCount = 0 → cumulativePct = 0', () => {
    const r = calculateMortality({
      deathsToday: 0,
      deathsThisWeek: 0,
      deathsCumulative: 0,
      aliveToday: 0,
      initialCount: 0,
      standardDailyPct: 0.15,
      standardWeeklyPct: 1.0,
      standardTotalPct: 5,
    });
    expect(r.cumulativePct).toBe(0);
    expect(r.dailyPct).toBe(0);
  });

  it('بدون استاندارد → tone = info', () => {
    const r = calculateMortality({
      deathsToday: 5,
      deathsThisWeek: 10,
      deathsCumulative: 50,
      aliveToday: 995,
      initialCount: 1000,
      standardDailyPct: null,
      standardWeeklyPct: null,
      standardTotalPct: null,
    });
    expect(r.dailyTone).toBe('info');
    expect(r.weeklyTone).toBe('info');
    expect(r.cumulativeTone).toBe('info');
    expect(r.dailyDiffPct).toBeNull();
  });

  it('صفر تلفات → همه نرخ‌ها ۰، tone accent', () => {
    const r = calculateMortality({
      deathsToday: 0,
      deathsThisWeek: 0,
      deathsCumulative: 0,
      aliveToday: 1000,
      initialCount: 1000,
      standardDailyPct: 0.15,
      standardWeeklyPct: 1.0,
      standardTotalPct: 5,
    });
    expect(r.dailyPct).toBe(0);
    expect(r.weeklyPct).toBe(0);
    expect(r.cumulativePct).toBe(0);
    expect(r.dailyTone).toBe('accent');
    expect(r.cumulativeTone).toBe('accent');
  });
});
