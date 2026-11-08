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
import type { EquipmentCategory, EquipmentUnit } from '../hal/store';
import { bus } from '../../cor/events';

import type { Invoice, InvoiceItem, State, DeletedInvoiceSnapshot, DeletedDealSnapshot, Deal, Settlement } from './types';
import { saveToRecycleBin, removeFromRecycleBin, listRecycleBin } from '../../shr/utils/recycleBin';
import { applyPaymentsToInstallments, paidSumAllocated, computeCashDiscount, getTodayJalali, addJalaliDays, remaining , isEffectivelyPaid} from './calc';
import { applyInvoiceFlocks, applyInvoiceEquipment, applyInvoiceEgg, BIRD_CATS } from './invoiceHelpers';
import { deriveSaleEvents, sumSexForFlock } from '../flk/helpers-sex';
import { applyInvoiceStock } from './applyStock';
import { generateInvoiceNumber, paidSum } from './calc';
import { showToast } from '../../cor/store/toast';
import { useInc } from '../inc/store';
import { setPartyCredit } from '../ctc/store';
import { partyBalance } from './formulas';
import { applyDealMovements } from './applyDeal';

const now = () => new Date().toISOString();

// re-export همه انواع و توابع
export * from './types';
export * from './calc';
export * from './invoiceHelpers';

function createPartyPaymentFor(
  get: () => any,
  p: any,
  partyId: string,
  logLabel: string,
): any {
  if (p.partyPaymentId) return p;
  try {
    const ppId = get().addPartyPayment({
      partyId, date: p.date, amount: p.amount,
      method: p.method, type: p.type || 'regular',
      checkNo: p.checkNo || '', bank: p.bank || '', dueDate: p.dueDate || '',
      notes: p.notes || '', status: p.status,
      clearedDate: p.clearedDate, bouncedDate: p.bouncedDate,
    });
    return { ...p, partyPaymentId: ppId };
  } catch (e) { console.error(logLabel, e); return p; }
}

function syncAllocations(
  get: () => any,
  invoiceId: string,
  payments: any[],
  prevAllocations: any[],
  logLabel: string,
): void {
  try {
    const newIds = new Set(payments.map(p => p.id));
    const oldByPaymentId = new Map(prevAllocations.map((a: any) => [a.paymentId, a]));
    for (const a of prevAllocations) {
      if (!newIds.has(a.paymentId)) get().deleteAllocation(a.id);
    }
    for (const p of payments) {
      const existing = oldByPaymentId.get(p.id);
      if (!existing) {
        get().addAllocation({
          paymentId: p.id, invoiceId,
          amount: p.amount, date: p.date,
          notes: 'auto',
        });
      } else if ((existing as any).amount !== p.amount || (existing as any).date !== p.date) {
        get().updateAllocation((existing as any).id, { amount: p.amount, date: p.date });
      }
    }
  } catch(e) { console.error(logLabel, e); }
}

