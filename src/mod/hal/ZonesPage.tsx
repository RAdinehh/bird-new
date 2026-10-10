/**
 * ZonesPage — بخش‌های سالن
 */
import { useState, useMemo, useEffect } from 'react';
import { useFab } from '../../shr/hooks/useFab';
import { useValidation } from '../../shr/validation/useValidation';
import { ZoneSchema } from '../../shr/validation/rules/hal';
import { useHal, type Zone } from './store';
import { useBrd } from '../brd/store';
import { useFormDraft } from '../../shr/hooks/useFormDraft';
import { Btn, BtnRow, Empty, Field, Grid2, Input, Modal, NumField, PageContainer, Select, Tag, ErrorBox , Textarea } from '../../shr/components/ui';
import ExpandableCard from '../../shr/components/ExpandableCard';
import { useMultiSelect } from '../../shr/multiSelect/useMultiSelect';
import MultiSelectBar from '../../shr/multiSelect/MultiSelectBar';
import { useFilterSort, FilterBar, getHalZonesConfig } from '../../shr/filter';
import HelpBanner from '../../shr/components/HelpBanner';
import { toFa, toEn } from '../../shr/utils/fa';
import SmartSelect from '../../shr/components/SmartSelect';
import EntityLink from '../../shr/components/EntityLink';
import { showAlert } from '../../cor/store/dialog';
import { chip } from './helpers';
import UndoBar from '../../cor/ui/UndoBar';
import { showToast, toastMsg } from '../../cor/store/toast';
import { showConfirmAsync } from '../../cor/store/dialog';
import { logAction } from '../../cor/logger/auditLog';

