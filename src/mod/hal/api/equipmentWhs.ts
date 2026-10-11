/**
 * equipmentWhs.ts — سینک خودکار تجهیزات با انبار (whs)
 */
import { useWhs } from '../../whs/store';
import type { Equipment } from '../store';

/** نگاشت واحد تجهیز → واحد انبار */
function mapUnit(u: string): 'pcs' | 'kg' | 'L' {
  if (u === 'kg') return 'kg';
  if (u === 'L') return 'L';
  return 'pcs';
}

/** محاسبه تاریخ پایان گارانتی (تقریبی، ۳۰ روز/ماه) */
function warrantyUntil(purchaseDate: string, months: number | null): string {
  if (!purchaseDate || !months) return '';
  const en = purchaseDate.replace(/[۰-۹]/g, (d) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d)));
  const parts = en.split('/');
  if (parts.length !== 3) return '';
  const d = new Date(parseInt(parts[0]) + 621, parseInt(parts[1]) - 1, parseInt(parts[2]));
  if (isNaN(d.getTime())) return '';
  d.setMonth(d.getMonth() + months);
  const gy = d.getFullYear() - 621;
  const gm = String(d.getMonth() + 1).padStart(2, '0');
  const gd = String(d.getDate()).padStart(2, '0');
  return `${gy}/${gm}/${gd}`;
}

/** ساخت Item انبار از تجهیز (اگر وجود نداره) → ID */
export function ensureWhsItem(eq: Equipment): string {
  const whs = useWhs.getState();
  if (eq.warehouseItemId) {
    const existing = whs.items.find(i => i.id === eq.warehouseItemId);
    if (existing) return existing.id;
  }
  try {
    const id = whs.addItem({
      name: eq.name,
      category: 'equipment',
      unit: mapUnit(eq.unit),
      minStock: 0,
      currentStock: eq.count || 0,
      lastPrice: eq.unitPrice || 0,
      supplierId: eq.supplierId || '',
      expireDate: '',
      withdrawalDays: null,
      batchNo: '',
      storage: 'room',
      notes: '',
      purchaseDate: eq.purchasedAt || '',
      purchasePrice: (eq.count || 0) * (eq.unitPrice || 0),
      hallId: eq.hallId,
      equipmentStatus: eq.status || 'active',
      warrantyUntil: warrantyUntil(eq.purchasedAt, eq.warranty),
    });
    return id;
  } catch (err) {
    console.error('[HAL→WHS] addItem failed:', err);
    return '';
  }
}

/** آپدیت Item انبار از تجهیز (بعد از ویرایش) */
export function syncWhsItem(eq: Equipment): void {
  if (!eq.warehouseItemId) return;
  const whs = useWhs.getState();
  const existing = whs.items.find(i => i.id === eq.warehouseItemId);
  if (!existing) return;
  try {
    whs.updateItem(eq.warehouseItemId, {
      name: eq.name,
      supplierId: eq.supplierId || '',
      equipmentStatus: eq.status || 'active',
      hallId: eq.hallId,
    });
  } catch (err) {
    console.error('[HAL→WHS] updateItem failed:', err);
  }
}

/** حذف Item انبار مربوط به تجهیز */
export function removeWhsItem(eq: Equipment): void {
  if (!eq.warehouseItemId) return;
  try { useWhs.getState().deleteItem(eq.warehouseItemId); } catch {}
}
