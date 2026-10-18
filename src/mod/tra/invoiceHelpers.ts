/**
 * tra/invoiceHelpers.ts — اعمال اثر فاکتور روی انبار و گله
 */
import { parse as parseJ, format as formatJ, addDays } from 'date-fns-jalali';
import { useFlk } from '../flk/store';
import { useBrd } from '../brd/store';
import { getBiology, getStandardFor } from '../set/standards/resolve';
import { showToast } from '../../cor/store/toast';
import { useHal } from '../hal/store';
import { useEgg } from '../egg/store';
import type { Invoice, InvoiceItem, InvoiceType } from './types';

/** اعمال اثر فاکتور روی گله‌ها — خرید جوجه/پرنده → افزودن، فروش → کاهش */
/** محاسبه تاریخ هچ از تاریخ فاکتور منهای سن */
function computeHatchDate(invDate: string, ageDays: number | null | undefined): string {
  if (!ageDays || ageDays <= 0) return '';
  try {
    const en = invDate.replace(/[۰-۹]/g, (d: string) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d)));
    const d = parseJ(en, 'yyyy/MM/dd', new Date());
    if (isNaN(d.getTime())) return '';
    return formatJ(addDays(d, -ageDays), 'yyyy/MM/dd');
  } catch { return ''; }
}

export const BIRD_CATS = ['chick', 'adult', 'fertile_egg'];

/* EGG_LINK */
/** اتصال فاکتور فروش تخم → EggSale خودکار */
export function applyInvoiceEgg(inv: Invoice): InvoiceItem[] {
  if (inv.category !== 'egg' || inv.type !== 'sale') return inv.items;
  const egg = useEgg.getState();
  return inv.items.map(it => {
    if (!it.quantity || it.quantity <= 0) return it;
    // نوع تخم از فیلد eggTypes
    const rawType = ((it as any).eggTypes || [])[0] || 'eating';
    const type = rawType === 'fertile' ? 'fertile' : rawType === 'broken' ? 'broken' : 'eating';
    // جلوگیری از تکراری
    const exists = egg.sales.find((x) => x.sourceInvoiceId === inv.id && x.date === inv.date);
    if (exists) return it;
    try {
      egg.addSale({
        date: inv.date,
        type,
        count: it.quantity,
        unit: 'piece',
        unitPrice: it.unitPrice || 0,
        totalPrice: it.total || (it.quantity * (it.unitPrice || 0)),
        customerId: inv.partyId || '',
        paymentType: 'cash',
        notes: `فاکتور ${inv.number || ''}`,
        sourceInvoiceId: inv.id,
      } as any);
    } catch (e) { console.error('[TRA→EGG]', e); }
    return it;
  });
}

/* EQUIP_LINK */
/** اتصال فاکتور تجهیزات → Equipment.sourceInvoiceId (خرید) */
export function applyInvoiceEquipment(inv: Invoice): InvoiceItem[] {
  if (inv.type !== 'purchase') return inv.items;
  
  const hal = useHal.getState();
  const outItems: InvoiceItem[] = (inv.items || []).map(it => ({ ...it }));
  
  for (let i = 0; i < outItems.length; i++) {
    const it = outItems[i] as any;
    
    // ۱. اگر equipmentId از قبل ست شده → لینک به تجهیز موجود
    const eqId = it.equipmentId;
    if (eqId) {
      const eq = hal.equipment.find(e => e.id === eqId);
      if (eq && !eq.sourceInvoiceId) {
        try { hal.updateEquip(eqId, { sourceInvoiceId: inv.id } as any); } catch {}
      }
      continue;
    }
    
    // ۲. اگر سالن انتخاب نشده → رد شو
    if (!it.hallId) continue;
    
    // ۳. اگر دسته تجهیزات نیست → رد شو
    const itemCat = it.category || inv.category;
    if (itemCat !== 'equipment') continue;
    
    // ۴. بررسی تکراری: آیا قبلاً برای همین فاکتور ساخته شده؟
    const existing = hal.equipment.find(
      (e: any) => e.sourceInvoiceId === inv.id && e.name === (it.description || it.model || '')
    );
    
    if (existing) {
      // آپدیت تجهیز موجود
      try {
        hal.updateEquip(existing.id, {
          hallId: it.hallId,
          zoneId: it.zoneId || '',
          count: it.quantity || 1,
          unitPrice: it.unitPrice || null,
          warranty: it.warrantyMonths || null,
          brand: it.brand || '',
        } as any);
        it.equipmentId = existing.id;
      } catch (e) { console.error('[TRA→HAL update]', e); }
      continue;
    }
    
    // ۵. ساخت تجهیز جدید
    try {
      const newId = hal.addEquip({
        hallId: it.hallId,
        zoneId: it.zoneId || '',
        category: (it.equipmentCategory || 'other') as any,
        type: it.equipmentType || 'other',
        name: it.description || it.model || 'تجهیز',
        count: it.quantity || 1,
        unit: (it.unit || 'pcs') as any,
        unitPrice: it.unitPrice || null,
        purchasedAt: inv.date || '',
        warranty: it.warrantyMonths || null,
        notes: `از فاکتور ${inv.number || ''}`
          + (it.model ? ` | مدل: ${it.model}` : '')
          + (it.serialNo ? ` | سریال: ${it.serialNo}` : ''),
        brand: it.brand || '',
        supplierId: inv.partyId || '',
        sourceInvoiceId: inv.id,
      } as any);
      it.equipmentId = newId;
    } catch (e) { console.error('[TRA→HAL create]', e); }
  }
  
  return outItems;
}


