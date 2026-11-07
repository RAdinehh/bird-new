/**
 * FlockHistoryModal.tsx — تاریخچه رویدادهای گله
 * ۳ تب با سلسله‌مراتب منطقی + موجودی تفکیک‌شده
 */
import { useEffect, useState, useMemo, type ReactNode } from 'react';
import { Modal, Btn, BtnRow, Select } from '../../../shr/components/ui';
import type { Flock, FlockEvent, FlockEventType, FlockEventReasonCode, FlockSexBalanceEvent } from '../store';
import { SEX_AUDIT_META, formatSexDelta, aggregateDeathsBySex, toneFromRate, eventsToCSV, auditToCSV, calculateFCR, weightBySexFromLogs, consumptionToCSV } from '../helpers-audit';
import { useFlk } from '../store';
import { todayJ } from '../api/flocksCalc';
import { showConfirmAsync } from '../../../cor/store/dialog';
import { toastMsg } from '../../../cor/store/toast';
import { downloadCSV } from '../../../shr/utils/export';
import { toFa, toEn } from '../../../shr/utils/fa';
import type { DailyLog as DlgLog } from '../../dlg/store';
import { aggregateConsumptionEvents } from '../consumptionEventsCalc';
import { useBrd } from '../../brd/store';
import { getStandardFor } from '../../set/standards/resolve';

const REASON_OPTIONS: { value: FlockEventReasonCode; label: string }[] = [
  { value: 'data_entry_error', label: 'خطای ثبت' },
  { value: 'found_stock', label: 'موجودی پیدا شده' },
  { value: 'unknown', label: 'نامشخص' },
];

const TYPE_INFO: Record<FlockEventType, { icon: string; label: string; tone: string }> = {
  add:        { icon: '➕', label: 'افزودن',  tone: 'var(--accent)' },
  sell:       { icon: '💰', label: 'فروش',    tone: 'var(--purple)' },
  death:      { icon: '💀', label: 'تلفات',   tone: 'var(--danger)' },
  transfer:   { icon: '🔄', label: 'انتقال',  tone: 'var(--info)' },
  correction: { icon: '',   label: 'اصلاح',   tone: 'var(--warn)' },
  cull:       { icon: '🗑',  label: 'حذف',    tone: 'var(--warn)' },
};

const FILTER_TYPES: FlockEventType[] = ['death', 'sell', 'correction'];
const VISIBLE_LIMIT = 10;

type Filter = 'all' | FlockEventType;

interface Props {
  open: boolean;
  onClose: () => void;
  flock: Flock;
}

