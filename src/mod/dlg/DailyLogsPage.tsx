/**
 * DailyLogsPage — ثبت روزانه (carousel tabs مثل hal)
 */
import { useState, useMemo } from 'react';
import { useDlg, type DailyLog } from './store';
import { useFlk } from '../flk/store';
import { useSet } from '../set/store';
import { useWhs } from '../whs/store';
import { useBrd } from '../brd/store';
import { useFed } from '../fed/store';
import { useHal } from '../hal/store';
import { useEgg } from '../egg/store';
import { useFormat } from '../../shr/units';
import { useCarousel } from '../../shr/hooks/useCarousel';
import { useValidation } from '../../shr/validation/useValidation';
import { useFormErrors } from '../../shr/hooks/useFormErrors';
import { createDlgSchema } from '../../shr/validation/rules/dlg';
import { getDlgLogsConfig } from '../../shr/filter';
import { toFa } from '../../shr/utils/fa';
import { toastMsg } from '../../cor/store/toast';
import { format as formatJ } from 'date-fns-jalali';
import FormModal from './components/FormModal';
import DlgTabPanel from './components/DlgTabPanel';
import { useDlgForm } from './hooks/useDlgForm';
import { useDlgSave } from './hooks/useDlgSave';

type TabId = 'today' | 'history' | 'archive';

