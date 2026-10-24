import { describe, it, expect, beforeEach } from 'vitest';
import { useWhs } from '../mod/whs/store';
import { useTra } from '../mod/tra/store';

describe('whs.egg Phantom — Standard ERP Fix', () => {
  beforeEach(() => {
    useWhs.setState({ items: [], movements: [] } as any);
    useTra.setState({ invoices: [] } as any);
  });

  it('فروش تخم‌مرغ با stockItemId → موجودی انبار کاهش می‌یابد', () => {
    // ساخت کالای انبار
    const eggItemId = useWhs.getState().addItem({
      name: '🥚 تخم مرغ خوراکی',
      category: 'egg',
      unit: 'pcs',
      minStock: 0,
      currentStock: 0,
      lastPrice: 0,
      supplierId: '',
      expireDate: '',
      withdrawalDays: null,
      storage: 'room',
      notes: '',
    } as any);
    expect(eggItemId).toBeTruthy();

    // شارژ ۵۰۰
    useWhs.getState().addMovement({
      itemId: eggItemId!,
      type: 'in',
      quantity: 500,
      unitPrice: 0,
      reason: 'adjustment',
      date: '1405/07/20',
      partyId: '',
      notes: 'تولید',
    } as any);
    expect(useWhs.getState().items.find(x => x.id === eggItemId)!.currentStock).toBe(500);

    // فاکتور فروش با stockItemId (شبیه fillFromProduction)
    useTra.getState().addInvoice({
      type: 'sale',
      date: '1405/07/21',
      partyId: 'p1',
      category: 'egg',
      items: [{
        category: 'egg',
        description: 'تخم خوراکی - 1405/07/21',
        stockItemId: eggItemId,  // 🔥 کلید رفع Phantom
        quantity: 200,
        unitPrice: 1000,
        total: 200000,
      }],
      payments: [],
      discount: 0,
      shipping: 0,
      total: 200000,
    } as any);

    // انتظار: ۵۰۰ − ۲۰۰ = ۳۰۰
    const after = useWhs.getState().items.find(x => x.id === eggItemId)!.currentStock;
    expect(after).toBe(300);
  });
});
