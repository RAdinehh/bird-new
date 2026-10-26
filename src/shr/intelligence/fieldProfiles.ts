/**
 * intelligence/fieldProfiles.ts — تنظیمات خودکار برای ۱۰۰+ فیلد
 *
 * این profileها از تصمیمات Q1-Q12 استخراج شده‌اند.
 * هر فیلد می‌دونه چطور بررسی بشه، بدون نیاز به تنظیم دستی.
 */
import type { FieldProfile, FieldKind } from './types';

function P(
  fieldPath: string,
  kind: FieldKind,
  hardMin: number | string,
  hardMax: number | string,
  overrides: Partial<FieldProfile> = {},
): FieldProfile {
  return {
    fieldPath,
    kind,
    hardMin,
    hardMax,
    expectedFrom: 'history_refbook',
    comparison: 'ratio',
    ...overrides,
  };
}

export const FIELD_PROFILES: Record<string, FieldProfile> = {
  // ══════════════════════════════════════════════════════════════════
  // Q1 — دان و مواد اولیه (۱۷ فیلد)
  // ══════════════════════════════════════════════════════════════════
  'feed.unitPrice': P('feed.unitPrice', 'price', 1_000, 20_000_000, {
    expectedFrom: 'history_refbook',
    structuralBreakAware: true,
  }),
  'feed.protein': P('feed.protein', 'percent', 0, 100, { expectedFrom: 'species', comparison: 'range' }),
  'feed.fat': P('feed.fat', 'percent', 0, 100, { expectedFrom: 'species', comparison: 'range' }),
  'feed.fiber': P('feed.fiber', 'percent', 0, 100, { expectedFrom: 'species', comparison: 'range' }),
  'feed.calcium': P('feed.calcium', 'percent', 0, 100, { expectedFrom: 'species', comparison: 'range' }),
  'feed.phosphorus': P('feed.phosphorus', 'percent', 0, 100, { expectedFrom: 'species', comparison: 'range' }),
  'feed.methionine': P('feed.methionine', 'percent', 0, 100, { expectedFrom: 'species', comparison: 'range' }),
  'feed.lysine': P('feed.lysine', 'percent', 0, 100, { expectedFrom: 'species', comparison: 'range' }),
  'feed.sodium': P('feed.sodium', 'percent', 0, 100, { expectedFrom: 'species', comparison: 'range' }),
  'feed.energy': P('feed.energy', 'energy', 500, 5_000, {
    expectedFrom: 'species', comparison: 'range',
    biologicalRange: { min: 2_000, max: 4_000 },
  }),
  'feed.perBirdGramsPerDay': P('feed.perBirdGramsPerDay', 'feed', 0.1, 5_000, {
    expectedFrom: 'species', comparison: 'range',
  }),
  'feed.bagWeight': P('feed.bagWeight', 'weight', 1, 100),
  'feed.bagCount': P('feed.bagCount', 'count', 1, 10_000),
  'dlg.feedAmount': P('dlg.feedAmount', 'feed', 0.1, 100_000, {
    expectedFrom: 'cross_field', comparison: 'ratio', crossFieldRule: 'feed_vs_flock',
  }),
  'dlg.feedRemaining': P('dlg.feedRemaining', 'feed', 0, 50_000, {
    expectedFrom: 'cross_field', comparison: 'ratio', crossFieldRule: 'remaining_vs_feed',
  }),
  'flk.fcr': P('flk.fcr', 'ratio', 0.5, 10, { expectedFrom: 'species', comparison: 'range' }),
  'flk.adg': P('flk.adg', 'weight', 0.01, 500, { expectedFrom: 'species', comparison: 'range' }),

  // ══════════════════════════════════════════════════════════════════
  // Q2 — تاریخ‌ها (۲۰+ فیلد) — فقط hard limits، بدون soft warning
  // ══════════════════════════════════════════════════════════════════
  'invoice.date': P('invoice.date', 'date', '-730d', '+30d', { expectedFrom: 'hard_only', comparison: 'range' }),
  'invoice.dueDate': P('invoice.dueDate', 'date', '0d', '+1825d', { expectedFrom: 'hard_only', comparison: 'range' }),
  'invoice.customDueDate': P('invoice.customDueDate', 'date', '0d', '+1825d', { expectedFrom: 'hard_only', comparison: 'range' }),
  'invoice.deliveryDate': P('invoice.deliveryDate', 'date', '0d', '+1825d', { expectedFrom: 'hard_only', comparison: 'range' }),
  'payment.date': P('payment.date', 'date', '0d', '+1825d', { expectedFrom: 'hard_only', comparison: 'range' }),
  'payment.dueDate': P('payment.dueDate', 'date', '0d', '+1825d', { expectedFrom: 'hard_only', comparison: 'range' }),
  'payment.clearedDate': P('payment.clearedDate', 'date', '-1825d', '0d', { expectedFrom: 'hard_only', comparison: 'range' }),
  'payment.bouncedDate': P('payment.bouncedDate', 'date', '-1825d', '0d', { expectedFrom: 'hard_only', comparison: 'range' }),
  'flk.hatchDate': P('flk.hatchDate', 'date', '-90d', '0d', { expectedFrom: 'hard_only', comparison: 'range' }),
  'flk.purchaseDate': P('flk.purchaseDate', 'date', '-3650d', '0d', { expectedFrom: 'hard_only', comparison: 'range' }),
  'flk.startDate': P('flk.startDate', 'date', '-3650d', '0d', { expectedFrom: 'hard_only', comparison: 'range' }),
  'flk.endDate': P('flk.endDate', 'date', '0d', '+1825d', { expectedFrom: 'hard_only', comparison: 'range' }),
  'inc.eggDate': P('inc.eggDate', 'date', '-30d', '0d', { expectedFrom: 'hard_only', comparison: 'range' }),
  'inc.entryDate': P('inc.entryDate', 'date', '-30d', '0d', { expectedFrom: 'hard_only', comparison: 'range' }),
  'inc.expectedHatchDate': P('inc.expectedHatchDate', 'date', '0d', '+56d', { expectedFrom: 'hard_only', comparison: 'range' }),
  'inc.hatchDate': P('inc.hatchDate', 'date', '0d', '+70d', { expectedFrom: 'hard_only', comparison: 'range' }),
  'whs.expireDate': P('whs.expireDate', 'date', '0d', '+3650d', { expectedFrom: 'hard_only', comparison: 'range' }),
  'whs.productionDate': P('whs.productionDate', 'date', '-3650d', '0d', { expectedFrom: 'hard_only', comparison: 'range' }),
  'whs.purchaseDate': P('whs.purchaseDate', 'date', '-3650d', '0d', { expectedFrom: 'hard_only', comparison: 'range' }),
  'whs.warrantyUntil': P('whs.warrantyUntil', 'date', '0d', '+3650d', { expectedFrom: 'hard_only', comparison: 'range' }),
  'whs.movementDate': P('whs.movementDate', 'date', '-3650d', '0d', { expectedFrom: 'hard_only', comparison: 'range' }),
  'dlg.date': P('dlg.date', 'date', '-3650d', '0d', { expectedFrom: 'hard_only', comparison: 'range' }),

  // ══════════════════════════════════════════════════════════════════
  // Q3 — دما و رطوبت (۸ فیلد)
  // ══════════════════════════════════════════════════════════════════
  'dlg.temperature': P('dlg.temperature', 'temperature', -20, 50, {
    expectedFrom: 'species_temp', comparison: 'range',
    biologicalRange: { min: 15, max: 35 },
  }),
  'dlg.temperatureMin': P('dlg.temperatureMin', 'temperature', -20, 50, {
    expectedFrom: 'species_temp', comparison: 'range',
    biologicalRange: { min: 5, max: 45 },
  }),
  'dlg.temperatureMax': P('dlg.temperatureMax', 'temperature', -20, 50, {
    expectedFrom: 'species_temp', comparison: 'range',
    biologicalRange: { min: 5, max: 45 },
  }),
  'hal.targetTemp': P('hal.targetTemp', 'temperature', 0, 100, {
    expectedFrom: 'species_temp', comparison: 'range',
    biologicalRange: { min: 15, max: 35 },
  }),
  'inc.temperature': P('inc.temperature', 'temperature', 30, 42, {
    expectedFrom: 'species_temp', comparison: 'range',
    biologicalRange: { min: 34, max: 39 },
  }),
  'dlg.humidity': P('dlg.humidity', 'humidity', 0, 100, {
    expectedFrom: 'species', comparison: 'range',
    biologicalRange: { min: 30, max: 75 },
  }),
  'dlg.humidityMin': P('dlg.humidityMin', 'humidity', 0, 100, {
    expectedFrom: 'species', comparison: 'range',
    biologicalRange: { min: 10, max: 95 },
  }),
  'dlg.humidityMax': P('dlg.humidityMax', 'humidity', 0, 100, {
    expectedFrom: 'species', comparison: 'range',
    biologicalRange: { min: 10, max: 95 },
  }),
  'hal.targetHumidity': P('hal.targetHumidity', 'humidity', 0, 100, {
    expectedFrom: 'species', comparison: 'range',
    biologicalRange: { min: 30, max: 80 },
  }),
  'inc.humidity': P('inc.humidity', 'humidity', 20, 90, {
    expectedFrom: 'species', comparison: 'range',
    biologicalRange: { min: 40, max: 80 },
  }),

  // ══════════════════════════════════════════════════════════════════
  // Q4 — آب (۳ فیلد)
  // ══════════════════════════════════════════════════════════════════
  'dlg.waterAmount': P('dlg.waterAmount', 'water', 1, 500_000, {
    expectedFrom: 'cross_field', comparison: 'ratio', crossFieldRule: 'water_vs_flock',
  }),
  'dlg.waterFillVolume': P('dlg.waterFillVolume', 'volume', 0.1, 50_000),
  'dlg.waterFillCount': P('dlg.waterFillCount', 'count', 1, 200),

  // ══════════════════════════════════════════════════════════════════
  // Q5 — تخم و هچ (۱۶ فیلد)
  // ══════════════════════════════════════════════════════════════════
  'dlg.eatingEggs': P('dlg.eatingEggs', 'egg', 0, '${femaleCount}', {
    expectedFrom: 'cross_field', comparison: 'absolute', crossFieldRule: 'lte_female',
  }),
  'dlg.fertileEggs': P('dlg.fertileEggs', 'egg', 0, '${femaleCount}', {
    expectedFrom: 'cross_field', comparison: 'absolute', crossFieldRule: 'lte_female',
  }),
  'dlg.brokenEggs': P('dlg.brokenEggs', 'egg', 0, '${femaleCount}', {
    expectedFrom: 'cross_field', comparison: 'absolute', crossFieldRule: 'lte_female',
  }),
  'dlg.otherEggs': P('dlg.otherEggs', 'egg', 0, '${femaleCount}', {
    expectedFrom: 'cross_field', comparison: 'absolute', crossFieldRule: 'lte_female',
  }),
  'egg.eatingCount': P('egg.eatingCount', 'egg', 0, '${femaleCount}', {
    expectedFrom: 'cross_field', comparison: 'absolute', crossFieldRule: 'lte_female',
  }),
  'egg.fertileCount': P('egg.fertileCount', 'egg', 0, '${femaleCount}', {
    expectedFrom: 'cross_field', comparison: 'absolute', crossFieldRule: 'lte_female',
  }),
  'egg.brokenCount': P('egg.brokenCount', 'egg', 0, '${femaleCount}', {
    expectedFrom: 'cross_field', comparison: 'absolute', crossFieldRule: 'lte_female',
  }),
  'egg.softCount': P('egg.softCount', 'egg', 0, '${femaleCount}', {
    expectedFrom: 'cross_field', comparison: 'absolute', crossFieldRule: 'lte_female',
  }),
  'egg.dirtyCount': P('egg.dirtyCount', 'egg', 0, '${femaleCount}', {
    expectedFrom: 'cross_field', comparison: 'absolute', crossFieldRule: 'lte_female',
  }),
  'inc.count': P('inc.count', 'egg', 1, '${capacity}'),
  'inc.hatched': P('inc.hatched', 'egg', 0, '${eggCount}', {
    expectedFrom: 'cross_field', comparison: 'absolute', crossFieldRule: 'lte_egg_count',
  }),
  'inc.unhatched': P('inc.unhatched', 'egg', 0, '${eggCount}', {
    expectedFrom: 'cross_field', comparison: 'absolute', crossFieldRule: 'lte_egg_count',
  }),
  'inc.deadInShell': P('inc.deadInShell', 'egg', 0, '${eggCount}', {
    expectedFrom: 'cross_field', comparison: 'absolute', crossFieldRule: 'lte_egg_count',
  }),
  'inc.pipped': P('inc.pipped', 'egg', 0, '${eggCount}', {
    expectedFrom: 'cross_field', comparison: 'absolute', crossFieldRule: 'lte_egg_count',
  }),
  'inc.other': P('inc.other', 'egg', 0, '${eggCount}', {
    expectedFrom: 'cross_field', comparison: 'absolute', crossFieldRule: 'lte_egg_count',
  }),
  'egg.avgWeight': P('egg.avgWeight', 'weight', 0.3, 2_000, { expectedFrom: 'species', comparison: 'range' }),
  'inc.avgWeight': P('inc.avgWeight', 'weight', 0.3, 2_000, { expectedFrom: 'species', comparison: 'range' }),
  'egg.hatchOfTotal': P('egg.hatchOfTotal', 'percent', 0, 100),
  'egg.hatchOfFertile': P('egg.hatchOfFertile', 'percent', 0, 100),
  'egg.chickYieldPercent': P('egg.chickYieldPercent', 'percent', 30, 85),
  'egg.henDayPercent': P('egg.henDayPercent', 'percent', 0, 100),

  // ══════════════════════════════════════════════════════════════════
  // Q6 — وزن (۴ فیلد)
  // ══════════════════════════════════════════════════════════════════
  'dlg.weightSamples': P('dlg.weightSamples', 'weight', 0.01, 250, {
    expectedFrom: 'species_curve', comparison: 'ratio', suppressIfNoHistory: false,
  }),
  'chickWeight': P('chickWeight', 'weight', 0.3, 1_200, {
    expectedFrom: 'species', comparison: 'range',
  }),
  'flk.weightGram': P('flk.weightGram', 'weight', 5, 250_000, { expectedFrom: 'species_curve', comparison: 'ratio' }),

  // ══════════════════════════════════════════════════════════════════
  // Q7 — تلفات (۵ فیلد)
  // ══════════════════════════════════════════════════════════════════
  'dlg.deathsCount': P('dlg.deathsCount', 'count', 0, '${currentCount}', {
    expectedFrom: 'cross_field', comparison: 'absolute', crossFieldRule: 'lte_current',
  }),
  'flk.mortality.daily': P('flk.mortality.daily', 'percent', 0, 100),
  'flk.mortality.weekly': P('flk.mortality.weekly', 'percent', 0, 100),
  'flk.mortality.total': P('flk.mortality.total', 'percent', 0, 100),

  // ══════════════════════════════════════════════════════════════════
  // Q8 — ظرفیت‌ها (۱۲ فیلد)
  // ══════════════════════════════════════════════════════════════════
  'flk.initialCount': P('flk.initialCount', 'count', 1, 1_000_000),
  'flk.currentCount': P('flk.currentCount', 'count', 0, 1_000_000),
  'hal.capacity': P('hal.capacity', 'capacity', 1, 1_000_000),
  'hal.areaSqM': P('hal.areaSqM', 'area', 1, 50_000),
  'hal.zoneCapacity': P('hal.zoneCapacity', 'capacity', 1, 200_000, {
    expectedFrom: 'cross_field', comparison: 'absolute', crossFieldRule: 'lte_hall',
  }),
  'hal.equipCount': P('hal.equipCount', 'count', 1, 500),
  'inc.capacity': P('inc.capacity', 'capacity', 1, 200_000),
  'inc.racks': P('inc.racks', 'count', 1, 50),
  'inc.trays': P('inc.trays', 'count', 1, 500),
  'inc.fans': P('inc.fans', 'count', 1, 30),
  'inc.motorPower': P('inc.motorPower', 'energy', 10, 10_000),
  'inc.tempSensors': P('inc.tempSensors', 'count', 1, 50),
  'inc.humiditySensors': P('inc.humiditySensors', 'count', 1, 30),

  // ══════════════════════════════════════════════════════════════════
  // Q9 — تراکم (۳ فیلد)
  // ══════════════════════════════════════════════════════════════════
  'hal.density': P('hal.density', 'density', 0.001, 300, {
    expectedFrom: 'species', comparison: 'range',
  }),
  'hal.feederSpaceCm': P('hal.feederSpaceCm', 'density', 1, 100, { expectedFrom: 'species', comparison: 'range' }),
  'hal.drinkerSpaceCm': P('hal.drinkerSpaceCm', 'density', 0.5, 50, { expectedFrom: 'species', comparison: 'range' }),

  // ══════════════════════════════════════════════════════════════════
  // Q10 — دارو (۹ فیلد)
  // ══════════════════════════════════════════════════════════════════
  'dlg.dose': P('dlg.dose', 'volume', 0.01, 100, {
    expectedFrom: 'cross_field', comparison: 'ratio', crossFieldRule: 'dose_vs_flock',
  }),
  'whs.dosePerBird': P('whs.dosePerBird', 'volume', 0.01, 100),
  'whs.withdrawalDays': P('whs.withdrawalDays', 'duration', 0, 90),
  'dlg.withdrawalDays': P('dlg.withdrawalDays', 'duration', 0, 90),
  'whs.qty_ml': P('whs.qty_ml', 'volume', 1, 100_000),
  'whs.qty_L': P('whs.qty_L', 'volume', 0.1, 1_000),
  'whs.qty_vial': P('whs.qty_vial', 'count', 1, 2_000),
  'whs.qty_pack': P('whs.qty_pack', 'count', 1, 1_000),
  'whs.qty_pcs': P('whs.qty_pcs', 'count', 1, 50_000),
  'whs.qty_g': P('whs.qty_g', 'weight', 1, 100_000),
  'whs.qty_kg': P('whs.qty_kg', 'weight', 0.5, 1_000),
  'whs.qty_ampoule': P('whs.qty_ampoule', 'count', 1, 2_000),
  'whs.qty_m': P('whs.qty_m', 'count', 0.1, 10_000),

  // ══════════════════════════════════════════════════════════════════
  // Q11 — گله و قیمت (۱۴ فیلد)
  // ══════════════════════════════════════════════════════════════════
  'flk.maleCount': P('flk.maleCount', 'count', 0, '${initialCount}', {
    expectedFrom: 'cross_field', comparison: 'absolute', crossFieldRule: 'lte_initial_sum',
  }),
  'flk.femaleCount': P('flk.femaleCount', 'count', 0, '${initialCount}', {
    expectedFrom: 'cross_field', comparison: 'absolute', crossFieldRule: 'lte_initial_sum',
  }),
  'flk.unknownCount': P('flk.unknownCount', 'count', 0, '${initialCount}', {
    expectedFrom: 'cross_field', comparison: 'absolute', crossFieldRule: 'lte_initial_sum',
  }),
  'flk.layingStartDay': P('flk.layingStartDay', 'age', 100, 1_000, { expectedFrom: 'species', comparison: 'range' }),
  'flk.endOfCycleDay': P('flk.endOfCycleDay', 'age', 365, 1_825, { expectedFrom: 'species', comparison: 'range' }),
  'flk.purchasePrice': P('flk.purchasePrice', 'price', 1_000, 300_000_000, {
    expectedFrom: 'history_refbook', structuralBreakAware: true,
  }),
  'flk.deliveryCost': P('flk.deliveryCost', 'price', 1_000, 50_000_000_000, {
    expectedFrom: 'history_refbook', structuralBreakAware: true,
  }),
  'flk.otherCosts': P('flk.otherCosts', 'price', 1_000, 50_000_000_000, {
    expectedFrom: 'history_refbook', structuralBreakAware: true,
  }),
  'flk.rentAmount': P('flk.rentAmount', 'price', 100_000, 500_000_000_000, {
    expectedFrom: 'history', structuralBreakAware: true,
  }),

  // قیمت‌های فاکتور (به تفکیک دسته)
  'tra.price_chick': P('tra.price_chick', 'price', 1_000, 30_000_000, { structuralBreakAware: true }),
  'tra.price_adult': P('tra.price_adult', 'price', 1_000, 50_000_000, { structuralBreakAware: true }),
  'tra.price_egg': P('tra.price_egg', 'price', 1_000, 10_000_000, { structuralBreakAware: true }),
  'tra.price_fertile_egg': P('tra.price_fertile_egg', 'price', 1_000, 10_000_000, { structuralBreakAware: true }),
  'tra.price_medicine': P('tra.price_medicine', 'price', 1_000, 200_000_000, { structuralBreakAware: true }),
  'tra.price_equipment': P('tra.price_equipment', 'price', 1_000, 20_000_000_000, { structuralBreakAware: true }),
  'tra.price_other': P('tra.price_other', 'price', 1_000, 5_000_000_000, { structuralBreakAware: true }),
  'tra.price_broken': P('tra.price_broken', 'price', 1_000, 5_000_000, { structuralBreakAware: true }),
  'tra.price_manure': P('tra.price_manure', 'price', 1_000, 5_000_000, { structuralBreakAware: true }),
  'brd.fcr': P('brd.fcr', 'ratio', 0.5, 5, { expectedFrom: 'species', comparison: 'range' }),

  // ══════════════════════════════════════════════════════════════════
  // Q12 — شراکت (۵ فیلد)
  // ══════════════════════════════════════════════════════════════════
  'flk.partnerPercent': P('flk.partnerPercent', 'percent', 0, 100, {
    expectedFrom: 'user_pattern', comparison: 'deviation',
  }),
  'inc.partnerPercent': P('inc.partnerPercent', 'percent', 0, 100, {
    expectedFrom: 'user_pattern', comparison: 'deviation',
  }),
  'inc.consigneePercent': P('inc.consigneePercent', 'percent', 0, 100, {
    expectedFrom: 'user_pattern', comparison: 'deviation',
  }),
  'inc.rentAmount': P('inc.rentAmount', 'price', 1_000, 50_000_000_000, {
    expectedFrom: 'history', structuralBreakAware: true,
  }),
};

export function getProfile(fieldPath: string): FieldProfile | null {
  return FIELD_PROFILES[fieldPath] ?? null;
}
