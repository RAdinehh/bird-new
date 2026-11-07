import { describe, it, expect } from 'vitest';
import { calculateEnvironmentWarnings } from '../shr/calc/formulas/environment';

describe('calculateEnvironmentWarnings — temp', () => {
  it('null temp → accent', () => {
    const r = calculateEnvironmentWarnings({
      tempC: null, tempMin: null, tempMax: null, tempTarget: null,
      humidityPct: null, humidityMin: null, humidityMax: null,
    });
    expect(r.tempTone).toBe('accent');
  });

  it('temp در محدوده، نزدیک target → accent', () => {
    const r = calculateEnvironmentWarnings({
      tempC: 22, tempMin: 20, tempMax: 24, tempTarget: 22,
      humidityPct: null, humidityMin: null, humidityMax: null,
    });
    expect(r.tempTone).toBe('accent');
  });

  it('temp در محدوده، دور از target → warn', () => {
    const r = calculateEnvironmentWarnings({
      tempC: 24, tempMin: 20, tempMax: 25, tempTarget: 22,
      humidityPct: null, humidityMin: null, humidityMax: null,
    });
    // range=5, tolerance=max(1, 0.75)=1, |24-22|=2 > 1 → warn
    expect(r.tempTone).toBe('warn');
  });

  it('temp خارج محدوده → danger', () => {
    const r = calculateEnvironmentWarnings({
      tempC: 30, tempMin: 20, tempMax: 25, tempTarget: 22,
      humidityPct: null, humidityMin: null, humidityMax: null,
    });
    expect(r.tempTone).toBe('danger');
  });

  it('temp بدون min/max (fallback) — ۱۴ → danger', () => {
    const r = calculateEnvironmentWarnings({
      tempC: 14, tempMin: null, tempMax: null, tempTarget: null,
      humidityPct: null, humidityMin: null, humidityMax: null,
    });
    expect(r.tempTone).toBe('danger');
  });

  it('temp بدون min/max — ۲۰ → accent', () => {
    const r = calculateEnvironmentWarnings({
      tempC: 20, tempMin: null, tempMax: null, tempTarget: null,
      humidityPct: null, humidityMin: null, humidityMax: null,
    });
    expect(r.tempTone).toBe('accent');
  });
});

describe('calculateEnvironmentWarnings — humidity', () => {
  it('humidity null → accent', () => {
    const r = calculateEnvironmentWarnings({
      tempC: null, tempMin: null, tempMax: null, tempTarget: null,
      humidityPct: null, humidityMin: null, humidityMax: null,
    });
    expect(r.humidityTone).toBe('accent');
  });

  it('humidity در محدوده → accent', () => {
    const r = calculateEnvironmentWarnings({
      tempC: null, tempMin: null, tempMax: null, tempTarget: null,
      humidityPct: 60, humidityMin: 50, humidityMax: 70,
    });
    expect(r.humidityTone).toBe('accent');
  });

  it('humidity خارج محدوده ولی در tolerance → warn', () => {
    const r = calculateEnvironmentWarnings({
      tempC: null, tempMin: null, tempMax: null, tempTarget: null,
      humidityPct: 75, humidityMin: 50, humidityMax: 70,
    });
    // range=20, tolerance=max(5, 6)=6, h=75 > 70 و < 70+6=76 → warn
    expect(r.humidityTone).toBe('warn');
  });

  it('humidity خارج tolerance → danger', () => {
    const r = calculateEnvironmentWarnings({
      tempC: null, tempMin: null, tempMax: null, tempTarget: null,
      humidityPct: 85, humidityMin: 50, humidityMax: 70,
    });
    // 85 > 76 → danger
    expect(r.humidityTone).toBe('danger');
  });
});

describe('calculateEnvironmentWarnings — combined', () => {
  it('هر دو مشکل', () => {
    const r = calculateEnvironmentWarnings({
      tempC: 35, tempMin: 20, tempMax: 25, tempTarget: 22,
      humidityPct: 90, humidityMin: 50, humidityMax: 70,
    });
    expect(r.tempTone).toBe('danger');
    expect(r.humidityTone).toBe('danger');
  });
});
