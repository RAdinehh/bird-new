import { useState, useMemo, useEffect } from 'react';
import { useFab } from '../../shr/hooks/useFab';
import { useBrd, type Breed } from './store';
import { getBreedDisplayName } from './_display-name';
import { useSet } from '../set/store';
import { useFormDraft } from '../../shr/hooks/useFormDraft';
import { useFocusParam } from '../../shr/hooks/useFocusParam';
import BreedForm, { EMPTY_BREED_FORM, type BreedFormData } from './BreedForm';
import BreedCard from './BreedCard';
import { DEFAULT_STANDARDS } from '../set/standards/data';
import { resolveStandard } from './_display-values';
import { Btn, Empty, PageContainer, Select } from '../../shr/components/ui';import { useMultiSelect } from '../../shr/multiSelect/useMultiSelect';
import MultiSelectBar from '../../shr/multiSelect/MultiSelectBar';
import { useFilterSort, FilterBar, getBrdBreedsConfig } from '../../shr/filter';
import HelpBanner from '../../shr/components/HelpBanner';
import { toFa, toEn } from '../../shr/utils/fa';
import UndoBar from '../../cor/ui/UndoBar';
import { toastMsg } from '../../cor/store/toast';
import { showConfirmAsync } from '../../cor/store/dialog';


/** پیدا کردن کلید استاندارد از اسم نژاد — فقط match دقیق (طبق استاندارد) */
function findStandardKey(name: string): string | undefined {
  const clean = name.trim().toLowerCase();
  if (!clean) return undefined;
  for (const [key, std] of Object.entries(DEFAULT_STANDARDS as any) as [string, any][]) {
    if (std.nameFa?.trim().toLowerCase() === clean) return key;
    if (std.nameEn?.trim().toLowerCase() === clean) return key;
  }
  return undefined;
}

