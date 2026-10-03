/**
 * store.ts — Zustand store معاملات
 */
import { create } from 'zustand';
import { parse as parseJ, differenceInDays as diffDaysJ, format as formatJ, addDays} from 'date-fns-jalali';
import { persist } from 'zustand/middleware';
import { v4 as uuid } from 'uuid';
import { useWhs } from '../whs/store';
import { useFlk } from '../flk/store';
import { useBrd } from '../brd/store';
import type { ItemCategoryFields } from '../../shr/utils/itemDetails';

export type InvoiceType = 'purchase' | 'sale';
export type PaymentMethod = 'cash' | 'card' | 'check' | 'installment' | 'mixed';
export type InvoiceStatus = 'paid' | 'partial' | 'unpaid' | 'overdue';
export type DealType = 'consignment' | 'partnership' | 'barter' | 'conditional';

// ===== انواع جدید (فاز A-F) =====

export type PaymentTerms = 'cash' | 'installment' | 'custom';
export type WorkflowStatus = 'draft' | 'confirmed' | 'received' | 'paid';
export type CheckStatus = 'pending' | 'cleared' | 'bounced';

export interface Installment {
  id: string;
  dueDate: string;
  amount: number;
  paid: boolean;
  paidDate: string;
}

export interface Deferral {
  id: string;
  fromDate: string;
  toDate: string;
  reason: string;
  createdAt: string;
}

export const PAYMENT_TERMS_LABEL: Record<PaymentTerms, string> = {
  cash: '💵 نقدی',
  installment: '📅 قسطی',
  custom: '✏️ توافقی',
};

export const WORKFLOW_LABEL: Record<WorkflowStatus, string> = {
  draft: '📝 پیش‌نویس',
  confirmed: '✅ تأیید شده',
  received: '📦 دریافت شده',
  paid: '💰 پرداخت شده',
};

export const CHECK_STATUS_LABEL: Record<CheckStatus, string> = {
  pending: '🟡 در جریان',
  cleared: '✅ نقد شد',
  bounced: '❌ برگشتی',
};


export interface InvoiceItem extends ItemCategoryFields {
  id: string;
  description: string;
  unit: string;
  quantity: number;
  unitPrice: number;
  total: number;
  itemId?: string;
  movementId?: string;
  // تخفیف و حمل قلم
  discountType?: '' | 'percent' | 'amount';
  discountValue?: number;
  shipping?: number;
  // فروشنده/خریدار قلم
  itemPartyId?: string;
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
  // فاز F — چک کامل
  status?: CheckStatus;
  clearedDate?: string;
  bouncedDate?: string;
  bouncedInvoiceId?: string;
}

export interface Invoice {
  id: string;
  type: InvoiceType;
  number?: string;   // خودکار تولید میشه
  date: string;
  partyId: string;
  category: string;
  items: InvoiceItem[];
  discount?: number;
  shipping?: number;
  total: number;
  payments: Payment[];
  dueDate: string;
  relatedFlockId: string;
  relatedEntryId: string;
  notes: string;
  createdAt: string;
  updatedAt: string;

  // ===== فاز A — شرایط پرداخت =====
  paymentTerms?: PaymentTerms;
  installmentCount?: number;
  installmentGapDays?: number;
  customDueDate?: string;
  paymentNote?: string;

  // ===== فاز B — Workflow =====
  workflowStatus?: WorkflowStatus;
  confirmedAt?: string;
  receivedAt?: string;
  receivedNote?: string;
  paidAt?: string;
  paidNote?: string;

  // ===== فاز C — پیش‌فروش =====
  isPreorder?: boolean;
  deliveryDate?: string;
  advancePayment?: number;
  advancePercent?: number;

  // ===== فاز D — سرسید و تعویق =====
  deferrals?: Deferral[];
  remindersMuted?: boolean;
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
  addInvoice: (i: Omit<Invoice, 'id'|'createdAt'|'updatedAt'>) => string;
  updateInvoice: (id: string, patch: Partial<Invoice>) => void;
  deleteInvoice: (id: string) => void;
  addDeal: (d: Omit<Deal, 'id'|'createdAt'|'updatedAt'>) => void;
  updateDeal: (id: string, patch: Partial<Deal>) => void;
  deleteDeal: (id: string) => void;
}


