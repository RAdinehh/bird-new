/**
 * CandlingsPage — کندلینگ با Multi-select و تجمیع
 */
import { useState, useEffect, useMemo } from 'react';
import { useFab } from '../../shr/hooks/useFab';
import { useInc, type Candling } from './store';
import { useBrd } from '../brd/store';
import { Btn, Empty, PageContainer } from '../../shr/components/ui';
import { toFa, toEn } from '../../shr/utils/fa';
import { showAlert } from '../../cor/store/dialog';
import { toastMsg } from '../../cor/store/toast';
import { useFilterSort, FilterBar, getIncCandlingsConfig } from '../../shr/filter';
import { todayJalali } from './helpers';
import { useIncubationProfile } from './hooks';
import { aggregateCandlings, calcSummary } from './api/calc';
import { useCandlingForm, type EntryData, emptyData } from './hooks/useCandlingForm';
import CandlingCard from './components/CandlingCard';
import CandlingFormModal from './components/CandlingFormModal';
import { useMemo as _useMemoV } from 'react';

const INFERTILE_REASONS: [string, string][] = [
  ['', '—'], ['season', 'فصل'], ['rooster_age', 'سن خروس'], ['nutrition', 'تغذیه'], ['genetics', 'ژنتیک'], ['storage', 'نگهداری تخم']
];
const DEAD_REASONS: [string, string][] = [
  ['', '—'], ['temp_fluctuation', 'نوسان دما'], ['humidity', 'رطوبت نامناسب'], ['ventilation', 'تهویه ضعیف'], ['genetics', 'ژنتیک'], ['infection', 'عفونت']
];





