/**
 * useFlockValue — محاسبه ارزش روز گله
 * - تشخیص چندمنبعی گونه (breedId, breedName, birdId, sourceInvoice, items)
 * - قیمت از marketPrices بر اساس birdKind
 */
import { useSet } from '../../mod/set/store';
import { useBrd } from '../../mod/brd/store';
import { useTra } from '../../mod/tra/store';
import { useBreedStandard } from './useBreedStandard';
import { parse as parseJ, differenceInDays as diffDaysJ } from 'date-fns-jalali';

interface FlockLike {
  breedId?: string;
  breedName?: string;
  birdId?: string;
  sourceInvoiceId?: string;
  items?: any[];
  startDate?: string;
  date?: string;
  hatchDate?: string;
  currentCount?: number;
}

export interface FlockValueResult {
  value: number;
  weightG: number | null;
  pricePerKg: number;
  kind: string;
  ageDays: number | null;
  reason?: string;
}

export const KIND_LABEL: Record<string, string> = {
  chicken: 'مرغ', turkey: 'بوقلمون', goose: 'غاز', duck: 'اردک', quail: 'بلدرچین',
};

export function useFlockValue() {
  const marketPrices = useSet(s => s.marketPrices);
  const breedStd = useBreedStandard();
  const breeds = useBrd((s: any) => s.breeds) || [];
  const birds = useBrd((s: any) => s.birds) || [];
  const invoices = useTra((s: any) => s.invoices) || [];

  const resolveFlockKind = (flock: FlockLike): string | null => {
    const std = breedStd.byBreedId(flock.breedId);
    if (std?.birdKind) return std.birdKind;

    if (flock.breedId) {
      const br = breeds.find((b: any) => b.id === flock.breedId);
      if (br?.birdKind) return br.birdKind;
    }

    const std2 = breedStd.byName(flock.breedName);
    if (std2?.birdKind) return std2.birdKind;

    if (flock.birdId) {
      const bird = birds.find((b: any) => b.id === flock.birdId);
      if (bird?.birdKind) return bird.birdKind;
      if ((bird as any)?.kind) return (bird as any).kind;
    }

    if (flock.sourceInvoiceId) {
      const inv = invoices.find((i: any) => i.id === flock.sourceInvoiceId);
      if (inv?.items) {
        for (const it of inv.items) {
          if (it.birdId) {
            const bird = birds.find((b: any) => b.id === it.birdId);
            if (bird?.birdKind) return bird.birdKind;
          }
          if (it.breedId) {
            const br = breeds.find((b: any) => b.id === it.breedId);
            if (br?.birdKind) return br.birdKind;
            const s = breedStd.byBreedId(it.breedId);
            if (s?.birdKind) return s.birdKind;
          }
        }
      }
    }

    if (Array.isArray(flock.items)) {
      for (const it of flock.items) {
        if (it.birdId) {
          const bird = birds.find((b: any) => b.id === it.birdId);
          if (bird?.birdKind) return bird.birdKind;
        }
        if (it.breedId) {
          const br = breeds.find((b: any) => b.id === it.breedId);
          if (br?.birdKind) return br.birdKind;
        }
      }
    }

    return null;
  };

  const estimateWeightG = (flock: FlockLike): { weightG: number | null; ageDays: number | null; reason?: string } => {
    const std = breedStd.byBreedId(flock.breedId) || breedStd.byName(flock.breedName);
    if (!std) return { weightG: null, ageDays: null, reason: 'نژاد گله تعریف نشده — وزن قابل تخمین نیست' };

    const curve = std.growth?.weightByAge;
    const finalWeight = std.growth?.finalWeightG;

    if ((!curve || curve.length === 0) && (!finalWeight || finalWeight <= 0)) {
      return { weightG: null, ageDays: null, reason: 'جدول رشد نژاد تعریف نشده' };
    }

    const hatchStr = flock.hatchDate || flock.startDate || flock.date;
    if (!hatchStr) return { weightG: null, ageDays: null, reason: 'تاریخ شروع/هچ ثبت نشده' };

    try {
      const start = parseJ(hatchStr, 'yyyy/MM/dd', new Date());
      if (isNaN(start.getTime())) return { weightG: null, ageDays: null, reason: 'تاریخ نامعتبر' };

      const ageDays = diffDaysJ(new Date(), start);
      if (ageDays < 0) return { weightG: null, ageDays, reason: 'تاریخ در آینده' };

      if (curve && curve.length > 0) {
        const range = curve.find(r => ageDays >= r.dayFrom && ageDays <= r.dayTo);
        if (range) return { weightG: range.weightG, ageDays };
      }

      if (finalWeight && finalWeight > 0) {
        return { weightG: finalWeight, ageDays };
      }

      return { weightG: null, ageDays, reason: `سن ${ageDays} روز — خارج از جدول رشد` };
    } catch {
      return { weightG: null, ageDays: null, reason: 'خطا در محاسبه' };
    }
  };

  const getLivePrice = (kind: string): number => {
    const mp = marketPrices;
    if (!mp) return 0;
    switch (kind) {
      case 'chicken': return Number(mp.liveChicken) || 0;
      case 'turkey': return Number(mp.liveTurkey) || 0;
      case 'goose': return Number(mp.liveGoose) || 0;
      case 'duck': return Number(mp.liveDuck) || 0;
      case 'quail': return Number(mp.liveQuail) || 0;
      default: return 0;
    }
  };

  const computeFlockValue = (flock: FlockLike): FlockValueResult => {
    const count = Number(flock.currentCount) || 0;
    if (count <= 0) return { value: 0, weightG: null, pricePerKg: 0, kind: '', ageDays: null, reason: 'تعداد صفر' };

    const kind = resolveFlockKind(flock);
    if (!kind) {
      return {
        value: 0, weightG: null, pricePerKg: 0, kind: '', ageDays: null,
        reason: 'نوع پرنده نامشخص — نژاد یا پرنده گله در تنظیمات مشخص نیست',
      };
    }

    const { weightG, ageDays, reason: weightReason } = estimateWeightG(flock);
    if (!weightG) {
      return { value: 0, weightG: null, pricePerKg: 0, kind, ageDays, reason: weightReason };
    }

    const price = getLivePrice(kind);
    if (price <= 0) {
      return { value: 0, weightG, pricePerKg: 0, kind, ageDays, reason: 'قیمت تعریف نشده' };
    }

    const weightKg = weightG / 1000;
    return { value: Math.round(count * weightKg * price), weightG, pricePerKg: price, kind, ageDays };
  };

  return { estimateWeightG, getLivePrice, computeFlockValue, resolveFlockKind };
}
