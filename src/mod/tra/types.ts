/**
 * tra/types.ts — انواع و labelهای معاملات
 */
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
  /** شماره قسط (۱، ۲، ۳، ...) */
  number: number;
  dueDate: string;
  amount: number;
  /** وضعیت: در انتظار | پرداخت شده | معوق */
  status: 'pending' | 'paid' | 'overdue';
  /** @deprecated — برای سازگاری با نسخه قبلی. از status استفاده کنید */
  paid: boolean;
  /** @deprecated — برای سازگاری با نسخه قبلی. از paidAt استفاده کنید */
  paidDate: string;
  paidAt?: string;
  paidAmount?: number;
  /** شناسه Payment که این قسط را پرداخت کرده */
  paymentId?: string;
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



/** پرداخت مستقل در سطح طرف حساب (برای تخصیص چندگانه) */
export interface PartyPayment {
  id: string;
  partyId: string;
  date: string;
  amount: number;
  method: 'cash' | 'card' | 'check';
  type?: 'regular' | 'advance' | 'refund' | 'settlement';
  checkNo: string;
  bank: string;
  dueDate: string;
  notes: string;
  status?: CheckStatus;
  clearedDate?: string;
  bouncedDate?: string;
  createdAt: string;
  updatedAt: string;
}

/** تخصیص پرداخت به فاکتور */
export interface Allocation {
  id: string;
  paymentId: string;
  invoiceId: string;
  amount: number;
  createdAt: string;
}

export interface InvoiceItem extends ItemCategoryFields {
  /** دسته اختصاصی قلم — برای فاکتور مختلط. اگر خالی باشد از Invoice.category استفاده می‌شود. */
  category?: string;
  /** تعداد سالم در زمان تحویل (DOA) — اگر خالی باشد از quantity استفاده می‌شود */
  healthyCount?: number | null;
  baseQuantity?: number | null;
  /** تاریخ تولید تخم — اگر خالی باشد از Invoice.date استفاده می‌شود */
  eggDate?: string;
  /** مبدأ / مرغداری مادر (برای تخم نطفه‌دار) */
  /** تعداد تخم‌های غیرقابل جوجه‌کشی */
  nonIncubableCount?: number | null;
  /** تعداد تخم شکسته (کمک به healthyCount) */
  brokenEggCount?: number | null;
  /** وزن یک تخم به گرم (برای entry به جوجه‌کشی) */
  eggWeight?: number | null;
  /** شماره بچ هچری (برای جوجه یک‌روزه) */
  hatcheryBatchNo?: string;
  /** وزن اولیه جوجه به گرم */
  chickWeight?: number | null;
  /** تاریخ انقضا دارو/دان (برای انتقال به Movement) */
  expiryDate?: string;
  flockName?: string;
  storage?: string;
  usageType?: string;
  costType?: string;
  equipmentCategory?: string;
  equipmentType?: string;
  equipmentId?: string;
  stockItemId?: string;
  model?: string;
  serialNo?: string;
  warrantyMonths?: number | null;
  hallId?: string;
  zoneId?: string;
  hatchDate?: string;
  /** هزینه حمل اختصاصی این قلم */
  transportCost?: number | null;
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
  /** 🆕 اتصال به گله موجود (بدون ساخت گله جدید) */
  existingFlockId?: string;
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

  /** نوع پرداخت: عادی | پیش‌پرداخت | عودت | تسویه */
  type?: 'regular' | 'advance' | 'refund' | 'settlement';
  /** شناسه فاکتور مرتبط (برای تخصیص چندگانه) */
  invoiceId?: string;
  /** شناسه طرف حساب (برای اعتبار) */
  partyId?: string;
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
  /** درصد تخفیف نقدی */
  cashDiscountPct?: number;
  /** مهلت تخفیف نقدی (روز) */
  cashDiscountDays?: number;

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
  // ===== اقساط =====
  installments?: Installment[];
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

export interface State {
  reopenInvoice: (id: string) => void;
  invoices: Invoice[];
  deals: Deal[];
  addInvoice: (i: Omit<Invoice, 'id'|'createdAt'|'updatedAt'>) => string;
  updateInvoice: (id: string, patch: Partial<Invoice>) => void;
  deleteInvoice: (id: string) => void;
  addDeal: (d: Omit<Deal, 'id'|'createdAt'|'updatedAt'>) => void;
  updateDeal: (id: string, patch: Partial<Deal>) => void;
  deleteDeal: (id: string) => void;
  /** پرداخت‌های سطح طرف حساب (Phase 6) */
  partyPayments: PartyPayment[];
  addPartyPayment: (p: Omit<PartyPayment, 'id'|'createdAt'|'updatedAt'>) => string;
  updatePartyPayment: (id: string, patch: Partial<PartyPayment>) => void;
  deletePartyPayment: (id: string) => void;
}


/** ساخت یا حذف movementهای انبار برای فاکتور */

// ===== Labelها =====

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
