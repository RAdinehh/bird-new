/**
 * ZonesPage — بخش‌های سالن
 */
import { useState, useMemo, useEffect, useRef } from 'react';
import { useUrlFilter } from '../../shr/hooks/useUrlFilter';
import { useFab } from '../../shr/hooks/useFab';
import { useValidation } from '../../shr/validation/useValidation';
import { ZoneSchema } from '../../shr/validation/rules/hal';
import { useHal, type Zone, type Equipment, type Hall } from './store';
import { useBrd } from '../brd/store';
import { useFlk, type Flock } from '../flk/store';
import { useFormDraft } from '../../shr/hooks/useFormDraft';
import { Btn, Empty, PageContainer, Tag } from '../../shr/components/ui';
import ExpandableCard from '../../shr/components/ExpandableCard';
import { useMultiSelect } from '../../shr/multiSelect/useMultiSelect';
import MultiSelectBar from '../../shr/multiSelect/MultiSelectBar';
import { useFilterSort, FilterBar, getHalZonesConfig } from '../../shr/filter';
import HelpBanner from '../../shr/components/HelpBanner';
import { toFa, toEn } from '../../shr/utils/fa';
import { Row, RowGrid } from './helpers';
import ZoneFormModal from './components/ZoneFormModal';
import ZoneCard from './components/ZoneCard';
import EntityLink from '../../shr/components/EntityLink';
import UndoBar from '../../cor/ui/UndoBar';
import { toastMsg } from '../../cor/store/toast';
import { showConfirmAsync } from '../../cor/store/dialog';
import { logAction } from '../../cor/logger/auditLog';

