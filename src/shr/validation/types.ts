/**
 * validation/types.ts — تایپ‌های مشترک
 */

/** نتیجه اعتبارسنجی */
export interface ValidationResult {
  ok: boolean;
  errors: Record<string, string>;
}

/** کانتکست اعتبارسنجی — داده‌های بیرونی که اسکیما به‌شون نیاز داره */
export interface ValidationContext {
  /** تعداد کل پرنده‌های گله */
  flockCount?: number;
  /** نوع گله */
  flockType?: 'layer' | 'broiler' | 'breeder';
  /** سن گله به روز */
  flockAgeDays?: number;
  /** تعداد اولیه گله */
  flockInitialCount?: number;
  /** تعداد زنده فعلی گله */
  flockCurrentCount?: number;
  /** تعداد نر */
  flockMaleCount?: number;
  /** تعداد ماده */
  flockFemaleCount?: number;
  /** موجودی انبار */
  stockAvailable?: number;
  /** نام آیتم انبار */
  stockItemName?: string;
  /** آیا ویرایش است؟ (id داره) */
  isEdit?: boolean;
  /** کلیدهای اضافی */
  [key: string]: any;
}

/** شدت خطا */
export type Severity = 'error' | 'warning';

/** خطای ساختاریافته */
export interface ValidationIssue {
  path: string;
  message: string;
  severity: Severity;
}
