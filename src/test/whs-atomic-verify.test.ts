/**
 * D10 — whs atomicity by design (verify + structural)
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { useWhs } from '../mod/whs/store';

const makeItem = (id: string, stock = 100): any => ({
  id, name: 'item-' + id, category: 'feed', unit: 'kg',
  minStock: 0,
  currentStock: stock,
  initialStock: stock,  // ← recalcStockByLocation نیاز دارد
  lastPrice: 1000, avgPrice: 1000,
  supplierId: '', expireDate: '', withdrawalDays: null,
  batchNo: '', storage: 'room', notes: '',
  createdAt: '2026-01-01', updatedAt: '2026-01-01',
});

const makeMovement = (itemId: string, qty: number): any => ({
  itemId,
  type: 'in',
  quantity: qty,
  unitPrice: 1000,
  reason: 'purchase',
  date: '1405/11/08',
  partyId: 'p1',  // ← لازم برای reason: purchase
  notes: '',
});

describe('D10 — whs atomic by design', () => {
  beforeEach(() => {
    useWhs.setState({ items: [makeItem('i1')], movements: [] } as any);
  });

  it('addMovement: valid → stock + movement (single set)', () => {
    const mid = useWhs.getState().addMovement(makeMovement('i1', 50));
    expect(mid).toBeTruthy();
    expect(useWhs.getState().movements).toHaveLength(1);
    expect(useWhs.getState().items[0].currentStock).toBe(150);
  });

  it('addMovement preflight: item not found → return "" (صفر mutation)', () => {
    const before = useWhs.getState().items;
    const beforeMovs = useWhs.getState().movements;
    const mid = useWhs.getState().addMovement(makeMovement('nonexistent', 50));
    expect(mid).toBe('');
    expect(useWhs.getState().items).toBe(before);
    expect(useWhs.getState().movements).toBe(beforeMovs);
  });

  it('addMovement preflight: Zod invalid (negative qty) → throw', () => {
    const before = useWhs.getState().items;
    const beforeMovs = useWhs.getState().movements;
    expect(() => useWhs.getState().addMovement({ ...makeMovement('i1', -10) })).toThrow();
    expect(useWhs.getState().items).toBe(before);
    expect(useWhs.getState().movements).toBe(beforeMovs);
  });

  it('addMovement preflight: missing party for purchase → throw', () => {
    const before = useWhs.getState().items;
    expect(() => useWhs.getState().addMovement({ ...makeMovement('i1', 50), partyId: '' })).toThrow();
    expect(useWhs.getState().items).toBe(before);
    expect(useWhs.getState().movements).toHaveLength(0);
  });

  it('deleteMovement: موجودی برمی‌گردد', () => {
    useWhs.getState().addMovement(makeMovement('i1', 50));
    expect(useWhs.getState().items[0].currentStock).toBe(150);

    const mid = useWhs.getState().movements[0].id;
    useWhs.getState().deleteMovement(mid);
    expect(useWhs.getState().movements).toHaveLength(0);
    expect(useWhs.getState().items[0].currentStock).toBe(100);
  });

  it('deleteMovement: id ناموجود → silent no-op', () => {
    const before = useWhs.getState().items;
    useWhs.getState().deleteMovement('nonexistent-id');
    expect(useWhs.getState().items).toBe(before);
    expect(useWhs.getState().movements).toHaveLength(0);
  });

  it('addItem: single set + id برگشتی', () => {
    const id = useWhs.getState().addItem({
      name: 'new', category: 'vaccine', unit: 'pcs',
      minStock: 0, currentStock: 0, lastPrice: 0,
      supplierId: '', expireDate: '', withdrawalDays: null,
      batchNo: '', storage: 'fridge', notes: '',
    } as any);
    expect(id).toBeTruthy();
    expect(useWhs.getState().items).toHaveLength(2);
  });

  it('structural: action ها = single set() each', async () => {
    const fs = await import('node:fs');
    const content = fs.readFileSync('src/mod/whs/store.ts', 'utf-8');

    const addItemIdx = content.indexOf('addItem: (i) =>');
    const deleteMovementIdx = content.indexOf('deleteMovement: (id) =>');
    expect(addItemIdx).toBeGreaterThan(-1);
    expect(deleteMovementIdx).toBeGreaterThan(addItemIdx);

    const range = content.slice(addItemIdx, deleteMovementIdx);
    const setCounts = (range.match(/\bset\(/g) || []).length;
    expect(setCounts).toBeGreaterThanOrEqual(4);
    expect(setCounts).toBeLessThanOrEqual(5);
  });
});