export default function FlockHistoryModal({ open, onClose, flock }: Props) {
  const [filter, setFilter] = useState<Filter>('all');
  const [tabMode, setTabMode] = useState<'events' | 'audit' | 'consumption'>('events');
  const [showAllEvents, setShowAllEvents] = useState(false);
  const [showAllAudit, setShowAllAudit] = useState(false);
  const [showAllConsumption, setShowAllConsumption] = useState(false);
  const [dlgDeaths, setDlgDeaths] = useState(0);
  const [weightBySex, setWeightBySex] = useState({
    male: { avg: 0, count: 0, cv: 0, hasData: false },
    female: { avg: 0, count: 0, cv: 0, hasData: false },
    mixed: { avg: 0, count: 0, cv: 0, hasData: false },
    delta: null as number | null,
    hasData: false,
  });
  const [correctionOpen, setCorrectionOpen] = useState(false);
  const [delta, setDelta] = useState('');
  const [reasonCode, setReasonCode] = useState<FlockEventReasonCode>('data_entry_error');
  const [notes, setNotes] = useState('');
  const [validationError, setValidationError] = useState('');

  const addCorrection = useFlk(st => st.addCorrection);
  const revokeEvent = useFlk(st => st.revokeEvent);
  const consumptionEvents = useFlk(st => st.consumptionEvents);
  const brd = useBrd();

  useEffect(() => {
    let cancelled = false;
    import('../../dlg/store').then((mod) => {
      if (cancelled) return;
      const logs: DlgLog[] = mod.useDlg.getState().logs || [];
      const total = logs
        .filter((l: DlgLog) => l.flockId === flock.id)
        .reduce((sum: number, l: DlgLog) => sum + (l.deathsCount || 0), 0);
      setDlgDeaths(total);
      setWeightBySex(weightBySexFromLogs(logs, flock.id));
    }).catch(() => {});
    return () => { cancelled = true; };
  }, [flock.id, flock.events]);

  const initial = flock.initialCount || 0;
  const current = flock.currentCount || 0;
  const num = parseInt(toEn(delta).replace(/[^0-9-]/g, ''), 10) || 0;
  const newCount = current + num;

  // 🆕 breakdown رویدادها برای موجودی
  const eventBreakdown = useMemo(() => {
    const b = { death: 0, sell: 0, cull: 0, add: 0, correctionNet: 0 };
    for (const e of (flock.events || [])) {
      if (e.revoked) continue;
      switch (e.type) {
        case 'death': b.death += e.count; break;
        case 'sell': b.sell += e.count; break;
        case 'cull': b.cull += e.count; break;
        case 'add': b.add += e.count; break;
        case 'transfer': b.add += e.count; break;
        case 'correction': b.correctionNet += (e.direction === -1 ? -1 : 1) * e.count; break;
      }
    }
    return b;
  }, [flock.events]);

  const hasBreakdown =
    eventBreakdown.death > 0 ||
    eventBreakdown.sell > 0 ||
    eventBreakdown.cull > 0 ||
    eventBreakdown.add > 0 ||
    eventBreakdown.correctionNet !== 0;

  // 🆕 نسبت جنسیتی
  const sexRatios = useMemo(() => {
    const m = flock.maleCount ?? 0;
    const f = flock.femaleCount ?? 0;
    const total = m + f;
    if (total === 0) return null;
    const mp = Math.round((m / total) * 100);
    return { malePct: mp, femalePct: 100 - mp };
  }, [flock.maleCount, flock.femaleCount]);

  const handleSaveCorrection = async () => {
    setValidationError('');
    if (num === 0) { setValidationError('عدد را وارد کنید'); return; }
    if (newCount < 0) { setValidationError('موجودی کافی نیست — موجودی فعلی ' + toFa(current) + ' پرنده'); return; }
    if (num > 0 && newCount > initial) {
      const ok = await showConfirmAsync('بیشتر از تعداد اولیه', 'تعداد جدید (' + toFa(newCount) + ') از تعداد اولیه (' + toFa(initial) + ') بیشتر می‌شود. ادامه؟');
      if (!ok) return;
    }
    if (num < 0 && initial > 0 && newCount < initial * 0.1) {
      const pct = Math.round((newCount / initial) * 100);
      const ok = await showConfirmAsync('هشدار موجودی کم', 'موجودی زیر ۱۰٪ می‌رود (' + toFa(pct) + '٪). ادامه؟');
      if (!ok) return;
    }
    const label = REASON_OPTIONS.find(r => r.value === reasonCode)?.label || reasonCode;
    addCorrection(flock.id, num, reasonCode, label, notes.trim());
    setCorrectionOpen(false);
    setDelta('');
    setNotes('');
  };

  const handleRevoke = async (e: FlockEvent) => {
    const info = TYPE_INFO[e.type] || { label: e.type, icon: '•' };
    const ok = await showConfirmAsync('لغو رویداد', '«' + info.label + ' ' + toFa(e.count) + ' پرنده» لغو شود؟ یک رویداد اصلاح معکوس ثبت می‌شود.');
    if (!ok) return;
    revokeEvent(flock.id, e.id);
  };

  const losses = Math.max(0, initial - current);
  const lossesPct = initial > 0 ? (losses / initial) * 100 : 0;
  const totalCount = flock.events?.length || 0;
  const auditCount = flock.sexBalanceEvents?.length || 0;
  const flockConsumption = (consumptionEvents || []).filter(e => e.flockId === flock.id);
  const consumptionCount = flockConsumption.length;
  const thirtyDaysAgo = (() => {
    try {
      const parts = todayJ().split('/').map(Number);
      let [y, m, d] = parts;
      d -= 30;
      while (d < 1) { m -= 1; if (m < 1) { m = 12; y -= 1; } d += 30; }
      return `${y}/${String(m).padStart(2, '0')}/${String(d).padStart(2, '0')}`;
    } catch { return '1400/01/01'; }
  })();
  const consumptionSummary = aggregateConsumptionEvents(flockConsumption, thirtyDaysAgo, todayJ());
  const breedObj = (brd.breeds || []).find((b: any) => b.id === flock.breedId);
  const stdFCR = (() => {
    try {
      const std = getStandardFor(breedObj?.name || '', {}) as any;
      return std?.targetFCR ?? std?.fcr ?? null;
    } catch { return null; }
  })();
  const fcrResult = calculateFCR(consumptionSummary, weightBySex, flock, stdFCR);
  const deathRate = aggregateDeathsBySex(flock.sexBalanceEvents, flock.initialMaleCount, flock.initialFemaleCount);

  const sexAggregates = (() => {
    const isSexed = !!flock.genderSplitAt;
    const initM = isSexed ? (flock.initialMaleCount ?? 0) : 0;
    const initF = isSexed ? (flock.initialFemaleCount ?? 0) : 0;
    const initU = isSexed
      ? Math.max(0, (flock.initialCount ?? 0) - initM - initF)
      : (flock.initialCount ?? 0);

    let sellsM = 0, sellsF = 0, sellsU = 0;
    for (const ev of flock.sexBalanceEvents || []) {
      if (ev.type === 'sale') {
        sellsM += Math.abs(Math.min(0, ev.delta.male));
        sellsF += Math.abs(Math.min(0, ev.delta.female));
        sellsU += Math.abs(Math.min(0, ev.delta.unknown));
      }
    }

    const curM = flock.maleCount ?? 0;
    const curF = flock.femaleCount ?? 0;
    const curU = flock.unknownCount ?? 0;

    return {
      init: { male: initM, female: initF, unknown: initU },
      deaths: { male: deathRate.male.deaths, female: deathRate.female.deaths, unknown: deathRate.unknown.deaths },
      sells: { male: sellsM, female: sellsF, unknown: sellsU },
      others: {
        male: curM - initM + deathRate.male.deaths + sellsM,
        female: curF - initF + deathRate.female.deaths + sellsF,
        unknown: curU - initU + deathRate.unknown.deaths + sellsU,
      },
      current: { male: curM, female: curF, unknown: curU },
    };
  })();



  const typeCounts = useMemo(() => {
    const m = new Map<FlockEventType, number>();
    (flock.events || []).forEach(e => m.set(e.type, (m.get(e.type) || 0) + 1));
    return m;
  }, [flock.events]);


  const groups = useMemo(() => {
    const today = todayJ();
    const all = (flock.events || []).slice().sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
    const filtered = filter === 'all' ? all : all.filter(e => e.type === filter);
    const map = new Map<string, FlockEvent[]>();
    for (const e of filtered) {
      const key = e.date || '';
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(e);
    }
    const sortedKeys = Array.from(map.keys()).sort((a, b) => b.localeCompare(a));
    return sortedKeys.map(k => ({ label: k === today ? 'امروز' : (k || 'نامشخص'), events: map.get(k)! }));
  }, [flock.events, filter]);

  const auditGroups = useMemo(() => {
    const today = todayJ();
    const all = (flock.sexBalanceEvents || []).slice().sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
    const map = new Map<string, FlockSexBalanceEvent[]>();
    for (const e of all) {
      const key = e.date || '';
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(e);
    }
    const sortedKeys = Array.from(map.keys()).sort((a, b) => b.localeCompare(a));
    return sortedKeys.map(k => ({ label: k === today ? 'امروز' : (k || 'نامشخص'), events: map.get(k)! }));
  }, [flock.sexBalanceEvents]);

  const visibleData = useMemo(() => {
    const egVisible = (() => {
      if (showAllEvents) return { items: groups, hidden: 0 };
      let total = 0;
      const out: typeof groups = [];
      for (const g of groups) {
        if (total >= VISIBLE_LIMIT) break;
        out.push(g);
        total += g.events.length;
      }
      const visTotal = out.reduce((s, g) => s + g.events.length, 0);
      const allTotal = groups.reduce((s, g) => s + g.events.length, 0);
      return { items: out, hidden: allTotal - visTotal };
    })();
    const auditVisible = showAllAudit ? auditGroups : (() => {
      let total = 0;
      const out: typeof auditGroups = [];
      for (const g of auditGroups) {
        if (total >= VISIBLE_LIMIT) break;
        out.push(g);
        total += g.events.length;
      }
      return out;
    })();
    const auditVisibleCount = auditVisible.reduce((s, g) => s + g.events.length, 0);
    const auditAllCount = auditGroups.reduce((s, g) => s + g.events.length, 0);
    const auditHidden = auditAllCount - auditVisibleCount;
    const allCons = flockConsumption.slice().sort((a, b) => (b.date || '').localeCompare(a.date || ''));
    const consVisible = showAllConsumption ? allCons : allCons.slice(0, VISIBLE_LIMIT);
    const consHidden = allCons.length - consVisible.length;
    return {
      events: egVisible,
      audit: { items: auditVisible, hidden: auditHidden },
      consumption: { items: consVisible, hidden: consHidden },
    };
  }, [groups, showAllEvents, showAllAudit, showAllConsumption, auditGroups, flockConsumption]);

  const handleExport = () => {
    try {
      const safeName = (flock.name || 'flock').replace(/[^\w\u0600-\u06FF-]+/g, '_');
      if (tabMode === 'audit') {
        const csv = auditToCSV(flock.sexBalanceEvents);
        downloadCSV(`flock-${safeName}-audit.csv`, '\uFEFF' + csv);
      } else if (tabMode === 'consumption') {
        const csv = consumptionToCSV(flockConsumption);
        downloadCSV(`flock-${safeName}-consumption.csv`, '\uFEFF' + csv);
      } else {
        const csv = eventsToCSV(flock.events);
        downloadCSV(`flock-${safeName}-events.csv`, '\uFEFF' + csv);
      }
      toastMsg.success('CSV دانلود شد');
    } catch {
      toastMsg.error('دانلود ناموفق');
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={'📜 رویدادها • ' + flock.name}
      footer={
        <BtnRow>
          <Btn onClick={handleExport}>📥 CSV</Btn>
          <Btn onClick={onClose}>بستن</Btn>
        </BtnRow>
      }
    >

      {/* ═══ موجودی با breakdown ═══ */}
      <div style={{
        padding: '8px 10px',
        background: 'var(--input-bg)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--r-sm)',
        marginBottom: 2,
        display: 'flex',
        flexDirection: 'column',
        gap: 6,
        fontSize: 12,
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
          <span>
            🐔 <b>{toFa(current)}</b> زنده
            <span style={{ color: 'var(--muted)', margin: '0 6px' }}>·</span>
            <span style={{ color: 'var(--muted)' }}>اولیه {toFa(initial)}</span>
          </span>
          {losses > 0 && (
            <span style={{ color: lossesPct > 5 ? 'var(--danger)' : 'var(--warn)', fontWeight: 700 }}>
              {toFa(losses)} کاهش ({toFa(lossesPct.toFixed(1))}٪)
            </span>
          )}
          {flock.dealType && flock.dealType !== 'own' && (
            <span style={{ fontSize: 10, color: 'var(--purple)', fontWeight: 600 }}>
              {flock.dealType === 'partnership' && '🤝 شراکتی'}
              {flock.dealType === 'consignment' && '📦 امانی'}
              {flock.dealType === 'rent' && '📋 اجاره'}
            </span>
          )}
        </div>
      </div>

      {/* ═══ تب‌ها (Segmented Control) ═══ */}
      <div style={{
        display: 'flex',
        gap: 0,
        marginBottom: 8,
        background: 'var(--input-bg)',
        borderRadius: 'var(--r-md)',
        padding: 3,
        border: '1px solid var(--border)',
      }}>
        <TabButton active={tabMode === 'events'} onClick={() => setTabMode('events')}>
          📋 رویدادها ({toFa(totalCount)})
        </TabButton>
        {auditCount > 0 && (
          <TabButton active={tabMode === 'audit'} onClick={() => setTabMode('audit')}>
            ⚥ تعادل جنسیتی ({toFa(auditCount)})
          </TabButton>
        )}
        {consumptionCount > 0 && (
          <TabButton active={tabMode === 'consumption'} onClick={() => setTabMode('consumption')}>
            🍽️ مصرف ({toFa(consumptionCount)})
          </TabButton>
        )}
      </div>

      {/* ═══ فیلتر (فقط تب رویدادها) ═══ */}
      {tabMode === 'events' && (
        <div style={{ display: 'flex', gap: 6, marginBottom: 10, flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
          {totalCount > 0 ? (
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
              <span style={{ fontSize: 12, color: 'var(--muted)', fontWeight: 600, marginLeft: 4 }}>فیلتر:</span>
              <Chip active={filter === 'all'} onClick={() => setFilter('all')}>همه</Chip>
              {FILTER_TYPES.map(t => {
                const n = typeCounts.get(t) || 0;
                if (n === 0) return null;
                return (
                  <Chip key={t} active={filter === t} onClick={() => setFilter(filter === t ? 'all' : t)}>
                    {TYPE_INFO[t].icon} {TYPE_INFO[t].label} ({toFa(n)})
                  </Chip>
                );
              })}
            </div>
          ) : (
            <div />
          )}
          {!correctionOpen && (
            <Btn
              size="sm"
              variant="outline"
              onClick={() => setCorrectionOpen(true)}
              style={{ borderColor: 'var(--accent)', color: 'var(--accent)', borderWidth: 1.5, fontWeight: 700 }}
            >+ ثبت اصلاح</Btn>
          )}
        </div>
      )}

      {/* ═══ فرم اصلاح — فقط در تب رویدادها ═══ */}
      {tabMode === 'events' && correctionOpen && (
        <div style={{ marginBottom: 12, marginTop: 4, background: 'var(--warn-soft)', border: '1px solid var(--warn)', borderRadius: 'var(--r-md)', padding: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px dashed var(--warn)', paddingBottom: 8 }}>
            <span style={{ fontWeight: 700, color: 'var(--warn)', fontSize: 'var(--fs-base)' }}>ثبت اصلاح موجودی</span>
            <button type="button" onClick={() => { setCorrectionOpen(false); setDelta(''); setNotes(''); setValidationError(''); }} style={{ background: 'none', border: 'none', color: 'var(--muted)', fontSize: 18, cursor: 'pointer', padding: 0, fontFamily: 'inherit' }}>✕</button>
          </div>

          {/* ردیف اول: مقدار + موجودی بعد از ثبت (دو ستونه) */}
          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: 8 }}>
            {/* فیلد ۱ — مقدار تغییر */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 0 }}>
              <span style={{ fontSize: 'var(--fs-xs)', color: 'var(--warn)', fontWeight: 700 }}>مقدار تغییر</span>
              <div style={{ display: 'flex', alignItems: 'center', background: 'var(--card)', border: '1px solid ' + (validationError ? 'var(--danger)' : 'var(--warn)'), borderRadius: 'var(--r-md)', height: 40, overflow: 'hidden', minWidth: 0 }}>
                <button type="button" onClick={() => { const n = parseInt(toEn(delta), 10) || 0; setDelta(toFa(String(n + 1))); }} style={{ width: 32, height: '100%', border: 'none', background: 'transparent', fontSize: 18, fontWeight: num > 0 ? 700 : 400, color: num > 0 ? 'var(--accent)' : 'var(--muted)', cursor: 'pointer', fontFamily: 'inherit', borderLeft: '1px solid var(--border)', flexShrink: 0, padding: 0 }}>+</button>
                <input type="text" value={delta} onChange={e => {
                  const raw = toEn(e.target.value);
                  const isNegative = raw.startsWith('-') || raw.startsWith('−');
                  const digits = raw.replace(/[^0-9]/g, '');
                  if (digits) { setDelta(toFa(isNegative ? '-' + digits : digits)); } else { setDelta(isNegative ? '−' : ''); }
                  setValidationError('');
                }} inputMode="text" style={{ flex: 1, minWidth: 0, width: '100%', background: 'none', border: 'none', outline: 'none', fontFamily: 'monospace', fontSize: 'var(--fs-base)', fontWeight: 700, color: num > 0 ? 'var(--accent)' : num < 0 ? 'var(--danger)' : 'var(--text)', textAlign: 'center', padding: '0 4px', direction: 'ltr' }} />
                <button type="button" onClick={() => { const n = parseInt(toEn(delta), 10) || 0; setDelta(toFa(String(n - 1))); }} style={{ width: 32, height: '100%', border: 'none', background: 'transparent', fontSize: 18, fontWeight: num < 0 ? 700 : 400, color: num < 0 ? 'var(--danger)' : 'var(--muted)', cursor: 'pointer', fontFamily: 'inherit', borderRight: '1px solid var(--border)', flexShrink: 0, padding: 0 }}>−</button>
              </div>
            </div>

            {/* فیلد ۲ — موجودی بعد از ثبت */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 0 }}>
              <span style={{ fontSize: 'var(--fs-xs)', color: 'var(--warn)', fontWeight: 700 }}>موجودی بعد از ثبت</span>
              <div style={{ background: 'var(--card)', border: '1px solid ' + (num !== 0 ? (newCount < 0 ? 'var(--danger)' : (newCount < initial * 0.1 ? 'var(--warn)' : 'var(--accent)')) : 'var(--warn)'), borderRadius: 'var(--r-md)', height: 40, padding: '0 4px', display: 'flex', justifyContent: 'center', alignItems: 'center', overflow: 'hidden', minWidth: 0 }}>
                <div dir="rtl" style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 13 }}>
                  <span style={{ fontSize: 10, color: 'var(--muted)' }}>فعلی</span>
                  <span style={{ fontFamily: 'monospace', fontWeight: 700, color: 'var(--text)' }}>{toFa(current)}</span>
                  <span style={{ color: 'var(--dim)', fontSize: 12 }}>←</span>
                  <span style={{ fontSize: 10, color: 'var(--muted)' }}>بعدی</span>
                  {num === 0 ? <span style={{ fontFamily: 'monospace', fontSize: 15, fontWeight: 400, color: 'var(--dim)' }}>؟</span> : newCount < 0 ? <span style={{ fontFamily: 'monospace', fontSize: 14, fontWeight: 700, color: 'var(--danger)' }}>منفی</span> : num > 0 ? <span style={{ fontFamily: 'monospace', fontSize: 15, fontWeight: 700, color: 'var(--accent)' }}>{toFa(newCount)}</span> : <span style={{ fontFamily: 'monospace', fontSize: 15, fontWeight: 700, color: 'var(--danger)' }}>{toFa(newCount)}</span>}
                </div>
              </div>
            </div>
          </div>

          {/* فیلد ۲ — دلیل + توضیح */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <span style={{ fontSize: 'var(--fs-xs)', color: 'var(--warn)', fontWeight: 700 }}>دلیل</span>
              <Select
                value={reasonCode}
                onChange={e => setReasonCode(e.target.value as FlockEventReasonCode)}
                style={{
                  background: '#ffffff',
                  border: '1px solid var(--warn)',
                  borderRadius: 'var(--r-md)',
                  height: 40,
                  padding: '0 var(--sp-3)',
                  fontFamily: 'inherit',
                  fontSize: 'var(--fs-sm)',
                  color: 'var(--text)',
                  width: '100%',
                }}
              >
                {REASON_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </Select>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <span style={{ fontSize: 'var(--fs-xs)', color: 'var(--warn)', fontWeight: 700 }}>توضیح (اختیاری)</span>
              <input type="text" value={notes} onChange={e => setNotes(e.target.value)} placeholder="مثلاً شمارش اشتباه" style={{ background: '#ffffff', border: '1px solid var(--warn)', borderRadius: 'var(--r-md)', height: 40, padding: '0 var(--sp-3)', fontFamily: 'inherit', fontSize: 'var(--fs-sm)', color: 'var(--text)', outline: 'none', width: '100%' }} />
            </div>
          </div>

          {validationError && (
            <div style={{ padding: 'var(--sp-2) var(--sp-3)', background: 'var(--danger-soft)', border: '1px solid rgba(239,68,68,.3)', borderRadius: 'var(--r-md)', color: 'var(--danger)', fontSize: 'var(--fs-xs)', fontWeight: 600 }}>{validationError}</div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <button type="button" onClick={handleSaveCorrection} disabled={num === 0 || newCount < 0} style={{
              height: 40,
              background: (num === 0 || newCount < 0) ? 'var(--input-bg)' : 'var(--accent)',
              color: (num === 0 || newCount < 0) ? 'var(--muted)' : 'white',
              border: '1px solid ' + ((num === 0 || newCount < 0) ? 'var(--border)' : 'var(--accent)'),
              borderRadius: 'var(--r-md)',
              fontFamily: 'inherit',
              fontSize: 'var(--fs-sm)',
              fontWeight: 700,
              cursor: (num === 0 || newCount < 0) ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s'
            }}>{(num === 0) ? 'مقدار را وارد کنید' : (newCount < 0 ? 'موجودی کافی نیست' : '✓ ثبت اصلاح')}</button>
            <button type="button" onClick={() => { setCorrectionOpen(false); setDelta(''); setNotes(''); setValidationError(''); }} style={{ height: 40, background: 'var(--card)', color: 'var(--muted)', border: '1px solid var(--border)', borderRadius: 'var(--r-md)', fontFamily: 'inherit', fontSize: 'var(--fs-sm)', fontWeight: 600, cursor: 'pointer' }}>لغو</button>
          </div>
        </div>
      )}

      {/* ═══ محتوا ═══ */}
      {tabMode === 'consumption' ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {consumptionSummary.hasData && (
            <div>
              <div style={{ fontSize: 'var(--fs-sm)', fontWeight: 700, color: 'var(--muted)', paddingBottom: 6, marginBottom: 6, borderBottom: '1px dashed var(--border)' }}>📊 خلاصه ۳۰ روز اخیر</div>
              <div style={{ padding: '8px 10px', background: 'var(--accent-soft)', border: '1px solid var(--accent-border)', borderRadius: 'var(--r-md)', fontSize: 11 }}>
                <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                  <span>🍽️ دان: <b>{toFa(consumptionSummary.totalFeedKg)} kg</b></span>
                  <span>💧 آب: <b>{toFa(consumptionSummary.totalWaterL)} L</b></span>
                  <span style={{ color: 'var(--muted)', fontSize: 10 }}>({toFa(consumptionSummary.eventCount)} رویداد)</span>
                </div>
                {(consumptionSummary.bySex.male > 0 || consumptionSummary.bySex.female > 0) && (
                  <div style={{ marginTop: 4, fontSize: 10, color: 'var(--muted)' }}>
                    ♂ نر: {toFa(consumptionSummary.bySex.male)} kg · ♀ ماده: {toFa(consumptionSummary.bySex.female)} kg
                  </div>
                )}
              </div>
            </div>
          )}
          {fcrResult.fcr !== null && (
            <div>
              <div style={{ fontSize: 'var(--fs-sm)', fontWeight: 700, color: 'var(--muted)', paddingBottom: 6, marginBottom: 6, borderBottom: '1px dashed var(--border)' }}>📈 FCR</div>
              <div style={{ padding: '8px 10px', background: fcrResult.confidence === 'exact' ? 'var(--accent-soft)' : 'var(--warn-soft)', border: `1px solid ${fcrResult.confidence === 'exact' ? 'var(--accent-border)' : 'var(--warn)'}`, borderRadius: 'var(--r-md)', fontSize: 11 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                  <span style={{ fontSize: 14, fontWeight: 700, color: fcrResult.confidence === 'exact' ? 'var(--accent)' : 'var(--warn)' }}>
                    {toFa(fcrResult.fcr.toFixed(2))}
                  </span>
                  <span style={{ fontSize: 9, padding: '1px 5px', borderRadius: 3, background: fcrResult.confidence === 'exact' ? 'var(--accent)' : 'var(--warn)', color: 'white', fontWeight: 700 }}>
                    {fcrResult.confidence === 'exact' ? 'دقیق' : fcrResult.confidence === 'standard' ? 'استاندارد' : 'ناقص'}
                  </span>
                </div>
                <div style={{ fontSize: 10, color: 'var(--muted)', lineHeight: 1.6 }}>
                  {fcrResult.note}<br />
                  دان/پرنده: {toFa(fcrResult.feedPerBird)} kg
                </div>
              </div>
            </div>
          )}
          {consumptionCount === 0 ? (
            <div style={{ padding: 'var(--sp-8)', textAlign: 'center', color: 'var(--muted)', fontSize: 13 }}>
              <div style={{ fontSize: 40, marginBottom: 8 }}>🍽️</div>
              <div>هنوز مصرف ثبت نشده</div>
            </div>
          ) : (
            <>
              <div style={{ fontSize: 'var(--fs-sm)', fontWeight: 700, color: 'var(--muted)', paddingBottom: 6, marginBottom: 6, borderBottom: '1px dashed var(--border)' }}>📋 رویدادهای مصرف</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {visibleData.consumption.items.map(ev => (
                  <div key={ev.id} style={{ display: 'flex', gap: 8, padding: '8px 10px', background: 'var(--input-bg)', borderRadius: 'var(--r-sm)', border: '1px solid var(--border)', fontSize: 'var(--fs-sm)' }}>
                    <span style={{ fontSize: 18, flexShrink: 0 }}>{ev.type === 'feed' ? '🍽️' : '💧'}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 6 }}>
                        <b dir="ltr">
                          {toFa(ev.amount)} {ev.unit}
                          {ev.sex === 'male' && <span style={{ color: 'var(--info)', marginRight: 4 }}>♂</span>}
                          {ev.sex === 'female' && <span style={{ color: 'var(--purple)', marginRight: 4 }}>♀</span>}
                        </b>
                        <span style={{ color: 'var(--muted)', fontSize: 10 }}>{toFa(ev.date)}</span>
                      </div>
                      <div style={{ color: 'var(--muted)', fontSize: 10, marginTop: 2 }}>
                        {ev.source === 'bulk_manual' ? 'پر کردن سطل' : ev.source === 'daily_manual' ? 'روزانه' : ev.source === 'sensor_scale' ? 'سنسور وزن' : ev.source === 'sensor_level' ? 'سنسور سطح' : ev.source === 'auto_feeder' ? 'اتومات' : 'استاندارد'}
                        {ev.notes && ` — ${ev.notes}`}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              {visibleData.consumption.hidden > 0 && (
                <ShowMoreButton count={visibleData.consumption.hidden} onClick={() => setShowAllConsumption(true)} />
              )}
            </>
          )}
        </div>
      ) : tabMode === 'audit' ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {deathRate.hasData && (
        <div>
          {/* Header — خارج از کادر، راست/چپ */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', padding: '0 4px', marginBottom: 6 }}>
            <b style={{ fontSize: 'var(--fs-base)', color: 'var(--accent)' }}>وضعیت جنسیتی</b>
            <span style={{ fontSize: 'var(--fs-xs)', color: 'var(--muted)' }}>از زمان تفکیک</span>
          </div>

          {/* کادر سبز — فقط table */}
          <div style={{
            background: 'var(--accent-soft)',
            border: '1px solid var(--accent-border)',
            borderRadius: 'var(--r-md)',
            padding: 10,
            marginBottom: 8,
          }}>
          {/* Table */}
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {/* Header row */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '60px 1fr 1fr 1fr 1fr 1fr',
              padding: '4px 0',
              borderBottom: '1px solid var(--accent-border)',
              fontSize: 'var(--fs-xs)',
              fontWeight: 700,
              color: 'var(--muted)',
            }}>
              <span>جنسیت</span>
              <span style={{ textAlign: 'center' }}>اولیه</span>
              <span style={{ textAlign: 'center' }}>تلفات</span>
              <span style={{ textAlign: 'center' }}>فروش</span>
              <span style={{ textAlign: 'center', cursor: 'help' }} title="اصلاحات دستی، ادغام/انتقال یا خروج بدون سند">سایر</span>
              <span style={{ textAlign: 'center' }}>فعلی</span>
            </div>

            {/* نر — بدون ایموجی */}
            <div style={{ display: 'grid', gridTemplateColumns: '60px 1fr 1fr 1fr 1fr 1fr', padding: '6px 0', borderBottom: '1px dashed var(--accent-border)', fontSize: 'var(--fs-sm)' }}>
              <span style={{ color: 'var(--info)', fontWeight: 700 }}>نر</span>
              <span style={{ textAlign: 'center', fontFamily: 'monospace' }}>{toFa(sexAggregates.init.male)}</span>
              <span style={{ textAlign: 'center', fontFamily: 'monospace', color: sexAggregates.deaths.male > 0 ? 'var(--danger)' : 'var(--muted)' }}>{sexAggregates.deaths.male > 0 ? `-${toFa(sexAggregates.deaths.male)}` : '۰'}</span>
              <span style={{ textAlign: 'center', fontFamily: 'monospace', color: sexAggregates.sells.male > 0 ? 'var(--purple)' : 'var(--muted)' }}>{sexAggregates.sells.male > 0 ? `-${toFa(sexAggregates.sells.male)}` : '۰'}</span>
              <span style={{ textAlign: 'center', fontFamily: 'monospace', color: sexAggregates.others.male !== 0 ? 'var(--warn)' : 'var(--muted)' }}>{sexAggregates.others.male > 0 ? '+' : ''}{sexAggregates.others.male !== 0 ? toFa(sexAggregates.others.male) : '۰'}</span>
              <span style={{ textAlign: 'center', fontFamily: 'monospace', fontWeight: 700, color: 'var(--text)' }}>{toFa(sexAggregates.current.male)}</span>
            </div>

            {/* ماده — بدون ایموجی */}
            <div style={{ display: 'grid', gridTemplateColumns: '60px 1fr 1fr 1fr 1fr 1fr', padding: '6px 0', borderBottom: '1px dashed var(--accent-border)', fontSize: 'var(--fs-sm)' }}>
              <span style={{ color: 'var(--purple)', fontWeight: 700 }}>ماده</span>
              <span style={{ textAlign: 'center', fontFamily: 'monospace' }}>{toFa(sexAggregates.init.female)}</span>
              <span style={{ textAlign: 'center', fontFamily: 'monospace', color: sexAggregates.deaths.female > 0 ? 'var(--danger)' : 'var(--muted)' }}>{sexAggregates.deaths.female > 0 ? `-${toFa(sexAggregates.deaths.female)}` : '۰'}</span>
              <span style={{ textAlign: 'center', fontFamily: 'monospace', color: sexAggregates.sells.female > 0 ? 'var(--purple)' : 'var(--muted)' }}>{sexAggregates.sells.female > 0 ? `-${toFa(sexAggregates.sells.female)}` : '۰'}</span>
              <span style={{ textAlign: 'center', fontFamily: 'monospace', color: sexAggregates.others.female !== 0 ? 'var(--warn)' : 'var(--muted)' }}>{sexAggregates.others.female > 0 ? '+' : ''}{sexAggregates.others.female !== 0 ? toFa(sexAggregates.others.female) : '۰'}</span>
              <span style={{ textAlign: 'center', fontFamily: 'monospace', fontWeight: 700, color: 'var(--text)' }}>{toFa(sexAggregates.current.female)}</span>
            </div>

            {/* نامشخص — بدون ایموجی */}
            <div style={{ display: 'grid', gridTemplateColumns: '60px 1fr 1fr 1fr 1fr 1fr', padding: '6px 0', fontSize: 'var(--fs-sm)' }}>
              <span style={{ color: 'var(--muted)', fontWeight: 700 }}>نامشخص</span>
              <span style={{ textAlign: 'center', fontFamily: 'monospace' }}>{toFa(sexAggregates.init.unknown)}</span>
              <span style={{ textAlign: 'center', fontFamily: 'monospace', color: sexAggregates.deaths.unknown > 0 ? 'var(--danger)' : 'var(--muted)' }}>{sexAggregates.deaths.unknown > 0 ? `-${toFa(sexAggregates.deaths.unknown)}` : '۰'}</span>
              <span style={{ textAlign: 'center', fontFamily: 'monospace', color: sexAggregates.sells.unknown > 0 ? 'var(--purple)' : 'var(--muted)' }}>{sexAggregates.sells.unknown > 0 ? `-${toFa(sexAggregates.sells.unknown)}` : '۰'}</span>
              <span style={{ textAlign: 'center', fontFamily: 'monospace', color: sexAggregates.others.unknown !== 0 ? 'var(--warn)' : 'var(--muted)' }}>{sexAggregates.others.unknown > 0 ? '+' : ''}{sexAggregates.others.unknown !== 0 ? toFa(sexAggregates.others.unknown) : '۰'}</span>
              <span style={{ textAlign: 'center', fontFamily: 'monospace', fontWeight: 700, color: 'var(--text)' }}>{toFa(sexAggregates.current.unknown)}</span>
            </div>

            {/* جمع — border نازک */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '60px 1fr 1fr 1fr 1fr 1fr',
              padding: '6px 0',
              marginTop: 2,
              borderTop: '1px dashed var(--accent-border)',
              fontSize: 'var(--fs-sm)',
              fontWeight: 700,
            }}>
              <span style={{ color: 'var(--accent)' }}>جمع</span>
              <span style={{ textAlign: 'center', fontFamily: 'monospace' }}>{toFa(sexAggregates.init.male + sexAggregates.init.female + sexAggregates.init.unknown)}</span>
              <span style={{ textAlign: 'center', fontFamily: 'monospace', color: (sexAggregates.deaths.male + sexAggregates.deaths.female + sexAggregates.deaths.unknown) > 0 ? 'var(--danger)' : 'var(--muted)' }}>{(sexAggregates.deaths.male + sexAggregates.deaths.female + sexAggregates.deaths.unknown) > 0 ? `-${toFa(sexAggregates.deaths.male + sexAggregates.deaths.female + sexAggregates.deaths.unknown)}` : '۰'}</span>
              <span style={{ textAlign: 'center', fontFamily: 'monospace', color: (sexAggregates.sells.male + sexAggregates.sells.female + sexAggregates.sells.unknown) > 0 ? 'var(--purple)' : 'var(--muted)' }}>{(sexAggregates.sells.male + sexAggregates.sells.female + sexAggregates.sells.unknown) > 0 ? `-${toFa(sexAggregates.sells.male + sexAggregates.sells.female + sexAggregates.sells.unknown)}` : '۰'}</span>
              <span style={{ textAlign: 'center', fontFamily: 'monospace', color: 'var(--warn)' }}>{(sexAggregates.others.male + sexAggregates.others.female + sexAggregates.others.unknown) !== 0 ? `${(sexAggregates.others.male + sexAggregates.others.female + sexAggregates.others.unknown) > 0 ? '+' : ''}${toFa(sexAggregates.others.male + sexAggregates.others.female + sexAggregates.others.unknown)}` : '۰'}</span>
              <span style={{ textAlign: 'center', fontFamily: 'monospace', color: 'var(--accent)' }}>{toFa(sexAggregates.current.male + sexAggregates.current.female + sexAggregates.current.unknown)}</span>
            </div>
          </div>
          </div>
        </div>
      )}
      {auditCount === 0 ? (
            <div style={{ padding: 'var(--sp-8)', textAlign: 'center', color: 'var(--muted)', fontSize: 13 }}>
              <div style={{ fontSize: 40, marginBottom: 8 }}>📊</div>
              <div>هنوز تغییر جنسیتی ثبت نشده</div>
            </div>
          ) : (
            <>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {visibleData.audit.items.map(g => (
                  <div key={g.label}>
                    <div style={{ fontSize: 'var(--fs-base)', fontWeight: 700, color: 'var(--muted)', paddingBottom: 6, marginBottom: 6 }}>📅 {toFa(g.label)}</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      {g.events.map(ev => <AuditRow key={ev.id} ev={ev} />)}
                    </div>
                  </div>
                ))}
              </div>
              {visibleData.audit.hidden > 0 && (
                <ShowMoreButton count={visibleData.audit.hidden} onClick={() => setShowAllAudit(true)} />
              )}
            </>
          )}
        </div>
      ) : (
        groups.length === 0 ? (
          <div style={{ padding: 'var(--sp-8)', textAlign: 'center', color: 'var(--muted)', fontSize: 13 }}>
            <div style={{ fontSize: 40, marginBottom: 8 }}>📜</div>
            <div>هنوز رویدادی ثبت نشده</div>
          </div>
        ) : (
          <>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {visibleData.events.items.map(g => (
                <div key={g.label}>
                  <div style={{ fontSize: 'var(--fs-sm)', fontWeight: 700, color: 'var(--muted)', paddingBottom: 6, marginBottom: 6 }}>📅 {toFa(g.label)}</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {g.events.map(e => <EventRow key={e.id} e={e} onRevoke={() => handleRevoke(e)} />)}
                  </div>
                </div>
              ))}
            </div>
            {visibleData.events.hidden > 0 && (
              <div style={{ marginTop: 10 }}>
                <ShowMoreButton count={visibleData.events.hidden} onClick={() => setShowAllEvents(true)} />
              </div>
            )}
          </>
        )
      )}

    </Modal>
  );
}

function ShowMoreButton({ count, onClick }: { count: number; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} style={{ width: '100%', padding: '10px', background: 'var(--input-bg)', border: '1px solid var(--border)', borderRadius: 'var(--r-sm)', fontSize: 'var(--fs-sm)', color: 'var(--accent)', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
      📜 نمایش {toFa(count)} رویداد بیشتر
    </button>
  );
}

function TabButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        flex: 1,
        padding: '8px 10px',
        fontSize: 'var(--fs-sm)',
        fontWeight: 700,
        borderRadius: 'calc(var(--r-md) - 3px)',
        border: 'none',
        background: active ? 'var(--card)' : 'transparent',
        color: active ? 'var(--accent)' : 'var(--muted)',
        cursor: 'pointer',
        fontFamily: 'inherit',
        boxShadow: active ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
        transition: 'all 0.15s',
      }}
    >
      {children}
    </button>
  );
}

function AuditRow({ ev }: { ev: FlockSexBalanceEvent }) {
  const meta = SEX_AUDIT_META[ev.type] || { icon: '•', label: ev.type, tone: 'var(--muted)' };

  const renderRow = (label: string, icon: string, before: number, after: number, delta: number, tone: string, isLast = false) => {
    const deltaColor = delta > 0 ? 'var(--accent)' : delta < 0 ? 'var(--danger)' : 'var(--muted)';
    const isNoChange = delta === 0;

    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        padding: '4px 0',
        borderBottom: '1px dashed var(--border)',
      }}>
        {/* برچسب جنسیت */}
        <div style={{ width: 70, display: 'flex', alignItems: 'center', gap: 4, fontWeight: 700, color: tone, flexShrink: 0, fontSize: 'var(--fs-sm)' }}>
          <span>{icon}</span>
          <span>{label}</span>
        </div>

        {/* قبل و بعد */}
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: 40 }}>
            <span style={{ fontSize: 'var(--fs-xs)', color: 'var(--muted)', marginBottom: 2 }}>قبل</span>
            <span style={{ color: 'var(--muted)', fontFamily: 'monospace', fontSize: 'var(--fs-base)', fontWeight: 600 }}>{toFa(before)}</span>
          </div>
          <span style={{ color: 'var(--dim)', fontSize: 14, marginTop: 14 }}>←</span>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: 40 }}>
            <span style={{ fontSize: 'var(--fs-xs)', color: 'var(--muted)', marginBottom: 2 }}>بعد</span>
            <span style={{ fontWeight: 700, color: 'var(--text)', fontFamily: 'monospace', fontSize: 'var(--fs-base)' }}>{toFa(after)}</span>
          </div>
        </div>

        {/* دلتا */}
        <div style={{ width: 60, textAlign: 'left', fontWeight: 700, color: deltaColor, fontFamily: 'monospace', flexShrink: 0, fontSize: 'var(--fs-sm)' }}>
          {isNoChange ? (
            <span style={{ color: 'var(--muted)', fontSize: 'var(--fs-xs)' }}>بدون تغییر</span>
          ) : (
            <span>{delta > 0 ? '+' : ''}{toFa(delta)}</span>
          )}
        </div>
      </div>
    );
  };

  return (
    <div style={{
      padding: '6px 8px',
      background: 'var(--input-bg)',
      borderRadius: 'var(--r-md)',
      border: '1px solid var(--border)',
      display: 'flex',
      flexDirection: 'column',
      gap: 0,
    }}>
      {/* هدر کارت */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)', paddingBottom: 4, marginBottom: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 18 }}>{meta.icon}</span>
          <b style={{ color: meta.tone, fontSize: 'var(--fs-base)' }}>{meta.label}</b>
        </div>

      </div>

      {/* ردیف‌های داده */}
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {renderRow('نر', '♂', ev.before.male, ev.after.male, ev.delta.male, 'var(--info)')}
        {renderRow('ماده', '♀', ev.before.female, ev.after.female, ev.delta.female, 'var(--purple)')}
        {renderRow('نامشخص', '?', ev.before.unknown, ev.after.unknown, ev.delta.unknown, 'var(--muted)', true)}
      </div>

      {/* توضیح */}
      {ev.note && (
        <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--muted)', paddingTop: 6 }}>
          📝 {ev.note}
        </div>
      )}
    </div>
  );
}

