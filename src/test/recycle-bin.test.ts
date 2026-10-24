import { describe, it, expect, beforeEach } from 'vitest';
import { useWhs } from '../mod/whs/store';
import { useTra } from '../mod/tra/store';
import { clearRecycleBin, listRecycleBin } from '../shr/utils/recycleBin';
import type { DeletedInvoiceSnapshot } from '../mod/tra/types';

describe('Recycle Bin — Backup Before Mutation', () => {
  beforeEach(() => {
    useWhs.setState({ items: [], movements: [] });
    useTra.setState({ invoices: [] });
    clearRecycleBin('tra');
  });

  it('حذف فاکتور → ثبت در recycle bin → بازیابی موفق', () => {
    // ۱. ساخت فاکتور
    const invId = useTra.getState().addInvoice({
      type: 'sale',
      date: '1405/07/21',
      partyId: 'p1',
      category: 'other',
      items: [{
        id: 'item-1',
        category: 'other',
        description: 'کالای تست',
        quantity: 1,
        unitPrice: 100000,
        total: 100000,
      }],
      payments: [],
      discount: 0,
      shipping: 0,
      total: 100000,
    } as any);

    expect(useTra.getState().invoices).toHaveLength(1);

    // ۲. حذف
    useTra.getState().deleteInvoice(invId);
    expect(useTra.getState().invoices).toHaveLength(0);

    // ۳. چک کردن recycle bin
    const bin = useTra.getState().listDeletedInvoices();
    expect(bin).toHaveLength(1);
    expect(bin[0].invoice.id).toBe(invId);

    // ۴. بازیابی
    const ok = useTra.getState().restoreInvoice(invId);
    expect(ok).toBe(true);
    expect(useTra.getState().invoices).toHaveLength(1);
    expect(useTra.getState().invoices[0].id).toBe(invId);

    // ۵. recycle bin خالی شد
    expect(listRecycleBin<DeletedInvoiceSnapshot>('tra')).toHaveLength(0);
  });

  it('بازیابی فاکتور ناموجود → false', () => {
    const ok = useTra.getState().restoreInvoice('nonexistent-id');
    expect(ok).toBe(false);
  });
});
