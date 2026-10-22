/**
 * applyStock.ts — خریدهای انباربر → انبار (whs)
 * delta-based: فقط تفاضل با نسخه قبلی ثبت می‌شه
 */
import { useWhs } from '../whs/store';
import type { Invoice, InvoiceItem } from './store';

// ─── UOM base + factors (inlined to avoid circular dep with useInvoiceForm) ───
const UOM_BASE: Record<string, string> = {
  egg: 'pcs', fertile_egg: 'pcs', chick: 'pcs', adult: 'pcs', broken: 'pcs',
  equipment: 'pcs', feed: 'kg', medicine: 'ml', herbal: 'g', vaccine: 'dose',
  manure: 'kg', other: 'pcs',
};
const UOM_FACTORS: Record<string, Record<string, number | null>> = {
  feed: { kg: 1, g: 0.001, ton: 1000, bag: 25 },
  medicine: { ml: 1, l: 1000, vial: null, pack: null },
  herbal: { g: 1, kg: 1000, l: 1000, pack: null },
  vaccine: { dose: 1, vial: null, pack: null },
  manure: { kg: 1, ton: 1000 },
  other: { pcs: 1, kg: 1, pack: null },
};
function uomBase(cat: string): string { return UOM_BASE[cat] || 'pcs'; }
function uomFactor(cat: string, unit: string, unitWeight?: number | null): number {
  const m = UOM_FACTORS[cat];
  if (!m) return 1;
  const f = m[unit];
  if (f !== undefined && f !== null) return f;
  return unitWeight && unitWeight > 0 ? unitWeight : 1;
}

const STOCK_CATS = ['feed', 'medicine', 'vaccine', 'herbal', 'other'];

function mapCategory(cat: string, kind?: string): any {
  if (['feed', 'medicine', 'vaccine', 'herbal', 'egg'].includes(cat)) return cat;
  if (cat === 'equipment') return kind === 'consumable' ? 'consumable' : 'equipment';
  return 'consumable';
}

function stockKey(it: InvoiceItem): string {
  return String(it.stockItemId || it.description || it.model || '').trim() + '|' + String((it as any).equipmentKind || '');
}

function isStockItem(it: InvoiceItem, inv: Invoice): boolean {
  const cat = it.category || inv.category;
  const isStock = STOCK_CATS.includes(cat);
  const isEquipConsumable = cat === 'equipment' && (it as any).equipmentKind === 'consumable';
  return isStock || isEquipConsumable;
}