export default function ZonesPage({ active = true }: { active?: boolean } = {}) {
  const { halls: _hallsRaw, zones: _zonesRaw, equipment, addZone, updateZone, deleteZone } = useHal();
  const { birds, breeds } = useBrd();
  const { flocks, update: updateFlock } = useFlk();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ id:'', hallId:'', name:'', capacity:'', notes:'' });
  const draft = useFormDraft('hal-zone', form, (v: typeof form) => setForm(v));
  const [err, setErr] = useState('');
  const [saveAttempted, setSaveAttempted] = useState(false);
  const [undoData, setUndoData] = useState<{ item: Zone | Zone[] } | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const halls = useMemo(() => {
    const seen = new Set<string>();
    return _hallsRaw.filter(h => {
      const k = (h.name || '').trim().toLowerCase();
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    });
  }, [_hallsRaw]);

  const zones = useMemo(() => {
    const seen = new Set<string>();
    return _zonesRaw.filter(z => {
      const k = (z.hallId || '') + '|' + (z.name || '').trim().toLowerCase();
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    });
  }, [_zonesRaw]);

  /** 🆕 وقتی بخشی حذف می‌شه، گله‌های یتیم رو آزاد کن */
  const prevZoneIdsRef = useRef<Set<string>>(new Set());
  useEffect(() => {
    const currentIds = new Set(zones.map((z: Zone) => z.id));
    const prevIds = prevZoneIdsRef.current;

    if (prevIds.size > 0) {
      const removedIds: string[] = [];
      prevIds.forEach(id => { if (!currentIds.has(id)) removedIds.push(id); });

      if (removedIds.length > 0) {
        removedIds.forEach(zoneId => {
          flocks.filter((f: Flock) => f.zoneId === zoneId).forEach((f: Flock) => {
            try { updateFlock(f.id, { zoneId: '' }); } catch {}
          });
        });
      }
    }

    prevZoneIdsRef.current = currentIds;
  }, [zones, flocks, updateFlock]);

  const ms = useMultiSelect({
    items: zones,
    getId: (z: Zone) => z.id,
    onDelete: async (ids: string[]) => {
      let totalFlocks = 0, totalEquip = 0;
      for (const id of ids) {
        totalFlocks += flocks.filter((f: Flock) => f.zoneId === id).length;
        totalEquip += equipment.filter((e: Equipment) => e.zoneId === id).length;
      }
      let delMsg = toFa(ids.length) + ' بخش حذف شوند؟';
      if (totalFlocks > 0 || totalEquip > 0) {
        delMsg += '\n\n';
        if (totalFlocks > 0) delMsg += '• ' + toFa(totalFlocks) + ' گله\n';
        if (totalEquip > 0) delMsg += '• ' + toFa(totalEquip) + ' تجهیز\n';
        delMsg += 'اتصال‌شون به این بخش‌ها قطع می‌شه.';
      }
      const ok = await showConfirmAsync('حذف گروهی', delMsg, { danger: true });
      if (!ok) return;
      const backups: Zone[] = [];
      for (const id of ids) {
        const it = zones.find(z => z.id === id);
        if (!it) continue;
        backups.push(it);
        try { deleteZone(id); } catch {}
      }
      if (backups.length > 0) {
        setUndoData({ item: backups });
        setTimeout(() => setUndoData((cur) => cur && Array.isArray(cur.item) && cur.item.length === backups.length ? null : cur), 8000);
      }
      toastMsg.deletedBulk(backups.length, 'بخش')
    },
    onArchive: async (ids) => {
      const ok = await showConfirmAsync('آرشیو گروهی', toFa(ids.length) + ' بخش آرشیو شوند؟', { danger: false });
      if (!ok) return;
      for (const id of ids) {
        try { updateZone(id, { archived: true }); } catch {}
      }
      toastMsg.archivedBulk(ids.length, 'بخش');
      logAction('update', 'hal', 'آرشیو گروهی بخش‌ها: ' + ids.length);
    },
  });

  useEffect(() => {
    if (ms.selectionMode) setExpandedId(null);
  }, [ms.selectionMode]);

  const undoDelete = () => {
    const item = undoData;
    if (!item) return;
    try {
      const arr = Array.isArray(item.item) ? item.item : [item.item];
      for (const it of arr) addZone(it);
      toastMsg.restoredBulk(arr.length, 'بخش')
    } catch {
      toastMsg.error('بازگردانی ناموفق')
    }
    setUndoData(null);
  };

  const openNew = () => { setForm({ id:'', hallId: halls[0]?.id || '', name:'', capacity:'', notes:'' }); setErr(''); setSaveAttempted(false); setOpen(true); };
  const openEdit = (z: Zone) => { setForm({ id: z.id, hallId: z.hallId,
     name: z.name, capacity: z.capacity ? toFa(z.capacity) : '', notes: z.notes }); setErr(''); setSaveAttempted(false); setOpen(true); };

  const int = (s: string) => s ? parseInt(toEn(s)) || 0 : 0;
  const { errors: vErrors } = useValidation(
    ZoneSchema,
    {
      hallId: form.hallId || '',
      name: form.name || '',
      capacity: int(form.capacity),
      notes: form.notes || '',
    },
  );

  useFab(active ? { label: 'افزودن بخش', onClick: openNew } : null);

  /** 🆕 محاسبه hint ظرفیت */
  const hallCapForForm = (() => {
    if (!form.hallId) return null;
    const h = halls.find((x: Hall) => x.id === form.hallId);
    return h?.capacity ?? null;
  })();

  const hallRemainingForForm = (() => {
    if (!form.hallId || hallCapForForm == null) return null;
    const othersSum = zones
      .filter((z: Zone) => z.hallId === form.hallId && z.id !== form.id)
      .reduce((s: number, z: Zone) => s + (z.capacity || 0), 0);
    return hallCapForForm - othersSum;
  })();

  const crossError = (() => {
    if (!form.hallId) return null;
    const cap = int(form.capacity);
    if (cap <= 0) return null;
    const hall = halls.find((h: Hall) => h.id === form.hallId);
    const hallCap = hall?.capacity;
    if (!hallCap) return null;
    // جمع بخش‌های دیگه همون سالن (بدون بخش فعلی در حالت ویرایش)
    const othersSum = zones
      .filter((z: Zone) => z.hallId === form.hallId && z.id !== form.id)
      .reduce((s: number, z: Zone) => s + (z.capacity || 0), 0);
    const totalAfter = othersSum + cap;
    if (totalAfter > hallCap) {
      return `جمع ظرفیت بخش‌ها (${toFa(totalAfter)}) از ظرفیت سالن (${toFa(hallCap)}) بیشتر می‌شود`;
    }
    return null;
  })();

  // فیلتر/مرتب (قبل از return شرطی)
  const config = useMemo(() => getHalZonesConfig({ halls }), [halls]);
  const { filtered: _listRaw, filters, setFilter, clearFilter, sort, setSort, toggleSort,
          resetAll, hasActiveFilters, total, count } = useFilterSort<Zone>({
    items: zones,
    filters: config.filterDefs,
    sorts: config.sortDefs,
    persistKey: config.persistKey,
    initialSort: config.initialSort,
  });

  const list = useMemo(() => _listRaw.filter((z: Zone) => !z.archived), [_listRaw]);

  // 🆕 URL filter برای سالن (?hall=xxx)
  const [urlHall, setUrlHall] = useUrlFilter('hall', '');
  useEffect(() => {
    if (urlHall) setFilter('hallId', urlHall);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [urlHall]);
  useEffect(() => {
    setUrlHall(typeof filters.hallId === 'string' ? filters.hallId : '');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.hallId]);

  // 🆕 گله‌های هر بخش
  const flocksByZone = useMemo(() => {
    const m = new Map<string, Flock[]>();
    for (const f of flocks) {
      if (!f.zoneId) continue;
      const arr = m.get(f.zoneId) || [];
      arr.push(f);
      m.set(f.zoneId, arr);
    }
    return m;
  }, [flocks]);

  if (halls.length === 0) {
    return (
      <PageContainer>
      {undoData && (
        <UndoBar
          label="حذف شد"
          onUndo={undoDelete}
          onDismiss={() => setUndoData(null)}
        />
      )}
        <Empty
          icon={<svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></svg>}
          title="اول یک سالن بسازید"
          desc="بخش، داخل سالن تعریف می‌شود. اول از تب «سالن‌ها» استفاده کنید."
        />
      </PageContainer>
    );
  }

  const handleDelete = async (z: Zone) => {
    const idToDel = z.id;
    const flockCount = flocks.filter((f: Flock) => f.zoneId === idToDel).length;
    const equipCount = equipment.filter((e: Equipment) => e.zoneId === idToDel).length;
    let delMsg = 'این منطقه حذف شود؟';
    if (flockCount > 0 || equipCount > 0) {
      delMsg += '\n\n';
      if (flockCount > 0) delMsg += '• ' + toFa(flockCount) + ' گله\n';
      if (equipCount > 0) delMsg += '• ' + toFa(equipCount) + ' تجهیز\n';
      delMsg += 'اتصال‌شون قطع می‌شه.';
    }
    const ok = await showConfirmAsync('تأیید حذف', delMsg, { danger: true });
    if (!ok) return;
    const item = zones.find((x: Zone) => x.id === idToDel);
    if (item) {
      setUndoData({ item });
      setTimeout(() => setUndoData((cur) => cur && !Array.isArray(cur.item) && cur.item.id === item.id ? null : cur), 6000);
    }
    deleteZone(idToDel);
    logAction('delete', 'hal', 'حذف از بخش‌ها');
    toastMsg.deleted('بخش');
  };

  const save = async () => {
    setSaveAttempted(true);

    // 🆕 چک vErrors
    if (Object.keys(vErrors).length > 0) {
      const errs = Object.values(vErrors).slice(0, 3).join(' • ');
      setErr(`لطفاً خطاها را برطرف کنید: ${errs}`);
      return;
    }

    // 🔒 جلوگیری قاطع از نام تکراری بخش
    if (!form.id) {
      const _trimmed = form.name.trim();
      const _dup = zones.find((x: Zone) => x.hallId === form.hallId && x.name.trim() === _trimmed);
      if (_dup) {
        setErr(`بخشی با نام «${_dup.name}» توی این سالن تکراریه`);
        return;
      }
    }

    if (crossError) { setErr(crossError); return; }

    if (!form.name.trim()) { setErr('نام بخش را وارد کنید'); return; }
    const data = { hallId: form.hallId, name: form.name.trim(), capacity: form.capacity ? parseInt(toEn(form.capacity)) || null : null,
       notes: form.notes.trim() };
    if (form.id) updateZone(form.id, data); else addZone(data);
    draft.clear();
    setOpen(false);
  };

  return (
    <PageContainer>
      <HelpBanner
        id="hal-zones-intro"
        icon="🗂"
        title="بخش‌های سالن"
        description="هر بخش داخل یک سالن تعریف می‌شود. برای انتخاب چندتایی، روی یک کارت نگه دارید."
        tone="info"
      />

      {undoData && (
        <UndoBar
          label="حذف شد"
          onUndo={undoDelete}
          onDismiss={() => setUndoData(null)}
        />
      )}

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

      {/* 🆕 هشدار مجموع بخش‌ها > سالن */}
      {(() => {
        // جمع ظرفیت بخش‌ها per سالن
        const sumByHall: Record<string, number> = {};
        for (const z of zones) {
          if (z.archived) continue;
          sumByHall[z.hallId] = (sumByHall[z.hallId] || 0) + (z.capacity || 0);
        }
        const offenders = Object.entries(sumByHall)
          .map(([hallId, sum]) => {
            const h = halls.find(x => x.id === hallId);
            if (!h || !h.capacity) return null;
            if (sum <= h.capacity) return null;
            return { hall: h, sum };
          })
          .filter(Boolean) as { hall: { name: string; capacity: number | null }; sum: number }[];

        if (offenders.length === 0) return null;

        return (
          <div style={{
            padding: 'var(--pad-normal)',
            background: 'var(--warn-soft)',
            border: '1px solid var(--warn)',
            borderRadius: 'var(--r-md)',
            fontSize: 'var(--fs-xs)',
            color: 'var(--warn)',
            fontWeight: 600,
            lineHeight: 1.7,
          }}>
            <div style={{ marginBottom: 4, fontWeight: 700 }}>⚠️ مجموع بخش‌ها بیشتر از ظرفیت سالن ئه</div>
            {offenders.map(o => (
              <div key={o.hall.name}>
                · سالن <b>{o.hall.name}</b>: ظرفیت {toFa(o.hall.capacity || 0)} — بخش‌ها {toFa(o.sum)}
              </div>
            ))}
            <div style={{ marginTop: 4, fontStyle: 'italic', opacity: 0.9 }}>
              ظرفیت سالن یا بخش‌ها رو اصلاح کن (اگه عمدی ئه، ادامه بده — فقط یادآوری ئه)
            </div>
          </div>
        );
      })()}

      {!ms.selectionMode && zones.length > 1 && (
        <div style={{ fontSize: '10px', color: 'var(--dim)', textAlign: 'center', paddingBottom: 2 }}>
          برای انتخاب چندتایی، روی یک کارت نگه دارید
        </div>
      )}

      {ms.selectionMode && zones.length > 1 && (
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 6 }}>
          <button type="button"
            onClick={ms.selectedIds.size === zones.length ? ms.clearSelection : ms.selectAll}
            style={{ padding: '4px 10px', background: 'var(--input-bg)', border: '1px solid var(--border)', borderRadius: 'var(--r-sm)', color: 'var(--muted)', fontFamily: 'inherit', fontSize: '10px', fontWeight: 600, cursor: 'pointer' }}>
            {ms.selectedIds.size === zones.length ? 'لغو انتخاب همه' : 'انتخاب همه'}
          </button>
        </div>
      )}

      {list.length === 0 ? (
        <Empty
          icon={<svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 3v18M15 3v18"/></svg>}
          title="بخشی ثبت نشده"
          desc="بخش، داخل سالن ساخته می‌شود — برای تفکیک انواع پرنده یا نژاد."
          action={<Btn variant="primary" onClick={openNew}>+ افزودن بخش</Btn>}
        />
      ) : (
        <>
          {list.map((z, i) => {
            const hall = halls.find(h => h.id === z.hallId);
            const isOpen = !ms.selectionMode && expandedId === z.id;
            return (
              <ZoneCard
                key={z.id}
                zone={z}
                index={i}
                hall={hall}
                flocks={flocksByZone.get(z.id) || []}
                isOpen={isOpen}
                onToggle={() => setExpandedId(isOpen ? null : z.id)}
                ms={ms}
                onEdit={() => openEdit(z)}
                onDelete={() => handleDelete(z)}
              />
            );
          })}
          
        </>
      )}

      <MultiSelectBar ms={ms} deleteLabel="حذف" />

      {ms.selectionMode && <div style={{ height: 90 }} />}

      <ZoneFormModal
        open={open}
        onClose={() => setOpen(false)}
        form={form}
        setForm={setForm}
        err={err}
        onErrorClear={() => setErr('')}
        vErrors={saveAttempted ? vErrors : {}}
        crossError={crossError}
        hallCap={hallCapForForm}
        hallRemaining={hallRemainingForForm}
        halls={halls}
        birds={birds}
        breeds={breeds}
        save={save}
      />
    </PageContainer>
  );
}