import { describe, it, expect } from 'vitest';
import { jalaliToDate, toJalali } from '../mod/flk/helpers-store';

describe('jalaliToDate — پیش‌نیاز آرشیو سرد', () => {
  it('تاریخ استاندارد لاگ را می‌پارس می‌کند', () => {
    const d = jalaliToDate('1405/11/17');
    expect(d).not.toBeNull();
    expect(d!.getFullYear()).toBe(2027);   // ۱۴۰۵/۱۱/۱۷ ≈ ۲۰۲۷-۰۲-۰۶
  });

  it('ماه و روز یک‌رقمی را صفر-پد می‌کند', () => {
    const a = jalaliToDate('1405/1/5');
    const b = jalaliToDate('1405/01/05');
    expect(a).not.toBeNull();
    expect(b).not.toBeNull();
    expect(a!.getTime()).toBe(b!.getTime());
  });

  it('ارقام فارسی را می‌پذیرد', () => {
    const d = jalaliToDate('۱۴۰۵/۱۱/۱۷');
    expect(d).not.toBeNull();
    expect(d!.getTime()).toBe(jalaliToDate('1405/11/17')!.getTime());
  });

  it('ورودی خالی یا نامعتبر → null (بدون حدس)', () => {
    expect(jalaliToDate('')).toBeNull();
    expect(jalaliToDate('abc')).toBeNull();
    expect(jalaliToDate('1405/11')).toBeNull();
    expect(jalaliToDate('1405/11/17/1')).toBeNull();
  });

  it('ترتیب زمانی درست است (برای مقایسه با آستانه)', () => {
    const old = jalaliToDate('1404/01/01')!;
    const mid = jalaliToDate('1405/06/01')!;
    const now = jalaliToDate('1405/11/17')!;
    expect(old.getTime()).toBeLessThan(mid.getTime());
    expect(mid.getTime()).toBeLessThan(now.getTime());
  });

  it('رفت‌وبرگشت toJalali → jalaliToDate', () => {
    const iso = '2026-11-18T00:00:00.000Z';
    const j = toJalali(iso);
    const back = jalaliToDate(j);
    expect(back).not.toBeNull();
    expect(back!.getUTCFullYear()).toBe(2026);
  });
});
