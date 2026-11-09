/**
 * DlgTabPanel — محتوای یک تب از ثبت روزانه (carousel)
 */
import { useState, useMemo, useEffect } from 'react';
import { format as formatJ } from 'date-fns-jalali';
import { useFab } from '../../../shr/hooks/useFab';
import FlockPickerSheet from './FlockPickerSheet';
import { useDlg, type DailyLog } from '../store';
import type { DeleteSnapshot } from '../hooks/useDlgSave';
import { useFilterSort, FilterBar, type getDlgLogsConfig } from '../../../shr/filter';
import { Btn, Empty, PageContainer } from '../../../shr/components/ui';
import HelpBanner from '../../../shr/components/HelpBanner';
import MultiSelectBar from '../../../shr/multiSelect/MultiSelectBar';
import { useMultiSelect } from '../../../shr/multiSelect/useMultiSelect';
import UndoBar from '../../../cor/ui/UndoBar';
import { toastMsg } from '../../../cor/store/toast';
import { showConfirmAsync } from '../../../cor/store/dialog';
import { logAction } from '../../../cor/logger/auditLog';
import { toFa } from '../../../shr/utils/fa';
import { bus } from '../../../cor/events';
import LogCard from './LogCard';
import CorrectionModal from './CorrectionModal';
import DlgHistoryModal from './DlgHistoryModal';
import type { Flock } from '../../flk/store';
import type { Bird } from '../../brd/store';

type TabId = 'today' | 'history' | 'archive';

type DlgConfig = ReturnType<typeof getDlgLogsConfig>;

interface Props {
  tab: TabId;
  active: boolean;
  logs: DailyLog[];
  activeFlocks: Flock[];
  flocks: Flock[];
  birds: Bird[];
  config: DlgConfig;
  vaccineEnabled: boolean;
  medicineEnabled: boolean;
  onEdit: (l: DailyLog) => void;
  onAdd: (flockId?: string) => void;
  onDeleteLog: (l: DailyLog, opts?: { skipConfirm?: boolean }) => Promise<{ log: DailyLog; snapshot?: DeleteSnapshot } | null>;
  onRestoreLogFull: (log: DailyLog, snapshot: DeleteSnapshot) => Promise<boolean>;
}

