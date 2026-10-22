/**
 * warranty.ts — محاسبه وضعیت گارانتی تجهیزات (استاندارد SAP)
 */
import { parse as parseJ, addMonths, format as formatJ, differenceInCalendarDays, isValid } from 'date-fns-jalali';

export type WarrantyStatus = 'none' | 'active' | 'expiring' | 'expired';

export interface WarrantyInfo {
  status: WarrantyStatus;
  daysLeft: number | null;
  endDate: string | null;
}

const EXPIRING_DAYS = 30;

export function getWarrantyStatus(
  purchasedAt: string | null | undefined,
  warrantyMonths: number | null | undefined,
): WarrantyInfo {
  if (!warrantyMonths || warrantyMonths <= 0 || !purchasedAt) {
    return { status: 'none', daysLeft: null, endDate: null };
  }
  try {
    const purchase = parseJ(String(purchasedAt).replace(/-/g, '/'), 'yyyy/MM/dd', new Date());
    if (!isValid(purchase)) {
      return { status: 'none', daysLeft: null, endDate: null };
    }
    const end = addMonths(purchase, warrantyMonths);
    const daysLeft = differenceInCalendarDays(end, new Date());
    const endDate = formatJ(end, 'yyyy/MM/dd');
    let status: WarrantyStatus;
    if (daysLeft <= 0) status = 'expired';
    else if (daysLeft <= EXPIRING_DAYS) status = 'expiring';
    else status = 'active';
    return { status, daysLeft, endDate };
  } catch {
    return { status: 'none', daysLeft: null, endDate: null };
  }
}
