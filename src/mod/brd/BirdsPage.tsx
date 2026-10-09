import { useState, useMemo, useEffect } from 'react';
import { useFab } from '../../shr/hooks/useFab';
import { useBrd, type Bird } from './store';
import { findBirdPreset } from './presets';
import SourceBadge, { type SourceType } from '../../shr/components/SourceBadge';
import { detectCycleDaysSource, detectFcrSource } from './_source';
import BirdNameField, { type BirdPresetPick } from './BirdNameField';
import {
  Btn, BtnRow, Empty, Field,
  Grid2, Input, Modal, NumField,
  PageContainer, Tag
} from '../../shr/components/ui';import ExpandableCard from '../../shr/components/ExpandableCard';
import { useMultiSelect } from '../../shr/multiSelect/useMultiSelect';
import MultiSelectBar from '../../shr/multiSelect/MultiSelectBar';
import { useFilterSort, FilterBar, getBrdBirdsConfig } from '../../shr/filter';
import HelpBanner from '../../shr/components/HelpBanner';
import { toFa, toEn } from '../../shr/utils/fa';
import { showAlert } from '../../cor/store/dialog';
import UndoBar from '../../cor/ui/UndoBar';
import { showToast, toastMsg } from '../../cor/store/toast';
import { showConfirmAsync } from '../../cor/store/dialog';
import { logAction } from '../../cor/logger/auditLog';

interface F { id?: string; name: string; cycleDays: string; fcrStandard: string; standardKey?: string; }
const empty: F = { name: '', cycleDays: '', fcrStandard: '', standardKey: '' };

