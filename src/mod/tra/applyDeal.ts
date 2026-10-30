/**
 * applyDeal.ts — منطق اعمال حرکات معامله (whs + flock)
 * جدا شده از DealsPage برای تست‌پذیری
 */
import { useWhs } from '../whs/store';
import { useFlk } from '../flk/store';
import { useInc } from '../inc/store';
import type { Deal, DealGood, DealDelivery } from './types';

/** فقط فیلدهای موردنیاز از فرم معامله */
export interface DealFormState {
  partyId: string;
  dealNumber: string;
  date: string;
  goods: DealGood[];
  deliveries: DealDelivery[];
}

  export function applyDealMovements(formState: DealFormState, oldDeal?: Deal): void {
  const whs = useWhs.getState();
  const oldDeliveries = oldDeal?.deliveries || [];
  const partyId = formState.partyId || '';
  const consignmentLoc = partyId ? `consignment:${partyId}` : 'stock';

  const getOwnership = (dv: DealDelivery): 'none' | 'mine' | 'theirs' => {
    if (dv.type === 'in') return 'theirs';
    if (dv.ownership) return dv.ownership;
    return dv.whsEnabled === true ? 'theirs' : 'none';
  };

  // 1. Delete movements for removed/disabled deliveries
  for (const old of oldDeliveries) {
    const cur = formState.deliveries.find(d => d.id === old.id);
    const shouldRemove = !cur || getOwnership(cur) === 'none';
    if (shouldRemove) {
      if (old.whsMovementId) {
        try { whs.deleteMovement(old.whsMovementId); } catch (e) { console.error('[deals->whs] delete out failed:', e); }
      }
      if (old.whsMovementIdIn) {
        try { whs.deleteMovement(old.whsMovementIdIn); } catch (e) { console.error('[deals->whs] delete in failed:', e); }
      }
      if (old.flockDeductedQuantity && old.flockSourceId) {
        const flock = useFlk.getState().flocks.find(f => f.id === old.flockSourceId);
        if (flock) {
          try { useFlk.getState().update(flock.id, { currentCount: (flock.currentCount || 0) - old.flockDeductedQuantity }); } catch (e) { console.error('[deals->flk] reverse failed:', e); }
        }
      }
      if (cur) { cur.whsMovementId = undefined; cur.whsMovementIdIn = undefined; cur.flockDeductedQuantity = undefined; cur.flockSourceId = undefined; }
    }
  }

  // 2. Delete movements for changed deliveries (will be re-added below)
  for (const dv of formState.deliveries) {
    const old = oldDeliveries.find(d => d.id === dv.id);
    if (!old) continue;
    const ownChanged = getOwnership(old) !== getOwnership(dv);
    const fieldsChanged = old.quantity !== dv.quantity || old.type !== dv.type || old.date !== dv.date || (old.time || '') !== (dv.time || '');
    if (!ownChanged && !fieldsChanged) continue;
    if (old.whsMovementId) {
      try { whs.deleteMovement(old.whsMovementId); } catch (e) { console.error('[deals->whs] delete out failed:', e); }
      dv.whsMovementId = undefined;
    }
    if (old.whsMovementIdIn) {
      try { whs.deleteMovement(old.whsMovementIdIn); } catch (e) { console.error('[deals->whs] delete in failed:', e); }
      dv.whsMovementIdIn = undefined;
    }
      
      // 🆕 Phase 1.6: reverse flock for changed
      if (old.flockDeductedQuantity && old.flockSourceId) {
        const flock = useFlk.getState().flocks.find(f => f.id === old.flockSourceId);
        if (flock) {
          try { useFlk.getState().update(flock.id, { currentCount: (flock.currentCount || 0) - old.flockDeductedQuantity }); } catch (e) { console.error('[deals->flk] reverse failed:', e); }
        }
      }
      dv.flockDeductedQuantity = undefined;
      dv.flockSourceId = undefined;

  }

  // 3. Pre-flight: چک موجودی برای همه movementها (atomic — قبل از هر حرکتی)
  for (const dv of formState.deliveries) {
    const own = getOwnership(dv);
    if (own === 'none') continue;
    if (dv.type === 'loss') continue;
    const good = formState.goods.find(g => g.id === dv.goodId);
    if (own === 'mine' && !good?.linkedItemId) {
      throw new Error('برای امانت، کالا باید به انبار متصل باشد: «' + (good?.name || '—') + '»');
    }
    if (good?.linkedItemId && (own === 'mine' || dv.type === 'out')) {
      const item = whs.items.find(i => i.id === good.linkedItemId);
      if (item) {
        const available = item.stockByLocation?.['stock'] ?? item.currentStock ?? 0;
        if (available < dv.quantity) {
          throw new Error('موجودی «' + good.name + '» کافی نیست — موجودی: ' + available + '، درخواستی: ' + dv.quantity);
        }
      }
    }
  }

  // 4. Add movements for enabled deliveries
  for (const dv of formState.deliveries) {
    const own = getOwnership(dv);
    if (own === 'none') continue;
    if (dv.type === 'loss') continue;
    const good = formState.goods.find(g => g.id === dv.goodId);
    if (!good?.linkedItemId) continue;

    try {
      if (own === 'mine') {
        // Internal Transfer: stock -X + consignment +X
        if (!dv.whsMovementId) {
          const midOut = whs.addMovement({
            itemId: good.linkedItemId,
            type: 'out',
            quantity: dv.quantity,
            unitPrice: 0,
            reason: dv.type === 'out' ? 'consumption' : 'return',
            date: dv.date || formState.date || '',
            locationId: 'stock',
            partyId,
            notes: `Deal ${formState.dealNumber || ''} - ${good.name} → امانت`,
            sourceModule: 'deal',
            sourceId: dv.id,
          });
          if (midOut) dv.whsMovementId = midOut;
        }
        if (!dv.whsMovementIdIn) {
          const midIn = whs.addMovement({
            itemId: good.linkedItemId,
            type: 'in',
            quantity: dv.quantity,
            unitPrice: 0,
            reason: 'adjustment',
            date: dv.date || formState.date || '',
            locationId: consignmentLoc,
            partyId,
            notes: `Deal ${formState.dealNumber || ''} - ${good.name} ← امانت`,
            sourceModule: 'deal',
            sourceId: dv.id,
          });
          if (midIn) dv.whsMovementIdIn = midIn;
        }
      } else {
        // ownership === 'theirs': Move out (stock -X) or in (return)
        if (!dv.whsMovementId) {
          const mid = whs.addMovement({
            itemId: good.linkedItemId,
            type: dv.type === 'out' ? 'out' : 'in',
            quantity: dv.quantity,
            unitPrice: 0,
            reason: dv.type === 'out' ? 'consumption' : 'return',
            date: dv.date || formState.date || '',
            locationId: 'stock',
            partyId,
            notes: `Deal ${formState.dealNumber || ''} - ${good.name}`,
            sourceModule: 'deal',
            sourceId: dv.id,
          });
          if (mid) dv.whsMovementId = mid;
        }
      }
    } catch (e) {
      console.error('[deals->whs] addMovement failed:', e);
    }
  }

    // 🆕 Phase 1.6: Apply flock/hatch deductions
    for (const dv of formState.deliveries) {
      const own = getOwnership(dv);
      if (own === 'none') continue;
      if (dv.type === 'loss') continue;
      if (dv.flockDeductedQuantity !== undefined) continue;
      const good = formState.goods.find(g => g.id === dv.goodId);
      if (!good) continue;

      let targetFlockId: string | null = null;
      if (good.existingFlockId) {
        targetFlockId = good.existingFlockId;
      } else if (good.hatchId) {
        const hatch = useInc.getState().hatches.find(h => h.id === good.hatchId);
        if (hatch?.generatedFlockId) targetFlockId = hatch.generatedFlockId;
        else throw new Error('هچ «' + good.name + '» هنوز گله ندارد — ابتدا هچ را نهایی کنید');
      }
      if (!targetFlockId) continue;

      const flock = useFlk.getState().flocks.find(f => f.id === targetFlockId);
      if (!flock) throw new Error('گله «' + good.name + '» یافت نشد');

      if (dv.type === 'out') {
        const current = flock.currentCount || 0;
        if (current < dv.quantity) {
          throw new Error('موجودی گله «' + flock.name + '» کافی نیست — موجودی: ' + current + '، درخواستی: ' + dv.quantity);
        }
      }

      const delta = dv.type === 'out' ? -dv.quantity : dv.quantity;
      const current = flock.currentCount || 0;
      const newCount = current + delta;

      if (delta < 0) {
        const m = flock.maleCount ?? 0;
        const fe = flock.femaleCount ?? 0;
        const u = flock.unknownCount ?? 0;
        const reduceBy = Math.abs(delta);
        const newU = Math.max(0, u - reduceBy);
        const remaining = Math.max(0, reduceBy - u);
        let newM = m, newFe = fe;
        if (remaining > 0 && (m + fe) > 0) {
          const reduceM = Math.min(m, Math.round(remaining * m / (m + fe)));
          const reduceFe = Math.min(fe, remaining - reduceM);
          newM = m - reduceM;
          newFe = fe - reduceFe;
        }
        useFlk.getState().update(flock.id, { currentCount: Math.max(0, newCount), maleCount: newM, femaleCount: newFe, unknownCount: newU });
      } else {
        useFlk.getState().update(flock.id, { currentCount: newCount, unknownCount: (flock.unknownCount ?? 0) + delta });
      }

      dv.flockDeductedQuantity = delta;
      dv.flockSourceId = flock.id;
    }
}
