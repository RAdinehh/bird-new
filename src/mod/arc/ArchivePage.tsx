import { useState, useMemo, useEffect } from 'react';
import { useFlk, getAgeDays, calcCosts, formatAge, SOURCE_LABEL, type Flock } from '../flk/store';
import { useBrd } from '../brd/store';
import { useHal } from '../hal/store';
import { Btn, Empty, PageContainer, Tag, Row, TabButton } from '../../shr/components/ui';
import ExpandableCard from '../../shr/components/ExpandableCard';
import { toFa } from '../../shr/utils/fa';
import { toastMsg } from '../../cor/store/toast';
import { showConfirmAsync } from '../../cor/store/dialog';
import { useFilterSort, FilterBar, getArcArchiveConfig } from '../../shr/filter';
import { useDlg, type DailyLog } from '../dlg/store';
import { useWhs } from '../whs/store';
import { restoreTraInvoices } from '../tra/store';
import { restoreIncBatches } from '../inc/store';
import { listArchived, ARCHIVE_STORES, type ArchiveRecord } from '../../cor/storage/historyArchive';

type Kind = 'flocks' | 'logs' | 'stores';

interface StoreArchiveEntry {
  storeKey: 'tra' | 'whs' | 'inc';
  storeLabel: string;
  record: ArchiveRecord;
}

