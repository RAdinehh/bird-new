import { useState, useMemo, useRef , useEffect} from 'react';
import { useFab } from '../../shr/hooks/useFab';
import { useSwipeTabs } from '../../shr/hooks/useSwipeTabs';
import {
  useFlk, type Flock, type FlockType, type FlockStatus,
  SOURCE_LABEL, getAgeDays, getLifecycle, formatAge,
  sexRatio, daysUntilLaying, isLayingReady, calcCosts,
  DEFAULT_LAYING_START, getLayingStartDay
} from './store';
import { useBrd } from '../brd/store';
import { useSet } from '../set/store';
import { useTra } from '../tra/store';
import { format, addDays, subMonths } from 'date-fns-jalali';
import { schedulesByType, getSchedule } from '../cal/vaccineSchedules';
import { useHal } from '../hal/store';
import { Btn, BtnRow, Empty, Field, Grid2, Input, Modal, MoneyField, NumField, PageContainer, Select, Tag, Textarea, ErrorBox } from '../../shr/components/ui';
import HelpBanner from '../../shr/components/HelpBanner';;
import { useMultiSelect } from '../../shr/multiSelect/useMultiSelect';
import MultiSelectBar from '../../shr/multiSelect/MultiSelectBar';
import ExpandableCard from '../../shr/components/ExpandableCard';
import { MiniProgress } from '../../shr/components/ProgressTracker';
import UndoBar from '../../cor/ui/UndoBar';
import DatePicker from '../../shr/components/DatePicker';
import { toFa, toEn } from '../../shr/utils/fa';
import { useFormat } from '../../shr/units';
import { useBreedStandard } from '../../shr/hooks/useBreedStandard';
import { showAlert } from '../../cor/store/dialog';
import SmartSelect from '../../shr/components/SmartSelect';
import DependentSelect from '../../shr/components/DependentSelect';
import { showConfirmAsync, showPromptAsync } from '../../cor/store/dialog';
import { showToast, toastMsg } from '../../cor/store/toast';
import { Row, DepBox } from './helpers';
import FlockCard from './components/FlockCard';
import FlocksModal from './components/FlocksModal';
import UpcomingFlocks from './components/UpcomingFlocks';
import { useFlocksForm } from './hooks/useFlocksForm';
import { checkHallCapacity } from './api/hallCapacity';
import { todayJ, jalaliBounds, checkDateBounds, hasRefs, getFlockRevenue } from './api/flocksCalc';
import { emptyForm as empty, type F, type TabId } from './types-flocks';
import { logAction } from '../../cor/logger/auditLog';
import { useValidation } from '../../shr/validation/useValidation';
import { createFlkSchema } from '../../shr/validation/rules/flk';


