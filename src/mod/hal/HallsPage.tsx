/**
 * HallsPage — سالن‌ها
 */
import { useState, useMemo, useEffect } from 'react';
import HallCard from './components/HallCard';
import HallsFormModal from './components/HallsFormModal';
import { useFab } from '../../shr/hooks/useFab';
import { useFocusParam } from '../../shr/hooks/useFocusParam';
import { useValidation } from '../../shr/validation/useValidation';
import { createHallSchema } from '../../shr/validation/rules/hal';
import { useHal, type Hall } from './store';
import { useBrd, type Bird, type Breed } from '../brd/store';
import { useCtc, type Person } from '../ctc/store';
import { useFormDraft } from '../../shr/hooks/useFormDraft';
import { useBreedStandard } from '../../shr/hooks/useBreedStandard';
import { useFlk,  type Flock} from '../flk/store';
import { Btn, Empty, PageContainer } from '../../shr/components/ui';
import { useMultiSelect } from '../../shr/multiSelect/useMultiSelect';
import MultiSelectBar from '../../shr/multiSelect/MultiSelectBar';
import { useFilterSort, FilterBar, getHalHallsConfig } from '../../shr/filter';
import HelpBanner from '../../shr/components/HelpBanner';
import { toFa, toEn } from '../../shr/utils/fa';
import { useTempUnit } from '../../shr/utils/temp';
import { useFormat } from '../../shr/units';
import { type HallFormData, empty, calcSuggestedCapacity } from './_hallsHelpers';
import { useHallsCascade } from './hooks/useHallsCascade';
import UndoBar from '../../cor/ui/UndoBar';
import { toastMsg } from '../../cor/store/toast';
import { showConfirmAsync } from '../../cor/store/dialog';
import { findInRange } from '../set/standards/resolve';
import { getAgeDays } from '../flk/helpers-store';



