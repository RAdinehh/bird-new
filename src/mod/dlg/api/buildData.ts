/**
 * api/buildData.ts — ساخت آبجکت DailyLog از فرم
 *
 * تابع خالص — همه‌چیز رو پارامتر می‌گیره.
 */
import type { DailyLog, Vaccine, Medication } from '../store';
import type { F } from '../types';

export interface BuildDataInput {
  form: F;
  processedVaccines: Vaccine[];
  processedMedications: Medication[];
  feedMovementIds: string[];
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
  const { form, processedVaccines, processedMedications, feedMovementIds } = input;

  const feedAmt = num(form.feedAmount);

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
    temperature: calcTemp,
    temperatureMin: tMin,
    temperatureMax: tMax,
    humidity: calcHumidity,
    humidityMin: hMin,
    humidityMax: hMax,
    ventilation: form.ventilation,
    litter: form.litter,
    lightHours: int(form.lightHours),
    behavior: form.behavior,
    distribution: form.distribution,
    appearance: form.appearance.trim(),
    sound: form.sound,
    feedType: form.feedType.trim(),
    feedAmount: feedAmt,
    feedRemaining: num(form.feedRemaining),
    feedSourceType: form.feedSourceType,
    feedSourceId: form.feedSourceId,
    feedMovementIds,
    feedMethod: form.feedMethod,
    waterMethod: form.waterMethod,
    waterAmount: calcWater,
    waterFillCount: int(form.waterFillCount),
    waterFillVolume: num(form.waterFillVolume),
    eatingEggs: int(form.eatingEggs),
    fertileEggs: int(form.fertileEggs),
    brokenEggs: int(form.brokenEggs),
    otherEggs: int(form.otherEggs),
    brokenTarget: (form as any).brokenTarget || 'consumption',
    otherTarget: (form as any).otherTarget || 'consumption',
    eggsCount: int(form.eatingEggs),
    dirtyEggs: int(form.otherEggs),
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
