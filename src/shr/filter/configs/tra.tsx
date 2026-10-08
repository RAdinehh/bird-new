/** filter/configs/tra.tsx */
import { IconFolder, IconActivity, IconTag, IconDollar, IconClock, IconUser, IconCalendar } from '../../icons';
import { type Deal, type Invoice, DEAL_LABEL as TRA_DEAL_LABEL, remaining as traRemaining, ageDays as traAgeDays, agingBucket as traAgingBucket, WORKFLOW_LABEL as TRA_WORKFLOW_LABEL } from '../../../mod/tra/store';
import type { FilterConfig } from './_types';

export function getTraDealsConfig(ctx: {
  partyNames: Record<string, string>;
}): FilterConfig<Deal> {
  return {
    filterDefs: [
      {
        key: 'type', label: 'نوع', kind: 'enum',
        icon: <IconTag size={18} />,
        options: (Object.keys(TRA_DEAL_LABEL) as Array<keyof typeof TRA_DEAL_LABEL>).map(t => ({
          value: t,
          label: TRA_DEAL_LABEL[t],
        })),
        getValue: (d: Deal) => d.type || '',
        multi: true,
      },
      {
        key: 'status', label: 'وضعیت', kind: 'enum',
        icon: <IconActivity size={18} />,
        options: [
          { value: 'open', label: 'باز' },
          { value: 'settled', label: 'تسویه شده' },
          { value: 'cancelled', label: 'لغو شده' },
        ],
        getValue: (d: Deal) => d.status || 'open',
        multi: true,
      },
      {
        key: 'partyId', label: 'طرف معامله', kind: 'enum',
        icon: <IconUser size={18} />,
        options: Object.entries(ctx.partyNames).map(([id, name]) => ({ value: id, label: name })),
        getValue: (d: Deal) => d.partyId || '',
        layout: 'chips',
      },
    ],
    sortDefs: [
      {
        key: 'date', label: 'تاریخ', icon: <IconCalendar size={18} />,
        hint: 'جدیدترین اول',
        compare: (a: Deal, b: Deal) => (a.date || '').localeCompare(b.date || ''),
      },
      {
        key: 'value', label: 'مبلغ', icon: <IconDollar size={18} />,
        hint: 'ارزش معامله',
        compare: (a: Deal, b: Deal) => (a.value || 0) - (b.value || 0),
      },
      {
        key: 'dueDate', label: 'سرسید', icon: <IconCalendar size={18} />,
        hint: 'نزدیک‌ترین سرسید اول',
        compare: (a: Deal, b: Deal) => (a.dueDate || '').localeCompare(b.dueDate || ''),
      },
      {
        key: 'createdAt', label: 'جدیدترین ثبت', icon: <IconClock size={18} />,
        hint: 'بر اساس تاریخ ایجاد',
        compare: (a: Deal, b: Deal) => (a.createdAt || '').localeCompare(b.createdAt || ''),
      },
    ],
    persistKey: 'tra-deals',
    initialSort: { key: 'date', dir: 'desc' },
  };
}

