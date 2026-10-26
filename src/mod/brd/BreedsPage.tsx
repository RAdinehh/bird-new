import { useState, useMemo, useEffect } from 'react';
import { useFab } from '../../shr/hooks/useFab';
import { useBrd, type Breed } from './store';
import { getBreedDisplayName } from './_display-name';
import { useSet } from '../set/store';
import { useMasterRedirect } from '../../shr/hooks/useMasterRedirect';
import { useFocusParam } from '../../shr/hooks/useFocusParam';
import BreedForm, { EMPTY_BREED_FORM, type BreedFormData } from './BreedForm';
import BreedCard from './BreedCard';
import { Btn, Empty, PageContainer } from '../../shr/components/ui';
import { useMultiSelect } from '../../shr/multiSelect/useMultiSelect';
import MultiSelectBar from '../../shr/multiSelect/MultiSelectBar';
import { useFilterSort, FilterBar, getBrdBreedsConfig } from '../../shr/filter';
import HelpBanner from '../../shr/components/HelpBanner';
import { toFa, toEn } from '../../shr/utils/fa';
import UndoBar from '../../cor/ui/UndoBar';
import { toastMsg } from '../../cor/store/toast';
import { showConfirmAsync } from '../../cor/store/dialog';

export default function BreedsPage({ active = true }: { active?: boolean } = {}) {
  const { birds, breeds: _breedsRaw, addBreed, updateBreed, deleteBreed } = useBrd();
  const [open, setOpen] = useState(false);
  const [initialData, setInitialData] = useState<BreedFormData>(EMPTY_BREED_FORM);
  const customStandards = useSet((st: any) => st.customStandards);
  const customOverrides = useSet((st: any) => st.customOverrides);
  const { redirect: masterRedirect, MasterRedirectModal } = useMasterRedirect();
  const [undoData, setUndoData] = useState<{ item: any } | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const focusId = useFocusParam();
  useEffect(() => {
    if (focusId) setExpandedId(focusId);
  }, [focusId]);

  const _birdsUnique = useMemo(() => {
    const seen = new Set<string>();
    return birds.filter(b => {
      const k = (b.name || '').trim().toLowerCase();
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    });
  }, [birds]);

  const breeds = useMemo(() => {
    const seen = new Set<string>();
    return _breedsRaw.filter(b => {
      const purposesKey = (b.purposes || []).slice().sort().join(',');
      const k = (b.birdId || '') + '|' + (b.name || '').trim().toLowerCase() + '|' + purposesKey;
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    });
  }, [_breedsRaw]);

  const undoDelete = () => {
    const item = undoData;
    if (!item) return;
    try {
      const arr = Array.isArray(item.item) ? item.item : [item.item];
      arr.forEach((it: any) => addBreed(it));
      toastMsg.restored(arr.length === 1 ? 'نژاد' : `${arr.length} نژاد`);
    } catch {
      toastMsg.error('بازگردانی ناموفق');
    }
    setUndoData(null);
  };

  const config = useMemo(() => getBrdBreedsConfig({ birds: _birdsUnique }), [_birdsUnique]);
  const { filtered: list, filters, setFilter, clearFilter, sort, setSort, toggleSort,
          resetAll, hasActiveFilters, total, count } = useFilterSort<Breed>({
    items: breeds,
    filters: config.filterDefs,
    sorts: config.sortDefs,
    persistKey: config.persistKey,
    initialSort: config.initialSort,
  });

  const ms = useMultiSelect({
    items: list,
    getId: (x: any) => x.id,
    onDelete: async (ids: string[]) => {
      const ok = await showConfirmAsync('حذف گروهی', toFa(ids.length) + ' مورد حذف شوند؟', { danger: true });
      if (!ok) return;
      const backups: any[] = [];
      for (const id of ids) {
        const item = _breedsRaw.find((x) => x.id === id);
        if (!item) continue;
        backups.push(item);
        deleteBreed(id);
      }
      if (backups.length > 0) {
        setUndoData({ item: backups });
        setTimeout(() => setUndoData((cur: any) => cur && Array.isArray(cur.item) && cur.item.length === backups.length ? null : cur), 6000);
      }
      toastMsg.deletedBulk(backups.length, 'مورد');
    },
  });

  useEffect(() => {
    if (ms.selectionMode) setExpandedId(null);
  }, [ms.selectionMode]);

  const openNew = () => {
    setInitialData({ id: '', birdId: birds[0]?.id || '', name: '', fcr: '', standardKey: '', purposes: [] });
    setOpen(true);
  };
  useFab(active ? { label: 'افزودن نژاد', onClick: openNew } : null);

  if (birds.length === 0) {
    return (
      <PageContainer>
        <MasterRedirectModal />
        <HelpBanner id="brd-breeds-intro" icon="🧬" title="نژادها"
          description="نژادهای هر پرنده را اینجا تعریف کنید. هر نژاد می‌تواند به استانداردهای علمی وصل شود. برای انتخاب چندتایی، روی یک کارت نگه دارید."
          tone="info" />
        {undoData && <UndoBar label="حذف شد" onUndo={undoDelete} onDismiss={() => setUndoData(null)} />}
        <Empty
          icon={<svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"><path d="M12 2v20M5 8h14M5 16h14"/></svg>}
          title="اول باید پرنده بسازید"
          desc="نژاد به پرنده متصل می‌شود. اول به تب «پرنده‌ها» بروید و یک پرنده بسازید." />
      </PageContainer>
    );
  }

  const openEdit = (b: Breed) => {
    setInitialData({
      id: b.id, birdId: b.birdId,
      name: getBreedDisplayName(b, { customStandards, customOverrides }),
      fcr: b.fcr ? toFa(b.fcr) : '',
      standardKey: b.standardKey || '',
      purposes: b.purposes || [],
    });
    setOpen(true);
  };

  const handleSaved = (data: BreedFormData) => {
    const payload = {
      birdId: data.birdId,
      name: data.name.trim(),
      fcr: data.fcr ? parseFloat(toEn(String(data.fcr)).replace('٫', '.')) || null : null,
      standardKey: data.standardKey || undefined,
      purposes: data.purposes || [],
    };
    if (data.id) updateBreed(data.id, payload);
    else addBreed(payload);
    setOpen(false);
  };

  return (
    <PageContainer>
      <MasterRedirectModal />
      <FilterBar
        filterDefs={config.filterDefs} sortDefs={config.sortDefs}
        filterState={filters} sortState={sort}
        setFilter={setFilter} clearFilter={clearFilter}
        setSort={setSort} toggleSort={toggleSort}
        resetAll={resetAll} hasActiveFilters={hasActiveFilters}
        total={total} count={count} />

      {!ms.selectionMode && list.length > 1 && (
        <div style={{ fontSize: 'var(--fs-2xs)', color: 'var(--dim)', textAlign: 'center', paddingBottom: 2 }}>
          برای انتخاب چندتایی، روی یک کارت نگه دارید
        </div>
      )}

      {ms.selectionMode && list.length > 1 && (
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 6 }}>
          <button type="button"
            aria-label={ms.selectedIds.size === list.length ? 'لغو انتخاب همه' : 'انتخاب همه'}
            onClick={ms.selectedIds.size === list.length ? ms.clearSelection : ms.selectAll}
            style={{ padding: 'var(--pad-btn-sm)', background: 'var(--input-bg)', border: '1px solid var(--border)',
              borderRadius: 'var(--r-sm)', color: 'var(--muted)', fontFamily: 'inherit',
              fontSize: 'var(--fs-2xs)', fontWeight: 600, cursor: 'pointer' }}>
            {ms.selectedIds.size === list.length ? 'لغو انتخاب همه' : 'انتخاب همه'}
          </button>
        </div>
      )}

      {list.length === 0 ? (
        <Empty
          icon={<svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"><path d="M12 2v20M5 8h14M5 16h14"/></svg>}
          title="نژادی ثبت نشده"
          desc="برای هر پرنده می‌توانید چند نژاد بسازید — مثلاً لگهورن، بلاک استار."
          action={<Btn variant="primary" onClick={openNew}>+ افزودن نژاد</Btn>} />
      ) : (
        <>
          {list.map((b, i) => {
            const bird = birds.find(x => x.id === b.birdId);
            const isOpen = !ms.selectionMode && expandedId === b.id;
            return (
              <BreedCard
                key={b.id} breed={b} index={i} bird={bird} isOpen={isOpen}
                onToggle={() => setExpandedId(isOpen ? null : b.id)}
                ms={ms} customStandards={customStandards} customOverrides={customOverrides}
                onEdit={openEdit}
                onDelete={(id, item) => {
                  setUndoData({ item });
                  setTimeout(() => setUndoData((cur: any) => cur && cur.item.id === item.id ? null : cur), 6000);
                  deleteBreed(id);
                }} />
            );
          })}
        </>
      )}

      <MultiSelectBar ms={ms} deleteLabel="حذف" />
      {ms.selectionMode && <div style={{ height: 90 }} />}

      <BreedForm
        open={open}
        onClose={() => setOpen(false)}
        initialData={initialData}
        birds={birds}
        breeds={breeds}
        customStandards={customStandards}
        customOverrides={customOverrides}
        onSaved={handleSaved}
        onRedirectToStandards={(name) => masterRedirect('breedStandard', name)} />
    </PageContainer>
  );
}
