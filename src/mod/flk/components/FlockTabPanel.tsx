/**
 * FlockTabPanel — محتوای یک تب از گله‌ها (carousel)
 */
import { useState, useMemo, useEffect } from 'react';
import { useFlk, type Flock } from '../store';
import { useFab } from '../../../shr/hooks/useFab';
import type { Bird, Breed } from '../../brd/store';
import type { Hall, Zone } from '../../hal/store';
import type { Invoice } from '../../tra/store';
import type { useBreedStandard } from '../../../shr/hooks/useBreedStandard';
import type { useFormat } from '../../../shr/units';
import type { TabId } from '../types-flocks';
import type { FlocksKpi } from '../hooks/useFlocksKpi';
import { filterFlocksByTab } from '../_flkList';
import { getFlockRevenue, hasRefs } from '../api/flocksCalc';
import { useMultiSelect } from '../../../shr/multiSelect/useMultiSelect';
import MultiSelectBar from '../../../shr/multiSelect/MultiSelectBar';
import UndoBar from '../../../cor/ui/UndoBar';
import { Btn, Empty, PageContainer } from '../../../shr/components/ui';
import HelpBanner from '../../../shr/components/HelpBanner';
import { useFilterSort, FilterBar, getFlkFlocksConfig } from '../../../shr/filter';
import { showConfirmAsync } from '../../../cor/store/dialog';
import { toastMsg } from '../../../cor/store/toast';
import { logAction } from '../../../cor/logger/auditLog';
import { toFa } from '../../../shr/utils/fa';
import FlocksKpiCards from './FlocksKpiCards';
import UpcomingFlocks from './UpcomingFlocks';
import FlockCard from './FlockCard';

type BreedStd = ReturnType<typeof useBreedStandard>;
type Fmt = ReturnType<typeof useFormat>;

interface Props {
  tab: TabId;
  active: boolean;
  flocks: Flock[];
  birds: Bird[];
  breeds: Breed[];
  halls: Hall[];
  zones: Zone[];
  invoices: Invoice[];
  breedStd: BreedStd;
  fmt: Fmt;
  vaccineEnabled: boolean;
  kpiData: FlocksKpi;
  onEdit: (f: Flock) => void;
  onAdd: () => void;
  triggerBadge: (id: TabId) => void;
}