function EventRow({ e, onRevoke }: { e: FlockEvent; onRevoke: () => void }) {
  const info = TYPE_INFO[e.type] || { icon: '•', label: e.type, tone: 'var(--muted)' };
  const isRevoked = e.revoked === true;
  const isRevokeAction = !!e.linkedEventId;
  const canRevoke = !isRevoked && !isRevokeAction && e.type !== 'add' && e.type !== 'correction';
  const isPlus = e.type === 'add' || e.type === 'transfer' || (e.type === 'correction' && !isRevokeAction && e.direction !== -1);
  const isManualCorrection = e.type === 'correction' && !e.linkedEventId && !isRevoked;

  return (
    <div style={{
      padding: '10px 12px',
      background: 'var(--input-bg)',
      borderRadius: 'var(--r-md)',
      border: '1px solid var(--border)',
      opacity: isRevoked ? 0.7 : 1,
      display: 'flex',
      flexDirection: 'column',
      gap: 8,
    }}>

      {/* ═══ سطر ۱ — عنوان + دلتا (برجسته) ═══ */}
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
        {info.icon && <span style={{ fontSize: 22, flexShrink: 0 }}>{info.icon}</span>}
        <b style={{ color: info.tone, fontSize: 'var(--fs-base)', fontWeight: 700 }}>{info.label}</b>
        <span
          dir="ltr"
          style={{
            fontFamily: 'monospace',
            fontSize: 'var(--fs-lg)',
            fontWeight: 800,
            color: isRevoked ? 'var(--muted)' : (isPlus ? 'var(--accent)' : 'var(--danger)'),
            textDecoration: isRevoked ? 'line-through' : 'none',
          }}
        >
          {isPlus ? '+' : '-'}{toFa(e.count)}
        </span>
        {isRevoked && (
          <span style={{
            fontSize: 'var(--fs-xs)',
            fontWeight: 700,
            padding: '2px 8px',
            background: 'var(--danger-soft)',
            color: 'var(--danger)',
            borderRadius: 4,
          }}>لغو شده</span>
        )}
        <div style={{ flex: 1 }} />
        {canRevoke && (
          <button type="button" onClick={onRevoke} style={{
            padding: '4px 10px',
            background: 'transparent',
            border: '1px solid var(--border)',
            borderRadius: 'var(--r-sm)',
            fontSize: 'var(--fs-xs)',
            fontWeight: 600,
            color: 'var(--muted)',
            cursor: 'pointer',
            fontFamily: 'inherit',
          }}>↩️ لغو</button>
        )}
      </div>

      {/* ═══ سطر ۲ — قبل → بعد ═══ */}

      {/* ═══ سطر ۳ — دلیل (سطح ۲) ═══ */}
      {e.reason && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 'var(--fs-sm)' }}>
          <span style={{ color: 'var(--muted)' }}>دلیل:</span>
          <span style={{ color: 'var(--text)' }}>{e.reason}</span>
        </div>
      )}

      {/* ═══ سطر ۴ — یادداشت (حرف کاربر) ═══ */}
      {e.notes && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 'var(--fs-sm)' }}>
          <span style={{ color: 'var(--muted)' }}>توضیح:</span>
          <span style={{ color: 'var(--text)' }}>{e.notes}</span>
        </div>
      )}

      {/* ═══ سطر ۵ — هشدار سیستم ═══ */}
      {isManualCorrection && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          fontSize: 11,
          color: 'var(--warn)',
          lineHeight: 1.5,
        }}>
          <span>⚠️</span>
          <span>این تغییر در «ثبت روزانه» سیستم ثبت نشده است.</span>
        </div>
      )}
    </div>
  );
}

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button type="button" onClick={onClick} style={{ padding: '5px var(--sp-3)', fontSize: 12, fontWeight: 600, borderRadius: 'var(--r-sm)', border: '1px solid ' + (active ? 'var(--accent)' : 'var(--border)'), background: active ? 'var(--accent-soft)' : 'transparent', color: active ? 'var(--accent)' : 'var(--muted)', cursor: 'pointer', fontFamily: 'inherit' }}>{children}</button>
  );
}
