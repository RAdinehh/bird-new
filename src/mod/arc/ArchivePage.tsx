import { useState, useMemo } from 'react';
import { useFlk, getAgeDays, getLifecycle, calcCosts, formatAge, SOURCE_LABEL, type Flock } from '../flk/store';
import { useBrd } from '../brd/store';
import { useHal } from '../hal/store';
import { Btn, Empty, PageContainer, Tag } from '../../shr/components/ui';
import ExpandableCard from '../../shr/components/ExpandableCard';
import { toFa } from '../../shr/utils/fa';
import { toastMsg } from '../../cor/store/toast';
import { showConfirmAsync } from '../../cor/store/dialog';
import { useFilterSort, FilterBar, getArcArchiveConfig } from '../../shr/filter';
import { useDlg, type DailyLog } from '../dlg/store';
import { listArchived, ARCHIVE_STORES, type ArchiveRecord } from '../../cor/storage/historyArchive';
import { TabButton } from '../../shr/components/ui';
import { useEffect } from 'react';
import { Row } from '../../shr/components/ui';

type Kind = 'flocks' | 'logs';

export default function ArchivePage() {
  const { flocks, restore, remove } = useFlk();
  const { birds, breeds } = useBrd();
  const { halls } = useHal();

  const [kind, setKind] = useState<Kind>('flocks');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // ── تب لاگ‌ها: بارگذاری از pm-archive
  const { restoreArchived, restoreFlockLogs, logs: hotLogs } = useDlg();
  const [arcLogs, setArcLogs] = useState<ArchiveRecord[]>([]);
  const [arcLoading, setArcLoading] = useState(false);
  const [arcTick, setArcTick] = useState(0);

  useEffect(() => {
    if (kind !== 'logs') return;
    let alive = true;
    setArcLoading(true);
    listArchived({ limit: 500 }, ARCHIVE_STORES.dlg)
      .then(rows => { if (alive) setArcLogs(rows); })
      .catch(e => console.error('[ArchivePage] listArchived failed:', e))
      .finally(() => { if (alive) setArcLoading(false); });
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
            {kind === 'flocks' ? 'گلهٔ آرشیو‌شده' : 'لاگ آرشیو‌شده'}
          </div>
          <div style={{ fontSize: 'var(--fs-2xl)', fontWeight: 700, color: 'var(--text)', marginTop: 4 }}>
            {kind === 'flocks' ? toFa(archivedFlocks.length) : toFa(arcLogs.length)}
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
            const lc = getLifecycle(f.type, ageDays, f.endOfCycleDay ?? null, null);
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
                  <Btn size="sm" onClick={() => { restore(f.id); setExpandedId(null); }} style={{ flex: 1 }}>🔄 بازیابی</Btn>
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


// ═══ تب لاگ‌های آرشیو‌شده ═══
const REASON_LABEL: Record<string, string> = {
  age: 'قدیمی',
  'flock-closed': 'بستن گله',
  'count-threshold': 'حد تعداد',
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
        title="آرشیو لاگ خالی است"
        desc="لاگ‌های قدیمی یا گله‌های بسته‌شده این‌جا نگهداری می‌شوند."
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
                  {toFa(items.length)} لاگ • {toFa(dates[0] || '—')} تا {toFa(dates[dates.length - 1] || '—')}
                  {hotCount > 0 ? ' • ' + toFa(hotCount) + ' لاگ فعال' : ''}
                </div>
              </div>
              <Btn
                size="sm"
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
              {items.slice(0, 5).map(r => (
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
                    size="sm"
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
                <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--muted)', paddingTop: 4 }}>
                  و {toFa(items.length - 5)} لاگ دیگر…
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
