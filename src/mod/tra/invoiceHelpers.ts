import { useInc } from '../../mod/inc/store';
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
/** ⏱ دوره جوجه‌کشی بر اساس گونه پرنده (روز) */
function getIncubationDays(birdKind: string | undefined): number {
  const days: Record<string, number> = {
    chicken: 21, duck: 28, turkey: 28, goose: 30, quail: 18,
    pigeon: 18, ostrich: 42,
  };
  return days[(birdKind || 'chicken').toLowerCase()] || 21;
}

/** افزودن N روز به تاریخ جلالی (برای محاسبه تاریخ هچ تخم) */
function addJalaliDays(dateStr: string, days: number): string {
  if (!dateStr) return '';
  const parts = dateStr.split('/').map(Number);
  if (parts.length !== 3 || parts.some(isNaN)) return '';
  
  let [y, m, d] = parts;
  d += days;
  
  const monthDays = (month: number) => {
    if (month >= 1 && month <= 6) return 31;
    if (month >= 7 && month <= 11) return 30;
    return 29;
  };
  
  while (d > monthDays(m)) {
    d -= monthDays(m);
    m++;
    if (m > 12) { m = 1; y++; }
  }
  
  return `${y}/${String(m).padStart(2, '0')}/${String(d).padStart(2, '0')}`;
}

