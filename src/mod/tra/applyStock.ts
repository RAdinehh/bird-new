/**
 * applyStock.ts — cascade ترا → انبار (whs)
 * purchase: ایجاد + افزایش موجودی
 * sale: کاهش موجودی (فقط اگه Item از قبل موجود باشه)
 */
import { useWhs } from '../whs/store';
import type { Invoice, InvoiceItem } from './store';

const PURCHASE_STOCK_CATS = ['feed', 'medicine', 'vaccine', 'other'];
const SALE_STOCK_CATS = ['feed', 'medicine', 'vaccine', 'equipment', 'manure', 'broken', 'other'];

function mapCategory(cat: string, kind?: string): any {
  if (['feed', 'medicine', 'vaccine', 'egg'].includes(cat)) return cat;
  if (cat === 'equipment') return kind === 'consumable' ? 'consumable' : 'equipment';
  return 'consumable';
}

function stockKey(it: InvoiceItem): string {
  return String(it.stockItemId || it.description || it.model || '').trim() + '|' + String((it as any).equipmentKind || '');
}

function isStockItemForPurchase(it: InvoiceItem, inv: Invoice): boolean {
  const cat = it.category || inv.category;
  const isStock = PURCHASE_STOCK_CATS.includes(cat);
  const isEquipConsumable = cat === 'equipment' && (it as any).equipmentKind === 'consumable';
  return isStock || isEquipConsumable;
}

function isStockItemForSale(it: InvoiceItem, inv: Invoice): boolean {
  const cat = it.category || inv.category;
  return SALE_STOCK_CATS.includes(cat);
}

function findExistingItem(it: InvoiceItem, inv: Invoice, whs: any): string {
  if (it.stockItemId && whs.items.find((x: any) => x.id === it.stockItemId)) {
    return it.stockItemId;
  }
  const name = String(it.description || it.model || '').trim();
  if (!name) return '';
  const cat = it.category || inv.category;
  const targetCat = mapCategory(cat, (it as any).equipmentKind);
  const existing = whs.items.find((x: any) => x.name === name && (x.category === targetCat || x.category === cat));
  return existing?.id || '';
}

function ensureItemForPurchase(it: InvoiceItem, inv: Invoice, whs: any): string {
  const existingId = findExistingItem(it, inv, whs);
  if (existingId) return existingId;
  const name = String(it.description || it.model || '').trim();
  if (!name) return '';
  const cat = it.category || inv.category;
  const targetCat = mapCategory(cat, (it as any).equipmentKind);
  try {
    return whs.addItem({
      name, category: targetCat, unit: (it.unit || 'pcs') as any,
      minStock: 0, currentStock: 0,
      lastPrice: Number(it.unitPrice) || 0,
      supplierId: inv.partyId || '', expireDate: String(it.expiryDate || ''),
      withdrawalDays: null, batchNo: String(it.hatcheryBatchNo || ''),
      storage: String((it as any).storage || 'room'),
      notes: `از فاکتور ${inv.number || ''}`,
      brand: (it as any).brand || '', hallId: (it as any).hallId || '',
      equipmentStatus: (it as any).equipmentStatus || '',
      usageType: (it as any).usageType || '',
      purchaseDate: inv.deliveryDate || inv.date || '',
      purchasePrice: Number(it.unitPrice) || 0,
    } as any);
  } catch (e) {
    console.error('[applyInvoiceStock] addItem failed:', e);
    return '';
  }
}

function buildQtyMap(items: InvoiceItem[], inv: Invoice, predicate: (it: InvoiceItem, inv: Invoice) => boolean): Map<string, { qty: number; sample: InvoiceItem }> {
  const m = new Map<string, { qty: number; sample: InvoiceItem }>();
  for (const it of items || []) {
    if (!predicate(it, inv)) continue;
    const key = stockKey(it);
    if (!key || key === '|') continue;
    const cur = m.get(key);
    if (cur) cur.qty += Number(it.quantity) || 0;
    else m.set(key, { qty: Number(it.quantity) || 0, sample: it });
  }
  return m;
}

export function applyInvoiceStock(inv: Invoice, prev?: Invoice): InvoiceItem[] {
  const whs = useWhs.getState();
  const outItems: InvoiceItem[] = (inv.items || []).map(it => ({ ...it }));

  if (inv.type === 'purchase') {
    const isStock = (it: InvoiceItem, inv2: Invoice) => isStockItemForPurchase(it, inv2);
    const prevMap = prev ? buildQtyMap(prev.items || [], prev, isStock) : new Map();
    const newMap = buildQtyMap(outItems, inv, isStock);

    for (const [key, { qty: newQty, sample }] of newMap) {
      const prevQty = prevMap.get(key)?.qty || 0;
      const delta = newQty - prevQty;
      if (delta <= 0) continue;
      const itemId = ensureItemForPurchase(sample, inv, whs);
      if (!itemId) continue;
      try {
        whs.addMovement({
          itemId, type: 'in', quantity: delta,
          unitPrice: Number(sample.unitPrice) || 0,
          reason: 'purchase',
          date: inv.deliveryDate || inv.date || '',
          partyId: inv.partyId || '',
          notes: `فاکتور ${inv.number || ''}${sample.description ? ' — ' + sample.description : ''}`,
          sourceModule: 'tra', sourceId: inv.id,
          batchNo: sample.hatcheryBatchNo,
          expiryDate: sample.expiryDate,
        } as any);
      } catch (e) {
        console.error('[applyInvoiceStock/purchase] addMovement failed:', e);
        continue;
      }
      for (const it of outItems) {
        if (isStock(it, inv) && stockKey(it) === key) it.stockItemId = itemId;
      }
    }
  }

  if (inv.type === 'sale') {
    const isStock = (it: InvoiceItem, inv2: Invoice) => isStockItemForSale(it, inv2);
    const prevMap = prev ? buildQtyMap(prev.items || [], prev, isStock) : new Map();
    const newMap = buildQtyMap(outItems, inv, isStock);

    for (const [key, { qty: newQty, sample }] of newMap) {
      const prevQty = prevMap.get(key)?.qty || 0;
      const delta = newQty - prevQty;
      if (delta <= 0) continue;
      const itemId = findExistingItem(sample, inv, whs);
      if (!itemId) {
        console.warn('[applyInvoiceStock/sale] item not in whs, skip:', sample.description || sample.model);
        continue;
      }
      try {
        whs.addMovement({
          itemId, type: 'out', quantity: delta,
          unitPrice: Number(sample.unitPrice) || 0,
          reason: 'sale',
          date: inv.deliveryDate || inv.date || '',
          partyId: inv.partyId || '',
          notes: `فروش — فاکتور ${inv.number || ''}${sample.description ? ' — ' + sample.description : ''}`,
          sourceModule: 'tra', sourceId: inv.id,
        } as any);
      } catch (e) {
        console.error('[applyInvoiceStock/sale] addMovement failed:', e);
        continue;
      }
      for (const it of outItems) {
        if (isStock(it, inv) && stockKey(it) === key) it.stockItemId = itemId;
      }
    }
  }

  return outItems;
}