export const useTra = create<State>()(
  persist(
    (set, get) => ({
      invoices: [],
      partyPayments: [],
      deals: [], settlements: [],
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
          try { items = applyInvoiceFlocks({ ...newInv, items }); } catch(e) { console.error('[tra add] applyInvoiceFlocks failed:', e); throw e; }
          // 🎯 ۲. اتصال تجهیزات به فاکتور
          try { items = applyInvoiceEquipment({ ...newInv, items }); } catch(e) { console.error('❌ [tra] applyInvoiceEquipment error:', e); }
          // 🎯 ۳. اتصال فروش تخم به ماژول egg
          try { items = applyInvoiceEgg({ ...newInv, items }); } catch(e) { console.error('[tra add] applyInvoiceEgg failed:', e); }
          try { items = applyInvoiceStock({ ...newInv, items }); } catch(e) { const _msg = e instanceof Error ? e.message : String(e); console.error('[tra add] applyInvoiceStock failed:', e); throw new Error('حرکت انبار ناموفق — ' + _msg); }
          // 🎯 ۴. اتصال به انبار از طریق Event Bus (حرکت‌ها + movementId)
          // ✅ آپدیت انبار فقط از طریق applyInvoiceStock انجام می‌شود
        }
        const syncedPayments = (newInv.payments || []).map((p: any) =>
          createPartyPaymentFor(get, p, newInv.partyId, '[TRA sync add]')
        );
        const final: Invoice = { ...newInv, items, payments: syncedPayments };
        // 🆕 آبشار بانکی: تخصیص پرداخت‌ها به اقساط
        if (final.installments && final.installments.length > 0) {
          try { final.installments = applyPaymentsToInstallments(final.installments, syncedPayments); } catch(e) {}
        }
        set({ invoices: [...get().invoices, final] });
      syncAllocations(get, final.id, final.payments || [], [], '[addInvoice] alloc:');
        try { setPartyCredit(final.partyId, computePartyCredit(final.partyId, get().invoices, get().allocations)); } catch(e) { console.error('[tra add] setPartyCredit failed:', e); }
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
          try { itemsFinal = applyInvoiceFlocks(mergedWithItems, isReceiving ? undefined : prev); } catch(e) { console.error('[updateInvoice] applyInvoiceFlocks failed:', e); throw e; }
          try { itemsFinal = applyInvoiceEquipment({ ...mergedWithItems, items: itemsFinal }, isReceiving ? undefined : prev); } catch(e) { console.error('❌ [tra] applyInvoiceEquipment error (update):', e); }
          try { itemsFinal = applyInvoiceEgg({ ...mergedWithItems, items: itemsFinal }, isReceiving ? undefined : prev); } catch(e) {}
          try { itemsFinal = applyInvoiceStock({ ...mergedWithItems, items: itemsFinal }, isReceiving ? undefined : prev); } catch(e) {}

          // 🆕 فیکس ۴: Revoke old sell events + recreate new
          try {
            if (mergedWithItems.type === 'sale' && !mergedWithItems.isPreorder) {
              const st4 = useFlk.getState();
              const affected = new Map<string, number>();
              for (const it of itemsFinal || []) {
                const itCat = it.category || mergedWithItems.category;
                if (!BIRD_CATS.includes(itCat)) continue;
                if (!it.flockId) continue;
                const qty = (it.healthyCount ?? it.quantity) || 0;
                if (qty <= 0) continue;
                affected.set(it.flockId, (affected.get(it.flockId) || 0) + qty);
              }
              const hasAnyOld4 = st4.flocks.some((f: any) => (f.events || []).some((e: any) => e.invoiceId === id && e.type === 'sell' && !e.revoked));
              if (affected.size > 0 || hasAnyOld4) {
                useFlk.setState({
                  flocks: st4.flocks.map((f: any) => {
                    const hasRev4 = (f.events || []).some((e: any) => e.invoiceId === id && e.type === 'sell' && !e.revoked);
                    if (!hasRev4 && !affected.has(f.id)) return f;
                    let newEvents = (f.events || []).map((e: any) =>
                      e.invoiceId === id && e.type === 'sell' && !e.revoked
                        ? { ...e, revoked: true }
                        : e
                    );
                    const qty4 = affected.get(f.id) || 0;
                    if (qty4 > 0) {
                      // 🆕 B2 fix: sex-aware eventها (۱ تا ۳ event جدا)
                      const sex4 = sumSexForFlock(itemsFinal || [], f.id);
                      const evts4 = deriveSaleEvents({
                        delta: qty4,
                        maleCount: sex4.male,
                        femaleCount: sex4.female,
                        unknownCount: sex4.unknown,
                        flockId: f.id,
                        invoiceId: id,
                        invoiceNumber: mergedWithItems.number,
                        partyId: mergedWithItems.partyId,
                        date: mergedWithItems.deliveryDate || mergedWithItems.date || '',
                        notes: `ویرایش فروش از فاکتور ${mergedWithItems.number || ''}`,
                      });
                      newEvents.push(...evts4);
                    }
                    return { ...f, events: newEvents };
                  }),
                } as any);
              }
            }
          } catch (e) { console.error('[updateInvoice] sell events revoke failed:', e); }
        }
        const prevPayments = (prev.payments || []) as any[];
        const newPaymentsInput = (mergedWithItems.payments || []) as any[];
        const syncedPayments = newPaymentsInput.map((p: any) =>
          createPartyPaymentFor(get, p, mergedWithItems.partyId, '[TRA sync upd]')
        );
        const prevPPIds = new Set(prevPayments.map((p: any) => p.partyPaymentId).filter(Boolean));
        const newPPIds = new Set(syncedPayments.map((p: any) => p.partyPaymentId).filter(Boolean));
        for (const ppId of prevPPIds) {
          if (!newPPIds.has(ppId as string)) {
            try { get().deletePartyPayment(ppId as string); } catch(e) { console.error('[tra delete] deletePartyPayment failed:', e); }
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
      const oldAllocs = get().allocations.filter(a => a.invoiceId === id);
      syncAllocations(get, id, merged.payments || [], oldAllocs, '[updateInvoice] alloc sync:');
    }

      // 🆕 dunning C5 — auto-cancel reminder if fully paid
      try {
        const cur = get().invoices.find(x => x.id === id);
        if (cur && cur.nextReminderAt && remaining(cur, get().allocations) <= 0) {
          set({ invoices: get().invoices.map(x => x.id === id ? { ...x, nextReminderAt: undefined, updatedAt: now() } : x) });
        }
      } catch(e) { console.error('[updateInvoice] auto-cancel reminder:', e); }
      },
      markDispute: (invoiceId, reason, note) => {
        const today = getTodayJalali();
        set({
          invoices: get().invoices.map(i => i.id === invoiceId ? {
            ...i,
            disputeStatus: 'open' as const,
            disputeReason: reason,
            disputeNote: note,
            disputeOpenedAt: today,
            disputeResolvedAt: undefined,
            updatedAt: new Date().toISOString(),
          } : i),
        });
      },
      resolveDispute: (invoiceId, note) => {
        const today = getTodayJalali();
        set({
          invoices: get().invoices.map(i => i.id === invoiceId ? {
            ...i,
            disputeStatus: 'resolved' as const,
            disputeResolvedAt: today,
            disputeNote: note ? (i.disputeNote ? i.disputeNote + ' | ' + note : note) : i.disputeNote,
            updatedAt: new Date().toISOString(),
          } : i),
        });
      },
      writeOffInvoice: (invoiceId, amount, reason) => {
        const today = getTodayJalali();
        set({
          invoices: get().invoices.map(i => i.id === invoiceId ? {
            ...i,
            writtenOff: true,
            writtenOffAmount: amount,
            writtenOffReason: reason,
            writtenOffAt: today,
            updatedAt: new Date().toISOString(),
          } : i),
        });
      },
      restoreInvoice: (id) => {
        // 🆕 Atomic: peek first، pre-flight ALL (simulation)، سپس mutate
        const allEntries = listRecycleBin<DeletedInvoiceSnapshot>('tra');
        const entry = allEntries.find(e => e.item.invoice.id === id);
        if (!entry) {
          console.error('[restoreInvoice] not found in recycle bin:', id);
          return false;
        }
        const snapshot = entry.item;
        if (get().invoices.some((x) => x.id === id)) {
          console.warn('[restoreInvoice] invoice already exists:', id);
          return false;
        }

        // 🆕 Atomic pre-flight: simulate ALL items با stacking روی یک flock
        const flkSt0 = useFlk.getState();
        const inv = snapshot.invoice;
        const simulated = new Map<string, { currentCount: number; maleCount: number; femaleCount: number; unknownCount: number }>();
        if (inv.items) {
          for (const it of inv.items) {
            const item = it as any;
            if (!item.birdId || !item.flockId) continue;
            if (!BIRD_CATS.includes(item.category || inv.category)) continue;
            const qty = (item.healthyCount ?? item.quantity) || 0;
            if (qty <= 0) continue;
            const f = flkSt0.flocks.find(x => x.id === item.flockId);
            if (!f) continue;
            const base = simulated.get(item.flockId) || {
              currentCount: f.currentCount ?? 0,
              maleCount: f.maleCount ?? 0,
              femaleCount: f.femaleCount ?? 0,
              unknownCount: f.unknownCount ?? 0,
            };
            const sign = inv.type === 'purchase' ? 1 : -1;
            const _mD0 = Number(item.maleCount || 0);
            const _fD0 = Number(item.femaleCount || 0);
            const _uD0 = Number(item.unknownCount || 0);
            const _gS0 = _mD0 + _fD0 + _uD0;
            const _expectedCur = inv.type === 'purchase' ? base.currentCount + qty : Math.max(0, base.currentCount - qty);
            let nextM = base.maleCount, nextF = base.femaleCount, nextU = base.unknownCount;
            if (_gS0 > 0) {
              const _nextM = inv.type === 'purchase' ? base.maleCount + _mD0 : Math.max(0, base.maleCount - _mD0);
              const _nextF = inv.type === 'purchase' ? base.femaleCount + _fD0 : Math.max(0, base.femaleCount - _fD0);
              const _nextU = inv.type === 'purchase' ? base.unknownCount + _uD0 : Math.max(0, base.unknownCount - _uD0);
              if (_nextM + _nextF + _nextU !== _expectedCur) {
                if (inv.type === 'sale' && _mD0 > base.maleCount) {
                  throw new Error(`restore: موجودی نر کافی نیست: ${f.name} — نر ${base.maleCount}، درخواستی ${_mD0}`);
                }
                if (inv.type === 'sale' && _fD0 > base.femaleCount) {
                  throw new Error(`restore: موجودی ماده کافی نیست: ${f.name} — ماده ${base.femaleCount}، درخواستی ${_fD0}`);
                }
                throw new Error(`restore: invariant نقض می‌شود برای ${f.name}`);
              }
              if (_mD0 > 0) nextM = Math.max(0, base.maleCount + sign * _mD0);
              if (_fD0 > 0) nextF = Math.max(0, base.femaleCount + sign * _fD0);
              if (_uD0 > 0) nextU = Math.max(0, base.unknownCount + sign * _uD0);
              const rem = qty - _gS0;
              if (rem > 0) nextU = Math.max(0, nextU + sign * rem);
            } else {
              nextU = Math.max(0, base.unknownCount + sign * qty);
            }
            simulated.set(item.flockId, {
              currentCount: _expectedCur,
              maleCount: nextM,
              femaleCount: nextF,
              unknownCount: nextU,
            });
          }
        }

        // ✓ همه چیز معتبر — حالا mutate
        const confirmed = removeFromRecycleBin<DeletedInvoiceSnapshot>(
          'tra',
          (existing) => existing.invoice.id === id,
        );
        if (!confirmed) {
          console.error('[restoreInvoice] race: already removed:', id);
          return false;
        }
        set((s) => ({ invoices: [...s.invoices, confirmed.invoice] }));

        const flk = useFlk.getState();
        for (const flock of confirmed.linkedFlocks) {
          try {
            const firstItem = confirmed.invoice.items.find(it => it.category === 'chick' || it.category === 'adult');
            const birdId = flock.birdId || firstItem?.birdId || '';
            const breedId = flock.breedId || firstItem?.breedId || '';
            flk.update(flock.id, {
              sourceInvoiceId: id,
              sourceCategory: flock.sourceCategory,
              birdId,
              breedId,
            });
            console.info('[restoreInvoice] flock relinked with breed:', flock.id, breedId);
          } catch (e) {
            console.error('[restoreInvoice] relink flock:', flock.id, e);
          }
        }
        console.info('[restoreInvoice] ♻️ restored:', id, '| flocks:', confirmed.linkedFlocks.length);

        // اعمال simulated final states
        const flkState = useFlk.getState();
        for (const [flockId, finalState] of simulated) {
          try {
            flkState.update(flockId, finalState);
            console.info('[restoreInvoice] flock counts restored:', flockId, 'currentCount:', finalState.currentCount);
          } catch (e) {
            console.error('[restoreInvoice] apply patch:', flockId, e);
          }
        }

        // Cascade restore: settlement
        if (confirmed.linkedSettlement) {
          const _st = get().settlements.find(x => x.id === confirmed.linkedSettlement!.id);
          if (_st) {
            set({
              settlements: get().settlements.map(x =>
                x.id === _st.id
                  ? { ...x, status: 'invoiced', invoiceId: id, updatedAt: now() }
                  : x
              ),
            });
            try { console.info('[restoreInvoice] settlement re-linked:', _st.id); } catch (e) { console.error('[restoreInvoice] settlement relink:', e); }
          }
        }

        // 🆕 B7 fix: un-revoke sell events
        try {
          const flkSt = useFlk.getState();
          const needsRevoke = flkSt.flocks.some((ff: any) =>
            (ff.events || []).some((e: any) => e.invoiceId === id && e.type === 'sell' && e.revoked === true)
          );
          if (needsRevoke) {
            useFlk.setState({
              flocks: flkSt.flocks.map((ff: any) => ({
                ...ff,
                events: (ff.events || []).map((e: any) =>
                  e.invoiceId === id && e.type === 'sell' && e.revoked === true
                    ? { ...e, revoked: false }
                    : e
                ),
                updatedAt: now(),
              })),
            } as any);
            console.info('[restoreInvoice] ♻️ sell events un-revoked:', id);
          }
        } catch (e) {
          console.error('[restoreInvoice] un-revoke sell events failed:', e);
        }

        console.warn('[restoreInvoice] ⚠️ موجودی گله/انبار را دستی بررسی کنید');
        return true;
      },
      listDeletedInvoices: () => listRecycleBin<DeletedInvoiceSnapshot>('tra').map((e) => e.item),
      deleteInvoice: (id) => {
        const inv = get().invoices.find(x => x.id === id);
        // 🆕 Backup Before Mutation (recycle bin)
        // D6-D2: Capture recycle-bin data BEFORE mutations
        const _recycleFlocks = inv ? useFlk.getState().flocks
          .filter((f) => f.sourceInvoiceId === id)
          .map((f) => ({
            id: f.id,
            sourceCategory: f.sourceCategory || '',
            birdId: f.birdId || null,
            breedId: f.breedId || null,
          })) : [];
        const _recycleSettlement = inv?.relatedSettlementId
          ? (() => {
              const _st = get().settlements.find(x => x.id === inv.relatedSettlementId);
              return _st ? { id: _st.id, periodStart: _st.periodStart, periodEnd: _st.periodEnd } : undefined;
            })()
          : undefined;
        // Cascade: reset settlement if linked
        if (inv?.relatedSettlementId) {
          const st = get().settlements.find(x => x.id === inv.relatedSettlementId);
          if (st) {
            set({
              settlements: get().settlements.map(x =>
                x.id === st.id
                  ? { ...x, status: 'confirmed', invoiceId: undefined, updatedAt: now() }
                  : x
              ),
            });
            try { console.info('[deleteInvoice] settlement reset to confirmed:', st.id); } catch {}
          }
        }
        // 🆕 auto-unlink: گله‌های متصل بدون سند می‌شن (حذف نمی‌شن)
        if (inv) {
          const flkState = useFlk.getState();
          const linked = flkState.flocks.filter((f: any) => f.sourceInvoiceId === id);
          linked.forEach((f: any) => {
            try { flkState.update(f.id, { sourceInvoiceId: '', sourceCategory: '' }); } catch (e) { console.error('[tra delete] flock unlink failed:', e); }
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
            if (!BIRD_CATS.includes(it.category || inv.category)) continue;
            const qty = (it.healthyCount ?? it.quantity) || 0;
            if (qty <= 0) continue;
            const f = flk.flocks.find(x => x.id === it.flockId);
            if (!f) continue;
            const cur = f.currentCount ?? 0;
            const sign = inv.type === 'purchase' ? -1 : 1;
            const patchRevert: any = {
              currentCount: inv.type === 'purchase' ? Math.max(0, cur - qty) : cur + qty,
            };
            const mDelta = Number(it.maleCount || 0);
            const fDelta = Number(it.femaleCount || 0);
            const uDelta = Number(it.unknownCount || 0);
            const gSum = mDelta + fDelta + uDelta;
            if (gSum > 0) {
              if (mDelta > 0) patchRevert.maleCount = Math.max(0, (f.maleCount ?? 0) + sign * mDelta);
              if (fDelta > 0) patchRevert.femaleCount = Math.max(0, (f.femaleCount ?? 0) + sign * fDelta);
              if (uDelta > 0) patchRevert.unknownCount = Math.max(0, (f.unknownCount ?? 0) + sign * uDelta);
              const rem = qty - gSum;
              if (rem > 0) {
                const base = (uDelta > 0) ? (patchRevert.unknownCount ?? f.unknownCount ?? 0) : (f.unknownCount ?? 0);
                patchRevert.unknownCount = Math.max(0, base + sign * rem);
              }
            } else {
              patchRevert.unknownCount = Math.max(0, (f.unknownCount ?? 0) + sign * qty);
            }
            flk.update(it.flockId, patchRevert);
          }

          // 🆕 قدم ۶: un-split + consistency check after reversal
          try {
            const st6 = useFlk.getState();
            const affectedIds6 = new Set<string>();
            for (const it of inv.items || []) {
              const fid = it.flockId;
              if (fid) affectedIds6.add(fid);
            }
            if (affectedIds6.size > 0) {
              useFlk.setState({
                flocks: st6.flocks.map((f: any) => {
                  if (!affectedIds6.has(f.id)) return f;
                  const m = f.maleCount ?? 0;
                  const fe = f.femaleCount ?? 0;
                  const u = f.unknownCount ?? 0;
                  const cc = f.currentCount ?? 0;

                  // Un-split: male=female=0 ولی genderSplitAt ست بود
                  if (m === 0 && fe === 0 && f.genderSplitAt) {
                    return { ...f, genderSplitAt: null, unknownCount: cc };
                  }

                  // Consistency: male + female + unknown = current
                  if (m + fe + u !== cc) {
                    if (m + fe <= cc) {
                      return { ...f, unknownCount: cc - m - fe };
                    }
                    // داده خراب‌تر از این نشه — فقط log
                    console.warn('[deleteInvoice] inconsistent flock:', { id: f.id, name: f.name, m, fe, u, cc });
                  }
                  return f;
                }),
              });
            }
          } catch (e) { console.error('[deleteInvoice] post-loop fix failed:', e); }

      // 🆕 فیکس ۳: Revoke sell events این فاکتور
      try {
        const st3 = useFlk.getState();
        const hasAny3 = st3.flocks.some((f: any) => (f.events || []).some((e: any) => e.invoiceId === id && e.type === 'sell' && !e.revoked));
        if (hasAny3) {
          useFlk.setState({
            flocks: st3.flocks.map((f: any) => {
              const hasRev = (f.events || []).some((e: any) => e.invoiceId === id && e.type === 'sell' && !e.revoked);
              if (!hasRev) return f;
              return {
                ...f,
                events: (f.events || []).map((e: any) =>
                  e.invoiceId === id && e.type === 'sell' && !e.revoked
                    ? { ...e, revoked: true }
                    : e
                ),
              };
            }),
          });
        }
      } catch (e) { console.error('[deleteInvoice] sell events revoke failed:', e); }
          // 🎯 rollback حرکات انبار از طریق Event Bus
          // ⚠️ Event Bus حذف شد — manual reversal کافی است (پایین‌تر انجام می‌شه)
      // 🎯 rollback فروش تخم (egg.sales) — جلوگیری از orphan
      try {
        const eggState = useEgg.getState();
        const linkedSales = (eggState.sales || []).filter((s: any) => s.sourceInvoiceId === id);
        for (const sale of linkedSales) {
          try { eggState.deleteSale(sale.id); } catch (e) { console.error('[tra delete] egg.deleteSale failed:', e); }
        }
      } catch (e) { console.error('[tra delete] egg sales reversal:', e); }

      // 🎯 rollback تجهیزات فروش — برگرداندن به hal
      try {
        const halState = useHal.getState();
        for (const it of inv.items || []) {
          const cat = it.category || inv.category;
          if (cat !== 'equipment') continue;
          if (it.equipmentKind === 'consumable') continue;
          const eqId = it.equipmentId;
          const qty = Number(it.quantity) || 1;
          if (!eqId) continue;
          const eq = halState.equipment.find((e: any) => e.id === eqId);
          if (eq) {
            // تجهیز هنوز هست → تعداد رو برگردون
            try { halState.updateEquip(eqId, { count: (eq.count || 0) + qty }); } catch (e) { console.error('[tra delete] hal.updateEquip failed:', e); }
          } else {
            // تجهیز حذف شده بود → بازسازی
            try {
              halState.addEquip({
                hallId: it.hallId || '',
                zoneId: it.zoneId || '',
                category: (it.equipmentCategory || 'other') as EquipmentCategory,
                type: it.equipmentType || 'other',
                name: it.description || 'تجهیز',
                count: qty,
                unit: (it.unit || 'pcs') as EquipmentUnit,
                unitPrice: it.unitPrice || null,
                purchasedAt: '',
                warranty: null,
                notes: `بازگشت از حذف فاکتور ${inv.number || ''}`,
                brand: it.brand || '',
                supplierId: '',
                sourceInvoiceId: '',
                model: it.model || '',
                status: 'active',
              });
            } catch (e) { console.error('[tra delete] equip restore:', e); }
          }
        }
      } catch (e) { console.error('[tra delete] hal equip reversal:', e); }

          // 🎯 rollback ورودی‌های تخم در جوجه‌کشی
          try {
            const incState = useInc.getState();
            const linkedEntries = (incState.eggEntries || []).filter((e: any) => e.sourceInvoiceId === id);
            for (const entry of linkedEntries) {
              try { incState.deleteEntry(entry.id); } catch (e) { console.error('[tra delete] inc.deleteEntry failed:', e); }
            }
          } catch (e) { console.error('[tra delete] inc entries reversal failed:', e); }
      // 🆕 حذف Equipmentهای ساخته‌شده از این فاکتور
      try {
        const halState = useHal.getState();
        const linkedEq = halState.equipment.filter((e: any) => e.sourceInvoiceId === id);
        for (const eq of linkedEq) {
          try { halState.deleteEquip(eq.id); } catch (e) { console.error('[tra delete] hal.deleteEquip failed:', e); }
        }
      } catch (e) { console.error('[tra delete] equipment cleanup:', e); }
        }
        // 🆕 برگشت موجودی انبار (out movement)
    if (inv) {
      try {
        const whsState = useWhs.getState();
        for (const it of inv.items || []) {
          const cat = it.category || inv.category;
          const isStock = ['feed', 'medicine', 'vaccine', 'herbal', 'other', 'manure', 'broken', 'egg', 'fertile_egg'].includes(cat);
          const isEquipConsumable = cat === 'equipment' && it.equipmentKind === 'consumable';
          if (!isStock && !isEquipConsumable) continue;
          const qty = Number(it.quantity) || 0;
          if (qty <= 0) continue;
          const stockItemId = it.stockItemId;
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
            });
          } catch (e) { console.error('[tra delete] whs reversal:', e); }
        }
      } catch (e) { console.error('[tra delete] whs state:', e); }
    }

    if (inv) {
          const paymentIds = new Set((inv.payments || []).map((p: any) => p.partyPaymentId).filter(Boolean));
          for (const ppId of paymentIds) {
            try { get().deletePartyPayment(ppId as string); } catch(e) { console.error('[tra delete] deletePartyPayment failed:', e); }
          }
        }
        set({ invoices: get().invoices.filter(x => x.id !== id) });

        // D6-D2: Recycle bin AFTER successful removal (prevents orphan bin)
        if (inv && !get().invoices.some(x => x.id === id)) {
          try {
            saveToRecycleBin<DeletedInvoiceSnapshot>(
              'tra',
              { invoice: inv, linkedFlocks: _recycleFlocks, linkedSettlement: _recycleSettlement },
              (existing) => existing.invoice.id === id,
            );
            console.info('[deleteInvoice] 🗑️ saved to recycle bin:', id);
          } catch (e) {
            console.error('[deleteInvoice] recycle bin failed:', e);
          }
        }
    try { verifyInvariantsIfDev(); } catch(e) { console.error('[tra delete] verifyInvariantsIfDev failed:', e); }
        try { if (inv) setPartyCredit(inv.partyId, computePartyCredit(inv.partyId, get().invoices, get().allocations)); } catch(e) { console.error('[tra delete] setPartyCredit failed:', e); }
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
      set({
        deals: get().deals.map(deal => {
          const payments = deal.payments || [];
          if (!payments.some((p: any) => p.partyPaymentId === ppId)) return deal;
          return {
            ...deal,
            payments: payments.map((p: any) => p.partyPaymentId === ppId
              ? { ...p, status: 'bounced' as const, bouncedDate: today, clearedDate: '' }
              : p),
            updatedAt: new Date().toISOString(),
          };
        }),
      });
        // 🆕 sync creditBalance پس از تغییر وضعیت چک
        try {
          setPartyCredit(pp.partyId, computePartyCredit(pp.partyId, get().invoices, get().allocations));
        } catch (e) {
          console.error('[bouncePartyPayment] setPartyCredit failed:', e);
        }

      },
      depositPartyPayment: (ppId: string) => {
        const pp = get().partyPayments.find(x => x.id === ppId);
        if (!pp) return;
        set({
          partyPayments: get().partyPayments.map(x => x.id === ppId
            ? { ...x, status: 'in_transit' as const }
            : x),
        });
        set({
          invoices: get().invoices.map(inv => {
            const payments = inv.payments || [];
            if (!payments.some((p: any) => p.partyPaymentId === ppId)) return inv;
            return {
              ...inv,
              payments: payments.map((p: any) => p.partyPaymentId === ppId
                ? { ...p, status: 'in_transit' as const }
                : p),
              updatedAt: new Date().toISOString(),
            };
          }),
        });
        set({
          deals: get().deals.map(deal => {
            const payments = deal.payments || [];
            if (!payments.some((p: any) => p.partyPaymentId === ppId)) return deal;
            return {
              ...deal,
              payments: payments.map((p: any) => p.partyPaymentId === ppId
                ? { ...p, status: 'in_transit' as const }
                : p),
              updatedAt: new Date().toISOString(),
            };
          }),
        });
        // 🆕 sync deals[].payments[] status (هماهنگی با clear/bounce)
        set({
          deals: get().deals.map(deal => {
            const payments = deal.payments || [];
            if (!payments.some((p: any) => p.partyPaymentId === ppId)) return deal;
            return {
              ...deal,
              payments: payments.map((p: any) => p.partyPaymentId === ppId
                ? { ...p, status: 'in_transit' as const }
                : p),
              updatedAt: new Date().toISOString(),
            };
          }),
        });
        // 🆕 sync creditBalance
        try {
          setPartyCredit(pp.partyId, computePartyCredit(pp.partyId, get().invoices, get().allocations));
        } catch (e) {
          console.error('[depositPartyPayment] setPartyCredit failed:', e);
        }

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
        const targetInvoiceIds: string[] = [];
        set({
          invoices: get().invoices.map(inv => {
            const payments = inv.payments || [];
            if (!payments.some((p: any) => p.partyPaymentId === ppId)) return inv;
            targetInvoiceIds.push(inv.id);
            return {
              ...inv,
              payments: payments.map((p: any) => p.partyPaymentId === ppId
                ? { ...p, status: 'cleared' as const, clearedDate: today, bouncedDate: '' }
                : p),
              updatedAt: new Date().toISOString(),
            };
          }),
        });
      set({
        deals: get().deals.map(deal => {
          const payments = deal.payments || [];
          if (!payments.some((p: any) => p.partyPaymentId === ppId)) return deal;
          return {
            ...deal,
            payments: payments.map((p: any) => p.partyPaymentId === ppId
              ? { ...p, status: 'cleared' as const, clearedDate: today, bouncedDate: '' }
              : p),
            updatedAt: new Date().toISOString(),
          };
        }),
      });
        // 🆕 dunning C5 gap: auto-cancel reminders on invoices now fully paid
        try {
          const st = get();
          let changed = false;
          const updatedInvoices = st.invoices.map(inv => {
            if (!targetInvoiceIds.includes(inv.id)) return inv;
            if (!inv.nextReminderAt) return inv;
            const invAllocs = st.allocations.filter(al => al.invoiceId === inv.id);
            let paid = 0;
            for (const al of invAllocs) {
              const p = (inv.payments || []).find(pp2 => pp2.id === al.paymentId);
              if (!p) continue;
              if (!isEffectivelyPaid(p)) continue;
              if (p.type === 'refund') paid -= al.amount;
              else paid += al.amount;
            }
            if (paid >= (inv.total || 0)) {
              changed = true;
              return { ...inv, nextReminderAt: undefined, updatedAt: new Date().toISOString() };
            }
            return inv;
          });
          if (changed) set({ invoices: updatedInvoices });
        } catch(e) { console.error('[clearPartyPayment] auto-cancel reminder:', e); }
        // 🆕 sync creditBalance پس از تغییر وضعیت چک
        try {
          setPartyCredit(pp.partyId, computePartyCredit(pp.partyId, get().invoices, get().allocations));
        } catch (e) {
          console.error('[clearPartyPayment] setPartyCredit failed:', e);
        }

      },

      addDeal: (d) => set({ deals: [...get().deals, {...d, id: uuid(), createdAt: now(), updatedAt: now()}] }),
      updateDeal: (id, patch) => {
        const prev = get().deals.find(x => x.id === id);
        if (!prev) return;
        const merged = { ...prev, ...patch, updatedAt: now() };
        if (patch.status && patch.status !== prev.status) {
          if (patch.status === 'settled') merged.settledAt = now();
          else if (patch.status === 'cancelled') merged.cancelledAt = now();
          else if (patch.status === 'open') { merged.settledAt = undefined; merged.cancelledAt = undefined; }
        }
        set({ deals: get().deals.map(x => x.id === id ? merged : x) });
      },
      deleteDeal: (id) => {
        const deal = get().deals.find(x => x.id === id);
        if (!deal) return;

        // Backup به سبد زباله قبل از هر تغییر
        saveToRecycleBin<DeletedDealSnapshot>('tra-deals', { deal }, (existing) => existing.deal.id === id);

        // 🆕 Reverse تمام movements (flock + whs)
        // formState خالی + oldDeal = deal → reverse همه
        try {
          applyDealMovements(
            { partyId: '', goods: [], deliveries: [], sales: [], payments: [] } as any,
            deal
          );
        } catch (e) {
          console.error('[deleteDeal] reverse movements failed:', e);
        }

        set({ deals: get().deals.filter(x => x.id !== id) });
      },
      restoreDealFromBin: (id: string) => {
        const snapshot = removeFromRecycleBin<DeletedDealSnapshot>(
          'tra-deals',
          (existing) => existing.deal.id === id,
        );
        if (!snapshot) return false;
        if (get().deals.some(x => x.id === id)) return false;

        // پاک‌سازی tracking fields قدیمی (که به movement های حذف‌شده اشاره می‌کنن)
        const cleanDeal: Deal = {
          ...snapshot.deal,
          deliveries: (snapshot.deal.deliveries || []).map(dv => ({
            ...dv,
            whsMovementId: undefined,
            whsMovementIdIn: undefined,
            flockDeductedQuantity: undefined,
            flockSourceId: undefined,
          })),
        };

        // 🆕 Re-apply movements (creates new whs.Movement + updates flock.currentCount)
        try {
          applyDealMovements(cleanDeal as any, undefined);
        } catch (e) {
          console.error('[restoreDealFromBin] re-apply movements failed:', e);
        }

        set({ deals: [...get().deals, cleanDeal] });
        return true;
      },
      listDeletedDeals: () => listRecycleBin<DeletedDealSnapshot>('tra-deals').map(e => e.item),
      reopenDeal: (id, reason) => {
        const prev = get().deals.find(x => x.id === id);
        if (!prev) return false;
        if (prev.status === 'open') return false;
        if (!reason || !reason.trim()) return false;
        const history = [...(prev.reopenHistory || []), {
          from: prev.status as 'settled' | 'cancelled',
          to: 'open' as const,
          reason: reason.trim(),
          at: now(),
        }];
        set({
          deals: get().deals.map(x => x.id === id
            ? { ...x, status: 'open' as const, settledAt: undefined, cancelledAt: undefined, reopenHistory: history, updatedAt: now() }
            : x),
        });
        try {
          void import('../../cor/logger/auditLog').then(m => {
            m.logAction('update', 'tra', 'بازگشایی معامله ' + (prev.dealNumber || id) + ' — دلیل: ' + reason.trim());
          }).catch(() => {});
        } catch (e) { console.error('[reopenDeal] audit failed:', e); }
        return true;
      },
      restoreDeal: (deal) => {
        if (get().deals.some(x => x.id === deal.id)) return false;
        set({ deals: [...get().deals, deal] });
        return true;
      },
      addSettlement: (s) => {
        const dup = get().settlements.find(x =>
          x.dealId === s.dealId &&
          x.periodStart === s.periodStart &&
          x.periodEnd === s.periodEnd
        );
        if (dup) {
          throw new Error('برای این بازه در این معامله قبلاً تسویه‌ای (پیش‌نویس یا تأییدشده) ثبت شده است.');
        }
        const id = uuid();
        set({ settlements: [...get().settlements, { ...s, id, createdAt: now(), updatedAt: now() }] });
        return id;
      },
      updateSettlement: (id, patch) => {
        set({ settlements: get().settlements.map(x => x.id === id ? { ...x, ...patch, updatedAt: now() } : x) });
      },
      deleteSettlement: (id) => {
        const st = get().settlements.find(x => x.id === id);
        if (st?.invoiceId) {
          throw new Error('این تسویه دارای فاکتور است. ابتدا فاکتور را حذف کنید.');
        }
        set({ settlements: get().settlements.filter(x => x.id !== id) });
      },
      undoSettlement: (id) => {
        const st = get().settlements.find(x => x.id === id);
        if (!st) throw new Error('تسویه یافت نشد');
        if (st.status !== 'invoiced') {
          throw new Error('فقط تسویه‌های فاکتور‌شده قابل لغو هستند');
        }
        if (st.invoiceId) {
          get().deleteInvoice(st.invoiceId);
        }
        return true;
      },
      reopenSettlement: (id) => {
        const st = get().settlements.find(x => x.id === id);
        if (!st) return false;
        if (st.status === 'invoiced') {
          throw new Error('این تسویه دارای فاکتور است. ابتدا فاکتور را لغو کنید');
        }
        if (st.status !== 'confirmed') return false;
        set({
          settlements: get().settlements.map(x =>
            x.id === id ? { ...x, status: 'draft', updatedAt: now() } : x
          ),
        });
        return true;
      },
      addAllocation: (a) => {
        const id = uuid();
        set({ allocations: [...get().allocations, { ...a, id }] });
        // 🆕 dunning C5 gap: auto-cancel reminder if invoice fully paid
        try {
          const st = get();
          const inv = st.invoices.find(x => x.id === a.invoiceId);
          if (inv && inv.nextReminderAt) {
            const invAllocs = st.allocations.filter(al => al.invoiceId === a.invoiceId);
            let paid = 0;
            for (const al of invAllocs) {
              const p = (inv.payments || []).find(pp => pp.id === al.paymentId);
              if (!p) continue;
              if (p.method === 'check' && p.status !== 'cleared') continue;
              if (p.type === 'refund') paid -= al.amount;
              else paid += al.amount;
            }
            if (paid >= (inv.total || 0)) {
              set({ invoices: get().invoices.map(x => x.id === a.invoiceId ? { ...x, nextReminderAt: undefined, updatedAt: now() } : x) });
            }
          }
        } catch(e) { console.error('[addAllocation] auto-cancel reminder:', e); }
        return id;
      },
      addReminder: (invoiceId, params) => {
        const inv = get().invoices.find(i => i.id === invoiceId);
        if (!inv) return;
        const today = getTodayJalali();
        const nextDate = params.promisedDate || addJalaliDays(today, params.intervalDays);
        const logEntry = {
          date: today,
          method: params.method,
          methodLabel: params.methodLabel,
          note: params.note,
          intervalDays: params.intervalDays,
          ...(params.promisedDate ? { promisedDate: params.promisedDate } : {}),
          ...(params.promisedAmount !== undefined ? { promisedAmount: params.promisedAmount } : {}),
        };
        set({
          invoices: get().invoices.map(i => i.id === invoiceId ? {
            ...i,
            lastRemindedAt: today,
            nextReminderAt: nextDate,
            reminderLog: [...(i.reminderLog || []), logEntry],
            updatedAt: new Date().toISOString(),
          } : i),
        });
      },
      addDealReminder: (dealId, params) => {
        const d = get().deals.find(x => x.id === dealId);
        if (!d) return;
        const today = getTodayJalali();
        const nextDate = params.promisedDate || addJalaliDays(today, params.intervalDays);
        const logEntry = {
          date: today,
          method: params.method,
          methodLabel: params.methodLabel,
          note: params.note,
          intervalDays: params.intervalDays,
          ...(params.promisedDate ? { promisedDate: params.promisedDate } : {}),
          ...(params.promisedAmount !== undefined ? { promisedAmount: params.promisedAmount } : {}),
        };
        set({
          deals: get().deals.map(x => x.id === dealId ? {
            ...x,
            lastRemindedAt: today,
            nextReminderAt: nextDate,
            reminderLog: [...(x.reminderLog || []), logEntry],
            updatedAt: new Date().toISOString(),
          } : x),
        });
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
      version: 8,
      migrate: (persisted: any, version: number) => {
        if (!persisted?.invoices) return persisted;

        // v5 → v6: build allocations from existing payments
      // v7 → v8: merge settlement types (7 → 5)
      if (version < 8) {
        const typeMap: Record<string, string> = {
          commission_pct: 'percent',
          profit_sharing: 'percent',
          commission_per_unit: 'per_unit',
          grower_fee_per_unit: 'per_unit',
          fixed_amount: 'fixed',
          rental_monthly: 'rental',
          barter_direct: 'barter',
        };
        for (const deal of (persisted.deals || [])) {
          if (deal.settlementType && typeMap[deal.settlementType]) {
            deal.settlementType = typeMap[deal.settlementType];
          }
        }
      }
            if (version < 7) {
          persisted.settlements = persisted.settlements || [];
        }
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



/**
 * buildAdvanceAllocations — ساخت تخصیص پیش‌پرداخت به فاکتور جدید (FIFO)
 */
export function buildAdvanceAllocations(
  partyId: string,
  maxAmount: number,
  date: string,
): Array<{ partyPaymentId: string; amount: number; date: string }> {
  const st = useTra.getState();
  const advances = (st.partyPayments || [])
    .filter((p: any) => p.partyId === partyId && p.type === 'advance')
    .sort((a: any, b: any) => (a.date || '').localeCompare(b.date || ''));
  if (advances.length === 0) return [];
  const usedMap = new Map<string, number>();
  for (const inv of st.invoices) {
    for (const pay of (inv.payments || [])) {
      if (pay.partyPaymentId) {
        usedMap.set(pay.partyPaymentId, (usedMap.get(pay.partyPaymentId) || 0) + (Number(pay.amount) || 0));
      }
    }
  }
  const result: Array<{ partyPaymentId: string; amount: number; date: string }> = [];
  let remaining = maxAmount;
  for (const adv of advances) {
    if (remaining <= 0) break;
    const available = Math.max(0, (Number(adv.amount) || 0) - (usedMap.get(adv.id) || 0));
    if (available <= 0) continue;
    const amt = Math.min(remaining, available);
    result.push({ partyPaymentId: adv.id, amount: amt, date });
    remaining -= amt;
  }
  return result;
}

/**
 * computeUnappliedAdvances — مجموع پیش‌پرداخت‌های استفاده‌نشده
 */
export function computeUnappliedAdvances(partyId: string): number {
  const st = useTra.getState();
  const advances = (st.partyPayments || []).filter(
    (p: any) => p.partyId === partyId && p.type === 'advance'
  );
  if (advances.length === 0) return 0;
  const usedMap = new Map<string, number>();
  for (const inv of st.invoices) {
    for (const pay of (inv.payments || [])) {
      if (pay.partyPaymentId) {
        usedMap.set(pay.partyPaymentId, (usedMap.get(pay.partyPaymentId) || 0) + (Number(pay.amount) || 0));
      }
    }
  }
  return advances.reduce((s: number, a: any) => {
    const used = usedMap.get(a.id) || 0;
    return s + Math.max(0, (Number(a.amount) || 0) - used);
  }, 0);
}

export function computePartyCredit(partyId: string, invoices: Invoice[], allocations?: any[]): number {
  // SINGLE SOURCE OF TRUTH — partyBalance (formulas.ts)
  const base = partyBalance(partyId, invoices, allocations);
  if (!partyId) return base;

  // 🆕 فاز ۳.۵: اضافه کردن پیش‌پرداخت‌های استفاده‌نشده (type: 'advance')
  // base فقط inv.payments را می‌شمارد → advance های unapplied را نمی‌بیند
  const allPps = useTra.getState().partyPayments;
  const advances = (allPps || []).filter(
    (p: any) => p.partyId === partyId && p.type === 'advance'
  );
  if (advances.length === 0) return base;

  // محاسبه مجموع استفاده‌شده از هر partyPaymentId (از طریق inv.payments)
  const usedMap = new Map<string, number>();
  for (const inv of invoices) {
    for (const pay of (inv.payments || [])) {
      if (pay.partyPaymentId) {
        const amt = Number(pay.amount) || 0;
        usedMap.set(pay.partyPaymentId, (usedMap.get(pay.partyPaymentId) || 0) + amt);
      }
    }
  }

  // unapplied = Σ max(0, advance.amount - used)
  const unapplied = advances.reduce((s: number, a: any) => {
    const used = usedMap.get(a.id) || 0;
    const amt = Number(a.amount) || 0;
    return s + Math.max(0, amt - used);
  }, 0);

  return base + unapplied;
}
