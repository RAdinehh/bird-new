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
  draft: '✏️ در حال نوشتن',
  confirmed: '📝 خرید قطعی',
  received: '📦 کالا رسید',
  paid: '💰 تسویه شد',
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
  /** وزن هر بسته/واحد برای تبدیل به واحد پایه انبار */
  unitWeight?: number | null;
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
  /** وزن اولیه جوجه به گرم */
  chickWeight?: number | null;
  /** تاریخ انقضا دارو/دان (برای انتقال به Movement) */
  expiryDate?: string;
  /** شماره بچ / سریال (برای واکسن و دارو) */
  batchNo?: string;
  /** دوره پرهیز (روز) — برای دارو و واکسن */
  withdrawalDays?: number | null;
  flockName?: string;
  storage?: string;
  usageType?: string;
  costType?: string;
  equipmentCategory?: string;
  equipmentType?: string;
  equipmentId?: string;
  stockItemId?: string;
  model?: string;
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
  /** 🆕 منبع قلم — گله موجود یا هچری */
  source?: 'flock' | 'hatch';
  /** 🆕 شناسه هچ مبدأ (اگه source = 'hatch') */
  hatchId?: string;
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
  partyPaymentId?: string;
  /** شناسه طرف حساب (برای اعتبار) */
  partyId?: string;
}

export interface DeletedInvoiceSnapshot {
  invoice: Invoice;
  linkedFlocks: Array<{ id: string; sourceCategory: string; birdId?: string | null; breedId?: string | null }>;
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
  relatedDealId?: string;
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

export type DealUnit = 'pcs' | 'kg' | 'ton' | 'bag' | 'L' | 'carton';
export type DealDeliveryType = 'out' | 'return' | 'loss' | 'in';
export type DealPaymentDirection = 'in' | 'out';

export interface DealGood {
  id: string;
  name: string;
  quantity: number;
  unit: DealUnit;
  estimatedPrice: number;
  linkedItemId?: string;
}

export interface DealDelivery {
  id: string;
  goodId: string;
  date: string;
  /** ساعت تحویل به فرمت HH:MM (لاتین) — برای تمایز چند تحویل هم‌روز */
  time?: string;
  type: DealDeliveryType;
  quantity: number;
  notes?: string;
  whsMovementId?: string;
  /** @deprecated — از ownership استفاده کنید */
  whsEnabled?: boolean;
  /**
   * 🆕 Phase B: مالکیت کالای تحویل‌شده
   * - 'none'   — بدون اثر انباری
   * - 'mine'   — امانت: کالا از stock به consignment:partyId می‌ره (currentStock ثابت)
   * - 'theirs' — فروش: کالا از stock کم می‌شه
   */
  ownership?: 'none' | 'mine' | 'theirs';
  /** 🆕 Phase B: movement ورود به موقعیت امانی (فقط ownership='mine') */
  whsMovementIdIn?: string;
  /** Phase D: لینک به تحویل دیگر برای تهاتر */
  linkedDeliveryId?: string;
}

export interface DealPayment {
  id: string;
  date: string;
  amount: number;
  direction: DealPaymentDirection;
  method: 'cash' | 'card' | 'check';
  notes?: string;
}

export interface DealSale {
  id: string;
  goodId: string;
  date: string;
  quantity: number;
  unitPrice: number;
  notes?: string;
}

export type SettlementType =
  | 'commission_pct'
  | 'commission_per_unit'
  | 'fixed_amount'
  | 'barter_direct'
  | 'profit_sharing'
  | 'rental_monthly'
  | 'grower_fee_per_unit';

export type SettlementStatus = 'draft' | 'confirmed' | 'invoiced';

export interface Settlement {
  id: string;
  dealId: string;
  periodStart: string;
  periodEnd: string;
  deliveriesSnapshot: DealDelivery[];
  salesSnapshot: DealSale[];
  paymentsSnapshot: DealPayment[];
  grossSales: number;
  commission: number;
  netPayable: number;
  paidAmount: number;
  status: SettlementStatus;
  invoiceId?: string;
  notes?: string;
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
  dealNumber?: string;
  startDate?: string;
  endDate?: string;
  settlementType?: SettlementType;
  settlementValue?: number | null;
  cancelReason?: string;
  goods?: DealGood[];
  deliveries?: DealDelivery[];
  sales?: DealSale[];
  payments?: DealPayment[];
  createdAt: string;
  updatedAt: string;
}

export interface PaymentAllocation {
  id: string;
  paymentId: string;
  invoiceId: string;
  amount: number;
  date: string;
  notes?: string;
}

export interface State {
  reopenInvoice: (id: string) => void;
  invoices: Invoice[];
  deals: Deal[];
  settlements: Settlement[];
  addSettlement: (s: Omit<Settlement, 'id' | 'createdAt' | 'updatedAt'>) => string;
  updateSettlement: (id: string, patch: Partial<Settlement>) => void;
  deleteSettlement: (id: string) => void;
  allocations: PaymentAllocation[];
  addAllocation: (a: Omit<PaymentAllocation, 'id'>) => string;
  updateAllocation: (id: string, patch: Partial<PaymentAllocation>) => void;
  deleteAllocation: (id: string) => void;
  addInvoice: (i: Omit<Invoice, 'id'|'createdAt'|'updatedAt'>) => string;
  updateInvoice: (id: string, patch: Partial<Invoice>) => void;
  deleteInvoice: (id: string) => void;
  restoreInvoice: (id: string) => boolean;
  listDeletedInvoices: () => DeletedInvoiceSnapshot[];
  addDeal: (d: Omit<Deal, 'id'|'createdAt'|'updatedAt'>) => void;
  updateDeal: (id: string, patch: Partial<Deal>) => void;
  deleteDeal: (id: string) => void;
  /** پرداخت‌های سطح طرف حساب (Phase 6) */
  partyPayments: PartyPayment[];
  addPartyPayment: (p: Omit<PartyPayment, 'id'|'createdAt'|'updatedAt'>) => string;
  updatePartyPayment: (id: string, patch: Partial<PartyPayment>) => void;
  deletePartyPayment: (id: string) => void;
  bouncePartyPayment: (ppId: string) => void;
  clearPartyPayment: (ppId: string) => void;
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
    ['herbal', 'داروی گیاهی'],
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
    ['broken', 'تخم شکسته'],
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
