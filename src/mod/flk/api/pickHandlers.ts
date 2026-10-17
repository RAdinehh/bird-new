/**
 * pickHandlers.ts — منطق auto-fill فرم گله از فاکتور خرید / هچ
 * جدا شده از FlocksModal برای تست‌پذیری.
 */
import type { Invoice, InvoiceItem } from '../../tra/store';
import type { HatchResult, EggEntry } from '../../inc/store';
import { toFa } from '../../../shr/utils/fa';
import type { F } from '../types-flocks';

export function applyInvoiceToForm(form: F, inv: Invoice): Partial<F> | null {
  const birdItems = (inv.items || []).filter((it: InvoiceItem) => it.birdId);
  if (!birdItems.length) return null;

  const totalQty = birdItems.reduce((s, it) => s + (it.quantity || 0), 0);
  const firstBird = birdItems[0];
  const updates: Partial<F> = {
    initialCount: toFa(totalQty),
    currentCount: toFa(totalQty),
    purchaseDate: inv.date || '',
    birdId: firstBird.birdId || '',
    breedId: firstBird.breedId || '',
    sourceInvoiceId: inv.id,
  };
  if (firstBird.unitPrice) updates.purchasePrice = toFa(firstBird.unitPrice);
  if (firstBird.maleCount) updates.maleCount = toFa(firstBird.maleCount);
  if (firstBird.femaleCount) updates.femaleCount = toFa(firstBird.femaleCount);
  return updates;
}

export function applyHatchToForm(form: F, h: HatchResult, entry: EggEntry | null): Partial<F> {
  const updates: Partial<F> = {
    initialCount: toFa(h.hatched || 0),
    currentCount: toFa(h.hatched || 0),
    hatchDate: h.date || '',
    hatchId: h.id,
  };
  if (entry?.birdId) updates.birdId = entry.birdId;
  if (entry?.breedId) updates.breedId = entry.breedId;
  if (h.maleCount && h.maleCount > 0) updates.maleCount = toFa(h.maleCount);
  if (h.femaleCount && h.femaleCount > 0) updates.femaleCount = toFa(h.femaleCount);
  if (entry?.unitPrice && entry.unitPrice > 0) updates.purchasePrice = toFa(entry.unitPrice);
  return updates;
}