/** ساخت یا حذف movementهای انبار برای فاکتور */
function applyInvoiceMovements(inv: Invoice, prevItems?: InvoiceItem[]): InvoiceItem[] {
  const whs = useWhs.getState();

  // ۱. حذف movementهای قبلی (در حالت ویرایش)
  if (prevItems) {
    prevItems.forEach(it => {
      if (it.movementId) {
        try { whs.deleteMovement(it.movementId); } catch (e) {}
      }
    });
  }

  // ۲. ساخت movementهای جدید
  return inv.items.map(it => {
    if (!it.itemId || !it.quantity || it.quantity <= 0) {
      return { ...it, movementId: '' };
    }
    try {
      const mid = whs.addMovement({
        itemId: it.itemId,
        type: inv.type === 'purchase' ? 'in' : 'out',
        quantity: it.quantity,
        unitPrice: it.unitPrice,
        reason: inv.type === 'purchase' ? 'purchase' : 'sale',
        date: inv.date,
        partyId: inv.partyId,
        notes: `فاکتور ${inv.number || ''} — ${it.description}`,
      });
      return { ...it, movementId: mid };
    } catch (e) {
      return { ...it, movementId: '' };
    }
  });
}

const BIRD_CATS = ['chick', 'adult', 'fertile_egg'];

/** اعمال اثر فاکتور روی گله‌ها — خرید جوجه/پرنده → افزودن، فروش → کاهش */
/* ITEMS_RETURNED */
function applyInvoiceFlocks(inv: Invoice, prev?: Invoice): InvoiceItem[] {
  const outItems: InvoiceItem[] = (inv.items || []).map(it => ({ ...it }));
  const flk = useFlk.getState();
  const brd = useBrd.getState();

  // ۱. برگردوندن اثر قبلی (در حالت ویرایش/حذف)
  if (prev) {
    for (const it of prev.items || []) {
      if (!it.birdId || !it.flockId) continue;
      if (!BIRD_CATS.includes(prev.category)) continue;
      const qty = it.quantity || 0;
      if (qty <= 0) continue;
      const f = flk.flocks.find(x => x.id === it.flockId);
      if (!f) continue;
      const cur = f.currentCount ?? 0;
      if (prev.type === 'purchase') {
        flk.update(it.flockId, { currentCount: Math.max(0, cur - qty) });
      } else if (prev.type === 'sale') {
        flk.update(it.flockId, { currentCount: cur + qty });
      }
    }
  }

  // ۲. اعمال اثر جدید
  if (!BIRD_CATS.includes(inv.category)) return outItems;
  for (const it of inv.items || []) {
    if (!it.birdId) continue;
    const qty = it.quantity || 0;
    if (qty <= 0) continue;

    if (inv.type === 'purchase') {
      if (it.flockId) {
        const f = flk.flocks.find(x => x.id === it.flockId);
        if (!f) continue;
        flk.update(it.flockId, { currentCount: (f.currentCount ?? 0) + qty });
      } else {
        // EXISTING_FLOCK_CHECK — اگه قبلاً از این فاکتور گله ساختیم، همون رو استفاده کن
        const existing = flk.flocks.find(f =>
          f.sourceInvoiceId === inv.id &&
          f.sourceCategory === inv.category &&
          f.birdId === it.birdId &&
          f.breedId === (it.breedId || '')
        );
        if (existing) {
          flk.update(existing.id, { currentCount: (existing.currentCount ?? 0) + qty });
          const idx0 = inv.items.indexOf(it);
          if (idx0 >= 0 && outItems[idx0]) outItems[idx0].flockId = existing.id;
          continue;
        }
        // گله جدید بساز
        const breed = brd.breeds.find(b => b.id === it.breedId);
        const bird = brd.birds.find(b => b.id === it.birdId);
        const name = `گله ${breed?.name || bird?.name || '?'} — ${inv.date}`;
        const newFlockId = flk.add({
          name,
          type: 'layer',
          birdId: it.birdId,
          breedId: it.breedId || '',
          hallId: '',
          zoneId: '',
          initialCount: qty,
          currentCount: qty,
          maleCount: it.maleCount ?? null,
          femaleCount: it.femaleCount ?? null,
          layingStartDay: 0,
          endOfCycleDay: null,
          vaccineScheduleId: '',
          hatchDate: '',
          purchaseDate: inv.date,
          startDate: inv.date,
          source: 'purchase',
          purchasePrice: it.unitPrice || 0,
          deliveryCost: it.shipping || 0,
          otherCosts: 0,
          status: 'active',
          notes: `از فاکتور ${inv.number || ''}`,
          sourceInvoiceId: inv.id,
          sourceCategory: inv.category,
        });
        const idx = inv.items.indexOf(it);
        if (idx >= 0 && outItems[idx]) outItems[idx].flockId = newFlockId;
      }
    } else if (inv.type === 'sale' && it.flockId) {
      const f = flk.flocks.find(x => x.id === it.flockId);
      if (!f) continue;
      flk.update(it.flockId, { currentCount: Math.max(0, (f.currentCount ?? 0) - qty) });
    }
  }
  return outItems;
}

