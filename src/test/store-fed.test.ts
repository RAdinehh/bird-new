import { describe, it, expect } from 'vitest';
import {
  formulaTotal, calcNutrients, formulaValid,
  CATEGORY_LABEL, CATEGORY_ICON, STAGE_LABEL, STAGE_LABEL_LONG,
} from '../mod/fed/store';

const makeIng = (o: any = {}) => ({
  id: 'i1', name: 'ذرت',
  protein: 8, energy: 3300, fat: 4, fiber: 2,
  calcium: 0.02, phosphorus: 0.3, methionine: 0.15, lysine: 0.25,
  price: 15000,
  maxPercent: 0, minPercent: 0,
  category: 'energy',
  ...o,
});

const makeLine = (id: string, percent: number) => ({
  id: 'l' + id,
  ingredientId: id,
  percent,
});

// ═══════════════════════════════════════════════
// formulaTotal
// ═══════════════════════════════════════════════
describe('formulaTotal', () => {
  it('خالی → 0', () => {
    expect(formulaTotal([])).toBe(0);
  });

  it('یک خط', () => {
    expect(formulaTotal([makeLine('i1', 50)] as any)).toBe(50);
  });

  it('چند خط → جمع', () => {
    expect(formulaTotal([
      makeLine('i1', 30),
      makeLine('i2', 20),
      makeLine('i3', 50),
    ] as any)).toBe(100);
  });

  it('percent undefined → 0', () => {
    expect(formulaTotal([{ id: 'a', ingredientId: 'i1' } as any])).toBe(0);
  });
});

// ═══════════════════════════════════════════════
// calcNutrients — محاسبه ریاضی
// ═══════════════════════════════════════════════
describe('calcNutrients', () => {
  it('خالی → همه 0', () => {
    const n = calcNutrients([], []);
    expect(n.protein).toBe(0);
    expect(n.energy).toBe(0);
    expect(n.price).toBe(0);
  });

  it('یک ماده 100٪ → مقادیر ماده', () => {
    const ing = makeIng({ protein: 20, energy: 3000, fat: 5, fiber: 3, price: 10000 });
    const n = calcNutrients([makeLine('i1', 100)] as any, [ing] as any);
    expect(n.protein).toBe(20);
    expect(n.energy).toBe(3000);
    expect(n.fat).toBe(5);
    expect(n.fiber).toBe(3);
    expect(n.price).toBe(10000);
  });

  it('یک ماده 50٪ → مقادیر نصف', () => {
    const ing = makeIng({ protein: 20, energy: 3000, fat: 5, price: 10000 });
    const n = calcNutrients([makeLine('i1', 50)] as any, [ing] as any);
    expect(n.protein).toBe(10);
    expect(n.energy).toBe(1500);
    expect(n.fat).toBe(2.5);
    expect(n.price).toBe(5000);
  });

  it('دو ماده: 50٪ پروتئین 20 + 50٪ پروتئین 10 = 15', () => {
    const ing1 = makeIng({ id: 'i1', protein: 20 });
    const ing2 = makeIng({ id: 'i2', protein: 10 });
    const n = calcNutrients([
      makeLine('i1', 50),
      makeLine('i2', 50),
    ] as any, [ing1, ing2] as any);
    expect(n.protein).toBe(15);
  });

  it('ماده ناموجود → نادیده گرفته میشه', () => {
    const ing1 = makeIng({ id: 'i1', protein: 20 });
    const n = calcNutrients([
      makeLine('i1', 50),
      makeLine('unknown', 50),
    ] as any, [ing1] as any);
    expect(n.protein).toBe(10); // فقط i1
  });

  it('price گرد شده به عدد صحیح', () => {
    const ing = makeIng({ price: 12345 });
    const n = calcNutrients([makeLine('i1', 33.33)] as any, [ing] as any);
    expect(Number.isInteger(n.price)).toBe(true);
  });

  it('دقت اعشاری: 3 رقم برای methionine', () => {
    const ing = makeIng({ methionine: 0.5 });
    const n = calcNutrients([makeLine('i1', 33.33)] as any, [ing] as any);
    // 0.5 * 0.3333 = 0.16665 → گرد به 0.167
    const str = n.methionine.toString();
    const decimals = str.includes('.') ? str.split('.')[1].length : 0;
    expect(decimals).toBeLessThanOrEqual(3);
  });

  it('مجموع کل 100٪ → نسبتها درست', () => {
    // مثل NRC: ذرت 60%، کنجاله 30%، سبوس 10%
    const corn = makeIng({ id: 'corn', protein: 8.5, energy: 3350, price: 12000 });
    const soy = makeIng({ id: 'soy', protein: 44, energy: 2230, price: 35000 });
    const bran = makeIng({ id: 'bran', protein: 15, energy: 2000, price: 8000 });

    const n = calcNutrients([
      makeLine('corn', 60),
      makeLine('soy', 30),
      makeLine('bran', 10),
    ] as any, [corn, soy, bran] as any);

    // protein = 8.5*0.6 + 44*0.3 + 15*0.1 = 5.1 + 13.2 + 1.5 = 19.8
    expect(n.protein).toBe(19.8);
    // energy = 3350*0.6 + 2230*0.3 + 2000*0.1 = 2010 + 669 + 200 = 2879
    expect(n.energy).toBe(2879);
    // price = 12000*0.6 + 35000*0.3 + 8000*0.1 = 7200 + 10500 + 800 = 18500
    expect(n.price).toBe(18500);
  });
});

