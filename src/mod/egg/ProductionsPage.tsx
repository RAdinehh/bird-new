/**
 * ProductionsPage — ثبت تخم‌گذاری
 */
import { useState, useMemo, useEffect } from 'react';
import ProductionFormModal from './components/ProductionFormModal';
import { useFab } from '../../shr/hooks/useFab';
import { useEgg, healthyCount, henDayRate, brokenRate, type EggProduction } from './store';
import { useFlk, getAgeDays } from '../flk/store';
import { useBrd } from '../brd/store';
import { Btn, BtnRow, Empty, Field, Grid2, Input, Modal, NumField, PageContainer, Select, Tag, ErrorBox , Textarea } from '../../shr/components/ui';
import HelpBanner from '../../shr/components/HelpBanner';
import { useMultiSelect } from '../../shr/multiSelect/useMultiSelect';
import MultiSelectBar from '../../shr/multiSelect/MultiSelectBar';
import { useFilterSort, FilterBar, getEggProductionsConfig } from '../../shr/filter';
import ExpandableCard from '../../shr/components/ExpandableCard';
import DatePicker from '../../shr/components/DatePicker';
import ProgressTracker from '../../shr/components/ProgressTracker';
import { toFa, toEn } from '../../shr/utils/fa';
import { showAlert } from '../../cor/store/dialog';
import UndoBar from '../../cor/ui/UndoBar';
import { showToast, toastMsg } from '../../cor/store/toast';
import { showConfirmAsync } from '../../cor/store/dialog';
import { Row, SectionTitle } from './helpers';
import { format as formatJ } from 'date-fns-jalali';
import { logAction } from '../../cor/logger/auditLog';
import { useValidation } from '../../shr/validation/useValidation';
import { createEggSchema } from '../../shr/validation/rules/egg';

interface F {
  id?: string;
  flockId: string;
  date: string;
  eatingCount: string;
  fertileCount: string;
  brokenCount: string;
  softCount: string;
  dirtyCount: string;
  avgWeight: string;
  notes: string;
}

const empty = (): F => ({
  flockId: '', date: '',
  eatingCount: '', fertileCount: '',
  brokenCount: '', softCount: '', dirtyCount: '',
  avgWeight: '', notes: '',
});

