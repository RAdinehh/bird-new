/**
 * store.ts — Zustand store معاملات
 */
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { v4 as uuid } from 'uuid';
import { useWhs } from '../whs/store';
import { useFlk } from '../flk/store';

import type { Invoice, InvoiceItem, State } from './types';
import { applyInvoiceMovements, applyInvoiceFlocks, applyInvoiceEquipment, applyInvoiceEgg, BIRD_CATS } from './invoiceHelpers';
import { generateInvoiceNumber } from './calc';
import { showToast } from '../../cor/store/toast';

const now = () => new Date().toISOString();

// re-export همه انواع و توابع
export * from './types';
export * from './calc';
export * from './invoiceHelpers';

export const useTra = create<State>()(
  persist(
    (set, get) => ({
      invoices: [],
      deals: [],
      addInvoice: (i) => {
        const id = uuid();
        const num = generateInvoiceNumber(i.type, i.date, get().invoices);
        const newInv = { ...i, id, number: i.number || num, createdAt: now(), updatedAt: now() } as any;
        let items: InvoiceItem[] = newInv.items || [];
        // 🎯 ۱. اتصال به انبار (اگه قلم‌ها به whs وصل باشن)
        try { items = applyInvoiceMovements({ ...newInv, items }); } catch(e) {}
        // 🎯 ۲. اعمال روی گله‌ها (خرید/فروش پرنده)
        try { items = applyInvoiceFlocks({ ...newInv, items }); } catch(e) {}
        // 🎯 ۳. اتصال تجهیزات به فاکتور
        try { items = applyInvoiceEquipment({ ...newInv, items }); } catch(e) {}
        // 🎯 ۴. اتصال فروش تخم به ماژول egg
        try { items = applyInvoiceEgg({ ...newInv, items }); } catch(e) {}
        const final = { ...newInv, items };
        set({ invoices: [...get().invoices, final] });
        return id;
      },
      updateInvoice: (id, patch) => {
        const prev = get().invoices.find(x => x.id === id);
        if (!prev) return;
        const merged = { ...prev, ...patch, updatedAt: now() } as Invoice;
        const itemsMoved = applyInvoiceMovements(merged, prev.items);
        const mergedWithItems = { ...merged, items: itemsMoved };
        let itemsFinal: InvoiceItem[] = itemsMoved;
        try { itemsFinal = applyInvoiceFlocks(mergedWithItems, prev); } catch(e) {}
        try { itemsFinal = applyInvoiceEquipment({ ...mergedWithItems, items: itemsFinal }); } catch(e) {}
        try { itemsFinal = applyInvoiceEgg({ ...mergedWithItems, items: itemsFinal }); } catch(e) {}
        const final = { ...mergedWithItems, items: itemsFinal };
        set({ invoices: get().invoices.map(x => x.id === id ? final : x) });
      },
      deleteInvoice: (id) => {
        const inv = get().invoices.find(x => x.id === id);
        // 🆕 guard: چک گله‌های متصل
        if (inv) {
          const flkState = useFlk.getState();
          const linked = flkState.flocks.filter((f: any) => f.sourceInvoiceId === id);
          if (linked.length > 0) {
            showToast('این فاکتور ' + linked.length + ' گله دارد — ابتدا گله را حذف کنید', 'error');
            return;
          }
        }
        if (inv) {
          // revert flock effect
          const flk = useFlk.getState();
          for (const it of inv.items || []) {
            if (!it.birdId || !it.flockId) continue;
            if (!BIRD_CATS.includes(inv.category)) continue;
            const qty = it.quantity || 0;
            if (qty <= 0) continue;
            const f = flk.flocks.find(x => x.id === it.flockId);
            if (!f) continue;
            const cur = f.currentCount ?? 0;
            if (inv.type === 'purchase') flk.update(it.flockId, { currentCount: Math.max(0, cur - qty) });
            else if (inv.type === 'sale') flk.update(it.flockId, { currentCount: cur + qty });
          }
          const whs = useWhs.getState();
          inv.items.forEach(it => {
            if (it.movementId) {
              try { whs.deleteMovement(it.movementId); } catch (e) {}
            }
          });
        }
        set({ invoices: get().invoices.filter(x => x.id !== id) });
      },
      addDeal: (d) => set({ deals: [...get().deals, {...d, id: uuid(), createdAt: now(), updatedAt: now()}] }),
      updateDeal: (id, patch) => set({ deals: get().deals.map(x => x.id === id ? {...x, ...patch, updatedAt: now()} : x) }),
      deleteDeal: (id) => set({ deals: get().deals.filter(x => x.id !== id) })
    }),
    {
      name: 'pm-tra',
      version: 4,
      migrate: (persisted: any, version: number) => {
        if (!persisted?.invoices) return persisted;

        persisted.invoices = persisted.invoices.map((inv: any) => {
          // مقادیر پیش‌فرض بر اساس وضعیت فعلی
          const payments = inv.payments || [];
          const total = inv.total || 0;
          const paidSum = payments.reduce((a: number, p: any) => a + (p.amount || 0), 0);
          const isPaid = total > 0 && paidSum >= total;

          // وضعیت workflow خودکار
          let workflowStatus = 'confirmed';
          if (isPaid) workflowStatus = 'paid';
          else if (payments.length > 0) workflowStatus = 'confirmed';

          return {
            ...inv,
            // فاز A
            paymentTerms: inv.paymentTerms || (inv.dueDate === inv.date ? 'cash' : 'custom'),
            installmentCount: inv.installmentCount ?? 1,
            installmentGapDays: inv.installmentGapDays ?? 30,
            customDueDate: inv.customDueDate || inv.dueDate || '',
            paymentNote: inv.paymentNote || '',
            // فاز B
            workflowStatus,
            confirmedAt: inv.confirmedAt || inv.createdAt,
            receivedAt: inv.receivedAt || '',
            receivedNote: inv.receivedNote || '',
            paidAt: inv.paidAt || '',
            paidNote: inv.paidNote || '',
            // فاز C
            isPreorder: inv.isPreorder ?? false,
            deliveryDate: inv.deliveryDate || '',
            advancePayment: inv.advancePayment ?? 0,
            advancePercent: inv.advancePercent ?? 0,
            // فاز D
            deferrals: inv.deferrals || [],
            remindersMuted: inv.remindersMuted ?? false,
            // گسترش Payment
            payments: (inv.payments || []).map((p: any) => ({
              ...p,
              status: p.status || 'pending',
              clearedDate: p.clearedDate || '',
              bouncedDate: p.bouncedDate || '',
              bouncedInvoiceId: p.bouncedInvoiceId || '',
            })),
            // گسترش InvoiceItem
            items: (inv.items || []).map((it: any) => ({
              ...it,
              discountType: it.discountType || '',
              discountValue: it.discountValue ?? 0,
            })),
          };
        });

        return persisted;
      }
    }
  )
);

