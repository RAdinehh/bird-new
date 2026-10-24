import { describe, it, expect, beforeEach } from 'vitest';
import { useTra } from '../mod/tra/store';
import { useHal } from '../mod/hal/store';
import { useWhs } from '../mod/whs/store';

beforeEach(() => {
  useTra.setState({ invoices: [], allocations: [], partyPayments: [], deals: [] } as any);
  useHal.setState({ equipment: [], halls: [], zones: [] } as any);
  useWhs.setState({ items: [], movements: [] } as any);
});

describe('EQUIPMENT: sale cascade', () => {
  it('فروش تجهیزات → hal.count کاهش', () => {
    // Setup: تجهیز موجود
    useHal.setState({
      equipment: [{
        id: 'eq-1', name: 'بخاری', category: 'heating', type: 'gas',
        kind: 'asset', count: 3, unitPrice: 1_000_000,
        hallId: 'h1', zoneId: '', brand: 'پارس', model: 'X',
        warehouseItemId: '', sourceInvoiceId: 'inv-buy-1',
        status: 'active', warranty: null, purchasedAt: '', supplierId: '',
        notes: '', createdAt: '2026-01-01', updatedAt: '2026-01-01',
      }] as any,
      halls: [], zones: [],
    } as any);

    // ثبت فروش
    useTra.getState().addInvoice({
      id: 'inv-sell-1', type: 'sale', number: 'S001',
      date: '1405/08/02', partyId: 'p1', category: 'equipment',
      items: [{
        id: 'i1', description: 'بخاری', category: 'equipment',
        equipmentId: 'eq-1', equipmentKind: 'asset',
        unit: 'pcs', quantity: 1, unitPrice: 1_500_000, total: 1_500_000,
      }], total: 1_500_000, payments: [],
      dueDate: '', relatedFlockId: '', relatedEntryId: '', notes: '',
      createdAt: '', updatedAt: '',
    } as any);

    const eq = useHal.getState().equipment.find((e: any) => e.id === 'eq-1');
    expect(eq?.count).toBe(2); // 3 - 1
  });

  it('فروش همه → hal.deleteEquip', () => {
    useHal.setState({
      equipment: [{
        id: 'eq-1', name: 'بخاری', category: 'heating', type: 'gas',
        kind: 'asset', count: 1, unitPrice: 1_000_000,
        hallId: 'h1', zoneId: '', brand: '', model: '',
        warehouseItemId: '', sourceInvoiceId: 'inv-buy-1',
        status: 'active', warranty: null, purchasedAt: '', supplierId: '',
        notes: '', createdAt: '', updatedAt: '',
      }] as any,
      halls: [], zones: [],
    } as any);

    useTra.getState().addInvoice({
      id: 'inv-sell-1', type: 'sale', number: 'S001',
      date: '1405/08/02', partyId: 'p1', category: 'equipment',
      items: [{
        id: 'i1', description: 'بخاری', category: 'equipment',
        equipmentId: 'eq-1', equipmentKind: 'asset',
        unit: 'pcs', quantity: 1, unitPrice: 1_500_000, total: 1_500_000,
      }], total: 1_500_000, payments: [],
      dueDate: '', relatedFlockId: '', relatedEntryId: '', notes: '',
      createdAt: '', updatedAt: '',
    } as any);

    const eq = useHal.getState().equipment.find((e: any) => e.id === 'eq-1');
    expect(eq).toBeUndefined();
  });
});
