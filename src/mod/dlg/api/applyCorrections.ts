/**
 * applyCorrections — مقدار effective لاگ پس از اعمال corrections
 *
 * قواعد:
 * - corrections لغوشده نادیده گرفته می‌شوند
 * - ترتیب: قدیمی → جدید (آخرین برنده)
 * - لاگ اصلی دست‌نخورده می‌ماند (immutable)
 */
import type { DailyLog } from '../store';

export function applyCorrections(log: DailyLog): DailyLog {
  if (!log.corrections || log.corrections.length === 0) return log;

  let effective: DailyLog = { ...log };
  for (const corr of log.corrections) {
    if (corr.revoked) continue;
    effective = { ...effective, ...corr.changes };
  }
  return effective;
}
