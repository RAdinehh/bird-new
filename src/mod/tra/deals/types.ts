import type { DealType, SettlementType, DealGood, DealDelivery, DealSale, DealPayment } from '../store';
export interface F {
  id?: string; type: DealType; date: string; partyId: string;
  description: string; value: string; percent: string; dueDate: string;
  status: 'open' | 'settled' | 'cancelled'; notes: string;
  dealNumber: string; startDate: string; endDate: string;
  settlementType: SettlementType | ''; settlementValue: string; cancelReason: string;
  goods: DealGood[]; deliveries: DealDelivery[]; sales: DealSale[]; payments: DealPayment[];
}
export const empty = (): F => ({
  type: 'consignment', date: '', partyId: '',
  description: '', value: '', percent: '', dueDate: '',
  status: 'open', notes: '',
  dealNumber: '', startDate: '', endDate: '',
  settlementType: 'percent', settlementValue: '', cancelReason: '',
  goods: [], deliveries: [], sales: [], payments: [],
});
export const STATUS_LABEL: Record<string, string> = { open: 'باز', settled: 'تسویه‌شده', cancelled: 'لغوشده' };
export function isSameIdentity(a: DealGood, b: DealGood): boolean {
  return (
    (a.category || '') === (b.category || '') &&
    (a.source || 'flock') === (b.source || 'flock') &&
    (a.existingFlockId || '') === (b.existingFlockId || '') &&
    (a.hatchId || '') === (b.hatchId || '') &&
    (a.stockItemId || '') === (b.stockItemId || '') &&
    (a.unit || '') === (b.unit || '') &&
    Number(a.estimatedPrice || 0) === Number(b.estimatedPrice || 0)
  );
}
