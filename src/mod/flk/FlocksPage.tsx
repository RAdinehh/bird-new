import { useState, useMemo } from 'react';
import { useSwipeTabs } from '../../shr/hooks/useSwipeTabs';
import {
  useFlk, type Flock, type FlockType, type FlockStatus,
  SOURCE_LABEL, getAgeDays, getLifecycle, formatAge,
  sexRatio, daysUntilLaying, isLayingReady, calcCosts,
  LAYING_START_DAY, getLayingStartDay
} from './store';
import { useBrd } from '../brd/store';
import { schedulesByType, getSchedule } from '../cal/vaccineSchedules';
import { useHal } from '../hal/store';
import { Btn, BtnRow, Empty, Field, Grid2, Input, Modal, MoneyField, NumField, PageContainer, Select, Tag, ErrorBox } from '../../shr/components/ui';
import HelpBanner from '../../shr/components/HelpBanner';;
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
import { showConfirmAsync } from '../../cor/store/dialog';
import { showToast } from '../../cor/store/toast';
import { Row, DepBox } from './helpers';
import { logAction } from '../../cor/logger/auditLog';

interface F {
  id?: string;
  name: string; type: FlockType; birdId: string; breedId: string;
  hallId: string; zoneId: string;
  initialCount: string; currentCount: string;
  maleCount: string; femaleCount: string;
  layingStartDay: string;
  vaccineScheduleId: string;
  hatchDate: string; purchaseDate: string; startDate: string;
  source: string;
  purchasePrice: string; deliveryCost: string; otherCosts: string;
  status: FlockStatus; notes: string;
}

const empty = (): F => ({
  name: '', type: 'layer', birdId: '', breedId: '', hallId: '', zoneId: '',
  initialCount: '', currentCount: '', maleCount: '', femaleCount: '',
  layingStartDay: '',
  vaccineScheduleId: '',
  hatchDate: '', purchaseDate: '', startDate: '',
  source: 'purchase', purchasePrice: '', deliveryCost: '', otherCosts: '',
  status: 'active', notes: ''
});

type TabId = 'all' | 'layer' | 'broiler' | 'breeder' | 'archived';


/** چک ظرفیت سالن — مجموع گله‌های فعال + گله جدید */
function checkHallCapacity(
  hallId: string,
  newCount: number,
  flocks: any[],
  halls: any[],
  excludeFlockId?: string,
): { ok: boolean; capacity: number; current: number; total: number; over: number } | null {
  if (!hallId || !newCount) return null;
  const hall = halls.find(h => h.id === hallId);
  if (!hall || !hall.capacity) return null;

  const current = (flocks || [])
    .filter(f => f.hallId === hallId && f.status === 'active' && f.id !== excludeFlockId)
    .reduce((sum, f) => sum + (f.currentCount || f.initialCount || 0), 0);

  const total = current + newCount;
  const over = total - hall.capacity;
  return {
    ok: over <= 0,
    capacity: hall.capacity,
    current,
    total,
    over: over > 0 ? over : 0,
  };
}

