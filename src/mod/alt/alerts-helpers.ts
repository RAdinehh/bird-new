/**
 * alerts-helpers.ts — تایپ و توابع کمکی مشترک alerts
 * جدا شده از rules.ts
 */
import { format as formatJ, startOfDay, parse as parseJ } from 'date-fns-jalali';
import type { AlertLevel, AlertCategory } from './store';

export interface RuleAlert {
  level: AlertLevel;
  category: AlertCategory;
  title: string;
  message: string;
  source: string;
  sourceId: string;
  date: string;
  notes: string;
}

export const today = () => new Date().toISOString().slice(0, 10);

/** تاریخ شمسی → Date (نرمال‌شده به 00:00 شمسی) */
export function jalaliDate(s: string): Date | null {
  if (!s) return null;
  try {
    const en = s.replace(/[۰-۹]/g, d => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d)));
    const d = parseJ(en, 'yyyy/MM/dd', new Date());
    if (isNaN(d.getTime())) return null;
    return startOfDay(d);
  } catch { return null; }
}

export const todayJalali = () => {
  const d = new Date();
  return formatJ(d, 'yyyy/MM/dd');
};
