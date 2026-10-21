/**
 * types-store.ts — تایپ‌های store گله
 * جدا شده از store.ts
 */

export type FlockType = 'layer' | 'broiler' | 'breeder';
export type FlockStatus = 'active' | 'archived' | 'sold' | 'merged';

export type FlockEventType = 'add' | 'sell' | 'death' | 'transfer' | 'correction' | 'cull';

export type FlockEventReasonCode =
  | 'data_entry_error'
  | 'found_stock'
  | 'disease'
  | 'predator'
  | 'heat_stress'
  | 'equipment_failure'
  | 'unknown';
export type FlockEventSex = 'male' | 'female' | 'mixed';

export interface FlockEvent {
  id: string;
  flockId: string;
  date: string;
  type: FlockEventType;
  count: number;
  sex: FlockEventSex;
  origin?: 'purchase' | 'hatch' | 'transfer';
  buyerId?: string;
  reason?: string;
  unitPrice?: number;
  totalPrice?: number;
  invoiceId?: string;
  hatchId?: string;
  notes: string;
  createdAt: string;
  /** کد دلیل استاندارد (برای correction/recount) */
  reasonCode?: FlockEventReasonCode;
  /** اگر این رویداد اصلاح یه رویداد دیگه‌ست */
  linkedEventId?: string;
  /** آخرین ویرایش */
  updatedAt?: string;
  /** نسخه (آینده optimistic locking) */
  version?: number;
  /** آیا این رویداد لغو شده؟ */
  revoked?: boolean;
  /** شناسه correction ای که این رویداد رو لغو کرده */
  revokedBy?: string;
}

export interface FlockMergeSource {
  flockId: string;
  flockName: string;
  count: number;
  ageDays: number;
}

export interface FlockMergeInfo {
  sources: FlockMergeSource[];
  avgAgeDays: number;
  mergedAt: string;
}

export type FlockDealType = 'own' | 'partnership' | 'consignment' | 'rent';

export interface FlockDealData {
  partnerId?: string;
  partnerShare?: number;
  consignorId?: string;
  lessorId?: string;
  rentAmount?: number;
  rentPeriod?: 'monthly' | 'season' | 'total';
  dealId?: string;
  /** 🆕 شروع اجاره (ممکنه ≠ startDate گله) */
  rentStartDate?: string;
  /** 🆕 پایان قرارداد اجاره */
  rentEndDate?: string;
  /** 🆕 پرداخت‌های واقعی اجاره */
  rentPayments?: Array<{ id: string; date: string; amount: number; notes: string }>;
}

export type FlockGroupType = 'season' | 'breed' | 'cohort' | 'farm' | 'owner' | 'custom' | 'smart';

export interface FlockGroupRule {
  type?: FlockType;
  status?: FlockStatus;
  hallId?: string;
  breedId?: string;
  birdId?: string;
  source?: string;
  dealType?: FlockDealType;
  minAge?: number;
  maxAge?: number;
}

export interface FlockGroup {
  id: string;
  name: string;
  type: FlockGroupType;
  description?: string;
  color?: string;
  parentGroupId?: string;
  rule?: FlockGroupRule;
  archived?: boolean;
  sortOrder?: number;
  createdAt: string;
  updatedAt: string;
}

export interface FlockGroupMember {
  groupId: string;
  flockId: string;
  joinedAt: string;
  leftAt?: string;
  role?: 'primary' | 'secondary';
  weight?: number;
  notes?: string;
}
