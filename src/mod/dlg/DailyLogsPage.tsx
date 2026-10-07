/**
 * DailyLogsPage — ثبت روزانه (دمای سالن، آب، دان، تلفات)
 */
import { useSwipeTabs } from '../../shr/hooks/useSwipeTabs';
import { useFab } from '../../shr/hooks/useFab';
import { useState, useMemo, useEffect } from 'react';
import {
  useDlg, type DailyLog, type Death, type Vaccine,
  type Medication, type Activity, VENTILATION_LABEL, LITTER_LABEL,
  BEHAVIOR_LABEL, DISTRIBUTION_LABEL, SOUND_LABEL, DEATH_CAUSES,
  causeLabel, tempWarning, humidityWarning, waterFeedRatio,
  mortalityRate, avgWeight, sumWeight, cvWeight,
  totalWater
} from './store';
import { useFlk , isLayingReady, getAgeDays } from '../flk/store';
import { useSet } from '../set/store';
import { useFormat } from '../../shr/units';
import { useWhs, UNIT_LABEL } from '../whs/store';
import { useBrd } from '../brd/store';
import { useFed } from '../fed/store';
import { useHal } from '../hal/store';
import { useEgg } from '../egg/store';
import { feedSystemFromHall, waterSystemFromHall, FEED_SYSTEM_LABEL, WATER_SYSTEM_LABEL } from '../../shr/utils/systemType';
import SmartSelect from '../../shr/components/SmartSelect';
import { Btn, BtnRow, Empty, Field,
  Grid2, Grid3, Input, Modal,
  NumField, PageContainer, PercentField, Select,
  Textarea, ErrorBox } from '../../shr/components/ui';
import HelpBanner from '../../shr/components/HelpBanner';
import { useMultiSelect } from '../../shr/multiSelect/useMultiSelect';
import { useFilterSort, FilterBar, getDlgLogsConfig } from '../../shr/filter';
import MultiSelectBar from '../../shr/multiSelect/MultiSelectBar';
import DatePicker from '../../shr/components/DatePicker';
import TimePicker from '../../shr/components/TimePicker';
import { toFa, toEn } from '../../shr/utils/fa';
import { showAlert, showConfirmAsync } from '../../cor/store/dialog';
import { showToast, toastMsg } from '../../cor/store/toast';
import UndoBar from '../../cor/ui/UndoBar';
import { checkStock } from './api/checkStock';
import { buildLogData } from './api/buildData';
import { decideEggAction } from './api/toEgg';
import FormModal from './components/FormModal';
import { useDlgForm } from './hooks/useDlgForm';
import { useDlgSave } from './hooks/useDlgSave';
import LogCard from './components/LogCard';
import type { F } from './types';
import { buildFeedMovements, buildVaccineMovement, buildMedicationMovement } from './api/toWhs';
import { format as formatJ } from 'date-fns-jalali';
import { logAction } from '../../cor/logger/auditLog';
import { bus } from '../../cor/events';
import { useValidation } from '../../shr/validation/useValidation';
import { createDlgSchema } from '../../shr/validation/rules/dlg';



type TabId = 'today' | 'history' | 'archive';