export default function HallsPage({ active = true }: { active?: boolean } = {}) {
  const { halls: _hallsRaw, zones, equipment, addHall, updateHall, deleteHall } = useHal();
  const breedStd = useBreedStandard();
  const { flocks, update: updateFlock } = useFlk();
  const { breeds, birds } = useBrd();
  const { contacts: allContacts } = useCtc();
  const workers = allContacts.filter((c: Person) => (c.roles || []).includes('worker'));
  const birdNames = useMemo(() => new Map(birds.map((b: Bird) => [b.id, b.name])), [birds]);
  const breedNames = useMemo(() => new Map(breeds.map((b: Breed) => [b.id, b.name])), [breeds]);
  const workerNames = useMemo(() => new Map(allContacts.map((c: Person) => [c.id, c.name || ''])), [allContacts]);
  const [open, setOpen] = useState(false);
  const [autoFields, setAutoFields] = useState<Set<string>>(new Set());
  const [form, setForm] = useState<HallFormData>(empty);
  const draft = useFormDraft('hal-hall', form, (v: HallFormData) => setForm(v));
  const [err, setErr] = useState('');
  const [dupError, setDupError] = useState<string | null>(null);
  const [saveAttempted, setSaveAttempted] = useState(false);
  const [undoData, setUndoData] = useState<{ item: Hall | Hall[] } | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // 🆕 focus از URL → باز کردن کارت
  const focusId = useFocusParam();
  useEffect(() => {
    if (focusId) setExpandedId(focusId);
  }, [focusId]);

  /** 🆕 وقتی سالنی حذف می‌شه، گله‌های یتیم رو آزاد کن */
  useHallsCascade(_hallsRaw, flocks, updateFlock);
  const tempUnit = useTempUnit();
  const __breedStd = form.breedId ? breedStd.byBreedId(form.breedId) : null;
  const __suggestedCap = calcSuggestedCapacity(
    parseFloat(toEn(form.length)) || null,
    parseFloat(toEn(form.width)) || null,
    __breedStd?.space?.densityMax ?? null,
  );
  // 🆕 محاسبه پویا: اگر گله فعالی در این سالن باشد، از سن گله استفاده کن
  const __editingFlock = form.id ? flocks.find(f => f.hallId === form.id && f.status === 'active') : null;
  const __editingAge = __editingFlock ? getAgeDays(__editingFlock) : 1;
  const __stdEnv = __breedStd?.env ? findInRange(__breedStd.env, __editingAge) : null;
  const __stdTemp = (__stdEnv as any)?.temp?.target ?? __breedStd?.env?.[0]?.temp?.target ?? null;
  const __stdHumidity = (__stdEnv as any)?.humidity?.min ?? __breedStd?.env?.[0]?.humidity?.min ?? null;
  const fmt = useFormat();

  const halls = useMemo(() => {
    const seen = new Set<string>();
    return _hallsRaw.filter(h => {
      const k = (h.name || '').trim().toLowerCase();
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    });
  }, [_hallsRaw]);

  // ─── فیلتر/مرتب (از config مرکزی) ───
  const config = useMemo(
    () => getHalHallsConfig({
      birdNames: birds.map(b => ({ id: b.id, name: b.name })),
      breeds: breeds.map((b: Breed) => ({ id: b.id, name: b.name, birdId: b.birdId })),
      zones,
      equipment,
      flocks: flocks.map(f => ({ id: f.id, hallId: f.hallId, status: f.status })),
    }),
    [birds, zones, equipment, flocks]
  );
  const { filtered: _listRaw, filters, setFilter, clearFilter, sort, setSort, toggleSort,
          resetAll, hasActiveFilters, total, count } = useFilterSort<Hall>({
    items: halls,
    filters: config.filterDefs,
    sorts: config.sortDefs,
    persistKey: config.persistKey,
    initialSort: config.initialSort,
  });

  const list = useMemo(() => _listRaw.filter((h: Hall) => !h.archived), [_listRaw]);


  // ─── Multi-Select ───
  const ms = useMultiSelect({
    items: halls,
    getId: (h: Hall) => h.id,
    onDelete: async (ids: string[]) => {
      let totalZones = 0;
      let totalEquip = 0;
      let hasFlocks = 0;
      for (const id of ids) {
        totalZones += zones.filter(z => z.hallId === id).length;
        totalEquip += equipment.filter(e => e.hallId === id).length;
        try {
          const flk = JSON.parse(localStorage.getItem('pm-flk') || '{}');
          const flocks = flk.state?.flocks || flk.flocks || [];
          if (flocks.some((f: Flock) => f.hallId === id && f.status === 'active')) hasFlocks++;
        } catch { /* silent */ }
      }
      const targetNames = ids.map(id => halls.find(h => h.id === id)?.name).filter(Boolean).join('، ');
      let msg = ids.length === 1 
        ? `آیا از حذف سالن «${targetNames}» مطمئن هستید؟\n\n`
        : `آیا از حذف ${toFa(ids.length)} سالن (${targetNames}) مطمئن هستید؟\n\n`;
        
      if (totalZones > 0 || totalEquip > 0 || hasFlocks > 0) {
        msg += `📋 تأثیرات این حذف:\n`;
        if (totalZones > 0) msg += `${toFa(totalZones)} بخش (Zone) به طور کامل حذف می‌شود.\n`;
        if (totalEquip > 0) msg += `${toFa(totalEquip)} تجهیز متصل به این سالن حذف می‌شود.\n`;
        if (hasFlocks > 0) msg += `${toFa(hasFlocks)} گله فعال بدون سالن می‌ماند (گله‌ها حذف نمی‌شوند).\n`;
      } else {
        msg += `این سالن هیچ بخش، تجهیز یا گله فعالی ندارد.`;
      }
      const ok = await showConfirmAsync('حذف گروهی', msg, { danger: true });
      if (!ok) return;
      const backups: Hall[] = [];
      for (const id of ids) {
        const item = halls.find(h => h.id === id);
        if (!item) continue;
        backups.push(item);
        deleteHall(id);
      }
      if (backups.length > 0) {
        setUndoData({ item: backups });
        setTimeout(() => setUndoData((cur) => cur && Array.isArray(cur.item) && cur.item.length === backups.length ? null : cur), 8000);
      }
      toastMsg.deletedBulk(backups.length, 'سالن')
    },
    onArchive: async (ids) => {
      const ok = await showConfirmAsync('آرشیو گروهی', toFa(ids.length) + ' سالن آرشیو شوند؟', { danger: false });
      if (!ok) return;
      for (const id of ids) {
        try { updateHall(id, { archived: true }); } catch {}
      }
      toastMsg.archivedBulk(ids.length, 'سالن');
    },
  });

  useEffect(() => {
    if (ms.selectionMode) setExpandedId(null);
  }, [ms.selectionMode]);


  const setFromStd = (fields: Record<string, string>) => {
    setForm((f) => ({ ...f, ...fields }));
    setAutoFields(new Set(Object.keys(fields)));
  };

  const clearAuto = (key: string) => {
    if (autoFields.has(key)) {
      const next = new Set(autoFields);
      next.delete(key);
      setAutoFields(next);
    }
  };

  const openNew = () => {
    setAutoFields(new Set()); setForm(empty); setErr(''); setDupError(null); setSaveAttempted(false); setOpen(true); };
  const openEdit = (h: Hall) => {
    setAutoFields(new Set());
    setForm({
      id: h.id, name: h.name, code: h.code,
      length: h.length ? toFa(h.length) : '', width: h.width ? toFa(h.width) : '', height: h.height ? toFa(h.height) : '',
      capacity: h.capacity ? toFa(h.capacity) : '', targetTemp: h.targetTemp ? toFa(h.targetTemp) : '',
         targetHumidity: h.targetHumidity ? toFa(h.targetHumidity) : '',
        
      ventilation: h.ventilation ? toFa(h.ventilation) : '', light: h.light ? toFa(h.light) : '',
      ventilationSystem: h.ventilationSystem || '',
      feederType: h.feederType || '',
      drinkerType: h.drinkerType || '',
      litterType: h.litterType || '',
      address: h.address, builtAt: h.builtAt, lastSanitizedAt: h.lastSanitizedAt, sanitizeNotes: h.sanitizeNotes || '', status: h.status || 'empty', responsibleId: h.responsibleId || '', notes: h.notes,
      birdId: h.birdId || '',
      breedId: h.breedId || ''
      });
    setErr(''); setDupError(null); setSaveAttempted(false); setOpen(true);
  };
  useFab(active ? { label: 'افزودن سالن', onClick: openNew } : null);
  const num = (s: string) => s ? parseFloat(toEn(s).replace('٫','.')) || null : null;

  // ═══ اعتبارسنجی زنده ═══
  const { errors: vErrors } = useValidation(
    createHallSchema(),
    {
      name: form.name || '',
      code: (form.code || '').trim() || (form.name || '').trim().toLowerCase().replace(/\s+/g, '-') || 'hall',
      length: num(form.length),
      width: num(form.width),
      height: num(form.height),
      capacity: num(form.capacity),
      targetTemp: num(form.targetTemp),
      targetHumidity: num(form.targetHumidity),
      ventilation: num(form.ventilation),
      light: num(form.light),
      ventilationSystem: form.ventilationSystem || '',
      feederType: form.feederType || '',
      drinkerType: form.drinkerType || '',
      litterType: form.litterType || '',
      address: form.address || '',
      builtAt: form.builtAt || '',
      lastSanitizedAt: form.lastSanitizedAt || '',
      notes: form.notes || '',
      birdId: form.birdId || '',
      breedId: form.breedId || '',
    },
  );
  const save = async () => {
    setSaveAttempted(true);
    // 🆕 اگه خطای اعتبارسنجی هست، نشون بده
    if (Object.keys(vErrors).length > 0) return;   // inline errors shown
    // 🔒 جلوگیری قاطع از نام تکراری سالن
    if (!form.id) {
      const _trimmed = form.name.trim();
      const _dup = halls.find((x) => x.name.trim() === _trimmed);
      if (_dup) {
        setDupError(`سالنی با نام «${_dup.name}» تکراریه`);
        return;
      }
    }


    // 🆕 چک تناقض: سالن در تعمیر/ضدعفونی نباید گله فعال داشته باشد
    if (form.id && (form.status === 'maintenance' || form.status === 'sanitizing')) {
      const hasActive = flocks.some((f: Flock) => f.hallId === form.id && f.status === 'active');
      if (hasActive) {
        const stLabel = form.status === 'maintenance' ? 'تعمیر' : 'ضدعفونی';
        const ok = await showConfirmAsync('هشدار تناقض',
          `این سالن گله فعال دارد ولی وضعیت را روی «${stLabel}» می‌گذاری. ادامه؟`,
          { danger: true });
        if (!ok) return;
      }
    }

    const data = {
      name: form.name.trim(), code: form.code.trim(),
      length: num(form.length), width: num(form.width), height: num(form.height),
      capacity: form.capacity ? parseInt(toEn(form.capacity)) || null : null,
      targetTemp: num(form.targetTemp), targetHumidity: num(form.targetHumidity),
      ventilation: num(form.ventilation), light: num(form.light),
      ventilationSystem: form.ventilationSystem || '',
      feederType: form.feederType || '',
      drinkerType: form.drinkerType || '',
      litterType: form.litterType || '',
      address: form.address.trim(), builtAt: form.builtAt.trim(), lastSanitizedAt: form.lastSanitizedAt.trim(), sanitizeNotes: form.sanitizeNotes.trim(), status: (form.status || 'empty') as Hall['status'], responsibleId: (form.responsibleId || '').trim() || undefined, notes: form.notes.trim(),
      birdId: form.birdId || undefined,
      breedId: form.breedId || undefined,
    };
    if (form.id) updateHall(form.id, data); else addHall(data);
    draft.clear();
    setOpen(false);
  };

  const undoDelete = () => {
    const item = undoData;
    if (!item) return;
    try {
      const items = Array.isArray(item.item) ? item.item : [item.item];
      items.forEach(h => {
        const { id, createdAt, updatedAt, ...rest } = h;
        addHall(rest);
      });
      toastMsg.restored(items.length > 1 ? 'سالن‌ها' : 'سالن');
    } catch (err) {
      toastMsg.error('بازگردانی ناموفق');
    }
    setUndoData(null);
  };

  return (
    <PageContainer>
      <HelpBanner
        id="hal-halls-intro"
        icon="🏭"
        title="سالن‌ها"
        description="سالن‌های مرغداری را اینجا تعریف کنید. برای هر سالن ابعاد، ظرفیت، شرایط محیطی و تجهیزات ثبت کنید. برای انتخاب چندتایی، روی یک کارت نگه دارید."
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
          <button type="button"
            onClick={ms.selectedIds.size === list.length ? ms.clearSelection : ms.selectAll}
            style={{ padding: '4px 10px', background: 'var(--input-bg)', border: '1px solid var(--border)', borderRadius: 'var(--r-sm)', color: 'var(--muted)', fontFamily: 'inherit', fontSize: '10px', fontWeight: 600, cursor: 'pointer' }}>
            {ms.selectedIds.size === list.length ? 'لغو انتخاب همه' : 'انتخاب همه'}
          </button>
        </div>
      )}

      {undoData && (
        <UndoBar
          label="حذف شد"
          onUndo={undoDelete}
          onDismiss={() => setUndoData(null)}
        />
      )}
      {list.length === 0 ? (
        <Empty icon={<svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></svg>}
          title="هنوز سالنی نساخته‌اید" desc="اولین سالن خود را بسازید. ابعاد را وارد کنید تا مساحت و حجم خودکار محاسبه شود."
          action={<Btn variant="primary" onClick={openNew}>+ افزودن سالن</Btn>} />
      ) : (
        <>
          {list.map((h, i) => {
            const isOpen = !ms.selectionMode && expandedId === h.id;
            return (
              <HallCard
                key={h.id}
                data-focus-id={h.id}
                h={h}
                i={i}
                zones={zones}
                equipment={equipment}
                flocks={flocks}
                breedStd={breedStd}
                fmt={fmt}
                isOpen={isOpen}
                ms={ms}
                onToggle={() => setExpandedId(isOpen ? null : h.id)}
                onEdit={() => openEdit(h)}
                onDelete={deleteHall}
                onUndo={(item: Hall | Hall[]) => {
                  setUndoData({ item });
                  setTimeout(() => setUndoData((cur) => cur && !Array.isArray(cur.item) && !Array.isArray(item) && cur.item.id === item.id ? null : cur), 6000);
                }}
                birdNames={birdNames}
                breedNames={breedNames}
                workerNames={workerNames}
              />
            );
          })}
          
        </>
      )}

      {!open && <MultiSelectBar ms={ms} deleteLabel="حذف" />}

      {ms.selectionMode && !open && <div style={{ height: 90 }} />}

      <HallsFormModal
        open={open}
        setOpen={setOpen}
        form={form}
        setForm={setForm}
        err={err}
        onErrorClear={() => { setErr(''); setDupError(null); }}
        vErrors={{ ...(saveAttempted ? vErrors : {}), ...(dupError ? { name: dupError } : {}) }}
        birds={birds}
        breeds={breeds}
        stdCapacity={__suggestedCap}
        stdTemp={__stdTemp}
        stdHumidity={__stdHumidity}
        workers={workers}
        breedStd={breedStd}
        autoFields={autoFields}
        clearAuto={clearAuto}
        save={save}
      />
    </PageContainer>
  );
}