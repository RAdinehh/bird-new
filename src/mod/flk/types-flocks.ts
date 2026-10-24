/**
 * types-flocks.ts — نوع‌های FlocksPage
 */
import type { FlockType, FlockStatus } from './store';

export interface F {
  id?: string;
  name: string; type: FlockType; birdId: string; breedId: string;
  /** 🆕 standard یا mixed — خالی = standard برای سازگاری */
  breedKind?: 'standard' | 'mixed';
  /** 🆕 نام محلی برای گله مختلط */
  breedLabel?: string;
  hallId: string; zoneId: string;
  initialCount: string; currentCount: string;
  maleCount: string; femaleCount: string;
  unknownCount?: string;
  layingStartDay: string;
  endOfCycleDay: string;
  vaccineScheduleId: string;
  hatchDate: string; purchaseDate: string; startDate: string;
  source: string;
  purchasePrice: string; deliveryCost: string; otherCosts: string;
  status: FlockStatus; notes: string;
  /** 🆕 شناسه فاکتور خرید (اگه منبع purchase) */
  sourceInvoiceId?: string;
  /** 🆕 دسته کالای فاکتور */
  sourceCategory?: string;
  /** 🆕 شناسه هچ (اگه منبع hatch) */
  hatchId?: string;
  // 💼 مدل بهره‌برداری
  dealType: string;
  partnerId: string;
  partnerShare: string;
  consignorId: string;
  lessorId: string;
  barterPartyId?: string;
  barterValue?: string;
  barterDescription?: string;
  barterStartDate?: string;
  barterEndDate?: string;
  rentAmount: string;
  rentPeriod: string;
  dealId: string;
  rentStartDate: string;
  rentEndDate: string;
  rentPayments?: Array<{ id: string; date: string; amount: number; notes: string }>;
}

export const emptyForm = (): F => ({
  name: '', type: 'layer', birdId: '', breedId: '', hallId: '', zoneId: '',
  initialCount: '', currentCount: '', maleCount: '', femaleCount: '', unknownCount: '',
  layingStartDay: '',
  endOfCycleDay: '',
  vaccineScheduleId: '',
  hatchDate: '', purchaseDate: '', startDate: '',
  source: 'purchase', purchasePrice: '', deliveryCost: '', otherCosts: '',
  status: 'active', notes: '',
  dealType: 'own',
  partnerId: '', partnerShare: '',
  consignorId: '', lessorId: '', barterPartyId: '', barterValue: '', barterDescription: '', barterStartDate: '', barterEndDate: '', rentAmount: '', rentPeriod: 'monthly', dealId: '',
  rentStartDate: '', rentEndDate: '',
});

export type TabId = 'all' | 'layer' | 'broiler' | 'breeder' | 'hidden' | 'archived' | 'paused';