// ═══════════════════════════════════════════════════
// tra/ReceivablesPage — مطالبات
// ═══════════════════════════════════════════════════
export function getTraReceivablesConfig(ctx: {
  partyNames: Record<string, string>;
}): FilterConfig<Invoice> {
  return {
    filterDefs: [
      {
        key: 'dueStatus', label: 'وضعیت سرسید', kind: 'enum',
        icon: <IconCalendar size={18} />,
        options: [
          { value: 'overdue', label: 'معوق' },
          { value: 'soon', label: 'نزدیک سرسید' },
        ],
        getValue: (i: Invoice) => {
          if (!i.dueDate) return '';
          const parts = i.dueDate.replace(/[۰-۹]/g, d => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d).toString()).split('/');
          if (parts.length !== 3) return '';
          const d = new Date(+parts[0], +parts[1] - 1, +parts[2]);
          const days = Math.ceil((d.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
          if (days < 0) return 'overdue';
          if (days <= 7) return 'soon';
          return '';
        },
        multi: true,
      },
      {
        key: 'aging', label: 'سن بدهی', kind: 'enum',
        icon: <IconClock size={18} />,
        options: [
          { value: '0-15', label: '۰ تا ۱۵ روز' },
          { value: '16-30', label: '۱۶ تا ۳۰ روز' },
          { value: '31-60', label: '۳۱ تا ۶۰ روز' },
          { value: '61-90', label: '۶۱ تا ۹۰ روز' },
          { value: '+90', label: 'بیش از ۹۰ روز' },
        ],
        getValue: (i: Invoice) => traAgingBucket(traAgeDays(i)),
        multi: true,
      },
      {
        key: 'partyId', label: 'طرف معامله', kind: 'enum',
        icon: <IconUser size={18} />,
        options: Object.entries(ctx.partyNames).map(([id, name]) => ({ value: id, label: name })),
        getValue: (i: Invoice) => i.partyId || '',
        layout: 'chips',
      },
    ],
    sortDefs: [
      {
        key: 'dueDate', label: 'سرسید', icon: <IconCalendar size={18} />,
        hint: 'نزدیک‌ترین سرسید اول',
        compare: (a: Invoice, b: Invoice) => (a.dueDate || '').localeCompare(b.dueDate || ''),
      },
      {
        key: 'date', label: 'تاریخ فاکتور', icon: <IconCalendar size={18} />,
        hint: 'جدیدترین اول',
        compare: (a: Invoice, b: Invoice) => (a.date || '').localeCompare(b.date || ''),
      },
      {
        key: 'remaining', label: 'باقی‌مانده', icon: <IconDollar size={18} />,
        hint: 'مبلغ باقی‌مانده',
        compare: (a: Invoice, b: Invoice) => traRemaining(a) - traRemaining(b),
      },
      {
        key: 'total', label: 'مبلغ کل', icon: <IconDollar size={18} />,
        hint: 'مبلغ کل فاکتور',
        compare: (a: Invoice, b: Invoice) => (a.total || 0) - (b.total || 0),
      },
    ],
    persistKey: 'tra-receivables',
    initialSort: { key: 'dueDate', dir: 'asc' },
  };
}

// ═══════════════════════════════════════════════════
// tra/InvoicePage — فاکتورهای خرید/فروش
// ═══════════════════════════════════════════════════
export function getTraInvoicesConfig(ctx: {
  partyNames: Record<string, string>;
  categories: Array<[string, string]>;
}): FilterConfig<Invoice> {
  return {
    filterDefs: [
      {
        key: 'category', label: 'دسته', kind: 'enum',
        icon: <IconFolder size={18} />,
        options: ctx.categories.map(([v, l]) => ({ value: v, label: l })),
        getValue: (i: Invoice) => i.category || '',
        multi: true,
      },
      {
        key: 'workflow', label: 'وضعیت پرداخت', kind: 'enum',
        icon: <IconActivity size={18} />,
        options: (Object.keys(TRA_WORKFLOW_LABEL) as Array<keyof typeof TRA_WORKFLOW_LABEL>).map(w => ({
          value: w,
          label: TRA_WORKFLOW_LABEL[w],
        })),
        getValue: (i: Invoice) => i.workflowStatus || 'draft',
        multi: true,
      },
      {
        key: 'paymentStatus', label: 'وضعیت تسویه', kind: 'enum',
        icon: <IconDollar size={18} />,
        options: [
          { value: 'paid', label: 'تسویه شده' },
          { value: 'partial', label: 'جزئی' },
          { value: 'unpaid', label: 'تسویه نشده' },
        ],
        getValue: (i: Invoice) => {
          const rem = traRemaining(i);
          const total = i.total || 0;
          if (rem <= 0) return 'paid';
          if (rem < total) return 'partial';
          return 'unpaid';
        },
        multi: true,
      },
      {
        key: 'partyId', label: 'طرف معامله', kind: 'enum',
        icon: <IconUser size={18} />,
        options: Object.entries(ctx.partyNames).map(([id, name]) => ({ value: id, label: name })),
        getValue: (i: Invoice) => i.partyId || '',
        layout: 'chips',
      },
    ],
    sortDefs: [
      {
        key: 'date', label: 'تاریخ', icon: <IconCalendar size={18} />,
        hint: 'جدیدترین اول',
        compare: (a: Invoice, b: Invoice) => (a.date || '').localeCompare(b.date || ''),
      },
      {
        key: 'total', label: 'مبلغ کل', icon: <IconDollar size={18} />,
        hint: 'بر اساس مبلغ',
        compare: (a: Invoice, b: Invoice) => (a.total || 0) - (b.total || 0),
      },
      {
        key: 'remaining', label: 'باقی‌مانده', icon: <IconDollar size={18} />,
        hint: 'مبلغ باقی‌مانده',
        compare: (a: Invoice, b: Invoice) => traRemaining(a) - traRemaining(b),
      },
      {
        key: 'dueDate', label: 'سرسید', icon: <IconCalendar size={18} />,
        hint: 'نزدیک‌ترین سرسید اول',
        compare: (a: Invoice, b: Invoice) => (a.dueDate || '').localeCompare(b.dueDate || ''),
      },
    ],
    persistKey: 'tra-invoices',
    initialSort: { key: 'date', dir: 'desc' },
  };
}
