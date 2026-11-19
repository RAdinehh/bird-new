import type { Item, Movement } from './store';

export interface MovementSplitResult {
  toArchive: Movement[];
  keep: Movement[];
  skipped: Movement[];
}

export interface MovementArchiveOptions {
  cutoffIso?: string;
  keepReasons?: Movement['reason'][];
}

const DEFAULT_KEEP_REASONS: Movement['reason'][] = [];

/**
 * تفکیک خالص حرکات انبار پیش از انتقال به مخزن whs_moves بر اساس مرز نقطه تراز (cutoffIso).
 * حرکات جدیدتر از cutoffIso (یا بدون تاریخ مشخص وقتی cutoffIso تنظیم شده) در keep می‌مانند
 * تا ترتیب زمانی محاسبه موجودی و میانگین موزون در hot مخدوش نشود.
 */
export function splitMovementsForArchive(
  movements: Movement[],
  _items: Item[],
  opts: MovementArchiveOptions = {}
): MovementSplitResult {
  const toArchive: Movement[] = [];
  const keep: Movement[] = [];
  const skipped: Movement[] = [];
  const keepReasons = new Set<Movement['reason']>(opts.keepReasons ?? DEFAULT_KEEP_REASONS);

  for (const mv of movements) {
    if (!mv || !mv.id || !mv.itemId) {
      skipped.push(mv);
      continue;
    }
    if (keepReasons.has(mv.reason)) {
      keep.push(mv);
      continue;
    }
    if (opts.cutoffIso) {
      const marker = mv.createdAt || mv.date || '';
      if (!marker || marker > opts.cutoffIso) {
        keep.push(mv);
        continue;
      }
    }
    toArchive.push(mv);
  }

  return { toArchive, keep, skipped };
}

/**
 * محاسبه نقطه تراز (Balance Checkpoint) پس از انتقال حرکات آرشیوشده به مخزن سرد.
 * اثر حرکات منتقل‌شده به ترتیب زمانی روی initialStock و initialStockByLocation تثبیت می‌شود
 * تا بازمحاسبه از روی حرکات باقی‌مانده در hot موجودی و میانگین یکسان تولید کند.
 */
export function applyMovementCheckpoint(item: Item, archivedMoves: Movement[]): Item {
  if (!archivedMoves.length) return item;

  const sorted = [...archivedMoves].sort((a, b) =>
    (a.createdAt || a.date || '').localeCompare(b.createdAt || b.date || '')
  );

  let stock = item.initialStock ?? 0;
  let avg = item.avgPrice ?? item.lastPrice ?? 0;
  let lastPrice = item.lastPrice ?? 0;
  const byLoc: Record<string, number> = {
    ...(item.initialStockByLocation ?? { stock: item.initialStock ?? 0 }),
  };

  for (const m of sorted) {
    const loc = m.locationId || 'stock';
    const curLoc = byLoc[loc] ?? 0;
    if (m.type === 'in') {
      if (m.unitPrice > 0 && stock + m.quantity > 0) {
        avg = (stock * avg + m.quantity * m.unitPrice) / (stock + m.quantity);
      }
      stock += m.quantity;
      byLoc[loc] = curLoc + m.quantity;
      if (m.unitPrice > 0) lastPrice = m.unitPrice;
    } else if (m.type === 'out') {
      stock -= m.quantity;
      byLoc[loc] = curLoc - m.quantity;
    } else {
      stock = m.quantity;
      byLoc[loc] = m.quantity;
    }
  }

  const totalLocStock = Object.values(byLoc).reduce((sum, v) => sum + v, 0);
  const nextInitialStock = Math.round(stock * 1000) / 1000;
  const nextByLoc: Record<string, number> = {};
  for (const [k, v] of Object.entries(byLoc)) {
    nextByLoc[k] = Math.round(v * 1000) / 1000;
  }

  return {
    ...item,
    initialStock: nextInitialStock,
    initialStockByLocation: nextByLoc,
    currentStock: item.currentStock ?? Math.round(totalLocStock * 1000) / 1000,
    avgPrice: Math.round(avg * 100) / 100,
    lastPrice,
  };
}