export default function FlocksPage() {
  const fmt = useFormat();
  const breedStd = useBreedStandard();
  const { flocks, add, update, remove, archive, restore, toggleHidden, togglePaused } = useFlk();
  const vaccineEnabled = useSet(s => (s as any).features?.vaccine !== false);
  const { birds: _birdsRaw, breeds } = useBrd();
  const { halls: _hallsRaw, zones } = useHal();
  const { invoices } = useTra();

  const [tab, setTab] = useState<TabId>('all');
  const [q, setQ] = useState('');
  const [undoData, setUndoData] = useState<{ flock: any } | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showHidden, setShowHidden] = useState(false);
  const swipeRef = useSwipeTabs(['all', 'layer', 'broiler', 'breeder', 'hidden', 'archived'], tab, (id) => setTab(id as TabId));

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

  const halls = useMemo(() => {
    const seen = new Set<string>();
    return _hallsRaw.filter(h => {
      const k = (h.name || '').trim().toLowerCase();
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    });
  }, [_hallsRaw]);

  // ⭐ hook فرم گله
  const {
    open, setOpen, form, setForm, layingFromStd, setLayingFromStd, err, setErr,
    openNew, openEdit, save,
  } = useFlocksForm({ birds, halls, flocks, breedStd, add, update });

  // helpers محلی (برای validation و liveCosts)
  const num = (s: string) => s ? parseFloat(toEn(s).replace('٫','.')) || null : null;
  const int = (s: string) => s ? parseInt(toEn(s)) || null : null;

  // بازگردانی گله‌های حذف‌شده
  const undoDeleteFlock = () => {
    if (undoData == null) return;
    const list = Array.isArray(undoData.flock) ? undoData.flock : [undoData.flock];
    try {
      list.forEach((f) => add(f));
      toastMsg.restoredBulk(list.length, 'گله');
    } catch (err) {
      toastMsg.error('بازگردانی ناموفق');
    }
    setUndoData(null);
  };




  useFab({ label: 'افزودن گله', onClick: openNew });


  // ═══ اعتبارسنجی زنده ═══
  const { errors: vErrors } = useValidation(
    createFlkSchema(),
    {
      name: form.name || '',
      type: form.type,
      birdId: form.birdId || '',
      breedId: form.breedId || '',
      hallId: form.hallId || '',
      zoneId: form.zoneId || '',
      initialCount: int(form.initialCount) ?? 0,
      currentCount: int(form.currentCount) ?? 0,
      maleCount: int(form.maleCount) ?? 0,
      femaleCount: int(form.femaleCount) ?? 0,
      layingStartDay: int(form.layingStartDay) || 150,
      endOfCycleDay: (form as any).endOfCycleDay ? int((form as any).endOfCycleDay) : 0,
      vaccineScheduleId: form.vaccineScheduleId || '',
      hatchDate: form.hatchDate || '',
      purchaseDate: form.purchaseDate || '',
      startDate: form.startDate || '',
      source: form.source,
      purchasePrice: num(form.purchasePrice) ?? 0,
      deliveryCost: num(form.deliveryCost) ?? 0,
      otherCosts: num(form.otherCosts) ?? 0,
      status: form.status,
      notes: form.notes || '',
    },
  );


  const formStd = breedStd.byBreedId(form.breedId);
  const formLaying = formStd?.biology?.layingStartDay ?? DEFAULT_LAYING_START;

  const addEvent = useFlk(s => s.addEvent);

  const list = useMemo(() => {
    let arr = flocks;
    if (tab === 'archived') arr = arr.filter(f => f.status === 'archived' || f.status === 'sold');
    else if (tab === 'hidden') arr = arr.filter(f => f.status === 'active' && f.hidden);
    else if (tab === 'all') arr = arr.filter(f => f.status === 'active' && !f.hidden);
    else arr = arr.filter(f => f.status === 'active' && f.type === tab && !f.hidden);
    if (q.trim()) {
      const t = q.trim();
      arr = arr.filter(f => {
        const bird = birds.find(b => b.id === f.birdId);
        const breed = breeds.find(b => b.id === f.breedId);
        return f.name.includes(t) || bird?.name.includes(t) || breed?.name.includes(t);
      });
    }
    return arr;
  }, [flocks, tab, q, birds, breeds]);

  // ─── Multi-Select ───
  const ms = useMultiSelect({
    items: list,
    getId: (f: any) => f.id,
    onDelete: async (ids: string[]) => {
      const withRefs = ids.filter(id => hasRefs(id));
      const withoutRefs = ids.filter(id => !hasRefs(id));
      let msg = toFa(ids.length) + ' گله انتخاب شده.';
      if (withRefs.length > 0) msg += ' ' + toFa(withRefs.length) + ' گله ارجاع دارن (آرشیو می‌شن).';
      if (withoutRefs.length > 0) msg += ' ' + toFa(withoutRefs.length) + ' گله حذف کامل می‌شن.';
      msg += ' ادامه؟';
      const ok = await showConfirmAsync('حذف گروهی', msg, { danger: true });
      if (!ok) return;
      let arch = 0, del = 0;
      const backups: any[] = [];
      for (const id of ids) {
        const fl = flocks.find(f => f.id === id);
        if (!fl) continue;
        if (hasRefs(id)) {
          try { archive(id); arch++; } catch {}
        } else {
          backups.push(fl);
          try { remove(id); del++; } catch {}
        }
      }
      if (backups.length > 0) {
        setUndoData({ flock: backups });
        setTimeout(() => setUndoData((cur: any) => cur && Array.isArray(cur.flock) && cur.flock.length === backups.length ? null : cur), 8000);
      }
      let toast = '';
      if (arch > 0) toast += toFa(arch) + ' آرشیو';
      if (del > 0) toast += (toast ? ' · ' : '') + toFa(del) + ' حذف';
      showToast(toast || 'انجام شد', 'success');
      logAction('delete', 'flk', 'حذف گروهی: ' + arch + ' آرشیو، ' + del + ' حذف');
    },
    onArchive: async (ids: string[]) => {
      const ok = await showConfirmAsync('آرشیو گروهی', toFa(ids.length) + ' گله آرشیو شوند؟', { danger: false });
      if (!ok) return;
      for (const id of ids) {
        try { archive(id); } catch {}
      }
      logAction('update', 'flk', 'آرشیو گروهی ' + ids.length + ' گله');
      toastMsg.archivedBulk(ids.length, 'گله');
    },
  });


  // وقتی وارد حالت انتخاب می‌شیم، همه کارت‌ها بسته بشن
  useEffect(() => {
    if (ms.selectionMode) setExpandedId(null);
  }, [ms.selectionMode]);


  const breedsForBird = breeds.filter(b => b.birdId === form.birdId);
  const zonesForHall = zones.filter(z => z.hallId === form.hallId);

  const liveCosts = useMemo(() => {
    const bird = (int(form.initialCount) || 0) * (num(form.purchasePrice) || 0);
    const del = num(form.deliveryCost) || 0;
    const oth = num(form.otherCosts) || 0;
    const total = bird + del + oth;
    const per = int(form.initialCount) ? total / (int(form.initialCount) || 1) : 0;
    return { bird, del, oth, total, per };
  }, [form]);

  const tabCount = (t: TabId) => {
    if (t === 'all') return flocks.filter(f => f.status === 'active').length;
    if (t === 'archived') return flocks.filter(f => f.status === 'archived' || f.status === 'sold').length;
    return flocks.filter(f => f.status === 'active' && f.type === t).length;
  };

  const hiddenCount = flocks.filter(f => f.hidden && f.status === 'active').length;

  const tabs: { id: TabId; label: string }[] = [
    { id: 'all', label: 'فعال' },
    { id: 'layer', label: 'تخم‌گذار' },
    { id: 'broiler', label: 'گوشتی' },
    { id: 'breeder', label: 'مادر' },
    { id: 'hidden', label: 'پنهان' },
    { id: 'archived', label: 'آرشیو' }
  ];

  return (
    <div ref={swipeRef} style={{ touchAction: 'pan-y', minHeight: 'calc(100vh - 120px)' }}>
      <div style={{
        display: 'flex', gap: 0, borderBottom: '1px solid var(--border)',
        padding: '0 12px', background: 'var(--header-bg)',
        position: 'sticky', top: 52, zIndex: 11, overflowX: 'auto', scrollbarWidth: 'none'
      }}>
        {tabs.map(t => (
          <div key={t.id} onClick={() => setTab(t.id)} style={{
            padding: '11px 12px', fontSize: 'var(--fs-base)', fontWeight: 600,
            color: tab === t.id ? 'var(--accent)' : 'var(--muted)',
            cursor: 'pointer', position: 'relative', whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            display: 'flex', alignItems: 'center', gap: 5
          }}>
            {t.label}
            <span style={{ fontSize: 12, background: tab === t.id ? 'var(--accent-soft)' : 'var(--input-bg)', color: tab === t.id ? 'var(--accent)' : 'var(--muted)', padding: '1px 5px', borderRadius: 8, fontWeight: 700 }}>{toFa(tabCount(t.id))}</span>
            {tab === t.id && <div style={{ position: 'absolute', bottom: 0, right: 12, left: 12, height: 3, background: 'var(--accent)', borderRadius: '3px 3px 0 0' }} />}
          </div>
        ))}
      </div>

      <PageContainer>
      {undoData && (
        <UndoBar
          label="گله حذف شد"
          onUndo={undoDeleteFlock}
          onDismiss={() => setUndoData(null)}
        />
      )}
        <HelpBanner
          id="flk-intro"
          icon="🐔"
          title="مدیریت گله‌ها"
          description="اینجا گله‌های فعال، تخم‌گذار و گوشتی را تعریف و مدیریت می‌کنید. با تعریف گله، امکان ثبت روزانه فعال می‌شود."
          tone="info"
        />
        {/* گله‌های نزدیک به تخم‌گذاری */}
        <UpcomingFlocks flocks={flocks} birds={birds} breedStd={breedStd} fmt={fmt} />

        <div style={{
          height: 38, background: 'var(--input-bg)', border: '1px solid var(--border)',
          borderRadius: 'var(--r-md)', padding: '0 12px', display: 'flex', alignItems: 'center', gap: 8
        }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--dim)" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
          <input value={q} onChange={e => setQ(e.target.value)} placeholder="جستجوی نام، پرنده، نژاد..." style={{ flex: 1, background: 'none', border: 'none', outline: 'none', color: 'var(--text)', fontFamily: 'inherit', fontSize: 'var(--fs-base)', minWidth: 0 }} />
        </div>

        {!ms.selectionMode && list.length > 1 && (
          <div style={{ fontSize: '10px', color: 'var(--dim)', textAlign: 'center', paddingBottom: 2 }}>
            برای انتخاب چندتایی، روی یک کارت نگه دارید
          </div>
        )}

        {ms.selectionMode && list.length > 1 && (
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 6 }}>
            <button type="button" onClick={ms.selectedIds.size === list.length ? ms.clearSelection : ms.selectAll}
              style={{ padding: '4px 10px', background: 'var(--input-bg)', border: '1px solid var(--border)', borderRadius: 'var(--r-sm)', color: 'var(--muted)', fontFamily: 'inherit', fontSize: '10px', fontWeight: 600, cursor: 'pointer' }}>
              {ms.selectedIds.size === list.length ? 'لغو انتخاب همه' : 'انتخاب همه'}
            </button>
          </div>
        )}

        {list.length === 0 ? (
          <Empty
            icon={<svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"><circle cx="9" cy="7" r="4"/><path d="M3 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2"/></svg>}
            title={q ? 'نتیجه‌ای یافت نشد' : tab === 'archived' ? 'آرشیو خالی است' : 'هنوز گله‌ای نساخته‌اید'}
            desc={q ? 'عبارت دیگری امتحان کنید' : 'اولین گله‌ی خود را بسازید — گله‌ها به پرنده، نژاد و سالن متصل می‌شوند.'}
            action={!q && tab !== 'archived' ? <Btn variant="primary" onClick={openNew}>+ افزودن گله</Btn> : undefined}
          />
        ) : (
          <>
            {list.map((f, i) => {
              const bird = birds.find(b => b.id === f.birdId);
              const breed = breeds.find(b => b.id === f.breedId);
              const hall = halls.find(h => h.id === f.hallId);
              const zone = zones.find(z => z.id === f.zoneId);
              const revenue = getFlockRevenue(f.id, invoices);
              const isOpen = !ms.selectionMode && expandedId === f.id;
              return (
                <FlockCard
                  key={f.id}
                  flock={f}
                  index={i}
                  bird={bird}
                  breed={breed}
                  hall={hall}
                  zone={zone}
                  invoiceRevenue={revenue}
                  vaccineEnabled={vaccineEnabled}
                  isOpen={isOpen}
                  ms={ms}
                  fmt={fmt}
                  onToggle={() => setExpandedId(isOpen ? null : f.id)}
                  onEdit={() => openEdit(f)}
                  onArchive={(reason) => {
                    archive(f.id, reason);
                    toastMsg.archived(f.name);
                    logAction('update', 'flk', 'آرشیو گله: ' + f.name);
                  }}
                  onRestore={() => restore(f.id)}
                  onDelete={() => {
                    const item = flocks.find(fl => fl.id === f.id);
                    if (item) {
                      setUndoData({ flock: item });
                      setTimeout(() => setUndoData((cur: any) => cur && cur.flock.id === item.id ? null : cur), 6000);
                    }
                    remove(f.id);
                    logAction('delete', 'flk', 'حذف از گله‌ها');
                    toastMsg.deleted(f.name);
                  }}
                  onToggleHidden={() => { toggleHidden(f.id); f.hidden ? toastMsg.visible(f.name) : toastMsg.hidden(f.name); }}
                  onTogglePaused={() => { togglePaused(f.id); f.paused ? toastMsg.activated(f.name) : toastMsg.paused(f.name); }}
                />
              );
            })}
          </>
        )}

        {/* نوار شناور Multi-Select */}
        
      <MultiSelectBar ms={ms} deleteLabel="حذف" archiveLabel="آرشیو" />

        <FlocksModal
        open={open}
        onClose={() => setOpen(false)}
        form={form}
        setForm={setForm}
        layingFromStd={layingFromStd}
        setLayingFromStd={setLayingFromStd}
        err={err}
        vErrors={vErrors}
        birds={birds}
        breedsForBird={breedsForBird}
        halls={halls}
        zonesForHall={zonesForHall}
        breedStd={breedStd}
        vaccineEnabled={vaccineEnabled}
        fmt={fmt}
        onSave={save}
      />

      </PageContainer>
    </div>
  );
}