export default function ZonesPage({ active = true }: { active?: boolean } = {}) {
  const { halls: _hallsRaw, zones: _zonesRaw, addZone, updateZone, deleteZone } = useHal();
  const { birds, breeds } = useBrd();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ id:'', hallId:'', name:'', capacity:'', notes:'' });
  const draft = useFormDraft('hal-zone', form, (v: any) => setForm(v));
  const [err, setErr] = useState('');
  const [undoData, setUndoData] = useState<{ item: any | any[] } | null>(null);
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

  // ─── Multi-Select ───
  const ms = useMultiSelect({
    items: zones,
    getId: (z: any) => z.id,
    onDelete: async (ids: string[]) => {
      const ok = await showConfirmAsync('حذف گروهی', toFa(ids.length) + ' بخش حذف شوند؟', { danger: true });
      if (!ok) return;
      const backups: any[] = [];
      for (const id of ids) {
        const it = zones.find(z => z.id === id);
        if (!it) continue;
        backups.push(it);
        try { deleteZone(id); } catch {}
      }
      if (backups.length > 0) {
        setUndoData({ item: backups });
        setTimeout(() => setUndoData((cur: any) => cur && Array.isArray(cur.item) && cur.item.length === backups.length ? null : cur), 8000);
      }
      toastMsg.deletedBulk(backups.length, 'بخش')
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

  const openNew = () => { setForm({ id:'', hallId: halls[0].id, name:'', capacity:'', notes:'' }); setErr(''); setOpen(true); };
  const openEdit = (z: Zone) => { setForm({ id: z.id, hallId: z.hallId,
     name: z.name, capacity: z.capacity ? toFa(z.capacity) : '', notes: z.notes }); setErr(''); setOpen(true); };

  // ═══ اعتبارسنجی زنده ═══
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

  // ═══ Cross-field Validation ═══
  const crossWarn = (() => {
    if (!form.hallId) return null;
    const cap = int(form.capacity);
    if (cap <= 0) return null;
    const hall = halls.find((h: any) => h.id === form.hallId);
    const hallCap = (hall as any)?.capacity;
    if (!hallCap) return null;
    // جمع بخش‌های دیگه همون سالن (بدون بخش فعلی در حالت ویرایش)
    const othersSum = zones
      .filter((z: any) => z.hallId === form.hallId && z.id !== form.id)
      .reduce((s: number, z: any) => s + (z.capacity || 0), 0);
    const totalAfter = othersSum + cap;
    if (totalAfter > hallCap) {
      return `جمع ظرفیت بخش‌ها (${toFa(totalAfter)}) از ظرفیت سالن (${toFa(hallCap)}) بیشتر می‌شود`;
    }
    return null;
  })();

  // فیلتر/مرتب (قبل از return شرطی)
  const config = useMemo(() => getHalZonesConfig({ halls }), [halls]);
  const { filtered: list, filters, setFilter, clearFilter, sort, setSort, toggleSort,
          resetAll, hasActiveFilters, total, count } = useFilterSort<Zone>({
    items: zones,
    filters: config.filterDefs,
    sorts: config.sortDefs,
    persistKey: config.persistKey,
    initialSort: config.initialSort,
  });

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

  const save = async () => {

    // 🔒 جلوگیری قاطع از نام تکراری بخش
    if (!form.id) {
      const _trimmed = form.name.trim();
      const _dup = zones.find((x: any) => x.hallId === form.hallId && x.name.trim() === _trimmed);
      if (_dup) {
        showAlert(
          `بخشای با نام «${_dup.name}» قبلاً ثبت شده. لطفاً نام دیگری انتخاب کنید یا همان را ویرایش کنید.`,
          '❌ نام تکراری'
        );
        return;
      }
    }

    if (!form.name.trim()) { setErr('نام بخش اجباری است'); return; }
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
              <ExpandableCard
                key={z.id}
                id={z.id}
                ms={ms}
                accent="purple"
                index={toFa(i + 1)}
                iconEmoji="🗂"
                title={z.name}
                subtitle=""
                isOpen={isOpen}
                onToggle={() => setExpandedId(isOpen ? null : z.id)}
                badge={z.capacity ? <Tag tone="purple">{toFa(z.capacity)} پرنده</Tag> : undefined}
                stats={<>
                  <span>🏠 سالن: {hall ? <b><EntityLink type="hall" id={hall.id} label={hall.name} /></b> : <b style={{ color: 'var(--text)' }}>—</b>}</span>
                  {z.capacity && <span>ظرفیت: <b style={{ color: 'var(--text)' }}>{toFa(z.capacity)}</b></span>}
                </>}
              >
                <div style={{ fontSize: 'var(--fs-base)', color: 'var(--text)', fontWeight: 700, letterSpacing: '.3px' }}>🗂 مشخصات بخش</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between',
                     fontSize: 'var(--fs-sm)', padding: 'var(--pad-tight)', background: 'var(--input-bg)',
                     borderRadius: 'var(--r-sm)' }}>
                    <span style={{ color: 'var(--muted)' }}>نام بخش:</span>
                    <span style={{ fontWeight: 600 }}>{z.name}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between',
                     fontSize: 'var(--fs-sm)', padding: 'var(--pad-tight)', background: 'var(--input-bg)',
                     borderRadius: 'var(--r-sm)' }}>
                    <span style={{ color: 'var(--muted)' }}>سالن:</span>
                    <span style={{ fontWeight: 600 }}>{hall ? <EntityLink type="hall" id={hall.id} label={hall.name} /> : '—'}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between',
                     fontSize: 'var(--fs-sm)', padding: 'var(--pad-tight)', background: 'var(--input-bg)',
                     borderRadius: 'var(--r-sm)' }}>
                    <span style={{ color: 'var(--muted)' }}>ظرفیت:</span>
                    <span style={{ fontWeight: 600 }}>{z.capacity ? `${toFa(z.capacity)} پرنده` : '—'}</span>
                  </div>
                </div>
                {z.notes && (
                  <>
                    <div style={{ fontSize: 'var(--fs-base)', color: 'var(--text)', fontWeight: 700, letterSpacing: '.3px' }}><span style={{ fontSize: '1.05em', lineHeight: 1, display: 'inline-block', marginLeft: 4 }}>📝</span> یادداشت</div>
                    <div style={{ fontSize: 'var(--fs-sm)', lineHeight: 1.7,
                       padding: 'var(--pad-normal)', background: 'var(--input-bg)',
                       borderRadius: 'var(--r-sm)' }}>{z.notes}</div>
                  </>
                )}
                <div style={{ display: 'flex', gap: 6, paddingTop: 4 }}>
                  <Btn size="sm" onClick={() => openEdit(z)} style={{ flex: 1 }}>ویرایش</Btn>
                  <Btn size="sm" onClick={async () => {
                    const idToDel = z.id; const ok = await showConfirmAsync('تأیید حذف', 'این منطقه حذف شود؟', { danger: true }); if (!ok) return; const item = zones.find((x: any) => x.id === idToDel); if (item) { setUndoData({ item }); setTimeout(() => setUndoData((cur: any) => cur && cur.item.id === item.id ? null : cur), 6000); } deleteZone(idToDel);
                    logAction('delete', 'hal', 'حذف از سالن‌ها');  toastMsg.deleted('منطقه')
                    }} style={{ flex: 1 }}>حذف</Btn>
                </div>
              </ExpandableCard>
            );
          })}
          
        </>
      )}

      <MultiSelectBar ms={ms} deleteLabel="حذف" />

      {ms.selectionMode && <div style={{ height: 90 }} />}

      <Modal open={open} onClose={() => setOpen(false)} title={form.id ? 'ویرایش بخش' : 'افزودن بخش'}
        footer={<BtnRow><Btn variant="primary" onClick={save} disabled={Object.keys(vErrors).length > 0}>ذخیره</Btn><Btn onClick={() => setOpen(false)}>لغو</Btn></BtnRow>}>
        <Field label="سالن" required>
