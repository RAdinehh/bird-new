import ProgressTracker from '../../shr/components/ProgressTracker';
import { useState, useMemo, useEffect } from 'react';
import {
  useInc, DEAL_LABEL, ENTRY_STATUS_LABEL, addDaysJalali,
  daysAgo, daysToHatch, isLockdown, isHatchWindow,
  incubationDays, type EggEntry, type DealType
} from './store';
import { useBrd } from '../brd/store';
import { useFlk } from '../flk/store';
import { useCtc } from '../ctc/store';
import { useTra } from '../tra/store';
import { useEgg } from '../egg/store';
import { Btn, BtnRow, Empty, Field, Grid2, Input, Modal, MoneyField, NumField, PageContainer, SectionTitle, Select, Tag } from '../../shr/components/ui';
import ExpandableCard from '../../shr/components/ExpandableCard';
import DatePicker from '../../shr/components/DatePicker';
import { toFa, toEn } from '../../shr/utils/fa';
import { clampPercent, complement } from '../../shr/utils/smart';
import { showAlert } from '../../cor/store/dialog';
import SmartSelect from '../../shr/components/SmartSelect';

const DRAFT_KEY = (devId: string) => 'pm-inc-egg-draft-' + devId;

interface DraftRow {
  _id: string;
  dealType: DealType;
  birdId: string;
  breedId: string;
  flockId: string;
  count: string;
  trayNumbers: string;
  unitPrice: string;
  shippingCost: string;
  entryDate: string;
  notes: string;
  dealData: Record<string, string>;
  dealStatus: 'active' | 'withdrawn';
  dealWithdrawnAt: string;
  dealWithdrawnReason: string;
}

const makeRow = (): DraftRow => ({
  _id: 'r-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6),
  dealType: 'own',
  birdId: '',
  breedId: '',
  flockId: '',
  count: '',
  trayNumbers: '',
  unitPrice: '',
  shippingCost: '',
  entryDate: '',
  notes: '',
  dealData: {},
  dealStatus: 'active',
  dealWithdrawnAt: '',
  dealWithdrawnReason: '',
});

function calcDeviceUsage(
  device: any,
  entries: any[],
  newEntry?: { birdName: string; count: number }
): { used: number; total: number; percent: number } {
  const caps: any[] = device?.capacityByBird || [];
  if (caps.length === 0) return { used: 0, total: 0, percent: 0 };
  const refCap = Math.max(...caps.map(c => c.capacity || 0));
  if (refCap === 0) return { used: 0, total: 0, percent: 0 };
  const byBird: Record<string, number> = {};
  caps.forEach(c => {
    if (!c.birdName) return;
    const factor = (c.capacity && c.capacity > 0) ? (refCap / c.capacity) : 1;
    byBird[c.birdName] = factor;
  });
  let used = 0;
  entries.forEach(e => {
    if (e.status === 'failed') return;
    const factor = byBird[e.__birdName || ''];
    if (!factor) return;
    used += (e.count || 0) * factor;
  });
  if (newEntry) {
    const factor = byBird[newEntry.birdName];
    if (factor) used += newEntry.count * factor;
  }
  return {
    used: Math.round(used * 10) / 10,
    total: refCap,
    percent: Math.round((used / refCap) * 100),
  };
}

