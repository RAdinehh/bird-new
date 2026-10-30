/**
 * types-invoice.ts — نوع‌های InvoicePage
 */
import type { InvoiceItem, Payment, Installment } from './types';
import type { InvoiceItem as StoreInvoiceItem, Payment as StorePayment } from './store';

export interface F {
  id?: string;
  date: string;
  partyId: string;
  category: string;
  items: InvoiceItem[];
  paymentTerms: 'cash' | 'installment' | 'custom';
  installmentCount: string;
  installmentGapDays: string;
  customDueDate: string;
  cashDiscountPct: string;
  cashDiscountDays: string;
  isPreorder: boolean;
  deliveryDate: string;
  advanceType: 'percent' | 'amount';
  advanceValue: string;
  dueDate: string;
  payments: Payment[];
  relatedFlockId: string;
  relatedDealId?: string;
  relatedSettlementId?: string;
  sourceType?: 'manual' | 'deal' | 'settlement' | 'flock';
  notes: string;
  installments: Installment[];
  /** 🆕 فاکتور مختلط — فروشنده هر قلم متفاوت */
}

export const emptyForm = (isPurchase: boolean): F => ({
  date: '', partyId: '', category: isPurchase ? 'egg' : 'fertile_egg', items: [],
  paymentTerms: 'cash', installmentCount: '1', installmentGapDays: '30',
  customDueDate: '', cashDiscountPct: '', cashDiscountDays: '', isPreorder: false, deliveryDate: '',
  advanceType: 'percent', advanceValue: '',
  dueDate: '', payments: [], relatedFlockId: '', notes: '', installments: [],
});
