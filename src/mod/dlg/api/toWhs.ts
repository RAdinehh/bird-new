/**
 * api/toWhs.ts — ساخت movementهای انبار از ثبت روزانه
 *
 * توابع خالص (pure) — هیچ وابستگی به React یا store ندارن.
 * caller وظیفه داره addMovement رو صدا بزنه و ID برگشتی رو ذخیره کنه.
 */
import type { Vaccine, Medication } from '../store';

export interface NewMovementData {
  itemId: string;
  quantity: number;
  notes: string;
}

interface FormulaLine { ingredientId: string; percent: number }
interface FormulaLike {
  id: string;
  name: string;
  lines: FormulaLine[];
}
interface IngredientLike {
  id: string;
  stockItemId: string;
  name: string;
}

/** دان: ساخت لیست movementها از فرمول یا کالای انبار */
export function buildFeedMovements(params: {
  feedSourceType: 'formula' | 'item' | '';
  feedSourceId: string;
  feedAmount: number | null;
  flockName: string;
  formulas: FormulaLike[];
  ingredients: IngredientLike[];
}): NewMovementData[] {
  const {
    feedSourceType, feedSourceId, feedAmount,
    flockName, formulas, ingredients,
  } = params;
  if (!feedSourceId || !feedAmount || feedAmount <= 0) return [];

  const result: NewMovementData[] = [];

  if (feedSourceType === 'formula') {
    const formula = formulas.find(f => f.id === feedSourceId);
    if (formula) {
      formula.lines.forEach(line => {
        const ing = ingredients.find(i => i.id === line.ingredientId);
        if (!ing || !ing.stockItemId) return;
        const qty = (line.percent / 100) * feedAmount;
        result.push({
          itemId: ing.stockItemId,
          quantity: Math.round(qty * 1000) / 1000,
          notes: `ثبت روزانه — جیره ${formula.name}`,
        });
      });
    }
  } else if (feedSourceType === 'item') {
    result.push({
      itemId: feedSourceId,
      quantity: feedAmount,
      notes: `ثبت روزانه — ${flockName}`,
    });
  }

  return result;
}

/** واکسن: ساخت movement از یک آیتم واکسن (یا null) */
export function buildVaccineMovement(v: Vaccine): NewMovementData | null {
  if (!v.itemId || !v.quantity || v.quantity <= 0) return null;
  return {
    itemId: v.itemId,
    quantity: v.quantity,
    notes: `ثبت روزانه — واکسن ${v.name || ''}`,
  };
}

/** دارو: ساخت movement از یک آیتم دارو (یا null) */
export function buildMedicationMovement(m: Medication): NewMovementData | null {
  if (!m.itemId || !m.quantity || m.quantity <= 0) return null;
  return {
    itemId: m.itemId,
    quantity: m.quantity,
    notes: `ثبت روزانه — دارو ${m.name || ''}`,
  };
}
