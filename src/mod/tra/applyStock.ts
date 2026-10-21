/**
 * applyStock.ts — خریدهای انباربر → انبار (whs)
 * استاندارد: PO → Goods Receipt → Inventory
 */
import { useWhs } from '../whs/store';
import type { Invoice, InvoiceItem } from './store';

const STOCK_CATS = ['feed', 'medicine', 'vaccine', 'other'];

function mapCategory(cat: string, kind?: string): any {
  if (['feed', 'medicine', 'vaccine', 'egg'].includes(cat)) return cat;
  if (cat === 'equipment') return kind === 'consumable' ? 'consumable' : 'equipment';
  return 'consumable';
}

export function applyInvoiceStock(inv: Invoice): InvoiceItem[] {
  if (inv.type !== 'purchase') return inv.items;
  const whs = useWhs.getState();
  const outItems: InvoiceItem[] = (inv.items || []).map(it => ({ ...it }));

  for (const it of outItems as any[]) {
    const cat = it.category || inv.category;
    const isStock = STOCK_CATS.includes(cat);
    const isEquipConsumable = cat === 'equipment' && it.equipmentKind === 'consumable';
    if (!isStock && !isEquipConsumable) continue;
    const qty = Number(it.quantity) || 0;
    if (qty <= 0) continue;

    let itemId = String(it.stockItemId || '');
    if (itemId) {
      const exists = whs.items.find(x => x.id === itemId);
      if (!exists) itemId = '';
    }

    if (!itemId) {
      const name = String(it.description || it.model || '').trim();
      if (!name) continue;
      const targetCat = mapCategory(cat, it.equipmentKind);
      const existing = whs.items.find(x => x.name === name && x.category === targetCat);
      if (existing) {
        itemId = existing.id;
      } else {
        try {
          itemId = whs.addItem({
            name,
            category: targetCat,
            unit: (it.unit || 'pcs') as any,
            minStock: 0,
            currentStock: 0,
            lastPrice: Number(it.unitPrice) || 0,
            supplierId: inv.partyId || '',
            expireDate: String(it.expiryDate || ''),
            withdrawalDays: null,
            batchNo: String(it.hatcheryBatchNo || ''),
            storage: String(it.storage || 'room'),
            notes: `از فاکتور ${inv.number || ''}`,
            brand: it.brand || '',
            hallId: it.hallId || '',
            equipmentStatus: it.equipmentStatus || '',
            usageType: it.usageType || '',
            purchaseDate: inv.deliveryDate || inv.date || '',
            purchasePrice: Number(it.unitPrice) || 0,
          } as any);
        } catch (e) {
          console.error('[applyInvoiceStock] addItem failed:', e);
          continue;
        }
      }
    }

    try {
      whs.addMovement({
        itemId,
        type: 'in',
        quantity: qty,
        unitPrice: Number(it.unitPrice) || 0,
        reason: 'purchase',
        date: inv.deliveryDate || inv.date || '',
        partyId: inv.partyId || '',
        notes: `فاکتور ${inv.number || ''}${it.description ? ' — ' + it.description : ''}`,
        sourceModule: 'tra',
        sourceId: inv.id,
        batchNo: it.hatcheryBatchNo,
        expiryDate: it.expiryDate,
      } as any);
    } catch (e) {
      console.error('[applyInvoiceStock] addMovement failed:', e);
      continue;
    }

    it.stockItemId = itemId;
  }

  return outItems;
}