export default function CandlingsPage({ initialEntry = '', onGoTo, active = true }: { initialEntry?: string; onGoTo?: (t: any, payload?: { entry?: string }) => void; active?: boolean } = {}) {
  const { devices, eggEntries, candlings, addCandling, updateCandling, deleteCandling } = useInc();
  const { birds } = useBrd();

  const [expandedId, setExpandedId] = useState<string | null>(null);

  // ⭐ hook فرم کندلینگ
  const {
    open, modalDevice, modalDay, modalDate, selectedIds, entriesData, err, editingId,
    setOpen, setModalDevice, setModalDay, setModalDate, setSelectedIds, setEntriesData, setErr,
    openNew, openEdit, toggleEntry, updateEntryData, save, close,
  } = useCandlingForm({ eggEntries, devices, candlings, addCandling, updateCandling });
  const [undoData, setUndoData] = useState<{ candling: any } | null>(null);

  // profile پرنده انتخاب‌شده اول
  const _firstSelectedBirdName = (() => {
    const firstId = Array.from(selectedIds)[0];
    if (!firstId) return undefined;
    const entry = eggEntries.find(x => x.id === firstId);
    if (!entry) return undefined;
    return birds.find(b => b.id === entry.birdId)?.name;
  })();
  const _profile = useIncubationProfile(_firstSelectedBirdName);

  // ═══ Performance: lookup maps ═══
  const _entriesById = useMemo(() => {
    const m: Record<string, any> = {};
    (eggEntries || []).forEach(e => { m[e.id] = e; });
    return m;
  }, [eggEntries]);

  // ⭐ wrapperها — چون _entriesById لازمه
  const handleOpenNew = (preEntryId?: string) => openNew(preEntryId, _entriesById);
  const handleSave = () => {
    const result = save(_entriesById);
    if (result.ok && result.savedCount > 0 && !editingId) {
      toastMsg.success(toFa(result.savedCount) + ' کندلینگ ثبت شد');
    }
  };

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

  const _candlingsByEntry = useMemo(() => {
    const m: Record<string, any[]> = {};
    (candlings || []).forEach(cc => {
      if (!m[cc.eggEntryId]) m[cc.eggEntryId] = [];
      m[cc.eggEntryId].push(cc);
    });
    return m;
  }, [candlings]);

  useEffect(() => {
    if (initialEntry) {
      const entry = _entriesById[initialEntry];
      if (entry) {
        setModalDevice(entry.deviceId);
        setSelectedIds(new Set([initialEntry]));
        setEntriesData({ [initialEntry]: emptyData() });
        const stages = candlings.filter(c => c.eggEntryId === initialEntry).map(c => c.stage);
        const nextDay = stages.length > 0 ? Math.max(...stages) + 3 : 7;
        setModalDay(String(nextDay));
        setModalDate(todayJalali());
        setOpen(true);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialEntry]);

  const undoDeleteCandling = () => {
    if (!undoData) return;
    try { addCandling(undoData.candling); } catch {}
    setUndoData(null);
  };

  useFab(active ? { label: 'ثبت کندلینگ', onClick: () => handleOpenNew() } : null);

  const availableEntries = useMemo(() => {
    const dayNum = parseInt(toEn(modalDay)) || 0;
    const editing = editingId;
    return eggEntries
      .filter(e => !modalDevice || e.deviceId === modalDevice)
      .filter(e => e.status !== 'failed')
      .filter(e => {
        // در حالت ویرایش، ورودی خودمون رو نشون بده
        if (editing) {
          const editingCand = candlings.find(c => c.id === editing);
          if (editingCand && editingCand.eggEntryId === e.id) return true;
        }
        // ورودی که قبلاً در این مرحله کندلینگ شده رو نشون نده
        const hasThisStage = candlings.some(c => c.eggEntryId === e.id && c.stage === dayNum);
        return !hasThisStage;
      })
      .sort((a, b) => String(b.entryDate).localeCompare(String(a.entryDate)));
  }, [eggEntries, modalDevice, modalDay, editingId, candlings]);



  // ═══ اعتبارسنجی زنده ═══
  const vErrors = _useMemoV(() => {
    const errs: Record<string, string> = {};
    for (const [entryId, d] of Object.entries(entriesData || {})) {
      const alive = parseInt(toEn(d.alive || '0')) || 0;
      const infertile = parseInt(toEn(d.infertile || '0')) || 0;
      const dead = parseInt(toEn(d.dead || '0')) || 0;
      const broken = parseInt(toEn(d.broken || '0')) || 0;
      if (alive < 0 || infertile < 0 || dead < 0 || broken < 0) {
        errs['neg_' + entryId] = 'مقادیر منفی مجاز نیست';
      }
    }
    return errs;
  }, [entriesData]);



  // فیلتر/مرتب
  const config = useMemo(
    () => getIncCandlingsConfig({
      devices: devices.map(d => ({ id: d.id, name: d.name })),
      birds: birds.map(b => ({ id: b.id, name: b.name })),
      eggEntriesById: _entriesById,
    }),
    [devices, birds, _entriesById]
  );
  const { filtered: filteredCandlings, filters, setFilter, clearFilter, sort, setSort, toggleSort,
          resetAll, hasActiveFilters, total, count } = useFilterSort<Candling>({
    items: candlings,
    filters: config.filterDefs,
    sorts: config.sortDefs,
    persistKey: config.persistKey,
    initialSort: config.initialSort,
  });

  // ═══ گروه‌بندی + تجمیع + درصد ═══
  const grouped = useMemo(() => {
    const byEntry: Record<string, Candling[]> = {};
    filteredCandlings.forEach(c => {
      if (!byEntry[c.eggEntryId]) byEntry[c.eggEntryId] = [];
      byEntry[c.eggEntryId].push(c);
    });
    return Object.entries(byEntry).map(([entryId, list]) => {
      const agg = aggregateCandlings(list);
      const total = agg.alive + agg.infertile + agg.dead + agg.broken;
      const entry = _entriesById[entryId];
      const entryTotal = entry?.count || 0;
      const fertilePercent = total > 0 ? (agg.alive / total * 100) : 0;
      const lossPercent = entryTotal > 0 ? ((total - agg.alive) / entryTotal * 100) : 0;
      const deadPercent = total > 0 ? ((agg.dead + agg.infertile) / total * 100) : 0;
      return { entryId, list: list.sort((a, b) => a.stage - b.stage), agg, total, entryTotal, fertilePercent, lossPercent, deadPercent };
    }).sort(({ entryId: a }, { entryId: b }) => {
      const ea = _entriesById[a];
      const eb = _entriesById[b];
      return String(eb?.entryDate || '').localeCompare(String(ea?.entryDate || ''));
    });
  }, [filteredCandlings, _entriesById]);

  // ═══ خلاصه کل ═══
  const summary = useMemo(() => {
    const totalEntries = eggEntries.filter(e => e.status !== 'failed').length;
    const totalCandlings = candlings.length;
    const entryTotalMap: Record<string, number> = {};
    eggEntries.forEach(e => { entryTotalMap[e.id] = e.count || 0; });
    const s = calcSummary(candlings, entryTotalMap);
    return { totalEntries, totalCandlings, ...s };
  }, [eggEntries, candlings]);

  const dataFor = (id: string): EntryData => entriesData[id] || emptyData();

  return (
    <PageContainer>
      {undoData && (
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '10px 14px', marginBottom: 8,
          background: 'var(--warn-soft)',
          border: '1px solid var(--warn)',
          borderRadius: 'var(--r-md)',
          fontSize: 'var(--fs-sm)',
        }}>
          <span>کندلینگ حذف شد</span>
          <button type="button" onClick={undoDeleteCandling} style={{
            background: 'none', border: 'none',
            color: 'var(--warn)', fontWeight: 700, cursor: 'pointer',
            fontFamily: 'inherit', fontSize: 'var(--fs-sm)', padding: '4px 10px',
          }}>بازگردانی</button>
        </div>
      )}
      {/* ═══ خلاصه کل ═══ */}
      {summary.totalCandlings > 0 && (
        <div style={{
          padding: '10px 12px',
          background: 'var(--card)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--r-md)',
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 6,
        }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <span style={{ fontSize: 'var(--fs-xs)', color: 'var(--muted)' }}><span style={{ fontSize: '1.05em', lineHeight: 1, display: 'inline-block', marginLeft: 4 }}>🧬</span> نطفه‌داری کل</span>
            <span style={{ fontSize: 'var(--fs-lg)', fontWeight: 700, color: 'var(--accent)' }}>{toFa(summary.fertilePercent.toFixed(1))}٪</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <span style={{ fontSize: 'var(--fs-xs)', color: 'var(--muted)' }}>📉 تلفات کل</span>
            <span style={{ fontSize: 'var(--fs-lg)', fontWeight: 700, color: summary.lossPercent > 50 ? 'var(--danger)' : summary.lossPercent > 20 ? 'var(--warn)' : 'var(--muted)' }}>{toFa(summary.lossPercent.toFixed(1))}٪</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', gridColumn: '1 / -1', paddingTop: 8, borderTop: '1px dashed var(--border)', fontSize: 'var(--fs-base)', color: 'var(--text)', fontWeight: 700, letterSpacing: '.3px' }}>
            <span><span style={{ fontSize: '1.05em', lineHeight: 1, display: 'inline-block', marginLeft: 4 }}>📥</span> {toFa(summary.totalEntries)} ورودی</span>
            <span>🔍 {toFa(summary.totalCandlings)} کندلینگ</span>
            <span>✅ {toFa(summary.totalAlive)} سالم</span>
          </div>
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

      {candlings.length === 0 ? (
        <Empty icon={<svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>}
          title="کندلینگی ثبت نشده"
          desc="کندلینگ در روزهای دلخواه انجام می‌شود."
          action={<Btn variant="primary" onClick={() => handleOpenNew()}>+ ثبت کندلینگ</Btn>} />
      ) : (
        <>
          {grouped.map(({ entryId, list, agg, total, entryTotal, fertilePercent, lossPercent }) => {
            const entry = _entriesById[entryId];
            const bird = entry ? _birdsById[entry.birdId] : null;
            const dev = entry ? _devicesById[entry.deviceId] : null;
            const isOpen = expandedId === entryId;
            return (
              <CandlingCard
                key={entryId}
                entryId={entryId}
                list={list}
                agg={agg}
                total={total}
                entryTotal={entryTotal}
                fertilePercent={fertilePercent}
                lossPercent={lossPercent}
                birdName={bird?.name}
                deviceName={dev?.name}
                entryDate={entry?.entryDate}
                isOpen={isOpen}
                onToggle={() => setExpandedId(isOpen ? null : entryId)}
                onEdit={openEdit}
                onNew={handleOpenNew}
                onDelete={deleteCandling}
              />
            );
          })}
          
        </>
      )}

      <CandlingFormModal
        open={open}
        onClose={close}
        editingId={editingId}
        modalDay={modalDay}
        setModalDay={setModalDay}
        modalDate={modalDate}
        setModalDate={setModalDate}
        modalDevice={modalDevice}
        setModalDevice={setModalDevice}
        selectedIds={selectedIds}
        setSelectedIds={setSelectedIds}
        setEntriesData={setEntriesData}
        toggleEntry={toggleEntry}
        updateEntryData={updateEntryData}
        entriesData={entriesData}
        devices={devices}
        availableEntries={availableEntries}
        birdsById={_birdsById}
        candlings={candlings}
        firstSelectedBirdName={_firstSelectedBirdName}
        profile={_profile}
        onSave={handleSave}
        saving={false}
        err={err}
        vErrors={vErrors}
      />

    </PageContainer>
  );
}
