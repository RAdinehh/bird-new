/**
 * store-whs-deep.test.ts — تست‌های جامع و پیچیده انبار
 * سناریو: خرید، مصرف، فروش، انبارگردانی، راستی‌آزمایی
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { useWhs, recalcStock, checkIntegrity } from '../mod/whs/store';

beforeEach(() => {
  useWhs.setState({ items: [], movements: [] });
});

const mkItem = (o: any = {}) => ({
  name: 'ذرت', category: 'feed', unit: 'kg',
  minStock: 10, currentStock: 0, lastPrice: 0,
  supplierId: '', expireDate: '', withdrawalDays: null,
  batchNo: '', storage: 'room', notes: '',
  ...o,
});

const mkMove = (o: any = {}) => ({
  itemId: '', type: 'in', quantity: 0, unitPrice: 0,
  reason: 'purchase', date: '1405/07/09', partyId: '', notes: '',
  ...o,
});

const ai = (o: any = {}) => useWhs.getState().addItem(mkItem(o));
const am = (o: any = {}) => useWhs.getState().addMovement(mkMove(o));
const IT = () => useWhs.getState().items;
const MV = () => useWhs.getState().movements;
const stock = (idx = 0) => IT()[idx].currentStock;
const dm = (id: string) => useWhs.getState().deleteMovement(id);

// ═══════════════════════════════════════════════════
// ۱. addItem
// ═══════════════════════════════════════════════════
describe('addItem — پایه', () => {
  it('ایجاد + بازگشت id', () => {
    const id = ai({ currentStock: 100 });
    expect(id).toBeTruthy();
    expect(IT()).toHaveLength(1);
  });
  it('initialStock = currentStock', () => {
    ai({ currentStock: 100 });
    expect(IT()[0].initialStock).toBe(100);
  });
});

describe('addItem — Zod rejection', () => {
  const cases: Array<[string, any]> = [
    ['دسته نامعتبر', { category: 'unknown' }],
    ['واحد نامعتبر', { unit: 'ton' }],
    ['نام کوتاه', { name: 'a' }],
    ['نام خیلی بلند', { name: 'x'.repeat(81) }],
    ['minStock منفی', { minStock: -1 }],
    ['currentStock منفی', { currentStock: -5 }],
    ['lastPrice منفی', { lastPrice: -1 }],
    ['withdrawal خیلی بزرگ', { category: 'medicine', withdrawalDays: 999 }],
  ];
  cases.forEach(([n, o]) => {
    it(n + ' → پرتاب خطا', () => {
      expect(() => ai(o)).toThrow();
      expect(IT()).toHaveLength(0);
    });
  });
});

// ═══════════════════════════════════════════════════
// ۲. addMovement — in
// ═══════════════════════════════════════════════════
describe('addMovement — in', () => {
  it('basic', () => {
    const id = ai({ currentStock: 100 });
    am({ itemId: id, type: 'in', quantity: 50, unitPrice: 5000 });
    expect(stock()).toBe(150);
    expect(IT()[0].lastPrice).toBe(5000);
  });
  it('چند ورود', () => {
    const id = ai({ currentStock: 0 });
    am({ itemId: id, type: 'in', quantity: 100, unitPrice: 1000 });
    am({ itemId: id, type: 'in', quantity: 200, unitPrice: 2000 });
    am({ itemId: id, type: 'in', quantity: 50, unitPrice: 1500 });
    expect(stock()).toBe(350);
    expect(IT()[0].lastPrice).toBe(1500);
  });
  it('قیمت صفر → lastPrice دست‌نخورده', () => {
    const id = ai({ currentStock: 0, lastPrice: 999 });
    am({ itemId: id, type: 'in', quantity: 100, unitPrice: 0 });
    expect(IT()[0].lastPrice).toBe(999);
  });
  it('اعشاری', () => {
    const id = ai({ currentStock: 0 });
    am({ itemId: id, type: 'in', quantity: 2.5 });
    am({ itemId: id, type: 'in', quantity: 3.75 });
    expect(stock()).toBeCloseTo(6.25, 5);
  });
});

describe('addMovement — out', () => {
  it('basic', () => {
    const id = ai({ currentStock: 100 });
    am({ itemId: id, type: 'out', quantity: 30, reason: 'consumption' });
    expect(stock()).toBe(70);
  });
  it('خروج = موجودی', () => {
    const id = ai({ currentStock: 50 });
    am({ itemId: id, type: 'out', quantity: 50, reason: 'consumption' });
    expect(stock()).toBe(0);
  });
  it('خروج بیشتر از موجودی → clamp (shows bug)', () => {
    const id = ai({ currentStock: 50 });
    am({ itemId: id, type: 'out', quantity: 100, reason: 'consumption' });
    expect(stock()).toBe(0); // به صفر می‌رسه، ولی ۱۰۰ خروج ثبت شده
  });
  it('خروج صفر → Zod می‌گیره', () => {
    const id = ai({ currentStock: 50 });
    expect(() => am({ itemId: id, type: 'out', quantity: 0 })).toThrow();
  });
  it('خروج منفی → Zod می‌گیره', () => {
    const id = ai({ currentStock: 50 });
    expect(() => am({ itemId: id, type: 'out', quantity: -10 })).toThrow();
  });
});

describe('addMovement — adjust', () => {
  it('adjust = مقدار دقیق', () => {
    const id = ai({ currentStock: 100 });
    am({ itemId: id, type: 'adjust', quantity: 75, reason: 'adjustment' });
    expect(stock()).toBe(75);
  });
  it('adjust به صفر', () => {
    const id = ai({ currentStock: 100 });
    am({ itemId: id, type: 'adjust', quantity: 0, reason: 'adjustment' });
    expect(stock()).toBe(0);
  });
  it('adjust بعد از پیچیده', () => {
    const id = ai({ currentStock: 0 });
    am({ itemId: id, type: 'in', quantity: 100 });
    am({ itemId: id, type: 'out', quantity: 30, reason: 'consumption' });
    am({ itemId: id, type: 'in', quantity: 50 });
    expect(stock()).toBe(120);
    am({ itemId: id, type: 'adjust', quantity: 90, reason: 'adjustment' });
    expect(stock()).toBe(90);
  });
});

describe('addMovement — Zod rejection', () => {
  it('itemId خالی', () => {
    expect(() => am({ itemId: '', type: 'in', quantity: 10 })).toThrow();
  });
  it('نوع نامعتبر', () => {
    const id = ai({ currentStock: 100 });
    expect(() => am({ itemId: id, type: 'unknown', quantity: 10 })).toThrow();
  });
  it('دلیل نامعتبر', () => {
    const id = ai({ currentStock: 100 });
    expect(() => am({ itemId: id, type: 'in', quantity: 10, reason: 'bad' })).toThrow();
  });
  it('quantity منفی', () => {
    const id = ai({ currentStock: 100 });
    expect(() => am({ itemId: id, type: 'in', quantity: -5 })).toThrow();
  });
  it('unitPrice منفی', () => {
    const id = ai({ currentStock: 100 });
    expect(() => am({ itemId: id, type: 'in', quantity: 10, unitPrice: -100 })).toThrow();
  });
  it('itemId ناموجود → بازگشت خالی', () => {
    const r = am({ itemId: 'ghost', type: 'in', quantity: 10 });
    expect(r).toBe('');
    expect(MV()).toHaveLength(0);
  });
});

// ═══════════════════════════════════════════════════
// ۳. deleteMovement
// ═══════════════════════════════════════════════════
describe('deleteMovement — برگشت', () => {
  it('حذف in → کاهش', () => {
    const id = ai({ currentStock: 0 });
    const mid = am({ itemId: id, type: 'in', quantity: 100 });
    expect(stock()).toBe(100);
    dm(mid);
    expect(stock()).toBe(0);
  });
  it('حذف out → افزایش', () => {
    const id = ai({ currentStock: 200 });
    const mid = am({ itemId: id, type: 'out', quantity: 50, reason: 'consumption' });
    expect(stock()).toBe(150);
    dm(mid);
    expect(stock()).toBe(200);
  });
  it('حذف adjust → بازگشت به مقدار قبلی', () => {
    const id = ai({ currentStock: 100 });
    const mid = am({ itemId: id, type: 'adjust', quantity: 60, reason: 'adjustment' });
    expect(stock()).toBe(60);
    dm(mid);
    // حالا deleteMovement با recalc کار می‌کنه → 100 برمی‌گرده
    expect(stock()).toBe(100);
    expect(recalcStock(IT()[0], MV()).drift).toBe(0);
  });
});

// ═══════════════════════════════════════════════════
// ۴. recalcStock + checkIntegrity
// ═══════════════════════════════════════════════════
describe('recalcStock', () => {
  it('بدون حرکات', () => {
    ai({ currentStock: 100 });
    const r = recalcStock(IT()[0], []);
    expect(r.expected).toBe(100);
    expect(r.drift).toBe(0);
  });
  it('after in/out', () => {
    const id = ai({ currentStock: 0 });
    am({ itemId: id, type: 'in', quantity: 100 });
    am({ itemId: id, type: 'in', quantity: 50 });
    am({ itemId: id, type: 'out', quantity: 30, reason: 'consumption' });
    const r = recalcStock(IT()[0], MV());
    expect(r.expected).toBe(120);
    expect(r.drift).toBe(0);
  });
  it('drift تشخیص', () => {
    const id = ai({ currentStock: 0 });
    am({ itemId: id, type: 'in', quantity: 100 });
    useWhs.setState({
      items: IT().map(x => x.id === id ? { ...x, currentStock: 999 } : x),
    });
    const r = recalcStock(IT()[0], MV());
    expect(r.expected).toBe(100);
    expect(r.actual).toBe(999);
    expect(r.drift).toBe(899);
  });
  it('adjust — ترتیب زمانی', () => {
    const id = ai({ currentStock: 0 });
    am({ itemId: id, type: 'in', quantity: 100 });
    am({ itemId: id, type: 'adjust', quantity: 80, reason: 'adjustment' });
    am({ itemId: id, type: 'in', quantity: 20 });
    const r = recalcStock(IT()[0], MV());
    expect(r.expected).toBe(100);
  });
});

describe('checkIntegrity', () => {
  it('همه سالم', () => {
    const id1 = ai({ currentStock: 0 });
    const id2 = ai({ name: 'دارو', category: 'medicine', unit: 'ml', currentStock: 0, storage: 'fridge' });
    am({ itemId: id1, type: 'in', quantity: 100 });
    am({ itemId: id2, type: 'in', quantity: 50 });
    expect(checkIntegrity(IT(), MV())).toHaveLength(0);
  });
  it('یک قلم مغایرت', () => {
    const id = ai({ currentStock: 0 });
    am({ itemId: id, type: 'in', quantity: 100 });
    useWhs.setState({
      items: IT().map(x => x.id === id ? { ...x, currentStock: 150 } : x),
    });
    const d = checkIntegrity(IT(), MV());
    expect(d).toHaveLength(1);
    expect(d[0].drift).toBe(50);
  });
});

// ═══════════════════════════════════════════════════
// ۵. سناریوهای واقعی پیچیده
// ═══════════════════════════════════════════════════
describe('سناریو — ماه عملیات ذرت', () => {
  it('خرید، مصرف، فروش، انبارگردانی', () => {
    const id = ai({ currentStock: 0 });
    am({ itemId: id, type: 'in', quantity: 1000, unitPrice: 15000, date: '1405/07/01' });
    expect(stock()).toBe(1000);
    am({ itemId: id, type: 'out', quantity: 100, reason: 'consumption', date: '1405/07/08' });
    am({ itemId: id, type: 'out', quantity: 120, reason: 'consumption', date: '1405/07/09' });
    expect(stock()).toBe(780);
    am({ itemId: id, type: 'in', quantity: 500, unitPrice: 18000, date: '1405/07/15' });
    expect(stock()).toBe(1280);
    am({ itemId: id, type: 'out', quantity: 200, unitPrice: 25000, reason: 'sale', date: '1405/07/22' });
    expect(stock()).toBe(1080);
    am({ itemId: id, type: 'adjust', quantity: 1050, reason: 'adjustment', date: '1405/07/29' });
    expect(stock()).toBe(1050);
    const r = recalcStock(IT()[0], MV());
    expect(r.drift).toBe(0);
    expect(r.totalIn).toBe(1500);
    expect(r.totalOut).toBe(420);
  });
});

describe('سناریو — دو قلم موازی', () => {
  it('ذرت + دارو', () => {
    const corn = ai({ name: 'ذرت', category: 'feed', currentStock: 0 });
    const med = ai({ name: 'اکسی‌تتراسایکلین', category: 'medicine', unit: 'ml', currentStock: 0, storage: 'fridge' });
    am({ itemId: corn, type: 'in', quantity: 500 });
    am({ itemId: med, type: 'in', quantity: 100 });
    am({ itemId: corn, type: 'out', quantity: 80, reason: 'consumption' });
    am({ itemId: med, type: 'out', quantity: 20, reason: 'consumption' });
    expect(IT().find(x => x.id === corn)!.currentStock).toBe(420);
    expect(IT().find(x => x.id === med)!.currentStock).toBe(80);
  });
});

describe('سناریو — precision اعشاری', () => {
  it('۵۰ عملیات ۰.۱ → drift صفر', () => {
    const id = ai({ currentStock: 0 });
    for (let i = 0; i < 25; i++) am({ itemId: id, type: 'in', quantity: 0.1 });
    for (let i = 0; i < 25; i++) am({ itemId: id, type: 'out', quantity: 0.1, reason: 'consumption' });
    expect(stock()).toBeCloseTo(0, 5);
    const r = recalcStock(IT()[0], MV());
    expect(r.drift).toBe(0);
  });
});

describe('سناریو — برگشت کامل خرید', () => {
  it('خرید ۱۰۰ سپس حذف movement', () => {
    const id = ai({ currentStock: 0 });
    const mid = am({ itemId: id, type: 'in', quantity: 100 });
    expect(stock()).toBe(100);
    dm(mid);
    expect(stock()).toBe(0);
    expect(recalcStock(IT()[0], MV()).drift).toBe(0);
  });
});

describe('سناریو — ترکیب in/out/adjust با recalc', () => {
  it('۱۰ عملیات متوالی، drift نهایی صفر', () => {
    const id = ai({ currentStock: 100 });
    am({ itemId: id, type: 'in', quantity: 50 });
    am({ itemId: id, type: 'out', quantity: 30, reason: 'consumption' });
    am({ itemId: id, type: 'in', quantity: 20 });
    am({ itemId: id, type: 'adjust', quantity: 200, reason: 'adjustment' });
    am({ itemId: id, type: 'out', quantity: 75, reason: 'consumption' });
    am({ itemId: id, type: 'in', quantity: 25 });
    const r = recalcStock(IT()[0], MV());
    expect(r.drift).toBe(0);
    expect(r.actual).toBe(stock());
  });
});
