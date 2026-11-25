import type { Invoice } from './types';

/**
 * جستجوی دوطرفه و استاندارد فاکتور خرید برای هر تجهیز
 * 1. بررسی sourceInvoiceId (با اطمینان از حذف نشدن فاکتور)
 * 2. بررسی equipmentId و warehouseItemId روی اقلام فاکتورهای خرید
 * 3. تطبیق نام برای داده‌های قدیمی (legacy fallback)
 */
export function findEquipmentPurchaseInvoice(
  invoices: Invoice[],
  eq: { id: string; name?: string; sourceInvoiceId?: string; warehouseItemId?: string }
): Invoice | undefined {
  if (eq.sourceInvoiceId) {
    const byId = invoices.find((inv) => inv.id === eq.sourceInvoiceId);
    if (byId) return byId;
  }
  const eqName = (eq.name || '').trim();
  return invoices.find(
    (inv) =>
      inv.type === 'purchase' &&
      (inv.items || []).some((it: any) =>
        it.equipmentId === eq.id ||
        (eq.warehouseItemId && (it.itemId === eq.warehouseItemId || it.stockItemId === eq.warehouseItemId)) ||
        ((it.category === 'equipment' || inv.category === 'equipment') && eqName && (it.description || '').trim() === eqName)
      )
  );
}

/**
 * جستجوی دوطرفه فاکتور خرید برای هر گله
 */
export function findFlockPurchaseInvoice(
  invoices: Invoice[],
  flock: { id: string; sourceInvoiceId?: string }
): Invoice | undefined {
  if (flock.sourceInvoiceId) {
    const byId = invoices.find((inv) => inv.id === flock.sourceInvoiceId);
    if (byId) return byId;
  }
  return invoices.find(
    (inv) =>
      inv.type === 'purchase' &&
      ((inv as any).flockId === flock.id ||
        (inv.items || []).some((it: any) => it.flockId === flock.id || it.existingFlockId === flock.id))
  );
}

/**
 * جستجوی دوطرفه فاکتور خرید برای ورود تخم نطفه‌دار
 */
export function findEggEntryPurchaseInvoice(
  invoices: Invoice[],
  entry: { id: string; sourceInvoiceId?: string }
): Invoice | undefined {
  if (entry.sourceInvoiceId) {
    const byId = invoices.find((inv) => inv.id === entry.sourceInvoiceId);
    if (byId) return byId;
  }
  return invoices.find(
    (inv) =>
      inv.type === 'purchase' &&
      (inv.items || []).some((it: any) => it.eggEntryId === entry.id)
  );
}
