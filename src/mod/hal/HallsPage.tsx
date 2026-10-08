/**
 * HallsPage — سالن‌ها
 */
import { useState, useMemo, useEffect } from 'react';
import HallCard from './components/HallCard';
import HallsFormModal from './components/HallsFormModal';
import { useFab } from '../../shr/hooks/useFab';
import { useValidation } from '../../shr/validation/useValidation';
import { createHallSchema } from '../../shr/validation/rules/hal';
import { useHal, type Hall } from './store';
import { useBrd } from '../brd/store';
import { useBreedStandard } from '../../shr/hooks/useBreedStandard';
import { useFlk, getAgeDays } from '../flk/store';
import { Btn, BtnRow, Empty, Field, Grid2, Grid3, Input, Modal, NumField, PageContainer, Select, Tag, ErrorBox , Textarea } from '../../shr/components/ui';
import DatePicker from '../../shr/components/DatePicker';
import ExpandableCard from '../../shr/components/ExpandableCard';
import { useMultiSelect } from '../../shr/multiSelect/useMultiSelect';
import MultiSelectBar from '../../shr/multiSelect/MultiSelectBar';
import { useFilterSort, FilterBar, getHalHallsConfig } from '../../shr/filter';
import HelpBanner from '../../shr/components/HelpBanner';
import { isFanLike, isLampLike, LITTER_KG_PER_M2 } from './helpers';
import { HallEquipSection } from './HallEquipSection';
import { toFa, toEn } from '../../shr/utils/fa';
import { useTempUnit, toUserTemp, tempLabel } from '../../shr/utils/temp';
import { useFormat } from '../../shr/units';
import { showAlert } from '../../cor/store/dialog';
import { Row, RowWithStatus } from './helpers';
import UndoBar from '../../cor/ui/UndoBar';
import { showToast, toastMsg } from '../../cor/store/toast';
import { showConfirmAsync } from '../../cor/store/dialog';
import { logAction } from '../../cor/logger/auditLog';


interface F {
  id?: string;
  name: string; code: string;
  length: string; width: string; height: string;
  capacity: string; targetTemp: string; targetHumidity: string;
  ventilation: string; light: string;
  ventilationSystem: string; feederType: string; drinkerType: string; litterType: string;
  address: string; builtAt: string; lastSanitizedAt: string; notes: string; breedId: string;
}
const empty: F = {
  name:'', code:'', length:'', width:'', height:'',
  capacity:'', targetTemp:'', targetHumidity:'', ventilation:'', light:'',
  ventilationSystem:'', feederType:'', drinkerType:'', litterType:'',
 
  
  address:'', builtAt:'', lastSanitizedAt:'', notes:'', breedId:'',
};



/** محاسبه ظرفیت پیشنهادی بر اساس مساحت و نژاد */
function calcSuggestedCapacity(length: number | null, width: number | null, densityMax: number | null): number | null {
  if (!length || !width || !densityMax) return null;
  const area = length * width;
  return Math.floor(area * densityMax);
}

