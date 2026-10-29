/**
 * تست migration v0→v1 برای Phase G-1 — stockByLocation
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { useWhs, getStockAt } from '../mod/whs/store';

describe('Phase G-1 migration (v0 → v1)', () => {
  beforeEach(() => {
    useWhs.setState({ items: [], movements: [] });
    localStorage.clear();
  });

  it('stockByLocation از currentStock پر می‌شه', async () => {
    const v0State = {
      state: {
        items: [{
          id: 'test-item',
          name: 'ذرت',
          category: 'feed',
          unit: 'kg',
          minStock: 0,
          currentStock: 150,
          initialStock: 100,
          lastPrice: 1000,
          avgPrice: 1000,
          supplierId: '',
          expireDate: '',
          withdrawalDays: null,
          storage: 'room',
          notes: '',
          createdAt: '2025-01-01T00:00:00Z',
          updatedAt: '2025-01-01T00:00:00Z',
        }],
        movements: [{
          id: 'test-mv',
          itemId: 'test-item',
          type: 'in',
          quantity: 50,
          unitPrice: 1000,
          reason: 'purchase',
          date: '2025-01-01',
          partyId: '',
          notes: '',
          createdAt: '2025-01-01T00:00:00Z',
        }],
      },
      version: 0,
    };
    localStorage.setItem('pm-whs', JSON.stringify(v0State));
    await useWhs.persist.rehydrate();

    const item = useWhs.getState().items[0];
    expect(item).toBeDefined();
    expect(item.stockByLocation).toEqual({ stock: 150 });
    expect(item.initialStockByLocation).toEqual({ stock: 100 });

    const mv = useWhs.getState().movements[0];
    expect(mv).toBeDefined();
    expect(mv.locationId).toBe('stock');
  });

  it('getStockAt برای آیتم قدیمی (fallback) کار می‌کند', () => {
    const oldItem = {
      id: 'legacy', name: 'قدیمی', category: 'feed' as const, unit: 'kg' as const,
      minStock: 0, currentStock: 200, lastPrice: 1000,
      supplierId: '', expireDate: '', withdrawalDays: null, storage: 'room', notes: '',
      createdAt: '2025-01-01', updatedAt: '2025-01-01',
    };
    expect(getStockAt(oldItem, 'stock')).toBe(200);
    expect(getStockAt(oldItem, 'consignment:party1')).toBe(0);
  });

  it('getStockAt با stockByLocation per-location می‌ده', () => {
    const item = {
      id: 'new', name: 'جدید', category: 'feed' as const, unit: 'kg' as const,
      minStock: 0, currentStock: 1300, lastPrice: 1000,
      supplierId: '', expireDate: '', withdrawalDays: null, storage: 'room', notes: '',
      stockByLocation: { stock: 1000, 'consignment:party1': 300 },
      createdAt: '2025-01-01', updatedAt: '2025-01-01',
    };
    expect(getStockAt(item, 'stock')).toBe(1000);
    expect(getStockAt(item, 'consignment:party1')).toBe(300);
    expect(getStockAt(item, 'unknown')).toBe(0);
  });
});
