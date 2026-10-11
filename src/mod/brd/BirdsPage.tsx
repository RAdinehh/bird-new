import { useState, useMemo, useEffect } from 'react';
import { useFab } from '../../shr/hooks/useFab';
import { useFocusParam } from '../../shr/hooks/useFocusParam';
import { useFormDraft } from '../../shr/hooks/useFormDraft';
import { useBrd, type Bird } from './store';
import { useSet } from '../set/store';
import { detectCycleDaysSource, detectFcrSource, getOverrideInfo } from './_source';
import OverrideHint from '../../shr/components/OverrideHint';
import BirdForm, { EMPTY_BIRD_FORM, type BirdFormData } from './BirdForm';
import { BirdSchema } from '../../shr/validation/rules/brd';
import BirdCard from './BirdCard';
import {
  Btn, BtnRow, Empty, Field,
  Grid2, Input, NumField,
  PageContainer
} from '../../shr/components/ui';import { useMultiSelect } from '../../shr/multiSelect/useMultiSelect';
import MultiSelectBar from '../../shr/multiSelect/MultiSelectBar';
import { useFilterSort, FilterBar, getBrdBirdsConfig } from '../../shr/filter';
import HelpBanner from '../../shr/components/HelpBanner';
import { toFa, toEn } from '../../shr/utils/fa';
import UndoBar from '../../cor/ui/UndoBar';
import { showToast, toastMsg } from '../../cor/store/toast';
import { showConfirmAsync } from '../../cor/store/dialog';


