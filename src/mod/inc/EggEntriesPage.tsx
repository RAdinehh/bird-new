/**
 * EggEntriesPage — ورودی تخم به دستگاه‌های انکوباسیون (Multi-row + Draft Auto-Save)
 */
import { useState, useMemo } from 'react';
import {
  useInc, DEAL_LABEL, addDaysJalali,
  daysAgo, daysToHatch, daysFromProfiles, type EggEntry
} from './store';
import { useBrd } from '../brd/store';
import { useBreedStandard } from '../../shr/hooks/useBreedStandard';
import { useFlk } from '../flk/store';
import { useCtc } from '../ctc/store';
import { useTra } from '../tra/store';
import { useEgg } from '../egg/store';
import { Btn, Empty, PageContainer } from '../../shr/components/ui';
import { toFa, toEn } from '../../shr/utils/fa';
import { showConfirmAsync } from '../../cor/store/dialog';
import { useFilterSort, FilterBar, getIncEntriesConfig } from '../../shr/filter';
import { todayJalali } from './helpers';
import EggEntryModal from './components/EggEntryModal';
import { makeRow, type DraftRow } from './types-eggentries';
import { nowTime } from './api/eggEntriesCalc';
import EggEntryCard from './components/EggEntryCard';
import { useEggEntriesForm } from './hooks/useEggEntriesForm';
import { useSet } from '../set/store';


