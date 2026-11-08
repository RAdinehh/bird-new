/**
 * api/checkStock.ts — چک موجودی انبار برای ثبت روزانه
 *
 * تابع خالص (pure) — بدون وابستگی به React یا store.
 */
import type { Item } from '../../whs/store';
import { UNIT_LABEL } from '../../whs/store';
import { toEn } from '../../../shr/utils/fa';

export interface StockShortage {
  name: string;
  need: number;
  have: number;
  unit: string;
}

const parseNum = (s: string | number | null | undefined): number | null => {
  if (s === null || s === undefined || s === '') return null;
  if (typeof s === 'number') return s;
  const n = parseFloat(toEn(String(s)).replace('٫', '.'));
  return isNaN(n) ? null : n;
};

interface CheckStockInput {
  vaccines: { itemId?: string; quantity?: number | null }[];
  medications: { itemId?: string; quantity?: number | null }[];
  feedSourceType: string;
  feedSourceId: string;
  feedDelivered: string | number | null;
  whsItems: Item[];
  formulas?: { id: string; name: string; lines: { ingredientId: string; percent: number }[] }[];
  ingredients?: { id: string; stockItemId: string; name: string }[];
}

export function checkStock(params: CheckStockInput): StockShortage[] {
  const { vaccines, medications, feedSourceType, feedSourceId, feedDelivered, whsItems, formulas, ingredients } = params;
  const list: StockShortage[] = [];

  const check = (itemId: string | undefined, qty: number | null | undefined) => {
    if (!itemId || !qty || qty <= 0) return;
    const it = whsItems.find(x => x.id === itemId);
    if (!it) return;
    if (it.currentStock < qty) {
      list.push({
        name: it.name,
        need: qty,
        have: it.currentStock,
        unit: UNIT_LABEL[it.unit] || '',
      });
    }
  };

  vaccines.forEach(v => check(v.itemId, v.quantity));
  medications.forEach(m => check(m.itemId, m.quantity));

  if (feedSourceType === 'item' && feedSourceId) {
    check(feedSourceId, parseNum(feedDelivered));
  }

  if (feedSourceType === 'formula' && feedSourceId) {
    const formula = formulas?.find(f => f.id === feedSourceId);
    const delivered = parseNum(feedDelivered);
    if (formula && delivered && delivered > 0) {
      for (const line of formula.lines) {
        const ing = ingredients?.find(i => i.id === line.ingredientId);
        if (!ing || !ing.stockItemId) continue;
        const qty = (line.percent / 100) * delivered;
        check(ing.stockItemId, qty);
      }
    }
  }

  return list;
}
