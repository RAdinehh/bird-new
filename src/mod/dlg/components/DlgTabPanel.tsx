/**
 * DlgTabPanel — محتوای یک تب از ثبت روزانه (carousel)
 */
import { useFormat, getGlobalFormat } from '../../../shr/units/useFormat';

import { useState, useMemo, useEffect, useRef } from 'react';
import { format as formatJ } from 'date-fns-jalali';
import { useFab } from '../../../shr/hooks/useFab';
import FlockPickerSheet from './FlockPickerSheet';
import { useDlg, type DailyLog } from '../store';
import type { DeleteSnapshot } from '../hooks/useDlgSave';
import { useFilterSort, FilterBar, type getDlgLogsConfig } from '../../../shr/filter';
import { useGroupedList } from '../../../shr/filter/useGroupedList';
import { Btn, Empty, PageContainer } from '../../../shr/components/ui';
import { AccordionSection } from '../../../shr/components/AccordionSection';
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
import type { F } from '../types';
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
  onApplyCorrection: (logId: string, changes: Partial<DailyLog>, reason: string, notes?: string) => Promise<boolean>;
  onRevokeCorrection: (logId: string, correctionId: string) => Promise<boolean>;
}

export default function DlgTabPanel({
  tab, active,
  logs, activeFlocks, flocks, birds, config,
  vaccineEnabled, medicineEnabled,
  onEdit, onAdd, onDeleteLog, onRestoreLogFull, onApplyCorrection, onRevokeCorrection,
}: Props) {
  const fmt = useFormat();
  const { add, archive, restore, restoreArchived, countArchivedLogs } = useDlg();
  const [coldCount, setColdCount] = useState<number>(0);
  const [coldOpen, setColdOpen] = useState<boolean>(false);
  const [coldLoading, setColdLoading] = useState<boolean>(false);
  const [coldRestoringId, setColdRestoringId] = useState<string | null>(null);
  const [coldItems, setColdItems] = useState<Array<{ id: string; flockId: string; date: string; reason: string; log: DailyLog }>>([]);
  const [undoData, setUndoData] = useState<{ log: DailyLog | DailyLog[]; snapshot?: DeleteSnapshot } | null>(null);
  const loadColdArchive = async () => {
    setColdLoading(true);
    try {
      const mod = await import("../../../cor/storage/historyArchive");
      const rows = await mod.listArchived({ limit: 50 }, mod.ARCHIVE_STORES.dlg);
      setColdItems(rows.map(r => ({ id: r.id, flockId: r.flockId, date: r.date, reason: r.reason, log: r.log })));
    } catch {
      setColdItems([]);
    } finally {
      setColdLoading(false);
    }
  };

  const handleToggleColdArchive = async () => {
    const next = !coldOpen;
    setColdOpen(next);
    if (next) await loadColdArchive();
  };

  const handleRestoreColdItem = async (id: string) => {
    setColdRestoringId(id);
    try {
      const ok = await restoreArchived(id);
      if (ok) {
        toastMsg.restored("ثبت");
        setColdItems(prev => prev.filter(x => x.id !== id));
        const nextCount = await countArchivedLogs().catch(() => 0);
        setColdCount(nextCount);
      } else {
        toastMsg.error("بازگردانی ناموفق");
      }
    } finally {
      setColdRestoringId(null);
    }
  };

  const undoTimerRef = useRef<number | null>(null);
  const scheduleUndoClear = (ms: number) => {
    if (undoTimerRef.current !== null) window.clearTimeout(undoTimerRef.current);
    undoTimerRef.current = window.setTimeout(() => {
      setUndoData(null);
      undoTimerRef.current = null;
    }, ms);
  };
  useEffect(() => () => {
    if (undoTimerRef.current !== null) window.clearTimeout(undoTimerRef.current);
  }, []);
  const [correctingLog, setCorrectingLog] = useState<DailyLog | null>(null);
  const [historyLog, setHistoryLog] = useState<DailyLog | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [showAllHistory, setShowAllHistory] = useState(false);
  const allLogs = useDlg(s => s.logs);
const formatColdDateFa = (rawDate?: string): string => {
  if (!rawDate) return "—";
  const trimmed = rawDate.trim();
  if (/^1[34]\d{2}\/\d{2}\/\d{2}$/.test(trimmed)) {
    return fmt.code(trimmed);
  }
  const parsed = new Date(trimmed);
  if (!Number.isNaN(parsed.getTime())) {
    return fmt.date(formatJ(parsed, "yyyy/MM/dd"));
  }
  return fmt.code(trimmed);
};

const summarizeColdLogFa = (log?: DailyLog): string => {
  if (!log) return "";
  const parts: string[] = [];
  const anyLog = log as unknown as Record<string, unknown>;

  const feed = anyLog.feedKg ?? anyLog.feedConsumed ?? anyLog.feed;
  const water = anyLog.waterL ?? anyLog.waterConsumed ?? anyLog.water;
  const deaths = anyLog.deaths ?? anyLog.deathsCount ?? anyLog.mortality;
  const eggs = anyLog.eggs ?? anyLog.eggCount;
  const temp = anyLog.temp ?? anyLog.temperature;
  const humidity = anyLog.humidity;

  if (typeof feed === "number" && feed > 0) parts.push(`دان: ${fmt.num(feed)} کیلوگرم`);
  if (typeof water === "number" && water > 0) parts.push(`آب: ${fmt.num(water)} لیتر`);
  if (typeof deaths === "number" && deaths > 0) parts.push(`تلفات: ${fmt.num(deaths)}`);
  if (typeof eggs === "number" && eggs > 0) parts.push(`تخم: ${fmt.num(eggs)}`);
  if (typeof temp === "number" && temp > 0) parts.push(`دما: ${fmt.num(temp)}°`);
  if (typeof humidity === "number" && humidity > 0) parts.push(`رطوبت: ${fmt.num(humidity)}٪`);

  return parts.join(" • ");
};

const getMonthKeyFa = (dateStr?: string): string => {
  if (!dateStr) return "نامشخص";
  const match = dateStr.trim().match(/^(1[34]\d{2})\/(\d{2})/);
  if (!match) return "نامشخص";
  return `${fmt.code(match[1])}/${fmt.code(match[2])}`;
};

const getMonthLabelFa = (dateStr?: string): string => {
  if (!dateStr) return "تاریخ نامشخص";
  const match = dateStr.trim().match(/^(1[34]\d{2})\/(\d{2})/);
  if (!match) return fmt.code(dateStr);
  return `${fmt.code(match[1])}/${fmt.code(match[2])}`;
};

function sliceUpToDayBoundary<T extends { date?: string }>(
  sortedLogs: T[],
  minLimit = 100
): T[] {
  if (sortedLogs.length <= minLimit) return sortedLogs;

  const result: T[] = [];
  let boundaryDate: string | undefined;

  for (let i = 0; i < sortedLogs.length; i++) {
    const item = sortedLogs[i];
    if (i < minLimit) {
      result.push(item);
      boundaryDate = item.date;
    } else if (item.date && item.date === boundaryDate) {
      result.push(item);
    } else {
      break;
    }
  }

  return result;
}

function groupLogsByMonth<T extends { date?: string }>(logs: T[]) {
  const map = new Map<
    string,
    { key: string; label: string; items: T[] }
  >();

  for (const item of logs) {
    const key = getMonthKeyFa(item.date);
    const label = getMonthLabelFa(item.date);
    const existing = map.get(key);
    if (existing) {
      existing.items.push(item);
    } else {
      map.set(key, {
        key,
        label,
        items: [item],
      });
    }
  }

  return Array.from(map.values());
}
useEffect(() => {
    if (tab !== "history" || !active) return;
    let alive = true;
    countArchivedLogs()
      .then(n => { if (alive) setColdCount(n); })
      .catch(() => { if (alive) setColdCount(0); });
    return () => { alive = false; };
  }, [tab, active, allLogs.length, countArchivedLogs]);
  const todayStr = formatJ(new Date(), 'yyyy/MM/dd');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [groupBy, setGroupBy] = useState<string>(tab === 'history' ? 'flockId' : 'none');
  useEffect(() => { if (tab === 'history' && groupBy === 'none') setGroupBy('flockId'); }, [tab]);

  useFab(active ? { label: 'ثبت امروز', onClick: () => setPickerOpen(true) } : null);

  const { filtered: list, filters, setFilter, clearFilter, sort, setSort, toggleSort,
          resetAll, hasActiveFilters, total, count } = useFilterSort<DailyLog>({
    items: logs,
    filters: config.filterDefs,
    sorts: config.sortDefs,
    persistKey: config.persistKey,
    initialSort: config.initialSort,
  });

  const isHistoryLimited = tab === "history" && !showAllHistory && !hasActiveFilters && list.length > 100;
  const visibleList = useMemo(
    () => (isHistoryLimited ? sliceUpToDayBoundary(list, 100) : list),
    [isHistoryLimited, list]
  );

  const grouped = useGroupedList({ list: visibleList, groupDefs: config.groupDefs, groupBy, ctx: { flocks: activeFlocks } });

  const ms = useMultiSelect({
    items: logs,
    getId: (l: DailyLog) => l.id,
    onDelete: async (ids) => {
      const ok = await showConfirmAsync('حذف گروهی', fmt.count(ids.length) + ' ثبت روزانه حذف شوند؟', { danger: true });
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
        scheduleUndoClear(8000);
      }
      toastMsg.deletedBulk(deletedCount, 'ثبت');
      logAction('delete', 'dlg', 'حذف گروهی ثبت روزانه: ' + backups.length);
    },
    onArchive: async (ids) => {
      const ok = await showConfirmAsync('آرشیو گروهی', fmt.count(ids.length) + ' ثبت آرشیو شوند؟');
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
            count: log.deathsCount || 0,
            deaths: (log.deaths || []).filter(d => typeof d.count === 'number' && d.count > 0) as Array<{ id: string; count: number; cause: string; notes: string }>,
            isEdit: false,
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
    scheduleUndoClear(6000);
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
        onRevokeCorrection={(corrId) => { void onRevokeCorrection(l.id, corrId); }}
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
        groupBy={groupBy}
        setGroupBy={setGroupBy}
        groupDefs={config.groupDefs}
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

      {visibleList.length === 0 ? (
        <Empty
          icon={<svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>}
          title={tab === 'today' ? 'امروز ثبتی ندارید' : tab === 'archive' ? 'آرشیو خالی است' : 'تاریخچه خالی است'}
          desc={tab === 'today' ? 'اولین ثبت امروز را انجام دهید.' : 'پس از ثبت اولین روز، اینجا نمایش داده می‌شود.'}
          action={tab !== 'archive' ? <Btn variant="primary" onClick={() => setPickerOpen(true)}>+ ثبت امروز</Btn> : undefined}
        />
      ) : (
        <>
          {grouped ? (
            grouped.map(g => (
              <AccordionSection
                key={g.key}
                title={g.title}
                icon="📁"
                summary={`${fmt.num(g.items.length)} ثبت`}
                defaultOpen={true}
              >
                {g.items.map((l, i) => renderLogCard(l, i))}
              </AccordionSection>
            ))
          ) : (
            visibleList.map((l, i) => renderLogCard(l, i))
          )}
          {isHistoryLimited && (
            <div style={{ display: "flex", justifyContent: "center", paddingTop: 6 }}>
              <Btn variant="ghost" onClick={() => setShowAllHistory(true)}>
                {fmt.code(`نمایش روزهای بیشتر (${list.length - visibleList.length} ثبت دیگر)`)}
              </Btn>
            </div>
          )}
        </>
      )}
    {tab === "history" && coldCount > 0 && (
        <div
          style={{
            marginTop: 8,
            padding: "10px 12px",
            background: "var(--card)",
            border: "1px solid var(--border)",
            borderRadius: "var(--r-md)",
            display: "flex",
            flexDirection: "column",
            gap: 8,
            paddingBottom: 72,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
            <span style={{ fontSize: "var(--fs-xs)", color: "var(--muted)" }}>
              آرشیو سرد: <b style={{ color: "var(--text)" }}>{fmt.count(coldCount)}</b> ثبت قدیمی
            </span>
            <Btn size="sm" variant="outline" onClick={handleToggleColdArchive}>
              {coldOpen ? "بستن آرشیو سرد" : "مشاهده آرشیو سرد"}
            </Btn>
          </div>
          {coldOpen && (
            coldLoading ? (
              <div style={{ fontSize: "var(--fs-xs)", color: "var(--muted)", padding: "6px 0" }}>در حال بارگذاری...</div>
            ) : coldItems.length === 0 ? (
              <div style={{ fontSize: "var(--fs-xs)", color: "var(--muted)", padding: "6px 0" }}>موردی برای نمایش نیست.</div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {coldItems.map(item => {
                  const fl = flocks.find(f => f.id === item.flockId);
                  const alreadyInHot = allLogs.some(x => x.id === item.id);
                  const flockTitle =
                    fl?.name ||
                    (item.flockId?.startsWith("cmp-seed") ? "گله آرشیوی" : "گله ثبت‌نشده");
                  const dateFa = formatColdDateFa(item.log?.date || item.date);
                  const summaryFa = summarizeColdLogFa(item.log);

                  return (
                    <div
                      key={item.id}
                      style={{
                        padding: "10px 12px",
                        background: "var(--input-bg)",
                        borderRadius: "var(--r-sm)",
                        border: "1px solid var(--border)",
                        display: "flex",
                        flexDirection: "column",
                        gap: 6,
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          gap: 8,
                          flexWrap: "wrap",
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: "var(--fs-xs)" }}>
                          <b style={{ color: "var(--text)" }}>{flockTitle}</b>
                          <span style={{ color: "var(--muted)" }}>{dateFa}</span>
                        </div>
                        <Btn
                          size="sm"
                          variant="outline"
                          disabled={alreadyInHot || coldRestoringId === item.id}
                          onClick={() => handleRestoreColdItem(item.id)}
                        >
                          {alreadyInHot ? "موجود در ثبت‌های فعال" : coldRestoringId === item.id ? "در حال بازگردانی..." : "بازگردانی"}
                        </Btn>
                      </div>
                      {summaryFa && (
                        <div style={{ fontSize: "var(--fs-2xs, 11px)", color: "var(--muted)" }}>
                          {summaryFa}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )
          )}
        </div>
      )}
      <CorrectionModal
      open={!!correctingLog}
      onClose={() => setCorrectingLog(null)}
      log={correctingLog}
      onSave={async (logId, changes, reason, notes) => {
        const ok = await onApplyCorrection(logId, changes, reason, notes);
        if (ok) setCorrectingLog(null);
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
        onEdit={onEdit}
        onAdd={onAdd}
      />
        </PageContainer>
  );
}