export default function DlgTabPanel({
  tab, active,
  logs, activeFlocks, flocks, birds, config,
  vaccineEnabled, medicineEnabled,
  onEdit, onAdd, onDeleteLog, onRestoreLogFull,
}: Props) {
  const { add, archive, restore, addCorrection, revokeCorrection } = useDlg();
  const [undoData, setUndoData] = useState<{ log: DailyLog | DailyLog[]; snapshot?: DeleteSnapshot } | null>(null);
  const [correctingLog, setCorrectingLog] = useState<DailyLog | null>(null);
  const [historyLog, setHistoryLog] = useState<DailyLog | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const allLogs = useDlg(s => s.logs);
  const todayStr = formatJ(new Date(), 'yyyy/MM/dd');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useFab(active ? { label: 'ثبت امروز', onClick: () => setPickerOpen(true) } : null);

  const { filtered: list, filters, setFilter, clearFilter, sort, setSort, toggleSort,
          resetAll, hasActiveFilters, total, count } = useFilterSort<DailyLog>({
    items: logs,
    filters: config.filterDefs,
    sorts: config.sortDefs,
    persistKey: config.persistKey,
    initialSort: config.initialSort,
  });

  const ms = useMultiSelect({
    items: logs,
    getId: (l: DailyLog) => l.id,
    onDelete: async (ids) => {
      const ok = await showConfirmAsync('حذف گروهی', toFa(ids.length) + ' ثبت روزانه حذف شوند؟', { danger: true });
      if (!ok) return;
      const backups: DailyLog[] = [];
      let deletedCount = 0;
      for (const id of ids) {
        const it = logs.find(x => x.id === id);
        if (!it) continue;
        // D5.5/B3 — bulk delete atomic (cascade + remove + outbox)
        const deleted = await onDeleteLog(it, { skipConfirm: true });
        if (deleted) backups.push(deleted.log);
        deletedCount++;
      }
      if (backups.length > 0) {
        setUndoData({ log: backups });
        setTimeout(() => setUndoData((cur) => cur && Array.isArray(cur.log) && cur.log.length === backups.length ? null : cur), 8000);
      }
      toastMsg.deletedBulk(deletedCount, 'ثبت');
      logAction('delete', 'dlg', 'حذف گروهی ثبت روزانه: ' + backups.length);
    },
    onArchive: async (ids) => {
      const ok = await showConfirmAsync('آرشیو گروهی', toFa(ids.length) + ' ثبت آرشیو شوند؟');
      if (!ok) return;
      for (const id of ids) {
        try { archive(id); } catch { /* silent */ }
      }
      toastMsg.archivedBulk(ids.length, 'ثبت');
    },
  });

  useEffect(() => {
    if (ms.selectionMode) setExpandedId(null);
  }, [ms.selectionMode]);

  const undoDeleteLog = async () => {
    if (undoData == null) return;
    const arr = Array.isArray(undoData.log) ? undoData.log : [undoData.log];
    try {
      if (!Array.isArray(undoData.log) && undoData.snapshot) {
        await onRestoreLogFull(undoData.log, undoData.snapshot);
      } else {
        for (const log of arr) add(log);
      }
      for (const log of arr) {
        try {
          bus.emit('dlg:deaths:recorded', {
            logId: log.id, flockId: log.flockId, date: log.date,
            count: log.deathsCount || 0, deaths: log.deaths || [], isEdit: false,
          }, { source: 'dlg/undoDelete' });
        } catch { /* silent */ }
      }
      toastMsg.restoredBulk(arr.length, 'ثبت');
    } catch {
      toastMsg.error('بازگردانی ناموفق');
    }
    setUndoData(null);
  };

  const handleDeleteOne = async (l: DailyLog) => {
    const result = await onDeleteLog(l);
    if (!result) return;
    setUndoData({ log: result.log, snapshot: result.snapshot });
    setTimeout(() => setUndoData((cur) => cur && !Array.isArray(cur.log) && cur.log.id === result.log.id ? null : cur), 6000);
  };

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
        onEdit={() => onEdit(l)}
        onArchive={() => archive(l.id)}
        onRestore={() => restore(l.id)}
        onDelete={() => handleDeleteOne(l)}
        onCorrect={() => setCorrectingLog(l)}
          onHistory={() => setHistoryLog(l)}
        onRevokeCorrection={(corrId) => revokeCorrection(l.id, corrId)}
      />
    );
  };

  if (!active) return null;

  return (
    <PageContainer>
      {undoData && (
        <UndoBar label="ثبت حذف شد" onUndo={undoDeleteLog} onDismiss={() => setUndoData(null)} />
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
      {!ms.selectionMode && list.length > 1 && (
        <div style={{ fontSize: '10px', color: 'var(--dim)', textAlign: 'center', paddingBottom: 2 }}>
          برای انتخاب چندتایی، روی یک کارت نگه دارید
        </div>
      )}
      {ms.selectionMode && list.length > 1 && (
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 6 }}>
          <button
            type="button"
            onClick={ms.selectedIds.size === list.length ? ms.clearSelection : ms.selectAll}
            style={{
              padding: '4px 10px', background: 'var(--input-bg)',
              border: '1px solid var(--border)', borderRadius: 'var(--r-sm)',
              color: 'var(--muted)', fontFamily: 'inherit',
              fontSize: '10px', fontWeight: 600, cursor: 'pointer',
            }}
          >
            {ms.selectedIds.size === list.length ? 'لغو انتخاب همه' : 'انتخاب همه'}
          </button>
        </div>
      )}

      <MultiSelectBar ms={ms} deleteLabel="حذف" archiveLabel="آرشیو" />

      {list.length === 0 ? (
        <Empty
          icon={<svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>}
          title={tab === 'today' ? 'امروز ثبتی ندارید' : tab === 'archive' ? 'آرشیو خالی است' : 'تاریخچه خالی است'}
          desc={tab === 'today' ? 'اولین ثبت امروز را انجام دهید.' : 'پس از ثبت اولین روز، اینجا نمایش داده می‌شود.'}
          action={tab !== 'archive' ? <Btn variant="primary" onClick={() => setPickerOpen(true)}>+ ثبت امروز</Btn> : undefined}
        />
      ) : (
        <>
          {list.map((l, i) => renderLogCard(l, i))}
        </>
      )}
    <CorrectionModal
      open={!!correctingLog}
      onClose={() => setCorrectingLog(null)}
      log={correctingLog}
      onSave={(logId, changes, reason, notes) => {
        addCorrection(logId, changes, reason, notes);
        toastMsg.saved('اصلاح');
        setCorrectingLog(null);
      }}
    />

      <DlgHistoryModal
        open={!!historyLog}
        onClose={() => setHistoryLog(null)}
        log={historyLog}
      />

      <FlockPickerSheet
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        flocks={activeFlocks}
        logs={allLogs}
        todayStr={todayStr}
        onSelect={(flock, existing) => { if (existing) onEdit(existing); else onAdd(flock.id); }}
      />
        </PageContainer>
  );
}
