import { useMemo, useDeferredValue } from 'react';
import { useLocation } from 'react-router-dom';
import { useFlk } from '../../mod/flk/store';
import { useBrd } from '../../mod/brd/store';
import { useHal } from '../../mod/hal/store';
import { useWhs } from '../../mod/whs/store';
import { useTra } from '../../mod/tra/store';
import { useCtc } from '../../mod/ctc/store';
import { useAlt } from '../../mod/alt/store';
import { useFed } from '../../mod/fed/store';
import { useInc } from '../../mod/inc/store';
import { useEgg } from '../../mod/egg/store';
import { useDlg } from '../../mod/dlg/store';
import { SOURCES, PRIORITY, normalize, hit, type SearchHit, type GroupedResult } from './config';

interface InternalHit extends SearchHit { _fields: (string | number | undefined | null)[]; }

function mk(id: string, sid: string, title: string, sub: string | undefined,
           fields: (string | number | undefined | null)[]): InternalHit {
  return { id, sourceId: sid, title, sub: sub || undefined, _fields: fields };
}

function pick(hits: InternalHit[], q: string): InternalHit[] {
  return hits.filter(h => hit(h._fields, q));
}

export function useGlobalSearch(query: string): GroupedResult[] {
  // ⭐ Apple-style: تایپ آزاد، نتایج با تأخیر نرم
  const deferredQuery = useDeferredValue(query);
  const location = useLocation();

  const flocks      = useFlk(s => s.flocks);
  const birds       = useBrd(s => s.birds);
  const breeds      = useBrd(s => s.breeds);
  const halls       = useHal(s => s.halls);
  const items       = useWhs(s => s.items);
  const invoices    = useTra(s => s.invoices);
  const deals       = useTra(s => s.deals);
  const contacts    = useCtc(s => s.contacts);
  const alerts      = useAlt(s => s.alerts);
  const ingredients = useFed(s => s.ingredients);
  const formulas    = useFed(s => s.formulas);
  const devices     = useInc(s => s.devices);
  const productions = useEgg(s => s.productions);
  const eggSales    = useEgg(s => s.sales);
  const logs        = useDlg(s => s.logs);

  return useMemo(() => {
    // ⭐ مسیر رو تازه از window.location بخون — ناوبری سریع پشتیبانی می‌شه
    const path = (typeof window !== 'undefined' && window.location?.pathname)
      ? window.location.pathname
      : location.pathname;
    const currentModule = (path.split('/')[1] || '').toLowerCase();

    const q = normalize(deferredQuery);
    if (q.length < 2) return [];

    // نگاشت‌های cross-reference
    const birdMap  = new Map((birds  || []).map(b => [b.id, b.name]));
    const breedMap = new Map((breeds || []).map(b => [b.id, b.name]));
    const hallMap  = new Map((halls  || []).map(h => [h.id, h.name]));
    const partyMap = new Map((contacts || []).map(p => [p.id, p.name]));
    const itemMap  = new Map((items  || []).map(i => [i.id, i.name]));

    const buckets: Record<string, InternalHit[]> = {
      flk: (flocks || []).filter(f => f.status !== 'archived' && f.status !== 'sold')
        .map(f => mk(f.id, 'flk', f.name,
          [birdMap.get(f.birdId), breedMap.get(f.breedId), hallMap.get(f.hallId)].filter(Boolean).join(' • '),
          [f.name, f.notes, f.source, birdMap.get(f.birdId), breedMap.get(f.breedId), hallMap.get(f.hallId),
           f.type === 'layer' ? 'تخم‌گذار' : f.type === 'broiler' ? 'گوشتی' : 'مادر',
           f.initialCount, f.currentCount, f.hatchDate, f.purchaseDate, f.startDate,
           f.archivedReason, f.purchasePrice])),

      arc: (flocks || []).filter(f => f.status === 'archived' || f.status === 'sold')
        .map(f => mk(f.id, 'arc', f.name, f.archivedReason || 'آرشیو',
          [f.name, f.notes, f.archivedReason])),

      hal: (halls || []).map(h => mk(h.id, 'hal', h.name, h.code || h.address || '',
        [h.name, h.code, h.address, h.notes, h.systemNotes, h.ventilationSystem,
         h.feederType, h.drinkerType, h.litterType, h.capacity, h.targetTemp, h.targetHumidity,
         h.builtAt, h.lastSanitizedAt])),

      ctc: (contacts || []).map(p => mk(p.id, 'ctc', p.name,
        [p.phone, p.city].filter(Boolean).join(' • '),
        [p.name, p.phone, p.phone2, p.city, p.nationalId, p.email, p.notes,
         p.position, p.address, ...(p.roles || []),
         p.roles?.includes('customer') ? 'مشتری' : '',
         p.roles?.includes('supplier') ? 'تأمین‌کننده' : '',
         p.roles?.includes('worker') ? 'کارمند' : '',
         ...(p.customerTypes || []), ...(p.supplierTypes || [])])),

      whs: (items || []).map(it => mk(it.id, 'whs', it.name,
        [it.storage].filter(Boolean).join(' • '),
        [it.name, it.notes, it.storage, it.category, it.unit,
         partyMap.get(it.supplierId), it.currentStock, it.lastPrice, it.minStock,
         it.expireDate, it.productionDate, it.purchaseDate, it.hallId])),

      tra: [
        ...(invoices || []).map(inv => mk(inv.id, 'tra',
          'فاکتور \u200F' + (inv.number || '—') + '\u200F',
          [partyMap.get(inv.partyId), inv.category].filter(Boolean).join(' • '),
          [inv.number, inv.notes, inv.category, partyMap.get(inv.partyId),
           inv.total, inv.date, inv.dueDate, inv.workflowStatus,
           ...(inv.items || []).map((x: any) => itemMap.get(x.itemId) || x.name || '')])),
        ...(deals || []).map(d => mk(d.id, 'tra', 'معامله ' + (partyMap.get(d.partyId) || ''),
          d.description,
          [d.description, d.notes, partyMap.get(d.partyId), d.type])),
      ],

      egg: [
        ...(productions || []).map(p => mk(p.id, 'egg', 'تولید ' + p.date, p.notes,
          [p.notes, p.date])),
        ...(eggSales || []).map(s => mk(s.id, 'egg', 'فروش ' + s.date,
          partyMap.get(s.customerId) || '', [s.notes, s.date, partyMap.get(s.customerId)])),
      ],

      inc: (devices || []).map(d => mk(d.id, 'inc', d.name, d.notes || d.code || '',
        [d.name, d.notes, d.code, d.mode, d.status])),

      dlg: (logs || []).map(l => mk(l.id, 'dlg', 'ثبت ' + l.date,
        [hallMap.get((flocks || []).find(f => f.id === l.flockId)?.hallId || ''),
         l.notes].filter(Boolean).join(' • '),
        [l.notes, l.feedType, l.ventilation, l.behavior, l.sound,
         ...(l.vaccines || []).map(v => v.name),
         ...(l.medications || []).map(m => m.name),
         ...(l.activities || []).map((a: any) => a.name || a.title || '')])),

      fed: [
        ...(ingredients || []).map(i => mk(i.id, 'fed', i.name, 'ماده', [i.name, i.notes, i.category])),
        ...(formulas || []).map(f => mk(f.id, 'fed', f.name, 'فرمول', [f.name, f.notes, f.status])),
      ],

      alt: (alerts || []).map(a => mk(a.id, 'alt', a.title, a.message,
        [a.title, a.message, a.notes, a.category, a.source])),

      brd: [
        ...(birds || []).map(b => mk(b.id, 'brd', b.name, 'پرنده', [b.name])),
        ...(breeds || []).map(b => mk(b.id, 'brd', b.name, 'نژاد', [b.name])),
      ],
    };

    // اگر در ماژول خاصی هستیم، اولویتش رو جلو ببر
    let order = [...PRIORITY];
    if (currentModule && order.includes(currentModule)) {
      order = [currentModule, ...order.filter(x => x !== currentModule)];
    }

    const groups: GroupedResult[] = [];
    for (const sid of order) {
      const picked = pick(buckets[sid] || [], q);
      if (picked.length === 0) continue;
      const source = SOURCES.find(s => s.id === sid);
      if (!source) continue;
      groups.push({
        source,
        hits: picked.map(({ id, sourceId, title, sub }) => ({ id, sourceId, title, sub })),
      });
    }
    return groups;
  }, [deferredQuery, location.pathname, location.key,
      flocks, birds, breeds, halls, items, invoices, deals,
      contacts, alerts, ingredients, formulas, devices, productions, eggSales, logs]);
}
