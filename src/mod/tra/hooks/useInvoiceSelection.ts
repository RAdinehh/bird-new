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
  flocks?: any[];
  settlements?: any[];
}

export function useInvoiceSelection({ list, invoices, deleteInvoice, setUndoData, flocks = [], settlements = [] }: Params) {
  return useMultiSelect({
    items: list,
    getId: (x: any) => x.id,
    onDelete: async (ids: string[]) => {
      // 🆕 چک لینک‌ها (گله/تسویه)
      const linked: Array<{ id: string; flocks: number; settlements: number }> = [];
      for (const id of ids) {
        const fl = flocks.filter((f: any) => f.sourceInvoiceId === id).length;
        const st = settlements.filter((s: any) => s.invoiceId === id).length;
        if (fl > 0 || st > 0) {
          linked.push({ id, flocks: fl, settlements: st });
        }
      }
      if (linked.length > 0) {
        const totalFlocks = linked.reduce((s, x) => s + x.flocks, 0);
        const totalSettlements = linked.reduce((s, x) => s + x.settlements, 0);
        const linkedOk = await showConfirmAsync(
          '⚠️ فاکتورهای متصل',
          linked.length + ' فاکتور به ' + totalFlocks + ' گله و ' + totalSettlements + ' تسویه وصل است. حذف آن‌ها باعث قطع ارتباط می‌شود. ادامه؟',
          { danger: true, confirmText: 'حذف' }
        );
        if (!linkedOk) return;
      }
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