function ensureItem(it: InvoiceItem, inv: Invoice, whs: any): string {
  const name = String(it.description || it.model || '').trim();
  if (!name) return '';
  const cat = it.category || inv.category;
  const targetCat = mapCategory(cat, (it as any).equipmentKind);

  if (it.stockItemId && whs.items.find((x: any) => x.id === it.stockItemId)) {
    return it.stockItemId;
  }
  const existing = whs.items.find((x: any) => x.name === name && x.category === targetCat);
  if (existing) return existing.id;

  try {
    return whs.addItem({
      name, category: targetCat, unit: uomBase(it.category || inv.category) as any,
      minStock: 0, currentStock: 0,
      lastPrice: (() => { const f = uomFactor(it.category || inv.category, it.unit || '', (it as any).unitWeight); return f > 0 ? (Number(it.unitPrice) || 0) / f : 0; })(),
      supplierId: inv.partyId || '', expireDate: String(it.expiryDate || ''),
      withdrawalDays: null,
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

export function applyInvoiceStock(inv: Invoice, prev?: Invoice): InvoiceItem[] {
  // 🆕 Sale: کاهش موجودی (self-contained)
  if (inv.type === 'sale') {
    const whs = useWhs.getState();
    const outItems: InvoiceItem[] = (inv.items || []).map(it => ({ ...it }));

    const buildMap = (inv2: Invoice | undefined): Map<string, { qty: number; sample: any }> => {
      const mm = new Map<string, { qty: number; sample: any }>();
      if (!inv2) return mm;
      for (const it of inv2.items || []) {
        if (!isStockItem(it, inv2)) continue;
        const key = stockKey(it);
        if (!key || key === '|') continue;
        const cur = mm.get(key);
        if (cur) cur.qty += Number(it.quantity) || 0;
        else mm.set(key, { qty: Number(it.quantity) || 0, sample: it });
      }
      return mm;
    };

    const prevMap = buildMap(prev);
    const newMap = buildMap(inv);

    for (const [key, { qty: newQty, sample }] of newMap) {
      const prevQty = prevMap.get(key)?.qty || 0;
      const delta = newQty - prevQty;
      if (delta <= 0) continue;

      let itemId = String((sample as any).stockItemId || '');
      if (itemId && !whs.items.find((x: any) => x.id === itemId)) itemId = '';
      if (!itemId) {
        const name = String(sample.description || sample.model || '').trim();
        const cat = sample.category || inv.category;
        const targetCat = mapCategory(cat, (sample as any).equipmentKind);
        const existing = whs.items.find((x: any) =>
          x.name === name && (x.category === targetCat || x.category === cat)
        );
        if (existing) itemId = existing.id;
      }
      if (!itemId) {
        console.warn('[applyInvoiceStock/sale] item not found, skip:', sample.description);
        continue;
      }

      try {
        whs.addMovement({
          itemId, type: 'out', quantity: Math.abs(delta) * uomFactor(sample.category || inv.category, sample.unit || '', (sample as any).unitWeight),
          unitPrice: (() => { const f = uomFactor(sample.category || inv.category, sample.unit || '', (sample as any).unitWeight); return f > 0 ? (Number(sample.unitPrice) || 0) / f : 0; })(),
          reason: 'sale',
          date: inv.deliveryDate || inv.date || '',
          partyId: inv.partyId || '',
          notes: `فروش — فاکتور ${inv.number || ''}`,
          sourceModule: 'tra', sourceId: inv.id,
        } as any);
      } catch (e) {
        console.error('[applyInvoiceStock/sale] addMovement failed:', e);
        continue;
      }

      for (const it of outItems) {
        if (isStockItem(it, inv) && stockKey(it) === key) {
          (it as any).stockItemId = itemId;
        }
      }
    }

    return outItems;
  }

  if (inv.type !== 'purchase') return inv.items;
  const whs = useWhs.getState();
  const outItems: InvoiceItem[] = (inv.items || []).map(it => ({ ...it }));

  const prevQtyByKey = new Map<string, number>();
  if (prev) {
    for (const it of prev.items || []) {
      if (!isStockItem(it, prev)) continue;
      const key = stockKey(it);
      if (!key || key === '|') continue;
      prevQtyByKey.set(key, (prevQtyByKey.get(key) || 0) + (Number(it.quantity) || 0));
    }
  }

  const newQtyByKey = new Map<string, number>();
  for (const it of outItems) {
    if (!isStockItem(it, inv)) continue;
    const key = stockKey(it);
    if (!key || key === '|') continue;
    newQtyByKey.set(key, (newQtyByKey.get(key) || 0) + (Number(it.quantity) || 0));
  }

  const deltaByKey = new Map<string, { delta: number; sample: InvoiceItem }>();
  for (const [key, newQty] of newQtyByKey) {
    const prevQty = prevQtyByKey.get(key) || 0;
    const delta = newQty - prevQty;
    if (delta !== 0) {
      const sample = outItems.find(it => isStockItem(it, inv) && stockKey(it) === key);
      if (sample) deltaByKey.set(key, { delta, sample });
    }
  }

  for (const [key, { delta, sample }] of deltaByKey) {
    const itemId = ensureItem(sample, inv, whs);
    if (!itemId) continue;
    try {
      whs.addMovement({
        itemId, type: (delta > 0 ? 'in' : 'out') as any, quantity: Math.abs(delta) * uomFactor(sample.category || inv.category, sample.unit || '', (sample as any).unitWeight),
        unitPrice: (() => { const f = uomFactor(sample.category || inv.category, sample.unit || '', (sample as any).unitWeight); return f > 0 ? (Number(sample.unitPrice) || 0) / f : 0; })(),
        reason: 'purchase',
        date: inv.deliveryDate || inv.date || '',
        partyId: inv.partyId || '',
        notes: `فاکتور ${inv.number || ''}${sample.description ? ' — ' + sample.description : ''}`,
        sourceModule: 'tra', sourceId: inv.id,
        
        expiryDate: sample.expiryDate,
      } as any);
    } catch (e) {
      console.error('[applyInvoiceStock] addMovement failed:', e);
      continue;
    }
    for (const it of outItems) {
      if (isStockItem(it, inv) && stockKey(it) === key) {
        it.stockItemId = itemId;
      }
    }
  }

  return outItems;
}
