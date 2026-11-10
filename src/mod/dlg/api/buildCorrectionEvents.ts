/**
 * buildCorrectionEvents.ts — ساخت DlgEvent از تغییرات ویرایش
 * خالص (الگوی extractEvents)
 */
import type { DailyLog } from '../store';
import type { DlgEvent } from '../types-events';

const NUMERIC_FIELDS = [
  'temperature', 'temperatureMin', 'temperatureMax',
  'humidity', 'humidityMin', 'humidityMax',
  'feedDelivered', 'feedRemaining',
  'waterAmount', 'deathsCount',
  'eatingEggs', 'fertileEggs', 'brokenEggs', 'otherEggs',
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
  for (const field of NUMERIC_FIELDS) {
    const before = (oldLog as any)[field] ?? null;
    const after = (newData as any)[field] ?? null;
    if (before !== after && (before !== null || after !== null)) {
      out.push({ ...base, field, before, after });
    }
  }
  return out;
}
