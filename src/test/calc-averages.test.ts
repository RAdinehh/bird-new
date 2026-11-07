import { describe, it, expect } from 'vitest';
import { calculateAverages } from '../shr/calc/economics/averages';
import type { InputLog, InputMovement, InputItem } from '../shr/calc/types';

const mkLog = (o: Partial<InputLog> = {}): InputLog => ({
  date: '1404/08/17',
  feedConsumedKg: 100,
  waterAmountL: 200,
  ...o,
});

const mkMove = (o: Partial<InputMovement> = {}): InputMovement => ({
  itemId: 'x',
  quantity: 10,
  unitPrice: 1000,
  reason: 'consumption',
  date: '1404/08/17',
  flockId: 'A',
  ...o,
});

const mkItem = (o: Partial<InputItem> = {}): InputItem => ({
  id: 'x',
  name: 'item',
  category: 'vaccine',
  lastPrice: 1000,
  ...o,
});

describe('calculateAverages — logs', () => {
  it('میانگین دان/آب روزانه از ۳ روز', () => {
    const logs: InputLog[] = [
      mkLog({ date: '1404/08/15', feedConsumedKg: 100, waterAmountL: 200 }),
      mkLog({ date: '1404/08/16', feedConsumedKg: 110, waterAmountL: 210 }),
      mkLog({ date: '1404/08/17', feedConsumedKg: 90, waterAmountL: 190 }),
    ];
    const r = calculateAverages({
      logs,
      movements: [],
      items: [],
      aliveCount: 1000,
    });
    expect(r.avgFeedPerDayKg).toBe(100);
    expect(r.avgWaterPerDayL).toBe(200);
    expect(r.daysCount).toBe(3);
  });

  it('دو لاگ در یک روز = یک روز حساب می‌شود', () => {
    const logs: InputLog[] = [
      mkLog({ date: '1404/08/17', feedConsumedKg: 50 }),
      mkLog({ date: '1404/08/17', feedConsumedKg: 40 }),
    ];
    const r = calculateAverages({ logs, movements: [], items: [], aliveCount: 1000 });
    expect(r.daysCount).toBe(1);
    expect(r.avgFeedPerDayKg).toBe(90);
  });

  it('logs خالی → daysCount=0، avg=0', () => {
    const r = calculateAverages({ logs: [], movements: [], items: [], aliveCount: 1000 });
    expect(r.daysCount).toBe(0);
    expect(r.avgFeedPerDayKg).toBe(0);
    expect(r.hasData).toBe(false);
  });

  it('فلتر fromDate/toDate', () => {
    const logs: InputLog[] = [
      mkLog({ date: '1404/08/10', feedConsumedKg: 100 }),
      mkLog({ date: '1404/08/15', feedConsumedKg: 200 }),
      mkLog({ date: '1404/08/20', feedConsumedKg: 300 }),
    ];
    const r = calculateAverages({
      logs,
      movements: [],
      items: [],
      aliveCount: 1000,
      fromDate: '1404/08/14',
      toDate: '1404/08/18',
    });
    expect(r.daysCount).toBe(1);
    expect(r.avgFeedPerDayKg).toBe(200);
  });
});

describe('calculateAverages — movements (vaccine/medication/litter)', () => {
  it('واکسن + دارو + بستر مجموع درست', () => {
    const items: InputItem[] = [
      mkItem({ id: 'v1', category: 'vaccine' }),
      mkItem({ id: 'm1', category: 'medicine' }),
      mkItem({ id: 'h1', category: 'herbal' }),
      mkItem({ id: 'c1', category: 'consumable' }),
    ];
    const movements: InputMovement[] = [
      mkMove({ itemId: 'v1', quantity: 500 }),
      mkMove({ itemId: 'v1', quantity: 500 }),
      mkMove({ itemId: 'm1', quantity: 200 }),
      mkMove({ itemId: 'h1', quantity: 100 }),
      mkMove({ itemId: 'c1', quantity: 50 }),
    ];
    const r = calculateAverages({
      logs: [],
      movements,
      items,
      flockId: 'A',
      aliveCount: 1000,
    });
    expect(r.totalVaccines).toBe(1000);
    expect(r.totalMedications).toBe(200);
    expect(r.totalHerbal).toBe(100);
    expect(r.totalLitterKg).toBe(50);
    expect(r.avgVaccinesPerBird).toBe(1);
    expect(r.avgMedicationsPerBird).toBe(0.2);
    expect(r.avgHerbalPerBird).toBe(0.1);
    expect(r.avgLitterPerBirdKg).toBe(0.05);
  });

  it('movement با reason=purchase نادیده', () => {
    const items = [mkItem({ id: 'v1', category: 'vaccine' })];
    const movements = [
      mkMove({ itemId: 'v1', quantity: 500, reason: 'consumption' }),
      mkMove({ itemId: 'v1', quantity: 500, reason: 'purchase' }),
    ];
    const r = calculateAverages({ logs: [], movements, items, flockId: 'A', aliveCount: 1000 });
    expect(r.totalVaccines).toBe(500);
  });

  it('flockId نادرست → صفر', () => {
    const items = [mkItem({ id: 'v1', category: 'vaccine' })];
    const movements = [mkMove({ itemId: 'v1', flockId: 'B', quantity: 500 })];
    const r = calculateAverages({ logs: [], movements, items, flockId: 'A', aliveCount: 1000 });
    expect(r.totalVaccines).toBe(0);
  });

  it('آیتم ناموجود نادیده', () => {
    const movements = [mkMove({ itemId: 'unknown', quantity: 500 })];
    const r = calculateAverages({ logs: [], movements, items: [], aliveCount: 1000 });
    expect(r.totalVaccines).toBe(0);
    expect(r.totalMedications).toBe(0);
  });
});

describe('calculateAverages — combined', () => {
  it('logs + movements با هم', () => {
    const logs: InputLog[] = [mkLog({ date: '1404/08/17', feedConsumedKg: 100 })];
    const items: InputItem[] = [mkItem({ id: 'v1', category: 'vaccine' })];
    const movements: InputMovement[] = [mkMove({ itemId: 'v1', quantity: 500 })];
    const r = calculateAverages({ logs, movements, items, flockId: 'A', aliveCount: 1000 });
    expect(r.avgFeedPerDayKg).toBe(100);
    expect(r.totalVaccines).toBe(500);
    expect(r.hasData).toBe(true);
  });

  it('aliveCount = 0 → per-bird = 0', () => {
    const items = [mkItem({ id: 'v1', category: 'vaccine' })];
    const movements = [mkMove({ itemId: 'v1', quantity: 500 })];
    const r = calculateAverages({ logs: [], movements, items, flockId: 'A', aliveCount: 0 });
    expect(r.totalVaccines).toBe(500);
    expect(r.avgVaccinesPerBird).toBe(500);  // divisor=1 fallback
  });
});
