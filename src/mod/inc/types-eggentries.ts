/**
 * types-eggentries.ts — نوع‌های EggEntriesPage
 */
import type { DealType } from './store';

export interface DraftRow {
  _id: string;
  dealType: DealType;
  birdId: string;
  breedId: string;
  flockId: string;
  count: string;
  trayNumbers: string;
  unitPrice: string;
  shippingCost: string;
  entryDate: string;
  entryTime: string;
  notes: string;
  dealData: Record<string, string>;
  dealStatus: 'active' | 'withdrawn';
  dealWithdrawnAt: string;
  dealWithdrawnReason: string;
}

export const makeRow = (): DraftRow => ({
  _id: 'r-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6),
  dealType: 'own',
  birdId: '',
  breedId: '',
  flockId: '',
  count: '',
  trayNumbers: '',
  unitPrice: '',
  shippingCost: '',
  entryDate: '',
  entryTime: '',
  notes: '',
  dealData: {},
  dealStatus: 'active',
  dealWithdrawnAt: '',
  dealWithdrawnReason: '',
});
