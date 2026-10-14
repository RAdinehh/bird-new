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

/** 🆕 محاسبه درصد کاهش وزن تخم (استاندارد Ross: ۱۱-۱۳٪ تا روز ۱۸) */
export function calcWeightLossPct(
  initial: number | null | undefined,
  current: number | null | undefined,
): number | null {
  if (!initial || initial <= 0 || !current || current <= 0) return null;
  const pct = ((initial - current) / initial) * 100;
  return Math.round(pct * 10) / 10;
}

/** 🆕 چک در بازه بودن کاهش وزن */
export function isWeightLossInRange(
  pct: number | null,
  min = 11,
  max = 13,
): boolean {
  if (pct === null) return true;
  return pct >= min && pct <= max;
}

/** 🆕 پیدا کردن فاز انکوباسیون برای سن خاص (روز) */
export function getIncubationPhase(
  std: { incubation?: { tempProfile?: Array<{ dayFrom: number; dayTo: number; temp: number; humidity: number; label?: string }> } } | null | undefined,
  ageDays: number,
): { dayFrom: number; dayTo: number; temp: number; humidity: number; label?: string } | null {
  const profile = std?.incubation?.tempProfile;
  if (!profile || profile.length === 0) return null;
  for (const phase of profile) {
    if (ageDays >= phase.dayFrom && ageDays <= phase.dayTo) return phase;
  }
  return profile[profile.length - 1] ?? null;
}

/** 🆕 دما و رطوبت مورد انتظار برای سن خاص */
export function getExpectedTempHumidity(
  std: { incubation?: { tempProfile?: Array<{ dayFrom: number; dayTo: number; temp: number; humidity: number }> } } | null | undefined,
  ageDays: number,
): { temp: number; humidity: number } | null {
  const phase = getIncubationPhase(std, ageDays);
  if (!phase) return null;
  return { temp: phase.temp, humidity: phase.humidity };
}

/** 🆕 محدوده EST (دمای پوسته تخم) */
export function getEstRange(
  std: { incubation?: { estMinTemp?: number; estMaxTemp?: number } } | null | undefined,
): { min: number; max: number } | null {
  const inc = std?.incubation;
  if (!inc?.estMinTemp || !inc?.estMaxTemp) return null;
  return { min: inc.estMinTemp, max: inc.estMaxTemp };
}

/** 🆕 چک EST در محدوده */
export function isEstInRange(
  value: number | null | undefined,
  std: Parameters<typeof getEstRange>[0],
): boolean {
  if (value == null) return true;
  const range = getEstRange(std);
  if (!range) return true;
  return value >= range.min && value <= range.max;
}

/** 🆕 چک CO₂ زیر حد */
export function isCo2InRange(
  value: number | null | undefined,
  std: { incubation?: { co2MaxPct?: number } } | null | undefined,
): boolean {
  if (value == null) return true;
  const max = std?.incubation?.co2MaxPct;
  if (max == null) return true;
  return value <= max;
}

/** 🆕 چک O₂ بالای حد */
export function isO2InRange(
  value: number | null | undefined,
  std: { incubation?: { o2MinPct?: number } } | null | undefined,
): boolean {
  if (value == null) return true;
  const min = std?.incubation?.o2MinPct;
  if (min == null) return true;
  return value >= min;
}