/* ITEMS_RETURNED */
export function applyInvoiceFlocks(inv: Invoice, prev?: Invoice): InvoiceItem[] {
  const flk = useFlk.getState();
  const brd = useBrd.getState();
  const outItems: InvoiceItem[] = (inv.items || []).map(it => ({ ...it }));

  const keyOf = (cat: string, it: InvoiceItem) =>
    `${cat}|${it.birdId || ''}|${it.breedId || ''}|${it.flockId || ''}`;

  type G = { item: InvoiceItem; cat: string; qty: number; type: InvoiceType };

  const buildMap = (inv2: Invoice | undefined): Map<string, G> => {
    const m = new Map<string, G>();
    if (!inv2) return m;
    if (!BIRD_CATS.includes(inv2.category)) return m;
    for (const it of inv2.items || []) {
      if (!it.birdId) continue;
      const k = keyOf(inv2.category, it);
      const cur = m.get(k);
      if (cur) cur.qty += (it.quantity || 0);
      else m.set(k, { item: it, cat: inv2.category, qty: it.quantity || 0, type: inv2.type });
    }
    return m;
  };

  const prevMap = buildMap(prev);
  const newMap = buildMap(inv);
  const allKeys = new Set<string>([...prevMap.keys(), ...newMap.keys()]);

  for (const k of allKeys) {
    const p0 = prevMap.get(k);
    const n0 = newMap.get(k);
    const pq = p0?.qty || 0;
    const nq = n0?.qty || 0;
    const delta = nq - pq;
    if (delta === 0) continue;
    const ref = n0 || p0;
    if (!ref) continue;
    const it = ref.item;
    // 🆕 اولویت: relatedFlockId فاکتور → flockId آیتم
    const explicitFlockId = (inv as any).relatedFlockId || it.flockId || '';
    const type = ref.type;
    const sign = type === 'purchase' ? +1 : -1;

    if (explicitFlockId) {
      const f = flk.flocks.find(x => x.id === explicitFlockId);
      if (!f) continue;
      const next = Math.max(0, (f.currentCount ?? 0) + sign * delta);
      const patch: any = { currentCount: next };
      if (type === 'purchase' && delta > 0) {
        patch.initialCount = (f.initialCount ?? 0) + delta;
        patch.sourceInvoiceId = inv.id;
        patch.sourceCategory = ref.cat;
        if (it.unitPrice) patch.purchasePrice = it.unitPrice;
        if (it.shipping) patch.deliveryCost = it.shipping;
        if (inv.date) patch.purchaseDate = inv.date;
      }
      flk.update(explicitFlockId, patch);
      for (let i = 0; i < inv.items.length; i++) {
        if (keyOf(inv.category, inv.items[i]) === k) outItems[i].flockId = explicitFlockId;
      }
    } else if (type === 'purchase') {
      const birdId = it.birdId || '';
      const breedId = it.breedId || '';
      const existing = flk.flocks.find(f =>
        f.sourceInvoiceId === inv.id &&
        f.sourceCategory === ref.cat &&
        f.birdId === birdId &&
        (f.breedId || '') === breedId
      );
      if (existing) {
        const next = (existing.currentCount ?? 0) + delta;
        flk.update(existing.id, { currentCount: Math.max(0, next) });
        for (let i = 0; i < inv.items.length; i++) {
          if (keyOf(inv.category, inv.items[i]) === k) outItems[i].flockId = existing.id;
        }
      } else if (delta > 0) {
        const breed = brd.breeds.find(b => b.id === it.breedId);
        const bird = brd.birds.find(b => b.id === it.birdId);
        const name = `گله ${breed?.name || bird?.name || '?'} — ${inv.date}`;
        // type و layingStartDay از استاندارد نژاد
        const standard = breed ? getStandardFor(breed.name || bird?.name || '', {}) : (bird ? getStandardFor(bird.name, {}) : null);
        const biology = standard?.biology || null;
        const inferredType: 'layer' | 'broiler' | 'breeder' =
          ref.cat === 'broiler' ? 'broiler' :
          ref.cat === 'breeder' ? 'breeder' :
          ref.cat === 'layer' ? 'layer' :
          (standard?.purposes?.includes('broiler') ? 'broiler' :
           standard?.purposes?.includes('breeder') ? 'breeder' : 'layer');

        const newFlockId = flk.add({
          name: (it as any).flockName || name,
          type: inferredType,
          birdId: birdId,
          breedId: breedId,
          hallId: (it as any).hallId || '',
          zoneId: (it as any).zoneId || '',
          initialCount: delta,
          currentCount: delta,
          maleCount: it.maleCount ?? null,
          femaleCount: it.femaleCount ?? null,
          unknownCount: it.unknownCount ?? null,
          layingStartDay: biology?.layingStartDay ?? 0,
          endOfCycleDay: biology?.endOfCycleDay ?? null,
          vaccineScheduleId: '',
          hatchDate: computeHatchDate(inv.date, it.ageDays),
          purchaseDate: inv.date,
          startDate: inv.date,
          source: 'purchase',
          purchasePrice: it.unitPrice || 0,
          deliveryCost: (it as any).transportCost || 0,
          otherCosts: 0,
          status: 'active',
          notes: `از فاکتور ${inv.number || ''}`,
          sourceInvoiceId: inv.id,
          sourceCategory: ref.cat,
        });

        for (let i = 0; i < inv.items.length; i++) {
          if (keyOf(inv.category, inv.items[i]) === k) outItems[i].flockId = newFlockId;
        }
      }
    }
  }

  return outItems;
}

