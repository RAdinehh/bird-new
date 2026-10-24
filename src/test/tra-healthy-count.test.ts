import { describe, it, expect, beforeEach } from 'vitest';
import { useFlk } from '../mod/flk/store';
import { useTra } from '../mod/tra/store';
import { useWhs } from '../mod/whs/store';
import { clearRecycleBin } from '../shr/utils/recycleBin';

describe('فاکتور خرید جوجه — healthyCount', () => {
  beforeEach(() => {
    useFlk.setState({ flocks: [] });
    useTra.setState({ invoices: [] });
    useWhs.setState({ items: [], movements: [] });
    clearRecycleBin('tra');
  });

  it('healthyCount داده شده → گله با تعداد سالم ساخته می‌شود', () => {
    useTra.getState().addInvoice({
      type: 'purchase',
      date: '1405/07/20',
      partyId: 'p1',
      category: 'chick',
      items: [{
        category: 'chick',
        birdId: 'b1',
        breedId: 'breed1',
        description: 'جوجه یک روزه',
        quantity: 1000,
        healthyCount: 950,
        unitPrice: 10000,
        total: 10000000,
      }],
      payments: [],
      discount: 0,
      shipping: 0,
      total: 10000000,
    });

    const flocks = useFlk.getState().flocks;
    expect(flocks).toHaveLength(1);
    expect(flocks[0].initialCount).toBe(950);
    expect(flocks[0].currentCount).toBe(950);
  });

  it('healthyCount خالی → گله با تعداد کل ساخته می‌شود', () => {
    useTra.getState().addInvoice({
      type: 'purchase',
      date: '1405/07/20',
      partyId: 'p1',
      category: 'chick',
      items: [{
        category: 'chick',
        birdId: 'b1',
        breedId: 'breed1',
        description: 'جوجه یک روزه',
        quantity: 1000,
        unitPrice: 10000,
        total: 10000000,
      }],
      payments: [],
      discount: 0,
      shipping: 0,
      total: 10000000,
    });

    const flocks = useFlk.getState().flocks;
    expect(flocks).toHaveLength(1);
    expect(flocks[0].initialCount).toBe(1000);
  });
});
