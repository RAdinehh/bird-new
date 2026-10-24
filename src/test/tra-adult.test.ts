import { describe, it, expect } from 'vitest';
import { calcItemTotal } from '../mod/tra/calc';

describe('ADULT: liveWeight × perKg', () => {
  it('10 پرنده، 25 kg، 100,000/کیلو → 2,500,000', () => {
    const factor = 25 / 10;
    const total = calcItemTotal(10, 100000, undefined, undefined, factor);
    expect(total).toBe(2_500_000);
  });

  it('5 پرنده، 12.5 kg، 80,000/کیلو → 1,000,000', () => {
    const factor = 12.5 / 5;
    const total = calcItemTotal(5, 80000, undefined, undefined, factor);
    expect(total).toBe(1_000_000);
  });

  it('بدون liveWeight → factor=1', () => {
    expect(calcItemTotal(10, 100000, undefined, undefined, 1)).toBe(1_000_000);
  });

  it('تخفیف 10%: 10 پرنده، 25 kg، 100K → 2,250,000', () => {
    const factor = 25 / 10;
    expect(calcItemTotal(10, 100000, 'percent', 10, factor)).toBe(2_250_000);
  });
});
