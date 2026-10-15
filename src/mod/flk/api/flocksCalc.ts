/**
 * api/flocksCalc.ts — توابع کمکی FlocksPage
 */
import { format, addDays, subMonths } from 'date-fns-jalali';

/** 🆕 shape تایپ‌های localStorage — فقط فیلدهای لازم */
interface DlgLogRef { flockId?: string }
interface EggProdRef { flockId?: string }
interface EggSaleRef { flockId?: string }
interface TraInvRef { type?: string; relatedFlockId?: string; total?: number }
interface PersistedShape<T> {
  state?: Record<string, T[]>;
  [key: string]: T[] | Record<string, T[]> | undefined;
}

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
    const safeRead = <T,>(k: string): PersistedShape<T> => {
      try { return JSON.parse(localStorage.getItem(k) || '{}') as PersistedShape<T>; } catch { return {}; }
    };
    const dlg = safeRead<DlgLogRef>('pm-dlg');
    const dlgLogs = (dlg.state?.logs || (dlg.logs as DlgLogRef[] | undefined) || []);
    if (dlgLogs.some((l) => l.flockId === flockId)) return true;
    const egg = safeRead<EggProdRef>('pm-egg');
    const prods = (egg.state?.productions || (egg.productions as EggProdRef[] | undefined) || []);
    if (prods.some((p) => p.flockId === flockId)) return true;
    const egg2 = safeRead<EggSaleRef>('pm-egg');
    const sales = (egg2.state?.sales || (egg2.sales as EggSaleRef[] | undefined) || []);
    if (sales.some((s) => s.flockId === flockId)) return true;
    const tra = safeRead<TraInvRef>('pm-tra');
    const invs = (tra.state?.invoices || (tra.invoices as TraInvRef[] | undefined) || []);
    if (invs.some((i) => i.relatedFlockId === flockId)) return true;
  } catch {}
  return false;
}

/** محاسبه درآمد گله از فاکتورهای فروش */
export function getFlockRevenue(flockId: string, invoices: TraInvRef[]): number {
  return (invoices || [])
    .filter((inv) => inv.type === 'sale' && inv.relatedFlockId === flockId)
    .reduce((sum, inv) => sum + (inv.total || 0), 0);
}
