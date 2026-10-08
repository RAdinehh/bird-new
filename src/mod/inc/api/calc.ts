/**
 * api/calc.ts — توابع محاسباتی خالص ماژول جوجه‌کشی
 *
 * همه تابع‌ها pure هستن. هیچ وابستگی به React یا store ندارن.
 */

export interface CandlingLike {
  id: string;
  eggEntryId: string;
  stage: number;
  alive?: number | null;
  infertile?: number | null;
  dead?: number | null;
  broken?: number | null;
}

export interface AvailableBase {
  base: number;
  source: string;
}

/** مبنای تعداد تخم برای این مرحله (از مرحله قبل یا کل ورودی) */
export function calcAvailableBase(
  entryId: string,
  currentStage: number,
  excludeCandlingId: string | null,
  allCandlings: CandlingLike[],
  entryTotal: number,
): AvailableBase {
  const myCandlings = allCandlings
    .filter(c => c.eggEntryId === entryId)
    .filter(c => !excludeCandlingId || c.id !== excludeCandlingId)
    .sort((a, b) => a.stage - b.stage);

  const prevs = myCandlings.filter(c => c.stage < currentStage);
  if (prevs.length === 0) {
    return { base: entryTotal, source: 'کل ورودی' };
  }
  const prev = prevs[prevs.length - 1];
  return { base: prev.alive || 0, source: 'مرحله ' + prev.stage };
}

export interface Aggregate {
  alive: number;
  infertile: number;
  dead: number;
  broken: number;
}

/** تجمیع مجموع کندلینگ‌ها */
export function aggregateCandlings(list: CandlingLike[]): Aggregate {
  return list.reduce(
    (acc, c) => ({
      alive: acc.alive + (c.alive || 0),
      infertile: acc.infertile + (c.infertile || 0),
      dead: acc.dead + (c.dead || 0),
      broken: acc.broken + (c.broken || 0),
    }),
    { alive: 0, infertile: 0, dead: 0, broken: 0 },
  );
}

export interface CandlingSummary {
  totalAlive: number;
  totalInfertile: number;
  totalDead: number;
  totalBroken: number;
  grandTotal: number;
  fertilePercent: number;
  lossPercent: number;
}

/** خلاصه‌ی کل کندلینگ‌ها — با محاسبه‌ی مبنای هر مرحله */
export function calcSummary(
  candlings: CandlingLike[],
  entryTotalMap: Record<string, number>,
): CandlingSummary {
  const allData = candlings.map(c => {
    const entryTotal = entryTotalMap[c.eggEntryId] || 0;
    const baseInfo = calcAvailableBase(c.eggEntryId, c.stage, c.id, candlings, entryTotal);
    const inf = c.infertile || 0;
    const dead = c.dead || 0;
    const brk = c.broken || 0;
    const alive = Math.max(0, (baseInfo.base || 0) - inf - dead - brk);
    return { alive, inf, dead, brk };
  });

  const totalAlive = allData.reduce((a, x) => a + x.alive, 0);
  const totalInfertile = allData.reduce((a, x) => a + x.inf, 0);
  const totalDead = allData.reduce((a, x) => a + x.dead, 0);
  const totalBroken = allData.reduce((a, x) => a + x.brk, 0);
  const grandTotal = totalAlive + totalInfertile + totalDead + totalBroken;
  const fertilePercent = grandTotal > 0 ? (totalAlive / grandTotal * 100) : 0;
  const lossPercent = grandTotal > 0 ? ((totalInfertile + totalDead + totalBroken) / grandTotal * 100) : 0;

  return {
    totalAlive, totalInfertile, totalDead, totalBroken,
    grandTotal, fertilePercent, lossPercent,
  };
}