const now = () => new Date().toISOString();

export const useTra = create<State>()(
  persist(
    (set, get) => ({
      invoices: [],
      deals: [],
      addInvoice: (i) => {
        const id = uuid();
        const num = generateInvoiceNumber(i.type, i.date, get().invoices);
        const newInv = { ...i, id, number: i.number || num, createdAt: now(), updatedAt: now() } as any;
        let items: InvoiceItem[] = newInv.items || [];
        try { items = applyInvoiceFlocks(newInv); } catch(e) {}
        const final = { ...newInv, items };
        set({ invoices: [...get().invoices, final] });
        return id;
      },
      updateInvoice: (id, patch) => {
        const prev = get().invoices.find(x => x.id === id);
        if (!prev) return;
        const merged = { ...prev, ...patch, updatedAt: now() } as Invoice;
        const itemsMoved = applyInvoiceMovements(merged, prev.items);
        const mergedWithItems = { ...merged, items: itemsMoved };
        let itemsFinal: InvoiceItem[] = itemsMoved;
        try { itemsFinal = applyInvoiceFlocks(mergedWithItems, prev); } catch(e) {}
        const final = { ...mergedWithItems, items: itemsFinal };
        set({ invoices: get().invoices.map(x => x.id === id ? final : x) });
      },
      deleteInvoice: (id) => {
        const inv = get().invoices.find(x => x.id === id);
        if (inv) {
          // revert flock effect
          const flk = useFlk.getState();
          for (const it of inv.items || []) {
            if (!it.birdId || !it.flockId) continue;
            if (!BIRD_CATS.includes(inv.category)) continue;
            const qty = it.quantity || 0;
            if (qty <= 0) continue;
            const f = flk.flocks.find(x => x.id === it.flockId);
            if (!f) continue;
            const cur = f.currentCount ?? 0;
            if (inv.type === 'purchase') flk.update(it.flockId, { currentCount: Math.max(0, cur - qty) });
            else if (inv.type === 'sale') flk.update(it.flockId, { currentCount: cur + qty });
          }
          const whs = useWhs.getState();
          inv.items.forEach(it => {
            if (it.movementId) {
              try { whs.deleteMovement(it.movementId); } catch (e) {}
            }
          });
        }
        set({ invoices: get().invoices.filter(x => x.id !== id) });
      },
      addDeal: (d) => set({ deals: [...get().deals, {...d, id: uuid(), createdAt: now(), updatedAt: now()}] }),
      updateDeal: (id, patch) => set({ deals: get().deals.map(x => x.id === id ? {...x, ...patch, updatedAt: now()} : x) }),
      deleteDeal: (id) => set({ deals: get().deals.filter(x => x.id !== id) })
    }),
    {
      name: 'pm-tra',
      version: 4,
      migrate: (persisted: any, version: number) => {
        if (!persisted?.invoices) return persisted;

        persisted.invoices = persisted.invoices.map((inv: any) => {
          // مقادیر پیش‌فرض بر اساس وضعیت فعلی
          const payments = inv.payments || [];
          const total = inv.total || 0;
          const paidSum = payments.reduce((a: number, p: any) => a + (p.amount || 0), 0);
          const isPaid = total > 0 && paidSum >= total;

          // وضعیت workflow خودکار
          let workflowStatus = 'confirmed';
          if (isPaid) workflowStatus = 'paid';
          else if (payments.length > 0) workflowStatus = 'confirmed';

          return {
            ...inv,
            // فاز A
            paymentTerms: inv.paymentTerms || (inv.dueDate === inv.date ? 'cash' : 'custom'),
            installmentCount: inv.installmentCount ?? 1,
            installmentGapDays: inv.installmentGapDays ?? 30,
            customDueDate: inv.customDueDate || inv.dueDate || '',
            paymentNote: inv.paymentNote || '',
            // فاز B
            workflowStatus,
            confirmedAt: inv.confirmedAt || inv.createdAt,
            receivedAt: inv.receivedAt || '',
            receivedNote: inv.receivedNote || '',
            paidAt: inv.paidAt || '',
            paidNote: inv.paidNote || '',
            // فاز C
            isPreorder: inv.isPreorder ?? false,
            deliveryDate: inv.deliveryDate || '',
            advancePayment: inv.advancePayment ?? 0,
            advancePercent: inv.advancePercent ?? 0,
            // فاز D
            deferrals: inv.deferrals || [],
            remindersMuted: inv.remindersMuted ?? false,
            // گسترش Payment
            payments: (inv.payments || []).map((p: any) => ({
              ...p,
              status: p.status || 'pending',
              clearedDate: p.clearedDate || '',
              bouncedDate: p.bouncedDate || '',
              bouncedInvoiceId: p.bouncedInvoiceId || '',
            })),
            // گسترش InvoiceItem
            items: (inv.items || []).map((it: any) => ({
              ...it,
              discountType: it.discountType || '',
              discountValue: it.discountValue ?? 0,
            })),
          };
        });

        return persisted;
      }
    }
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



/** محاسبه تاریخ سرسید از شرایط پرداخت */


/** تولید شماره فاکتور خودکار: P140507001 */
export function generateInvoiceNumber(
  type: InvoiceType,
  date: string,
  existingInvoices: Invoice[]
): string {
  const parts = (date || '').split('/');
  const year = parts[0] || '1400';
  const month = (parts[1] || '01').padStart(2, '0');
  const prefix = type === 'purchase' ? 'P' : 'S';
  const pattern = `${prefix}${year}${month}`;

  let maxNum = 0;
  existingInvoices.forEach(inv => {
    if (inv.type !== type) return;
    if (!inv.number || !inv.number.startsWith(pattern)) return;
    const suffix = inv.number.slice(pattern.length);
    const n = parseInt(suffix, 10);
    if (!isNaN(n) && n > maxNum) maxNum = n;
  });

  const nextNum = String(maxNum + 1).padStart(3, '0');
  return `${pattern}${nextNum}`;
}

export function calcDueDate(
  terms: PaymentTerms | undefined,
  invoiceDate: string,
  customDueDate?: string,
  gapDays?: number
): string {
  if (!invoiceDate) return customDueDate || '';

  if (terms === 'cash') {
    return invoiceDate;
  }
  if (terms === 'custom') {
    return customDueDate || invoiceDate;
  }
  if (terms === 'installment') {
    // آخرین قسط = تاریخ فاکتور + (تعداد اقساط × فاصله)
    // ولی سرسید اولین قسط = تاریخ + فاصله
    const gap = gapDays || 30;
    try {
      const en = invoiceDate.replace(/[۰-۹]/g, (d: string) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d)));
      const base = parseJ(en, 'yyyy/MM/dd', new Date());
      if (isNaN(base.getTime())) return invoiceDate;
      const due = addDays(base, gap);
      return formatJ(due, 'yyyy/MM/dd');
    } catch {
      return invoiceDate;
    }
  }
  return customDueDate || invoiceDate;
}