export default function HallsPage({ active = true }: { active?: boolean } = {}) {
  const { halls: _hallsRaw, zones, equipment, addHall, updateHall, deleteHall } = useHal();
  const breedStd = useBreedStandard();
  const { flocks } = useFlk();
  const { breeds, birds } = useBrd();
  const [open, setOpen] = useState(false);
  const [autoFields, setAutoFields] = useState<Set<string>>(new Set());
  const [form, setForm] = useState<F>(empty);
  const [err, setErr] = useState('');
  const [undoData, setUndoData] = useState<{ item: any } | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const tempUnit = useTempUnit();
  const __breedStd = form.breedId ? breedStd.byBreedId(form.breedId) : null;
  const __suggestedCap = calcSuggestedCapacity(
    parseFloat(toEn(form.length)) || null,
    parseFloat(toEn(form.width)) || null,
    __breedStd?.space?.densityMax ?? null,
  );
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
      zones,
      equipment,
      flocks: flocks.map(f => ({ id: f.id, hallId: (f as any).hallId, status: f.status })),
    }),
    [birds, zones, equipment, flocks]
  );
  const { filtered: list, filters, setFilter, clearFilter, sort, setSort, toggleSort,
          resetAll, hasActiveFilters, total, count } = useFilterSort<Hall>({
    items: halls,
    filters: config.filterDefs,
    sorts: config.sortDefs,
    persistKey: config.persistKey,
    initialSort: config.initialSort,
  });


  // ─── Multi-Select ───
  const ms = useMultiSelect({
    items: halls,
    getId: (h: any) => h.id,
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
          if (flocks.some((f: any) => f.hallId === id && f.status === 'active')) hasFlocks++;
        } catch { /* silent */ }
      }
      let msg = toFa(ids.length) + ' سالن حذف شوند؟';
      if (totalZones > 0 || totalEquip > 0) {
        msg += '\n\n';
        if (totalZones > 0) msg += '• ' + toFa(totalZones) + ' بخش\n';
        if (totalEquip > 0) msg += '• ' + toFa(totalEquip) + ' تجهیز\n';
        msg += 'هم حذف می‌شوند.';
      }
      if (hasFlocks > 0) {
        msg += '\n\n⚠️ ' + toFa(hasFlocks) + ' سالن گله فعال دارن.';
      }
      const ok = await showConfirmAsync('حذف گروهی', msg, { danger: true });
      if (!ok) return;
      const backups: any[] = [];
      for (const id of ids) {
        const item = halls.find(h => h.id === id);
        if (!item) continue;
        backups.push(item);
        try { deleteHall(id); } catch {}
      }
      if (backups.length > 0) {
        setUndoData({ item: backups });
        setTimeout(() => setUndoData((cur: any) => cur && Array.isArray(cur.item) && cur.item.length === backups.length ? null : cur), 8000);
      }
      toastMsg.deletedBulk(backups.length, 'سالن')
    },
  });

  useEffect(() => {
    if (ms.selectionMode) setExpandedId(null);
  }, [ms.selectionMode]);


  const setFromStd = (fields: Record<string, string>) => {
    setForm((f: any) => ({ ...f, ...fields }));
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
    setAutoFields(new Set()); setForm(empty); setErr(''); setOpen(true); };
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
      address: h.address, builtAt: h.builtAt, lastSanitizedAt: h.lastSanitizedAt, notes: h.notes,
      breedId: (h as any).breedId || ''
      });
    setErr(''); setOpen(true);
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
      birdId: '',
      breedId: form.breedId || '',
    },
  );
  const save = () => {
    // 🔒 جلوگیری قاطع از نام تکراری سالن
    if (!form.id) {
      const _trimmed = form.name.trim();
      const _dup = halls.find((x: any) => x.name.trim() === _trimmed);
      if (_dup) {
        showAlert(
          `سالنای با نام «${_dup.name}» قبلاً ثبت شده. لطفاً نام دیگری انتخاب کنید یا همان را ویرایش کنید.`,
          '❌ نام تکراری'
        );
        return;
      }
    }

    if (!form.name.trim()) { setErr('نام سالن اجباری است'); return; }
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
      address: form.address.trim(), builtAt: form.builtAt.trim(), lastSanitizedAt: form.lastSanitizedAt.trim(), notes: form.notes.trim(),
      breedId: form.breedId || undefined,
    };
    if (form.id) updateHall(form.id, data); else addHall(data);
    setOpen(false);
  };

  const undoDelete = () => {
    const item = undoData;
    if (!item) return;
    try {
      addHall(item.item);
      toastMsg.restored('سالن')
    } catch (err) {
      toastMsg.error('بازگردانی ناموفق')
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
                onUndo={(item: any) => {
                  setUndoData({ item });
                  setTimeout(() => setUndoData((cur: any) => cur && cur.item.id === item.id ? null : cur), 6000);
                }}
              />
            );
          })}
          
        </>
      )}

      <MultiSelectBar ms={ms} deleteLabel="حذف" />

      {ms.selectionMode && <div style={{ height: 90 }} />}

      <HallsFormModal
        open={open}
        setOpen={setOpen}
        form={form}
        setForm={setForm}
        err={err}
        vErrors={vErrors}
        breeds={breeds}
        breedStd={breedStd}
        autoFields={autoFields}
        clearAuto={clearAuto}
        save={save}
      />
    </PageContainer>
  );
}
