/**
 * calc-economics.test.ts — تست هزینه‌های اقتصادی (feed, vaccine, medication, litter)
 */
import { describe, it, expect } from 'vitest';
import { calculateFeedCost } from '../shr/calc/economics/feedCost';
import { calculateVaccineCost } from '../shr/calc/economics/vaccineCost';
import { calculateMedicationCost } from '../shr/calc/economics/medicationCost';
import { calculateLitterCost } from '../shr/calc/economics/litterCost';
import type { InputMovement, InputItem } from '../shr/calc/types';

const mkMove = (
  overrides: Partial<InputMovement> = {},
): InputMovement => ({
  itemId: 'x',
  quantity: 10,
  unitPrice: 1000,
  reason: 'consumption',
  date: '1404/08/17',
  flockId: 'A',
  ...overrides,
});

const mkItem = (overrides: Partial<InputItem> = {}): InputItem => ({
  id: 'x',
  name: 'item',
  category: 'feed',
  lastPrice: 1000,
  ...overrides,
});

describe('calculateFeedCost', () => {
  it('حرکت‌های دان مصرفی جمع می‌شوند', () => {
    const items = [mkItem({ id: 'f1', category: 'feed' })];
    const movements = [
      mkMove({ itemId: 'f1', quantity: 50, unitPrice: 10000 }),
      mkMove({ itemId: 'f1', quantity: 30, unitPrice: 10000 }),
    ];
    const r = calculateFeedCost({
      movements,
      items,
      flockId: 'A',
      aliveCount: 1000,
    });
    expect(r.totalCost).toBe(800000);
    expect(r.costPerBird).toBe(800);
    expect(r.count).toBe(2);
    expect(r.hasData).toBe(true);
  });

  it('آیتم‌های غیر دان نادیده گرفته می‌شوند', () => {
    const items = [
      mkItem({ id: 'f1', category: 'feed' }),
      mkItem({ id: 'v1', category: 'vaccine' }),
    ];
    const movements = [
      mkMove({ itemId: 'f1', quantity: 50, unitPrice: 10000 }),
      mkMove({ itemId: 'v1', quantity: 10, unitPrice: 5000 }),
    ];
    const r = calculateFeedCost({
      movements,
      items,
      flockId: 'A',
      aliveCount: 1000,
    });
    expect(r.totalCost).toBe(500000);
    expect(r.count).toBe(1);
  });

  it('حرکت‌های غیر consumption (مثل purchase) نادیده گرفته می‌شوند', () => {
    const items = [mkItem({ id: 'f1', category: 'feed' })];
    const movements = [
      mkMove({ itemId: 'f1', reason: 'consumption' }),
      mkMove({ itemId: 'f1', reason: 'purchase' }),
    ];
    const r = calculateFeedCost({
      movements,
      items,
      flockId: 'A',
      aliveCount: 1000,
    });
    expect(r.count).toBe(1);
  });

  it('فلتر flockId اعمال می‌شود', () => {
    const items = [mkItem({ id: 'f1', category: 'feed' })];
    const movements = [
      mkMove({ itemId: 'f1', flockId: 'A', quantity: 50 }),
      mkMove({ itemId: 'f1', flockId: 'B', quantity: 30 }),
    ];
    const r = calculateFeedCost({
      movements,
      items,
      flockId: 'A',
      aliveCount: 1000,
    });
    expect(r.totalCost).toBe(50000);
    expect(r.count).toBe(1);
  });

  it('خالی → hasData=false', () => {
    const r = calculateFeedCost({
      movements: [],
      items: [],
      aliveCount: 1000,
    });
    expect(r.totalCost).toBe(0);
    expect(r.hasData).toBe(false);
  });
});

describe('calculateVaccineCost', () => {
  it('فقط category=vaccine', () => {
    const items = [
      mkItem({ id: 'f1', category: 'feed' }),
      mkItem({ id: 'v1', category: 'vaccine' }),
    ];
    const movements = [
      mkMove({ itemId: 'f1' }),
      mkMove({ itemId: 'v1', quantity: 100, unitPrice: 2000 }),
    ];
    const r = calculateVaccineCost({
      movements,
      items,
      flockId: 'A',
      aliveCount: 1000,
    });
    expect(r.totalCost).toBe(200000);
    expect(r.count).toBe(1);
  });
});

describe('calculateMedicationCost', () => {
  it('شیمیایی و گیاهی جدا', () => {
    const items = [
      mkItem({ id: 'm1', category: 'medicine' }),
      mkItem({ id: 'h1', category: 'herbal' }),
    ];
    const movements = [
      mkMove({ itemId: 'm1', quantity: 20, unitPrice: 5000 }),
      mkMove({ itemId: 'h1', quantity: 10, unitPrice: 3000 }),
    ];
    const r = calculateMedicationCost({
      movements,
      items,
      flockId: 'A',
      aliveCount: 1000,
    });
    expect(r.chemical.totalCost).toBe(100000);
    expect(r.herbal.totalCost).toBe(30000);
    expect(r.total.totalCost).toBe(130000);
    expect(r.total.count).toBe(2);
  });

  it('فقط شیمیایی', () => {
    const items = [mkItem({ id: 'm1', category: 'medicine' })];
    const movements = [mkMove({ itemId: 'm1', quantity: 20, unitPrice: 5000 })];
    const r = calculateMedicationCost({
      movements,
      items,
      flockId: 'A',
      aliveCount: 1000,
    });
    expect(r.chemical.totalCost).toBe(100000);
    expect(r.herbal.totalCost).toBe(0);
    expect(r.herbal.hasData).toBe(false);
    expect(r.total.hasData).toBe(true);
  });
});

describe('calculateLitterCost', () => {
  it('category=consumable', () => {
    const items = [mkItem({ id: 'c1', category: 'consumable' })];
    const movements = [mkMove({ itemId: 'c1', quantity: 100, unitPrice: 500 })];
    const r = calculateLitterCost({
      movements,
      items,
      flockId: 'A',
      aliveCount: 1000,
    });
    expect(r.totalCost).toBe(50000);
    expect(r.costPerBird).toBe(50);
  });
});
