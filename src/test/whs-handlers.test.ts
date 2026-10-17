import { describe, it, expect, beforeEach } from 'vitest';
import { bus } from '../cor/events';
import { useWhs } from '../mod/whs/store';
import { registerWhsHandlers } from '../mod/whs/handlers';

const makeInvoice = (overrides: any = {}) => ({
  id: 'inv-1',
  type: 'purchase',
  date: '1405/07/09',
  partyId: 'party-1',
  number: 'INV-001',
  items: [],
  ...overrides,
});

const makeItem = (id = 'item-1') => ({
  id,
  name: 'دان',
  category: 'feed' as const,
  unit: 'kg' as const,
  minStock: 10,
  currentStock: 0,
  lastPrice: 0,
  supplierId: '',
  expireDate: '',
  withdrawalDays: null,
  batchNo: '',
  storage: 'room',
  notes: '',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
});

beforeEach(() => {
  bus.reset();
  useWhs.setState({ items: [], movements: [] });
});

describe('whs handlers — tra:invoice:created', () => {
  it('movement می‌سازد و movementId را روی رفرنس ست می‌کند', async () => {
    useWhs.setState({ items: [makeItem('item-1')] });
    registerWhsHandlers();
    const items: any[] = [{ itemId: 'item-1', quantity: 5, unitPrice: 1000, description: 'تست' }];
    const invoice = makeInvoice();
    await bus.emit('tra:invoice:created', { invoiceId: invoice.id, invoice, items }, { source: 'test' });

    expect(items[0].movementId).toBeTruthy();
    const m = useWhs.getState().movements;
    expect(m).toHaveLength(1);
    expect(m[0].itemId).toBe('item-1');
    expect(m[0].type).toBe('in');
    expect(m[0].reason).toBe('purchase');
    expect(m[0].quantity).toBe(5);
    expect(m[0].id).toBe(items[0].movementId);
  });

  it('فاکتور فروش → movement از نوع out', async () => {
    useWhs.setState({ items: [makeItem('item-1')] });
    registerWhsHandlers();
    const items: any[] = [{ itemId: 'item-1', quantity: 3, unitPrice: 500 }];
    const invoice = makeInvoice({ type: 'sale' });
    await bus.emit('tra:invoice:created', { invoiceId: invoice.id, invoice, items }, { source: 'test' });

    const m = useWhs.getState().movements;
    expect(m[0].type).toBe('out');
    expect(m[0].reason).toBe('sale');
    expect(m[0].quantity).toBe(3);
  });

  it('آیتم بدون itemId → movement نمی‌سازد', async () => {
    registerWhsHandlers();
    const items: any[] = [{ quantity: 5, description: 'بدون کالا' }];
    await bus.emit('tra:invoice:created', { invoiceId: 'inv-1', invoice: makeInvoice(), items }, { source: 'test' });
    expect(items[0].movementId).toBe('');
    expect(useWhs.getState().movements).toHaveLength(0);
  });

  it('آیتم ناموجود در انبار → movementId خالی', async () => {
    registerWhsHandlers();
    const items: any[] = [{ itemId: 'nonexistent', quantity: 5, unitPrice: 100 }];
    await bus.emit('tra:invoice:created', { invoiceId: 'inv-1', invoice: makeInvoice(), items }, { source: 'test' });
    expect(items[0].movementId).toBe('');
    expect(useWhs.getState().movements).toHaveLength(0);
  });
});

describe('whs handlers — tra:invoice:deleted', () => {
  it('movementها را بر اساس movementId حذف می‌کند', async () => {
    useWhs.setState({ items: [makeItem('item-1')] });
    registerWhsHandlers();
    const items: any[] = [{ itemId: 'item-1', quantity: 5, unitPrice: 1000 }];
    const invoice = makeInvoice();
    await bus.emit('tra:invoice:created', { invoiceId: invoice.id, invoice, items }, { source: 'test' });
    expect(useWhs.getState().movements).toHaveLength(1);

    await bus.emit('tra:invoice:deleted', { invoiceId: invoice.id, invoice, items }, { source: 'test' });
    expect(useWhs.getState().movements).toHaveLength(0);
  });
});

describe('whs handlers — tra:invoice:updated', () => {
  it('movement قبلی را پاک و movement جدید می‌سازد', async () => {
    useWhs.setState({ items: [makeItem('item-1')] });
    registerWhsHandlers();
    const prevItems: any[] = [{ itemId: 'item-1', quantity: 5, unitPrice: 1000 }];
    const invoice = makeInvoice();
    await bus.emit('tra:invoice:created', { invoiceId: invoice.id, invoice, items: prevItems }, { source: 'test' });
    const firstId = prevItems[0].movementId;
    expect(firstId).toBeTruthy();
    expect(useWhs.getState().movements).toHaveLength(1);

    const newItems: any[] = [{ itemId: 'item-1', quantity: 8, unitPrice: 1000 }];
    await bus.emit('tra:invoice:updated', {
      invoiceId: invoice.id,
      invoice,
      prevInvoice: invoice,
      items: newItems,
      prevItems,
    }, { source: 'test' });

    const m = useWhs.getState().movements;
    expect(m).toHaveLength(1);
    expect(m[0].quantity).toBe(8);
    expect(m[0].id).not.toBe(firstId);
    expect(newItems[0].movementId).toBeTruthy();
    expect(newItems[0].movementId).not.toBe(firstId);
  });
});