<SmartSelect
              value={form.hallId}
              onChange={v => setForm(f => ({ ...f, hallId: v }))}
              options={halls.map(c => ({
                value: c.id,
                label: c.name,
              }))}
              placeholder="— انتخاب کنید —"
              modalTitle="انتخاب سالن"
              autoThreshold={6}
            />
        </Field>
        {form.hallId && (() => {
          const hall = halls.find((h: any) => h.id === form.hallId);
          const hallBird = hall?.birdId ? birds.find((b: any) => b.id === hall.birdId) : null;
          const hallBreed = hall?.breedId ? breeds.find((b: any) => b.id === hall.breedId) : null;
          if (!hallBird && !hallBreed) return null;
          return (
            <div style={{
              fontSize: 'var(--fs-xs)',
              color: 'var(--muted)',
              padding: '6px 10px',
              background: 'var(--input-bg)',
              border: '1px dashed var(--border)',
              borderRadius: 'var(--r-sm)',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              lineHeight: 1.6,
              marginTop: -4,
            }}>
              <span style={{ fontSize: 12 }}>📋</span>
              <span>
                ارثی از سالن:
                {hallBird ? ` 🐔 ${hallBird.name}` : ''}
                {hallBreed ? ` · 🧬 ${hallBreed.name}` : ''}
              </span>
            </div>
          );
        })()}
        <Grid2>
          <Field label="نام بخش" required><Input placeholder="مثلاً — بخش A" value={form.name} onChange={e => setForm({...form, name: e.target.value})} /></Field>
          <Field label="ظرفیت">
            <NumField placeholder="۰" value={form.capacity} onChange={e => setForm({...form, capacity: e.target.value})} unit="پرنده" min={0} max={100000} autoClamp />
            {crossWarn && (
              <div style={{
                fontSize: 'var(--fs-xs)',
                color: 'var(--warn)',
                fontWeight: 700,
                paddingRight: 4,
                lineHeight: 1.5,
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                marginTop: 4,
              }}>
                ⚠️ {crossWarn}
              </div>
            )}
          </Field>
        </Grid2>
        <Field label="یادداشت">
            <Textarea placeholder="..." value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} />
          </Field>
        <ErrorBox>{err}</ErrorBox>
      </Modal>
    </PageContainer>
  );
}