export default function DailyLogsPage() {
  const { logs, add, update, remove, archive, restore } = useDlg();
  const vaccineEnabled = useSet(s => (s as any).features?.vaccine !== false);
  const medicineEnabled = useSet(s => (s as any).features?.medicine !== false);
  const fmt = useFormat();
  const { flocks } = useFlk();
  const { birds, breeds } = useBrd();
  const { items: whsItems, addMovement, deleteMovement } = useWhs();
  const { formulas, ingredients } = useFed();
  const { halls } = useHal();
  const { addProduction, updateProduction, deleteProduction, findByLogId } = useEgg();

  const feedItems = whsItems.filter(x => x.category === 'feed');
  const vaccineItems = whsItems.filter(x => x.category === 'vaccine');
  const medicineItems = whsItems.filter(x => x.category === 'medicine' || x.category === 'herbal');

  const [tab, setTab] = useState<TabId>('today');
  const swipeRef = useSwipeTabs(['today', 'history', 'archive'], tab, (id) => setTab(id as TabId));
  const [undoData, setUndoData] = useState<{ log: any | any[] } | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const activeFlocks = flocks.filter(f => f.status === 'active' && !f.paused);
  const today = new Date();
  const todayStr = formatJ(today, 'yyyy/MM/dd');

  // ⭐ hook فرم — مدیریت state و منطق
  const {
    form, setForm, open, setOpen, saving, setSaving, err, setErr,
    num, int, detectSystems,
    openNew, openEdit, onFlockChange,
    selectedFlock, isLayerType, isFlockMature, isLayerFlock, flockAliveCount,
  } = useDlgForm({ activeFlocks, halls, todayStr });

  // ⭐ hook ذخیره‌سازی + حذف
  const { save, deleteLog } = useDlgSave({
    form, setForm, saving, setSaving, setErr, setOpen,
    selectedFlock, flockAliveCount, isLayerFlock, num, int,
  });

  const handleDeleteLog = async (l: DailyLog) => {
    const { ok, undoData: log } = await deleteLog(l);
    if (!ok || !log) return;
    setUndoData({ log });
    setTimeout(() => setUndoData((cur: any) => cur && cur.log.id === log.id ? null : cur), 6000);
    remove(l.id);
    toastMsg.deleted('ثبت');
  };

  const todaysLogs = useMemo(() => logs.filter(l => l.date === todayStr && (l.status || 'active') === 'active'), [logs, todayStr]);
  const historicalLogs = useMemo(() => logs.filter(l => l.date !== todayStr && (l.status || 'active') === 'active').sort((a, b) => b.date.localeCompare(a.date)), [logs, todayStr]);

  const tabs: { id: TabId; label: string }[] = [
    { id: 'today', label: 'امروز' },
    { id: 'history', label: 'تاریخچه' },
    { id: 'archive', label: 'آرشیو' }
  ];

  const undoDeleteLog = () => {
    if (undoData == null) return;
    const logArr: any[] = Array.isArray(undoData.log) ? undoData.log : [undoData.log];
    try {
      for (const logToRestore of logArr) {
        add(logToRestore);
        try {
          bus.emit('dlg:deaths:recorded', {
            logId: logToRestore.id,
            flockId: logToRestore.flockId,
            date: logToRestore.date,
            count: logToRestore.deathsCount || 0,
            deaths: logToRestore.deaths || [],
            isEdit: false,
          }, { source: 'dlg/undoDelete' });
        } catch (e) { /* silent */ }
      }
      toastMsg.restoredBulk(logArr.length, 'ثبت')
    } catch (err) {
      toastMsg.error('بازگردانی ناموفق')
    }
    setUndoData(null);
  };

  // ─── Multi-Select ───
  const ms = useMultiSelect({
    items: logs,
    getId: (l: any) => l.id,
    onDelete: async (ids: string[]) => {
      const ok = await showConfirmAsync('حذف گروهی', toFa(ids.length) + ' ثبت روزانه حذف شوند؟', { danger: true });
      if (!ok) return;
      const backups: any[] = [];
      for (const id of ids) {
        const it = logs.find(x => x.id === id);
        if (!it) continue;
        backups.push(it);
        try { remove(id); } catch {}
      }
      if (backups.length > 0) {
        setUndoData({ log: backups });
        setTimeout(() => setUndoData((cur: any) => cur && Array.isArray(cur.log) && cur.log.length === backups.length ? null : cur), 8000);
      }
      toastMsg.deletedBulk(backups.length, 'ثبت')
      logAction('delete', 'dlg', 'حذف گروهی ثبت روزانه: ' + backups.length);
    },
    onArchive: async (ids: string[]) => {
      const ok = await showConfirmAsync('آرشیو گروهی', toFa(ids.length) + ' ثبت آرشیو شوند؟');
      if (!ok) return;
      for (const id of ids) { try { archive(id); } catch {} }
      toastMsg.archivedBulk(ids.length, 'ثبت')
    },
  });

  useEffect(() => {
    if (ms.selectionMode) setExpandedId(null);
  }, [ms.selectionMode]);

  useFab({ label: 'ثبت امروز', onClick: openNew });



  // ═══ اعتبارسنجی زنده ═══
  const validationContext = {
    flockCount: selectedFlock?.initialCount || 0,
    flockCurrentCount: selectedFlock?.currentCount || flockAliveCount,
    flockType: selectedFlock?.type,
  };
  const { errors: vErrors } = useValidation(
    createDlgSchema(validationContext),
    {
      flockId: form.flockId || '',
      date: form.date || '',
      entryTime: form.entryTime || '',
      temperature: num(form.temperature),
      temperatureMin: num(form.temperatureMin),
      temperatureMax: num(form.temperatureMax),
      humidity: num(form.humidity),
      humidityMin: num(form.humidityMin),
      humidityMax: num(form.humidityMax),
      lightHours: int(form.lightHours),
      feedAmount: num(form.feedAmount),
      feedRemaining: num(form.feedRemaining),
      feedSourceId: form.feedSourceId || '',
      waterAmount: num(form.waterAmount),
      waterFillCount: int(form.waterFillCount),
      waterFillVolume: num(form.waterFillVolume),
      eatingEggs: int(form.eatingEggs) ?? 0,
      fertileEggs: int(form.fertileEggs) ?? 0,
      brokenEggs: int(form.brokenEggs) ?? 0,
      otherEggs: int(form.otherEggs) ?? 0,
      brokenTarget: (form as any).brokenTarget || 'consumption',
      otherTarget: (form as any).otherTarget || 'consumption',
      deathsCount: form.deaths.reduce((a, x) => a + (x.count || 0), 0),
      deaths: form.deaths,
      vaccines: form.vaccines,
      medications: form.medications,
      weightSamples: form.weightSamples.map(w => ({ id: w.id, weight: num(w.weight) || 0 })),
      activities: form.activities,
      notes: form.notes || '',
    },
  );


  const renderLogCard = (l: DailyLog, i: number) => {
    const flock = flocks.find(f => f.id === l.flockId);
    const bird = flock ? birds.find(b => b.id === flock.birdId) : null;
    return (
      <LogCard
        key={l.id}
        log={l}
        index={i}
        flock={flock}
        birdName={bird?.name}
        isOpen={!ms.selectionMode && expandedId === l.id}
        selectionMode={ms.selectionMode}
        vaccineEnabled={vaccineEnabled}
        medicineEnabled={medicineEnabled}
        ms={ms}
        onToggle={() => setExpandedId(expandedId === l.id ? null : l.id)}
        onEdit={() => openEdit(l)}
        onArchive={() => archive(l.id)}
        onRestore={() => restore(l.id)}
        onDelete={() => handleDeleteLog(l)}
      />
    );
  };;

  const archivedLogs = useMemo(
    () => logs.filter(l => l.status === 'archived').sort((a, b) => b.date.localeCompare(a.date)),
    [logs]
  );

  // مرحله ۱: tab (نگه‌داشته شده)
  const tabFiltered = tab === 'today' ? todaysLogs : tab === 'history' ? historicalLogs : archivedLogs;

  // مرحله ۲: FilterBar (فیلتر عمیق)
  const config = useMemo(
    () => getDlgLogsConfig({
      flocks: activeFlocks.map(f => ({ id: f.id, name: f.name })),
    }),
    [activeFlocks]
  );
  const { filtered: currentList, filters, setFilter, clearFilter, sort, setSort, toggleSort,
          resetAll, hasActiveFilters, total, count } = useFilterSort<DailyLog>({
    items: tabFiltered,
    filters: config.filterDefs,
    sorts: config.sortDefs,
    persistKey: config.persistKey,
    initialSort: config.initialSort,
  });

  return (
    <div ref={swipeRef} style={{ touchAction: 'pan-y', overscrollBehavior: 'contain', minHeight: 'calc(100vh - 120px)' }}>
      <div style={{
        display: 'flex', gap: 0, borderBottom: '1px solid var(--border)',
        padding: '0 12px', background: 'var(--header-bg)',
        position: 'sticky', top: 52, zIndex: 11
      }}>
        {tabs.map(t => (
          <div key={t.id} onClick={() => setTab(t.id)} style={{
            padding: '11px 14px', fontSize: 'var(--fs-base)', fontWeight: 600,
            color: tab === t.id ? 'var(--accent)' : 'var(--muted)',
            cursor: 'pointer', position: 'relative',
            display: 'flex', alignItems: 'center', gap: 5
          }}>
            {t.label}
            <span style={{
              fontSize: 12,
              background: tab === t.id ? 'var(--accent-soft)' : 'var(--input-bg)',
              color: tab === t.id ? 'var(--accent)' : 'var(--muted)',
              padding: '1px 5px', borderRadius: 8, fontWeight: 700
            }}>
              {toFa(
                t.id === 'today' ? todaysLogs.length
                : t.id === 'history' ? historicalLogs.length
                : archivedLogs.length
              )}
            </span>
            {tab === t.id && <div style={{ position: 'absolute', bottom: 0, right: 14, left: 14, height: 3, background: 'var(--accent)', borderRadius: '3px 3px 0 0' }} />}
          </div>
        ))}
      </div>

      <PageContainer>
      {undoData && (
        <UndoBar
          label="ثبت حذف شد"
          onUndo={undoDeleteLog}
          onDismiss={() => setUndoData(null)}
        />
      )}
        <HelpBanner
          id="dlg-intro"
          icon="📋"
          title="ثبت روزانه هر گله"
          description="دما، رطوبت، دان، آب، تلفات، وزن‌کشی و تخم را ثبت کنید. برای هر گله یک ثبت جدا انجام دهید."
          tone="info"
        />
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
        {!ms.selectionMode && currentList.length > 1 && (
        <div style={{ fontSize: '10px', color: 'var(--dim)', textAlign: 'center', paddingBottom: 2 }}>
          برای انتخاب چندتایی، روی یک کارت نگه دارید
        </div>
      )}

      {ms.selectionMode && currentList.length > 1 && (
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 6 }}>
          <button type="button"
            onClick={ms.selectedIds.size === currentList.length ? ms.clearSelection : ms.selectAll}
            style={{ padding: '4px 10px', background: 'var(--input-bg)', border: '1px solid var(--border)', borderRadius: 'var(--r-sm)', color: 'var(--muted)', fontFamily: 'inherit', fontSize: '10px', fontWeight: 600, cursor: 'pointer' }}>
            {ms.selectedIds.size === currentList.length ? 'لغو انتخاب همه' : 'انتخاب همه'}
          </button>
        </div>
      )}

      <MultiSelectBar ms={ms} deleteLabel="حذف" archiveLabel="آرشیو" />

      {ms.selectionMode && <div style={{ height: 90 }} />}

      {currentList.length === 0 ? (
          <Empty
            icon={<svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>}
            title={tab === 'today' ? 'امروز ثبتی ندارید' : 'تاریخچه خالی است'}
            desc={tab === 'today' ? 'اولین ثبت امروز را انجام دهید.' : 'پس از ثبت اولین روز، اینجا نمایش داده می‌شود.'}
            action={<Btn variant="primary" onClick={openNew}>+ ثبت امروز</Btn>}
          />
        ) : (
          <>
            {currentList.map((l, i) => renderLogCard(l, i))}
            
          </>
        )}

        <FormModal
        open={open}
        onClose={() => setOpen(false)}
        form={form}
        setForm={setForm}
        save={save}
        saving={saving}
        err={err}
        vErrors={vErrors}
        selectedFlock={selectedFlock}
        flockAliveCount={flockAliveCount}
        isLayerFlock={isLayerFlock}
        isLayerType={isLayerType}
        isFlockMature={isFlockMature}
        vaccineEnabled={vaccineEnabled}
        medicineEnabled={medicineEnabled}
        onFlockChange={onFlockChange}
      />
      </PageContainer>
    </div>
  );
}
