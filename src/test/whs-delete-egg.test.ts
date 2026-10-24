import { describe, it, expect, beforeEach } from 'vitest';
import { useWhs } from '../mod/whs/store';
import { useTra } from '../mod/tra/store';
import { clearRecycleBin } from '../shr/utils/recycleBin';

describe('deleteInvoice — whs reversal for egg', () => {
  beforeEach(() => {
    useWhs.setState({ items: [], movements: [] });
    useTra.setState({ invoices: [] });
    clearRecycleBin('tra');
  });

  it('فروش تخم‌مرغ → حذف فاکتور → انبار برمی‌گردد', () => {
    const eggId = useWhs.getState().addItem({
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
    });
    expect(eggId).toBeTruthy();

    useWhs.getState().addMovement({
      itemId: eggId,
      type: 'in',
      quantity: 500,
      unitPrice: 0,
      reason: 'adjustment',
      date: '1405/07/20',
      partyId: '',
      notes: 'تولید',
    });
    expect(useWhs.getState().items.find(x => x.id === eggId)!.currentStock).toBe(500);

    const invId = useTra.getState().addInvoice({
      type: 'sale',
      date: '1405/07/21',
      partyId: 'p1',
      category: 'egg',
      items: [{
        id: 'item-1',
        category: 'egg',
        description: 'تخم خوراکی - 1405/07/21',
        stockItemId: eggId,
        quantity: 200,
        unitPrice: 1000,
        total: 200000,
      }],
      payments: [],
      discount: 0,
      shipping: 0,
      total: 200000,
    });

    expect(useWhs.getState().items.find(x => x.id === eggId)!.currentStock).toBe(300);

    useTra.getState().deleteInvoice(invId);

    const final = useWhs.getState().items.find(x => x.id === eggId)!.currentStock;
    expect(final).toBe(500);
  });
});
