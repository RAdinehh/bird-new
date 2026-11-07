/**
 * calc-egg.test.ts — تست شاخص‌های تخم (Hy-Line W-36)
 */
import { describe, it, expect } from 'vitest';
import { calculateEggMetrics } from '../shr/calc/formulas/egg';

describe('calculateEggMetrics — hen-day و hen-housed', () => {
  it('پایه: ۸۰۰ تخم از ۹۰۰ مرغ زنده (از ۱۰۰۰ اولیه)', () => {
    const r = calculateEggMetrics({
      eggsToday: 800,
      eggsBroken: 0,
      eggsDirty: 0,
      eggsCumulative: 50000,
      aliveToday: 900,
      initialCount: 1000,
      standardHenDayPct: 90,
      standardHenHousedPct: 85,
    });
    // hen-day = 800/900 = 88.9٪
    // hen-housed = 800/1000 = 80٪
    expect(r.henDayPct).toBe(88.9);
    expect(r.henHousedPct).toBe(80);
  });

  it('hen-day بالای استاندارد → accent', () => {
    const r = calculateEggMetrics({
      eggsToday: 950,
      eggsBroken: 0,
      eggsDirty: 0,
      eggsCumulative: 0,
      aliveToday: 1000,
      initialCount: 1000,
      standardHenDayPct: 90,
      standardHenHousedPct: 85,
    });
    // hen-day = 95٪ ; standard 90 ; ratio 1.056 → accent
    expect(r.henDayTone).toBe('accent');
  });

  it('hen-day ۹۰-۱۰۰٪ استاندارد → warn', () => {
    const r = calculateEggMetrics({
      eggsToday: 850,
      eggsBroken: 0,
      eggsDirty: 0,
      eggsCumulative: 0,
      aliveToday: 1000,
      initialCount: 1000,
      standardHenDayPct: 90,
      standardHenHousedPct: 85,
    });
    // hen-day = 85٪ ; standard 90 ; ratio 0.944 → warn
    expect(r.henDayTone).toBe('warn');
  });

  it('hen-day < ۹۰٪ استاندارد → danger', () => {
    const r = calculateEggMetrics({
      eggsToday: 700,
      eggsBroken: 0,
      eggsDirty: 0,
      eggsCumulative: 0,
      aliveToday: 1000,
      initialCount: 1000,
      standardHenDayPct: 90,
      standardHenHousedPct: 85,
    });
    // hen-day = 70٪ ; standard 90 ; ratio 0.778 → danger
    expect(r.henDayTone).toBe('danger');
  });

  it('hen-day diff محاسبه صحیح', () => {
    const r = calculateEggMetrics({
      eggsToday: 950,
      eggsBroken: 0,
      eggsDirty: 0,
      eggsCumulative: 0,
      aliveToday: 1000,
      initialCount: 1000,
      standardHenDayPct: 90,
      standardHenHousedPct: 85,
    });
    // hen-day = 95 ; diff = (95-90)/90 * 100 = 5.6٪
    expect(r.henDayDiffPct).toBe(5.6);
  });
});

describe('calculateEggMetrics — broken و dirty', () => {
  it('broken < ۲٪ → accent', () => {
    const r = calculateEggMetrics({
      eggsToday: 980,
      eggsBroken: 15,
      eggsDirty: 5,
      eggsCumulative: 0,
      aliveToday: 1000,
      initialCount: 1000,
      standardHenDayPct: 90,
      standardHenHousedPct: 85,
    });
    // total = 1000 ; broken = 15/1000 = 1.5٪
    expect(r.brokenRatePct).toBe(1.5);
    expect(r.brokenTone).toBe('accent');
  });

  it('broken ۲-۴٪ → warn', () => {
    const r = calculateEggMetrics({
      eggsToday: 960,
      eggsBroken: 30,
      eggsDirty: 10,
      eggsCumulative: 0,
      aliveToday: 1000,
      initialCount: 1000,
      standardHenDayPct: 90,
      standardHenHousedPct: 85,
    });
    // total = 1000 ; broken = 3٪
    expect(r.brokenRatePct).toBe(3);
    expect(r.brokenTone).toBe('warn');
  });

  it('broken > ۴٪ → danger', () => {
    const r = calculateEggMetrics({
      eggsToday: 940,
      eggsBroken: 50,
      eggsDirty: 10,
      eggsCumulative: 0,
      aliveToday: 1000,
      initialCount: 1000,
      standardHenDayPct: 90,
      standardHenHousedPct: 85,
    });
    // total = 1000 ; broken = 5٪
    expect(r.brokenRatePct).toBe(5);
    expect(r.brokenTone).toBe('danger');
  });

  it('dirty > ۵٪ → danger', () => {
    const r = calculateEggMetrics({
      eggsToday: 930,
      eggsBroken: 10,
      eggsDirty: 60,
      eggsCumulative: 0,
      aliveToday: 1000,
      initialCount: 1000,
      standardHenDayPct: 90,
      standardHenHousedPct: 85,
    });
    // total = 1000 ; dirty = 6٪
    expect(r.dirtyRatePct).toBe(6);
    expect(r.dirtyTone).toBe('danger');
  });
});

describe('calculateEggMetrics — حالت‌های edge', () => {
  it('aliveToday = 0 → همه نرخ‌ها ۰', () => {
    const r = calculateEggMetrics({
      eggsToday: 0,
      eggsBroken: 0,
      eggsDirty: 0,
      eggsCumulative: 0,
      aliveToday: 0,
      initialCount: 0,
      standardHenDayPct: 90,
      standardHenHousedPct: 85,
    });
    expect(r.henDayPct).toBe(0);
    expect(r.henHousedPct).toBe(0);
    expect(r.brokenRatePct).toBe(0);
    expect(r.dirtyRatePct).toBe(0);
  });

  it('بدون استاندارد → tone info', () => {
    const r = calculateEggMetrics({
      eggsToday: 800,
      eggsBroken: 20,
      eggsDirty: 10,
      eggsCumulative: 0,
      aliveToday: 1000,
      initialCount: 1000,
      standardHenDayPct: null,
      standardHenHousedPct: null,
    });
    expect(r.henDayTone).toBe('info');
    expect(r.henHousedTone).toBe('info');
    expect(r.henDayDiffPct).toBeNull();
  });
});
