/**
 * extractEvents.ts — استخراج DlgEvent[] از یک DailyLog
 * خالص — id/createdAt رو از بیرون می‌گیره (الگوی buildData)
 */
import type { DailyLog } from '../store';
import type { DlgEvent, DlgEventType, DlgReadingField, DlgEggField } from '../types-events';

type WithoutId = Omit<DlgEvent, 'id' | 'logId' | 'createdAt'>;

export function extractEvents(log: DailyLog): WithoutId[] {
  const out: WithoutId[] = [];
  const base = {
    logId: log.id,
    date: log.date,
    entryTime: log.entryTime,
    version: 16,
  };

  // create — همیشه
  out.push({ ...base, type: 'create' as DlgEventType });

  // reading: دما/رطوبت
  const readings: { field: DlgReadingField; value: number | null }[] = [
    { field: 'temperature',    value: log.temperature },
    { field: 'temperatureMin', value: log.temperatureMin },
    { field: 'temperatureMax', value: log.temperatureMax },
    { field: 'humidity',       value: log.humidity },
    { field: 'humidityMin',    value: log.humidityMin },
    { field: 'humidityMax',    value: log.humidityMax },
  ];
  for (const r of readings) {
    if (r.value !== null && r.value !== undefined) {
      out.push({ ...base, type: 'reading', field: r.field, value: r.value });
    }
  }

  // feed
  if (log.feedDelivered !== null && log.feedDelivered !== undefined) {
    out.push({ ...base, type: 'feed', amount: log.feedDelivered, unit: 'kg' });
  }

  // water
  if (log.waterAmount !== null && log.waterAmount !== undefined) {
    out.push({ ...base, type: 'water', amount: log.waterAmount, unit: 'L' });
  }

  // death
  for (const d of log.deaths || []) {
    if ((d.count ?? 0) > 0) {
      out.push({ ...base, type: 'death', count: d.count as number, cause: d.cause, notes: d.notes });
    }
  }

  // egg
  const eggs: { field: DlgEggField; value: number | null | undefined }[] = [
    { field: 'eatingEggs',  value: log.eatingEggs },
    { field: 'fertileEggs', value: log.fertileEggs },
    { field: 'brokenEggs',  value: log.brokenEggs },
    { field: 'otherEggs',   value: log.otherEggs },
  ];
  for (const e of eggs) {
    if (e.value !== null && e.value !== undefined && e.value > 0) {
      out.push({ ...base, type: 'egg', field: e.field, value: e.value });
    }
  }

  // activity
  for (const a of log.activities || []) {
    out.push({ ...base, type: 'activity' as DlgEventType, notes: a.notes || a.type || 'فعالیت' });
  }

  // vaccine
  for (const v of log.vaccines || []) {
    out.push({ ...base, type: 'vaccine', notes: v.name });
  }

  // medication
  for (const m of log.medications || []) {
    out.push({ ...base, type: 'medication', notes: m.name });
  }

  // weight
  for (const w of log.weightSamples || []) {
    if (w.weight > 0) {
      out.push({ ...base, type: 'weight', value: w.weight, unit: 'kg' });
    }
  }

  return out;
}