export default function BirdsPage({ active = true }: { active?: boolean } = {}) {
  const { birds: _birdsRaw, breeds, addBird, updateBird, deleteBird, dedupeBirds } = useBrd();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<F>(empty);
  const [error, setError] = useState('');
  const [undoData, setUndoData] = useState<{ item: any } | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

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
        try { deleteBird(id); } catch {}
      }
      if (backups.length > 0) {
        setUndoData({ item: backups });
        setTimeout(() => setUndoData((cur: any) => cur && Array.isArray(cur.item) && cur.item.length === backups.length ? null : cur), 8000);
      }
      toastMsg.deletedBulk(backups.length, 'پرنده')
    },
  });

  useEffect(() => {
    if (ms.selectionMode) setExpandedId(null);
  }, [ms.selectionMode]);


  const openNew = () => { setForm(empty); setError(''); setOpen(true);  };
  const openEdit = (b: Bird) => {
    setForm({ id: b.id, name: b.name, cycleDays: b.cycleDays ? toFa(b.cycleDays) : '', fcrStandard: b.fcrStandard ? toFa(b.fcrStandard) : '', standardKey: (b as any).standardKey || '' });
    
    setError(''); setOpen(true);
  };
  useFab(active ? { label: 'افزودن پرنده', onClick: openNew } : null);
  const save = async () => {

    // 🔒 جلوگیری قاطع از نام تکراری پرنده
    if (!form.id) {
      const _trimmed = form.name.trim();
      const _dup = birds.find((x: any) => x.name.trim() === _trimmed);
      if (_dup) {
        showAlert(
          `پرندهای با نام «${_dup.name}» قبلاً ثبت شده. لطفاً نام دیگری انتخاب کنید یا همان را ویرایش کنید.`,
          '❌ نام تکراری'
        );
        return;
      }
    }

    if (!form.name.trim()) { setError('نام پرنده اجباری است'); return; }
    const payload = {
      name: form.name.trim(),
      cycleDays: form.cycleDays ? parseInt(toEn(form.cycleDays)) || null : null,
      fcrStandard: form.fcrStandard ? parseFloat(toEn(form.fcrStandard).replace('٫', '.')) || null : null
    };
    if (form.id) updateBird(form.id, payload); else addBird(payload);
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
            const birdBreeds = breeds.filter(x => x.birdId === b.id);
            const isOpen = !ms.selectionMode && expandedId === b.id;
            return (
              <ExpandableCard
                key={b.id} id={b.id} ms={ms}
                accent="accent"
                index={toFa(i + 1)}
                iconEmoji="🐔"
                title={b.name}
                subtitle=""
                isOpen={isOpen}
                onToggle={() => setExpandedId(isOpen ? null : b.id)}
                badge={<Tag tone="blue">{toFa(birdBreeds.length)} نژاد</Tag>}
                stats={
                  <>
                    {b.cycleDays ? <span>چرخه: <b style={{ color: 'var(--text)' }}>{toFa(b.cycleDays)} روز</b></span> : null}
                    {b.fcrStandard ? <span>FCR: <b style={{ color: 'var(--text)' }}>{toFa(b.fcrStandard)}</b></span> : null}
                  </>
                }
              >
                <div style={{ fontSize: 'var(--fs-base)', color: 'var(--text)', fontWeight: 700, letterSpacing: '.3px' }}><span style={{ fontSize: '1.05em', lineHeight: 1, display: 'inline-block', marginLeft: 4 }}>📊</span> مشخصات کامل</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between',
                     fontSize: 'var(--fs-sm)', padding: 'var(--pad-tight)', background: 'var(--input-bg)',
                     borderRadius: 'var(--r-sm)' }}>
                    <span style={{ color: 'var(--muted)' }}>نام انگلیسی:</span>
                    <span style={{ fontWeight: 600 }}>—</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between',
                     fontSize: 'var(--fs-sm)', padding: 'var(--pad-tight)', background: 'var(--input-bg)',
                     borderRadius: 'var(--r-sm)' }}>
                    <span style={{ color: 'var(--muted)' }}>چرخه زندگی:</span>
                    <span style={{ fontWeight: 600 }}>{b.cycleDays ? `${toFa(b.cycleDays)} روز` : '—'}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between',
                     fontSize: 'var(--fs-sm)', padding: 'var(--pad-tight)', background: 'var(--input-bg)',
                     borderRadius: 'var(--r-sm)' }}>
                    <span style={{ color: 'var(--muted)' }}>FCR استاندارد:</span>
                    <span style={{ fontWeight: 600 }}>{b.fcrStandard ? toFa(b.fcrStandard) : '—'}</span>
                  </div>
                </div>

                {birdBreeds.length > 0 && (
                  <>
                    <div style={{ fontSize: 'var(--fs-base)', color: 'var(--text)', fontWeight: 700, letterSpacing: '.3px' }}><span style={{ fontSize: '1.05em', lineHeight: 1, display: 'inline-block', marginLeft: 4 }}>🧬</span> نژادهای این پرنده</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                      {birdBreeds.map(bd => (
                        <span key={bd.id} style={{ padding: '4px 10px',
                           background: 'var(--purple-soft)', color: 'var(--purple)',
                           borderRadius: 6, fontSize: 'var(--fs-xs)', fontWeight: 600 }}>
                          {bd.name}{bd.fcr ? ` · FCR ${toFa(bd.fcr)}` : ''}
                        </span>
                      ))}
                    </div>
                  </>
                )}

                <div style={{ display: 'flex', gap: 6, paddingTop: 4 }}>
                  <Btn size="sm" onClick={() => openEdit(b)} style={{ flex: 1 }}>ویرایش</Btn>
                  <Btn size="sm" onClick={async () => {
                    const idToDel = b.id; const ok = await showConfirmAsync('تأیید حذف', 'این پرنده حذف شود؟', { danger: true }); if (!ok) return; const item = birds.find((x: any) => x.id === idToDel); if (item) { setUndoData({ item }); setTimeout(() => setUndoData((cur: any) => cur && cur.item.id === item.id ? null : cur), 6000); } deleteBird(idToDel);
                    logAction('delete', 'brd', 'حذف از پرنده و نژاد');  toastMsg.deleted('پرنده')
                    }} style={{ flex: 1 }}>حذف</Btn>
                </div>
              </ExpandableCard>
            );
          })}
          
        </>
      )}

      <MultiSelectBar ms={ms} deleteLabel="حذف" />

      {ms.selectionMode && <div style={{ height: 90 }} />}

      <Modal open={open} onClose={() => setOpen(false)} title={form.id ? 'ویرایش پرنده' : 'افزودن پرنده'} contentGap={14}
        footer={<BtnRow><Btn variant="primary" onClick={save}>ذخیره</Btn><Btn onClick={() => setOpen(false)}>لغو</Btn></BtnRow>}>
        <Field label="نام پرنده" required hint="از لیست انتخاب کن یا پرنده دلخواه بنویس">
          <BirdNameField
            value={form.name}
            onChange={v => setForm(f => ({ ...f, name: v }))}
            onPick={(pick: BirdPresetPick) => {
              setForm(f => ({
                ...f,
                name: pick.name,
                cycleDays: pick.cycleDays ? toFa(pick.cycleDays) : f.cycleDays,
                fcrStandard: pick.fcrStandard ? toFa(pick.fcrStandard) : f.fcrStandard,
                standardKey: pick.standardKey || f.standardKey,
              }));
            }}
            error={error || undefined}
            excludeNames={birds.filter(b => b.id !== form.id).map(b => b.name)}
          />
        </Field>

        <Grid2>
          <Field
            label={
              <span style={{ display: 'inline-flex', alignItems: 'center' }}>
                چرخه زندگی (روز)
                {(() => {
                  const cd = form.cycleDays ? parseInt(toEn(form.cycleDays)) || null : null;
                  const src = detectCycleDaysSource(cd, form.standardKey, form.name);
                  return <SourceBadge source={src.source} label={src.label} />;
                })()}
              </span>
            }
            hint="از شروع تا پایان دوره"
          >
            <NumField
              placeholder="۰"
              value={form.cycleDays}
              onChange={e => setForm({ ...form, cycleDays: e.target.value })}
              min={1} max={2000} unit="روز" autoClamp />
          </Field>
          <Field
            label={
              <span style={{ display: 'inline-flex', alignItems: 'center' }}>
                FCR استاندارد
                {(() => {
                  const fcr = form.fcrStandard ? parseFloat(toEn(form.fcrStandard).replace('٫', '.')) || null : null;
                  const src = detectFcrSource(fcr, form.standardKey, form.name);
                  return <SourceBadge source={src.source} label={src.label} />;
                })()}
              </span>
            }
            hint="ضریب تبدیل غذایی مرجع"
          >
            <NumField
              placeholder="۲٫۰"
              value={form.fcrStandard}
              onChange={e => setForm({ ...form, fcrStandard: e.target.value })}
              min={0.5} max={5} unit="FCR" autoClamp />
          </Field>
        </Grid2>

        <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--muted)', lineHeight: 1.7,
           padding: 'var(--pad-normal)', background: 'var(--input-bg)', borderRadius: 'var(--r-sm)',
           marginBottom: 8 }}>
          💡 <b>چرخه زندگی</b> = چند روز طول می‌کشد تا دوره این پرنده کامل شود (گوشتی ۴۲، تخم‌گذار ۵۰۰). <b>FCR</b> = چند کیلو دان برای ۱ کیلو وزن (۱.۶ عالی، ۱.۸ متوسط، ۲.۰+ ضعیف).
        </div>
      </Modal>
    </PageContainer>
  );
}
