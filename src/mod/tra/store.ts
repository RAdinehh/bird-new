import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { v4 as uuid } from 'uuid';

export type InvoiceType = 'purchase' | 'sale';
export type PaymentMethod = 'cash' | 'card' | 'check' | 'installment' | 'mixed';
export type InvoiceStatus = 'paid' | 'partial' | 'unpaid' | 'overdue';
export type DealType = 'consignment' | 'partnership' | 'barter' | 'conditional';

export interface InvoiceItem {
  id: string;
  description: string;
  unit: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface Payment {
  id: string;
  date: string;
  amount: number;
  method: 'cash' | 'card' | 'check';
  checkNo: string;
  bank: string;
  dueDate: string;
  notes: string;
}

export interface Invoice {
  id: string;
  type: InvoiceType;
  number: string;
  date: string;
  partyId: string;
  category: string;
  items: InvoiceItem[];
  discount: number;
  tax: number;
  shipping: number;
  total: number;
  payments: Payment[];
  dueDate: string;
  relatedFlockId: string;
  relatedEntryId: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export interface Deal {
  id: string;
  type: DealType;
  date: string;
  partyId: string;
  description: string;
  value: number;
  percent: number | null;
  dueDate: string;
  status: 'open' | 'settled' | 'cancelled';
  notes: string;
  createdAt: string;
  updatedAt: string;
}

interface State {
  invoices: Invoice[];
  deals: Deal[];
  addInvoice: (i: Omit<Invoice, 'id'|'createdAt'|'updatedAt'>) => void;
  updateInvoice: (id: string, patch: Partial<Invoice>) => void;
  deleteInvoice: (id: string) => void;
  addDeal: (d: Omit<Deal, 'id'|'createdAt'|'updatedAt'>) => void;
  updateDeal: (id: string, patch: Partial<Deal>) => void;
  deleteDeal: (id: string) => void;
}

const now = () => new Date().toISOString();

export const useTra = create<State>()(
  persist(
    (set, get) => ({
      invoices: [],
      deals: [],
      addInvoice: (i) => set({ invoices: [...get().invoices, {...i, id: uuid(), createdAt: now(), updatedAt: now()}] }),
      updateInvoice: (id, patch) => set({ invoices: get().invoices.map(x => x.id === id ? {...x, ...patch, updatedAt: now()} : x) }),
      deleteInvoice: (id) => set({ invoices: get().invoices.filter(x => x.id !== id) }),
      addDeal: (d) => set({ deals: [...get().deals, {...d, id: uuid(), createdAt: now(), updatedAt: now()}] }),
      updateDeal: (id, patch) => set({ deals: get().deals.map(x => x.id === id ? {...x, ...patch, updatedAt: now()} : x) }),
      deleteDeal: (id) => set({ deals: get().deals.filter(x => x.id !== id) })
    }),
    { name: 'pm-tra' }
  )
);

export const CATEGORIES: Record<InvoiceType, [string, string][]> = {
  purchase: [
    ['egg', 'تخم نطفه‌دار'],
    ['chick', 'جوجه یک‌روزه'],
    ['adult', 'پرنده بالغ'],
    ['feed', 'دان و مواد اولیه'],
    ['medicine', 'دارو و واکسن'],
    ['equipment', 'تجهیزات'],
    ['other', 'سایر']
  ],
  sale: [
    ['chick', 'جوجه'],
    ['egg', 'تخم خوراکی'],
    ['fertile_egg', 'تخم نطفه‌دار'],
    ['adult', 'پرنده بالغ'],
    ['manure', 'کود'],
    ['feed', 'دان'],
    ['equipment', 'وسایل و تجهیزات'],
    ['broken', 'اقلام شکسته'],
    ['other', 'سایر']
  ]
};

export const PAYMENT_LABEL: Record<string, string> = {
  cash: 'نقدی', card: 'کارت', check: 'چک', installment: 'اقساط', mixed: 'ترکیبی'
};

export const DEAL_LABEL: Record<DealType, string> = {
  consignment: 'امانی', partnership: 'شراکتی', barter: 'تهاتر', conditional: 'توافقی'
};

export const STATUS_LABEL: Record<InvoiceStatus, string> = {
  paid: 'پرداخت‌شده', partial: 'نیمه‌پرداخت', unpaid: 'پرداخت‌نشده', overdue: 'سرسید گذشته'
};

export function itemTotal(q: number, p: number): number {
  return (q || 0) * (p || 0);
}

export function itemsSum(items: InvoiceItem[]): number {
  return items.reduce((a, x) => a + (x.total || 0), 0);
}

export function paidSum(payments: Payment[]): number {
  return payments.reduce((a, x) => a + (x.amount || 0), 0);
}

export function invoiceStatus(inv: Invoice): InvoiceStatus {
  const paid = paidSum(inv.payments || []);
  const total = inv.total || 0;
  if (paid >= total && total > 0) return 'paid';
  if (paid > 0) return 'partial';
  return 'unpaid';
}

export function remaining(inv: Invoice): number {
  const paid = paidSum(inv.payments || []);
  return Math.max(0, (inv.total || 0) - paid);
}

export function ageDays(inv: Invoice): number {
  if (inv.date === '' || inv.date == null) return 0;
  const parts = inv.date.replace(/[۰-۹]/g, d => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d).toString()).split('/');
  if (parts.length !== 3) return 0;
  const d = new Date(+parts[0], +parts[1] - 1, +parts[2]);
  const diff = Math.floor((Date.now() - d.getTime()) / (1000 * 60 * 60 * 24));
  return diff > 0 ? diff : 0;
}

export function agingBucket(days: number): string {
  if (days <= 15) return '0-15';
  if (days <= 30) return '16-30';
  if (days <= 60) return '31-60';
  if (days <= 90) return '61-90';
  return '+90';
}

export const AGING_BUCKETS = [
  { key: '0-15', label: '۰-۱۵ روز', color: 'green' },
  { key: '16-30', label: '۱۶-۳۰ روز', color: 'blue' },
  { key: '31-60', label: '۳۱-۶۰ روز', color: 'amber' },
  { key: '61-90', label: '۶۱-۹۰ روز', color: 'amber' },
  { key: '+90', label: 'بیش از ۹۰ روز', color: 'red' }
];
