/**
 * preorder-lifecycle.test.ts
 *
 * تست چرخه کامل «پیش‌خرید» طبق استاندارد جهانی:
 * - پیش‌خرید فقط تعهد ثبت می‌کنه (گله/موجودی نمی‌سازه)
 * - بعد از تحویل (isPreorder: true -> false) گله/موجودی ساخته می‌شه
 * - تاریخ گله/موجودی = deliveryDate (نه تاریخ فاکتور)
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { useTra } from '../mod/tra/store';
import { useFlk } from '../mod/flk/store';
import { useWhs } from '../mod/whs/store';
import { useBrd } from '../mod/brd/store';
import { useInc } from '../mod/inc/store';

function resetStores() {
  useTra.setState({ invoices: [], partyPayments: [], deals: [] });
  useFlk.setState({ flocks: [], groups: [], groupMembers: [] });
  useWhs.setState({ items: [], movements: [] });
  useBrd.setState({ birds: [], breeds: [] });
  useInc.setState({ devices: [], eggEntries: [], hatchGroups: [], candlings: [], results: [] } as any);
}

function seedBirdAndBreed() {
  useBrd.setState({
    birds: [{ id: 'bird-1', name: 'گوشتی' }] as any,
    breeds: [{ id: 'breed-1', name: 'راس ۳۰۸', birdId: 'bird-1' }] as any,
  });
}

function seedWarehouseItem() {
  useWhs.setState({
    items: [{
      id: 'item-feed', name: 'دان استارتر', category: 'feed',
      unit: 'kg', minStock: 0, currentStock: 0, lastPrice: 0,
      supplierId: '', expireDate: '', withdrawalDays: null,
      batchNo: '', storage: 'room', notes: '',
      createdAt: '', updatedAt: '',
    }] as any,
    movements: [],
  });
}

const baseInvoice = (overrides: any) => ({
  type: 'purchase' as const,
  date: '1405/07/27',
  partyId: 'party-1',
  category: 'chick',
  total: 20_000_000,
  payments: [] as any[],
  dueDate: '1405/08/15',
  relatedFlockId: '',
  relatedEntryId: '',
  notes: '',
  items: [] as any[],
  ...overrides,
});

describe('Preorder lifecycle — chick', () => {
  beforeEach(() => { resetStores(); seedBirdAndBreed(); });

  it('preorder save: does NOT create flock', () => {
    const id = useTra.getState().addInvoice(baseInvoice({
      isPreorder: true,
      deliveryDate: '1405/08/15',
      items: [{
        id: 'i1', description: 'جوجه راس', unit: 'pcs',
        quantity: 1000, unitPrice: 20000, total: 20_000_000,
        birdId: 'bird-1', breedId: 'breed-1',
      }],
    }) as any);

    expect(useFlk.getState().flocks).toHaveLength(0);
    expect(useTra.getState().invoices[0].isPreorder).toBe(true);
  });

  it('receiving preorder: creates flock using deliveryDate', () => {
    const id = useTra.getState().addInvoice(baseInvoice({
      isPreorder: true,
      deliveryDate: '1405/08/15',
      items: [{
        id: 'i1', description: 'جوجه راس', unit: 'pcs',
        quantity: 1000, unitPrice: 20000, total: 20_000_000,
        birdId: 'bird-1', breedId: 'breed-1',
      }],
    }) as any);

    // Receive: isPreorder true -> false
    useTra.getState().updateInvoice(id, { isPreorder: false, workflowStatus: 'received' });

    const flocks = useFlk.getState().flocks;
    expect(flocks).toHaveLength(1);
    expect(flocks[0].initialCount).toBe(1000);
    // ✅ تاریخ خرید = تاریخ تحویل (نه تاریخ فاکتور)
    expect(flocks[0].purchaseDate).toBe('1405/08/15');
    expect(flocks[0].startDate).toBe('1405/08/15');
  });
});

describe('Preorder lifecycle — feed (warehouse)', () => {
  beforeEach(() => { resetStores(); seedWarehouseItem(); });

  it('preorder save: does NOT create movement', () => {
    useTra.getState().addInvoice(baseInvoice({
      isPreorder: true,
      deliveryDate: '1405/08/15',
      category: 'feed',
      items: [{
        id: 'i1', description: 'دان', unit: 'kg',
        quantity: 500, unitPrice: 15000, total: 7_500_000,
        itemId: 'item-feed',
      }],
    }) as any);

    expect(useWhs.getState().movements).toHaveLength(0);
  });
});

describe('Stock (non-preorder) baseline', () => {
  beforeEach(() => { resetStores(); seedBirdAndBreed(); });

  it('stock purchase: creates flock immediately', () => {
    useTra.getState().addInvoice(baseInvoice({
      isPreorder: false,
      items: [{
        id: 'i1', description: 'جوجه راس', unit: 'pcs',
        quantity: 500, unitPrice: 20000, total: 10_000_000,
        birdId: 'bird-1', breedId: 'breed-1',
      }],
    }) as any);

    expect(useFlk.getState().flocks).toHaveLength(1);
    expect(useFlk.getState().flocks[0].purchaseDate).toBe('1405/07/27');
  });
});
