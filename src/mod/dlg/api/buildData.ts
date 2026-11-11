/**
 * api/buildData.ts — ساخت آبجکت DailyLog از فرم
 *
 * تابع خالص — همه‌چیز رو پارامتر می‌گیره.
 */
import type { DailyLog, Vaccine, Medication } from '../store';
import type { F } from '../types';
import { calculateFeedMetrics } from '../../../shr/calc/formulas/feed';

export interface BuildDataInput {
  form: F;
  processedVaccines: Vaccine[];
  processedMedications: Medication[];
  feedMovementIds: string[];
  birdAgeDays?: number | null;
  previousRemainingKg?: number | null;
  flockAliveCount?: number | null;
}

/** تبدیل رشته‌ی فارسی به عدد اعشاری */
function num(s: string): number | null {
  if (!s) return null;
  const v = parseFloat(String(s).replace(/[۰-۹]/g, d => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d))).replace('٫', '.'));
  return isNaN(v) ? null : v;
}

/** تبدیل رشته‌ی فارسی به عدد صحیح */
function int(s: string): number | null {
  if (!s) return null;
  const v = parseInt(String(s).replace(/[۰-۹]/g, d => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d))));
  return isNaN(v) ? null : v;
}

/** مجموع آب از تعداد × حجم */
function calcTotalWater(count: number | null, volume: number | null): number | null {
  if (count === null || volume === null) return null;
  return Math.round(count * volume * 100) / 100;
}

export function buildLogData(input: BuildDataInput): Omit<DailyLog, 'id' | 'status' | 'createdAt' | 'updatedAt'> {
  const { form, processedVaccines, processedMedications, feedMovementIds, birdAgeDays, previousRemainingKg, flockAliveCount } = input;

  const feedAmt = num(form.feedDelivered);

  // محاسبه feedConsumed (simple یا precision بر اساس feedMethod)
  // form.feedMethod حالا 5 مقدار calc است — نیازی به cast نیست
  const feedMethod = form.feedMethod || 'scoop';
  const feedRemainingNum = num(form.feedRemaining);
  const feedCalc = calculateFeedMetrics({
    feedMethod,
    feedDeliveredKg: feedAmt ?? 0,
    feedRemainingKg: feedRemainingNum,
    previousRemainingKg: previousRemainingKg ?? null,
    aliveCount: flockAliveCount && flockAliveCount > 0 ? flockAliveCount : 1,
  });
  const feedConsumed = feedCalc.feedConsumedKg > 0 ? feedCalc.feedConsumedKg : null;

  // آب: اگه manual و تعداد/حجم داریم، از اون حساب کن
  const calcWater = form.waterMethod === 'manual'
    ? calcTotalWater(int(form.waterFillCount), num(form.waterFillVolume)) ?? num(form.waterAmount)
    : num(form.waterAmount);

  // دما/رطوبت: میانگین از min/max یا مقدار تکی
  const tMin = num(form.temperatureMin);
  const tMax = num(form.temperatureMax);
  const hMin = num(form.humidityMin);
  const hMax = num(form.humidityMax);
  const calcTemp = (tMin !== null && tMax !== null)
    ? Math.round(((tMin + tMax) / 2) * 10) / 10
    : num(form.temperature);
  const calcHumidity = (hMin !== null && hMax !== null)
    ? Math.round(((hMin + hMax) / 2) * 10) / 10
    : num(form.humidity);

  const dCount = form.deaths.reduce((a, x) => a + (x.count || 0), 0);

  return {
    flockId: form.flockId,
    date: form.date,
    entryTime: form.entryTime,
    birdAgeDays: birdAgeDays ?? null,
    temperature: calcTemp,
    temperatureMin: tMin,
    temperatureMax: tMax,
    humidity: calcHumidity,
    humidityMin: hMin,
    humidityMax: hMax,
    ventilation: form.ventilation,
    litter: form.litter,
    behavior: form.behavior,
    distribution: form.distribution,
    appearance: form.appearance.trim(),
    sound: form.sound,
    feedType: form.feedType.trim(),
    feedDelivered: feedAmt,
    feedConsumed,
    feedRemaining: num(form.feedRemaining),
    feedSourceType: form.feedSourceType,
    feedSourceId: form.feedSourceId,
    feedMovementIds,
    feedMethod: form.feedMethod,
    waterMethod: form.waterMethod,
    feedMethodSource: form.feedMethodSource,
    waterMethodSource: form.waterMethodSource,
    feedMethodFromHall: form.feedMethodFromHall,
    waterMethodFromHall: form.waterMethodFromHall,
    waterAmount: calcWater,
    waterFillCount: int(form.waterFillCount),
    waterFillVolume: num(form.waterFillVolume),
    eatingEggs: int(form.eatingEggs),
    fertileEggs: int(form.fertileEggs),
    brokenEggs: int(form.brokenEggs),
    otherEggs: int(form.otherEggs),
    weightSamples: form.weightSamples
      .map(w => ({ id: w.id, weight: num(w.weight) || 0 }))
      .filter(w => w.weight > 0),
    weightGender: form.weightGender,
    deathsCount: dCount,
    deaths: form.deaths,
    vaccines: processedVaccines,
    medications: processedMedications,
    activities: form.activities,
    notes: form.notes.trim(),
  };
}