export default function FlocksPage() {
  const fmt = useFormat();
  const breedStd = useBreedStandard();
  const { flocks, add, update, remove, archive, restore } = useFlk();
  const { birds: _birdsRaw, breeds } = useBrd();
  const { halls: _hallsRaw, zones } = useHal();

  const [tab, setTab] = useState<TabId>('all');
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<F>(empty());
  const [err, setErr] = useState('');
  const [delId, setDelId] = useState<string | null>(null);
  const [undoData, setUndoData] = useState<{ flock: any } | null>(null);
  const [archId, setArchId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const swipeRef = useSwipeTabs(['all', 'layer', 'broiler', 'breeder', 'archived'], tab, (id) => setTab(id as TabId));

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

  const undoDeleteFlock = () => {
    if (undoData == null) return;
    const flockToRestore = undoData.flock;
    try {
      add(flockToRestore);
      showToast('گله بازگردانی شد', 'success', 2000);
    } catch (err) {
      showToast('بازگردانی ناموفق', 'error', 2000);
    }
    setUndoData(null);
  };

  const openNew = () => {
    if (birds.length === 0) { showAlert('اول پرنده بسازید'); return; }
    if (halls.length === 0) { showAlert('اول سالن بسازید'); return; }
    const lastF = flocks
      .slice()
      .sort((a, b) => (b.startDate || '').localeCompare(a.startDate || ''))[0];
    setForm({
      ...empty(),
      birdId: lastF?.birdId || birds[0].id,
      hallId: lastF?.hallId || halls[0].id,
      ...(lastF?.breedId ? { breedId: lastF.breedId } : {}),
    });
    setErr(''); setOpen(true);
  };

  const openEdit = (f: Flock) => {
    setForm({
      id: f.id, name: f.name, type: f.type, birdId: f.birdId, breedId: f.breedId,
      hallId: f.hallId, zoneId: f.zoneId,
      initialCount: f.initialCount ? toFa(f.initialCount) : '',
      currentCount: f.currentCount ? toFa(f.currentCount) : '',
      maleCount: f.maleCount ? toFa(f.maleCount) : '',
      femaleCount: f.femaleCount ? toFa(f.femaleCount) : '',
      layingStartDay: f.layingStartDay ? toFa(f.layingStartDay) : '',
      vaccineScheduleId: f.vaccineScheduleId || '',
      hatchDate: f.hatchDate || '', purchaseDate: f.purchaseDate || '', startDate: f.startDate || '',
      source: f.source,
      purchasePrice: f.purchasePrice ? toFa(f.purchasePrice) : '',
      deliveryCost: f.deliveryCost ? toFa(f.deliveryCost) : '',
      otherCosts: f.otherCosts ? toFa(f.otherCosts) : '',
      status: f.status, notes: f.notes
    });
    setErr(''); setOpen(true);
  };

  const num = (s: string) => s ? parseFloat(toEn(s).replace('٫','.')) || null : null;
  const int = (s: string) => s ? parseInt(toEn(s)) || null : null;

  const save = async () => {
    // 🔒 جلوگیری قاطع از نام تکراری گله
    if (!form.id) {
      const _trimmed = form.name.trim();
      const _dup = flocks.find((x: any) => x.name.trim() === _trimmed);
      if (_dup) {
        showAlert(
          `گلهای با نام «${_dup.name}» قبلاً ثبت شده. لطفاً نام دیگری انتخاب کنید یا همان را ویرایش کنید.`,
          '❌ نام تکراری'
        );
        return;
      }
    }

    if (!form.name.trim()) { setErr('نام گله اجباری است'); return; }
    if (!form.birdId) { setErr('پرنده اجباری است'); return; }
    if (!form.startDate.trim() && !form.hatchDate.trim() && !form.purchaseDate.trim()) {
      setErr('حداقل یکی از تاریخ‌های هچ، خرید یا شروع را وارد کنید'); return;
    }
    const data = {
      name: form.name.trim(), type: form.type,
      birdId: form.birdId, breedId: form.breedId,
      hallId: form.hallId, zoneId: form.zoneId,
      initialCount: int(form.initialCount),
      currentCount: int(form.currentCount) || int(form.initialCount),
      maleCount: int(form.maleCount), femaleCount: int(form.femaleCount),
      layingStartDay: form.layingStartDay.trim() === '' ? (breedStd.byBreedId(form.breedId)?.biology?.layingStartDay ?? LAYING_START_DAY) : (int(form.layingStartDay) || LAYING_START_DAY),
      endOfCycleDay: breedStd.byBreedId(form.breedId)?.biology?.endOfCycleDay ?? null,
      hatchDate: form.hatchDate.trim(), purchaseDate: form.purchaseDate.trim(),
      startDate: form.startDate.trim(), endDate: '',
      source: form.source,
      purchasePrice: num(form.purchasePrice),
      deliveryCost: num(form.deliveryCost),
      otherCosts: num(form.otherCosts),
      vaccineScheduleId: form.vaccineScheduleId,
      status: form.status, notes: form.notes.trim()
    };
    // 🔒 چک ظرفیت سالن
    const newCount = data.currentCount || data.initialCount || 0;
    const cap = checkHallCapacity(form.hallId, newCount, flocks, halls, form.id || undefined);
    if (cap && !cap.ok) {
      const ok = await showConfirmAsync(
        '⚠️ ظرفیت سالن پر می‌شود',
        `ظرفیت سالن: ${cap.capacity} پرنده\n` +
        `فعلی: ${cap.current} پرنده\n` +
        `بعد از این گله: ${cap.total} پرنده\n` +
        `اضافه‌بار: ${cap.over} پرنده\n\n` +
        `آیا می‌خواهید ادامه دهید؟`,
        { danger: true, confirmText: 'بله، ادامه' }
      );
      if (!ok) return;
    }

    if (form.id) update(form.id, data); else add(data);
    setOpen(false);
  };

  const formStd = breedStd.byBreedId(form.breedId);
  const formLaying = formStd?.biology?.layingStartDay ?? LAYING_START_DAY;

  const list = useMemo(() => {
    let arr = flocks;
    if (tab === 'archived') arr = arr.filter(f => f.status === 'archived' || f.status === 'sold');
    else if (tab === 'all') arr = arr.filter(f => f.status === 'active');
    else arr = arr.filter(f => f.status === 'active' && f.type === tab);
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

  const target = delId ? flocks.find(f => f.id === delId) : null;
  const archTarget = archId ? flocks.find(f => f.id === archId) : null;

  const tabCount = (t: TabId) => {
    if (t === 'all') return flocks.filter(f => f.status === 'active').length;
    if (t === 'archived') return flocks.filter(f => f.status === 'archived' || f.status === 'sold').length;
    return flocks.filter(f => f.status === 'active' && f.type === t).length;
  };

  const tabs: { id: TabId; label: string }[] = [
    { id: 'all', label: 'فعال' },
    { id: 'layer', label: 'تخم‌گذار' },
    { id: 'broiler', label: 'گوشتی' },
    { id: 'breeder', label: 'مادر' },
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
        {(() => {
          const upcoming = flocks.filter(f => {
            if (f.status !== 'active') return false;
            if (f.type !== 'layer' && f.type !== 'breeder') return false;
            const std = breedStd.byBreedId(f.breedId);
            const startDay = getLayingStartDay(f, std?.biology?.layingStartDay ?? LAYING_START_DAY);
            const age = getAgeDays(f);
            return age < startDay && age >= startDay - 60;
          }).sort((a, b) => getAgeDays(b) - getAgeDays(a));

          if (upcoming.length === 0) return null;

          return (
            <div style={{
              background: 'var(--accent-soft)',
              border: '1px solid var(--accent-border)',
              borderRadius: 'var(--r-lg)',
              padding: 'var(--pad-comfy)'
            }}>
              <div style={{
                display: 'flex', alignItems: 'center', gap: 6,
                marginBottom: 10
              }}>
                <span style={{ fontSize: 'var(--fs-md)' }}>⏳</span>
                <span style={{ fontSize: 'var(--fs-sm)', fontWeight: 700, color: 'var(--accent)' }}>
                  نزدیک به شروع تخم‌گذاری ({fmt.int(upcoming.length)})
                </span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {upcoming.map(f => {
                  const age = getAgeDays(f);
                  const std = breedStd.byBreedId(f.breedId);
            const startDay = getLayingStartDay(f, std?.biology?.layingStartDay ?? LAYING_START_DAY);
                  const remain = startDay - age;
                  const bird = birds.find(b => b.id === f.birdId);
                  return (
                    <div key={f.id} style={{
                      padding: 'var(--pad-normal)',
                      background: 'var(--card)',
                      border: '1px solid var(--border)',
                      borderRadius: 'var(--r-md)'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                        <span style={{ fontSize: 'var(--fs-sm)', fontWeight: 700 }}>{f.name}</span>
                        <span style={{
                          fontSize: 'var(--fs-xs)',
                          color: remain <= 14 ? 'var(--warn)' : 'var(--muted)',
                          fontWeight: 700
                        }}>
                          {fmt.int(remain)} روز مانده
                        </span>
                      </div>
                      <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--muted)', marginBottom: 6 }}>
                        {bird?.name || '—'} · سن فعلی: {toFa(age)} روز
                      </div>
                      <MiniProgress
                        current={age}
                        target={startDay}
                        color={remain <= 14 ? 'warn' : 'info'}
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })()}

        <div style={{
          height: 38, background: 'var(--input-bg)', border: '1px solid var(--border)',
          borderRadius: 'var(--r-md)', padding: '0 12px', display: 'flex', alignItems: 'center', gap: 8
        }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--dim)" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
          <input value={q} onChange={e => setQ(e.target.value)} placeholder="جستجوی نام، پرنده، نژاد..." style={{ flex: 1, background: 'none', border: 'none', outline: 'none', color: 'var(--text)', fontFamily: 'inherit', fontSize: 'var(--fs-base)', minWidth: 0 }} />
        </div>

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
              const ageDays = getAgeDays(f);
              const lc = getLifecycle(f.type, ageDays, f.endOfCycleDay ?? null);
              const isArchived = f.status === 'archived' || f.status === 'sold';
              const ready = isLayingReady(f);
              const untilLay = daysUntilLaying(f);
              const costs = calcCosts(f);
              const isOpen = expandedId === f.id;

              const accentColor: any = isArchived ? 'dim' : lc.color;

              return (
                <ExpandableCard
                  key={f.id}
                  accent={accentColor}
                  index={toFa(i + 1)}
                  iconEmoji="🐔"
                  title={f.name}
                  subtitle={`${bird?.name || '—'}${breed ? ` · ${breed.name}` : ''}${hall ? ` · ${hall.name}` : ''}`}
                  isOpen={isOpen}
                  onToggle={() => setExpandedId(isOpen ? null : f.id)}
                  badge={<Tag tone={lc.color === 'green' ? 'green' : lc.color === 'amber' ? 'amber' : lc.color === 'blue' ? 'blue' : 'gray'}>{isArchived ? 'آرشیو' : lc.label}</Tag>}
                  stats={<>
                    {ageDays > 0 && <span>🎂 سن: <b style={{ color: 'var(--text)' }}>{fmt.int(ageDays)} روز</b></span>}
                    {f.currentCount && <span><span style={{ fontSize: '1.05em', lineHeight: 1, display: 'inline-block', marginLeft: 4 }}>🐔</span> زنده: <b style={{ color: 'var(--text)' }}>{fmt.int(f.currentCount)}</b></span>}
                    {f.initialCount && f.currentCount && f.initialCount !== f.currentCount && (
                      <span style={{ color: 'var(--danger)' }}>💀 تلفات: <b>{fmt.int(f.initialCount - f.currentCount)}</b></span>
                    )}
                  </>}
                >
                  {/* شمارش معکوس */}
                  

                  {/* نوار پیشرفت */}
                  {!isArchived && (
                    <div style={{ height: 36, background: 'var(--input-bg)', border: '1px solid var(--border)', borderRadius: 4, overflow: 'hidden' }}>
                      <div style={{
                        height: '100%', width: `${Math.min(100, lc.progress)}%`,
                        background: lc.color === 'green' ? 'linear-gradient(90deg, var(--accent), #16a34a)' : lc.color === 'amber' ? 'linear-gradient(90deg, var(--warn), #dc2626)' : 'linear-gradient(90deg, var(--accent), #16a34a)',
                        borderRadius: 4
                      }} />
                    </div>
                  )}

                  {/* تاریخ‌ها */}
                  {(f.hatchDate || f.purchaseDate || f.startDate) && (
                    <>
                      <div style={{ fontSize: 'var(--fs-base)', color: 'var(--text)', fontWeight: 700, letterSpacing: '.3px' }}><span style={{ fontSize: '1.05em', lineHeight: 1, display: 'inline-block', marginLeft: 4 }}>📅</span> تاریخ‌ها</div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                        {f.hatchDate && <Row l="هچ" v={toFa(f.hatchDate)} />}
                        {f.purchaseDate && <Row l="خرید" v={toFa(f.purchaseDate)} />}
                        {f.startDate && <Row l="شروع نگهداری" v={toFa(f.startDate)} />}
                      </div>
                    </>
                  )}

                  {/* مشخصات */}
                  <div style={{ fontSize: 'var(--fs-base)', color: 'var(--text)', fontWeight: 700, letterSpacing: '.3px' }}><span style={{ fontSize: '1.05em', lineHeight: 1, display: 'inline-block', marginLeft: 4 }}>📊</span> مشخصات</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    {ageDays > 0 && <Row l="سن (روز)" v={`${fmt.int(ageDays)} روز`} />}
                    {f.initialCount && <Row l="تعداد اولیه" v={toFa(f.initialCount)} />}
                    {f.currentCount && <Row l="تعداد فعلی" v={fmt.int(f.currentCount)} />}
                    {f.initialCount && f.currentCount && f.initialCount !== f.currentCount && (
                      <Row l="تلفات" v={`${fmt.int(f.initialCount - f.currentCount)} (${toFa(((f.initialCount - f.currentCount) / f.initialCount * 100).toFixed(1))}٪)`} />
                    )}
                    {f.type === 'breeder' && f.maleCount && f.femaleCount && (
                      <Row l="نسبت خروس/مرغ" v={sexRatio(f.maleCount, f.femaleCount)} />
                    )}
                    <Row l="منبع" v={SOURCE_LABEL[f.source] || '—'} />
                    {zone && <Row l="بخش" v={zone.name} />}
                  </div>

                  {/* هزینه‌ها */}
                  {costs.total > 0 && (
                    <>
                      <div style={{ fontSize: 'var(--fs-base)', color: 'var(--text)', fontWeight: 700, letterSpacing: '.3px' }}><span style={{ fontSize: '1.05em', lineHeight: 1, display: 'inline-block', marginLeft: 4 }}>💰</span> هزینه‌ها</div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                        {costs.birdCost > 0 && <Row l="قیمت پرنده‌ها" v={fmt.money(costs.birdCost)} />}
                        {costs.delivery > 0 && <Row l="هزینه حمل" v={fmt.money(costs.delivery)} />}
                        {costs.other > 0 && <Row l="سایر" v={fmt.money(costs.other)} />}
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--fs-sm)', padding: 'var(--pad-normal)', background: 'var(--accent-soft)', color: 'var(--accent)', borderRadius: 'var(--r-sm)', fontWeight: 700 }}>
                          <span>جمع کل:</span>
                          <span>{fmt.money(costs.total)}</span>
                        </div>
                        {costs.perBird > 0 && (
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--fs-sm)', padding: 'var(--pad-normal)', background: 'var(--accent-soft)', color: 'var(--accent)', borderRadius: 'var(--r-sm)', fontWeight: 700 }}>
                            <span><span style={{ fontSize: '1.05em', lineHeight: 1, display: 'inline-block', marginLeft: 4 }}>💰</span> هر پرنده:</span>
                            <span>{fmt.money(Math.round(costs.perBird))}</span>
                          </div>
                        )}
                      </div>
                    </>
                  )}

                  {/* یادداشت */}
                  {f.notes && (
                    <>
                      <div style={{ fontSize: 'var(--fs-base)', color: 'var(--text)', fontWeight: 700, letterSpacing: '.3px' }}><span style={{ fontSize: '1.05em', lineHeight: 1, display: 'inline-block', marginLeft: 4 }}>📝</span> یادداشت</div>
                      <div style={{ fontSize: 'var(--fs-sm)', lineHeight: 1.7, padding: 'var(--pad-normal)', background: 'var(--input-bg)', borderRadius: 'var(--r-sm)' }}>{f.notes}</div>
                    </>
                  )}

                  {/* دکمه‌ها */}
                  <div style={{ display: 'flex', gap: 6, paddingTop: 4 }}>
                    {isArchived ? (
                      <>
                        <Btn size="sm" onClick={() => restore(f.id)} style={{ flex: 1 }}>بازگردانی</Btn>
                        <Btn size="sm" onClick={() => setDelId(f.id)} style={{ flex: 1 }}>حذف</Btn>
                      </>
                    ) : (
                      <>
                        <Btn size="sm" onClick={() => openEdit(f)} style={{ flex: 1 }}>ویرایش</Btn>
                        <Btn size="sm" onClick={() => setArchId(f.id)} style={{ flex: 1 }}>آرشیو</Btn>
                      </>
                    )}
                  </div>
                </ExpandableCard>
              );
            })}
            {tab !== 'archived' && <Btn variant="primary" full onClick={openNew}>+ افزودن گله</Btn>}
          </>
        )}

        <Modal open={open} onClose={() => setOpen(false)} title={form.id ? 'ویرایش گله' : 'افزودن گله'}
          footer={<BtnRow><Btn variant="primary" onClick={save}>ذخیره</Btn><Btn onClick={() => setOpen(false)}>لغو</Btn></BtnRow>}>

          <Field label="نام گله" required>
            <Input placeholder="مثلاً — گله بهار ۱۴۰۵" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
          </Field>

          <Grid2>
            <Field label="نوع گله" required>
              <Select value={form.type} onChange={e => setForm({ ...form, type: e.target.value as FlockType })}>
                <option value="layer">تخم‌گذار</option>
                <option value="broiler">گوشتی</option>
                <option value="breeder">مادر (تخم نطفه‌دار)</option>
              </Select>
            </Field>
            <Field label="منبع">
              <Select value={form.source} onChange={e => setForm({ ...form, source: e.target.value })}>
                {Object.entries(SOURCE_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </Select>
            </Field>
          </Grid2>

          <Grid2>
            <Field label="پرنده" required>
<SmartSelect
              value={form.birdId}
              onChange={v => setForm(f => ({ ...f, birdId: v, breedId: '' }))}
              options={birds.map(c => ({
                value: c.id,
                label: c.name,
              }))}
              placeholder="— انتخاب کنید —"
              modalTitle="انتخاب پرنده"
              autoThreshold={6}
            />
            </Field>
            <Field label="نژاد">
              <DependentSelect
                value={form.breedId}
                onChange={v => setForm(f => ({ ...f, breedId: v }))}
                parentValue={form.birdId}
                parentLabel="پرنده"
                options={breedsForBird.map(b => ({ value: b.id, label: b.name }))}
                emptyListMessage="این پرنده هنوز نژادی ندارد — از بخش «پرنده و نژاد» اضافه کنید"
                placeholder="— انتخاب نژاد —"
                modalTitle="انتخاب نژاد"
              />
            </Field>
          </Grid2>

          <Grid2>
            <Field label="سالن" required>
<SmartSelect
              value={form.hallId}
              onChange={v => setForm(f => ({ ...f, hallId: v, zoneId: '' }))}
              options={halls.map(c => ({
                value: c.id,
                label: c.name,
              }))}
              placeholder="— انتخاب کنید —"
              modalTitle="انتخاب سالن"
              autoThreshold={6}
            />
            </Field>
            <Field label="بخش">
              <Select value={form.zoneId} onChange={e => setForm({ ...form, zoneId: e.target.value })}>
                <option value="">—</option>
                {zonesForHall.map(z => <option key={z.id} value={z.id}>{z.name}</option>)}
              </Select>
            </Field>
          </Grid2>

          <Field
            label="برنامه واکسن"
            hint={
              form.vaccineScheduleId
                ? (() => {
                    const sch = getSchedule(form.vaccineScheduleId);
                    return sch ? `${sch.items.length} مرحله · ${sch.description}` : undefined;
                  })()
                : 'برای افزودن خودکار واکسن‌ها به تقویم'
            }
          >
            <Select
              value={form.vaccineScheduleId}
              onChange={e => setForm({ ...form, vaccineScheduleId: e.target.value })}
            >
              <option value="">— بدون برنامه —</option>
              {schedulesByType(form.type as 'layer' | 'broiler' | 'breeder').map(sch => (
                <option key={sch.id} value={sch.id}>{sch.label}</option>
              ))}
            </Select>
          </Field>

          <Grid2>
            <Field label="تعداد اولیه" required>
              <NumField placeholder="۸۵۰" value={form.initialCount} onChange={e => setForm({ ...form, initialCount: e.target.value })} unit="پرنده" min={0} />
            </Field>
            <Field label="تعداد فعلی">
              <NumField placeholder="۸۳۲" value={form.currentCount} onChange={e => setForm({ ...form, currentCount: e.target.value })} unit="پرنده" min={0} />
            </Field>
          </Grid2>

          {form.type === 'breeder' && (
            <DepBox title="اطلاعات گله مادر" tone="purple">
              <Grid2>
                <Field label="تعداد خروس">
                  <NumField placeholder="۸۰" value={form.maleCount} onChange={e => setForm({ ...form, maleCount: e.target.value })} min={0} unit="پرنده" />
                </Field>
                <Field label="تعداد مرغ">
                  <NumField placeholder="۸۰۰" value={form.femaleCount} onChange={e => setForm({ ...form, femaleCount: e.target.value })} min={0} unit="پرنده" />
                </Field>
              </Grid2>
              {form.maleCount && form.femaleCount && (
                <div style={{ padding: 'var(--pad-normal)', background: 'var(--purple-soft)', borderRadius: 'var(--r-md)', fontSize: 'var(--fs-sm)', color: 'var(--purple)', fontWeight: 600 }}>
                  نسبت خروس به مرغ: {sexRatio(parseInt(toEn(form.maleCount)), parseInt(toEn(form.femaleCount)))}
                </div>
              )}
            </DepBox>
          )}

          {(form.type === 'layer' || form.type === 'breeder') ? (
            <DepBox title="🥚 سن شروع تخم‌گذاری">
              <Field
                label="سن تخم‌گذاری"
                hint={(formStd?.biology?.layingStartDay ? '✨ استاندارد نژاد: ' + toFa(formStd.biology.layingStartDay) : 'پیش‌فرض ' + toFa(LAYING_START_DAY)) + ' روز — اگر نژاد شما فرق دارد، عدد خودتان را وارد کنید'}
              >
                <NumField
                  value={form.layingStartDay}
                  onChange={e => setForm({ ...form, layingStartDay: e.target.value })}
                  placeholder={fmt.int(formLaying)}
                  unit="روز"
                  max={400}
                  min={80}
                />
              </Field>
              <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--muted)', lineHeight: 1.7 }}>
                <b>راهنما:</b>
                <br />
                • مرغ تخم‌گذار صنعتی: ۱۴۰ روز (پیش‌فرض)
                <br />
                • مرغ بومی: ۱۵۰-۱۸۰ روز
                <br />
                • بوقلمون: ۱۸۰-۲۱۰ روز
                <br />
                • گله مادر (بریدر): ۱۶۰-۱۸۰ روز
              </div>
            </DepBox>
          ) : null}

          <div style={{ paddingTop: 8, fontSize: 'var(--fs-base)', fontWeight: 700, color: 'var(--text)', letterSpacing: '.3px', borderTop: '1px dashed var(--border)' }}>تاریخ‌ها</div>

          <Grid2>
            <Field label="تاریخ هچ" hint="اگر از جوجه‌کشی خودت آمده">
            <DatePicker value={form.hatchDate} onChange={v => setForm({ ...form, hatchDate: v })} placeholder="انتخاب تاریخ هچ"  autoToday />
          </Field>

          <Field label="تاریخ خرید" hint="اگر از بیرون خریده‌ای">
            <DatePicker value={form.purchaseDate} onChange={v => setForm({ ...form, purchaseDate: v })} placeholder="انتخاب تاریخ خرید"  autoToday />
          </Field>

          </Grid2>
          <Field label="تاریخ شروع نگهداری" hint="اگر هیچ‌کدام از موارد بالا نبود">
            <DatePicker value={form.startDate} onChange={v => setForm({ ...form, startDate: v })} placeholder="انتخاب تاریخ شروع"  autoToday />
          </Field>

          <div style={{ paddingTop: 8, fontSize: 'var(--fs-base)', fontWeight: 700, color: 'var(--text)', letterSpacing: '.3px', borderTop: '1px dashed var(--border)' }}>هزینه‌ها</div>

          <Grid2>
            <Field label="قیمت هر پرنده">
              <MoneyField placeholder="۰" value={form.purchasePrice} onChange={e => setForm({ ...form, purchasePrice: e.target.value })} />
            </Field>
            <Field label="هزینه حمل">
              <MoneyField placeholder="۰" value={form.deliveryCost} onChange={e => setForm({ ...form, deliveryCost: e.target.value })} />
            </Field>
          </Grid2>
          <Field label="سایر هزینه‌ها" hint="واکسن اولیه، دارو، تجهیزات همراه">
            <MoneyField placeholder="۰" value={form.otherCosts} onChange={e => setForm({ ...form, otherCosts: e.target.value })} />
          </Field>

          {liveCosts.total > 0 && (
            <div style={{
              padding: 'var(--pad-comfy)', background: 'var(--accent-soft)',
              border: '1px solid var(--accent-border)', borderRadius: 'var(--r-md)',
              display: 'flex', flexDirection: 'column', gap: 6, fontSize: 'var(--fs-sm)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--muted)' }}>
                <span>قیمت پرنده‌ها:</span>
                <span style={{ color: 'var(--text)', fontWeight: 600 }}>{toFa(liveCosts.bird.toLocaleString('fa-IR'))} ت</span>
              </div>
              {liveCosts.del > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--muted)' }}>
                  <span>هزینه حمل:</span>
                  <span style={{ color: 'var(--text)', fontWeight: 600 }}>{toFa(liveCosts.del.toLocaleString('fa-IR'))} ت</span>
                </div>
              )}
              {liveCosts.oth > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--muted)' }}>
                  <span>سایر:</span>
                  <span style={{ color: 'var(--text)', fontWeight: 600 }}>{toFa(liveCosts.oth.toLocaleString('fa-IR'))} ت</span>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--accent-border)', paddingTop: 6, marginTop: 2 }}>
                <span style={{ color: 'var(--accent)', fontWeight: 700 }}>جمع کل:</span>
                <span style={{ color: 'var(--accent)', fontWeight: 700 }}>{toFa(liveCosts.total.toLocaleString('fa-IR'))} ت</span>
              </div>
              {liveCosts.per > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--accent)', fontWeight: 700 }}><span style={{ fontSize: '1.05em', lineHeight: 1, display: 'inline-block', marginLeft: 4 }}>💰</span> هر پرنده:</span>
                  <span style={{ color: 'var(--accent)', fontWeight: 700 }}>{toFa(Math.round(liveCosts.per).toLocaleString('fa-IR'))} ت</span>
                </div>
              )}
            </div>
          )}

          <Field label="یادداشت">
            <Input placeholder="..." value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
          </Field>

          <ErrorBox>{err}</ErrorBox>
        </Modal>

        <Modal open={!!archId} onClose={() => setArchId(null)} title="آرشیو گله"
          footer={<BtnRow><Btn variant="primary" onClick={() => { if (archId) archive(archId); setArchId(null); }}>آرشیو کن</Btn><Btn onClick={() => setArchId(null)}>لغو</Btn></BtnRow>}>
          <div style={{ textAlign: 'center', fontSize: 'var(--fs-md)', lineHeight: 1.9 }}>
            آرشیو <b>{archTarget?.name}</b>؟
          </div>
        </Modal>

        <Modal open={!!delId} onClose={() => setDelId(null)} title="حذف گله"
          footer={<BtnRow><Btn variant="danger" onClick={() => { const idToDel = delId; if (!idToDel) return; const item = flocks.find(f => f.id === idToDel); if (item) { setUndoData({ flock: item }); setTimeout(() => setUndoData((cur: any) => cur && cur.flock.id === item.id ? null : cur), 6000); } remove(idToDel);
              logAction('delete', 'flk', 'حذف از گله‌ها'); setDelId(null); showToast('گله حذف شد', 'info', 1800); }}>حذف کن</Btn><Btn onClick={() => setDelId(null)}>لغو</Btn></BtnRow>}>
          <div style={{ textAlign: 'center', fontSize: 'var(--fs-md)' }}>
            حذف کامل <b>{target?.name}</b>؟
            <br />
            <span style={{ color: 'var(--danger)', fontSize: 'var(--fs-base)' }}>این عمل قابل بازگشت نیست.</span>
          </div>
        </Modal>
      </PageContainer>
    </div>
  );
}