export default function FlockTabPanel({
  tab, active,
  flocks, birds, breeds, halls, zones, invoices,
  breedStd, fmt, vaccineEnabled, kpiData,
  onEdit, onAdd, triggerBadge,
}: Props) {
  const { add, remove, archive, restore, toggleHidden, togglePaused } = useFlk();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [undoData, setUndoData] = useState<{ flock: Flock | Flock[] } | null>(null);

  // ─── مرحله ۱: tab filter ───
  const tabFiltered = useMemo(
    () => filterFlocksByTab(flocks, tab, '', birds, breeds),
    [flocks, tab, birds, breeds],
  );

  // ─── مرحله ۲: FilterBar ───
  const config = useMemo(
    () => getFlkFlocksConfig({
      birds: birds.map(b => ({ id: b.id, name: b.name })),
      breeds: breeds.map(b => ({ id: b.id, name: b.name, birdId: b.birdId })),
      halls: halls.map(h => ({ id: h.id, name: h.name })),
      zones: zones.map(z => ({ id: z.id, name: z.name, hallId: z.hallId })),
    }),
    [birds, breeds, halls, zones],
  );

  const { filtered: list, filters, setFilter, clearFilter, sort, setSort, toggleSort,
          resetAll, hasActiveFilters, total, count } = useFilterSort<Flock>({
    items: tabFiltered,
    filters: config.filterDefs,
    sorts: config.sortDefs,
    // 🆕 per-tab persist key
    persistKey: `flk-flocks-${tab}`,
    initialSort: config.initialSort,
  });

  useFab(active ? { label: 'افزودن گله', onClick: onAdd } : null);

  const ms = useMultiSelect({
    items: list,
    getId: (f: Flock) => f.id,
    onDelete: async (ids) => {
      // 🆕 چک ارجاع — کدوم گله‌ها توی dlg/egg/tra استفاده شدن؟
      const withRefs = ids.filter(id => hasRefs(id));
      const withoutRefs = ids.filter(id => !hasRefs(id));

      let msg = toFa(ids.length) + ' گله حذف شوند؟';
      if (withRefs.length > 0) {
        msg = '';
        if (withoutRefs.length > 0) {
          msg += '• ' + toFa(withoutRefs.length) + ' گله بدون ارجاع → حذف می‌شن\n';
        }
        msg += '• ' + toFa(withRefs.length) + ' گله ارجاع دارن (dlg/egg/tra) → حذف با هشدار\n';
        msg += '\n⚠️ اگه ارجاع‌ها باقی بمونن، آمار اشتباه می‌شه.';
      }

      const ok = await showConfirmAsync('حذف گروهی', msg, { danger: true });
      if (!ok) return;
      const backups: Flock[] = [];
      for (const id of ids) {
        const fl = flocks.find(x => x.id === id);
        if (!fl) continue;
        backups.push(fl);
        try { remove(id); } catch { /* silent */ }
      }
      if (backups.length > 0) {
        setUndoData({ flock: backups });
        setTimeout(() => setUndoData((cur) => cur && Array.isArray(cur.flock) && cur.flock.length === backups.length ? null : cur), 8000);
      }
      toastMsg.deletedBulk(backups.length, 'گله');
      logAction('delete', 'flk', 'حذف گروهی: ' + backups.length);
    },
    onArchive: async (ids) => {
      const ok = await showConfirmAsync('آرشیو گروهی', toFa(ids.length) + ' گله آرشیو شوند؟');
      if (!ok) return;
      for (const id of ids) {
        try { archive(id); } catch { /* silent */ }
      }
      toastMsg.archivedBulk(ids.length, 'گله');
      logAction('update', 'flk', 'آرشیو گروهی ' + ids.length);
      triggerBadge('archived');
    },
  });

  useEffect(() => {
    if (ms.selectionMode) setExpandedId(null);
  }, [ms.selectionMode]);

  const undoDeleteFlock = () => {
    if (undoData == null) return;
    const arr = Array.isArray(undoData.flock) ? undoData.flock : [undoData.flock];
    try {
      arr.forEach(f => add(f));
      toastMsg.restoredBulk(arr.length, 'گله');
    } catch {
      toastMsg.error('بازگردانی ناموفق');
    }
    setUndoData(null);
  };

  const showKpi = tab === 'all' || tab === 'layer' || tab === 'breeder';

  if (!active) return null;

  return (
    <PageContainer>
      {undoData && (
        <UndoBar label="گله حذف شد" onUndo={undoDeleteFlock} onDismiss={() => setUndoData(null)} />
      )}
      <HelpBanner
        id="flk-intro"
        icon="🐔"
        title="مدیریت گله‌ها"
        description="اینجا گله‌های فعال، تخم‌گذار و گوشتی را تعریف و مدیریت می‌کنید. با تعریف گله، امکان ثبت روزانه فعال می‌شود."
        tone="info"
      />
      {showKpi && (
        <>
          <FlocksKpiCards
            totalFlocks={kpiData.totalFlocks}
            totalBirds={kpiData.totalBirds}
            totalValue={kpiData.totalValue}
          />
          <UpcomingFlocks flocks={flocks} breedStd={breedStd} fmt={fmt} tab={tab} />
        </>
      )}

      {/* 🆕 FilterBar */}
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
              padding: '4px 10px',
              background: 'var(--input-bg)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--r-sm)',
              color: 'var(--muted)',
              fontFamily: 'inherit',
              fontSize: '10px',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            {ms.selectedIds.size === list.length ? 'لغو انتخاب همه' : 'انتخاب همه'}
          </button>
        </div>
      )}

      {list.length === 0 ? (
        <Empty
          icon={<svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"><circle cx="9" cy="7" r="4"/><path d="M3 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2"/></svg>}
          title={
            hasActiveFilters ? 'نتیجه‌ای یافت نشد' :
            tab === 'archived' ? 'آرشیو خالی است' :
            tab === 'hidden' ? 'گله‌ای پنهان نیست' :
            tab === 'layer' ? 'گله تخم‌گذار ندارید' :
            tab === 'breeder' ? 'گله مادر ندارید' :
            tab === 'broiler' ? 'گله گوشتی ندارید' :
            'هنوز گله‌ای نساخته‌اید'
          }
          desc={
            hasActiveFilters ? 'فیلترها را تغییر دهید یا پاک کنید.' :
            tab === 'archived' ? 'گله‌های آرشیو‌شده اینجا نمایش داده می‌شوند.' :
            tab === 'hidden' ? 'گله‌های پنهان اینجا نمایش داده می‌شوند.' :
            tab !== 'all' ? 'اولین گله‌ی این نوع را بسازید یا فیلتر را پاک کنید.' :
            'اولین گله‌ی خود را بسازید — گله‌ها به پرنده، نژاد و سالن متصل می‌شوند.'
          }
          action={!hasActiveFilters && tab !== 'archived' ? <Btn variant="primary" onClick={onAdd}>+ افزودن گله</Btn> : undefined}
        />
      ) : (
        <>
          {list.map((f, i) => {
            const bird = birds.find(b => b.id === f.birdId);
            const breed = breeds.find(b => b.id === f.breedId);
            const hall = halls.find(h => h.id === f.hallId);
            const zone = zones.find(z => z.id === f.zoneId);
            const revenue = getFlockRevenue(f.id, invoices);
            const isOpen = !ms.selectionMode && expandedId === f.id;
            return (
              <FlockCard
                key={f.id}
                flock={f}
                index={i}
                bird={bird}
                breed={breed}
                hall={hall}
                zone={zone}
                invoiceRevenue={revenue}
                vaccineEnabled={vaccineEnabled}
                isOpen={isOpen}
                ms={ms}
                fmt={fmt}
                onToggle={() => setExpandedId(isOpen ? null : f.id)}
                onEdit={() => onEdit(f)}
                onArchive={(reason) => {
                  archive(f.id, reason);
                  toastMsg.archived(f.name);
                  logAction('update', 'flk', 'آرشیو گله: ' + f.name);
                  triggerBadge('archived');
                }}
                onRestore={() => restore(f.id)}
                onDelete={async () => {
                  const item = flocks.find(fl => fl.id === f.id);
                  const refs = hasRefs(f.id);
                  const msg = refs
                    ? '«' + f.name + '» توی بخش‌های دیگه (dlg/egg/tra) ارجاع داره.\n\n' +
                      '⚠️ حذف این گله باعث می‌شه داده‌های ارجاعی یتیم بشن.\n\n' +
                      'پیشنهاد: آرشیو کن (به‌جای حذف).'
                    : 'این گله حذف شود؟';
                  const ok = await showConfirmAsync(
                    refs ? 'هشدار ارجاع' : 'تأیید حذف',
                    msg,
                    { danger: true },
                  );
                  if (!ok) return;
                  if (item) {
                    setUndoData({ flock: item });
                    setTimeout(() => setUndoData((cur) => cur && !Array.isArray(cur.flock) && cur.flock.id === item.id ? null : cur), 6000);
                  }
                  remove(f.id);
                  logAction('delete', 'flk', 'حذف از گله‌ها');
                  toastMsg.deleted(f.name);
                }}
                onToggleHidden={() => {
                  const willHide = !f.hidden;
                  toggleHidden(f.id);
                  if (willHide) { toastMsg.hidden(f.name); triggerBadge('hidden'); }
                  else { toastMsg.visible(f.name); }
                }}
                onTogglePaused={() => {
                  togglePaused(f.id);
                  f.paused ? toastMsg.activated(f.name) : toastMsg.paused(f.name);
                }}
              />
            );
          })}
        </>
      )}

      <MultiSelectBar ms={ms} deleteLabel="حذف" archiveLabel="آرشیو" />
    </PageContainer>
  );
}
