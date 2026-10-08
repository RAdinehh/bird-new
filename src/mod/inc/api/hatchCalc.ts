/**
 * api/hatchCalc.ts — توابع محاسباتی خالص ماژول هچ
 */

export interface CandlingLike {
  eggEntryId: string;
  stage: number;
  alive: number | null;
  infertile: number | null;
  dead: number | null;
  broken: number | null;
}

export interface FertileResult {
  fertile: number;
  totalLoss: number;
  byStage: { stage: number; alive: number; infertile: number; dead: number; broken: number }[];
}

/**
 * نطفه‌دار فعلی = کل تخم − مجموع همه تلفات کندلینگ‌ها
 */
export function calcCurrentFertile(
  entryId: string,
  entryTotal: number,
  allCandlings: CandlingLike[],
): FertileResult {
  const myCandlings = allCandlings
    .filter(c => c.eggEntryId === entryId)
    .sort((a, b) => a.stage - b.stage);

  let totalInfertile = 0;
  let totalDead = 0;
  let totalBroken = 0;

  const byStage = myCandlings.map(c => {
    totalInfertile += c.infertile || 0;
    totalDead += c.dead || 0;
    totalBroken += c.broken || 0;
    return {
      stage: c.stage,
      alive: c.alive || 0,
      infertile: c.infertile || 0,
      dead: c.dead || 0,
      broken: c.broken || 0,
    };
  });

  const totalLoss = totalInfertile + totalDead + totalBroken;

  return {
    fertile: Math.max(0, entryTotal - totalLoss),
    totalLoss,
    byStage,
  };
}

/**
 * نرخ هچ بر اساس نطفه‌داری — اگه نطفه‌داری پایین باشه، نرخ هچ هم کمتر
 */
export function smartHatchRate(fertilityRate: number): number {
  if (fertilityRate >= 92) return 0.94;
  if (fertilityRate >= 85) return 0.92;
  if (fertilityRate >= 75) return 0.88;
  if (fertilityRate >= 65) return 0.83;
  return 0.78;
}

/**
 * محاسبه هچ‌شده تخمینی از کندلینگ
 */
export function estimateHatched(
  aliveAfter: number,
  entryTotal: number,
  losses: { ds: number; pp: number; uh: number; ot: number },
): number {
  const fertility = entryTotal > 0 ? (aliveAfter / entryTotal * 100) : 0;
  const rate = smartHatchRate(fertility);
  const fromAlive = Math.round(aliveAfter * rate);
  const lossesSum = losses.ds + losses.pp + losses.uh + losses.ot;
  return Math.max(0, fromAlive - lossesSum);
}