/** مرحله بعدی workflow */
export function nextWorkflowStatus(current?: WorkflowStatus): WorkflowStatus | null {
  if (!current || current === 'draft') return 'confirmed';
  if (current === 'confirmed') return 'received';
  if (current === 'received') return 'paid';
  return null;
}

/** مرحله قبلی workflow */
export function prevWorkflowStatus(current?: WorkflowStatus): WorkflowStatus | null {
  if (!current || current === 'draft') return null;
  if (current === 'confirmed') return 'draft';
  if (current === 'received') return 'confirmed';
  if (current === 'paid') return 'received';
  return null;
}

/** رنگ بج workflow */
export function workflowTone(status?: WorkflowStatus): 'gray' | 'blue' | 'amber' | 'green' {
  if (!status || status === 'draft') return 'gray';
  if (status === 'confirmed') return 'blue';
  if (status === 'received') return 'amber';
  return 'green';
}



/** محاسبه جمع قلم با تخفیف */
export function calcItemTotal(
  quantity: number,
  unitPrice: number,
  discountType?: string,
  discountValue?: number
): number {
  const base = (quantity || 0) * (unitPrice || 0);
  if (!discountType || !discountValue) return base;

  let discount = 0;
  if (discountType === 'percent') {
    discount = base * (discountValue / 100);
  } else if (discountType === 'amount') {
    discount = discountValue;
  }
  return Math.max(0, base - discount);
}

