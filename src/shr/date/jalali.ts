import { format, parse, addDays, differenceInCalendarDays } from 'date-fns-jalali';

const FA = '۰۱۲۳۴۵۶۷۸۹';

export function normalizeDigits(s: string): string {
  return String(s ?? '')
    .replace(/[۰-۹]/g, d => String(FA.indexOf(d)))
    .replace(/[٠-٩]/g, d => String('٠١٢٣٤٥٦٧٨٩'.indexOf(d)));
}

export function todayJalali(): string {
  try { return format(new Date(), 'yyyy/MM/dd'); } catch { return ''; }
}

export function currentMonth(): string {
  try { return format(new Date(), 'yyyy/MM'); } catch { return ''; }
}

export function parseJalali(s: string): Date | null {
  if (!s) return null;
  try {
    const d = parse(normalizeDigits(s), 'yyyy/MM/dd', new Date());
    return isNaN(d.getTime()) ? null : d;
  } catch { return null; }
}

export function formatJalali(d: Date): string {
  try { return format(d, 'yyyy/MM/dd'); } catch { return ''; }
}

export function addJalaliDays(dateStr: string, days: number): string {
  const b = parseJalali(dateStr);
  if (!b) return '';
  return formatJalali(addDays(b, days));
}

export function daysBetweenJalali(from: string, to: string): number | null {
  const a = parseJalali(from), b = parseJalali(to);
  if (!a || !b) return null;
  return differenceInCalendarDays(b, a);
}

export function normalizeDate(s: string): string {
  const d = parseJalali(s);
  return d ? formatJalali(d) : '';
}

export function isValidJalali(s: string): boolean {
  return parseJalali(s) !== null;
}
