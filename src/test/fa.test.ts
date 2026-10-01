import { describe, it, expect } from 'vitest';
import { toFa, toEn } from '../shr/utils/fa';

describe('toFa — تبدیل اعداد لاتین به فارسی', () => {
  it('عدد صحیح', () => {
    expect(toFa(123)).toBe('۱۲۳');
  });
  it('عدد اعشاری', () => {
    expect(toFa(45.67)).toBe('۴۵.۶۷');
  });
  it('صفر', () => {
    expect(toFa(0)).toBe('۰');
  });
});

describe('toEn — تبدیل اعداد فارسی به لاتین', () => {
  it('عدد فارسی', () => {
    expect(toEn('۱۲۳')).toBe('123');
  });
});
