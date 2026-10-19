/**
 * events.ts — تعریف رسمی همه eventهای سیستم
 *
 * قرارداد نام‌گذاری: {module}:{entity}:{action}
 * مثال: dlg:deaths:recorded = دlg، تلفات، ثبت شد
 *
 * ⚠️ این فایل قرارداد رسمی Event Bus است.
 * هر event جدید باید اینجا تعریف شه.
 */

// ─── dlg (ثبت روزانه) ───
export interface DlgDeathsRecorded {
  logId: string;
  flockId: string;
  date: string;
  count: number;
  deaths: Array<{ id: string; count: number; cause: string; notes: string }>;
  isEdit: boolean;
  prevCount?: number;
  prevFlockId?: string;
}

export interface DlgFeedConsumed {
  logId: string;
  flockId: string;
  date: string;
  itemId: string;
  quantity: number;
  isFormula: boolean;
}

export interface DlgVaccineGiven {
  logId: string;
  flockId: string;
  date: string;
  itemId: string;
  quantity: number;
  name: string;
}

export interface DlgMedicationGiven {
  logId: string;
  flockId: string;
  date: string;
  itemId: string;
  quantity: number;
  name: string;
}

export interface DlgEggRecorded {
  logId: string;
  flockId: string;
  date: string;
  eating: number;
  fertile: number;
  broken: number;
  other: number;
}

export interface DlgLogDeleted {
  logId: string;
  flockId: string;
  date: string;
  deathsCount: number;
  feedMovementIds: string[];
  eggProductionId?: string;
}

// ─── tra (معاملات) ───
/** رفرنس سبک به InvoiceItem — فقط فیلدهای لازم برای هم‌ترازی whs */
export interface TraInvoiceItemRef {
  itemId?: string;
  quantity?: number;
  unitPrice?: number;
  description?: string;
  movementId?: string;
  /** مقدار به واحد پایه انبار (UoM) — اگر خالی/صفر باشد از quantity استفاده می‌شود */
  baseQuantity?: number | null;
  /** تاریخ انقضا (برای دارو) */
  expiryDate?: string;
  /** 🆕 گله مرتبط */
  flockId?: string;
}

export interface TraInvoiceCreated {
  invoiceId: string;
  invoice: any;
  /** ارجاع mutable به آیتم‌های فاکتور — handler می‌تواند movementId را ست کند */
  items?: TraInvoiceItemRef[];
}

export interface TraInvoiceUpdated {
  invoiceId: string;
  invoice: any;
  prevInvoice: any;
  items?: TraInvoiceItemRef[];
  prevItems?: TraInvoiceItemRef[];
}

export interface TraInvoiceDeleted {
  invoiceId: string;
  invoice: any;
  items?: TraInvoiceItemRef[];
}

// ─── flk (گله) ───
export interface FlkFlockCreated {
  flockId: string;
  flock: any;
}

export interface FlkFlockUpdated {
  flockId: string;
  patch: any;
}

export interface FlkFlockArchived {
  flockId: string;
}

// ─── egg (تخم) ───
export interface EggProductionCreated {
  prodId: string;
  production: any;
}

export interface EggProductionUpdated {
  prodId: string;
  production: any;
  prevProduction: any;
}

export interface EggProductionDeleted {
  prodId: string;
  production: any;
}

// ─── inc (جوجه‌کشی) ───
export interface IncHatchCreated {
  hatchId: string;
  hatch: any;
}

export interface IncHatchDeleted {
  hatchId: string;
  hatch: any;
}

// ─── whs (انبار) ───
export interface WhsMovementCreated {
  movementId: string;
  movement: any;
}

// ─── نقشه‌ی eventها (Type-safe) ───
export interface AppEvents {
  'dlg:deaths:recorded': DlgDeathsRecorded;
  'dlg:feed:consumed': DlgFeedConsumed;
  'dlg:vaccine:given': DlgVaccineGiven;
  'dlg:medication:given': DlgMedicationGiven;
  'dlg:egg:recorded': DlgEggRecorded;
  'dlg:log:deleted': DlgLogDeleted;

  'tra:invoice:created': TraInvoiceCreated;
  'tra:invoice:updated': TraInvoiceUpdated;
  'tra:invoice:deleted': TraInvoiceDeleted;

  'flk:flock:created': FlkFlockCreated;
  'flk:flock:updated': FlkFlockUpdated;
  'flk:flock:archived': FlkFlockArchived;

  'egg:production:created': EggProductionCreated;
  'egg:production:updated': EggProductionUpdated;
  'egg:production:deleted': EggProductionDeleted;

  'inc:hatch:created': IncHatchCreated;
  'inc:hatch:deleted': IncHatchDeleted;

  'whs:movement:created': WhsMovementCreated;
}

export type AppEventName = keyof AppEvents;
export type AppEventData<K extends AppEventName> = AppEvents[K];
