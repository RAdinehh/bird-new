/**
 * buildCorrectionEvents.ts — ساخت DlgEvent از تغییرات ویرایش
 * خالص (الگوی extractEvents)
 *
 * استاندارد: 21 CFR Part 11 §11.10(e) — همه فیلدهای قابل اصلاح باید Audit Trail داشته باشند
 */
import type { DailyLog } from '../store';
import type { DlgEvent } from '../types-events';

/** لیست کامل فیلدهای قابل اصلاح — همگام با CORRECTABLE_FIELDS در CorrectionModal.tsx */
const CORRECTABLE_FIELDS = [
  // محیط
  'temperature', 'temperatureMin', 'temperatureMax',
  'humidity', 'humidityMin', 'humidityMax',
  // تغذیه و آب
  'feedDelivered', 'feedRemaining', 'feedWaste',
  'waterAmount', 'waterFillCount', 'waterFillVolume',
  // تولید
  'deathsCount',
  'eatingEggs', 'fertileEggs', 'brokenEggs', 'otherEggs',
  'weightGender',
] as const;

export function buildCorrectionEvents(
  oldLog: DailyLog,
  newData: Partial<DailyLog>,
  reason: string,
): Omit<DlgEvent, 'id' | 'logId' | 'createdAt'>[] {
  const out: Omit<DlgEvent, 'id' | 'logId' | 'createdAt'>[] = [];
  const base: any = {
    logId: oldLog.id,
    date: oldLog.date,
    entryTime: oldLog.entryTime,
    type: 'correction' as const,
    reason,
    reasonCode: 'data_entry_error' as const,
    version: 16,
  };
  for (const field of CORRECTABLE_FIELDS) {
    const before = (oldLog as any)[field] ?? null;
    const after = (newData as any)[field] ?? null;
    // skip اگر هیچ تغییری نبوده (جلوگیری از رکوردهای بی‌معنی)
    if (before === after) continue;
    if (before !== null || after !== null) {
      out.push({ ...base, field, before, after });
    }
  }
  return out;
}
