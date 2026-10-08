/**
 * HatchesPage — هچ، تفکیک، ساخت گله، فروش، validation
 */
import { useState, useEffect, useMemo } from 'react';
import { useHatchForm } from './hooks/useHatchForm';
import { useFab } from '../../shr/hooks/useFab';
import { useInc, hatchRate, costPerChick, daysAgo, isLockdown, type HatchResult } from './store';
import { useBrd } from '../brd/store';
import { useFlk } from '../flk/store';
import { useHal } from '../hal/store';
import { useCtc } from '../ctc/store';
import { useTra } from '../tra/store';
import { useNavigate } from 'react-router-dom';
import { Btn, BtnRow, Empty, Field, Grid2, Input, Modal, MoneyField, NumField, PageContainer, SectionTitle, Select, Tag, ErrorBox , Textarea } from '../../shr/components/ui';
import ExpandableCard, { InfoItem, StatBox, Dot } from '../../shr/components/ExpandableCard';
import DatePicker from '../../shr/components/DatePicker';
import { toFa, toEn } from '../../shr/utils/fa';
import { showAlert, showConfirmAsync } from '../../cor/store/dialog';
import { showToast, toastMsg } from '../../cor/store/toast';
import { Row, chip } from './helpers';
import HelpBanner from '../../shr/components/HelpBanner';
import { useMultiSelect } from '../../shr/multiSelect/useMultiSelect';
import { useFilterSort, FilterBar, getIncHatchesConfig } from '../../shr/filter';
import MultiSelectBar from '../../shr/multiSelect/MultiSelectBar';
import { format as formatJ } from 'date-fns-jalali';
import { useIncubationProfile } from './hooks';
import { calcCurrentFertile, smartHatchRate, estimateHatched } from './api/hatchCalc';
import { buildFlockFromHatch, buildSaleInvoiceFromHatch } from './api/hatchActions';
import FlockCreateModal from './components/FlockCreateModal';
import SellModal from './components/SellModal';
import HatchFormModal from './components/HatchFormModal';
import HatchCard from './components/HatchCard';
import { logAction } from '../../cor/logger/auditLog';

const emptyRow = () => ({ hatched:'', unhatched:'', deadInShell:'', pipped:'', other:'', gradeA:'', gradeB:'', maleCount:'', femaleCount:'', unknownCount:'', avgWeight:'', notes:'' });

