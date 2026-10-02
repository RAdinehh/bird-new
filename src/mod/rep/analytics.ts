import { useTra, remaining, paidSum } from '../tra/store';
import { useEgg, healthyCount, henDayRate } from '../egg/store';
import { useFlk, getAgeDays } from '../flk/store';
import { useDlg } from '../dlg/store';
import { toEn } from '../../shr/utils/fa';
import { format as formatJ } from 'date-fns-jalali';

/** تبدیل تاریخ شمسی به کلید ماه: 1405/07 */
export function monthKey(date: string): string {
  if (!date) return '';
  const en = toEn(date);
  const parts = en.split('/');
  if (parts.length !== 3) return '';
  return parts[0] + '/' + String(parts[1]).padStart(2, '0');
}

/** تبدیل تاریخ شمسی به Date */
export function jalaliToDate(s: string): Date | null {
  if (!s) return null;
  const en = toEn(s);
  const parts = en.split('/').map(x => parseInt(x));
  if (parts.length !== 3 || parts.some(isNaN)) return null;
  return new Date(parts[0], parts[1] - 1, parts[2]);
}

/** لیست آخرین N ماه شمسی */
export function lastMonths(n: number): string[] {
  const arr: string[] = [];
  const now = new Date();
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setMonth(d.getMonth() - i);
    arr.push(formatJ(d, 'yyyy/MM'));
  }
  return arr;
}

/** نام ماه شمسی برای نمایش */
export const MONTH_NAMES = ['فروردین','اردیبهشت','خرداد','تیر','مرداد','شهریور','مهر','آبان','آذر','دی','بهمن','اسفند'];

export function monthLabel(key: string): string {
  const parts = key.split('/');
  if (parts.length !== 2) return key;
  const m = parseInt(parts[1]);
  return (MONTH_NAMES[m - 1] || '') + ' ' + parts[0].slice(2);
}

/** جمع فروش در یک ماه */
export function salesInMonth(invoices: any[], month: string): number {
  return invoices
    .filter(i => i.type === 'sale' && monthKey(i.date) === month)
    .reduce((a, i) => a + (i.total || 0), 0);
}

/** جمع خرید در یک ماه */
export function purchasesInMonth(invoices: any[], month: string): number {
  return invoices
    .filter(i => i.type === 'purchase' && monthKey(i.date) === month)
    .reduce((a, i) => a + (i.total || 0), 0);
}

/** درآمد دریافت‌شده در یک ماه */
export function cashInMonth(invoices: any[], month: string): number {
  let total = 0;
  invoices.filter(i => i.type === 'sale').forEach(inv => {
    (inv.payments || []).forEach((p: any) => {
      if (monthKey(p.date) === month) total += p.amount || 0;
    });
  });
  return total;
}

/** پرداخت‌شده در یک ماه */
export function cashOutMonth(invoices: any[], month: string): number {
  let total = 0;
  invoices.filter(i => i.type === 'purchase').forEach(inv => {
    (inv.payments || []).forEach((p: any) => {
      if (monthKey(p.date) === month) total += p.amount || 0;
    });
  });
  return total;
}

/** تخم‌گذاری در یک ماه */
export function eggsInMonth(productions: any[], month: string): { healthy: number; total: number; days: number } {
  let healthy = 0, total = 0, days = 0;
  productions.forEach(p => {
    if (monthKey(p.date) === month) {
      healthy += healthyCount(p);
      // totalCount شامل همه‌ی تخم‌ها (سالم + شکسته + نرم + کثیف) است
      total += p.totalCount || 0;
      days++;
    }
  });
  return { healthy, total, days };
}

/** مصرف دان در یک ماه (از ثبت روزانه) */
export function feedInMonth(logs: any[], month: string): number {
  return logs
    .filter(l => monthKey(l.date) === month)
    .reduce((a, l) => a + (l.feedAmount || 0), 0);
}

/** تلفات در یک ماه */
export function deathsInMonth(logs: any[], month: string): number {
  return logs
    .filter(l => monthKey(l.date) === month)
    .reduce((a, l) => a + (l.deaths || []).reduce((b: number, x: any) => b + (x.count || 0), 0), 0);
}

/** FCR ماهانه: دان مصرفی / تولید وزن */
export function fcrMonth(logs: any[], month: string, birds: number, avgWeightGain: number = 1.8): number {
  const feed = feedInMonth(logs, month);
  const gain = birds * avgWeightGain / 1000; // گرم → کیلو
  if (gain <= 0) return 0;
  return Math.round((feed / gain) * 100) / 100;
}

/** محاسبه‌ی مجموع طلب معوق */
export function totalReceivables(invoices: any[]): number {
  return invoices
    .filter(i => i.type === 'sale')
    .reduce((a, i) => a + remaining(i), 0);
}

/** محاسبه‌ی مجموع بدهی */
export function totalPayables(invoices: any[]): number {
  return invoices
    .filter(i => i.type === 'purchase')
    .reduce((a, i) => a + remaining(i), 0);
}

/** هزینه‌ی تولید هر جوجه (از هچ‌ها) */
export function avgChickCost(entries: any[], hatches: any[]): number {
  if (hatches.length === 0) return 0;
  let totalCost = 0, totalHatched = 0;
  hatches.forEach(h => {
    const entry = entries.find(e => e.id === h.eggEntryId);
    if (entry && entry.totalPrice) {
      totalCost += entry.totalPrice;
      totalHatched += h.hatched || 0;
    }
  });
  if (totalHatched === 0) return 0;
  return Math.round(totalCost / totalHatched);
}

/** ROI کل */
export function roi(totalRevenue: number, totalCost: number): number {
  if (totalCost === 0) return 0;
  return Math.round(((totalRevenue - totalCost) / totalCost) * 100);
}
