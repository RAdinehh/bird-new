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

export function formatGregorianFromDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}/${m}/${day}`;
}

/**
 * اضافه کردن ماه به تاریخ شمسی با قانون Month-End Clamping
 * مثال: ۱۴۰۴/۰۶/۳۱ + ۱ ماه => ۱۴۰۴/۰۷/۳۰ (نه سرریز به آبان)
 */
export function addCalendarMonths(jalaliStr: string, months: number): string {
  const base = parseJalali(jalaliStr);
  if (!base) return '';
  const parts = normalizeDigits(jalaliStr).split('/').map(Number);
  const targetYear = parts[0];
  const targetMonthIndex = (parts[1] - 1) + months;
  const y = targetYear + Math.floor(targetMonthIndex / 12);
  const m = ((targetMonthIndex % 12) + 12) % 12; // 0..11
  // اولین روز ماه هدف سپس رفتن به آخرین روز همان ماه شمسی
  const firstOfTarget = parse(`${y}/${String(m + 1).padStart(2, '0')}/01`, 'yyyy/MM/dd', new Date());
  if (isNaN(firstOfTarget.getTime())) return '';
  const lastDayOfTarget = new Date(firstOfTarget);
  // حرکت روز به روز تا زمانی که ماه شمسی تغییر نکند
  let maxDay = 29;
  for (let d = 29; d <= 31; d++) {
    const testStr = `${y}/${String(m + 1).padStart(2, '0')}/${String(d).padStart(2, '0')}`;
    if (parseJalali(testStr)) maxDay = d;
  }
  const clampedDay = Math.min(parts[2] || 1, maxDay);
  return `${y}/${String(m + 1).padStart(2, '0')}/${String(clampedDay).padStart(2, '0')}`;
}
