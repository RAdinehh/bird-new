/**
 * api/warranty.ts — محاسبه گارانتی دستگاه
 */
import { toEn } from '../../../shr/utils/fa';
import { parse as parseJ, addMonths, format as formatJ } from 'date-fns-jalali';

export interface WarrantyInfo {
  end: string;
  expired: boolean;
}

export function warrantyInfo(purchasedAt: string, months: number | null): WarrantyInfo | null {
  if (!purchasedAt || !months) return null;
  try {
    const d = parseJ(toEn(purchasedAt), 'yyyy/MM/dd', new Date());
    if (isNaN(d.getTime())) return null;
    const end = formatJ(addMonths(d, months), 'yyyy/MM/dd');
    const t = new Date();
    const today = formatJ(t, 'yyyy/MM/dd');
    return { end, expired: end < today };
  } catch { return null; }
}
