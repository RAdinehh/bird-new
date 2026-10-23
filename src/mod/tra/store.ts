/**
 * store.ts — Zustand store معاملات
 */
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { v4 as uuid } from 'uuid';
import { useFlk } from '../flk/store';
import { useEgg } from '../egg/store';
import { verifyInvariantsIfDev } from '../../shr/dev/invariants';
import { useWhs } from '../whs/store';
import { useHal } from '../hal/store';
import { bus } from '../../cor/events';

import type { Invoice, InvoiceItem, State } from './types';
import { applyPaymentsToInstallments, paidSumAllocated, computeCashDiscount } from './calc';
import { applyInvoiceFlocks, applyInvoiceEquipment, applyInvoiceEgg, BIRD_CATS } from './invoiceHelpers';
import { applyInvoiceStock } from './applyStock';
import { generateInvoiceNumber, paidSum } from './calc';
import { showToast } from '../../cor/store/toast';
import { useInc } from '../inc/store';
import { setPartyCredit } from '../ctc/store';
import { partyBalance } from './formulas';

const now = () => new Date().toISOString();

// re-export همه انواع و توابع
export * from './types';
export * from './calc';
export * from './invoiceHelpers';

export const useTra = create<State>()(
  persist(
    (set, get) => ({
      invoices: [],
      partyPayments: [],
      deals: [],
      allocations: [],
      reopenInvoice: (id) => {
        const prev = get().invoices.find(x => x.id === id);
        if (!prev || !prev.paidAt) return;
        set({
          invoices: get().invoices.map(x => x.id === id
            ? { ...x, paidAt: '', workflowStatus: 'confirmed', updatedAt: now() }
            : x)
        });
        try {
          void import('../../cor/logger/auditLog').then(m => {
            m.logAction('update', 'tra', 'بازگشایی فاکتور ' + (prev.number || id));
          }).catch(() => {});
        } catch {}
      },
      addInvoice: (i) => {
        const id = uuid();
        const num = generateInvoiceNumber(i.type, i.date, get().invoices);
        const newInv = { ...i, id, number: i.number || num, createdAt: now(), updatedAt: now() } as any;
        let items: InvoiceItem[] = newInv.items || [];
        if (!newInv.isPreorder) {
          // 🎯 ۱. اعمال روی گله‌ها (خرید/فروش پرنده)
          try { items = applyInvoiceFlocks({ ...newInv, items }); } catch(e) {}
          // 🎯 ۲. اتصال تجهیزات به فاکتور
          try { items = applyInvoiceEquipment({ ...newInv, items }); } catch(e) { console.error('❌ [tra] applyInvoiceEquipment error:', e); }
          // 🎯 ۳. اتصال فروش تخم به ماژول egg
          try { items = applyInvoiceEgg({ ...newInv, items }); } catch(e) {}
          try { items = applyInvoiceStock({ ...newInv, items }); } catch(e) {}
          // 🎯 ۴. اتصال به انبار از طریق Event Bus (حرکت‌ها + movementId)
          // ✅ آپدیت انبار فقط از طریق applyInvoiceStock انجام می‌شود
        }
        const syncedPayments = (newInv.payments || []).map((p: any) => {
          if (p.partyPaymentId) return p;
          try {
            const ppId = get().addPartyPayment({
              partyId: newInv.partyId, date: p.date, amount: p.amount,
              method: p.method, type: p.type || 'regular',
              checkNo: p.checkNo || '', bank: p.bank || '', dueDate: p.dueDate || '',
              notes: p.notes || '', status: p.status,
              clearedDate: p.clearedDate, bouncedDate: p.bouncedDate,
            });
            return { ...p, partyPaymentId: ppId };
          } catch (e) { console.error('[TRA sync add]', e); return p; }
        });
        const final: Invoice = { ...newInv, items, payments: syncedPayments };
        // 🆕 آبشار بانکی: تخصیص پرداخت‌ها به اقساط
        if (final.installments && final.installments.length > 0) {
          try { final.installments = applyPaymentsToInstallments(final.installments, syncedPayments); } catch(e) {}
        }
        set({ invoices: [...get().invoices, final] });
      try {
        for (const p of (final.payments || [])) {
          get().addAllocation({
            paymentId: p.id, invoiceId: final.id,
            amount: p.amount, date: p.date,
            notes: 'auto',
          });
        }
      } catch(e) { console.error('[addInvoice] alloc:', e); }
        try { setPartyCredit(final.partyId, computePartyCredit(final.partyId, get().invoices, get().allocations)); } catch(e) {}
        return id;
      },
      updateInvoice: (id, patch) => {
        const prev = get().invoices.find(x => x.id === id);
        if (!prev) return;
        if (prev.paidAt) {
          console.warn('[tra] cannot edit paid invoice — reopen first');
          return;
        }
        const merged = { ...prev, ...patch, updatedAt: now() } as Invoice;
        let itemsFinal: InvoiceItem[] = merged.items || [];
        const mergedWithItems = { ...merged, items: itemsFinal };
        
        // اگر قبلاً پیش‌خرید بوده و الان تایید شده (تحویل گرفته شده)
        const isReceiving = prev.isPreorder && !merged.isPreorder;

        if (!merged.isPreorder || isReceiving) {
          try { itemsFinal = applyInvoiceFlocks(mergedWithItems, isReceiving ? undefined : prev); } catch(e) { console.error('[updateInvoice] applyInvoiceFlocks failed:', e); }
          try { itemsFinal = applyInvoiceEquipment({ ...mergedWithItems, items: itemsFinal }, isReceiving ? undefined : prev); } catch(e) { console.error('❌ [tra] applyInvoiceEquipment error (update):', e); }
          try { itemsFinal = applyInvoiceEgg({ ...mergedWithItems, items: itemsFinal }, isReceiving ? undefined : prev); } catch(e) {}
          try { itemsFinal = applyInvoiceStock({ ...mergedWithItems, items: itemsFinal }, isReceiving ? undefined : prev); } catch(e) {}
          // 🎯 اتصال به انبار از طریق Event Bus (rollback قبلی‌ها + حرکت‌های جدید)
          // ✅ آپدیت انبار فقط از طریق applyInvoiceStock انجام می‌شود
        }
        const prevPayments = (prev.payments || []) as any[];
        const newPaymentsInput = (mergedWithItems.payments || []) as any[];
        const syncedPayments = newPaymentsInput.map((p: any) => {
          if (p.partyPaymentId) return p;
          try {
            const ppId = get().addPartyPayment({
              partyId: mergedWithItems.partyId, date: p.date, amount: p.amount,
              method: p.method, type: p.type || 'regular',
              checkNo: p.checkNo || '', bank: p.bank || '', dueDate: p.dueDate || '',
              notes: p.notes || '', status: p.status,
              clearedDate: p.clearedDate, bouncedDate: p.bouncedDate,
            });
            return { ...p, partyPaymentId: ppId };
          } catch (e) { console.error('[TRA sync upd]', e); return p; }
        });
        const prevPPIds = new Set(prevPayments.map((p: any) => p.partyPaymentId).filter(Boolean));
        const newPPIds = new Set(syncedPayments.map((p: any) => p.partyPaymentId).filter(Boolean));
        for (const ppId of prevPPIds) {
          if (!newPPIds.has(ppId as string)) {
            try { get().deletePartyPayment(ppId as string); } catch(e) {}
          }
        }
        for (const p of syncedPayments) {
          if (p.partyPaymentId) {
            try {
              get().updatePartyPayment(p.partyPaymentId, {
                partyId: mergedWithItems.partyId, date: p.date, amount: p.amount,
                method: p.method, type: p.type || 'regular',
                checkNo: p.checkNo || '', bank: p.bank || '', dueDate: p.dueDate || '',
                notes: p.notes || '', status: p.status,
                clearedDate: p.clearedDate, bouncedDate: p.bouncedDate,
              });
            } catch(e) {}
          }
        }
        const final: Invoice = { ...mergedWithItems, items: itemsFinal, payments: syncedPayments };
        // 🆕 آبشار بانکی: تخصیص پرداخت‌ها به اقساط
        if (final.installments && final.installments.length > 0) {
          try { final.installments = applyPaymentsToInstallments(final.installments, syncedPayments); } catch(e) {}
        }
        set({ invoices: get().invoices.map(x => x.id === id ? final : x) });
        try {
          setPartyCredit(final.partyId, computePartyCredit(final.partyId, get().invoices, get().allocations));
          if (prev.partyId && prev.partyId !== final.partyId) setPartyCredit(prev.partyId, computePartyCredit(prev.partyId, get().invoices, get().allocations));
        } catch(e) {}
        if (patch.payments) {
          try {
            const oldAllocs = get().allocations.filter(a => a.invoiceId === id);
            const newPayments = merged.payments || [];
            const newIds = new Set(newPayments.map(p => p.id));
            for (const a of oldAllocs) {
              if (!newIds.has(a.paymentId)) get().deleteAllocation(a.id);
            }
            const oldByPaymentId = new Map(oldAllocs.map(a => [a.paymentId, a]));
            for (const p of newPayments) {
              const existing = oldByPaymentId.get(p.id);
              if (!existing) {
                get().addAllocation({
                  paymentId: p.id, invoiceId: id,
                  amount: p.amount, date: p.date,
                  notes: 'auto',
                });
              } else if (existing.amount !== p.amount || existing.date !== p.date) {
                get().updateAllocation(existing.id, { amount: p.amount, date: p.date });
              }
            }
          } catch(e) { console.error('[updateInvoice] alloc sync:', e); }
        }
      },
      deleteInvoice: (id) => {
        const inv = get().invoices.find(x => x.id === id);
        // 🆕 auto-unlink: گله‌های متصل بدون سند می‌شن (حذف نمی‌شن)
        if (inv) {
          const flkState = useFlk.getState();
          const linked = flkState.flocks.filter((f: any) => f.sourceInvoiceId === id);
          linked.forEach((f: any) => {
            try { flkState.update(f.id, { sourceInvoiceId: '', sourceCategory: '' } as any); } catch {}
          });
          if (linked.length > 0) {
            // Merge info — no separate toast (single notification policy)
            try { console.info(`[deleteInvoice] ${linked.length} گله از فاکتور ${inv.number || id} جدا شد`); } catch {}
          }
        }
        if (inv) {
          // revert flock effect
          const flk = useFlk.getState();
          for (const it of inv.items || []) {
            if (!it.birdId || !it.flockId) continue;
            if (!BIRD_CATS.includes((it as any).category || inv.category)) continue;
            const qty = ((it as any).healthyCount ?? it.quantity) || 0;
            if (qty <= 0) continue;
            const f = flk.flocks.find(x => x.id === it.flockId);
            if (!f) continue;
            const cur = f.currentCount ?? 0;
            if (inv.type === 'purchase') flk.update(it.flockId, { currentCount: Math.max(0, cur - qty) });
            else if (inv.type === 'sale') flk.update(it.flockId, { currentCount: cur + qty });
          }
          // 🎯 rollback حرکات انبار از طریق Event Bus
          try { void bus.emit('tra:invoice:deleted', { invoiceId: inv.id, invoice: inv, items: inv.items }, { source: 'tra' }).catch(() => {}); } catch(e) {}
      // 🎯 rollback فروش تخم (egg.sales) — جلوگیری از orphan
      try {
        const eggState = useEgg.getState();
        const linkedSales = (eggState.sales || []).filter((s: any) => s.sourceInvoiceId === id);
        for (const sale of linkedSales) {
          try { eggState.deleteSale(sale.id); } catch {}
        }
      } catch (e) { console.error('[tra delete] egg sales reversal:', e); }

      // 🎯 rollback تجهیزات فروش — برگرداندن به hal
      try {
        const halState = useHal.getState();
        for (const it of inv.items || []) {
          const cat = (it as any).category || inv.category;
          if (cat !== 'equipment') continue;
          if ((it as any).equipmentKind === 'consumable') continue;
          const eqId = (it as any).equipmentId;
          const qty = Number(it.quantity) || 1;
          if (!eqId) continue;
          const eq = halState.equipment.find((e: any) => e.id === eqId);
          if (eq) {
            // تجهیز هنوز هست → تعداد رو برگردون
            try {
              halState.updateEquip(eqId, { count: (eq.count || 0) + qty } as any);
            } catch {}
          } else {
            // تجهیز حذف شده بود → بازسازی
            try {
              halState.addEquip({
                hallId: (it as any).hallId || '',
                zoneId: (it as any).zoneId || '',
                category: (it as any).equipmentCategory || 'other',
                type: (it as any).equipmentType || 'other',
                name: it.description || 'تجهیز',
                count: qty,
                unit: it.unit || 'pcs',
                unitPrice: it.unitPrice || null,
                purchasedAt: '',
                warranty: null,
                notes: `بازگشت از حذف فاکتور ${inv.number || ''}`,
                brand: (it as any).brand || '',
                supplierId: '',
                sourceInvoiceId: '',
                model: (it as any).model || '',
                status: 'active',
              } as any);
            } catch (e) { console.error('[tra delete] equip restore:', e); }
          }
        }
      } catch (e) { console.error('[tra delete] hal equip reversal:', e); }

          // 🎯 rollback ورودی‌های تخم در جوجه‌کشی
          try {
            const incState = useInc.getState();
            const linkedEntries = (incState.eggEntries || []).filter((e: any) => e.sourceInvoiceId === id);
            for (const entry of linkedEntries) {
              try { incState.deleteEntry(entry.id); } catch {}
            }
          } catch {}
      // 🆕 حذف Equipmentهای ساخته‌شده از این فاکتور
      try {
        const halState = useHal.getState();
        const linkedEq = halState.equipment.filter((e: any) => e.sourceInvoiceId === id);
        for (const eq of linkedEq) {
          try { halState.deleteEquip(eq.id); } catch {}
        }
      } catch (e) { console.error('[tra delete] equipment cleanup:', e); }
        }
        // 🆕 برگشت موجودی انبار (out movement)
    if (inv) {
      try {
        const whsState = useWhs.getState();
        for (const it of inv.items || []) {
          const cat = (it as any).category || inv.category;
          const isStock = ['feed', 'medicine', 'vaccine', 'herbal', 'other', 'manure', 'broken'].includes(cat);
          const isEquipConsumable = cat === 'equipment' && (it as any).equipmentKind === 'consumable';
          if (!isStock && !isEquipConsumable) continue;
          const qty = Number(it.quantity) || 0;
          if (qty <= 0) continue;
          const stockItemId = (it as any).stockItemId;
          if (!stockItemId) continue;
          const wItem = whsState.items.find((i: any) => i.id === stockItemId);
          if (!wItem) continue;
          try {
            whsState.addMovement({
              itemId: stockItemId,
              type: inv.type === 'sale' ? 'in' : 'out',
              quantity: qty,
              unitPrice: Number(it.unitPrice) || 0,
              reason: 'adjustment',
              date: inv.date || '',
              partyId: '',
              notes: `حذف فاکتور ${inv.number || ''}`,
              sourceModule: 'tra',
              sourceId: inv.id,
            } as any);
          } catch (e) { console.error('[tra delete] whs reversal:', e); }
        }
      } catch (e) { console.error('[tra delete] whs state:', e); }
    }

    if (inv) {
          const paymentIds = new Set((inv.payments || []).map((p: any) => p.partyPaymentId).filter(Boolean));
          for (const ppId of paymentIds) {
            try { get().deletePartyPayment(ppId as string); } catch(e) {}
          }
        }
        set({ invoices: get().invoices.filter(x => x.id !== id) });
    try { verifyInvariantsIfDev(); } catch(e) {}
        try { if (inv) setPartyCredit(inv.partyId, computePartyCredit(inv.partyId, get().invoices, get().allocations)); } catch(e) {}
      },

      // ═══ Phase 6: پرداخت‌های طرف حساب ═══
      addPartyPayment: (p: any) => {
        const id = uuid();
        const now = new Date().toISOString();
        const pp = { ...p, id, createdAt: now, updatedAt: now };
        set({ partyPayments: [...get().partyPayments, pp] });
        return id;
      },
      updatePartyPayment: (id: string, patch: any) => {
        set({ partyPayments: get().partyPayments.map((x: any) => x.id === id ? { ...x, ...patch, updatedAt: new Date().toISOString() } : x) });
      },
      deletePartyPayment: (id: string) => {
        set({ partyPayments: get().partyPayments.filter((x: any) => x.id !== id) });
      },
      bouncePartyPayment: (ppId: string) => {
        const pp = get().partyPayments.find(x => x.id === ppId);
        if (!pp) return;
        const today = new Date().toISOString().slice(0, 10);
        set({
          partyPayments: get().partyPayments.map(x => x.id === ppId
            ? { ...x, status: 'bounced' as const, bouncedDate: today, clearedDate: '' }
            : x),
        });
        set({
          invoices: get().invoices.map(inv => {
            const payments = inv.payments || [];
            if (!payments.some((p: any) => p.partyPaymentId === ppId)) return inv;
            return {
              ...inv,
              payments: payments.map((p: any) => p.partyPaymentId === ppId
                ? { ...p, status: 'bounced' as const, bouncedDate: today, clearedDate: '' }
                : p),
              updatedAt: new Date().toISOString(),
            };
          }),
        });
      },
      clearPartyPayment: (ppId: string) => {
        const pp = get().partyPayments.find(x => x.id === ppId);
        if (!pp) return;
        const today = new Date().toISOString().slice(0, 10);
        set({
          partyPayments: get().partyPayments.map(x => x.id === ppId
            ? { ...x, status: 'cleared' as const, clearedDate: today, bouncedDate: '' }
            : x),
        });
        set({
          invoices: get().invoices.map(inv => {
            const payments = inv.payments || [];
            if (!payments.some((p: any) => p.partyPaymentId === ppId)) return inv;
            return {
              ...inv,
              payments: payments.map((p: any) => p.partyPaymentId === ppId
                ? { ...p, status: 'cleared' as const, clearedDate: today, bouncedDate: '' }
                : p),
              updatedAt: new Date().toISOString(),
            };
          }),
        });
      },

      addDeal: (d) => set({ deals: [...get().deals, {...d, id: uuid(), createdAt: now(), updatedAt: now()}] }),
      updateDeal: (id, patch) => set({ deals: get().deals.map(x => x.id === id ? {...x, ...patch, updatedAt: now()} : x) }),
      deleteDeal: (id) => set({ deals: get().deals.filter(x => x.id !== id) }),
      addAllocation: (a) => {
        const id = uuid();
        set({ allocations: [...get().allocations, { ...a, id }] });
        return id;
      },
      updateAllocation: (id, patch) => {
        set({ allocations: get().allocations.map(x => x.id === id ? { ...x, ...patch } : x) });
      },
      deleteAllocation: (id) => {
        set({ allocations: get().allocations.filter(x => x.id !== id) });
      }
    }),
    {
      name: 'pm-tra',
      version: 6,
      migrate: (persisted: any, version: number) => {
        if (!persisted?.invoices) return persisted;

        // v5 → v6: build allocations from existing payments
      if (version < 6) {
        persisted.allocations = [];
        for (const inv of (persisted.invoices || [])) {
          for (const p of (inv.payments || [])) {
            persisted.allocations.push({
              id: uuid(),
              paymentId: p.id,
              invoiceId: inv.id,
              amount: p.amount || 0,
              date: p.date || '',
              notes: 'migrated',
            });
          }
        }
      }
      persisted.invoices = persisted.invoices.map((inv: any) => {
          // مقادیر پیش‌فرض بر اساس وضعیت فعلی
          const payments = inv.payments || [];
          const total = inv.total || 0;
          const paidSumVal = paidSum(payments);
          const isPaid = total > 0 && paidSumVal >= total;

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
            // اقساط
            installments: inv.installments || [],
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



export function computePartyCredit(partyId: string, invoices: Invoice[], allocations?: any[]): number {
  // SINGLE SOURCE OF TRUTH — partyBalance (formulas.ts)
  return partyBalance(partyId, invoices, allocations);
}