export default function EggEntriesPage({ initialDevice = '', onGoTo }: { initialDevice?: string; onGoTo?: (t: any) => void } = {}) {
  const { devices, eggEntries, candlings, hatches, addEntry, updateEntry, deleteEntry } = useInc();
  const { birds, breeds } = useBrd();
  const { flocks } = useFlk();
  const { contacts } = useCtc();
  const { addInvoice, deleteInvoice } = useTra();
  const { addProduction, deleteProduction } = useEgg();

  const [open, setOpen] = useState(false);
  const [delId, setDelId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [filterDev, setFilterDev] = useState('');
  const [filterSource, setFilterSource] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [q, setQ] = useState('');

  // ═══ Bulk mode state ═══
  const [multiDeviceId, setMultiDeviceId] = useState('');
  const [draftRows, setDraftRows] = useState<DraftRow[]>([]);
  const [currentRow, setCurrentRow] = useState<DraftRow>(() => makeRow());
  const [editingRowId, setEditingRowId] = useState<string | null>(null);

  // ═══ Draft Auto-Load when device changes ═══
  useEffect(() => {
    if (!open || !multiDeviceId) return;
    try {
      const saved = localStorage.getItem(DRAFT_KEY(multiDeviceId));
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) setDraftRows(parsed);
      } else {
        setDraftRows([]);
      }
    } catch {}
    setCurrentRow(makeRow());
    setEditingRowId(null);
  }, [open, multiDeviceId]);

  // ═══ Draft Auto-Save ═══
  useEffect(() => {
    if (!open || !multiDeviceId) return;
    try {
      if (draftRows.length === 0) localStorage.removeItem(DRAFT_KEY(multiDeviceId));
      else localStorage.setItem(DRAFT_KEY(multiDeviceId), JSON.stringify(draftRows));
    } catch {}
  }, [draftRows, open, multiDeviceId]);

  const suppliers = useMemo(() => (contacts || []).filter((p: any) => (p.roles || []).includes('supplier')), [contacts]);
  const allPersons = contacts || [];

  const openMulti = () => {
    if (devices.length === 0) { showAlert('اول یک دستگاه بسازید'); return; }
    if (birds.length === 0) { showAlert('اول پرنده بسازید'); return; }
    setMultiDeviceId(initialDevice || devices[0].id);
    setDraftRows([]);
    setCurrentRow({ ...makeRow(), birdId: birds[0].id, entryDate: todayJalali() });
    setEditingRowId(null);
    setOpen(true);
  };

  const setD = (k: string, v: string) => setCurrentRow(f => ({ ...f, dealData: { ...f.dealData, [k]: v } }));
  const num = (s: string) => s ? parseFloat(toEn(s).replace('٫', '.')) || null : null;
  const int = (s: string) => s ? parseInt(toEn(s)) || null : null;

  const addRowToList = () => {
    if (!currentRow.count.trim()) { showAlert('تعداد تخم اجباری است'); return; }
    if (!currentRow.entryDate.trim()) { showAlert('تاریخ ورود اجباری است'); return; }
    if (currentRow.dealType === 'purchase' && !currentRow.dealData.sellerId) { showAlert('فروشنده اجباری است'); return; }
    if (currentRow.dealType === 'partnership' && !currentRow.dealData.partnerId) { showAlert('شریک اجباری است'); return; }
    if (currentRow.dealType === 'own' && !currentRow.flockId) { showAlert('گله اجباری است'); return; }

    if (editingRowId) {
      setDraftRows(rows => rows.map(r => r._id === editingRowId ? { ...currentRow, _id: editingRowId } : r));
      setEditingRowId(null);
    } else {
      setDraftRows(rows => [...rows, currentRow]);
    }
    setCurrentRow({ ...makeRow(), birdId: currentRow.birdId, entryDate: currentRow.entryDate });
  };

  const editRow = (row: DraftRow) => {
    setCurrentRow({ ...row });
    setEditingRowId(row._id);
  };

  const removeRow = (id: string) => {
    if (!confirm('حذف این ردیف؟')) return;
    setDraftRows(rows => rows.filter(r => r._id !== id));
    if (editingRowId === id) { setCurrentRow(makeRow()); setEditingRowId(null); }
  };

  const saveAll = () => {
    if (draftRows.length === 0) { showAlert('حداقل یک ردیف اضافه کنید'); return; }
    const device = devices.find(d => d.id === multiDeviceId);
    if (!device) return;

    let savedCount = 0;
    draftRows.forEach(row => {
      try {
        const bird = birds.find(b => b.id === row.birdId);
        const birdName = bird?.name || 'مرغ';
        const expectedHatchDate = addDaysJalali(row.entryDate, incubationDays(birdName));
        const dealData: Record<string, any> = {};
        for (const [k, v] of Object.entries(row.dealData)) {
          const n = parseFloat(toEn(v).replace('٫', '.'));
          dealData[k] = !isNaN(n) && String(n) === toEn(v).replace('٫', '.') ? n : v;
        }
        const count = int(row.count);
        const unitPrice = num(row.unitPrice);
        const shippingCost = num(row.shippingCost);
        const data = {
          deviceId: multiDeviceId,
          hatchGroupId: '',
          birdId: row.birdId,
          breedId: row.breedId,
          count,
          entryDate: row.entryDate,
          expectedHatchDate,
          source: row.dealType === 'own' ? 'own' : 'external',
          dealType: row.dealType,
          dealStatus: row.dealStatus,
          dealWithdrawnAt: row.dealWithdrawnAt,
          dealWithdrawnReason: row.dealWithdrawnReason,
          dealData,
          flockId: row.flockId,
          trayNumbers: row.trayNumbers.trim(),
          unitPrice,
          totalPrice: count && unitPrice ? count * unitPrice : null,
          shippingCost,
          status: 'incubating' as const,
          notes: row.notes.trim(),
          generatedInvoiceId: '',
          generatedProductionId: '',
        };
        const newId = addEntry(data as any);

        // ═══ اتصالات خودکار ═══
        const refIds: any = {};
        try {
          if (row.dealType === 'purchase' && row.dealData.sellerId) {
            const totalAmount = ((count || 0) * (unitPrice || 0)) + (shippingCost || 0);
            if (totalAmount > 0) {
              const invId = addInvoice({
                type: 'purchase', date: row.entryDate, partyId: row.dealData.sellerId, category: 'egg',
                items: [{ id: 'egg-' + Date.now(), name: 'تخم نطفه‌دار', quantity: count || 0, unit: 'عدد', unitPrice: unitPrice || 0, total: (count || 0) * (unitPrice || 0) }],
                total: totalAmount, payments: [], dueDate: row.entryDate,
                relatedFlockId: '', relatedEntryId: newId, notes: 'خرید تخم — ' + (device.name || ''),
              } as any);
              refIds.generatedInvoiceId = invId || '';
            }
          } else if (row.dealType === 'own' && row.flockId) {
            const prodId = addProduction({
              flockId: row.flockId, date: row.entryDate, totalCount: count || 0,
              brokenCount: 0, softCount: 0, dirtyCount: 0, avgWeight: null,
              notes: 'ورودی به جوجه‌کشی — ' + (device.name || ''),
            } as any);
            refIds.generatedProductionId = prodId || '';
          } else if (row.dealType === 'rent' && row.dealData.lessorId && row.dealData.rentAmount) {
            const rentAmount = parseFloat(toEn(row.dealData.rentAmount).replace('٫', '.')) || 0;
            if (rentAmount > 0) {
              const invId = addInvoice({
                type: 'purchase', date: row.entryDate, partyId: row.dealData.lessorId, category: 'service',
                items: [{ id: 'rent-' + Date.now(), name: 'اجاره دستگاه', quantity: 1, unit: 'خدمت', unitPrice: rentAmount, total: rentAmount }],
                total: rentAmount, payments: [], dueDate: row.dealData.rentDueDate || row.entryDate,
                relatedFlockId: '', relatedEntryId: newId, notes: 'اجاره — ' + (device.name || ''),
              } as any);
              refIds.generatedInvoiceId = invId || '';
            }
          }
        } catch {}
        if (newId && (refIds.generatedInvoiceId || refIds.generatedProductionId)) {
          updateEntry(newId, refIds);
        }
        savedCount++;
      } catch (err) {}
    });

    // پاک کردن draft
    try { localStorage.removeItem(DRAFT_KEY(multiDeviceId)); } catch {}
    setDraftRows([]);
    setOpen(false);
    showAlert(savedCount + ' ورودی ثبت شد', '✅ موفق');
    if (onGoTo && confirm('به کندلینگ برو؟')) {
      setTimeout(() => onGoTo('candlings'), 100);
    }
  };

  const openEdit = (e: EggEntry) => {
    const row: DraftRow = {
      _id: e.id,
      dealType: e.dealType,
      birdId: e.birdId,
      breedId: e.breedId,
      flockId: (e as any).flockId || '',
      count: e.count ? toFa(e.count) : '',
      trayNumbers: e.trayNumbers,
      unitPrice: e.unitPrice ? toFa(e.unitPrice) : '',
      shippingCost: (e as any).shippingCost ? toFa((e as any).shippingCost) : '',
      entryDate: e.entryDate,
      notes: e.notes,
      dealData: Object.fromEntries(Object.entries(e.dealData || {}).map(([k, v]) => [k, v == null ? '' : String(v)])),
      dealStatus: (e as any).dealStatus || 'active',
      dealWithdrawnAt: (e as any).dealWithdrawnAt || '',
      dealWithdrawnReason: (e as any).dealWithdrawnReason || '',
    };
    setMultiDeviceId(e.deviceId);
    setDraftRows([row]);
    setCurrentRow(row);
    setEditingRowId(row._id);
    setOpen(true);
  };

  const deleteEntryWithCascade = (id: string) => {
    const entry = eggEntries.find(e => e.id === id) as any;
    if (!entry) return;
    let delInv = false, delProd = false;
    if (entry.generatedInvoiceId) {
      delInv = confirm('این ورودی یک فاکتور در معاملات ساخته.\nتایید: فاکتور هم حذف شود\nلغو: فقط ورودی حذف شود');
    }
    if (entry.generatedProductionId) {
      delProd = confirm('این ورودی یک رکورد تولید تخم ساخته.\nتایید: آن هم حذف شود\nلغو: فقط ورودی حذف شود');
    }
    if (delInv && entry.generatedInvoiceId) { try { deleteInvoice(entry.generatedInvoiceId); } catch {} }
    if (delProd && entry.generatedProductionId) { try { deleteProduction(entry.generatedProductionId); } catch {} }
    deleteEntry(id);
    setDelId(null);
  };

  const breedsForBird = breeds.filter(b => b.birdId === currentRow.birdId);

  // ═══ محاسبه استفاده دستگاه در فرم ═══
  const draftUsage = useMemo(() => {
    const device = devices.find(d => d.id === multiDeviceId);
    if (!device) return { used: 0, total: 0, percent: 0 };
    const allEntries = eggEntries.map(x => ({ ...x, __birdName: (birds.find(b => b.id === x.birdId)?.name) || '' }));
    let used = 0;
    const refCap = Math.max(...(device.capacityByBird || []).map((c: any) => c.capacity || 0));
    if (refCap === 0) return { used: 0, total: 0, percent: 0 };
    // فعلی
    allEntries.forEach(e => {
      if (e.status === 'failed') return;
      const cap = (device.capacityByBird || []).find((c: any) => c.birdName === e.__birdName);
      if (!cap?.capacity) return;
      used += (e.count || 0) * (refCap / cap.capacity);
    });
    // draft
    draftRows.forEach(r => {
      const bird = birds.find(b => b.id === r.birdId);
      if (!bird) return;
      const cap = (device.capacityByBird || []).find((c: any) => c.birdName === bird.name);
      if (!cap?.capacity) return;
      used += (parseInt(toEn(r.count)) || 0) * (refCap / cap.capacity);
    });
    return {
      used: Math.round(used * 10) / 10,
      total: refCap,
      percent: Math.round((used / refCap) * 100),
    };
  }, [multiDeviceId, draftRows, eggEntries, birds, devices]);

  // ═══ فیلتر لیست ═══
  const list = useMemo(() => {
    return eggEntries.filter(e => {
      if (filterDev && e.deviceId !== filterDev) return false;
      if (filterSource && e.dealType !== filterSource) return false;
      if (filterStatus && e.status !== filterStatus) return false;
      if (q.trim()) {
        const t = q.trim().toLowerCase();
        const dev = devices.find(d => d.id === e.deviceId);
        const bird = birds.find(b => b.id === e.birdId);
        const partnerName = (e.dealData?.partnerId && (contacts.find((c: any) => c.id === e.dealData.partnerId) as any)?.name) || e.dealData?.partnerName || '';
        const sellerName = (e.dealData?.sellerId && (contacts.find((c: any) => c.id === e.dealData.sellerId) as any)?.name) || e.dealData?.sellerName || '';
        const haystack = [dev?.name, bird?.name, partnerName, sellerName, e.trayNumbers, e.notes].filter(Boolean).join(' ').toLowerCase();
        if (!haystack.includes(t)) return false;
      }
      return true;
    });
  }, [eggEntries, filterDev, filterSource, filterStatus, q, devices, birds, contacts]);

  const target = delId ? eggEntries.find(e => e.id === delId) : null;
  const multiDevice = devices.find(d => d.id === multiDeviceId);

  const renderRowSummary = (row: DraftRow, idx: number) => {
    const bird = birds.find(b => b.id === row.birdId);
    const sellerName = (row.dealData.sellerId && (contacts.find((c: any) => c.id === row.dealData.sellerId) as any)?.name) || '';
    const partnerName = (row.dealData.partnerId && (contacts.find((c: any) => c.id === row.dealData.partnerId) as any)?.name) || '';
    const flockName = row.flockId ? flocks.find((f: any) => f.id === row.flockId)?.name : '';
    const consigneeName = (row.dealData.consigneeId && (contacts.find((c: any) => c.id === row.dealData.consigneeId) as any)?.name) || '';
    const lessorName = (row.dealData.lessorId && (contacts.find((c: any) => c.id === row.dealData.lessorId) as any)?.name) || '';
    const party = sellerName || partnerName || flockName || consigneeName || lessorName || '—';

    return (
      <div key={row._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 6, padding: '8px 10px', background: 'var(--input-bg)', borderRadius: 'var(--r-sm)', marginBottom: 4 }}>
        <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0 }}>
          <span style={{ fontSize: 'var(--fs-sm)', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {toFa(idx + 1)}. {DEAL_LABEL[row.dealType]} · {bird?.name || '—'} · {toFa(row.count || 0)} تخم
          </span>
          <span style={{ fontSize: 'var(--fs-xs)', color: 'var(--muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {party} · {toFa(row.entryDate)}
          </span>
        </div>
        <button type="button" onClick={() => editRow(row)} style={{ background: 'none', border: '1px solid var(--border)', borderRadius: 'var(--r-sm)', color: 'var(--accent)', cursor: 'pointer', fontFamily: 'inherit', fontSize: 12, padding: '2px 6px' }}>✏️</button>
        <button type="button" onClick={() => removeRow(row._id)} style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer', fontFamily: 'inherit', fontSize: 14, padding: 2 }}>✕</button>
      </div>
    );
  };

  return (
    <PageContainer>
      {devices.length > 0 && eggEntries.length > 0 && (
        <>
          <Input value={q} onChange={e => setQ(e.target.value)} placeholder="🔍 جستجو (گله، فروشنده، شریک، یادداشت...)" />
          <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 4 }}>
            <button onClick={() => { setFilterDev(''); setFilterSource(''); setFilterStatus(''); }} style={chip(!filterDev && !filterSource && !filterStatus)}>همه</button>
            {devices.map(d => (
              <button key={d.id} onClick={() => setFilterDev(filterDev === d.id ? '' : d.id)} style={chip(filterDev === d.id)}>{d.name}</button>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 4 }}>
            <span style={{ color: 'var(--muted)', alignSelf: 'center', fontSize: 'var(--fs-xs)' }}>منبع:</span>
            {[
              { id: 'own', label: '🏠 خودم' },
              { id: 'purchase', label: '📥 خریداری' },
              { id: 'partnership', label: '🤝 شراکتی' },
              { id: 'rent', label: '🏢 اجاره' },
              { id: 'consignment', label: '📦 امانی' },
            ].map(src => (
              <button key={src.id} onClick={() => setFilterSource(filterSource === src.id ? '' : src.id)} style={chip(filterSource === src.id)}>{src.label}</button>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 4 }}>
            <span style={{ color: 'var(--muted)', alignSelf: 'center', fontSize: 'var(--fs-xs)' }}>وضعیت:</span>
            {[
              { id: 'incubating', label: 'در انکوباسیون' },
              { id: 'candled', label: 'کندل‌شده' },
              { id: 'locked', label: 'Lock-down' },
              { id: 'hatched', label: 'هچ‌شده' },
              { id: 'failed', label: 'ناموفق' },
            ].map(st => (
              <button key={st.id} onClick={() => setFilterStatus(filterStatus === st.id ? '' : st.id)} style={chip(filterStatus === st.id)}>{st.label}</button>
            ))}
          </div>
        </>
      )}

      {list.length === 0 ? (
        <Empty icon={<svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><ellipse cx="12" cy="14" rx="7" ry="9"/></svg>}
          title={eggEntries.length === 0 ? 'هنوز تخمی وارد دستگاه نشده' : 'ورودی مطابق فیلتر نیست'}
          desc={devices.length === 0 ? 'اول یک دستگاه بسازید.' : 'اولین بچ خود را ثبت کنید.'}
          action={<Btn variant="primary" onClick={openMulti}>+ ورود تخم</Btn>} />
      ) : (
        <>
          {list.map((e, i) => {
            const dev = devices.find(d => d.id === e.deviceId);
            const bird = birds.find(b => b.id === e.birdId);
            const breed = breeds.find(b => b.id === e.breedId);
            const age = daysAgo(e.entryDate);
            const remain = daysToHatch(e.expectedHatchDate);
            const locked = isLockdown(e);
            const hatchWindow = isHatchWindow(e);
            const myHatch = hatches.find(h => h.eggEntryId === e.id);
            const isOpen = expandedId === e.id;

            let accent: any = 'accent';
            if (hatchWindow) accent = 'purple';
            else if (locked) accent = 'warn';

            let statusLabel = ENTRY_STATUS_LABEL[e.status];
            let statusTone: any = 'green';
            if (hatchWindow) { statusLabel = 'پنجره هچ'; statusTone = 'purple'; }
            else if (locked) { statusLabel = 'Lock-down'; statusTone = 'amber'; }
            else if (remain > 0) { statusLabel = toFa(remain) + ' روز مانده'; statusTone = 'blue'; }
            else if (myHatch) { statusLabel = 'هچ‌شده'; statusTone = 'green'; }

            const partnerName = (e.dealData?.partnerId && (contacts.find((c: any) => c.id === e.dealData.partnerId) as any)?.name) || e.dealData?.partnerName || '';
            const sellerName = (e.dealData?.sellerId && (contacts.find((c: any) => c.id === e.dealData.sellerId) as any)?.name) || e.dealData?.sellerName || '';
            const consigneeName = (e.dealData?.consigneeId && (contacts.find((c: any) => c.id === e.dealData.consigneeId) as any)?.name) || e.dealData?.consigneeName || '';
            const lessorName = (e.dealData?.lessorId && (contacts.find((c: any) => c.id === e.dealData.lessorId) as any)?.name) || '';

            return (
              <ExpandableCard key={e.id} accent={accent} index={toFa(i + 1)} iconEmoji="🥚"
                title={toFa(e.count || 0) + ' تخم · ' + (bird?.name || '—') + (breed ? ' (' + breed.name + ')' : '')}
                subtitle={(dev?.name || '—') + ' · روز ' + toFa(age) + ' از ' + toFa(incubationDays(bird?.name || 'مرغ'))}
                isOpen={isOpen} onToggle={() => setExpandedId(isOpen ? null : e.id)}
                badge={<Tag tone={statusTone}>{statusLabel}</Tag>}
                summary={<>
                  <span>ورود: <b style={{ color: 'var(--text)' }}>{toFa(e.entryDate)}</b></span>
                  {e.expectedHatchDate && <span>هچ: <b style={{ color: 'var(--text)' }}>{toFa(e.expectedHatchDate)}</b></span>}
                  <span>{DEAL_LABEL[e.dealType]}</span>
                </>}
              >
                {(() => {
                  const b = birds.find(x => x.id === e.birdId);
                  const total = incubationDays(b?.name || 'مرغ');
                  return <ProgressTracker current={age} target={total} label={hatchWindow ? 'پنجره هچ باز است' : locked ? 'در Lock-down' : 'در حال انکوباسیون'} unit="روز" color={hatchWindow ? 'purple' : locked ? 'warn' : 'accent'} />;
                })()}

                <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--muted)', fontWeight: 700 }}>📋 مشخصات</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <Row l="دستگاه" v={dev?.name || '—'} />
                  <Row l="پرنده" v={(bird?.name || '—') + (breed ? ' · ' + breed.name : '')} />
                  <Row l="تعداد" v={toFa(e.count || 0) + ' تخم'} />
                  <Row l="تاریخ ورود" v={toFa(e.entryDate)} />
                  <Row l="هچ پیش‌بینی" v={toFa(e.expectedHatchDate)} />
                  {e.trayNumbers && <Row l="طبقات" v={e.trayNumbers} />}
                  <Row l="وضعیت" v={ENTRY_STATUS_LABEL[e.status]} />
                </div>

                <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--muted)', fontWeight: 700 }}>🤝 منبع</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <Row l="نوع" v={DEAL_LABEL[e.dealType]} />
                  {e.dealType === 'own' && (e as any).flockId && <Row l="گله" v={(flocks.find((f: any) => f.id === (e as any).flockId)?.name) || '—'} />}
                  {e.dealType === 'purchase' && sellerName && <Row l="فروشنده" v={String(sellerName)} />}
                  {e.dealType === 'partnership' && partnerName && <Row l="شریک" v={String(partnerName)} />}
                  {e.dealType === 'partnership' && e.dealData.partnerPercent && <Row l="درصد شریک" v={toFa(e.dealData.partnerPercent) + '٪'} />}
                  {e.dealType === 'rent' && lessorName && <Row l="اجاره‌دهنده" v={String(lessorName)} />}
                  {e.dealType === 'rent' && e.dealData.rentAmount && <Row l="اجاره" v={toFa(Number(e.dealData.rentAmount).toLocaleString('fa-IR')) + ' ت'} />}
                  {e.dealType === 'consignment' && consigneeName && <Row l="امانت‌دار" v={String(consigneeName)} />}
                  {(e as any).dealStatus === 'withdrawn' && (
                    <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--danger)', fontWeight: 700, padding: '4px 8px', background: 'var(--danger-soft)', borderRadius: 'var(--r-sm)' }}>
                      ⚠️ کنار کشیده {((e as any).dealWithdrawnAt ? ' (' + toFa((e as any).dealWithdrawnAt) + ')' : '')}
                    </div>
                  )}
                </div>

                {(e.unitPrice || e.totalPrice || (e as any).shippingCost) && (
                  <>
                    <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--muted)', fontWeight: 700 }}>💰 مالی</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                      {e.unitPrice && <Row l="قیمت هر تخم" v={toFa(e.unitPrice.toLocaleString('fa-IR')) + ' ت'} />}
                      {(e as any).shippingCost && <Row l="هزینه حمل" v={toFa((e as any).shippingCost.toLocaleString('fa-IR')) + ' ت'} />}
                      {e.totalPrice && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--fs-sm)', padding: '8px 10px', background: 'var(--accent-soft)', color: 'var(--accent)', borderRadius: 'var(--r-sm)', fontWeight: 700 }}>
                          <span>جمع تخم:</span><span>{toFa(e.totalPrice.toLocaleString('fa-IR'))} ت</span>
                        </div>
                      )}
                    </div>
                  </>
                )}

                {e.notes && (
                  <>
                    <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--muted)', fontWeight: 700 }}>📝 یادداشت</div>
                    <div style={{ fontSize: 'var(--fs-sm)', lineHeight: 1.7, padding: '8px 10px', background: 'var(--input-bg)', borderRadius: 'var(--r-sm)' }}>{e.notes}</div>
                  </>
                )}

                <div style={{ display: 'flex', gap: 6, paddingTop: 4 }}>
                  <Btn size="sm" onClick={() => openEdit(e)} style={{ flex: 1 }}>ویرایش</Btn>
                  <Btn size="sm" onClick={() => setDelId(e.id)} style={{ flex: 1 }}>حذف</Btn>
                </div>
              </ExpandableCard>
            );
          })}
          <Btn variant="primary" full onClick={openMulti}>+ ورود تخم</Btn>
        </>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title={editingRowId ? 'ویرایش ردیف' : 'ورود تخم به دستگاه'}
        footer={<BtnRow><Btn variant="primary" onClick={saveAll}>💾 ذخیره همه ({toFa(draftRows.length)})</Btn><Btn onClick={() => setOpen(false)}>لغو</Btn></BtnRow>}>

        <SectionTitle>📦 دستگاه</SectionTitle>
        <Field label="انتخاب دستگاه" required>
          <SmartSelect value={multiDeviceId} onChange={v => { setMultiDeviceId(v); }} options={devices.map(c => ({ value: c.id, label: c.name }))} placeholder="— انتخاب —" modalTitle="انتخاب دستگاه" autoThreshold={6} />
        </Field>
        {draftUsage.total > 0 && (
          <div style={{ fontSize: 'var(--fs-xs)', color: draftUsage.percent > 100 ? 'var(--danger)' : 'var(--muted)', fontWeight: 600, padding: '4px 2px' }}>
            📊 استفاده: {toFa(draftUsage.used)} / {toFa(draftUsage.total)} واحد ({toFa(draftUsage.percent)}٪)
            {draftUsage.percent > 100 ? ' ⚠️ بیشتر از ظرفیت' : ''}
          </div>
        )}

        {draftRows.length > 0 && (
          <>
            <SectionTitle>📋 ردیف‌های تخم</SectionTitle>
            {draftRows.map((r, i) => renderRowSummary(r, i))}
          </>
        )}

        <SectionTitle>{editingRowId ? '✏️ ویرایش ردیف' : '➕ ردیف جدید'}</SectionTitle>

        <Grid2>
          <Field label="نوع منبع" required>
            <Select value={currentRow.dealType} onChange={e => setCurrentRow(f => ({ ...f, dealType: e.target.value as DealType, dealData: {}, flockId: '' }))}>
              <option value="own">🏠 گله خودم</option>
              <option value="partnership">🤝 شراکتی</option>
              <option value="purchase">📥 خریداری</option>
              <option value="rent">🏢 اجاره‌ای</option>
              <option value="consignment">📦 امانی</option>
            </Select>
          </Field>
          <Field label="تاریخ ورود" required>
            <DatePicker value={currentRow.entryDate} onChange={v => setCurrentRow(f => ({ ...f, entryDate: v }))} placeholder="تاریخ" />
          </Field>
        </Grid2>

        {currentRow.dealType === 'own' && (
          <Field label="انتخاب گله" required>
            {flocks.filter((fl: any) => fl.status === 'active').length === 0 ? (
              <div style={{ fontSize: 'var(--fs-sm)', color: 'var(--muted)', padding: 10, textAlign: 'center', background: 'var(--input-bg)', borderRadius: 'var(--r-md)' }}>
                گله فعالی نیست
              </div>
            ) : (
              <Select value={currentRow.flockId} onChange={e => {
                const fid = e.target.value;
                const fl = flocks.find((x: any) => x.id === fid);
                setCurrentRow(f => ({ ...f, flockId: fid, birdId: fl?.birdId || f.birdId, breedId: fl?.breedId || f.breedId }));
              }}>
                <option value="">— انتخاب گله —</option>
                {flocks.filter((fl: any) => fl.status === 'active').map((fl: any) => <option key={fl.id} value={fl.id}>{fl.name}</option>)}
              </Select>
            )}
          </Field>
        )}

        {currentRow.dealType === 'purchase' && (
          <DepBox title="📥 خرید">
            <Field label="فروشنده" required>
              {suppliers.length === 0 ? (
                <div style={{ fontSize: 'var(--fs-sm)', color: 'var(--muted)', padding: 10, textAlign: 'center', background: 'var(--input-bg)', borderRadius: 'var(--r-md)' }}>
                  فروشنده‌ای در مخاطبین نیست
                </div>
              ) : (
                <Select value={currentRow.dealData.sellerId || ''} onChange={e => setD('sellerId', e.target.value)}>
                  <option value="">— انتخاب —</option>
                  {suppliers.map((p: any) => <option key={p.id} value={p.id}>{p.name}</option>)}
                </Select>
              )}
            </Field>
          </DepBox>
        )}

        {currentRow.dealType === 'partnership' && (
          <DepBox title="🤝 شراکت">
            <Field label="شریک" required>
              <Select value={currentRow.dealData.partnerId || ''} onChange={e => setD('partnerId', e.target.value)}>
                <option value="">— انتخاب —</option>
                {allPersons.map((p: any) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </Select>
            </Field>
            <Grid2>
              <Field label="درصد شریک" hint="٪">
                <NumField value={currentRow.dealData.partnerPercent || ''} onChange={e => { const v = clampPercent(parseInt(toEn(e.target.value)) || 0); setD('partnerPercent', v === null ? '' : String(v)); }} unit="٪" min={0} />
              </Field>
              <Field label="درصد من" hint="خودکار">
                <Input readOnly dir="ltr" value={toFa(complement(parseInt(toEn(currentRow.dealData.partnerPercent || '0')) || 0) ?? 100) + '٪'} unit="٪" />
              </Field>
            </Grid2>
          </DepBox>
        )}

        {currentRow.dealType === 'rent' && (
          <DepBox title="🏢 اجاره">
            <Field label="اجاره‌دهنده" required>
              <Select value={currentRow.dealData.lessorId || ''} onChange={e => setD('lessorId', e.target.value)}>
                <option value="">— انتخاب —</option>
                {allPersons.map((p: any) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </Select>
            </Field>
            <Grid2>
              <Field label="مبلغ اجاره"><MoneyField value={currentRow.dealData.rentAmount || ''} onChange={e => setD('rentAmount', e.target.value)} /></Field>
              <Field label="سرسید"><Input value={currentRow.dealData.rentDueDate || ''} onChange={e => setD('rentDueDate', e.target.value)} /></Field>
            </Grid2>
          </DepBox>
        )}

        {currentRow.dealType === 'consignment' && (
          <DepBox title="📦 امانت">
            <Field label="امانت‌دار" required>
              <Select value={currentRow.dealData.consigneeId || ''} onChange={e => setD('consigneeId', e.target.value)}>
                <option value="">— انتخاب —</option>
                {allPersons.map((p: any) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </Select>
            </Field>
            <Grid2>
              <Field label="درصد امانت‌دار" hint="٪">
                <NumField value={currentRow.dealData.consigneePercent || ''} onChange={e => { const v = clampPercent(parseInt(toEn(e.target.value)) || 0); setD('consigneePercent', v === null ? '' : String(v)); }} unit="٪" min={0} />
              </Field>
              <Field label="درصد من" hint="خودکار">
                <Input readOnly dir="ltr" value={toFa(complement(parseInt(toEn(currentRow.dealData.consigneePercent || '0')) || 0) ?? 100) + '٪'} unit="٪" />
              </Field>
            </Grid2>
          </DepBox>
        )}

        {(currentRow.dealType === 'partnership' || currentRow.dealType === 'consignment') && (
          <div style={{ padding: 10, background: currentRow.dealStatus === 'withdrawn' ? 'var(--danger-soft)' : 'var(--input-bg)', border: '1px solid ' + (currentRow.dealStatus === 'withdrawn' ? 'var(--danger)' : 'var(--border)'), borderRadius: 'var(--r-md)', display: 'flex', flexDirection: 'column', gap: 8 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
              <input type="checkbox" checked={currentRow.dealStatus === 'withdrawn'} onChange={e => setCurrentRow(f => ({ ...f, dealStatus: e.target.checked ? 'withdrawn' : 'active' }))} style={{ width: 18, height: 18, accentColor: 'var(--danger)' }} />
              <span style={{ fontSize: 'var(--fs-sm)', fontWeight: 600, color: currentRow.dealStatus === 'withdrawn' ? 'var(--danger)' : 'var(--text)' }}>کنار کشید</span>
            </label>
            {currentRow.dealStatus === 'withdrawn' && (
              <Grid2>
                <Field label="تاریخ"><DatePicker value={currentRow.dealWithdrawnAt} onChange={v => setCurrentRow(f => ({ ...f, dealWithdrawnAt: v }))} /></Field>
                <Field label="دلیل"><Input value={currentRow.dealWithdrawnReason} onChange={e => setCurrentRow(f => ({ ...f, dealWithdrawnReason: e.target.value }))} /></Field>
              </Grid2>
            )}
          </div>
        )}

        <Grid2>
          <Field label="پرنده" required>
            <SmartSelect value={currentRow.birdId} onChange={v => setCurrentRow(f => ({ ...f, birdId: v, breedId: '' }))} options={birds.map(c => ({ value: c.id, label: c.name }))} placeholder="—" modalTitle="انتخاب پرنده" autoThreshold={6} />
          </Field>
          <Field label="نژاد">
            <Select value={currentRow.breedId} onChange={e => setCurrentRow(f => ({ ...f, breedId: e.target.value }))}>
              <option value="">—</option>
              {breedsForBird.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
            </Select>
          </Field>
        </Grid2>
        <Grid2>
          <Field label="تعداد تخم" required>
            <NumField value={currentRow.count} onChange={e => setCurrentRow(f => ({ ...f, count: e.target.value }))} unit="عدد" min={0} />
          </Field>
          <Field label="طبقات (Tray)">
            <Input placeholder="۱-۲-۳" dir="ltr" value={currentRow.trayNumbers} onChange={e => setCurrentRow(f => ({ ...f, trayNumbers: e.target.value }))} />
          </Field>
        </Grid2>

        {(currentRow.dealType === 'purchase' || currentRow.dealType === 'partnership') && (
          <>
            <Grid2>
              <Field label="قیمت هر تخم">
                <MoneyField value={currentRow.unitPrice} onChange={e => setCurrentRow(f => ({ ...f, unitPrice: e.target.value }))} />
              </Field>
              <Field label="هزینه حمل">
                <MoneyField value={currentRow.shippingCost} onChange={e => setCurrentRow(f => ({ ...f, shippingCost: e.target.value }))} />
              </Field>
            </Grid2>
            {(() => {
              const cnt = parseInt(toEn(currentRow.count)) || 0;
              const up = parseFloat(toEn(currentRow.unitPrice).replace('٫', '.')) || 0;
              const sh = parseFloat(toEn(currentRow.shippingCost).replace('٫', '.')) || 0;
              const total = (cnt * up) + sh;
              if (total > 0) {
                return (
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--fs-sm)', padding: '6px 10px', background: 'var(--accent-soft)', color: 'var(--accent)', borderRadius: 'var(--r-sm)', fontWeight: 700 }}>
                    <span>💰 جمع ردیف:</span>
                    <span>{toFa(total.toLocaleString('fa-IR'))} ت</span>
                  </div>
                );
              }
              return null;
            })()}
          </>
        )}

        <Field label="یادداشت">
          <Input placeholder="..." value={currentRow.notes} onChange={e => setCurrentRow(f => ({ ...f, notes: e.target.value }))} />
        </Field>

        <Btn variant="primary" full onClick={addRowToList}>
          {editingRowId ? '💾 به‌روزرسانی ردیف' : '+ افزودن به لیست'}
        </Btn>
        {editingRowId && (
          <Btn full onClick={() => { setEditingRowId(null); setCurrentRow(makeRow()); }}>لغو ویرایش</Btn>
        )}
      </Modal>

      <Modal open={!!delId} onClose={() => setDelId(null)} title="حذف ورودی تخم"
        footer={<BtnRow><Btn variant="danger" onClick={() => delId && deleteEntryWithCascade(delId)}>حذف کن</Btn><Btn onClick={() => setDelId(null)}>لغو</Btn></BtnRow>}>
        <div style={{ textAlign: 'center', fontSize: 'var(--fs-md)', lineHeight: 1.9 }}>
          حذف <b>{toFa(target?.count || 0)} تخم</b>؟
        </div>
      </Modal>
    </PageContainer>
  );
}

function todayJalali(): string {
  const d = new Date();
  return d.getFullYear() + '/' + String(d.getMonth() + 1).padStart(2, '0') + '/' + String(d.getDate()).padStart(2, '0');
}

function Row({ l, v }: { l: string; v: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--fs-sm)', padding: '6px 10px', background: 'var(--input-bg)', borderRadius: 'var(--r-sm)' }}>
      <span style={{ color: 'var(--muted)' }}>{l}:</span>
      <span style={{ fontWeight: 600, color: 'var(--text)' }}>{v}</span>
    </div>
  );
}

function DepBox({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ background: 'var(--accent-soft)', border: '1px dashed var(--accent-border)', borderRadius: 'var(--r-md)', padding: 'var(--sp-3)', display: 'flex', flexDirection: 'column', gap: 'var(--sp-3)', marginTop: 4 }}>
      <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--accent)', fontWeight: 700, paddingBottom: 8, borderBottom: '1px solid var(--border)' }}>
        {title}
      </div>
      {children}
    </div>
  );
}

function chip(active: boolean): React.CSSProperties {
  return {
    padding: '6px 11px', fontSize: 'var(--fs-sm)',
    background: active ? 'var(--accent-soft)' : 'var(--btn-bg)',
    border: '1px solid ' + (active ? 'var(--accent-border)' : 'var(--border)'),
    borderRadius: 'var(--r-sm)',
    color: active ? 'var(--accent)' : 'var(--muted)',
    fontWeight: active ? 600 : 500, cursor: 'pointer',
    fontFamily: 'inherit', whiteSpace: 'nowrap'
  };
}
