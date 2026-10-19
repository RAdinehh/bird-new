/**
 * tra/calc.ts — توابع محاسباتی خالص معاملات
 */
import { parse as parseJ, differenceInDays as diffDaysJ, format as formatJ, addDays } from 'date-fns-jalali';
import type { Invoice, InvoiceItem, Payment, WorkflowStatus, CheckStatus, InvoiceStatus, InvoiceType, PaymentTerms, Installment } from './types';

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
  /* moneyRoundApplied */
  return Math.round(Math.max(0, base - discount));
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
  return Math.round(Math.max(0, base - net));
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
  return Math.round((q || 0) * (p || 0));
}

export function itemsSum(items: InvoiceItem[]): number {
  return Math.round(items.reduce((a, x) => a + (x.total || 0), 0));
}

export function paidSum(payments: Payment[]): number {
  return Math.round(payments.reduce((a, x) => {
    const amt = x.amount || 0;
    // عودت وجه (refund) از مبلغ پرداخت‌شده کم می‌شود
    if ((x as any).type === 'refund') return a - amt;
    // چک برگشتی: پول واریز نشده، پس از جمع کسر نمی‌شود
    if (x.method === 'check' && x.status === 'bounced') return a;
    return a + amt;
  }, 0));
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
  return Math.max(0, (Math.round(Math.max(0, (inv.total || 0) - paid))) - computeCashDiscount(inv));
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

export function computeCashDiscount(inv: Invoice): number {
  const pct = (inv as any).cashDiscountPct || 0;
  const days = (inv as any).cashDiscountDays || 0;
  if (pct <= 0 || days <= 0 || !inv.date) return 0;
  
  const toDays = (y: number, m: number, d: number) => {
    let total = y * 365 + d;
    for (let i = 1; i < m; i++) total += (i <= 6) ? 31 : 30;
    return total;
  };
  
  const sp = inv.date.split('/').map(Number);
  if (sp.length !== 3 || sp.some(isNaN)) return 0;
  const invDay = toDays(sp[0], sp[1], sp[2]);
  
  let eligiblePaid = 0;
  for (const p of (inv.payments || [])) {
    if (!p.date) continue;
    if ((p as any).type === 'refund') continue;
    const pp = p.date.split('/').map(Number);
    if (pp.length !== 3 || pp.some(isNaN)) continue;
    const payDay = toDays(pp[0], pp[1], pp[2]);
    const diff = payDay - invDay;
    if (diff >= 0 && diff <= days) eligiblePaid += p.amount || 0;
  }
  
  if (eligiblePaid <= 0) return 0;
  return Math.round(eligiblePaid * pct / 100);
}


/** تاریخ امروز شمسی (YYYY/MM/DD) */
export function getTodayJalali(): string {
  try {
    const d = new Date();
    const fmt = new Intl.DateTimeFormat('en-u-ca-persian-nu-latn', {
      year: 'numeric', month: '2-digit', day: '2-digit'
    });
    const parts = fmt.formatToParts(d);
    const y = parts.find(p => p.type === 'year')?.value || '';
    const m = parts.find(p => p.type === 'month')?.value || '';
    const dd = parts.find(p => p.type === 'day')?.value || '';
    return `${y}/${m}/${dd}`;
  } catch {
    return '';
  }
}

/** آیا فاکتور چک برگشتی دارد؟ */
export function hasBouncedCheck(inv: any): boolean {
  return (inv?.payments || []).some((p: any) => p.method === 'check' && p.status === 'bounced');
}

/** تعداد چک‌های برگشتی */
export function countBouncedChecks(inv: any): number {
  return (inv?.payments || []).filter((p: any) => p.method === 'check' && p.status === 'bounced').length;
}

/** فرمت نمایشی شماره فاکتور: P140507001 → P۰۵۰۷۰۰۱ (حذف ۲ رقم اول سال + اعداد فارسی) */
export function formatInvoiceNumber(num: string | undefined | null): string {
  if (!num) return '—';
  let prefix = '';
  let rest = num;
  if (num.startsWith('P')) { prefix = 'P'; rest = num.slice(1); }
  else if (num.startsWith('S')) { prefix = 'S'; rest = num.slice(1); }
  // حذف ۲ رقم اول سال: 140507001 → 0507001
  if (rest.length >= 6) rest = rest.slice(2);
  const faDigits = rest.replace(/\d/g, (d: string) => '۰۱۲۳۴۵۶۷۸۹'[parseInt(d)]);
  return prefix ? `${prefix}${faDigits}` : faDigits;
}
/** افزودن N روز به تاریخ شمسی */
export function addJalaliDays(dateStr: string, days: number): string {
  if (!dateStr) return '';
  try {
    const en = dateStr.replace(/[۰-۹]/g, (d: string) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d)));
    const base = parseJ(en, 'yyyy/MM/dd', new Date());
    if (isNaN(base.getTime())) return dateStr;
    return formatJ(addDays(base, days), 'yyyy/MM/dd');
  } catch { return dateStr; }
}

/** تولید آرایه اقساط — استاندارد صنعت: باقیمانده روی آخرین قسط، پیش‌پرداخت کسر می‌شود */
export function generateInstallments(
  totalAmount: number,
  count: number,
  gapDays: number,
  startDate: string,
  advancePaid: number = 0
): Installment[] {
  if (!totalAmount || totalAmount <= 0) return [];
  if (!count || count <= 0) return [];
  if (!startDate) return [];
  const gap = gapDays > 0 ? gapDays : 30;
  const remaining = Math.max(0, totalAmount - (advancePaid || 0));
  if (remaining <= 0) return [];
  const perInstallment = Math.round(remaining / count);
  const out: Installment[] = [];
  let accumulated = 0;
  for (let i = 0; i < count; i++) {
    const isLast = i === count - 1;
    const amount = isLast ? (remaining - accumulated) : perInstallment;
    accumulated += amount;
    const dueDate = addJalaliDays(startDate, (i + 1) * gap);
    out.push({
      id: crypto.randomUUID(),
      number: i + 1,
      dueDate,
      amount,
      status: 'pending',
      paid: false,
      paidDate: '',
    });
  }
  return out;
}

