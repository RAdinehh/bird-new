import { useState, useMemo, useEffect } from 'react';
import { useFab } from '../../shr/hooks/useFab';
import { useBrd, type Breed } from './store';
import SourceBadge from '../../shr/components/SourceBadge';
import { detectBreedFcrSource, getBreedFcrBaseline } from './_source';
import { useOverride } from '../../shr/hooks/useOverride';
import { useFormDraft } from '../../shr/hooks/useFormDraft';
import OverrideHint from '../../shr/components/OverrideHint';
import BreedNameField, { type BreedPick } from './BreedNameField';
import EntityLink from '../../shr/components/EntityLink';
import { DEFAULT_STANDARDS } from '../set/standards/data';
import { getPurposeInfo, getCategoryInfo } from './_display';
import { Btn, BtnRow, Empty, Field,
  Grid2, Input, Modal, NumField,
  PageContainer, Select, Tag, ErrorBox } from '../../shr/components/ui';import ExpandableCard from '../../shr/components/ExpandableCard';
import { useMultiSelect } from '../../shr/multiSelect/useMultiSelect';
import MultiSelectBar from '../../shr/multiSelect/MultiSelectBar';
import { useFilterSort, FilterBar, getBrdBreedsConfig } from '../../shr/filter';
import HelpBanner from '../../shr/components/HelpBanner';
import { toFa, toEn } from '../../shr/utils/fa';
import SmartSelect from '../../shr/components/SmartSelect';
import UndoBar from '../../cor/ui/UndoBar';
import { showToast, toastMsg } from '../../cor/store/toast';
import { showConfirmAsync } from '../../cor/store/dialog';
import { logAction } from '../../cor/logger/auditLog';


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
  const [form, setForm] = useState({ id:'', birdId:'', name:'', fcr:'', standardKey:'' });
  const [fcrFromStd, setFcrFromStd] = useState(false);
  const [err, setErr] = useState('');
  const [undoData, setUndoData] = useState<{ item: any } | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
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
        setTimeout(() => setUndoData((cur: any) => cur && Array.isArray(cur.item) && cur.item.length === backups.length ? null : cur), 8000);
      }
      toastMsg.deletedBulk(backups.length, 'مورد')
    },
  });

  useEffect(() => {
    if (ms.selectionMode) setExpandedId(null);
  }, [ms.selectionMode]);


  const openNew = () => {
    if (!draft.hasDraft) setForm({ id:'', birdId: birds[0].id, name:'', fcr:'', standardKey:'' });
    setFcrFromStd(false);
    setErr(''); setOpen(true);
  };
  useFab(active ? { label: 'افزودن نژاد', onClick: openNew } : null);

  // 🆕 Override برای FCR نژاد (قبل از return شرطی)
  const parentBird = birds.find(x => x.id === form.birdId);
  const fcrBaseline = getBreedFcrBaseline(form.standardKey, parentBird?.fcrStandard ?? null);
  const fcrCurrent = form.fcr ? parseFloat(toEn(form.fcr).replace('٫','.')) || null : null;
  const { hint: fcrHint } = useOverride({
    current: fcrCurrent,
    stdValue: fcrBaseline.value,
    onReset: () => setForm(f => ({ ...f, fcr: fcrBaseline.value != null ? toFa(fcrBaseline.value) : '' })),
    unit: 'FCR',
    decimals: 1,
  });

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
    setForm({ id: b.id, birdId: b.birdId, name: b.name, fcr: b.fcr ? toFa(b.fcr) : '', standardKey: (b as any).standardKey || '' });
    setFcrFromStd(!!(b as any).standardKey);
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
    const payload = {
      birdId: form.birdId,
      name: form.name.trim(),
      fcr: form.fcr ? parseFloat(toEn(form.fcr).replace('٫','.')) || null : null,
      standardKey: form.standardKey || undefined,
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
            const stdKey = (b as any).standardKey;
            const stdData = stdKey ? (DEFAULT_STANDARDS as any)[stdKey] : null;
            const category = stdData?.category ? getCategoryInfo(stdData.category) : null;
            const purpose = stdData?.primaryPurpose ? getPurposeInfo(stdData.primaryPurpose) : null;
            const hasStandard = !!stdData;
            return (
              <ExpandableCard
                key={b.id} id={b.id} ms={ms}
                accent="purple"
                index={toFa(i + 1)}
                iconEmoji="🧬"
                title={b.name}
                subtitle=""
                isOpen={isOpen}
                onToggle={() => setExpandedId(isOpen ? null : b.id)}
                badge={
                  <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                    {purpose && <Tag tone="green">{purpose.emoji} {purpose.label}</Tag>}
                    {category && <Tag tone="blue">{category.emoji} {category.label}</Tag>}
                  </div>
                }
                stats={<>
                  <span>🐔 پرنده: {bird ? <b><EntityLink type="bird" id={bird.id} label={bird.name} /></b> : <b style={{ color: 'var(--text)' }}>—</b>}</span>
                  {b.fcr && <span>📊 FCR: <b style={{ color: 'var(--text)' }}>{toFa(b.fcr)}</b></span>}
                </>}
              >
                <div style={{ fontSize: 'var(--fs-base)', color: 'var(--text)', fontWeight: 700, letterSpacing: '.3px' }}><span style={{ fontSize: '1.05em', lineHeight: 1, display: 'inline-block', marginLeft: 4 }}>🧬</span> مشخصات نژاد</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between',
                     fontSize: 'var(--fs-sm)', padding: 'var(--pad-tight)', background: 'var(--input-bg)',
                     borderRadius: 'var(--r-sm)' }}>
                    <span style={{ color: 'var(--muted)' }}>نام نژاد:</span>
                    <span style={{ fontWeight: 600 }}>{b.name}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between',
                     fontSize: 'var(--fs-sm)', padding: 'var(--pad-tight)', background: 'var(--input-bg)',
                     borderRadius: 'var(--r-sm)' }}>
                    <span style={{ color: 'var(--muted)' }}>پرنده:</span>
                    <span style={{ fontWeight: 600 }}>{bird ? <EntityLink type="bird" id={bird.id} label={bird.name} /> : '—'}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between',
                     fontSize: 'var(--fs-sm)', padding: 'var(--pad-tight)', background: 'var(--input-bg)',
                     borderRadius: 'var(--r-sm)' }}>
                    <span style={{ color: 'var(--muted)' }}>FCR:</span>
                    <span style={{ fontWeight: 600 }}>{b.fcr ? toFa(b.fcr) : '—'}</span>
                  </div>
                </div>
                {/* 📚 منبع استاندارد — یک خط کوچیک */}
                {stdData?.source && (
                  <div style={{
                    fontSize: 10,
                    color: 'var(--muted)',
                    fontWeight: 600,
                    paddingTop: 2,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                  }}>
                    📚 {stdData.source}
                    {stdData.publishYear && <span style={{ opacity: 0.6 }}>· {toFa(stdData.publishYear)}</span>}
                  </div>
                )}

                <div style={{ display: 'flex', gap: 6, paddingTop: 4 }}>
                  <Btn size="sm" onClick={() => openEdit(b)} style={{ flex: 1 }} aria-label={`ویرایش نژاد ${b.name}`}>ویرایش</Btn>
                  <Btn size="sm" onClick={async () => {
                    const idToDel = b.id; const ok = await showConfirmAsync('تأیید حذف', 'این نژاد حذف شود؟', { danger: true }); if (!ok) return; const item = breeds.find((x: any) => x.id === idToDel); if (item) { setUndoData({ item }); setTimeout(() => setUndoData((cur: any) => cur && cur.item.id === item.id ? null : cur), 6000); } deleteBreed(idToDel);
                    logAction('delete', 'brd', 'حذف از پرنده و نژاد');  toastMsg.deleted('نژاد')
                    }} style={{ flex: 1 }} aria-label={`حذف نژاد ${b.name}`}>حذف</Btn>
                </div>
              </ExpandableCard>
            );
          })}
          
        </>
      )}

      <MultiSelectBar ms={ms} deleteLabel="حذف" />

      {ms.selectionMode && <div style={{ height: 90 }} />}

      <Modal open={open} onClose={() => setOpen(false)} title={form.id ? 'ویرایش نژاد' : 'افزودن نژاد'}
        footer={<BtnRow><Btn variant="primary" onClick={save}>ذخیره</Btn><Btn onClick={() => setOpen(false)}>لغو</Btn></BtnRow>}>
        <Grid2>
        <Field label="پرنده" required>
          <SmartSelect
            value={form.birdId}
            onChange={v => {
              const parent = birds.find(x => x.id === v);
              // 🔄 Cascade: اگه FCR خالیه، از پرنده والد پر کن
              setForm(f => ({
                ...f,
                birdId: v,
                fcr: !f.fcr && parent?.fcrStandard ? toFa(parent.fcrStandard) : f.fcr,
              }));
            }}
            options={birds.map(c => ({
              value: c.id,
              label: c.name,
              subtitle: c.fcrStandard ? `FCR ${toFa(c.fcrStandard)}` : undefined,
            }))}
            placeholder="— انتخاب کنید —"
            modalTitle="انتخاب پرنده"
            autoThreshold={6}
          />
        </Field>
        <Field label="نام نژاد" required hint="انتخاب یا تایپ">
          <BreedNameField
            value={form.name}
            onChange={v => setForm(f => ({ ...f, name: v }))}
            onPick={(pick: BreedPick) => {
              setForm(f => ({
                ...f,
                name: pick.name,
                standardKey: pick.standardKey || f.standardKey,
                fcr: pick.fcr !== null ? toFa(pick.fcr) : f.fcr,
              }));
            }}
            excludeNames={breeds
              .filter(b => b.id !== form.id && b.birdId === form.birdId)
              .map(b => b.name)}
            parentBirdName={birds.find(x => x.id === form.birdId)?.name}
            parentPurpose={(birds.find(x => x.id === form.birdId) as any)?.birdType}
          />
        </Field>
        </Grid2>

        <Field
          label={
            <span style={{ display: 'inline-flex', alignItems: 'center' }}>
              FCR
              {(() => {
                const fcr = form.fcr ? parseFloat(toEn(form.fcr).replace('٫', '.')) || null : null;
                const parent = birds.find(x => x.id === form.birdId);
                const src = detectBreedFcrSource(fcr, form.standardKey, parent?.fcrStandard ?? null);
                const source = fcrHint.overridden ? 'manual' : src.source;
                return <SourceBadge source={source} label={src.label} />;
              })()}
            </span>
          }
          hint="کیلوگرم دان برای هر کیلوگرم رشد"
        >
          <NumField
            placeholder="۲٫۰"
            value={form.fcr}
            onChange={e => {
              setForm({ ...form, fcr: e.target.value });
              setFcrFromStd(false);
            }}
            min={0.5} max={5} unit="FCR" autoClamp
          />
          <OverrideHint {...fcrHint} />
        </Field>
        <ErrorBox>{err}</ErrorBox>
      </Modal>
    </PageContainer>
  );
}

function chip(active: boolean): React.CSSProperties {
  return {
    padding: '6px 11px', fontSize: 'var(--fs-sm)',
    background: active ? 'var(--accent-soft)' : 'var(--btn-bg)',
    border: `1px solid ${active ? 'var(--accent-border)' : 'var(--border)'}`,
    borderRadius: 'var(--r-sm)',
    color: active ? 'var(--accent)' : 'var(--muted)',
    fontWeight: active ? 600 : 500, cursor: 'pointer',
    fontFamily: 'inherit', whiteSpace: 'nowrap'
  };
}