export default function ProductionsPage({ active = true }: { active?: boolean } = {}) {
  const { productions, addProduction, updateProduction, deleteProduction } = useEgg();
  const { flocks } = useFlk();
  const { birds } = useBrd();

  const activeFlocks = flocks.filter(f => f.status === 'active' && !f.paused && (f.type === 'layer' || f.type === 'breeder'));

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<F>(empty());
  const [err, setErr] = useState('');
  const [undoData, setUndoData] = useState<{ item: any | any[] } | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // فیلتر/مرتب
  const config = useMemo(
    () => getEggProductionsConfig({
      flocks: activeFlocks.map(f => ({ id: f.id, name: f.name })),
    }),
    [activeFlocks]
  );
  const { filtered: list, filters, setFilter, clearFilter, sort, setSort, toggleSort,
          resetAll, hasActiveFilters, total, count } = useFilterSort<EggProduction>({
    items: productions,
    filters: config.filterDefs,
    sorts: config.sortDefs,
    persistKey: config.persistKey,
    initialSort: config.initialSort,
  });

  // ─── Multi-Select ───
  const ms = useMultiSelect({
    items: list,
    getId: (p: any) => p.id,
    onDelete: async (ids: string[]) => {
      const ok = await showConfirmAsync('حذف گروهی', toFa(ids.length) + ' ثبت تخم‌گذاری حذف شوند؟', { danger: true });
      if (!ok) return;
      const backups: any[] = [];
      for (const id of ids) {
        const it = productions.find(p => p.id === id);
        if (!it) continue;
        backups.push(it);
        try { deleteProduction(id); } catch {}
      }
      if (backups.length > 0) {
        setUndoData({ item: backups });
        setTimeout(() => setUndoData((cur: any) => cur && Array.isArray(cur.item) && cur.item.length === backups.length ? null : cur), 8000);
      }
      toastMsg.deletedBulk(backups.length, 'ثبت')
      logAction('delete', 'egg', 'حذف گروهی تخم‌گذاری: ' + backups.length);
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
      for (const it of arr) addProduction(it);
      toastMsg.restoredBulk(arr.length, 'ثبت')
    } catch {
      toastMsg.error('بازگردانی ناموفق')
    }
    setUndoData(null);
  };

  const openNew = () => {
    if (activeFlocks.length === 0) { showAlert('اول یک گله تخم‌گذار بسازید'); return; }
    setForm({ ...empty(), flockId: activeFlocks[0].id });
    setErr(''); setOpen(true);
  };
  useFab(active ? { label: 'ثبت تخم‌گذاری', onClick: openNew } : null);

  const openEdit = (p: EggProduction) => {
    setForm({
      id: p.id, flockId: p.flockId, date: p.date,
      eatingCount: p.eatingCount ? toFa(p.eatingCount) : '',
      fertileCount: p.fertileCount ? toFa(p.fertileCount) : '',
      brokenCount: p.brokenCount ? toFa(p.brokenCount) : '',
      softCount: p.softCount ? toFa(p.softCount) : '',
      dirtyCount: p.dirtyCount ? toFa(p.dirtyCount) : '',
      avgWeight: p.avgWeight !== null && p.avgWeight !== undefined ? toFa(p.avgWeight) : '',
      notes: p.notes || '',
    });
    setErr(''); setOpen(true);
  };

  const int = (s: string) => s ? parseInt(toEn(s)) || 0 : 0;
  const num = (s: string) => s ? parseFloat(toEn(s).replace('٫','.')) || 0 : 0;

  const selectedFlock = activeFlocks.find(f => f.id === form.flockId) || flocks.find(f => f.id === form.flockId);
  const flockCount = selectedFlock ? (selectedFlock.currentCount || selectedFlock.initialCount || 0) : 0;

  /* liveErrorApplied */
  // اعتبارسنجی زنده
  const liveErrors = (() => {
    const errs: { field: string; msg: string }[] = [];
    const e = int(form.eatingCount);
    const f = int(form.fertileCount);
    const b = int(form.brokenCount);
    const s = int(form.softCount);
    const d = int(form.dirtyCount);
    if (e < 0 || f < 0 || b < 0 || s < 0 || d < 0) errs.push({ field: 'all', msg: 'مقادیر منفی مجاز نیست' });
    if (flockCount > 0 && (e + f) > flockCount) errs.push({ field: 'healthy', msg: `مجموع سالم (${toFa(e + f)}) از تعداد گله (${toFa(flockCount)}) بیشتره` });
    if (e > 0 && e > flockCount) errs.push({ field: 'eating', msg: 'تخم خوراکی از تعداد گله بیشتره' });
    if (f > 0 && f > flockCount) errs.push({ field: 'fertile', msg: 'تخم نطفه‌دار از تعداد گله بیشتره' });
    return errs;
  })();
  const healthySum = int(form.eatingCount) + int(form.fertileCount);
  const totalSum = healthySum + int(form.brokenCount) + int(form.softCount) + int(form.dirtyCount);

  const totalEggs = int(form.eatingCount) + int(form.fertileCount) + int(form.brokenCount) + int(form.softCount) + int(form.dirtyCount);
  const healthy = int(form.eatingCount) + int(form.fertileCount);
  const liveRate = flockCount > 0 && healthy > 0 ? ((healthy / flockCount) * 100).toFixed(1) : '0';
  const fertilePercent = healthy > 0 ? Math.round((int(form.fertileCount) / healthy) * 100) : 0;
  const eatingPercent = healthy > 0 ? Math.round((int(form.eatingCount) / healthy) * 100) : 0;

  const save = () => {
    if (form.flockId === '') { setErr('گله اجباری است'); return; }
    if (form.date.trim() === '') { setErr('تاریخ اجباری است'); return; }
    const eating = int(form.eatingCount);
    const fertile = int(form.fertileCount);
    const broken = int(form.brokenCount);
    const soft = int(form.softCount);
    const dirty = int(form.dirtyCount);
    const total = eating + fertile + broken + soft + dirty;
    if (total === 0) { setErr('حداقل یک عدد وارد کنید'); return; }
    if (flockCount > 0 && (eating + fertile) > flockCount) {
      setErr('تخم سالم (' + toFa(eating + fertile) + ') نمی‌تواند از تعداد گله (' + toFa(flockCount) + ') بیشتر باشد');
      return;
    }
    const data = {
      flockId: form.flockId,
      date: form.date.trim(),
      eatingCount: eating,
      fertileCount: fertile,
      totalCount: total,
      brokenCount: broken,
      softCount: soft,
      dirtyCount: dirty,
      avgWeight: form.avgWeight ? num(form.avgWeight) : null,
      notes: form.notes.trim(),
    };
    if (form.id === undefined) { addProduction(data); }
    else { updateProduction(form.id, data); }
    setOpen(false);
  };

  // ═══ اعتبارسنجی زنده ═══
  const validationContext = {
    flockCount: selectedFlock?.initialCount || 0,
    flockCurrentCount: selectedFlock?.currentCount || flockCount,
    flockType: selectedFlock?.type,
  };
  const { errors: vErrors } = useValidation(
    createEggSchema(validationContext),
    {
      flockId: form.flockId || '',
      date: form.date || '',
      eatingCount: int(form.eatingCount),
      fertileCount: int(form.fertileCount),
      brokenCount: int(form.brokenCount),
      softCount: int(form.softCount),
      dirtyCount: int(form.dirtyCount),
      avgWeight: form.avgWeight ? num(form.avgWeight) : null,
      notes: form.notes || '',
    },
  );



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
        id="egg-prod-intro"
        icon="🥚"
        title="ثبت تخم‌گذاری روزانه"
        description="هر روز تعداد تخم‌ها را بین خوراکی، نطفه‌دار و مصرفی تقسیم کنید."
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
          icon={<svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"><ellipse cx="12" cy="14" rx="7" ry="9"/></svg>}
          title="تخم‌گذاری ثبت نشده"
          desc={activeFlocks.length === 0 ? 'اول یک گله تخم‌گذار بسازید.' : 'اولین تخم‌گذاری امروز را ثبت کنید.'}
          action={<Btn variant="primary" onClick={openNew}>+ ثبت تخم‌گذاری</Btn>}
        />
      ) : (
        <>
          {list.map((p, i) => {
            const flock = flocks.find(f => f.id === p.flockId);
            const bird = flock ? birds.find(b => b.id === flock.birdId) : null;
            const healthy2 = healthyCount(p);
            const flockCount2 = flock ? (flock.currentCount || flock.initialCount || 0) : 0;
            const rate = henDayRate(p, flockCount2);
            const brokenPct = brokenRate(p);
            const isOpen = !ms.selectionMode && expandedId === p.id;
            const ageDays = flock ? getAgeDays(flock) : 0;

            let accent: 'accent' | 'warn' = 'accent';
            let tone: 'green' | 'amber' | 'red' = 'green';
            if (rate > 0 && rate < 60) { accent = 'warn'; tone = 'amber'; }

            return (
              <ExpandableCard
                key={p.id}
                id={p.id}
                ms={ms}
                accent={accent}
                index={toFa(i + 1)}
                iconEmoji="🥚"
                title={toFa(healthy2) + ' تخم سالم — ' + (flock?.name || '—')}
                subtitle={toFa(p.date) + (bird ? ' · ' + bird.name : '') + (ageDays > 0 ? ' · ' + toFa(ageDays) + ' روز' : '')}
                isOpen={isOpen}
                onToggle={() => setExpandedId(isOpen ? null : p.id)}
                badge={rate > 0 ? <Tag tone={tone}>{toFa(rate.toFixed(1))}٪</Tag> : undefined}
                stats={
                  <>
                    <span>کل: <b style={{ color: 'var(--text)' }}>{toFa(p.totalCount)}</b></span>
                    {p.brokenCount > 0 ? <span style={{ color: 'var(--danger)' }}>شکسته: <b>{toFa(p.brokenCount)}</b></span> : null}
                    {brokenPct > 0 ? <span>شکسته: <b style={{ color: 'var(--text)' }}>{toFa(brokenPct.toFixed(1))}٪</b></span> : null}
                  </>
                }
              >
                <SectionTitle>📊 آمار تخم‌گذاری</SectionTitle>
                {p.eatingCount > 0 && <Row l="🥚 تخم خوراکی" v={toFa(p.eatingCount)} />}
                {p.fertileCount > 0 && <Row l="🌱 تخم نطفه‌دار" v={toFa(p.fertileCount)} />}
                <Row l="تخم سالم" v={toFa(healthy2)} />
                <Row l="تخم شکسته" v={toFa(p.brokenCount)} />
                {p.softCount > 0 ? <Row l="تخم نرم" v={toFa(p.softCount)} /> : null}
                {p.dirtyCount > 0 ? <Row l="تخم کثیف" v={toFa(p.dirtyCount)} /> : null}
                <Row l="جمع کل" v={toFa((p.totalCount || 0) + (p.brokenCount || 0) + (p.softCount || 0) + (p.dirtyCount || 0))} />

                {rate > 0 ? (
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--fs-sm)', padding: 'var(--pad-normal)', background: 'var(--accent-soft)', color: 'var(--accent)', borderRadius: 'var(--r-sm)', fontWeight: 700 }}>
                    <span>نرخ تخم‌گذاری (Hen-Day):</span>
                    <span>{toFa(rate.toFixed(1))}٪</span>
                  </div>
                ) : null}

                {p.avgWeight ? (
                  <>
                    <SectionTitle>⚖ وزن</SectionTitle>
                    <Row l="وزن میانگین" v={toFa(p.avgWeight) + ' گرم'} />
                  </>
                ) : null}

                {p.notes ? (
                  <>
                    <SectionTitle>📝 یادداشت</SectionTitle>
                    <div style={{ fontSize: 'var(--fs-sm)', lineHeight: 1.7, padding: 'var(--pad-normal)', background: 'var(--input-bg)', borderRadius: 'var(--r-sm)' }}>{p.notes}</div>
                  </>
                ) : null}

                <div style={{ display: 'flex', gap: 6, paddingTop: 4 }}>
                  <Btn size="sm" onClick={() => openEdit(p)} style={{ flex: 1 }}>ویرایش</Btn>
                  <Btn size="sm" onClick={async () => {
                    const ok = await showConfirmAsync('تأیید حذف', 'این تخم‌گذاری حذف شود؟', { danger: true });
                    if (!ok) return;
                    setUndoData({ item: p });
                    setTimeout(() => setUndoData((cur: any) => cur && cur.item.id === p.id ? null : cur), 6000);
                    deleteProduction(p.id);
                    logAction('delete', 'egg', 'حذف از تخم‌ها');
                    toastMsg.deleted('تخم‌گذاری ' + (p.date || ''))
                  }} style={{ flex: 1 }}>حذف</Btn>
                </div>
              </ExpandableCard>
            );
          })}
          
        </>
      )}

      <MultiSelectBar ms={ms} deleteLabel="حذف" />

      {ms.selectionMode && <div style={{ height: 90 }} />}

      <ProductionFormModal
        open={open}
        setOpen={setOpen}
        form={form}
        setForm={setForm}
        err={err}
        vErrors={vErrors}
        activeFlocks={activeFlocks}
        flockCount={flockCount}
        onSave={save}
      />

    </PageContainer>
  );
}
