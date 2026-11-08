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

export function applyCorrections(log: DailyLog): DailyLog {
  if (!log.corrections || log.corrections.length === 0) return log;

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
    if (currentDeaths.length === 0) {
      effective = { ...effective, deathsCount: 0 };
    } else if (currentDeaths.length === 1) {
      effective = {
        ...effective,
        deaths: [{ ...currentDeaths[0], count: effective.deathsCount }],
      };
    } else {
      // چند رکورد — نمی‌توان ساده همگام کرد؛ sum را اعمال می‌کنیم (safety)
      effective = { ...effective, deathsCount: sumDeathsCount(currentDeaths) };
    }
  } else if (deathsArrayChanged) {
    effective = { ...effective, deathsCount: sumDeathsCount(effective.deaths) };
  }

  return effective;
}
