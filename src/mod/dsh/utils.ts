// utils.ts — توابع کمکی Dashboard
import { format as formatJ, parse as parseJ } from 'date-fns-jalali';

export function toEnNum(s: string): number {
  return parseInt(s.replace(/[۰-۹]/g, d => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d)))) || 0;
}


export function monthKey(date: string): string {
  if (date === '' || date == null) return '';
  const parts = date.replace(/[۰-۹]/g, d => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d))).split('/');
  if (parts.length !== 3) return '';
  return parts[0] + '/' + String(parts[1]).padStart(2, '0');
}


export function currentMonth(): string {
  return formatJ(new Date(), 'yyyy/MM');
}


export function todayJalali(): string {
  return formatJ(new Date(), 'yyyy/MM/dd');
}


export function dateDiffDays(jalaliDate: string): number {
  if (jalaliDate === '' || jalaliDate == null) return 999;
  const en = jalaliDate.replace(/[۰-۹]/g, d => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d)));
  const d = parseJ(en, 'yyyy/MM/dd', new Date());
  if (isNaN(d.getTime())) return 999;
  return Math.floor((Date.now() - d.getTime()) / (1000 * 60 * 60 * 24));
}



export function fcrBg(diff: number): string {
  if (diff <= 0) return 'var(--accent-soft)';
  if (diff <= 10) return 'var(--warn-soft)';
  return 'var(--danger-soft)';
}

