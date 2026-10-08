/**
 * CandlingsPage — کندلینگ با Multi-select و تجمیع
 */
import { useState, useEffect, useMemo } from 'react';
import { useFab } from '../../shr/hooks/useFab';
import { useInc, type Candling } from './store';
import { useBrd } from '../brd/store';
import { Btn, BtnRow, Empty, Field, Grid2, Input, Modal, NumField, PageContainer, SectionTitle, Select, Tag, ErrorBox } from '../../shr/components/ui';
import ExpandableCard, { InfoItem, StatBox, Dot } from '../../shr/components/ExpandableCard';
import DatePicker from '../../shr/components/DatePicker';
import { toFa, toEn } from '../../shr/utils/fa';
import { showAlert, showConfirmAsync } from '../../cor/store/dialog';
import { showToast, toastMsg } from '../../cor/store/toast';
import { useFilterSort, FilterBar, getIncCandlingsConfig } from '../../shr/filter';
import { todayJalali } from './helpers';
import { useIncubationProfile } from './hooks';
import { calcAvailableBase, aggregateCandlings, calcSummary } from './api/calc';
import { useCandlingForm, type EntryData, emptyData } from './hooks/useCandlingForm';
import { logAction } from '../../cor/logger/auditLog';
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
      showAlert(toFa(result.savedCount) + ' کندلینگ ثبت شد', '✅ موفق');
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
          {grouped.map(({ entryId, list, agg, total, entryTotal, fertilePercent, lossPercent, deadPercent }, i) => {
            const entry = _entriesById[entryId];
            const bird = entry ? _birdsById[entry.birdId] : null;
            const dev = entry ? _devicesById[entry.deviceId] : null;
            const isOpen = expandedId === entryId;
            const lossTone = lossPercent > 20 ? 'danger' : lossPercent > 10 ? 'warn' : 'green';

            return (
              <ExpandableCard key={entryId} accent="accent" index={toFa(i + 1)} iconEmoji="🔍"
                title={bird?.name || '—'}
                subtitle={(dev?.name || '—') + ' · ' + toFa(entryTotal) + ' تخم · ' + toFa(entry?.entryDate || '—')}
                isOpen={isOpen} onToggle={() => setExpandedId(isOpen ? null : entryId)}
                badge={<Tag tone={lossTone}>تلفات {toFa(lossPercent.toFixed(0))}٪</Tag>}
                stats={<>
                  <StatBox icon="🧬" label="نطفه" value={toFa(Math.round(fertilePercent)) + '٪'} tone="accent" />
                  <Dot />
                  <StatBox icon="📊" label="کندلینگ" value={toFa(list.length)} />
                </>}
              >
                {/* ═══ دکمه‌های روز ═══ */}
                <div style={{ fontSize: 'var(--fs-base)', color: 'var(--text)', fontWeight: 700, letterSpacing: '.3px' }}><span style={{ fontSize: '1.05em', lineHeight: 1, display: 'inline-block', marginLeft: 4 }}>📅</span> کندلینگ‌های این ورودی</div>
                <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                  {list.map((c, idx) => (
                    <div key={c.id} style={{ position: 'relative' }}>
                      <button
                        type="button"
                        aria-label={'ویرایش کندلینگ روز ' + c.stage}
                        onClick={() => openEdit(c)}
                        title={toFa(c.date)}
                        style={{
                          padding: '6px 12px 6px 28px',
                          background: 'var(--accent-soft)',
                          border: '1px solid var(--accent-border)',
                          borderRadius: 'var(--r-sm)',
                          fontSize: 'var(--fs-xs)',
                          fontWeight: 700,
                          color: 'var(--accent)',
                          cursor: 'pointer',
                          fontFamily: 'inherit',
                        }}
                      >
                        ✓ روز {toFa(c.stage)}
                      </button>
                      <button
                        type="button"
                        onClick={async () => {
                          const subsequent = list.filter(x => x.stage > c.stage);
                          const msg = subsequent.length > 0
                            ? 'این کندلینگ و ' + toFa(subsequent.length) + ' کندلینگ بعدی حذف می‌شوند.\n\nادامه؟'
                            : 'این کندلینگ حذف شود؟';
                          if (await showConfirmAsync('تأیید', msg)) {
                            deleteCandling(c.id);
                            subsequent.forEach(s => deleteCandling(s.id));
                          }
                        }}
                        title="بازگردانی و حذف بعدی‌ها" aria-label="حذف کندلینگ"
                        style={{
                          position: 'absolute',
                          top: '50%',
                          left: 4,
                          transform: 'translateY(-50%)',
                          background: 'var(--danger-soft)',
                          border: '1px solid var(--danger)',
                          color: 'var(--danger)',
                          cursor: 'pointer',
                          fontSize: 12,
                          lineHeight: 1,
                          padding: '2px 4px',
                          borderRadius: 'var(--r-sm)',
                          fontWeight: 700,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          minWidth: 16,
                          height: 36,
                        }}
                      >✕</button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => handleOpenNew(entryId)}
                    style={{
                      padding: 'var(--pad-tight)',
                      background: 'var(--input-bg)',
                      border: '1px dashed var(--border)',
                      borderRadius: 'var(--r-sm)',
                      fontSize: 'var(--fs-xs)',
                      fontWeight: 700,
                      color: 'var(--muted)',
                      cursor: 'pointer',
                      fontFamily: 'inherit',
                    }}
                  >
                    + کندلینگ جدید
                  </button>
                </div>

                {/* ═══ تجمیع با درصد ═══ */}
                <div style={{ fontSize: 'var(--fs-base)', color: 'var(--text)', fontWeight: 700, letterSpacing: '.3px' }}><span style={{ fontSize: '1.05em', lineHeight: 1, display: 'inline-block', marginLeft: 4 }}>📊</span> تجمیع ({toFa(list.length)} کندلینگ)</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--fs-sm)', padding: 'var(--pad-normal)', background: 'var(--input-bg)', borderRadius: 'var(--r-sm)' }}>
                    <span style={{ color: 'var(--muted)' }}><span style={{ fontSize: '1.05em', lineHeight: 1, display: 'inline-block', marginLeft: 4 }}>🧬</span> نطفه‌داری</span>
                    <span style={{ fontWeight: 700, color: 'var(--accent)' }}>{toFa(fertilePercent.toFixed(1))}٪</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--fs-sm)', padding: 'var(--pad-normal)', background: 'var(--input-bg)', borderRadius: 'var(--r-sm)' }}>
                    <span style={{ color: 'var(--muted)' }}>📉 تلفات کل</span>
                    <span style={{ fontWeight: 700, color: lossPercent > 10 ? 'var(--danger)' : 'var(--text)' }}>{toFa(lossPercent.toFixed(1))}٪</span>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4 }}>
                    <div style={{ padding: 'var(--pad-tight)', background: 'var(--input-bg)', borderRadius: 'var(--r-sm)', fontSize: 'var(--fs-xs)', display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--muted)' }}>✅ سالم</span>
                      <span style={{ fontWeight: 700 }}>{toFa(agg.alive)}</span>
                    </div>
                    <div style={{ padding: 'var(--pad-tight)', background: 'var(--input-bg)', borderRadius: 'var(--r-sm)', fontSize: 'var(--fs-xs)', display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--muted)' }}>⚪ بی‌نطفه</span>
                      <span style={{ fontWeight: 700 }}>{toFa(agg.infertile)}</span>
                    </div>
                    <div style={{ padding: 'var(--pad-tight)', background: 'var(--input-bg)', borderRadius: 'var(--r-sm)', fontSize: 'var(--fs-xs)', display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--muted)' }}>💀 مرده</span>
                      <span style={{ fontWeight: 700 }}>{toFa(agg.dead)}</span>
                    </div>
                    <div style={{ padding: 'var(--pad-tight)', background: 'var(--input-bg)', borderRadius: 'var(--r-sm)', fontSize: 'var(--fs-xs)', display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--muted)' }}><span style={{ fontSize: '1.05em', lineHeight: 1, display: 'inline-block', marginLeft: 4 }}>🥚</span> شکسته</span>
                      <span style={{ fontWeight: 700 }}>{toFa(agg.broken)}</span>
                    </div>
                  </div>
                </div>

                {/* ═══ نوار پیشرفت بصری ═══ */}
                {total > 0 && (
                  <div style={{ display: 'flex', height: 36, borderRadius: 4, overflow: 'hidden', background: 'var(--input-bg)' }}>
                    <div style={{ width: (agg.alive / total * 100) + '%', background: 'var(--accent)' }} />
                    <div style={{ width: (agg.infertile / total * 100) + '%', background: 'var(--warn)' }} />
                    <div style={{ width: (agg.dead / total * 100) + '%', background: 'var(--danger)' }} />
                    <div style={{ width: (agg.broken / total * 100) + '%', background: 'var(--muted)' }} />
                  </div>
                )}
              </ExpandableCard>
            );
          })}
          
        </>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title={editingId ? '✏️ ویرایش کندلینگ' : '🔍 ثبت کندلینگ'}
        footer={<BtnRow><Btn variant="primary" onClick={handleSave} disabled={Object.keys(vErrors).length > 0}>ذخیره ({toFa(editingId ? 1 : selectedIds.size)})</Btn><Btn onClick={close}>لغو</Btn></BtnRow>}>

        <SectionTitle><span style={{ fontSize: '1.05em', lineHeight: 1, display: 'inline-block', marginLeft: 4 }}>📅</span> زمان‌بندی</SectionTitle>
        {_firstSelectedBirdName && _profile.totalDays ? (
          <div style={{
            fontSize: 'var(--fs-xs)',
            padding: '6px 10px',
            background: 'var(--accent-soft)',
            border: '1px solid var(--accent-border)',
            borderRadius: 'var(--r-sm)',
            color: 'var(--accent)',
            fontWeight: 700,
            display: 'flex',
            justifyContent: 'space-between',
          }}>
            <span>🐣 {_firstSelectedBirdName}</span>
            <span>مدت {toFa(_profile.totalDays)} روز · قفل {toFa(_profile.lockdownDay)}</span>
          </div>
        ) : null}
        <Grid2>
          <Field label="روز انکوباسیون" required hint="۷، ۱۰، ۱۵...">
            <NumField value={modalDay} onChange={e => setModalDay(e.target.value)} unit="روز" min={1} max={30} autoClamp />
          </Field>
          <Field label="تاریخ" required>
            <DatePicker value={modalDate} onChange={v => setModalDate(v)} placeholder="انتخاب"  autoToday />
          </Field>
        </Grid2>

        <SectionTitle><span style={{ fontSize: '1.05em', lineHeight: 1, display: 'inline-block', marginLeft: 4 }}>📦</span> انتخاب ورودی‌ها</SectionTitle>
        <Field label="فیلتر دستگاه">
          <Select value={modalDevice} onChange={e => { setModalDevice(e.target.value); setSelectedIds(new Set()); setEntriesData({}); }}>
            <option value="">— همه دستگاه‌ها —</option>
            {devices.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
          </Select>
        </Field>

        {availableEntries.length === 0 ? (
          <div style={{ fontSize: 'var(--fs-sm)', color: 'var(--muted)', padding: 10, textAlign: 'center', background: 'var(--input-bg)', borderRadius: 'var(--r-md)' }}>
            ورودی‌ای برای این دستگاه نیست
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {availableEntries.map(e => {
              const bird = _birdsById[e.birdId];
              const isSelected = selectedIds.has(e.id);
              const d = dataFor(e.id);
              const sum = (parseInt(toEn(d.infertile))||0) + (parseInt(toEn(d.dead))||0) + (parseInt(toEn(d.broken))||0);
              const dayNum = parseInt(toEn(modalDay)) || 0;
              const baseInfo = calcAvailableBase(e.id, dayNum, null, candlings, e.count || 0);
              const remaining = baseInfo.base - sum;
              const existingCandlings = candlings.filter(c => c.eggEntryId === e.id);
              const alreadyAgg = existingCandlings.reduce((acc, c) => ({
                alive: acc.alive + (c.alive || 0),
                infertile: acc.infertile + (c.infertile || 0),
                dead: acc.dead + (c.dead || 0),
                broken: acc.broken + (c.broken || 0),
              }), { alive: 0, infertile: 0, dead: 0, broken: 0 });

              return (
                <div key={e.id} style={{
                  border: '1px solid ' + (isSelected ? 'var(--accent-border)' : 'var(--border)'),
                  background: isSelected ? 'var(--accent-soft)' : 'var(--card)',
                  borderRadius: 'var(--r-md)',
                  padding: 10,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 8,
                }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                    <input type="checkbox" checked={isSelected} onChange={() => toggleEntry(e.id)} aria-label="انتخاب این ورودی" style={{ width: 20, height: 20, accentColor: 'var(--accent)', cursor: 'pointer', flexShrink: 0 }} />
                    <span style={{ flex: 1, fontSize: 'var(--fs-sm)', fontWeight: 700 }}>
                      {bird?.name || '—'} · {toFa(e.count || 0)} تخم
                    </span>
                    <span style={{ fontSize: 'var(--fs-xs)', color: 'var(--muted)' }}>{toFa(e.entryDate)}</span>
                  </label>

                  {existingCandlings.length > 0 && (
                    <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--muted)', padding: '4px 8px', background: 'var(--input-bg)', borderRadius: 'var(--r-sm)' }}>
                      تجمیع قبلی: سالم {toFa(alreadyAgg.alive)} · بی‌نطفه {toFa(alreadyAgg.infertile)} · مرده {toFa(alreadyAgg.dead)}
                    </div>
                  )}

                  {/* مبنا */}
                  <div style={{
                    fontSize: 'var(--fs-xs)',
                    padding: 'var(--pad-tight)',
                    background: 'var(--accent-soft)',
                    border: '1px solid var(--accent-border)',
                    borderRadius: 'var(--r-sm)',
                    color: 'var(--accent)',
                    fontWeight: 700,
                    display: 'flex',
                    justifyContent: 'space-between',
                  }}>
                    <span>🎯 مبنای این کندلینگ:</span>
                    <span>{toFa(baseInfo.base)} تخم ({baseInfo.source})</span>
                  </div>

                  {isSelected && (
                    <>
                      <Grid2>
                        <Field label="بی‌نطفه"><NumField placeholder="۰" value={d.infertile} onChange={ev => updateEntryData(e.id, { infertile: ev.target.value })} max={e.count || 0} min={0} unit="عدد" autoClamp /></Field>
                        <Field label="سالم" hint="خودکار">
                          {(() => {
                            const _inf = parseInt(toEn(d.infertile)) || 0;
                            const _dead = parseInt(toEn(d.dead)) || 0;
                            const _brk = parseInt(toEn(d.broken)) || 0;
                            const _base = baseInfo.base || 0;
                            const _alive = Math.max(0, _base - _inf - _dead - _brk);
                            const _over = (_inf + _dead + _brk) > _base;
                            return (
                              <div style={{
                                height: 38, display: "flex", alignItems: "center", justifyContent: "flex-end",
                                padding: "0 12px",
                                background: _over ? "var(--danger-soft)" : "var(--accent-soft)",
                                border: "1px solid " + (_over ? "var(--danger)" : "var(--accent-border)"),
                                borderRadius: "var(--r-md)",
                                fontSize: "var(--fs-base)", fontWeight: 700,
                                color: _over ? "var(--danger)" : "var(--accent)",
                              }}>{toFa(_alive)} عدد</div>
                            );
                          })()}
                        </Field>
                      </Grid2>
                      <Grid2>
                        <Field label="مرده"><NumField placeholder="۰" value={d.dead} onChange={ev => updateEntryData(e.id, { dead: ev.target.value })} max={e.count || 0} min={0} unit="عدد" autoClamp /></Field>
                        <Field label="شکسته"><NumField placeholder="۰" value={d.broken} onChange={ev => updateEntryData(e.id, { broken: ev.target.value })} max={e.count || 0} min={0} unit="عدد" autoClamp /></Field>
                      </Grid2>

                      <div style={{
                        padding: 'var(--pad-tight)',
                        background: remaining < 0 ? 'var(--danger-soft)' : remaining === 0 ? 'var(--accent-soft)' : 'var(--input-bg)',
                        border: '1px solid ' + (remaining < 0 ? 'var(--danger)' : remaining === 0 ? 'var(--accent-border)' : 'var(--border)'),
                        borderRadius: 'var(--r-sm)',
                        fontSize: 'var(--fs-xs)',
                        color: remaining < 0 ? 'var(--danger)' : remaining === 0 ? 'var(--accent)' : 'var(--text)',
                        fontWeight: 700,
                        textAlign: 'center',
                      }}>
                        مجموع تلفات: {toFa(sum)} از {toFa(baseInfo.base)}
                        {remaining > 0 && ' · باقی — ' + toFa(remaining)}
                        {remaining < 0 && ' — بیشتر از مبنای مرحله قبل!'}
                        {remaining === 0 && ' ✅ کامل'}
                      </div>

                      <Grid2>
                        <Field label="دلیل بی‌نطفه">
                          <Select value={d.infertileReason} onChange={ev => updateEntryData(e.id, { infertileReason: ev.target.value })}>
                            {INFERTILE_REASONS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                          </Select>
                        </Field>
                        <Field label="دلیل مرگ">
                          <Select value={d.deadReason} onChange={ev => updateEntryData(e.id, { deadReason: ev.target.value })}>
                            {DEAD_REASONS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                          </Select>
                        </Field>
                      </Grid2>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        )}

        <ErrorBox>{err}</ErrorBox>
      </Modal>

    </PageContainer>
  );
}
