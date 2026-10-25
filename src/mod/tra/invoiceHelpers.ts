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
import { useWhs } from '../whs/store';
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

export const BIRD_CATS = ['chick', 'adult'];

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
    // 🆕 rebuild: پاک‌سازی sales قبلی این فاکتور، سپس افزودن مجدد
    const oldSales = egg.sales.filter((x: any) => x.sourceInvoiceId === inv.id);
    for (const s of oldSales) {
      try { egg.deleteSale(s.id); } catch (e) { console.error('[applyInvoiceEgg] deleteSale failed:', e); }
    }
    for (const it of outItems) {
      const cat = it.category || inv.category;
      if (cat !== 'egg' && cat !== 'fertile_egg') continue;
      if (!it.quantity || it.quantity <= 0) continue;
      const saleType = cat === 'fertile_egg' ? 'fertile' : 'eating';
      try {
        egg.addSale({
          date: it.eggDate || inv.date, type: saleType, count: it.quantity,
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

    const findExisting = (it: any) =>
      (inc.eggEntries || []).find((e: any) =>
        e.sourceInvoiceId === inv.id &&
        e.birdId === (it.birdId || '') &&
        e.breedId === (it.breedId || '')
      );

    for (let i = 0; i < outItems.length; i++) {
      const it = outItems[i] as any;
      const cat = it.category || inv.category;
      // 🆕 fertile_egg هم به عنوان ورودی تخم‌گذاری ثبت می‌شه (نه flock)
      if (cat !== 'egg' && cat !== 'fertile_egg') continue;
      if (!it.quantity || it.quantity <= 0) continue;

      const broken = it.brokenEggCount || 0;
      const nonIncubable = it.nonIncubableCount || 0;
      const healthyCount = Math.max(0, it.quantity - broken - nonIncubable);
      if (healthyCount <= 0) continue;

      const bird = brd.birds.find((b: any) => b.id === it.birdId);
      const days = getIncubationDays(bird?.birdKind);
      const entryDate = inv.deliveryDate || it.eggDate || inv.date || '';
      const expectedHatchDate = addJalaliDays(entryDate, days);

        const existing = findExisting(it);

      if (existing) {
        try {
          inc.updateEntry(existing.id, {
            count: healthyCount,
            expectedHatchDate,
            entryDate,
            unitPrice: it.unitPrice || null,
            totalPrice: it.total || null,
            shippingCost: it.transportCost || it.shipping || null,
            nonIncubableCount: it.nonIncubableCount ?? 0,
            brokenEggCount: it.brokenEggCount ?? null,
          } as any);
          it.entryId = existing.id;
        } catch (e) { console.error('[TRA→INC update]', e); }
        continue;
      }

      try {
        const entryId = inc.addEntry({
          deviceId: it.deviceId || '', hatchGroupId: '',
          birdId: it.birdId || '', breedId: it.breedId || '',
          count: healthyCount, entryDate, expectedHatchDate,
          source: 'purchase',
          dealType: ((inv as any).dealType || 'own') as any,
          dealStatus: 'active' as any,
          dealWithdrawnAt: '', dealWithdrawnReason: '', dealData: {},
          trayNumbers: '',
          unitPrice: it.unitPrice || null,
          totalPrice: it.total || null,
          shippingCost: it.transportCost || it.shipping || null,
          status: 'incubating' as any,
          generatedInvoiceId: '', generatedProductionId: '',
          notes: `از فاکتور خرید ${inv.number || ''}`,
          sampleWeightInitial: it.eggWeight || null,
          sampleWeightCurrent: null,
          sourceInvoiceId: inv.id,
          nonIncubableCount: it.nonIncubableCount ?? 0,
          brokenEggCount: it.brokenEggCount ?? null,
        });
        it.entryId = entryId;
      } catch (e) { console.error('[TRA→INC create]', e); }
    }

    // پاک‌سازی رکوردهای یتیم
    if (prev) {
      const newBB = new Set(
        outItems
          .filter((it: any) => {
            const c = it.category || inv.category;
            return (c === 'egg' || c === 'fertile_egg') && (it.quantity || 0) > 0;
          })
          .map((it: any) => `${it.birdId || ''}|${it.breedId || ''}`)
      );
      const orphans = (inc.eggEntries || []).filter((e: any) => {
        if (e.sourceInvoiceId !== inv.id) return false;
        const key = `${e.birdId || ''}|${e.breedId || ''}`;
        return !newBB.has(key);
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
function ensureWhsItem(it: any, inv: Invoice, whs: any): string {
  const name = String(it.description || it.model || '').trim();
  if (!name) return '';
  const qty = Number(it.quantity) || 1;

  const addMovement = (itemId: string) => {
    try {
      whs.addMovement({
        itemId, type: 'in', quantity: qty,
        unitPrice: Number(it.unitPrice) || 0,
        reason: 'purchase',
        date: inv.deliveryDate || inv.date || '',
        partyId: inv.partyId || '',
        notes: `فاکتور ${inv.number || ''}${it.description ? ' — ' + it.description : ''}`,
        sourceModule: 'tra', sourceId: inv.id,
      } as any);
    } catch (e) { console.error('[TRA→WHS movement]', e); }
  };

  if (it.stockItemId && whs.items.find((x: any) => x.id === it.stockItemId)) {
    addMovement(it.stockItemId);
    return it.stockItemId;
  }

  const existing = whs.items.find((x: any) => x.name === name && x.category === 'equipment');
  if (existing) {
    addMovement(existing.id);
    return existing.id;
  }

  try {
    const id = whs.addItem({
      name, category: 'equipment', unit: (it.unit || 'pcs') as any,
      minStock: 0, currentStock: 0,
      lastPrice: Number(it.unitPrice) || 0,
      supplierId: inv.partyId || '', expireDate: '',
      withdrawalDays: null, storage: 'room',
      notes: `از فاکتور ${inv.number || ''}`,
      brand: it.brand || '', hallId: it.hallId || '',
      equipmentStatus: it.equipmentStatus || '',
      purchaseDate: inv.deliveryDate || inv.date || '',
      purchasePrice: Number(it.unitPrice) || 0,
    } as any);
    addMovement(id);
    return id;
  } catch (e) {
    console.error('[TRA→WHS equipment addItem]', e);
    return '';
  }
}

export function applyInvoiceEquipment(inv: Invoice, prev?: Invoice): InvoiceItem[] {

  // ✅ SALE: کاهش از hal + whs (متقارن با purchase)
  if (inv.type === 'sale') {
    const hal = useHal.getState();
    const whs = useWhs.getState();
    const outItems: InvoiceItem[] = (inv.items || []).map(it => ({ ...it }));

    for (let i = 0; i < outItems.length; i++) {
      const it = outItems[i] as any;
      const itemCat = it.category || inv.category;
      if (itemCat !== 'equipment') continue;
      if (it.equipmentKind === 'consumable') continue;  // consumable توسط applyStock

      const qty = Number(it.quantity) || 1;

      // ۱. کاهش از hal.equipment
      if (it.equipmentId) {
        const eq = hal.equipment.find(e => e.id === it.equipmentId);
        if (eq) {
          const newCount = Math.max(0, (eq.count || 0) - qty);
          try {
            if (newCount === 0) {
              hal.deleteEquip(it.equipmentId);
            } else {
              hal.updateEquip(it.equipmentId, { count: newCount } as any);
            }

            // ۲. کاهش از whs (via warehouseItemId)
            if (eq.warehouseItemId) {
              try {
                whs.addMovement({
                  itemId: eq.warehouseItemId,
                  type: 'out',
                  quantity: qty,
                  unitPrice: Number(it.unitPrice) || 0,
                  reason: 'sale',
                  date: inv.deliveryDate || inv.date || '',
                  partyId: inv.partyId || '',
                  notes: `فروش تجهیزات — فاکتور ${inv.number || ''}` ,
                  sourceModule: 'tra', sourceId: inv.id,
                } as any);
              } catch (e) { console.error('[TRA→WHS sale equip]', e); }
            }
          } catch (e) { console.error('[TRA→HAL sale]', e); }
        }
      }
    }

    // Orphan cleanup (update case)
    if (prev) {
      const activeEqIds = new Set(outItems.map((it: any) => it.equipmentId).filter(Boolean));
      const orphans = hal.equipment.filter((e: any) =>
        e.sourceInvoiceId === inv.id && !activeEqIds.has(e.id)
      );
      for (const orphan of orphans) {
        try { hal.deleteEquip(orphan.id); } catch {}
      }
    }

    return outItems;
  }

  if (inv.type !== 'purchase') return inv.items;
  
  const hal = useHal.getState();
  const whs = useWhs.getState();
  const outItems: InvoiceItem[] = (inv.items || []).map(it => ({ ...it }));
  
  for (let i = 0; i < outItems.length; i++) {
    const it = outItems[i] as any;
    console.log('[applyInvoiceEquipment] بررسی قلم:', it.description, '| دسته:', it.category, '| نوع:', it.equipmentKind, '| سالن:', it.hallId);
    
    // ۱. اگر equipmentId از قبل ست شده → لینک به تجهیز موجود
const eqId = it.equipmentId;
      if (eqId) {
        const eq = hal.equipment.find(e => e.id === eqId);
        if (eq) {
          if (!eq.sourceInvoiceId) {
            const whsId = eq.warehouseItemId || ensureWhsItem(it, inv, whs);
            try { hal.updateEquip(eqId, { sourceInvoiceId: inv.id, warehouseItemId: whsId || undefined } as any); } catch {}
          } else if (eq.sourceInvoiceId === inv.id) {
            const whsId = eq.warehouseItemId || ensureWhsItem(it, inv, whs);
            try {
              hal.updateEquip(eqId, {
                hallId: it.hallId || eq.hallId,
                zoneId: it.zoneId || '',
                count: it.quantity || 1,
                unitPrice: it.unitPrice || null,
                warranty: it.warrantyMonths || null,
                brand: it.brand || '',
                        model: it.model || '',
                name: it.description || it.model || eq.name,
                warehouseItemId: whsId || undefined,
              } as any);
            } catch (e) { console.error('[TRA→HAL own-update]', e); }
          }
        }
        continue;
      }
    
    // ۳. اگر دسته تجهیزات نیست → رد شو
    const itemCat = it.category || inv.category;
    if (itemCat !== 'equipment') continue;
    if (it.equipmentKind === 'consumable') continue;
    // asset بدون سالن → equipment ساخته نشه (تست: asset without hall)
    if (!it.hallId) continue;
    
    // ۴. بررسی تکراری: آیا قبلاً برای همین فاکتور ساخته شده؟
    const existing = hal.equipment.find(
      (e: any) => e.sourceInvoiceId === inv.id && e.name === (it.description || it.model || '')
    );
    
    const whsIdExisting = ensureWhsItem(it, inv, whs);

    if (existing) {
      // آپدیت تجهیز موجود
      try {
        hal.updateEquip(existing.id, {
            warehouseItemId: whsIdExisting || undefined,
          hallId: it.hallId,
          zoneId: it.zoneId || '',
          count: it.quantity || 1,
          unitPrice: it.unitPrice || null,
          warranty: it.warrantyMonths || null,
          brand: it.brand || '',
                                    model: it.model || '',
                      status: (it.equipmentStatus as any) || undefined,
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
        notes: `از فاکتور ${inv.number || ''}`,
        brand: it.brand || '',
        supplierId: inv.partyId || '',
        sourceInvoiceId: inv.id,
        warehouseItemId: whsIdExisting || undefined,
        model: it.model || '',
        status: (it.equipmentStatus as any) || 'active',
      } as any);
      it.equipmentId = newId;
      it.stockItemId = whsIdExisting || it.stockItemId;
    } catch (e) { console.error('[TRA→HAL create]', e); }
  }
  
  // 🆕 Orphan cleanup — remove Equipment no longer matched
  if (prev) {
    const activeEqIds = new Set(
      outItems.map((it: any) => it.equipmentId).filter(Boolean)
    );
    const orphans = hal.equipment.filter(
      (e: any) => e.sourceInvoiceId === inv.id && !activeEqIds.has(e.id)
    );
    for (const orphan of orphans) {
      try { hal.deleteEquip(orphan.id); } catch (e) { console.error('[TRA→HAL orphan]', e); }
    }
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
      if (it.existingFlockId) continue; // 🆕 اتصال دستی
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

  // 🆕 لینک کردن به گله‌های موجود بدون تغییر در تعداد
  if (inv.type === 'purchase') {
    for (let i = 0; i < outItems.length; i++) {
      const it = outItems[i];
      if (it.existingFlockId) {
        const f = flk.flocks.find(x => x.id === it.existingFlockId);
        if (f) {
          const patch: any = { sourceInvoiceId: inv.id };
          if (it.unitPrice) patch.purchasePrice = it.unitPrice;
          const transport = it.transportCost ?? it.shipping;
          if (transport) patch.deliveryCost = transport;
          const effDate = (inv as any).deliveryDate || inv.date || '';
          if (effDate) patch.purchaseDate = effDate;
          // 🆕 hatchDate sync (existingFlockId)
          if (it.hatchDate && it.hatchDate !== f.hatchDate) {
            patch.hatchDate = it.hatchDate;
          }
          // 🆕 hatchDate sync (existingFlockId)
          if (it.hatchDate && it.hatchDate !== f.hatchDate) {
            patch.hatchDate = it.hatchDate;
          }
          flk.update(it.existingFlockId, patch);
          it.flockId = it.existingFlockId;
        }
      }
    }
  }

  // 🆕 sync hatchDate/chickWeight حتی وقتی delta=0 (update case)
  if (inv.type === 'purchase') {
    for (const it2 of inv.items || []) {
      if (!it2.flockId) continue;
      if (!BIRD_CATS.includes(it2.category || inv.category)) continue;
      const f2 = flk.flocks.find(x => x.id === it2.flockId);
      if (!f2) continue;
      const patch2: any = {};
      if (it2.hatchDate && it2.hatchDate !== f2.hatchDate) patch2.hatchDate = it2.hatchDate;
      if (it2.chickWeight != null && it2.chickWeight !== f2.chickWeight) patch2.chickWeight = it2.chickWeight;
      if (Object.keys(patch2).length > 0) flk.update(it2.flockId, patch2);
    }
  }

  // 🆕 sync hatchDate/chickWeight حتی وقتی delta=0 (update case)
  if (inv.type === 'purchase') {
    for (const it2 of inv.items || []) {
      if (!it2.flockId) continue;
      if (!BIRD_CATS.includes(it2.category || inv.category)) continue;
      const f2 = flk.flocks.find(x => x.id === it2.flockId);
      if (!f2) continue;
      const patch2: any = {};
      if (it2.hatchDate && it2.hatchDate !== f2.hatchDate) patch2.hatchDate = it2.hatchDate;
      if (it2.chickWeight != null && it2.chickWeight !== f2.chickWeight) patch2.chickWeight = it2.chickWeight;
      if (Object.keys(patch2).length > 0) flk.update(it2.flockId, patch2);
    }
  }

  const prevMap = buildMap(prev);
  const newMap = buildMap(inv);
  const allKeys = new Set<string>([...prevMap.keys(), ...newMap.keys()]);
  const updatedFlockIds = new Set<string>(); // 🆕 فیکس Double Counting

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

      // 🆕 فاز ۱: تفکیک جنسیت
      const mDelta = Number(it.maleCount || 0);
      const fDelta = Number(it.femaleCount || 0);
      const uDelta = Number(it.unknownCount || 0);
      const gSum = mDelta + fDelta + uDelta;
      if (gSum > 0) {
        // 🆕 Normalize delta to prevent invariant break (gSum > delta)
        const safeM = Math.min(mDelta, delta);
        const safeF = Math.min(fDelta, Math.max(0, delta - safeM));
        const safeU = Math.min(uDelta, Math.max(0, delta - safeM - safeF));
        if (safeM > 0) patch.maleCount = Math.max(0, (f.maleCount ?? 0) + sign * safeM);
        if (safeF > 0) patch.femaleCount = Math.max(0, (f.femaleCount ?? 0) + sign * safeF);
        if (safeU > 0) patch.unknownCount = Math.max(0, (f.unknownCount ?? 0) + sign * safeU);
        const rem = delta - safeM - safeF - safeU;
        if (rem > 0) {
          const base = (safeU > 0) ? (patch.unknownCount ?? f.unknownCount ?? 0) : (f.unknownCount ?? 0);
          patch.unknownCount = Math.max(0, base + sign * rem);
        }
      } else {
        // 🆕 قدم ۵: unsplit — همه در unknown
        if (!f.genderSplitAt) {
          // گله unsplit → sync
          patch.unknownCount = next;
        } else {
          // گله split → از unknown با fallback
          const nextU = (f.unknownCount ?? 0) + sign * delta;
          if (nextU >= 0) {
            patch.unknownCount = nextU;
          } else {
            const rem = -nextU;
            patch.unknownCount = 0;
            const mF = f.maleCount ?? 0;
            const fF = f.femaleCount ?? 0;
            if (fF >= mF) {
              patch.femaleCount = Math.max(0, fF - rem);
            } else {
              patch.maleCount = Math.max(0, mF - rem);
            }
          }
        }
      }

      // 🆕 قدم ۵: set genderSplitAt اگه item جنس داره
      if (gSum > 0 && !f.genderSplitAt) {
        patch.genderSplitAt = new Date().toISOString();
      }
      // 🆕 قدم ۵: un-split اگه male و female صفر شدن
      if (f.genderSplitAt) {
        const finalM = patch.maleCount ?? f.maleCount ?? 0;
        const finalF = patch.femaleCount ?? f.femaleCount ?? 0;
        if (finalM === 0 && finalF === 0) {
          patch.genderSplitAt = null;
          patch.unknownCount = next;
        }
      }

      if (type === 'purchase') {
        patch.initialCount = Math.max(0, (f.initialCount ?? 0) + delta);
        if (delta > 0) {
          patch.sourceInvoiceId = inv.id;
          patch.sourceCategory = ref.cat;
          if (it.unitPrice) patch.purchasePrice = it.unitPrice;
          const transport = it.transportCost ?? it.shipping;
          if (transport) patch.deliveryCost = transport;
          if (effectiveDate) patch.purchaseDate = effectiveDate;
        }
      }
      // 🆕 hatchDate sync (explicitFlockId)
      if (inv.type === 'purchase' && it.hatchDate && it.hatchDate !== f.hatchDate) {
        patch.hatchDate = it.hatchDate;
      }
      // 🆕 hatchDate sync (explicitFlockId)
      if (inv.type === 'purchase' && it.hatchDate && it.hatchDate !== f.hatchDate) {
        patch.hatchDate = it.hatchDate;
      }
      flk.update(explicitFlockId, patch);
      updatedFlockIds.add(explicitFlockId);

      // 🆕 فیکس ۱: ثبت FlockEvent فروش در تاریخچه گله
      if (type === 'sale' && delta > 0) {
        try {
          const st = useFlk.getState();
          const evt = {
            id: `sell-${inv.id}-${explicitFlockId}-${Date.now()}`,
            flockId: explicitFlockId,
            date: effectiveDate,
            type: 'sell' as any,
            count: delta,
            sex: 'mixed' as any,
            direction: -1 as any,
            buyerId: inv.partyId,
            unitPrice: it.unitPrice,
            totalPrice: it.total,
            invoiceId: inv.id,
            notes: `فروش از فاکتور ${inv.number || ''}`,
            createdAt: new Date().toISOString(),
          };
          useFlk.setState({
            flocks: st.flocks.map((ff: any) =>
              ff.id === explicitFlockId
                ? { ...ff, events: [...(ff.events || []), evt], updatedAt: new Date().toISOString() }
                : ff
            ),
          } as any);
        } catch (e) {
          console.error('[applyInvoiceFlocks] sell event failed:', e);
        }
      }

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
        const patchEx: any = { currentCount: Math.max(0, next) };
        const mD = Number(it.maleCount || 0);
        const fD = Number(it.femaleCount || 0);
        const uD = Number(it.unknownCount || 0);
        const gS = mD + fD + uD;
        if (gS > 0) {
          if (mD > 0) patchEx.maleCount = Math.max(0, (existing.maleCount ?? 0) + mD);
          if (fD > 0) patchEx.femaleCount = Math.max(0, (existing.femaleCount ?? 0) + fD);
          if (uD > 0) patchEx.unknownCount = Math.max(0, (existing.unknownCount ?? 0) + uD);
          const rem = delta - gS;
          if (rem > 0) {
            const base = (uD > 0) ? (patchEx.unknownCount ?? existing.unknownCount ?? 0) : (existing.unknownCount ?? 0);
            patchEx.unknownCount = Math.max(0, base + rem);
          }
        } else {
          // 🆕 قدم ۵
          if (!existing.genderSplitAt) {
            patchEx.unknownCount = next;
          } else {
            const nextU = (existing.unknownCount ?? 0) + delta;
            if (nextU >= 0) {
              patchEx.unknownCount = nextU;
            } else {
              const rem = -nextU;
              patchEx.unknownCount = 0;
              const mE = existing.maleCount ?? 0;
              const fE = existing.femaleCount ?? 0;
              if (fE >= mE) {
                patchEx.femaleCount = Math.max(0, fE - rem);
              } else {
                patchEx.maleCount = Math.max(0, mE - rem);
              }
            }
          }
        }
        // 🆕 قدم ۵: set genderSplitAt
        if (gS > 0 && !existing.genderSplitAt) {
          patchEx.genderSplitAt = new Date().toISOString();
        }
        if (existing.genderSplitAt) {
          const fm = patchEx.maleCount ?? existing.maleCount ?? 0;
          const ff = patchEx.femaleCount ?? existing.femaleCount ?? 0;
          if (fm === 0 && ff === 0) {
            patchEx.genderSplitAt = null;
            patchEx.unknownCount = Math.max(0, next);
          }
        }
        flk.update(existing.id, patchEx);
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

        const hasGenderSplit = ((it.maleCount || 0) + (it.femaleCount || 0) + (it.unknownCount || 0)) > 0;
        const newFlockId = flk.add({
          name: it.flockName || it.description || name,
          type: inferredType,
          birdId: birdId,
          breedId: breedId,
          hallId: it.hallId || '',
          zoneId: it.zoneId || '',
          initialCount: delta,
          currentCount: delta,
          maleCount: hasGenderSplit ? (it.maleCount ?? null) : null,
          femaleCount: hasGenderSplit ? (it.femaleCount ?? null) : null,
          unknownCount: hasGenderSplit ? (it.unknownCount ?? null) : delta,
          layingStartDay: biology?.layingStartDay ?? 0,
          endOfCycleDay: biology?.endOfCycleDay ?? null,
          vaccineScheduleId: '',
          hatchDate: it.hatchDate || computeHatchDate(effectiveDate, it.ageDays),
          purchaseDate: effectiveDate,
          startDate: effectiveDate,
          source: 'purchase',
          dealType: 'own',
          purchasePrice: it.unitPrice || 0,
          deliveryCost: (typeof it.transportCost === 'number' && it.transportCost > 0) ? it.transportCost : (typeof it.shipping === 'number' && it.shipping > 0 ? it.shipping : 0),
          otherCosts: 0,
          status: 'active',
          notes: `از فاکتور ${inv.number || ''}`,
          sourceInvoiceId: inv.id,
          sourceCategory: ref.cat,
          chickWeight: it.chickWeight ?? null,
        });

        for (let i = 0; i < inv.items.length; i++) {
          if (keyOf(inv.items[i].category || inv.category, inv.items[i]) === k) outItems[i].flockId = newFlockId;
        }
      }
    }
  }


  // 🆕 محاسبه delta برای گله‌های موجود (existingFlockId)
  if (inv.type === 'purchase') {
    const buildExistingMap = (inv2: Invoice | undefined): Map<string, number> => {
      const mm = new Map<string, number>();
      if (!inv2) return mm;
      for (const it of inv2.items || []) {
        // 🆕 فیکس Double Counting: هر دو فیلد را چک کن
        const targetFlockId = it.existingFlockId || it.flockId;
        if (!targetFlockId) continue;
        const cat = it.category || inv2.category;
        if (!BIRD_CATS.includes(cat)) continue;
        // 🆕 اگر فاکتور قبلی flockId خودکار داشته، فقط اگر گله هنوز به همین فاکتور وصل است آن را حساب کن
        if (!it.existingFlockId && it.flockId) {
          const flock = useFlk.getState().flocks.find(f => f.id === it.flockId);
          if (flock && flock.sourceInvoiceId !== inv2.id) continue;
        }
        const qty = (it.healthyCount ?? it.quantity) || 0;
        mm.set(targetFlockId, (mm.get(targetFlockId) || 0) + qty);
      }
      return mm;
    };
    const prevEx = buildExistingMap(prev);
    const newEx = buildExistingMap(inv);
    const allExIds = new Set<string>([...prevEx.keys(), ...newEx.keys()]);
    for (const flockId of allExIds) {
      const pq = prevEx.get(flockId) || 0;
      const nq = newEx.get(flockId) || 0;
      const delta = nq - pq;
      if (delta === 0) continue;
      const f = flk.flocks.find((x: any) => x.id === flockId);
      if (!f) continue;
      const patch4: any = {
        initialCount: Math.max(0, (f.initialCount ?? 0) + delta),
      };
      // 🆕 فیکس Double Counting: currentCount فقط اگه قبلاً آپدیت نشده
      if (!updatedFlockIds.has(flockId)) {
        patch4.currentCount = Math.max(0, (f.currentCount ?? 0) + delta);
      }
      const sampleItem = (inv.items || []).find((it2: any) => it2.existingFlockId === flockId);
      if (sampleItem) {
        const mD = Number(sampleItem.maleCount || 0);
        const fD = Number(sampleItem.femaleCount || 0);
        const uD = Number(sampleItem.unknownCount || 0);
        const gS = mD + fD + uD;
        if (gS > 0) {
          if (mD > 0) patch4.maleCount = Math.max(0, (f.maleCount ?? 0) + mD);
          if (fD > 0) patch4.femaleCount = Math.max(0, (f.femaleCount ?? 0) + fD);
          if (uD > 0) patch4.unknownCount = Math.max(0, (f.unknownCount ?? 0) + uD);
          const rem = delta - gS;
          if (rem > 0) {
            const base = (uD > 0) ? (patch4.unknownCount ?? f.unknownCount ?? 0) : (f.unknownCount ?? 0);
            patch4.unknownCount = Math.max(0, base + rem);
          }
        } else {
          patch4.unknownCount = Math.max(0, (f.unknownCount ?? 0) + delta);
        }
      }
      flk.update(flockId, patch4);
    }
  }

  return outItems;
}

