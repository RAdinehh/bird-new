/**
 * pickHandlers.ts — منطق auto-fill فرم گله از فاکتور خرید / هچ
 * جدا شده از FlocksModal برای تست‌پذیری.
 */
import { getGlobalFormat } from '../../../shr/units/useFormat';

import type { Invoice, InvoiceItem } from '../../tra/store';
import type { HatchResult, EggEntry } from '../../inc/store';
import { toFa, toEn } from '../../../shr/utils/fa';
import { parse as parseJ, format as formatJ, subDays, isValid } from 'date-fns-jalali';
import type { F } from '../types-flocks';

export function applyInvoiceToForm(form: F, inv: Invoice): Partial<F> | null {
  const birdItems = (inv.items || []).filter((it: InvoiceItem) => it.birdId);
  if (!birdItems.length) return null;

  const totalQty = birdItems.reduce((s, it) => s + (it.quantity || 0), 0);
  const firstBird = birdItems[0];
  const updates: Partial<F> = {
    initialCount: getGlobalFormat().raw.digits(String(totalQty), getGlobalFormat().units.numberFormat),
    currentCount: getGlobalFormat().raw.digits(String(totalQty), getGlobalFormat().units.numberFormat),
    purchaseDate: inv.date || '',
    birdId: firstBird.birdId || '',
    breedId: firstBird.breedId || '',
    sourceInvoiceId: inv.id,
  };
  if (firstBird.unitPrice) updates.purchasePrice = getGlobalFormat().raw.digits(String(firstBird.unitPrice), getGlobalFormat().units.numberFormat);
  if (firstBird.maleCount != null) updates.maleCount = getGlobalFormat().raw.digits(String(firstBird.maleCount), getGlobalFormat().units.numberFormat);
  if (firstBird.femaleCount != null) updates.femaleCount = getGlobalFormat().raw.digits(String(firstBird.femaleCount), getGlobalFormat().units.numberFormat);
  if (firstBird.unknownCount != null) updates.unknownCount = getGlobalFormat().raw.digits(String(firstBird.unknownCount), getGlobalFormat().units.numberFormat);
  // 🆕 هزینه حمل از فاکتور
  if (inv.shipping && inv.shipping > 0) updates.deliveryCost = getGlobalFormat().raw.digits(String(inv.shipping), getGlobalFormat().units.numberFormat);
  // 🆕 تاریخ شروع = تاریخ فاکتور
  // 🆕 فیکس: hatchDate از فاکتور (3 سطح fallback)
  if (firstBird.hatchDate) {
    updates.hatchDate = firstBird.hatchDate;
  } else if (firstBird.eggDate) {
    updates.hatchDate = firstBird.eggDate;
  } else if (firstBird.ageDays != null && firstBird.ageDays >= 0 && inv.date) {
    // 🆕 محاسبه hatchDate از ageDays + invoice.date
    try {
      const invDate = parseJ(toEn(inv.date), 'yyyy/MM/dd', new Date());
      if (isValid(invDate)) {
        const hatch = subDays(invDate, firstBird.ageDays);
        updates.hatchDate = formatJ(hatch, 'yyyy/MM/dd');
      }
    } catch {}
  }
  if (inv.date) updates.startDate = inv.date;
  // 🆕 فیکس: اگه هیچ‌کدوم از counts ست نشد → همه در unknownCount
  if (firstBird.maleCount == null && firstBird.femaleCount == null && firstBird.unknownCount == null) {
    updates.maleCount = '';
    updates.femaleCount = '';
    updates.unknownCount = getGlobalFormat().raw.digits(String(totalQty), getGlobalFormat().units.numberFormat);
  }

  return updates;
}

export function applyHatchToForm(form: F, h: HatchResult, entry: EggEntry | null): Partial<F> {
  const updates: Partial<F> = {
    initialCount: getGlobalFormat().raw.digits(String(h.hatched || 0), getGlobalFormat().units.numberFormat),
    currentCount: getGlobalFormat().raw.digits(String(h.hatched || 0), getGlobalFormat().units.numberFormat),
    hatchDate: h.date || '',
    hatchId: h.id,
  };
  if (entry?.birdId) updates.birdId = entry.birdId;
  if (entry?.breedId) updates.breedId = entry.breedId;
  if (h.maleCount != null) updates.maleCount = getGlobalFormat().raw.digits(String(h.maleCount), getGlobalFormat().units.numberFormat);
  if (h.femaleCount != null) updates.femaleCount = getGlobalFormat().raw.digits(String(h.femaleCount), getGlobalFormat().units.numberFormat);
  if (h.unknownCount != null) updates.unknownCount = getGlobalFormat().raw.digits(String(h.unknownCount), getGlobalFormat().units.numberFormat);

  // 🆕 اگه همه null → همه در unknownCount
  if (h.maleCount == null && h.femaleCount == null && h.unknownCount == null) {
    updates.maleCount = '';
    updates.femaleCount = '';
    updates.unknownCount = getGlobalFormat().raw.digits(String(h.hatched || 0), getGlobalFormat().units.numberFormat);
  }
  if (entry?.unitPrice && entry.unitPrice > 0) updates.purchasePrice = getGlobalFormat().raw.digits(String(entry.unitPrice), getGlobalFormat().units.numberFormat);
  return updates;
}
