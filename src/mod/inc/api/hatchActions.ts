/**
 * api/hatchActions.ts — منطق اتصال هچ به گله، فاکتور و حذف
 *
 * توابع خالص — caller (hook) وابستگی‌ها رو پاس می‌ده.
 */
import type { Flock } from '../../flk/store';
import type { Invoice } from '../../tra/store';
import type { Bird } from '../../brd/store';

export interface HatchInput {
  id: string;
  eggEntryId: string;
  date: string;
  maleCount?: number | null;
  femaleCount?: number | null;
  unknownCount?: number | null;
  hatched?: number | null;
}

/** ساخت داده‌ی گله‌ی جدید از هچ */
export function buildFlockFromHatch(params: {
  formName: string;
  formType: string;
  formHallId: string;
  formZoneId: string;
  hatch: HatchInput;
  bird: Bird;
  breedId: string;
  /** 🆕 هزینه خرید تخم (از EggEntry) */
  entryUnitPrice?: number | null;
  entryShippingCost?: number | null;
  /** 🆕 سن شروع تخم‌گذاری از استاندارد نژاد */
  layingStartDayFromStd?: number | null;
}): Omit<Flock, 'id' | 'createdAt' | 'updatedAt'> {
  const { formName, formType, formHallId, formZoneId, hatch, bird, breedId,
    entryUnitPrice, entryShippingCost, layingStartDayFromStd } = params;
  const count = hatch.hatched || 0;
  return {
    name: formName,
    type: formType as any,
    birdId: bird.id,
    breedId,
    hallId: formHallId,
    zoneId: formZoneId,
    initialCount: count,
    currentCount: count,
    maleCount: hatch.maleCount || null,
    femaleCount: hatch.femaleCount || null,
    unknownCount: hatch.unknownCount || null,
    layingStartDay: layingStartDayFromStd ?? 0,
    vaccineScheduleId: '',
    hatchDate: hatch.date,
    purchaseDate: '',
    startDate: hatch.date,
    source: 'hatch',
    purchasePrice: entryUnitPrice ?? null,
    deliveryCost: entryShippingCost ?? null,
    otherCosts: null,
    status: 'active',
    notes: 'از هچ ' + hatch.date,
    hatchId: hatch.id,
  } as any;
}

/** ساخت داده‌ی فاکتور فروش جوجه از هچ */
export function buildSaleInvoiceFromHatch(params: {
  buyerId: string;
  count: number;
  unitPrice: number;
  date: string;
  hatch: HatchInput;
}): Omit<Invoice, 'id' | 'createdAt' | 'updatedAt'> {
  const { buyerId, count, unitPrice, date, hatch } = params;
  const total = count * unitPrice;
  return {
    type: 'sale',
    date: date || hatch.date,
    partyId: buyerId,
    category: 'chick',
    items: [{
      id: 'chick-' + Date.now(),
      name: 'جوجه یک‌روزه',
      quantity: count,
      unit: 'عدد',
      unitPrice,
      total,
    }] as any,
    total,
    payments: [],
    dueDate: date || hatch.date,
    relatedFlockId: '',
    relatedEntryId: hatch.eggEntryId,
    notes: 'فروش جوجه',
  } as any;
}
