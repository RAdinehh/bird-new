/**
 * calc-fcr.test.ts — تست محاسبه FCR
 *
 * استاندارد: Aviagen Ross 308
 *   FCR = کل دان ÷ کل افزایش وزن
 *   کل افزایش وزن = (وزن نهایی − وزن اولیه) × تعداد زنده
 */
import { describe, it, expect } from 'vitest';
import { calculateFCR } from '../shr/calc/formulas/fcr';

describe('calculateFCR — حالت عادی (exact)', () => {
  it('محاسبه پایه: ۴۰۰۰ کیلو دان، ۱۰۰۰ پرنده ۳ کیلو', () => {
    const result = calculateFCR({
      feedConsumedKg: 4000,
      initialWeightKg: 0.042,
      finalWeightKg: 3.0,
      aliveCount: 1000,
      standardFCR: 1.35,
    });
    // totalGain = (3.0 - 0.042) × 1000 = 2958
    // fcr = 4000 / 2958 = 1.352...
    expect(result.fcr).toBe(1.35);
    expect(result.confidence).toBe('exact');
    expect(result.totalGainKg).toBe(2958);
    expect(result.totalFeedKg).toBe(4000);
  });

  it('FCR بهتر از استاندارد (diff منفی کوچک) → accent', () => {
    const result = calculateFCR({
      feedConsumedKg: 3800,
      initialWeightKg: 0.042,
      finalWeightKg: 3.0,
      aliveCount: 1000,
      standardFCR: 1.35,
    });
    // fcr = 3800 / 2958 = 1.284...
    // diff = (1.284 - 1.35) / 1.35 = -4.9٪
    expect(result.tone).toBe('accent');
    expect(result.diffPct).toBeLessThan(0);
  });

  it('FCR برابر استاندارد → accent', () => {
    const result = calculateFCR({
      feedConsumedKg: 3993.3,
      initialWeightKg: 0.042,
      finalWeightKg: 3.0,
      aliveCount: 1000,
      standardFCR: 1.35,
    });
    // fcr ≈ 1.35
    expect(result.tone).toBe('accent');
  });

  it('FCR ۵-۱۰٪ بدتر → warn', () => {
    const result = calculateFCR({
      feedConsumedKg: 4300,
      initialWeightKg: 0.042,
      finalWeightKg: 3.0,
      aliveCount: 1000,
      standardFCR: 1.35,
    });
    // fcr = 4300 / 2958 = 1.454...  diff = 7.7٪
    expect(result.tone).toBe('warn');
    expect(result.diffPct).toBeGreaterThan(5);
    expect(result.diffPct).toBeLessThan(10);
  });

  it('FCR بیش از ۱۰٪ بدتر → danger', () => {
    const result = calculateFCR({
      feedConsumedKg: 5000,
      initialWeightKg: 0.042,
      finalWeightKg: 3.0,
      aliveCount: 1000,
      standardFCR: 1.35,
    });
    // fcr = 5000 / 2958 = 1.69  diff = 25٪
    expect(result.tone).toBe('danger');
    expect(result.diffPct).toBeGreaterThan(10);
  });
});

describe('calculateFCR — حالت غیرعادی (بسیار پایین)', () => {
  it('FCR بیش از ۲۰٪ بهتر → danger (غیرممکن بیولوژیک)', () => {
    const result = calculateFCR({
      feedConsumedKg: 1000,
      initialWeightKg: 0.042,
      finalWeightKg: 3.0,
      aliveCount: 1000,
      standardFCR: 1.35,
    });
    // fcr = 1000 / 2958 = 0.338  diff = -75٪
    expect(result.tone).toBe('danger');
    expect(result.diffPct).toBeLessThan(-20);
  });

  it('FCR ۱۰-۲۰٪ بهتر → warn (غیرعادی)', () => {
    const result = calculateFCR({
      feedConsumedKg: 3200,
      initialWeightKg: 0.042,
      finalWeightKg: 3.0,
      aliveCount: 1000,
      standardFCR: 1.35,
    });
    // fcr = 3200 / 2958 = 1.082  diff = -19.9٪
    expect(result.tone).toBe('warn');
    expect(result.diffPct).toBeGreaterThan(-20);
    expect(result.diffPct).toBeLessThan(-10);
  });
});

describe('calculateFCR — حالت insufficient', () => {
  it('دان مصرفی صفر → insufficient', () => {
    const result = calculateFCR({
      feedConsumedKg: 0,
      initialWeightKg: 0.042,
      finalWeightKg: 3.0,
      aliveCount: 1000,
      standardFCR: 1.35,
    });
    expect(result.fcr).toBeNull();
    expect(result.confidence).toBe('insufficient');
    expect(result.reason).toContain('دان');
  });

  it('وزن نهایی صفر → insufficient', () => {
    const result = calculateFCR({
      feedConsumedKg: 4000,
      initialWeightKg: 0.042,
      finalWeightKg: 0,
      aliveCount: 1000,
      standardFCR: 1.35,
    });
    expect(result.fcr).toBeNull();
    expect(result.confidence).toBe('insufficient');
    expect(result.reason).toContain('وزن');
  });

  it('تعداد زنده صفر → insufficient', () => {
    const result = calculateFCR({
      feedConsumedKg: 4000,
      initialWeightKg: 0.042,
      finalWeightKg: 3.0,
      aliveCount: 0,
      standardFCR: 1.35,
    });
    expect(result.fcr).toBeNull();
    expect(result.confidence).toBe('insufficient');
  });

  it('وزن نهایی کمتر از اولیه → insufficient (افزایش وزن منفی)', () => {
    const result = calculateFCR({
      feedConsumedKg: 4000,
      initialWeightKg: 3.0,
      finalWeightKg: 0.042,
      aliveCount: 1000,
      standardFCR: 1.35,
    });
    expect(result.fcr).toBeNull();
    expect(result.confidence).toBe('insufficient');
    expect(result.reason).toContain('منفی');
  });
});

describe('calculateFCR — بدون استاندارد', () => {
  it('standardFCR = null → tone = info', () => {
    const result = calculateFCR({
      feedConsumedKg: 4000,
      initialWeightKg: 0.042,
      finalWeightKg: 3.0,
      aliveCount: 1000,
      standardFCR: null,
    });
    expect(result.fcr).toBe(1.35);
    expect(result.tone).toBe('info');
    expect(result.diffPct).toBeNull();
  });
});