export default function DailyLogsPage() {
  const { logs, add, remove } = useDlg();
  const vaccineEnabled = useSet(s => s.features?.vaccine !== false);
  const medicineEnabled = useSet(s => s.features?.medicine !== false);
  const fmt = useFormat();
  const { flocks } = useFlk();
  const { birds, breeds } = useBrd();
  const { items: whsItems } = useWhs();
  const { formulas: _formulas, ingredients: _ingredients } = useFed();
  const { halls } = useHal();
  const { addProduction: _addProduction, updateProduction: _updateProduction, deleteProduction: _deleteProduction, findByLogId: _findByLogId } = useEgg();

  const [tab, setTab] = useState<TabId>('today');

  const activeFlocks = useMemo(
    () => flocks.filter(f => f.status === 'active' && !f.paused),
    [flocks],
  );
  const today = new Date();
  const todayStr = formatJ(today, 'yyyy/MM/dd');

  // ⭐ hook فرم
  const {
    form, setForm, open, setOpen, saving, setSaving, err, setErr,
    num, int,
    openNew, openEdit, onFlockChange,
    selectedFlock, isLayerType, isFlockMature, isLayerFlock, flockAliveCount,
  } = useDlgForm({ activeFlocks, halls, todayStr });

  // ⭐ hook ذخیره‌سازی
  const { save, deleteLog } = useDlgSave({
    form, setForm, saving, setSaving, setErr, setOpen,
    selectedFlock, flockAliveCount, isLayerFlock, num, int,
  });

  const handleDeleteLog = async (l: DailyLog): Promise<DailyLog | null> => {
    const { ok, undoData: log } = await deleteLog(l);
    if (!ok || !log) return null;
    remove(l.id);
    toastMsg.deleted('ثبت');
    return log as DailyLog;
  };

  // ─── فیلترها ───
  const todaysLogs = useMemo(
    () => logs.filter(l => l.date === todayStr && (l.status || 'active') === 'active'),
    [logs, todayStr],
  );
  const historicalLogs = useMemo(
    () => logs.filter(l => l.date !== todayStr && (l.status || 'active') === 'active').sort((a, b) => b.date.localeCompare(a.date)),
    [logs, todayStr],
  );
  const archivedLogs = useMemo(
    () => logs.filter(l => l.status === 'archived').sort((a, b) => b.date.localeCompare(a.date)),
    [logs],
  );

  // ─── config مشترک ───
  const config = useMemo(
    () => getDlgLogsConfig({ flocks: activeFlocks.map(f => ({ id: f.id, name: f.name })) }),
    [activeFlocks],
  );

  // ─── اعتبارسنجی ───
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
      brokenTarget: form.brokenTarget || 'consumption',
      otherTarget: form.otherTarget || 'consumption',
      deathsCount: form.deaths.reduce((a, x) => a + (x.count || 0), 0),
      deaths: form.deaths,
      vaccines: form.vaccines,
      medications: form.medications,
      weightSamples: form.weightSamples.map(w => ({ id: w.id, weight: num(w.weight) || 0 })),
      activities: form.activities,
      notes: form.notes || '',
    },
  );
  const { showError, markTouched, attemptSave } = useFormErrors(vErrors);

  // ─── carousel ───
  const tabIds: TabId[] = ['today', 'history', 'archive'];
  const { containerRef, trackRef, setInstant } = useCarousel(
    tabIds,
    tab,
    (id) => setTab(id as TabId),
  );

  const handleSave = () => {
    attemptSave();
    save();
  };

  const tabCount = (t: TabId) =>
    t === 'today' ? todaysLogs.length :
    t === 'history' ? historicalLogs.length :
    archivedLogs.length;

  const tabs: { id: TabId; label: string }[] = [
    { id: 'today', label: 'امروز' },
    { id: 'history', label: 'تاریخچه' },
    { id: 'archive', label: 'آرشیو' },
  ];

  return (
    <div>
      {/* Tab Bar */}
      <div style={{
        display: 'flex', gap: 0, borderBottom: '1px solid var(--border)',
        padding: '0 12px', background: 'var(--header-bg)',
        position: 'sticky', top: 52, zIndex: 11,
      }}>
        {tabs.map(t => (
          <div
            key={t.id}
            onClick={() => { setInstant(); setTab(t.id); }}
            style={{
              padding: '11px 14px',
              fontSize: 'var(--fs-base)',
              fontWeight: 600,
              color: tab === t.id ? 'var(--accent)' : 'var(--muted)',
              cursor: 'pointer',
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
              gap: 5,
            }}
          >
            {t.label}
            <span style={{
              fontSize: 12,
              background: tab === t.id ? 'var(--accent-soft)' : 'var(--input-bg)',
              color: tab === t.id ? 'var(--accent)' : 'var(--muted)',
              padding: '1px 5px',
              borderRadius: 8,
              fontWeight: 700,
            }}>{toFa(tabCount(t.id))}</span>
            {tab === t.id && (
              <div style={{
                position: 'absolute', bottom: 0, right: 14, left: 14, height: 3,
                background: 'var(--accent)', borderRadius: '3px 3px 0 0',
              }} />
            )}
          </div>
        ))}
      </div>

      {/* Carousel */}
      <div
        ref={containerRef}
        style={{
          overflow: 'hidden', overflowX: 'hidden', width: '100%',
          isolation: 'isolate', touchAction: 'pan-y',
        }}
      >
        <div
          ref={trackRef}
          style={{
            display: 'flex', direction: 'ltr', willChange: 'transform',
            touchAction: 'pan-y', width: '100%', minWidth: 0,
          }}
        >
          <div style={{ flex: '0 0 100%', width: '100%', minWidth: 0, maxWidth: '100%', direction: 'rtl', overflow: 'hidden', boxSizing: 'border-box', isolation: 'isolate' }}>
            <DlgTabPanel
              tab="today"
              active={tab === 'today'}
              logs={todaysLogs}
              flocks={flocks}
              birds={birds}
              config={config}
              vaccineEnabled={vaccineEnabled}
              medicineEnabled={medicineEnabled}
              onEdit={openEdit}
              onAdd={openNew}
              onDeleteLog={handleDeleteLog}
            />
          </div>
          <div style={{ flex: '0 0 100%', width: '100%', minWidth: 0, maxWidth: '100%', direction: 'rtl', overflow: 'hidden', boxSizing: 'border-box', isolation: 'isolate' }}>
            <DlgTabPanel
              tab="history"
              active={tab === 'history'}
              logs={historicalLogs}
              flocks={flocks}
              birds={birds}
              config={config}
              vaccineEnabled={vaccineEnabled}
              medicineEnabled={medicineEnabled}
              onEdit={openEdit}
              onAdd={openNew}
              onDeleteLog={handleDeleteLog}
            />
          </div>
          <div style={{ flex: '0 0 100%', width: '100%', minWidth: 0, maxWidth: '100%', direction: 'rtl', overflow: 'hidden', boxSizing: 'border-box', isolation: 'isolate' }}>
            <DlgTabPanel
              tab="archive"
              active={tab === 'archive'}
              logs={archivedLogs}
              flocks={flocks}
              birds={birds}
              config={config}
              vaccineEnabled={vaccineEnabled}
              medicineEnabled={medicineEnabled}
              onEdit={openEdit}
              onAdd={openNew}
              onDeleteLog={handleDeleteLog}
            />
          </div>
        </div>
      </div>

      <FormModal
        open={open}
        onClose={() => setOpen(false)}
        form={form}
        setForm={setForm}
        save={handleSave}
        saving={saving}
        err={err}
        vErrors={vErrors}
        showError={showError}
        markTouched={markTouched}
        selectedFlock={selectedFlock}
        flockAliveCount={flockAliveCount}
        isLayerFlock={isLayerFlock}
        isLayerType={isLayerType}
        isFlockMature={isFlockMature}
        vaccineEnabled={vaccineEnabled}
        medicineEnabled={medicineEnabled}
        onFlockChange={onFlockChange}
      />
    </div>
  );
}