export default function ArchivePage() {
  const { flocks, restore, remove } = useFlk();
  const { birds, breeds } = useBrd();
  const { halls } = useHal();
  const { restoreMovements } = useWhs();

  const [kind, setKind] = useState<Kind>('flocks');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [arcTick, setArcTick] = useState(0);

  // ── تب دفتر روزانه: بارگذاری از pm-archive
  const { restoreArchived, restoreFlockLogs, logs: hotLogs } = useDlg();
  const [arcLogs, setArcLogs] = useState<ArchiveRecord[]>([]);
  const [arcLoading, setArcLoading] = useState(false);

  // ── تب سایر مخازن: tra_invoices / whs_moves / inc_batches
  const [storeEntries, setStoreEntries] = useState<StoreArchiveEntry[]>([]);
  const [storesLoading, setStoresLoading] = useState(false);
  const [restoringId, setRestoringId] = useState<string | null>(null);

  useEffect(() => {
    if (kind !== 'logs') return;
    let alive = true;
    setArcLoading(true);
    listArchived(undefined, ARCHIVE_STORES.dlg)
      .then(rows => { if (alive) setArcLogs(rows); })
      .catch(e => console.error('[ArchivePage] listArchived failed:', e))
      .finally(() => { if (alive) setArcLoading(false); });
    return () => { alive = false; };
  }, [kind, arcTick]);

  useEffect(() => {
    if (kind !== 'stores') return;
    let alive = true;
    setStoresLoading(true);
    Promise.all([
      listArchived(undefined, ARCHIVE_STORES.tra).then(rows =>
        rows.map(record => ({ storeKey: 'tra' as const, storeLabel: 'معاملات', record }))
      ),
      listArchived(undefined, ARCHIVE_STORES.whs).then(rows =>
        rows.map(record => ({ storeKey: 'whs' as const, storeLabel: 'انبار', record }))
      ),
      listArchived(undefined, ARCHIVE_STORES.inc).then(rows =>
        rows.map(record => ({ storeKey: 'inc' as const, storeLabel: 'جوجه‌کشی', record }))
      ),
    ])
      .then(([traRows, whsRows, incRows]) => {
        if (!alive) return;
        const combined = [...traRows, ...whsRows, ...incRows].sort(
          (a, b) => (b.record.archivedAt || 0) - (a.record.archivedAt || 0)
        );
        setStoreEntries(combined);
      })
      .catch(e => console.error('[ArchivePage] store archives load failed:', e))
      .finally(() => { if (alive) setStoresLoading(false); });
    return () => { alive = false; };
  }, [kind, arcTick]);

  // مرحله ۱: pre-filter آرشیو
  const archivedRaw = useMemo(
    () => flocks.filter(f => f.status === 'archived' || f.status === 'sold'),
    [flocks]
  );

  // مرحله ۲: FilterBar
  const config = useMemo(
    () => getArcArchiveConfig({
      birds: birds.map(b => ({ id: b.id, name: b.name })),
      halls: halls.map(h => ({ id: h.id, name: h.name })),
    }),
    [birds, halls]
  );
  const { filtered: archivedFlocks, filters, setFilter, clearFilter, sort, setSort, toggleSort,
          resetAll, hasActiveFilters, total: totalFiltered, count } = useFilterSort<Flock>({
    items: archivedRaw,
    filters: config.filterDefs,
    sorts: config.sortDefs,
    persistKey: config.persistKey,
    initialSort: config.initialSort,
  });

  const handleRestoreStoreEntry = async (entry: StoreArchiveEntry) => {
    setRestoringId(entry.record.id);
    try {
      let countRestored = 0;
      if (entry.storeKey === 'tra') {
        countRestored = await restoreTraInvoices([entry.record.id]);
      } else if (entry.storeKey === 'whs') {
        countRestored = await restoreMovements([entry.record.id]);
      } else if (entry.storeKey === 'inc') {
        countRestored = await restoreIncBatches([entry.record.id]);
      }
      if (countRestored > 0) {
        toastMsg.saved(`آیتم «${entry.storeLabel}» بازیابی شد`);
        setArcTick(t => t + 1);
      }
    } finally {
      setRestoringId(null);
    }
  };

  const statLabel =
    kind === 'flocks'
      ? 'گلهٔ آرشیو‌شده'
      : kind === 'logs'
      ? 'ثبت آرشیو‌شده'
      : 'رکورد سایر مخازن';

  const statValue =
    kind === 'flocks'
      ? archivedFlocks.length
      : kind === 'logs'
      ? arcLogs.length
      : storeEntries.length;

  return (
    <PageContainer>
      <div style={{
        display: 'flex', gap: 4, padding: 4,
        background: 'var(--input-bg)', borderRadius: 'var(--r-md)',
        border: '1px solid var(--border)',
      }}>
        <TabButton active={kind === 'flocks'} onClick={() => { setKind('flocks'); setExpandedId(null); }}>
          🗄 گله‌ها
        </TabButton>
        <TabButton active={kind === 'logs'} onClick={() => { setKind('logs'); setExpandedId(null); }}>
          📒 دفتر روزانه
        </TabButton>
        <TabButton active={kind === 'stores'} onClick={() => { setKind('stores'); setExpandedId(null); }}>
          📦 سایر مخازن
        </TabButton>
      </div>

      {/* آمار کلی */}
      <div style={{
        padding: '14px 16px',
        background: 'var(--card)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--r-lg)',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center'
      }}>
        <div>
          <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--muted)' }}>
            {statLabel}
          </div>
          <div style={{ fontSize: 'var(--fs-2xl)', fontWeight: 700, color: 'var(--text)', marginTop: 4 }}>
            {toFa(statValue)}
          </div>
        </div>
        <div style={{ fontSize: 40 }}>🗄</div>
      </div>

      {kind === 'flocks' && <FilterBar
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
        total={totalFiltered}
        count={count}
      />}

      {kind === 'logs' ? (
        <LogsArchiveTab
          rows={arcLogs}
          loading={arcLoading}
          hotLogs={hotLogs}
          onRestoreOne={async (id) => {
            await restoreArchived(id);
            setArcTick(t => t + 1);
          }}
          onRestoreFlock={async (flockId) => {
            await restoreFlockLogs(flockId);
            setArcTick(t => t + 1);
          }}
        />
      ) : kind === 'stores' ? (
        storesLoading ? (
          <div style={{ padding: 24, textAlign: 'center', color: 'var(--muted)', fontSize: 'var(--fs-sm)' }}>در حال بارگذاری…</div>
        ) : storeEntries.length === 0 ? (
          <Empty
            icon={<svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"><path d="M21 8v13H3V8M1 3h22v5H1zM10 12h4"/></svg>}
            title="مخزن سرد دیگری خالی است"
            desc="رکوردهای آرشیو‌شدهٔ معاملات، انبار و جوجه‌کشی این‌جا نمایش داده می‌شوند."
          />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {storeEntries.map(({ storeKey, storeLabel, record }) => {
              const isBusy = restoringId === record.id;
              return (
                <div
                  key={`${storeKey}-${record.id}`}
                  style={{
                    background: 'var(--card)',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--r-lg)',
                    padding: '12px 14px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: 8,
                  }}
                >
                  <div style={{ minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Tag tone="gray">{storeLabel}</Tag>
                      <span style={{ fontWeight: 700, fontSize: 'var(--fs-sm)', color: 'var(--text)' }}>
                        {toFa(record.id)}
                      </span>
                    </div>
                    <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--muted)', marginTop: 4 }}>
                      مرجع: {toFa(record.flockId || '—')} • تاریخ: {toFa(record.date || '—')}
                    </div>
                  </div>
                  <Btn
                    disabled={isBusy}
                    onClick={() => handleRestoreStoreEntry({ storeKey, storeLabel, record })}
                  >
                    {isBusy ? '…' : 'بازگردانی'}
                  </Btn>
                </div>
              );
            })}
          </div>
        )
      ) : archivedFlocks.length === 0 ? (
        <Empty
          icon={<svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"><path d="M21 8v13H3V8M1 3h22v5H1zM10 12h4"/></svg>}
          title="آرشیو خالی است"
          desc="آیتم‌هایی که آرشیو می‌کنید این‌جا نمایش داده می‌شوند."
        />
      ) : (
        <>
          {archivedFlocks.map((f, i) => {
            const bird = birds.find(b => b.id === f.birdId);
            const breed = breeds.find(b => b.id === f.breedId);
            const hall = halls.find(h => h.id === f.hallId);
            const ageDays = getAgeDays(f);
            const costs = calcCosts(f);
            const isOpen = expandedId === f.id;
            const statusLabel = f.status === 'sold' ? 'فروخته‌شده' : 'آرشیو';

            return (
              <ExpandableCard
                key={f.id}
                accent="dim"
                index={toFa(i + 1)}
                iconEmoji="🗄"
                title={f.name}
                subtitle={(bird?.name || '—') + (breed ? ' • ' + breed.name : '') + (hall ? ' • ' + hall.name : '')}
                isOpen={isOpen}
                onToggle={() => setExpandedId(isOpen ? null : f.id)}
                badge={<Tag tone={f.status === 'sold' ? 'green' : 'gray'}>{statusLabel}</Tag>}
                stats={
                  <>
                    <span>سن نهایی: <b style={{ color: 'var(--text)' }}>{toFa(ageDays)} روز</b></span>
                    {f.currentCount ? <span>تعداد: <b style={{ color: 'var(--text)' }}>{toFa(f.currentCount)}</b></span> : null}
                    {f.updatedAt ? <span>آرشیو: <b style={{ color: 'var(--text)' }}>{toFa(f.updatedAt.slice(0, 10))}</b></span> : null}
                  </>
                }
              >
                <SectionTitle><span style={{ fontSize: '1.05em', lineHeight: 1, display: 'inline-block', marginLeft: 4 }}>📋</span> اطلاعات گله</SectionTitle>
                <Row l="پرنده" v={bird?.name || '—'} />
                <Row l="نژاد" v={breed?.name || '—'} />
                <Row l="سالن" v={hall?.name || '—'} />
                <Row l="نوع" v={f.type === 'layer' ? 'تخم‌گذار' : f.type === 'broiler' ? 'گوشتی' : 'مادر'} />
                <Row l="منبع" v={SOURCE_LABEL[f.source] || '—'} />
                <Row l="تعداد اولیه" v={f.initialCount ? toFa(f.initialCount) : '—'} />
                {f.currentCount ? <Row l="تعداد نهایی" v={toFa(f.currentCount)} /> : null}
                <Row l="سن نهایی" v={toFa(ageDays) + ' روز (' + formatAge(ageDays) + ')'} />

                <SectionTitle><span style={{ fontSize: '1.05em', lineHeight: 1, display: 'inline-block', marginLeft: 4 }}>📅</span> تاریخ‌ها</SectionTitle>
                {f.hatchDate ? <Row l="هچ" v={toFa(f.hatchDate)} /> : null}
                {f.purchaseDate ? <Row l="خرید" v={toFa(f.purchaseDate)} /> : null}
                {f.startDate ? <Row l="شروع" v={toFa(f.startDate)} /> : null}

                {costs.total > 0 ? (
                  <>
                    <SectionTitle><span style={{ fontSize: '1.05em', lineHeight: 1, display: 'inline-block', marginLeft: 4 }}>💰</span> هزینه‌ها</SectionTitle>
                    <Row l="جمع کل" v={toFa(costs.total.toLocaleString('fa-IR')) + ' ت'} />
                    {costs.perBird > 0 ? <Row l="هر پرنده" v={toFa(Math.round(costs.perBird).toLocaleString('fa-IR')) + ' ت'} /> : null}
                  </>
                ) : null}

                {f.notes ? (
                  <>
                    <SectionTitle><span style={{ fontSize: '1.05em', lineHeight: 1, display: 'inline-block', marginLeft: 4 }}>📝</span> یادداشت</SectionTitle>
                    <div style={{ fontSize: 'var(--fs-sm)', lineHeight: 1.7, padding: 'var(--pad-normal)', background: 'var(--input-bg)', borderRadius: 'var(--r-sm)' }}>{f.notes}</div>
                  </>
                ) : null}

                <div style={{ display: 'flex', gap: 6, paddingTop: 4 }}>
                  <Btn size="sm" onClick={async () => { await restore(f.id); setExpandedId(null); setArcTick(t => t + 1); toastMsg.saved('گله بازیابی شد'); }} style={{ flex: 1 }}>🔄 بازیابی</Btn>
                  <Btn size="sm" onClick={async () => {
                          const ok = await showConfirmAsync('حذف نهایی گله', 'حذف کامل «' + f.name + '»؟\n\nاین عمل قابل بازگشت نیست. برای همیشه پاک می‌شود.', { danger: true, confirmText: 'حذف کن' });
                          if (!ok) return;
                          remove(f.id);
                          toastMsg.deleted('گله')
                        }} style={{ flex: 1 }}>🗑 حذف نهایی</Btn>
                </div>
              </ExpandableCard>
            );
          })}
        </>
      )}
    </PageContainer>
  );
}

// ═══ تب دفتر روزانهٔ آرشیو‌شده ═══
const REASON_LABEL: Record<string, string> = {
  age: 'قدیمی',
  'flock-closed': 'بستن گله',
  'count-threshold': 'حد تعداد',
  ancient: 'قدیمی',
};

function LogsArchiveTab({
  rows, loading, hotLogs, onRestoreOne, onRestoreFlock,
}: {
  rows: ArchiveRecord[];
  loading: boolean;
  hotLogs: DailyLog[];
  onRestoreOne: (id: string) => Promise<void>;
  onRestoreFlock: (flockId: string) => Promise<void>;
}) {
  const { flocks } = useFlk();
  const [busy, setBusy] = useState<string | null>(null);
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});

  // گروه‌بندی بر اساس گله
  const groups = useMemo(() => {
    const m = new Map<string, ArchiveRecord[]>();
    for (const r of rows) {
      const k = r.flockId || '—';
      if (!m.has(k)) m.set(k, []);
      m.get(k)!.push(r);
    }
    return Array.from(m.entries()).sort((a, b) => b[1].length - a[1].length);
  }, [rows]);

  if (loading) {
    return <div style={{ padding: 24, textAlign: 'center', color: 'var(--muted)', fontSize: 'var(--fs-sm)' }}>در حال بارگذاری…</div>;
  }

  if (rows.length === 0) {
    return (
      <Empty
        icon={<svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"><path d="M21 8v13H3V8M1 3h22v5H1zM10 12h4"/></svg>}
        title="آرشیو دفتر روزانه خالی است"
        desc="ثبت‌های قدیمی یا دفتر روزانهٔ گله‌های بسته‌شده این‌جا نگهداری می‌شوند."
      />
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {groups.map(([flockId, items]) => {
        const flock = flocks.find(f => f.id === flockId);
        const hotCount = hotLogs.filter(l => l.flockId === flockId).length;
        const dates = items.map(r => r.date).sort();
        const isBusy = busy === flockId;

        return (
          <div key={flockId} style={{
            background: 'var(--card)', border: '1px solid var(--border)',
            borderRadius: 'var(--r-lg)', padding: '12px 14px',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: 'var(--fs-base)', color: 'var(--text)' }}>
                  {flock?.name || ('گلهٔ ' + flockId)}
                </div>
                <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--muted)', marginTop: 2 }}>
                  {toFa(items.length)} ثبت • {toFa(dates[0] || '—')} تا {toFa(dates[dates.length - 1] || '—')}
                  {hotCount > 0 ? ' • ' + toFa(hotCount) + ' ثبت فعال' : ''}
                </div>
              </div>
              <Btn
                disabled={isBusy}
                onClick={async () => {
                  setBusy(flockId);
                  try { await onRestoreFlock(flockId); }
                  finally { setBusy(null); }
                }}
              >
                {isBusy ? '…' : '🔄 بازگردانی همه'}
              </Btn>
            </div>

            <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 4 }}>
              {(expandedGroups[flockId] ? items : items.slice(0, 5)).map(r => (
                <div key={r.id} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  fontSize: 'var(--fs-xs)', color: 'var(--muted)',
                  padding: '4px 0', borderTop: '1px dashed var(--border)',
                }}>
                  <span>
                    {toFa(r.date)}
                    <span style={{ marginRight: 6 }}><Tag tone="gray">{REASON_LABEL[r.reason] || r.reason}</Tag></span>
                  </span>
                  <Btn
                    disabled={busy === r.id}
                    onClick={async () => {
                      setBusy(r.id);
                      try { await onRestoreOne(r.id); }
                      finally { setBusy(null); }
                    }}
                  >
                    {busy === r.id ? '…' : 'بازگردانی'}
                  </Btn>
                </div>
              ))}
              {items.length > 5 ? (
                <div style={{ paddingTop: 4 }}>
                  <Btn
                    size="sm"
                    onClick={() => setExpandedGroups(prev => ({ ...prev, [flockId]: !prev[flockId] }))}
                  >
                    {expandedGroups[flockId] ? 'بستن لیست' : 'نمایش همه (' + toFa(items.length - 5) + ' مورد دیگر)'}
                  </Btn>
                </div>
              ) : null}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ paddingTop: 12, marginTop: 4, borderTop: '1px dashed var(--border)', fontSize: 'var(--fs-base)', fontWeight: 700, color: 'var(--text)', letterSpacing: '.3px' }}>{children}</div>
  );
}