export default function BreedsPage({ active = true }: { active?: boolean } = {}) {
  const { birds, breeds: _breedsRaw, addBreed, updateBreed, deleteBreed } = useBrd();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<BreedFormData>(EMPTY_BREED_FORM);
  const customStandards = useSet((st: any) => st.customStandards);
  const customOverrides = useSet((st: any) => st.customOverrides);
  const [err, setErr] = useState('');
  const [undoData, setUndoData] = useState<{ item: any } | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  // 🆕 focus از URL → باز کردن کارت
  const focusId = useFocusParam();
  useEffect(() => {
    if (focusId) setExpandedId(focusId);
  }, [focusId]);
  const draft = useFormDraft('brd-breed', form, (v: any) => setForm(v));

  // فیلتر تکرارها تو render (per bird + name)
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
      const k = (b.birdId || '') + '|' + (b.name || '').trim().toLowerCase();
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    });
  }, [_breedsRaw]);

  const undoDelete = () => {
    const item = undoData;
    if (!item) return;
    try {
      addBreed(item.item);
      toastMsg.restored('نژاد')
    } catch (err) {
      toastMsg.error('بازگردانی ناموفق')
    }
    setUndoData(null);
  };


  // فیلتر/مرتب
  const config = useMemo(() => getBrdBreedsConfig({ birds: _birdsUnique }), [_birdsUnique]);
  const { filtered: list, filters, setFilter, clearFilter, sort, setSort, toggleSort,
          resetAll, hasActiveFilters, total, count } = useFilterSort<Breed>({
    items: breeds,
    filters: config.filterDefs,
    sorts: config.sortDefs,
    persistKey: config.persistKey,
    initialSort: config.initialSort,
  });

  // ─── Multi-Select ───
  const ms = useMultiSelect({
    items: list,
    getId: (x: any) => x.id,
    onDelete: async (ids: string[]) => {
      const ok = await showConfirmAsync('حذف گروهی', toFa(ids.length) + ' مورد حذف شوند؟', { danger: true });
      if (!ok) return;
      const backups: any[] = [];
      for (const id of ids) {
        const item = _breedsRaw.find((x: any) => x.id === id);
        if (!item) continue;
        backups.push(item);
        deleteBreed(id);
      }
      if (backups.length > 0) {
        setUndoData({ item: backups });
        setTimeout(() => setUndoData((cur: any) => cur && Array.isArray(cur.item) && cur.item.length === backups.length ? null : cur), 6000);
      }
      toastMsg.deletedBulk(backups.length, 'مورد')
    },
  });

  useEffect(() => {
    if (ms.selectionMode) setExpandedId(null);
  }, [ms.selectionMode]);


  const openNew = () => {
    if (!draft.hasDraft) setForm({ id:'', birdId: birds[0].id, name:'', fcr:'', standardKey:'', purposes: [] });
    setErr(''); setOpen(true);
  };
  useFab(active ? { label: 'افزودن نژاد', onClick: openNew } : null);


  if (birds.length === 0) {
    return (
      <PageContainer>
      <HelpBanner
        id="brd-breeds-intro"
        icon="🧬"
        title="نژادها"
        description="نژادهای هر پرنده را اینجا تعریف کنید. هر نژاد می‌تواند به استانداردهای علمی وصل شود. برای انتخاب چندتایی، روی یک کارت نگه دارید."
        tone="info"
      />
      {undoData && (
        <UndoBar
          label="حذف شد"
          onUndo={undoDelete}
          onDismiss={() => setUndoData(null)}
        />
      )}
        <Empty
          icon={<svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"><path d="M12 2v20M5 8h14M5 16h14"/></svg>}
          title="اول باید پرنده بسازید"
          desc="نژاد به پرنده متصل می‌شود. اول به تب «پرنده‌ها» بروید و یک پرنده بسازید."
        />
      </PageContainer>
    );
  }

  const openEdit = (b: Breed) => {
    setForm({
      id: b.id,
      birdId: b.birdId,
      // 🆕 نام پویا از استاندارد (اگه standardKey داره)
      name: getBreedDisplayName(b, { customStandards, customOverrides }),
      fcr: b.fcr ? toFa(b.fcr) : '',
      standardKey: (b as any).standardKey || '',
      purposes: (b as any).purposes || [],
    });
    
    setErr(''); setOpen(true);
  };

  const save = () => {

    // 🔒 جلوگیری قاطع از نام تکراری نژاد
    if (!form.id) {
      const _trimmed = form.name.trim();
      const _dup = breeds.find((x: any) => x.birdId === form.birdId && x.name.trim() === _trimmed);
      if (_dup) {
        setErr(`نام «${_dup.name}» تکراریه — یا ویرایشش کن یا اسم دیگه بذار`);
        return;
      }
    }

    if (!form.name.trim()) { setErr('نام نژاد اجباری است'); return; }

    // 🆕 چک: نام باید با یک استاندارد match کنه (با احتساب overrides)
    const baseStandards = { ...(DEFAULT_STANDARDS as any), ...customStandards };
    const allStandards: Record<string, any> = {};
    for (const [k, v] of Object.entries(baseStandards)) {
      const ov = customOverrides[k];
      allStandards[k] = ov?.nameFa ? { ...(v as any), nameFa: ov.nameFa } : v;
    }

    const trimmedName = form.name.trim().toLowerCase();
    const matchedByKey = form.standardKey ? allStandards[form.standardKey] : null;

    if (matchedByKey) {
      // اگه standardKey داریم، نام باید با nameFa (با override) هماهنگ باشه
      const stdName = matchedByKey.nameFa?.trim() || '';
      if (stdName.toLowerCase() !== trimmedName) {
        // 🆕 اگه نام فعلی فقط snapshot قدیمیه (از قبل ذخیره شده)، خودکار آپدیت کن
        // چک: آیا نام فعلی با *base* استاندارد (بدون override) یکی ئه؟
        const baseStd = (DEFAULT_STANDARDS as any)[form.standardKey];
        const baseName = baseStd?.nameFa?.trim().toLowerCase();
        if (baseName === trimmedName) {
          // snapshot قدیمی → خودکار نام رو با override نهایی جایگزین کن
          (form as any).name = stdName;
        } else {
          setErr(`نام نژاد با استاندارد «${stdName}» هماهنگ نیست — یا نام رو درست کن یا نژاد رو دوباره از لیست انتخاب کن`);
          return;
        }
      }
    } else {
      // اگه standardKey نداریم، نام باید با یکی از استانداردها یکی باشه
      const matchedByName = Object.entries(allStandards).find(
        ([_, std]: [string, any]) =>
          std?.nameFa?.trim().toLowerCase() === trimmedName
      );
      if (!matchedByName) {
        setErr(`«${form.name.trim()}» توی استانداردها نیست — لطفاً از لیست انتخاب کن`);
        return;
      }
      // خودکار standardKey رو ست کن
      (form as any).standardKey = matchedByName[0];
    }

    if (!form.purposes || form.purposes.length === 0) {
      setErr('حداقل یک هدف پرورش انتخاب کن');
      return;
    }
    const payload = {
      birdId: form.birdId,
      name: form.name.trim(),
      fcr: form.fcr ? parseFloat(toEn(form.fcr).replace('٫','.')) || null : null,
      standardKey: form.standardKey || undefined,
      purposes: form.purposes || [],
    };
    if (form.id) updateBreed(form.id, payload); else addBreed(payload);
    draft.clear();
    setOpen(false);
  };


  return (
    <PageContainer>
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
          icon={<svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"><path d="M12 2v20M5 8h14M5 16h14"/></svg>}
          title="نژادی ثبت نشده"
          desc="برای هر پرنده می‌توانید چند نژاد بسازید — مثلاً لگهورن، بلاک استار."
          action={<Btn variant="primary" onClick={openNew}>+ افزودن نژاد</Btn>}
        />
      ) : (
        <>
          {list.map((b, i) => {
            const bird = birds.find(x => x.id === b.birdId);
            const isOpen = !ms.selectionMode && expandedId === b.id;
            return (
              <BreedCard
                key={b.id}
                breed={b}
                index={i}
                bird={bird}
                isOpen={isOpen}
                onToggle={() => setExpandedId(isOpen ? null : b.id)}
                ms={ms}
                customStandards={customStandards}
        customOverrides={customOverrides}
                onEdit={openEdit}
                onDelete={(id, item) => {
                  setUndoData({ item });
                  setTimeout(() => setUndoData((cur: any) => cur && cur.item.id === item.id ? null : cur), 6000);
                  deleteBreed(id);
                }}
              />
            );
          })}
          
        </>
      )}

      <MultiSelectBar ms={ms} deleteLabel="حذف" />

      {ms.selectionMode && <div style={{ height: 90 }} />}

      <BreedForm
        open={open}
        onClose={() => setOpen(false)}
        customStandards={customStandards}
        customOverrides={customOverrides}
        form={form}
        setForm={setForm}
        err={err}
        birds={birds}
        breeds={breeds}
        onSave={save}
      />
    </PageContainer>
  );
}

