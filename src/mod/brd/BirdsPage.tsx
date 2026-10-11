import { useState, useMemo, useEffect } from 'react';
import { useFab } from '../../shr/hooks/useFab';
import { useFocusParam } from '../../shr/hooks/useFocusParam';
import { useFormDraft } from '../../shr/hooks/useFormDraft';
import { useBrd, type Bird } from './store';
import { findBirdPreset } from './presets';
import { getKindInfo, getPurposeInfo, getCategoryInfo } from './_display';
import { DEFAULT_STANDARDS } from '../set/standards/data';
import { getStandardFor } from '../set/standards/resolve';
import { useSet } from '../set/store';
import SourceBadge, { type SourceType } from '../../shr/components/SourceBadge';
import { detectCycleDaysSource, detectFcrSource, getOverrideInfo } from './_source';
import OverrideHint from '../../shr/components/OverrideHint';
import BirdForm, { EMPTY_BIRD_FORM, type BirdFormData } from './BirdForm';
import EntityLink from '../../shr/components/EntityLink';
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
import UndoBar from '../../cor/ui/UndoBar';
import { showToast, toastMsg } from '../../cor/store/toast';
import { showConfirmAsync } from '../../cor/store/dialog';
import { logAction } from '../../cor/logger/auditLog';


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

    if (!form.name.trim()) { setError('نام پرنده اجباری است'); return; }
    const payload = {
      name: form.name.trim(),
      cycleDays: form.cycleDays ? parseInt(toEn(form.cycleDays)) || null : null,
      fcrStandard: form.fcrStandard ? parseFloat(toEn(form.fcrStandard).replace('٫', '.')) || null : null,
      standardKey: form.standardKey,
      birdKind: form.birdKind,
      purpose: form.purpose,
    } as any;
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
            const kind = getKindInfo((b as any).birdKind);
            const purpose = getPurposeInfo((b as any).purpose);
            const stdKey = (b as any).standardKey;
            // fallback: اگه standardKey نداشت یا پیدا نشد، از اسم پرنده resolve کن
            const stdData = (stdKey && (DEFAULT_STANDARDS as any)[stdKey])
              || getStandardFor(b.name, { customStandards: customStandards || {} })
              || null;
            const category = stdData?.category ? getCategoryInfo(stdData.category) : null;
            return (
              <ExpandableCard
                key={b.id} id={b.id} ms={ms}
                accent="accent"
                index={toFa(i + 1)}
                iconEmoji={kind.emoji}
                title={b.name}
                subtitle=""
                isOpen={isOpen}
                onToggle={() => setExpandedId(isOpen ? null : b.id)}
                badge={<Tag tone="blue">{toFa(birdBreeds.length)} نژاد</Tag>}
                stats={
                  <>
                    {purpose && <span style={{
                      padding: 'var(--pad-chip)', borderRadius: 'var(--r-md)',
                      background: 'var(--accent-soft)', color: 'var(--accent)',
                      fontSize: 'var(--fs-2xs)', fontWeight: 700,
                    }}>{purpose.emoji} {purpose.label}</span>}
                    {category && <span style={{
                      padding: 'var(--pad-chip)', borderRadius: 'var(--r-md)',
                      background: 'var(--accent-soft)', color: 'var(--accent)',
                      fontSize: 'var(--fs-2xs)', fontWeight: 700,
                    }}>{category.emoji} {category.label}</span>}
                    {b.cycleDays ? <span>چرخه: <b style={{ color: 'var(--text)' }}>{toFa(b.cycleDays)} روز</b></span> : null}
                    {b.fcrStandard ? <span>FCR: <b style={{ color: 'var(--text)' }}>{toFa(b.fcrStandard)}</b></span> : null}
                  </>
                }
              >
                <div style={{ fontSize: 'var(--fs-base)', color: 'var(--text)', fontWeight: 700, letterSpacing: '.3px' }}><span style={{ fontSize: '1.05em', lineHeight: 1, display: 'inline-block', marginLeft: 4 }}>📊</span> مشخصات کامل</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <StatRow label="چرخه زندگی" value={b.cycleDays ? `${toFa(b.cycleDays)} روز` : '—'} />
                  <StatRow label="FCR استاندارد" value={b.fcrStandard ? toFa(b.fcrStandard) : '—'} />
                </div>

                {birdBreeds.length > 0 && (
                  <>
                    <div style={{ fontSize: 'var(--fs-base)', color: 'var(--text)', fontWeight: 700, letterSpacing: '.3px' }}><span style={{ fontSize: '1.05em', lineHeight: 1, display: 'inline-block', marginLeft: 4 }}>🧬</span> نژادهای این پرنده</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                      {birdBreeds.map(bd => (
                        <EntityLink
                          key={bd.id}
                          type="breed"
                          id={bd.id}
                          label={`${bd.name}${bd.fcr ? ` · FCR ${toFa(bd.fcr)}` : ''}`}
                          badge
                          badgeBg="var(--purple-soft)"
                          badgeColor="var(--purple)"
                        />
                      ))}
                    </div>
                  </>
                )}

                {/* 📖 کادر استاندارد متصل */}
                {stdData ? (
                  <div style={{
                    padding: 'var(--pad-box)',
                    background: 'var(--accent-soft)',
                    border: '1px solid var(--accent-border)',
                    borderRadius: 'var(--r-sm)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                  }}>
                    <span style={{ fontSize: 'var(--fs-md)', flexShrink: 0 }}>📖</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{
                        fontSize: 'var(--fs-sm)', fontWeight: 800, color: 'var(--accent)',
                        display: 'flex', alignItems: 'center', gap: 5, flexWrap: 'wrap',
                      }}>
                        {stdData.nameFa || stdData.nameEn || stdKey}
                        <span style={{
                          fontSize: 'var(--fs-2xs)', fontWeight: 600,
                          color: 'var(--muted)',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          maxWidth: 160,
                        }}>
                          {stdData.source && `📚 ${stdData.source}`}
                          {stdData.source && stdData.publishYear && ' · '}
                          {stdData.publishYear && toFa(stdData.publishYear)}
                        </span>
                      </div>
                    </div>
                    <div style={{
                      fontSize: 'var(--fs-2xs)', fontWeight: 800,
                      padding: 'var(--pad-chip-xs)', borderRadius: 'var(--r-sm)',
                      background: 'var(--accent)', color: 'var(--card-solid)',
                      flexShrink: 0,
                    }}>متصل</div>
                  </div>
                ) : (
                  <div style={{
                    padding: 'var(--pad-box)',
                    background: 'var(--warn-soft)',
                    border: '1px solid var(--warn)',
                    borderRadius: 'var(--r-sm)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                  }}>
                    <span style={{ fontSize: 'var(--fs-md)', flexShrink: 0 }}>💡</span>
                    <span style={{ flex: 1, minWidth: 0, fontSize: 'var(--fs-sm)', fontWeight: 800, color: 'var(--warn)' }}>
                      استاندارد متصل نیست
                    </span>
                  </div>
                )}

                <div style={{ display: 'flex', gap: 6, paddingTop: 4 }}>
                  <Btn size="sm" onClick={() => openEdit(b)} style={{ flex: 1 }} aria-label={`ویرایش پرنده ${b.name}`}>ویرایش</Btn>
                  <Btn size="sm" onClick={async () => {
                    const idToDel = b.id; const ok = await showConfirmAsync('تأیید حذف', 'این پرنده حذف شود؟', { danger: true }); if (!ok) return; const item = birds.find((x: any) => x.id === idToDel); if (item) { setUndoData({ item }); setTimeout(() => setUndoData((cur: any) => cur && cur.item.id === item.id ? null : cur), 6000); } deleteBird(idToDel);
                    logAction('delete', 'brd', 'حذف از پرنده و نژاد');  toastMsg.deleted('پرنده')
                    }} style={{ flex: 1 }} aria-label={`حذف پرنده ${b.name}`}>حذف</Btn>
                </div>
              </ExpandableCard>
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

/** ردیف استاندارد نمایش label/value */
function StatRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={{
      display: 'flex', justifyContent: 'space-between',
      fontSize: 'var(--fs-sm)', padding: 'var(--pad-tight)',
      background: 'var(--input-bg)', borderRadius: 'var(--r-sm)',
    }}>
      <span style={{ color: 'var(--muted)' }}>{label}:</span>
      <span style={{ fontWeight: 600 }}>{value}</span>
    </div>
  );
}