/** محاسبه مبلغ تخفیف قلم */
export function calcItemDiscount(
  quantity: number,
  unitPrice: number,
  discountType?: string,
  discountValue?: number
): number {
  const base = (quantity || 0) * (unitPrice || 0);
  const net = calcItemTotal(quantity, unitPrice, discountType, discountValue);
  return Math.max(0, base - net);
}



/** رنگ بج وضعیت چک */
export function checkTone(status?: CheckStatus): 'gray' | 'green' | 'red' {
  if (!status || status === 'pending') return 'gray';
  if (status === 'cleared') return 'green';
  return 'red';
}

/** جمع پرداخت‌های چک در جریان (نگهداری شده) */
export function pendingChecksSum(payments: Payment[]): number {
  return payments
    .filter(p => p.method === 'check' && (!p.status || p.status === 'pending'))
    .reduce((a, p) => a + (p.amount || 0), 0);
}

/** لیست چک‌های سرسید نزدیک */
export function pendingChecks(payments: Payment[]): Payment[] {
  return payments.filter(p => p.method === 'check' && (!p.status || p.status === 'pending'));
}

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



// تبدیل تاریخ‌های میلادی ذخیره‌شده به شمسی
function migrateInvDates(inv: any): any {
  if (!inv) return inv;
  const fix = (str: string) => {
    if (!str) return str;
    const en = String(str).replace(/[۰-۹]/g, (d: string) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d)));
    const m = en.match(/^(\d{4})\/(\d{2})\/(\d{2})$/);
    if (!m) return str;
    const y = parseInt(m[1], 10);
    if (y >= 1900 && y <= 2100) {
      try {
        const d = new Date(y, parseInt(m[2], 10) - 1, parseInt(m[3], 10));
        return formatJ(d, 'yyyy/MM/dd');
      } catch { return str; }
    }
    return str;
  };
  if (inv.date) inv.date = fix(inv.date);
  if (inv.dueDate) inv.dueDate = fix(inv.dueDate);
  if (inv.customDueDate) inv.customDueDate = fix(inv.customDueDate);
  return inv;
}

export function remaining(inv: Invoice): number {
  const paid = paidSum(inv.payments || []);
  return Math.max(0, (inv.total || 0) - paid);
}

export function ageDays(inv: Invoice): number {
  if (!inv.date) return 0;
  try {
    const en = inv.date.replace(/[۰-۹]/g, (d: string) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d)));
    const d = parseJ(en, 'yyyy/MM/dd', new Date());
    if (isNaN(d.getTime())) return 0;
    const diff = diffDaysJ(new Date(), d);
    return diff > 0 ? diff : 0;
  } catch {
    return 0;
  }
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
