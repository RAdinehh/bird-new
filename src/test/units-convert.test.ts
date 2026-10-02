/**
 * تست تبدیل‌های واحد
 * قاعده: رفت و برگشت باید همیشه همون عدد اولیه بده
 */
import { describe, it, expect } from 'vitest';
import {
  weightToG, gToWeight,
  volumeToMl, mlToVolume,
  lengthToCm, cmToLength,
  areaToM2, m2ToArea,
  timeToS, sToTime,
  cToF, fToC, tempToC, cToTemp,
  currencyToToman, tomanToCurrency,
} from '../shr/units/convert';

const EPS = 1e-9;

describe('وزن (پایه: گرم)', () => {
  it('تبدیل به گرم', () => {
    expect(weightToG(1, 'g')).toBe(1);
    expect(weightToG(1, 'kg')).toBe(1000);
    expect(weightToG(1, 'mg')).toBe(0.001);
    expect(weightToG(1, 'ton')).toBe(1_000_000);
  });

  it('رفت و برگشت', () => {
    expect(Math.abs(gToWeight(weightToG(2.5, 'kg'), 'kg') - 2.5)).toBeLessThan(EPS);
    expect(Math.abs(gToWeight(weightToG(500, 'mg'), 'mg') - 500)).toBeLessThan(EPS);
  });
});

describe('حجم (پایه: میلی‌لیتر)', () => {
  it('سی‌سی = میلی‌لیتر دقیق', () => {
    expect(volumeToMl(1, 'cc')).toBe(volumeToMl(1, 'ml'));
    expect(volumeToMl(5, 'cc')).toBe(5);
    expect(volumeToMl(5, 'ml')).toBe(5);
  });

  it('لیتر → ml', () => {
    expect(volumeToMl(1, 'L')).toBe(1000);
    expect(volumeToMl(2.5, 'L')).toBe(2500);
  });

  it('رفت و برگشت', () => {
    expect(Math.abs(mlToVolume(volumeToMl(0.2, 'cc'), 'cc') - 0.2)).toBeLessThan(EPS);
  });
});

describe('طول (پایه: سانتی‌متر)', () => {
  it('تبدیل‌ها', () => {
    expect(lengthToCm(1, 'cm')).toBe(1);
    expect(lengthToCm(10, 'mm')).toBe(1);
    expect(lengthToCm(1, 'm')).toBe(100);
    expect(lengthToCm(1, 'km')).toBe(100_000);
  });

  it('رفت و برگشت', () => {
    expect(Math.abs(cmToLength(lengthToCm(2.5, 'm'), 'm') - 2.5)).toBeLessThan(EPS);
  });
});

describe('مساحت (پایه: مترمربع)', () => {
  it('هکتار', () => {
    expect(areaToM2(1, 'ha')).toBe(10_000);
    expect(areaToM2(0.5, 'ha')).toBe(5_000);
  });

  it('رفت و برگشت', () => {
    expect(Math.abs(m2ToArea(areaToM2(1, 'ha'), 'ha') - 1)).toBeLessThan(EPS);
  });
});

describe('زمان (پایه: ثانیه)', () => {
  it('تبدیل‌ها', () => {
    expect(timeToS(60, 'min')).toBe(3600);
    expect(timeToS(1, 'h')).toBe(3600);
    expect(timeToS(1, 'day')).toBe(86400);
  });

  it('رفت و برگشت', () => {
    expect(Math.abs(sToTime(timeToS(2.5, 'h'), 'h') - 2.5)).toBeLessThan(EPS);
  });
});

describe('دما', () => {
  it('نقاط شناخته‌شده', () => {
    expect(cToF(0)).toBe(32);       // آب یخ می‌زنه
    expect(cToF(100)).toBe(212);    // آب می‌جوشه
    expect(cToF(37)).toBeCloseTo(98.6, 1);  // بدن انسان
  });

  it('تبدیل معکوس', () => {
    expect(fToC(32)).toBe(0);
    expect(fToC(212)).toBe(100);
  });

  it('رفت و برگشت', () => {
    expect(Math.abs(fToC(cToF(32.5)) - 32.5)).toBeLessThan(EPS);
    expect(Math.abs(tempToC(cToTemp(25, 'f'), 'f') - 25)).toBeLessThan(EPS);
  });

  it('سلسیوس دست‌نخورده', () => {
    expect(tempToC(25, 'c')).toBe(25);
    expect(cToTemp(25, 'c')).toBe(25);
  });
});

describe('پول (پایه: تومان)', () => {
  it('تومان → ریال (×10)', () => {
    expect(tomanToCurrency(1000, 'rial', 200000)).toBe(10000);
  });

  it('ریال → تومان (÷10)', () => {
    expect(currencyToToman(10000, 'rial', 200000)).toBe(1000);
  });

  it('دلار با نرخ 200k', () => {
    expect(currencyToToman(25, 'usd', 200000)).toBe(5_000_000);
    expect(tomanToCurrency(5_000_000, 'usd', 200000)).toBe(25);
  });

  it('رفت و برگشت دلار', () => {
    const t = currencyToToman(25, 'usd', 200000);
    expect(Math.abs(tomanToCurrency(t, 'usd', 200000) - 25)).toBeLessThan(EPS);
  });
});
