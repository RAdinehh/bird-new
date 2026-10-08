/**
 * useInvoiceSelection — مدیریت Multi-Select فاکتورها
 */
import { useMultiSelect } from '../../../shr/multiSelect/useMultiSelect';
import { toFa } from '../../../shr/utils/fa';
import { showConfirmAsync } from '../../../cor/store/dialog';
import { toastMsg } from '../../../cor/store/toast';

interface Params {
  list: any[];
  invoices: any[];
  deleteInvoice: (id: string) => void;
  setUndoData: (v: any) => void;
}

export function useInvoiceSelection({ list, invoices, deleteInvoice, setUndoData }: Params) {
  return useMultiSelect({
    items: list,
    getId: (x: any) => x.id,
    onDelete: async (ids: string[]) => {
      const ok = await showConfirmAsync('حذف گروهی', toFa(ids.length) + ' فاکتور حذف شوند؟', { danger: true });
      if (!ok) return;
      const backups: any[] = [];
      for (const id of ids) {
        const item = invoices.find(c => c.id === id);
        if (!item) continue;
        backups.push(item);
        try { deleteInvoice(id); } catch {}
      }
      if (backups.length > 0) {
        setUndoData({ item: backups });
        setTimeout(() => setUndoData((cur: any) => cur && Array.isArray(cur.item) && cur.item.length === backups.length ? null : cur), 8000);
      }
      toastMsg.deletedBulk(backups.length, 'فاکتور');
    },
  });
}
