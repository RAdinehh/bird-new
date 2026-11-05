import { useSet } from '../../mod/set/store';
import { useBreedStandard } from './useBreedStandard';
import { parse as parseJ, differenceInDays as diffDaysJ } from 'date-fns-jalali';

interface FlockLike {
  breedId?: string;
  breedName?: string;
  startDate?: string;
  date?: string;
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

export function useFlockValue() {
  const marketPrices = useSet(s => s.marketPrices);
  const breedStd = useBreedStandard();

  const estimateWeightG = (flock: any): { weightG: number | null; ageDays: number | null; reason?: string } => {
    const std = breedStd.byBreedId(flock.breedId) || breedStd.byName(flock.breedName);
    if (!std) return { weightG: null, ageDays: null, reason: 'نژاد تعریف نشده' };

    const curve = std.growth?.weightByAge;
    const finalWeight = std.growth?.finalWeightG;

    if ((!curve || curve.length === 0) && (!finalWeight || finalWeight <= 0)) {
      return { weightG: null, ageDays: null, reason: 'جدول رشد نژاد تعریف نشده' };
    }

    // 🆕 سن از هچ (برای جدول رشد صحیح است) > شروع > تاریخ
    const hatchStr = flock.hatchDate || flock.startDate || flock.date;
    if (!hatchStr) return { weightG: null, ageDays: null, reason: 'تاریخ شروع/هچ ثبت نشده' };

    try {
      const start = parseJ(hatchStr, 'yyyy/MM/dd', new Date());
      if (isNaN(start.getTime())) return { weightG: null, ageDays: null, reason: 'تاریخ نامعتبر' };

      const ageDays = diffDaysJ(new Date(), start);
      if (ageDays < 0) return { weightG: null, ageDays, reason: 'تاریخ در آینده' };

      // ۱. تلاش برای پیدا کردن بازه در جدول
      if (curve && curve.length > 0) {
        const range = curve.find(r => ageDays >= r.dayFrom && ageDays <= r.dayTo);
        if (range) return { weightG: range.weightG, ageDays };
      }

      // ۲. Fallback به وزن نهایی (سن بیشتر از جدول)
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
      case 'turkey': return Number(mp.liveTurkey) || 0;
      case 'goose': return Number(mp.liveGoose) || 0;
      case 'duck': return Number(mp.liveDuck) || 0;
      case 'quail': return Number(mp.liveQuail) || 0;
      default: return Number(mp.liveChicken) || 0;
    }
  };

  const computeFlockValue = (flock: any): FlockValueResult => {
    const count = Number(flock.currentCount) || 0;
    if (count <= 0) return { value: 0, weightG: null, pricePerKg: 0, kind: '', ageDays: null, reason: 'تعداد صفر' };

    const std = breedStd.byBreedId(flock.breedId) || breedStd.byName(flock.breedName);
    const kind = std?.birdKind || 'chicken';

    const { weightG, ageDays, reason: weightReason } = estimateWeightG(flock);
    if (!weightG) return { value: 0, weightG: null, pricePerKg: 0, kind, ageDays, reason: weightReason };

    const price = getLivePrice(kind);
    if (price <= 0) return { value: 0, weightG, pricePerKg: 0, kind, ageDays, reason: 'قیمت تعریف نشده' };

    const weightKg = weightG / 1000;
    return { value: Math.round(count * weightKg * price), weightG, pricePerKg: price, kind, ageDays };
  };

  return { estimateWeightG, getLivePrice, computeFlockValue };
}
