/**
 * types-flocks.ts — نوع‌های FlocksPage
 */
import type { FlockType, FlockStatus } from './store';

export interface F {
  id?: string;
  name: string; type: FlockType; birdId: string; breedId: string;
  hallId: string; zoneId: string;
  initialCount: string; currentCount: string;
  maleCount: string; femaleCount: string;
  layingStartDay: string;
  endOfCycleDay: string;
  vaccineScheduleId: string;
  hatchDate: string; purchaseDate: string; startDate: string;
  source: string;
  purchasePrice: string; deliveryCost: string; otherCosts: string;
  status: FlockStatus; notes: string;
  /** 🆕 شناسه فاکتور خرید (اگه منبع purchase) */
  sourceInvoiceId?: string;
  /** 🆕 شناسه هچ (اگه منبع hatch) */
  hatchId?: string;
}

export const emptyForm = (): F => ({
  name: '', type: 'layer', birdId: '', breedId: '', hallId: '', zoneId: '',
  initialCount: '', currentCount: '', maleCount: '', femaleCount: '',
  layingStartDay: '',
  endOfCycleDay: '',
  vaccineScheduleId: '',
  hatchDate: '', purchaseDate: '', startDate: '',
  source: 'purchase', purchasePrice: '', deliveryCost: '', otherCosts: '',
  status: 'active', notes: ''
});

export type TabId = 'all' | 'layer' | 'broiler' | 'breeder' | 'hidden' | 'archived';