// ═══════════════════════════════════════════════
// formulaValid
// ═══════════════════════════════════════════════
describe('formulaValid', () => {
  it('خالی → invalid', () => {
    const r = formulaValid([], []);
    expect(r.valid).toBe(false);
    expect(r.errors).toHaveLength(1);
  });

  it('مجموع 100٪ → valid', () => {
    const r = formulaValid([
      makeLine('i1', 50),
      makeLine('i2', 50),
    ] as any, [makeIng({ id: 'i1' }), makeIng({ id: 'i2' })] as any);
    expect(r.valid).toBe(true);
    expect(r.errors).toHaveLength(0);
  });

  it('مجموع 99.5٪ → valid (تلورانس 0.5)', () => {
    const r = formulaValid([
      makeLine('i1', 99.5),
    ] as any, [makeIng({ id: 'i1' })] as any);
    expect(r.valid).toBe(true);
  });

  it('مجموع 100.5٪ → valid (تلورانس 0.5)', () => {
    const r = formulaValid([
      makeLine('i1', 100.5),
    ] as any, [makeIng({ id: 'i1' })] as any);
    expect(r.valid).toBe(true);
  });

  it('مجموع 90٪ → invalid', () => {
    const r = formulaValid([
      makeLine('i1', 90),
    ] as any, [makeIng({ id: 'i1' })] as any);
    expect(r.valid).toBe(false);
    expect(r.errors.some(e => e.includes('۱۰۰') || e.includes('100'))).toBe(true);
  });

  it('مجموع 110٪ → invalid', () => {
    const r = formulaValid([
      makeLine('i1', 110),
    ] as any, [makeIng({ id: 'i1' })] as any);
    expect(r.valid).toBe(false);
  });

  it('ماده از maxPercent بیشتر → invalid', () => {
    const ing = makeIng({ id: 'i1', maxPercent: 20 });
    const r = formulaValid([
      makeLine('i1', 30),
    ] as any, [ing] as any);
    expect(r.valid).toBe(false);
    expect(r.errors.some(e => e.includes('حداکثر'))).toBe(true);
  });

  it('ماده از minPercent کمتر → invalid', () => {
    const ing = makeIng({ id: 'i1', minPercent: 10 });
    const r = formulaValid([
      makeLine('i1', 5),
    ] as any, [ing] as any);
    expect(r.valid).toBe(false);
    expect(r.errors.some(e => e.includes('حداقل'))).toBe(true);
  });

  it('ماده ناشناخته → هیچ خطایی برای اون', () => {
    const ing = makeIng({ id: 'i1' });
    const r = formulaValid([
      makeLine('i1', 50),
      makeLine('unknown', 50),
    ] as any, [ing] as any);
    // 100٪ هست، فقط i1 در ingredients → valid
    expect(r.valid).toBe(true);
  });

  it('چند خطا همزمان', () => {
    const ing1 = makeIng({ id: 'i1', maxPercent: 20, name: 'ذرت' });
    const ing2 = makeIng({ id: 'i2', minPercent: 40, name: 'کنجاله' });
    const r = formulaValid([
      makeLine('i1', 30),  // بیش از max
      makeLine('i2', 20),  // کمتر از min
    ] as any, [ing1, ing2] as any);
    expect(r.valid).toBe(false);
    expect(r.errors.length).toBeGreaterThanOrEqual(2);
  });
});

// ═══════════════════════════════════════════════
// constants
// ═══════════════════════════════════════════════
describe('constants', () => {
  it('CATEGORY_LABEL', () => {
    expect(CATEGORY_LABEL.energy).toBeTruthy();
    expect(CATEGORY_LABEL.protein).toBeTruthy();
    expect(CATEGORY_LABEL.mineral).toBeTruthy();
    expect(CATEGORY_LABEL.vitamin).toBeTruthy();
  });
  it('CATEGORY_ICON', () => {
    expect(CATEGORY_ICON.energy).toBeTruthy();
  });
  it('STAGE_LABEL', () => {
    expect(Object.keys(STAGE_LABEL).length).toBeGreaterThan(0);
  });
});