export function applyInvoiceEgg(inv: Invoice, prev?: Invoice): InvoiceItem[] {
  const outItems: InvoiceItem[] = (inv.items || []).map(it => ({ ...it }));

  // ─── فروش تخم (خوراکی یا نطفه‌دار) — برای هر قلم جداگانه ───
  if (inv.type === 'sale') {
    const egg = useEgg.getState();
    for (const it of outItems) {
      const cat = it.category || inv.category;
      if (cat !== 'egg' && cat !== 'fertile_egg') continue;
      if (!it.quantity || it.quantity <= 0) continue;
      const saleType = cat === 'fertile_egg' ? 'fertile' : 'eating';
      const exists = egg.sales.find((x: any) => x.sourceInvoiceId === inv.id && x.date === inv.date);
      if (exists) continue;
      try {
        egg.addSale({
          date: inv.date, type: saleType, count: it.quantity,
          unit: 'piece', unitPrice: it.unitPrice || 0,
          totalPrice: it.total || (it.quantity * (it.unitPrice || 0)),
          customerId: inv.partyId || '', paymentType: 'cash',
          notes: `فاکتور ${inv.number || ''}`,
          sourceInvoiceId: inv.id,
        } as any);
      } catch (e) { console.error('[TRA→EGG sale]', e); }
    }
    return outItems;
  }

  // ─── خرید تخم نطفه‌دار → ثبت در جوجه‌کشی ───
  if (inv.type === 'purchase') {
    const inc = useInc.getState();
    const brd = useBrd.getState();

    const keyOf = (it: any) =>
      `${it.birdId || ''}|${it.breedId || ''}|${it.eggBatchNo || ''}`;

    const findExisting = (it: any) => {
      const key = keyOf(it);
      const marker = `[K:${key}]`;
      return (inc.eggEntries || []).find((e: any) =>
        e.sourceInvoiceId === inv.id && (e.notes || '').includes(marker)
      );
    };

    for (let i = 0; i < outItems.length; i++) {
      const it = outItems[i] as any;
      const cat = it.category || inv.category;
      if (cat !== 'egg') continue;
      if (!it.quantity || it.quantity <= 0) continue;

      const broken = it.brokenEggCount || 0;
      const nonIncubable = it.nonIncubableCount || 0;
      const healthyCount = Math.max(0, it.quantity - broken - nonIncubable);
      if (healthyCount <= 0) continue;

      const bird = brd.birds.find((b: any) => b.id === it.birdId);
      const days = getIncubationDays(bird?.birdKind);
      const entryDate = inv.deliveryDate || it.eggDate || inv.date || '';
      const expectedHatchDate = addJalaliDays(entryDate, days);

      const marker = `[K:${keyOf(it)}]`;
      const existing = findExisting(it);

      if (existing) {
        try {
          inc.updateEntry(existing.id, {
            count: healthyCount,
            expectedHatchDate,
            entryDate,
            unitPrice: it.unitPrice || null,
            totalPrice: it.total || null,
            shippingCost: it.transportCost || null,
            sourceFarm: it.sourceFarm || '',
            nonIncubableCount: it.nonIncubableCount ?? 0,
          } as any);
          it.entryId = existing.id;
        } catch (e) { console.error('[TRA→INC update]', e); }
        continue;
      }

      try {
        const entryId = inc.addEntry({
          deviceId: '', hatchGroupId: '',
          birdId: it.birdId || '', breedId: it.breedId || '',
          count: healthyCount, entryDate, expectedHatchDate,
          source: 'purchase',
          dealType: ((inv as any).dealType || 'own') as any,
          dealStatus: 'active' as any,
          dealWithdrawnAt: '', dealWithdrawnReason: '', dealData: {},
          trayNumbers: '',
          unitPrice: it.unitPrice || null,
          totalPrice: it.total || null,
          shippingCost: it.transportCost || null,
          status: 'incubating' as any,
          generatedInvoiceId: '', generatedProductionId: '',
          notes: `از فاکتور خرید ${inv.number || ''} ${marker}`,
          sampleWeightInitial: it.eggWeight || null,
          sampleWeightCurrent: null,
          sourceInvoiceId: inv.id,
          sourceFarm: it.sourceFarm || '',
          nonIncubableCount: it.nonIncubableCount ?? 0,
        });
        it.entryId = entryId;
      } catch (e) { console.error('[TRA→INC create]', e); }
    }

    // پاک‌سازی رکوردهای یتیم
    if (prev) {
      const newKeys = new Set(
        outItems.filter((it: any) => it.quantity > 0).map((it: any) => keyOf(it))
      );
      const orphans = (inc.eggEntries || []).filter((e: any) => {
        if (e.sourceInvoiceId !== inv.id) return false;
        const m = (e.notes || '').match(/\[K:([^\]]+)\]/);
        if (!m) return true;
        return !newKeys.has(m[1]);
      });
      for (const entry of orphans) {
        try { inc.deleteEntry(entry.id); } catch (e) { console.error('[TRA→INC cleanup]', e); }
      }
    }

    return outItems;
  }

  return inv.items;
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
        purchasedAt: inv.deliveryDate || inv.date || '',
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
    for (const it of inv2.items || []) {
      if (!it.birdId) continue;
      const cat = it.category || inv2.category;
      if (!BIRD_CATS.includes(cat)) continue;
      const k = keyOf(cat, it);
      const qty = (it.healthyCount ?? it.quantity) || 0;
      const cur = m.get(k);
      if (cur) cur.qty += qty;
      else m.set(k, { item: it, cat, qty, type: inv2.type });
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
    const effectiveDate = (inv as any).deliveryDate || inv.date || '';

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
        const transport = it.transportCost ?? it.shipping;
        if (transport) patch.deliveryCost = transport;
        if (effectiveDate) patch.purchaseDate = effectiveDate;
      }
      flk.update(explicitFlockId, patch);
      for (let i = 0; i < inv.items.length; i++) {
        if (keyOf(inv.items[i].category || inv.category, inv.items[i]) === k) outItems[i].flockId = explicitFlockId;
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
          if (keyOf(inv.items[i].category || inv.category, inv.items[i]) === k) outItems[i].flockId = existing.id;
        }
      } else if (delta > 0) {
        const breed = brd.breeds.find(b => b.id === it.breedId);
        const bird = brd.birds.find(b => b.id === it.birdId);
        const name = `گله ${breed?.name || bird?.name || '?'} — ${effectiveDate}`;
        // type و layingStartDay از استاندارد نژاد
        let standard: any = null;
        let biology: any = null;
        try {
          standard = breed ? getStandardFor(breed.name || bird?.name || '', {}) : (bird ? getStandardFor(bird.name, {}) : null);
          biology = standard?.biology || null;
        } catch(e) {
          console.warn('[applyInvoiceFlocks] getStandardFor failed, using defaults:', e);
        }
        const inferredType: 'layer' | 'broiler' | 'breeder' =
          ref.cat === 'broiler' ? 'broiler' :
          ref.cat === 'breeder' ? 'breeder' :
          ref.cat === 'layer' ? 'layer' :
          (standard?.purposes?.includes('broiler') ? 'broiler' :
           standard?.purposes?.includes('breeder') ? 'breeder' : 'layer');

        const newFlockId = flk.add({
          name: it.flockName || name,
          type: inferredType,
          birdId: birdId,
          breedId: breedId,
          hallId: it.hallId || '',
          zoneId: it.zoneId || '',
          initialCount: delta,
          currentCount: delta,
          maleCount: it.maleCount ?? null,
          femaleCount: it.femaleCount ?? null,
          unknownCount: it.unknownCount ?? null,
          layingStartDay: biology?.layingStartDay ?? 0,
          endOfCycleDay: biology?.endOfCycleDay ?? null,
          vaccineScheduleId: '',
          hatchDate: it.hatchDate || computeHatchDate(effectiveDate, it.ageDays),
          purchaseDate: effectiveDate,
          startDate: effectiveDate,
          source: 'purchase',
          purchasePrice: it.unitPrice || 0,
          deliveryCost: typeof it.transportCost === 'number' && it.transportCost > 0 ? it.transportCost : 0,
          otherCosts: 0,
          status: 'active',
          notes: `از فاکتور ${inv.number || ''}`,
          sourceInvoiceId: inv.id,
          sourceCategory: ref.cat,
          hatcheryBatchNo: it.hatcheryBatchNo || undefined,
          chickWeight: it.chickWeight ?? null,
        });

        for (let i = 0; i < inv.items.length; i++) {
          if (keyOf(inv.items[i].category || inv.category, inv.items[i]) === k) outItems[i].flockId = newFlockId;
        }
      }
    }
  }

  return outItems;
}