export default function EggEntriesPage({ initialDevice = '', onGoTo, active = true }: { initialDevice?: string; onGoTo?: (t: any, payload?: { entry?: string }) => void; active?: boolean } = {}) {
  const { devices, eggEntries, candlings, hatches, addEntry, updateEntry, deleteEntry } = useInc();
  const { birds, breeds } = useBrd();
  const breedStd = useBreedStandard();
  const { flocks } = useFlk();
  const { contacts } = useCtc();
  const { addInvoice, deleteInvoice } = useTra();
  const { addProduction, deleteProduction } = useEgg();

  const [expandedId, setExpandedId] = useState<string | null>(null);

  const _profiles = useSet((s: any) => s.incubationProfiles) || [];
  const _birdsById = useMemo(() => {
    const m: Record<string, any> = {};
    (birds || []).forEach((b) => { m[b.id] = b; });
    return m;
  }, [birds]);

  const _contactsById = useMemo(() => {
    const m: Record<string, any> = {};
    (contacts || []).forEach((cc) => { m[cc.id] = cc; });
    return m;
  }, [contacts]);

  const daysByName = useMemo(() => {
    const map = new Map<string, number>();
    birds.forEach((b) => map.set(b.name, daysFromProfiles(b.name, _profiles)));
    return map;
  }, [birds, _profiles]);
  const _daysLookup = (name: string | undefined): number => {
    if (!name) return 21;
    return daysByName.get(name) || daysFromProfiles(name, _profiles);
  };


  // ⭐ hook فرم ورودی تخم
  const {
    open, setOpen,
    multiDeviceId, setMultiDeviceId,
    hideHatchTip, setHideHatchTip,
    draftRows, setDraftRows,
    undoRow, setUndoRow,
    currentRow, setCurrentRow,
    editingRowId, setEditingRowId,
    setD, openMulti, addRowToList, editRow, removeRow, undoRemoveRow,
    saveAll, openEdit, deleteEntryWithCascade,
    num, int,
  } = useEggEntriesForm({
    devices, birds, eggEntries, flocks, initialDevice,
    addEntry, updateEntry, deleteEntry,
    addInvoice, deleteInvoice, addProduction, deleteProduction,
    onGoTo,
  });


  const suppliers = useMemo(() => (contacts || []).filter((p) => (p.roles || []).includes('supplier')), [contacts]);
  const allPersons = contacts || [];


  const breedsForBird = useMemo(
    () => breeds.filter(b => b.birdId === currentRow.birdId),
    [breeds, currentRow.birdId]
  );

  // ═══ محاسبه استفاده دستگاه در فرم ═══
  const draftUsage = useMemo(() => {
    const device = devices.find(d => d.id === multiDeviceId);
    if (!device) return { used: 0, total: 0, percent: 0 };
    const allEntries = eggEntries.map(x => ({ ...x, __birdName: (birds.find(b => b.id === x.birdId)?.name) || '' }));
    let used = 0;
    const refCap = Math.max(...(device.capacityByBird || []).map((c) => c.capacity || 0));
    if (refCap === 0) return { used: 0, total: 0, percent: 0 };
    // فعلی
    allEntries.forEach(e => {
      if (e.status === 'failed') return;
      const cap = (device.capacityByBird || []).find((c) => c.birdName === e.__birdName);
      if (!cap?.capacity) return;
      used += (e.count || 0) * (refCap / cap.capacity);
    });
    // draft
    draftRows.forEach(r => {
      const bird = birds.find(b => b.id === r.birdId);
      if (!bird) return;
      const cap = (device.capacityByBird || []).find((c) => c.birdName === bird.name);
      if (!cap?.capacity) return;
      used += (parseInt(toEn(r.count)) || 0) * (refCap / cap.capacity);
    });
    return {
      used: Math.round(used * 10) / 10,
      total: refCap,
      percent: Math.round((used / refCap) * 100),
    };
  }, [multiDeviceId, draftRows, eggEntries, birds, devices]);

  // ═══ Live Usage — شامل ردیف در حال تایپ ═══
  const liveUsage = useMemo(() => {
    const device = devices.find(d => d.id === multiDeviceId);
    if (!device) return null;
    const refCap = Math.max(...(device.capacityByBird || []).map((c) => c.capacity || 0));
    if (refCap === 0) return null;

    let used = 0;
    // ورودی‌های ثبت‌شده
    eggEntries.forEach(e => {
      if (e.status === 'failed') return;
      const birdName = (birds.find(b => b.id === e.birdId)?.name) || '';
      const cap = (device.capacityByBird || []).find((c) => c.birdName === birdName);
      if (!cap?.capacity) return;
      used += (e.count || 0) * (refCap / cap.capacity);
    });
    // ردیف‌های draft (به جز ردیفی که الان ویرایش می‌شه)
    draftRows.forEach(r => {
      if (editingRowId && r._id === editingRowId) return;
      const b = birds.find(x => x.id === r.birdId);
      if (!b) return;
      const cap = (device.capacityByBird || []).find((c) => c.birdName === b.name);
      if (!cap?.capacity) return;
      used += (parseInt(toEn(r.count)) || 0) * (refCap / cap.capacity);
    });
    // ردیف در حال ویرایش/تایپ
    const curCnt = parseInt(toEn(currentRow.count)) || 0;
    const curBird = birds.find(b => b.id === currentRow.birdId);
    if (curBird && curCnt > 0) {
      const cap = (device.capacityByBird || []).find((c) => c.birdName === curBird.name);
      if (cap?.capacity) {
        used += curCnt * (refCap / cap.capacity);
      }
    }

    return {
      used: Math.round(used * 10) / 10,
      total: refCap,
      percent: Math.round((used / refCap) * 100),
      remaining: Math.round((refCap - used) * 10) / 10,
    };
  }, [multiDeviceId, draftRows, eggEntries, birds, devices, currentRow.birdId, currentRow.count, editingRowId]);

  // ═══ فیلتر لیست ═══
  // فیلتر/مرتب (FilterBar)
  const config = useMemo(
    () => getIncEntriesConfig({
      devices: devices.map(d => ({ id: d.id, name: d.name })),
      birds: birds.map(b => ({ id: b.id, name: b.name })),
    }),
    [devices, birds]
  );
  const { filtered: list, filters, setFilter, clearFilter, sort, setSort, toggleSort,
          resetAll, hasActiveFilters, total, count } = useFilterSort<EggEntry>({
    items: eggEntries,
    filters: config.filterDefs,
    sorts: config.sortDefs,
    persistKey: config.persistKey,
    initialSort: config.initialSort,
  });
  const multiDevice = devices.find(d => d.id === multiDeviceId);

  const renderRowSummary = (row: DraftRow, idx: number) => {
    const bird = birds.find(b => b.id === row.birdId);
    const sellerName = (row.dealData.sellerId && (contacts.find((c) => c.id === row.dealData.sellerId) as any)?.name) || '';
    const partnerName = (row.dealData.partnerId && (contacts.find((c) => c.id === row.dealData.partnerId) as any)?.name) || '';
    const flockName = row.flockId ? flocks.find((f) => f.id === row.flockId)?.name : '';
    const consigneeName = (row.dealData.consigneeId && (contacts.find((c) => c.id === row.dealData.consigneeId) as any)?.name) || '';
    const lessorName = (row.dealData.lessorId && (contacts.find((c) => c.id === row.dealData.lessorId) as any)?.name) || '';
    const party = sellerName || partnerName || flockName || consigneeName || lessorName || '—';

    return (
      <div key={row._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 6, padding: 'var(--pad-normal)', background: 'var(--input-bg)', borderRadius: 'var(--r-sm)', marginBottom: 4 }}>
        <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0 }}>
          <span style={{ fontSize: 'var(--fs-sm)', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {toFa(idx + 1)}. {DEAL_LABEL[row.dealType]} • {bird?.name || '—'} • {toFa(row.count || 0)} تخم
          </span>
          <span style={{ fontSize: 'var(--fs-xs)', color: 'var(--muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {party} • {toFa(row.entryDate)}
          </span>
        </div>
        <button type="button" onClick={() => editRow(row)} aria-label="ویرایش ردیف" style={{ background: 'none', border: '1px solid var(--border)', borderRadius: 'var(--r-sm)', color: 'var(--text)', cursor: 'pointer', fontFamily: 'inherit', fontSize: 'var(--fs-sm)', padding: '6px 10px', minWidth: 36, minHeight: 36, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>✏️</button>
        <button type="button" onClick={() => removeRow(row._id)} aria-label="حذف ردیف" style={{ background: 'none', border: '1px solid var(--danger)', borderRadius: 'var(--r-sm)', color: 'var(--danger)', cursor: 'pointer', fontFamily: 'inherit', fontSize: 'var(--fs-sm)', padding: '6px 10px', minWidth: 36, minHeight: 36, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
      </div>
    );
  };

  return (
    <PageContainer>
      {undoRow && (
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '10px 14px', marginBottom: 8,
          background: 'var(--warn-soft)', border: '1px solid var(--warn)',
          borderRadius: 'var(--r-md)', fontSize: 'var(--fs-sm)',
        }}>
          <span>ردیف حذف شد</span>
          <button type="button" onClick={undoRemoveRow} aria-label="بازگردانی ردیف" style={{
            background: 'none', border: 'none', color: 'var(--warn)',
            fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
            fontSize: 'var(--fs-sm)', padding: '4px 10px',
          }}>بازگردانی</button>
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
            const std = breedStd.byBreedId(e.breedId || null);
            const totalDays = (_daysLookup(bird?.name) || 21);
            const expHatch = addDaysJalali(e.entryDate, totalDays);
            const remain = daysToHatch(expHatch);
            const isOpen = expandedId === e.id;
            return (
              <EggEntryCard
                key={e.id}
                entry={e}
                index={i}
                device={dev}
                bird={bird}
                breed={breed}
                flocks={flocks}
                contacts={contacts}
                hatches={hatches}
                standard={std}
                age={age}
                expectedHatch={expHatch}
                remain={remain}
                totalDays={totalDays}
                isOpen={isOpen}
                onToggle={() => setExpandedId(isOpen ? null : e.id)}
                onEdit={() => openEdit(e)}
                onDelete={async () => {
                  const ok = await showConfirmAsync('تأیید حذف', 'این ورودی تخم حذف شود؟', { danger: true });
                  if (!ok) return;
                  deleteEntryWithCascade(e.id);
                }}
              />
            );
          })}
          <Btn variant="primary" full onClick={openMulti}>+ ورود تخم</Btn>
        </>
      )}

      <EggEntryModal
        open={open}
        onClose={() => setOpen(false)}
        editingRowId={editingRowId}
        hideHatchTip={hideHatchTip}
        setHideHatchTip={setHideHatchTip}
        multiDeviceId={multiDeviceId}
        setMultiDeviceId={setMultiDeviceId}
        draftRows={draftRows}
        currentRow={currentRow}
        setCurrentRow={setCurrentRow}
        devices={devices}
        birds={birds}
        breeds={breeds}
        flocks={flocks}
        contacts={contacts}
        suppliers={suppliers}
        allPersons={allPersons}
        breedsForBird={breedsForBird}
        liveUsage={liveUsage}
        setD={setD}
        addRowToList={addRowToList}
        editRow={editRow}
        removeRow={removeRow}
        saveAll={saveAll}
        resetCurrentRow={() => { setEditingRowId(null); setCurrentRow({ ...makeRow(), birdId: birds[0]?.id || '', entryDate: todayJalali(), entryTime: nowTime() }); }}
      />
    </PageContainer>
  );
}


