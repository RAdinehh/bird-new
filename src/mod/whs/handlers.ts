import { bus } from '../../cor/events';
import { useWhs } from './store';
import type { TraInvoiceItemRef } from '../../cor/events/events';

/**
 * applyInvoiceMovements — اثر فاکتور روی انبار
 * movementId روی رفرنس items ست می‌شود (mutable ref).
 */
function applyInvoiceMovements(
  invoice: any,
  items: TraInvoiceItemRef[],
  prevItems?: TraInvoiceItemRef[],
): void {
  const whs = useWhs.getState();

  if (prevItems) {
    prevItems.forEach(it => {
      if (it.movementId) {
        try { whs.deleteMovement(it.movementId); } catch (e) {}
      }
    });
  }

  items.forEach(it => {
    // UoM: اگر baseQuantity مثبت باشد، از آن استفاده کن (مثلاً 1000 کیسه × 50kg = 50000 kg)
    const qty = (it.baseQuantity && it.baseQuantity > 0) ? it.baseQuantity : it.quantity;
    if (!it.itemId || !qty || qty <= 0) {
      it.movementId = '';
      return;
    }
    try {
      const mid = whs.addMovement({
        itemId: it.itemId,
        type: invoice.type === 'purchase' ? 'in' : 'out',
        quantity: qty,
        unitPrice: it.unitPrice || 0,
        reason: invoice.type === 'purchase' ? 'purchase' : 'sale',
        date: invoice.deliveryDate || invoice.date,
        partyId: invoice.partyId || '',
        notes: `فاکتور ${invoice.number || ''} — ${it.description || ''}`,
        expiryDate: it.expiryDate || undefined,
        flockId: it.flockId || undefined,
        sourceModule: 'tra',
        sourceId: invoice.id,
      });
      it.movementId = mid;
    } catch (e) {
      it.movementId = '';
      try { console.error('[whs] addMovement failed:', e); } catch {}
    }
  });
}

function deleteInvoiceMovements(items: TraInvoiceItemRef[]): void {
  const whs = useWhs.getState();
  items.forEach(it => {
    if (it.movementId) {
      try { whs.deleteMovement(it.movementId); } catch (e) {}
    }
  });
}

// ⚠️ Note: tra:invoice:* handlers حذف شدن — cascade از طریق applyInvoiceStock مستقیم انجام می‌شه.
// اگه روزی Event Bus واقعی لازم شد، اول تست کامل بنویس تا double application رخ نده.
export function registerWhsHandlers(): () => void {
  // No-op — هم‌اکنون هیچ event ای از tra گوش نمی‌دیم.
  // registerEggWhsHandlers برای egg:production:* استفاده می‌شه.
  return () => {};
}

// ═══════════════════════════════════════════════
// egg:production:* — cascade تخم به انبار
// ═══════════════════════════════════════════════

const EGG_NAME_MAP: Record<string, string> = {
  eating: 'تخم مرغ',
  fertile: 'تخم نطفه‌دار',
  consumption: 'تخم شکسته',
};

function ensureEggItem(kind: 'eating' | 'fertile' | 'consumption'): string {
  const name = EGG_NAME_MAP[kind];
  const whs = useWhs.getState();
  const targetCat = kind === 'consumption' ? 'broken' : 'egg';
  const found = whs.items.find((i: any) => i.category === targetCat && i.name === name);
  if (found) return found.id;
  const newId = whs.addItem({
    name,
    category: targetCat as any,
    unit: 'pcs',
    minStock: 0,
    currentStock: 0,
    lastPrice: 0,
    supplierId: '',
    expireDate: '',
    withdrawalDays: null,
    batchNo: '',
    storage: 'room',
    notes: 'ساخته‌شده خودکار توسط ماژول تخم',
  } as any);
  return newId || '';
}

function eggApplyCascade(productionId: string, p: any): void {
  const consumptionCount = (p.brokenCount || 0) + (p.softCount || 0) + (p.dirtyCount || 0);
  const whs = useWhs.getState();

  if (p.eatingCount > 0) {
    const itemId = ensureEggItem('eating');
    if (itemId) {
      const mid = useWhs.getState().addMovement({
        itemId, type: 'in', quantity: p.eatingCount, unitPrice: 0,
        reason: 'adjustment', date: p.date, partyId: '',
        notes: 'تولید تخم — خوراکی',
        flockId: p.flockId, sourceModule: 'egg', sourceId: productionId,
      });
      p.eatingMovementId = mid || '';
    }
  }
  if (p.fertileCount > 0) {
    const itemId = ensureEggItem('fertile');
    if (itemId) {
      const mid = useWhs.getState().addMovement({
        itemId, type: 'in', quantity: p.fertileCount, unitPrice: 0,
        reason: 'adjustment', date: p.date, partyId: '',
        notes: 'تولید تخم — نطفه‌دار',
        flockId: p.flockId, sourceModule: 'egg', sourceId: productionId,
      });
      p.fertileMovementId = mid || '';
    }
  }
  if (consumptionCount > 0) {
    const itemId = ensureEggItem('consumption');
    if (itemId) {
      const mid = useWhs.getState().addMovement({
        itemId, type: 'in', quantity: consumptionCount, unitPrice: 0,
        reason: 'adjustment', date: p.date, partyId: '',
        notes: 'تخم مصرفی',
        flockId: p.flockId, sourceModule: 'egg', sourceId: productionId,
      });
      p.consumptionMovementId = mid || '';
    }
  }
}

function eggDeleteCascade(prev: any): void {
  const whs = useWhs.getState();
  if (prev.eatingMovementId) { try { whs.deleteMovement(prev.eatingMovementId); } catch {} }
  if (prev.fertileMovementId) { try { whs.deleteMovement(prev.fertileMovementId); } catch {} }
  if (prev.consumptionMovementId) { try { whs.deleteMovement(prev.consumptionMovementId); } catch {} }
}

export function registerEggWhsHandlers(): () => void {
  const off1 = bus.on('egg:production:created', (data) => {
    try {
      if (!data.production) return;
      eggApplyCascade(data.prodId, data.production);
    } catch (e) { try { console.error('[whs] egg created failed:', e); } catch {} }
  });
  const off2 = bus.on('egg:production:updated', (data) => {
    try {
      if (data.prevProduction) eggDeleteCascade(data.prevProduction);
      if (data.production) eggApplyCascade(data.prodId, data.production);
    } catch (e) { try { console.error('[whs] egg updated failed:', e); } catch {} }
  });
  const off3 = bus.on('egg:production:deleted', (data) => {
    try {
      if (data.production) eggDeleteCascade(data.production);
    } catch (e) { try { console.error('[whs] egg deleted failed:', e); } catch {} }
  });
  return () => { off1(); off2(); off3(); };
}
