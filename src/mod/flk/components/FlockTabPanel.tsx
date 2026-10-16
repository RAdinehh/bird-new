/**
 * FlockTabPanel — محتوای یک تب از گله‌ها (برای carousel)
 * الگو: hal/index.tsx
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
import { getFlockRevenue } from '../api/flocksCalc';
import { useMultiSelect } from '../../../shr/multiSelect/useMultiSelect';
import MultiSelectBar from '../../../shr/multiSelect/MultiSelectBar';
import UndoBar from '../../../cor/ui/UndoBar';
import { Btn, Empty, PageContainer } from '../../../shr/components/ui';
import HelpBanner from '../../../shr/components/HelpBanner';
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

  const list = useMemo(
    () => filterFlocksByTab(flocks, tab, '', birds, breeds),
    [flocks, tab, birds, breeds],
  );

  useFab(active ? { label: 'افزودن گله', onClick: onAdd } : null);

  const ms = useMultiSelect({
    items: list,
    getId: (f: Flock) => f.id,
    onDelete: async (ids) => {
      const ok = await showConfirmAsync('حذف گروهی', toFa(ids.length) + ' گله حذف شوند؟', { danger: true });
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
          title={tab === 'archived' ? 'آرشیو خالی است' : 'هنوز گله‌ای نساخته‌اید'}
          desc="اولین گله‌ی خود را بسازید — گله‌ها به پرنده، نژاد و سالن متصل می‌شوند."
          action={tab !== 'archived' ? <Btn variant="primary" onClick={onAdd}>+ افزودن گله</Btn> : undefined}
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
                onDelete={() => {
                  const item = flocks.find(fl => fl.id === f.id);
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
