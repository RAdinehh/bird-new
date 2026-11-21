/**
 * applyCorrections — مقدار effective لاگ پس از اعمال corrections
 *
 * قواعد:
 * - corrections لغوشده نادیده گرفته می‌شوند
 * - ترتیب: قدیمی → جدید (آخرین برنده)
 * - لاگ اصلی دست‌نخورده می‌ماند (immutable)
 * - فیلدهای مشتق پس از اعمال corrections recompute می‌شوند:
 *     temperature  ← (min+max)/2 اگر min یا max تغییر کرد
 *     humidity     ← (min+max)/2 اگر min یا max تغییر کرد
 *     feedConsumed ← delivered - remaining (approximation)
 *     deaths       ← همگام با deathsCount (تک‌رکورد) یا از sum (چند‌رکورد)
 */
import type { DailyLog } from '../store';

/** مشتق: temp = (min+max)/2 اگر هر دو موجود، وگرنه مقدار تکی */
function recomputeTemperature(log: DailyLog): number | null {
  if (log.temperatureMin !== null && log.temperatureMax !== null) {
    return Math.round(((log.temperatureMin + log.temperatureMax) / 2) * 10) / 10;
  }
  return log.temperature;
}

/** مشتق: humidity = (min+max)/2 اگر هر دو موجود، وگرنه مقدار تکی */
function recomputeHumidity(log: DailyLog): number | null {
  if (log.humidityMin !== null && log.humidityMax !== null) {
    return Math.round(((log.humidityMin + log.humidityMax) / 2) * 10) / 10;
  }
  return log.humidity;
}

/**
 * مشتق: feedConsumed = delivered - remaining (approximation)
 *
 * ⚠️ source of truth دقیق در buildData (calculateFeedMetrics) است.
 * اینجا فقط برای همگام‌سازی سریع بعد از correction استفاده می‌شود.
 */
function recomputeFeedConsumed(log: DailyLog): number | null {
  if (log.feedDelivered === null || log.feedDelivered === undefined) {
    return log.feedConsumed ?? null;
  }
  const remaining = log.feedRemaining ?? 0;
  const consumed = log.feedDelivered - remaining;
  return consumed >= 0 ? Math.round(consumed * 100) / 100 : null;
}

/** مشتق: deathsCount = sum(deaths[].count) */
function sumDeathsCount(deaths: DailyLog['deaths']): number {
  return (deaths || []).reduce((a, x) => a + (x.count || 0), 0);
}


/** نرمال‌سازی ایمن آرایه‌های مصرفی DailyLog بدون تغییر در داده خام یا محاسبات */
export function normalizeDailyLog(log: DailyLog): DailyLog {
  const deaths = Array.isArray(log.deaths) ? log.deaths : [];
  const vaccines = Array.isArray(log.vaccines) ? log.vaccines : [];
  const medications = Array.isArray(log.medications) ? log.medications : [];
  const feedMovementIds = Array.isArray(log.feedMovementIds) ? log.feedMovementIds : [];
  const weightSamples = Array.isArray(log.weightSamples) ? log.weightSamples : [];

  if (
    log.deaths === deaths &&
    log.vaccines === vaccines &&
    log.medications === medications &&
    log.feedMovementIds === feedMovementIds &&
    log.weightSamples === weightSamples
  ) {
    return log;
  }

  return {
    ...log,
    deaths,
    vaccines,
    medications,
    feedMovementIds,
    weightSamples,
  };
}


const warnedMissingArrays = new Set<string>();

function warnMissingArrayOnce(logId: string, field: string): void {
  if (!import.meta.env.DEV) return;
  const key = `${logId || "unknown"}:${field}`;
  if (warnedMissingArrays.has(key)) return;
  warnedMissingArrays.add(key);
  console.warn(`[dlg:normalize] Non-array "${field}" on log "${logId || "unknown"}"`);
}

/**
 * خواندن ایمن آرایه‌های سلامت در لایه مصرف بدون دست‌زدن به داده خام یا محاسبات.
 */
export function getSafeHealthArrays(log: DailyLog): {
  deaths: DailyLog["deaths"];
  vaccines: DailyLog["vaccines"];
  medications: DailyLog["medications"];
} {
  const deaths = Array.isArray(log.deaths)
    ? log.deaths
    : (warnMissingArrayOnce(log.id, "deaths"), []);

  const vaccines = Array.isArray(log.vaccines)
    ? log.vaccines
    : (warnMissingArrayOnce(log.id, "vaccines"), []);

  const medications = Array.isArray(log.medications)
    ? log.medications
    : (warnMissingArrayOnce(log.id, "medications"), []);

  return { deaths, vaccines, medications };
}

export function applyCorrections(log: DailyLog): DailyLog {
  if (!log.corrections || log.corrections.length === 0) return normalizeDailyLog(log);

  let effective: DailyLog = { ...log };
  for (const corr of log.corrections) {
    if (corr.revoked) continue;
    effective = { ...effective, ...corr.changes };
  }

  // ═══ Recompute فیلدهای مشتق ═══

  // ۱. دما
  const tempChanged =
    effective.temperatureMin !== log.temperatureMin ||
    effective.temperatureMax !== log.temperatureMax;
  if (tempChanged) {
    effective = { ...effective, temperature: recomputeTemperature(effective) };
  }

  // ۲. رطوبت
  const humChanged =
    effective.humidityMin !== log.humidityMin ||
    effective.humidityMax !== log.humidityMax;
  if (humChanged) {
    effective = { ...effective, humidity: recomputeHumidity(effective) };
  }

  // ۳. feedConsumed
  const feedChanged =
    effective.feedDelivered !== log.feedDelivered ||
    effective.feedRemaining !== log.feedRemaining;
  if (feedChanged) {
    effective = { ...effective, feedConsumed: recomputeFeedConsumed(effective) };
  }

  // ۴. deaths ↔ deathsCount
  const deathsCountChanged = effective.deathsCount !== log.deathsCount;
  const deathsArrayChanged = (effective.deaths?.length || 0) !== (log.deaths?.length || 0);

  if (deathsCountChanged && !deathsArrayChanged) {
    const currentDeaths = effective.deaths || [];
    if (currentDeaths.length === 1) {
      // تک‌رکورد: count را همگام کن
      effective = {
        ...effective,
        deaths: [{ ...currentDeaths[0], count: effective.deathsCount }],
      };
    } else if (currentDeaths.length > 1) {
      // چند‌رکورد: از sum recompute (safety — invariant حفظ شود)
      effective = { ...effective, deathsCount: sumDeathsCount(currentDeaths) };
    }
    // currentDeaths.length === 0: مقدار corrected کاربر را حفظ کن (بدون تغییر)
  } else if (deathsArrayChanged) {
    effective = { ...effective, deathsCount: sumDeathsCount(effective.deaths) };
  }

  return effective;
}