export default function HatchesPage({ initialEntry = '', onGoTo, active = true }: { initialEntry?: string; onGoTo?: (t: any, payload?: { entry?: string }) => void; active?: boolean } = {}) {
  const { devices, eggEntries, hatches, candlings, addHatch, updateHatch, deleteHatch } = useInc();
  const { birds } = useBrd();
  const { add: addFlock, remove: removeFlock } = useFlk();
  const { halls, zones } = useHal();
  const { contacts } = useCtc();
  const { addInvoice, deleteInvoice } = useTra();
  const nav = useNavigate();

  const [undoData, setUndoData] = useState<{ hatch: any | any[] } | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [deviceFilter, setDeviceFilter] = useState('');

  const [flockModal, setFlockModal] = useState<{ hatchId: string; count: number } | null>(null);
  const [flockForm, setFlockForm] = useState({ name:'', type:'layer', hallId:'', zoneId:'' });
  const [sellModal, setSellModal] = useState<{ hatchId: string; count: number } | null>(null);
  const [sellForm, setSellForm] = useState({ buyerId:'', count:'', unitPrice:'', date:'' });

  // ═══ Performance: lookup maps ═══
  const _entriesById = useMemo(() => {
    const m: Record<string, any> = {};
    (eggEntries || []).forEach(e => { m[e.id] = e; });
    return m;
  }, [eggEntries]);

  const _birdsById = useMemo(() => {
    const m: Record<string, any> = {};
    (birds || []).forEach(b => { m[b.id] = b; });
    return m;
  }, [birds]);

  const _devicesById = useMemo(() => {
    const m: Record<string, any> = {};
    (devices || []).forEach(d => { m[d.id] = d; });
    return m;
  }, [devices]);

  // ═══ Performance: index candlings by entry, sorted desc ═══
  const _candlingsByEntry = useMemo(() => {
    const m: Record<string, any[]> = {};
    (candlings || []).forEach(cc => {
      if (!m[cc.eggEntryId]) m[cc.eggEntryId] = [];
      m[cc.eggEntryId].push(cc);
    });
    Object.values(m).forEach(arr => arr.sort((a, b) => b.stage - a.stage));
    return m;
  }, [candlings]);

  const _latestCandByEntry = useMemo(() => {
    const m: Record<string, any> = {};
    Object.entries(_candlingsByEntry).forEach(([k, arr]) => {
      if (arr.length > 0) m[k] = arr[0];
    });
    return m;
  }, [_candlingsByEntry]);

  const int = (s: string) => s ? parseInt(toEn(s)) || null : null;
  const num = (s: string) => s ? parseFloat(toEn(s).replace('٫', '.')) || null : null;
  const todayJ = () => { const d = new Date(); return formatJ(d, 'yyyy/MM/dd'); };

  const {
    open, setOpen, editingId, setEditingId, formDate, setFormDate,
    formEntryId, setFormEntryId, selectedIds, setSelectedIds,
    entriesData, setEntriesData, err, setErr,
    dataFor, updateData, toggleEntry, openNew, openEdit, vErrors, save,
  } = useHatchForm({ eggEntries, candlings, hatches, entriesById: _entriesById, addHatch, updateHatch });

  useFab(active ? { label: 'ثبت هچ', onClick: () => openNew() } : null);

  const undoDeleteHatch = () => {
    if (!undoData) return;
    try {
      const arr: any[] = Array.isArray(undoData.hatch) ? undoData.hatch : [undoData.hatch];
      for (const h of arr) addHatch(h);
      toastMsg.restoredBulk(arr.length, 'هچ')
    } catch {}
    setUndoData(null);
  };


  const doDelete = async (id: string) => {
    const h = hatches.find(x => x.id === id) as any;
    if (!h) return;
    const ok = await showConfirmAsync('تأیید حذف', 'این هچ حذف شود؟', { danger: true });
    if (!ok) return;
    if (h.generatedFlockId && await showConfirmAsync('تأیید', 'این هچ یک گله ساخته. گله هم حذف شود؟', { danger: true })) { try { removeFlock(h.generatedFlockId); } catch {} }
    if (h.generatedInvoiceId && await showConfirmAsync('تأیید', 'این هچ یک فاکتور ساخته. فاکتور هم حذف شود؟', { danger: true })) { try { deleteInvoice(h.generatedInvoiceId); } catch {} }
    deleteHatch(id);
  };

  const createFlock = () => {
    if (!flockModal) return;
    if (!flockForm.name.trim()) { showAlert('نام گله اجباری است'); return; }
    const h = hatches.find(x => x.id === flockModal.hatchId);
    if (!h) return;
    const entry = _entriesById[h.eggEntryId];
    const bird = entry ? _birdsById[entry.birdId] : null;
    if (!bird) { showAlert('پرنده پیدا نشد'); return; }
    const data = buildFlockFromHatch({
      formName: flockForm.name.trim(),
      formType: flockForm.type,
      formHallId: flockForm.hallId,
      formZoneId: flockForm.zoneId,
      hatch: { ...h, hatched: flockModal.count } as any,
      bird,
      breedId: entry?.breedId || '',
    });
    const newFlockId = addFlock(data as any);
    if (newFlockId) {
      try { updateHatch(h.id, { generatedFlockId: newFlockId } as any); } catch {}
    }
    setFlockModal(null);
    showAlert('گله ساخته شد', '✅ موفق');
    setTimeout(() => nav('/flk'), 500);
  };

  const doSell = () => {
    if (!sellModal) return;
    if (!sellForm.buyerId) { showAlert('خریدار اجباری است'); return; }
    const count = parseInt(toEn(sellForm.count)) || 0;
    const unitPrice = parseFloat(toEn(sellForm.unitPrice).replace('٫','.')) || 0;
    if (count <= 0 || unitPrice <= 0) { showAlert('مقادیر باید بیشتر از صفر'); return; }
    const h = hatches.find(x => x.id === sellModal.hatchId);
    if (!h) return;
    const data = buildSaleInvoiceFromHatch({
      buyerId: sellForm.buyerId,
      count,
      unitPrice,
      date: sellForm.date || h.date,
      hatch: h as any,
    });
    const invId = addInvoice(data as any);
    if (invId) updateHatch(h.id, { generatedInvoiceId: invId } as any);
    setSellModal(null);
    showAlert('فاکتور ثبت شد', '✅ موفق');
  };

  // فیلتر/مرتب
  const config = useMemo(
    () => getIncHatchesConfig({
      devices: devices.map(d => ({ id: d.id, name: d.name })),
      eggEntriesById: _entriesById,
    }),
    [devices, _entriesById]
  );
  const { filtered, filters, setFilter, clearFilter, sort, setSort, toggleSort,
          resetAll, hasActiveFilters, total, count } = useFilterSort<HatchResult>({
    items: hatches,
    filters: config.filterDefs,
    sorts: config.sortDefs,
    persistKey: config.persistKey,
    initialSort: config.initialSort,
  });

  // ─── Multi-Select ───
  const ms = useMultiSelect({
    items: filtered,
    getId: (h: any) => h.id,
    onDelete: async (ids: string[]) => {
      const ok = await showConfirmAsync('حذف گروهی', toFa(ids.length) + ' هچ حذف شوند؟', { danger: true });
      if (!ok) return;
      const backups: any[] = [];
      for (const id of ids) {
        const it = hatches.find(x => x.id === id);
        if (!it) continue;
        backups.push(it);
        try { deleteHatch(id); } catch {}
      }
      if (backups.length > 0) {
        setUndoData({ hatch: backups });
        setTimeout(() => setUndoData((cur: any) => cur && Array.isArray(cur.hatch) && cur.hatch.length === backups.length ? null : cur), 8000);
      }
      toastMsg.deletedBulk(backups.length, 'هچ')
      logAction('delete', 'inc', 'حذف گروهی هچ: ' + backups.length);
    },
  });

  useEffect(() => {
    if (ms.selectionMode) setExpandedId(null);
  }, [ms.selectionMode]);

  const availableEntries = eggEntries
    .filter(e => !deviceFilter || e.deviceId === deviceFilter)
    .filter(e => {
      // در حالت ویرایش، ورودی خودمون رو نشون بده
      if (editingId) return e.id === formEntryId;
      // ورودی که قبلاً هچ شده رو نشون نده
      const hasHatch = hatches.some(h => h.eggEntryId === e.id);
      return !hasHatch;
    })
    .sort((a, b) => String(b.entryDate).localeCompare(String(a.entryDate)));

  return (
    <PageContainer>
      {undoData && (
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '10px 14px', marginBottom: 8,
          background: 'var(--warn-soft)', border: '1px solid var(--warn)',
          borderRadius: 'var(--r-md)', fontSize: 'var(--fs-sm)',
        }}>
          <span>هچ حذف شد</span>
          <button type="button" onClick={undoDeleteHatch} aria-label="بازگردانی هچ" style={{
            background: 'none', border: 'none', color: 'var(--warn)',
            fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
            fontSize: 'var(--fs-sm)', padding: '4px 10px',
          }}>بازگردانی</button>
        </div>
      )}
      <HelpBanner
        id="inc-hatch-intro"
        icon="🐣"
        title="هچ — نتیجه نهایی"
        description="نتیجه نهایی تخم‌ها را اینجا ثبت کنید: هچ، تلفات جنینی، تفکیک جنسیت، ساخت گله و فروش جوجه. برای انتخاب چندتایی، روی یک کارت نگه دارید."
        tone="info"
      />

      {!ms.selectionMode && filtered.length > 1 && (
        <div style={{ fontSize: '10px', color: 'var(--dim)', textAlign: 'center', paddingBottom: 2 }}>
          برای انتخاب چندتایی، روی یک کارت نگه دارید
        </div>
      )}

      {ms.selectionMode && filtered.length > 1 && (
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 6 }}>
          <button type="button"
            onClick={ms.selectedIds.size === filtered.length ? ms.clearSelection : ms.selectAll}
            style={{ padding: '4px 10px', background: 'var(--input-bg)', border: '1px solid var(--border)', borderRadius: 'var(--r-sm)', color: 'var(--muted)', fontFamily: 'inherit', fontSize: '10px', fontWeight: 600, cursor: 'pointer' }}>
            {ms.selectedIds.size === filtered.length ? 'لغو انتخاب همه' : 'انتخاب همه'}
          </button>
        </div>
      )}

      <FilterBar
        filterDefs={config.filterDefs}
        sortDefs={config.sortDefs}
        filterState={filters}
        sortState={sort}
        setFilter={setFilter}
        clearFilter={clearFilter}
        setSort={setSort}
        toggleSort={toggleSort}
        resetAll={resetAll}
        hasActiveFilters={hasActiveFilters}
        total={total}
        count={count}
      />

      {filtered.length === 0 ? (
        <Empty icon={<svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><ellipse cx="12" cy="14" rx="7" ry="9"/></svg>}
          title="هچی ثبت نشده" desc="نتیجه‌ی نهایی را ثبت کنید."
          action={<Btn variant="primary" onClick={() => openNew()}>+ ثبت هچ</Btn>} />
      ) : (
        <>
          {filtered.map((h, i) => {
            const entry = _entriesById[h.eggEntryId];
            const bird = entry ? _birdsById[entry.birdId] : null;
            const dev = entry ? _devicesById[entry.deviceId] : null;
            const isOpen = !ms.selectionMode && expandedId === h.id;
            const total = entry?.count || 0;
            const hr = hatchRate(h.hatched || 0, total);
            const myCand = _latestCandByEntry[h.eggEntryId];
            const aliveAfter = myCand?.alive || total;
            const realRate = aliveAfter ? ((h.hatched || 0) / aliveAfter * 100) : 0;
            const tone = hr >= 70 ? 'green' : hr >= 50 ? 'amber' : 'red';
            const sumH = (h.hatched||0) + (h.unhatched||0) + (h.deadInShell||0) + (h.pipped||0) + (h.other||0);
              return (
              <HatchCard
                key={h.id}
                hatch={h}
                index={i}
                bird={bird}
                dev={dev}
                entry={entry}
                isOpen={isOpen}
                ms={ms}
                hr={hr}
                realRate={realRate}
                aliveAfter={aliveAfter}
                total={total}
                isComplete={(h.hatched||0)+(h.unhatched||0)+(h.deadInShell||0)+(h.pipped||0)+(h.other||0) >= total}
                tone={tone}
                onToggle={() => setExpandedId(isOpen ? null : h.id)}
                onEdit={() => openEdit(h)}
                onDelete={() => doDelete(h.id)}
                onOpenFlock={() => { setFlockModal({ hatchId: h.id, count: h.hatched || 0 }); setFlockForm({ name: 'گله ' + (bird?.name || '') + ' ' + toFa(formatJ(new Date(), 'yyyy')), type: 'layer', hallId: '', zoneId: '' }); }}
                onOpenSell={() => { setSellModal({ hatchId: h.id, count: h.hatched || 0 }); setSellForm({ buyerId:'', count: String(h.hatched || 0), unitPrice:'', date: h.date }); }}
              />
            );
          })}
          
        </>
      )}

      <HatchFormModal
        open={open}
        editingId={editingId}
        formDate={formDate}
        setFormDate={setFormDate}
        formEntryId={formEntryId}
        setFormEntryId={setFormEntryId}
        deviceFilter={deviceFilter}
        setDeviceFilter={setDeviceFilter}
        selectedIds={selectedIds}
        entriesData={entriesData}
        err={err}
        vErrors={vErrors}
        eggEntries={eggEntries}
        devices={devices}
        availableEntries={availableEntries}
        birdsById={_birdsById}
        devicesById={_devicesById}
        candlings={candlings}
        latestCandByEntry={_latestCandByEntry}
        daysAgo={daysAgo}
        isLockdown={isLockdown}
        toggleEntry={toggleEntry}
        updateData={updateData}
        dataFor={dataFor}
        onSave={save}
        onClose={() => setOpen(false)}
      />

      <MultiSelectBar ms={ms} deleteLabel="حذف" />

      {ms.selectionMode && <div style={{ height: 90 }} />}

      {/* ═══ Modal گله ═══ */}
      <FlockCreateModal
        open={!!flockModal}
        count={flockModal?.count || 0}
        form={flockForm}
        setForm={setFlockForm}
        halls={halls}
        zones={zones}
        onCreate={createFlock}
        onClose={() => setFlockModal(null)}
      />

      {/* ═══ Modal فروش ═══ */}
      <SellModal
        open={!!sellModal}
        maxCount={sellModal?.count || 0}
        form={sellForm}
        setForm={setSellForm}
        contacts={contacts}
        onSell={doSell}
        onClose={() => setSellModal(null)}
      />

    </PageContainer>
  );
}