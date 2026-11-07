/**
 * economics/averages.ts — میانگین مصرف روزانه و per-bird
 *
 * منابع:
 *   - logs: دان و آب روزانه (InputLog با feedConsumedKg و waterAmountL)
 *   - movements: واکسن، دارو، بستر (بر اساس quantity)
 *
 * محاسبات:
 *   avgFeedPerDayKg       = totalFeed / daysCount
 *   avgWaterPerDayL       = totalWater / daysCount
 *   avgVaccinesPerBird    = totalVaccineDoses / aliveCount
 *   avgMedicationsPerBird = totalChemicalQuantity / aliveCount
 *   avgHerbalPerBird      = totalHerbalQuantity / aliveCount
 *   avgLitterPerBirdKg    = totalLitterKg / aliveCount
 */
import type {
  AveragesParams,
  AveragesResult,
  InputItem,
} from '../types';

export function calculateAverages(params: AveragesParams): AveragesResult {
  const { logs, movements, items, flockId, aliveCount, fromDate, toDate } =
    params;

  // ═══ Filter logs
  const filteredLogs = logs.filter((l) => {
    if (fromDate && l.date < fromDate) return false;
    if (toDate && l.date > toDate) return false;
    return true;
  });

  // ═══ Totals from logs
  const totalFeed = filteredLogs.reduce((s, l) => s + l.feedConsumedKg, 0);
  const totalWater = filteredLogs.reduce((s, l) => s + l.waterAmountL, 0);
  const daysCount = new Set(filteredLogs.map((l) => l.date)).size;

  const avgFeedPerDayKg =
    daysCount > 0 ? Math.round((totalFeed / daysCount) * 100) / 100 : 0;
  const avgWaterPerDayL =
    daysCount > 0 ? Math.round((totalWater / daysCount) * 100) / 100 : 0;

  // ═══ Totals from movements
  const itemMap = new Map<string, InputItem>();
  items.forEach((i) => itemMap.set(i.id, i));

  let totalVaccines = 0;
  let totalMedications = 0;
  let totalHerbal = 0;
  let totalLitterKg = 0;
  let movementCount = 0;

  for (const m of movements) {
    if (m.reason !== 'consumption') continue;
    if (flockId && m.flockId !== flockId) continue;
    if (fromDate && m.date < fromDate) continue;
    if (toDate && m.date > toDate) continue;

    const item = itemMap.get(m.itemId);
    if (!item) continue;

    switch (item.category) {
      case 'vaccine':
        totalVaccines += m.quantity;
        break;
      case 'medicine':
        totalMedications += m.quantity;
        break;
      case 'herbal':
        totalHerbal += m.quantity;
        break;
      case 'consumable':
        totalLitterKg += m.quantity;
        break;
    }
    movementCount++;
  }

  // ═══ Per-bird
  const divisor = aliveCount > 0 ? aliveCount : 1;
  const avgVaccinesPerBird = Math.round((totalVaccines / divisor) * 100) / 100;
  const avgMedicationsPerBird =
    Math.round((totalMedications / divisor) * 100) / 100;
  const avgHerbalPerBird = Math.round((totalHerbal / divisor) * 100) / 100;
  const avgLitterPerBirdKg =
    Math.round((totalLitterKg / divisor) * 100) / 100;

  return {
    avgFeedPerDayKg,
    avgWaterPerDayL,
    totalVaccines: Math.round(totalVaccines * 100) / 100,
    totalMedications: Math.round(totalMedications * 100) / 100,
    totalHerbal: Math.round(totalHerbal * 100) / 100,
    totalLitterKg: Math.round(totalLitterKg * 100) / 100,
    avgVaccinesPerBird,
    avgMedicationsPerBird,
    avgHerbalPerBird,
    avgLitterPerBirdKg,
    daysCount,
    hasData: filteredLogs.length > 0 || movementCount > 0,
  };
}