export default function BirdsPage({ active = true }: { active?: boolean } = {}) {
  const { birds: _birdsRaw, breeds, addBird, updateBird, deleteBird } = useBrd();
  const customStandards = useSet((st: any) => st.customStandards);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<BirdFormData>(EMPTY_BIRD_FORM);
  const [error, setError] = useState('');
  const [undoData, setUndoData] = useState<{ item: any } | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const draft = useFormDraft('brd-bird', form, (v: any) => setForm(v));

  // 🆕 focus از URL → باز کردن کارت
  const focusId = useFocusParam();
  useEffect(() => {
    if (focusId) setExpandedId(focusId);
  }, [focusId]);

  // فیلتر تکرارها تو render
  const birds = useMemo(() => {
    const seen = new Set<string>();
    return _birdsRaw.filter(b => {
      const k = (b.name || '').trim().toLowerCase();
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    });
  }, [_birdsRaw]);

  // ─── گروه‌بندی نژادها بر اساس birdId (رفع N+1) ───
  const breedsByBird = useMemo(() => {
    const map = new Map<string, typeof breeds>();
    for (const bd of breeds) {
      const arr = map.get(bd.birdId) || [];
      arr.push(bd);
      map.set(bd.birdId, arr);
    }
    return map;
  }, [breeds]);

  // ─── فیلتر/مرتب (از config مرکزی) ───
  const config = useMemo(() => getBrdBirdsConfig({ breeds }), [breeds]);
  const { filtered: list, filters, setFilter, clearFilter, sort, setSort, toggleSort,
          resetAll, hasActiveFilters, total, count } = useFilterSort<Bird>({
    items: birds,
    filters: config.filterDefs,
    sorts: config.sortDefs,
    persistKey: config.persistKey,
    initialSort: config.initialSort,
  });

  // ─── Multi-Select ───
  const ms = useMultiSelect({
    items: list,
    getId: (b: any) => b.id,
    onDelete: async (ids: string[]) => {
      const ok = await showConfirmAsync('حذف گروهی', toFa(ids.length) + ' پرنده حذف شوند؟', { danger: true });
      if (!ok) return;
      const backups: any[] = [];
      for (const id of ids) {
        const item = birds.find(b => b.id === id);
        if (!item) continue;
        backups.push(item);
        deleteBird(id);
      }
      if (backups.length > 0) {
        setUndoData({ item: backups });
        setTimeout(() => setUndoData((cur: any) => cur && Array.isArray(cur.item) && cur.item.length === backups.length ? null : cur), 6000);
      }
      toastMsg.deletedBulk(backups.length, 'پرنده')
    },
  });

  useEffect(() => {
    if (ms.selectionMode) setExpandedId(null);
  }, [ms.selectionMode]);


  const openNew = () => { if (!draft.hasDraft) setForm(EMPTY_BIRD_FORM); setError(''); setOpen(true);  };
  const openEdit = (b: Bird) => {
    setForm({ id: b.id, name: b.name, cycleDays: b.cycleDays ? toFa(b.cycleDays) : '', fcrStandard: b.fcrStandard ? toFa(b.fcrStandard) : '', standardKey: (b as any).standardKey || '', birdKind: (b as any).birdKind, purpose: (b as any).purpose });
    
    setError(''); setOpen(true);
  };
  useFab(active ? { label: 'افزودن پرنده', onClick: openNew } : null);
  const save = () => {

    // 🔒 جلوگیری قاطع از نام تکراری پرنده
    if (!form.id) {
      const _trimmed = form.name.trim();
      const _dup = birds.find((x: any) => x.name.trim() === _trimmed);
      if (_dup) {
        setError(`نام «${_dup.name}» تکراریه — یا ویرایشش کن یا اسم دیگه بذار`);
        return;
      }
    }

    // اعتبارسنجی با Zod
    const result = BirdSchema.safeParse({
      ...form,
      cycleDays: form.cycleDays ? form.cycleDays : undefined,
      fcrStandard: form.fcrStandard ? form.fcrStandard.replace('٫', '.') : undefined,
    });
    if (!result.success) {
      const first = result.error.issues[0];
      setError(first?.message || 'خطا در اعتبارسنجی');
      return;
    }
    const payload = result.data as any;
    if (form.id) updateBird(form.id, payload); else addBird(payload);
    draft.clear();
    setForm(EMPTY_BIRD_FORM);
    setOpen(false);
  };

  const undoDelete = () => {
    const item = undoData;
    if (!item) return;
    try {
      addBird(item.item);
      toastMsg.restored('پرنده')
    } catch (err) {
      toastMsg.error('بازگردانی ناموفق')
    }
    setUndoData(null);
  };

  return (
    <PageContainer>
      {undoData && (
        <UndoBar
          label="حذف شد"
          onUndo={undoDelete}
          onDismiss={() => setUndoData(null)}
        />
      )}

      <HelpBanner
        id="brd-birds-intro"
        icon="🐔"
        title="پرنده‌ها"
        description="پرنده‌های اصلی (مرغ، بوقلمون، اردک، بلدرچین، غاز و...) را اینجا تعریف کنید. برای انتخاب چندتایی، روی یک کارت نگه دارید."
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
        <div style={{ fontSize: 'var(--fs-2xs)', color: 'var(--dim)', textAlign: 'center', paddingBottom: 2 }}>
          برای انتخاب چندتایی، روی یک کارت نگه دارید
        </div>
      )}

      {ms.selectionMode && list.length > 1 && (
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 6 }}>
          <button type="button"
            onClick={ms.selectedIds.size === list.length ? ms.clearSelection : ms.selectAll}
            style={{ padding: 'var(--pad-btn-sm)', background: 'var(--input-bg)', border: '1px solid var(--border)', borderRadius: 'var(--r-sm)', color: 'var(--muted)', fontFamily: 'inherit', fontSize: 'var(--fs-2xs)', fontWeight: 600, cursor: 'pointer' }}>
            {ms.selectedIds.size === list.length ? 'لغو انتخاب همه' : 'انتخاب همه'}
          </button>
        </div>
      )}

      {list.length === 0 ? (
        <Empty
          icon={<svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"><circle cx="9" cy="7" r="4"/><path d="M3 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2"/></svg>}
          title="هنوز پرنده‌ای اضافه نکرده‌اید"
          desc="اولین پرنده‌ی خود را بسازید — مثلاً «مرغ». بعد از آن می‌توانید نژادهایش را اضافه کنید."
          action={<Btn variant="primary" onClick={openNew}>+ افزودن پرنده</Btn>}
        />
      ) : (
        <>
          {list.map((b, i) => {
            const birdBreeds = breedsByBird.get(b.id) || [];
            const isOpen = !ms.selectionMode && expandedId === b.id;
            return (
              <BirdCard
                key={b.id}
                bird={b}
                index={i}
                birdBreeds={birdBreeds}
                isOpen={isOpen}
                onToggle={() => setExpandedId(isOpen ? null : b.id)}
                ms={ms}
                customStandards={customStandards}
                onEdit={openEdit}
                onDelete={(id, item) => {
                  setUndoData({ item });
                  setTimeout(() => setUndoData((cur: any) => cur && cur.item.id === item.id ? null : cur), 6000);
                  deleteBird(id);
                }}
              />
            );
          })}
          
        </>
      )}

      <MultiSelectBar ms={ms} deleteLabel="حذف" />

      {ms.selectionMode && <div style={{ height: 90 }} />}

      <BirdForm
        open={open}
        onClose={() => setOpen(false)}
        form={form}
        setForm={setForm}
        error={error}
        birds={birds}
        onSave={save}
      />
    </PageContainer>
  );
}
