/**
 * tra/invoiceHelpers.ts — اعمال اثر فاکتور روی انبار و گله
 */
import { parse as parseJ, format as formatJ, addDays } from 'date-fns-jalali';
import { useFlk } from '../flk/store';
import { useBrd } from '../brd/store';
import { getBiology, getStandardFor } from '../set/standards/resolve';
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
  const hal = useHal.getState();
  return inv.items.map(it => {
    const eqId = (it as any).equipmentId;
    if (!eqId) return it;
    const eq = hal.equipment.find(e => e.id === eqId);
    if (!eq) return it;
    // فقط خرید → لینک به فاکتور
    if (inv.type === 'purchase' && !eq.sourceInvoiceId) {
      try { hal.updateEquip(eqId, { sourceInvoiceId: inv.id } as any); } catch {}
    }
    return it;
  });
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
    const explicitFlockId = it.flockId || '';
    const type = ref.type;
    const sign = type === 'purchase' ? +1 : -1;

    if (explicitFlockId) {
      const f = flk.flocks.find(x => x.id === explicitFlockId);
      if (!f) continue;
      const next = (f.currentCount ?? 0) + sign * delta;
      flk.update(explicitFlockId, { currentCount: Math.max(0, next) });
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
        // 🆕 type و layingStartDay از استاندارد نژاد خونده می‌شن
        const standard = breed ? getStandardFor(breed.name || bird?.name || '', {}) : (bird ? getStandardFor(bird.name, {}) : null);
        const biology = standard?.biology || null;

        // نوع گله از روی category آیتم تشخیص داده می‌شود
        const inferredType: 'layer' | 'broiler' | 'breeder' =
          ref.cat === 'broiler' ? 'broiler' :
          ref.cat === 'breeder' ? 'breeder' :
          ref.cat === 'layer' ? 'layer' :
          // fallback بر اساس نژاد
          (standard?.purposes?.includes('broiler') ? 'broiler' :
           standard?.purposes?.includes('breeder') ? 'breeder' : 'layer');

        const newFlockId = flk.add({
          name,
          type: inferredType,
          birdId: birdId,
          breedId: breedId,
          hallId: '',
          zoneId: '',
          initialCount: delta,
          currentCount: delta,
          maleCount: it.maleCount ?? null,
          femaleCount: it.femaleCount ?? null,
          layingStartDay: biology?.layingStartDay ?? 0,
          endOfCycleDay: biology?.endOfCycleDay ?? null,
          vaccineScheduleId: '',
          hatchDate: computeHatchDate(inv.date, it.ageDays),
          purchaseDate: inv.date,
          startDate: inv.date,
          source: 'purchase',
          purchasePrice: it.unitPrice || 0,
          deliveryCost: it.shipping || 0,
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

