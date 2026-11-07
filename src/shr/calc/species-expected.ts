/**
 * species-expected.ts — آستانه‌های species-aware از standards
 *
 * وقتی context.breedKey و ageDays موجود است، تابع expected/min/max
 * را از set/standards می‌خواند و برمی‌گرداند.
 */
import type { CalcContext } from './types';
import { getThresholds } from './thresholds';
import { getStandardFor, getEffectiveGrowth, findInRange } from '../../mod/set/standards';

export interface SpeciesExpected {
  target: number | null;
  min: number | null;
  max: number | null;
  source: string;
}

export function getSpeciesExpected(
  fieldPath: string,
  ctx: CalcContext,
): SpeciesExpected | null {
  const std = getStandardFor(ctx.breedId);
  if (!std) return null;
  const source = std.nameFa || std.key;

  // ═══ FCR ═══
  if (fieldPath === 'flk.fcr' || fieldPath === 'brd.fcr') {
    const th = getThresholds(ctx);
    if (th.fcr == null || th.fcr <= 0) return null;
    return { target: th.fcr, min: th.fcr * 0.85, max: th.fcr * 1.15, source };
  }

  // ═══ ADG ═══
  if (fieldPath === 'flk.adg') {
    const th = getThresholds(ctx);
    if (th.adgG == null || th.adgG <= 0) return null;
    return { target: th.adgG, min: th.adgG * 0.85, max: th.adgG * 1.15, source };
  }

  // ═══ Humidity ═══
  if (fieldPath === 'dlg.humidity' || fieldPath === 'hal.targetHumidity') {
    const th = getThresholds(ctx);
    if (!th.humidity) return null;
    return { target: th.humidity.target, min: th.humidity.min, max: th.humidity.max, source };
  }
  if (fieldPath === 'dlg.humidityMin') {
    const th = getThresholds(ctx);
    if (!th.humidity) return null;
    return { target: th.humidity.min, min: th.humidity.min, max: th.humidity.max, source };
  }
  if (fieldPath === 'dlg.humidityMax') {
    const th = getThresholds(ctx);
    if (!th.humidity) return null;
    return { target: th.humidity.max, min: th.humidity.min, max: th.humidity.max, source };
  }

  // ═══ Feed per bird ═══
  if (fieldPath === 'feed.perBirdGramsPerDay') {
    const th = getThresholds(ctx);
    if (!th.feedPerBirdG) return null;
    return {
      target: (th.feedPerBirdG.min + th.feedPerBirdG.max) / 2,
      min: th.feedPerBirdG.min,
      max: th.feedPerBirdG.max,
      source,
    };
  }

  // ═══ Feed nutrients (from FeedRange at age) ═══
  const feedRange = findInRange(std.feed, ctx.ageDays);
  if (feedRange) {
    const nutrientMap: Record<string, number | undefined> = {
      'feed.protein': feedRange.proteinPct,
      'feed.calcium': feedRange.calciumPct,
      'feed.phosphorus': feedRange.availablePhosphorusPct,
      'feed.methionine': feedRange.methioninePct,
      'feed.lysine': feedRange.lysinePct,
      'feed.energy': feedRange.energyKcal,
    };
    const nutrient = nutrientMap[fieldPath];
    if (nutrient != null && nutrient > 0) {
      return { target: nutrient, min: nutrient * 0.9, max: nutrient * 1.1, source };
    }
    if (fieldPath === 'feed.fat' || fieldPath === 'feed.fiber' || fieldPath === 'feed.sodium') {
      return null;
    }
  }

  // ═══ Space ═══
  if (fieldPath === 'hal.density') {
    if (!std.space) return null;
    return { target: std.space.densityMax, min: std.space.densityMax * 0.7, max: std.space.densityMax, source };
  }
  if (fieldPath === 'hal.feederSpaceCm') {
    if (!std.space) return null;
    return { target: std.space.feederSpaceCm, min: std.space.feederSpaceCm * 0.9, max: std.space.feederSpaceCm * 1.1, source };
  }
  if (fieldPath === 'hal.drinkerSpaceCm') {
    if (!std.space) return null;
    return { target: std.space.drinkerSpaceCm, min: std.space.drinkerSpaceCm * 0.9, max: std.space.drinkerSpaceCm * 1.1, source };
  }

  // ═══ Production ═══
  if (fieldPath === 'flk.layingStartDay') {
    if (!std.production) return null;
    return {
      target: std.production.layingStartDay,
      min: std.production.layingStartDay * 0.9,
      max: std.production.layingStartDay * 1.15,
      source,
    };
  }
  if (fieldPath === 'flk.endOfCycleDay') {
    if (!std.production) return null;
    return {
      target: std.production.cycleDays,
      min: std.production.cycleDays * 0.9,
      max: std.production.cycleDays * 1.1,
      source,
    };
  }

  // ═══ Egg weight ═══
  if (fieldPath === 'egg.avgWeight' || fieldPath === 'inc.avgWeight') {
    if (!std.production) return null;
    const w = std.production.eggWeightG;
    return { target: w, min: w * 0.85, max: w * 1.15, source };
  }

  // ═══ Weight curve ═══
  if (fieldPath === 'dlg.weightSamples' || fieldPath === 'flk.weightGram') {
    const g = getEffectiveGrowth(ctx.breedId, ctx.ageDays);
    if (g.source === 'fallback' || g.weightG <= 0) return null;
    const isKg = fieldPath === 'dlg.weightSamples';
    const target = isKg ? g.weightG / 1000 : g.weightG;
    return { target, min: target * 0.9, max: target * 1.1, source };
  }

  // ═══ Incubation humidity ═══
  if (fieldPath === 'inc.humidity') {
    if (!std.incubation) return null;
    return {
      target: std.incubation.setterHumidity,
      min: std.incubation.setterHumidity - 5,
      max: std.incubation.setterHumidity + 10,
      source,
    };
  }

  return null;
}
