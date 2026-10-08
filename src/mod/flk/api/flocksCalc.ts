/**
 * api/flocksCalc.ts — توابع کمکی FlocksPage
 */
import { format, addDays, subMonths } from 'date-fns-jalali';

export function todayJ(): string {
  try { return format(new Date(), 'yyyy/MM/dd'); } catch { return ''; }
}

export function jalaliBounds(monthsBack: number, daysForward = 60): { min: string; max: string } {
  try {
    const now = new Date();
    return {
      min: format(subMonths(now, monthsBack), 'yyyy/MM/dd'),
      max: format(addDays(now, daysForward), 'yyyy/MM/dd'),
    };
  } catch { return { min: '', max: '' }; }
}

export function checkDateBounds(date: string, bounds: { min: string; max: string }): string | undefined {
  if (!date) return undefined;
  if (bounds.max && date > bounds.max) {
    return 'بیش از ۲ ماه در آینده — گله هنوز وجود ندارد';
  }
  if (bounds.min && date < bounds.min) {
    return 'بیش از ۱۸ ماه در گذشته — سن غیرمنطقی';
  }
  return undefined;
}

/** چک ارجاع — آیا گله در ماژول‌های دیگه استفاده شده؟ */
export function hasRefs(flockId: string): boolean {
  try {
    const safeRead = (k: string) => {
      try { return JSON.parse(localStorage.getItem(k) || '{}'); } catch { return {}; }
    };
    const dlg = safeRead('pm-dlg');
    const dlgLogs = dlg.state?.logs || dlg.logs || [];
    if (dlgLogs.some((l: any) => l.flockId === flockId)) return true;
    const egg = safeRead('pm-egg');
    const prods = egg.state?.productions || egg.productions || [];
    if (prods.some((p: any) => p.flockId === flockId)) return true;
    const sales = egg.state?.sales || egg.sales || [];
    if (sales.some((s: any) => s.flockId === flockId)) return true;
    const tra = safeRead('pm-tra');
    const invs = tra.state?.invoices || tra.invoices || [];
    if (invs.some((i: any) => i.relatedFlockId === flockId)) return true;
  } catch {}
  return false;
}

/** محاسبه درآمد گله از فاکتورهای فروش */
export function getFlockRevenue(flockId: string, invoices: any[]): number {
  return (invoices || [])
    .filter((inv: any) => inv.type === 'sale' && inv.relatedFlockId === flockId)
    .reduce((sum: number, inv: any) => sum + (inv.total || 0), 0);
}
