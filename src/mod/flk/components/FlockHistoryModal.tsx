/**
 * FlockHistoryModal.tsx — تاریخچه رویدادهای گله
 * تب‌بندی منطقی + فیلتر + گروه‌بندی تاریخ + صفحه‌بندی
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
  correction: { icon: '✏️', label: 'اصلاح',   tone: 'var(--warn)' },
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
    const order: string[] = [];
    for (const e of filtered) {
      const key = e.date === today ? 'امروز' : (e.date || 'نامشخص');
      if (!map.has(key)) { map.set(key, []); order.push(key); }
      map.get(key)!.push(e);
    }
    return order.map(k => ({ label: k, events: map.get(k)! }));
  }, [flock.events, filter]);

  const visibleData = useMemo(() => {
    // Events
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
    // Audit
    const allAudit = (flock.sexBalanceEvents || []).slice().sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
    const auditVisible = showAllAudit ? allAudit : allAudit.slice(0, VISIBLE_LIMIT);
    const auditHidden = allAudit.length - auditVisible.length;
    // Consumption
    const allCons = flockConsumption.slice().sort((a, b) => (b.date || '').localeCompare(a.date || ''));
    const consVisible = showAllConsumption ? allCons : allCons.slice(0, VISIBLE_LIMIT);
    const consHidden = allCons.length - consVisible.length;
    return {
      events: egVisible,
      audit: { items: auditVisible, hidden: auditHidden },
      consumption: { items: consVisible, hidden: consHidden },
    };
  }, [groups, showAllEvents, showAllAudit, showAllConsumption, flock.sexBalanceEvents, flockConsumption]);

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
    <Modal open={open} onClose={onClose} title={'📜 رویدادها • ' + flock.name}>

      {/* ═══ خط باریک موجودی ═══ */}
      <div style={{
        padding: '6px 10px',
        background: 'var(--input-bg)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--r-sm)',
        marginBottom: 10,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 8,
        fontSize: 12,
      }}>
        <span>موجودی: <b>{toFa(current)}</b> از {toFa(initial)}</span>
        {losses > 0 && (
          <span style={{ color: lossesPct > 5 ? 'var(--danger)' : 'var(--warn)', fontWeight: 700 }}>
            کاهش: {toFa(losses)} ({toFa(lossesPct.toFixed(1))}٪)
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

      {/* ═══ فرم اصلاح (فقط وقتی باز) ═══ */}
      {correctionOpen && (
        <div style={{ marginBottom: 12, background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--r-md)', padding: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px dashed var(--border)', paddingBottom: 8 }}>
            <span style={{ fontWeight: 700, color: 'var(--warn)', fontSize: 'var(--fs-sm)' }}>✏️ ثبت اصلاح موجودی</span>
            <button type="button" onClick={() => { setCorrectionOpen(false); setDelta(''); setNotes(''); setValidationError(''); }} style={{ background: 'none', border: 'none', color: 'var(--muted)', fontSize: 16, cursor: 'pointer', padding: 0, fontFamily: 'inherit' }}>✕</button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', background: 'var(--input-bg)', border: '1px solid ' + (validationError ? 'var(--danger)' : 'var(--border)'), borderRadius: 'var(--r-md)', height: 38, overflow: 'hidden' }}>
              <button type="button" onClick={() => { const n = parseInt(toEn(delta), 10) || 0; setDelta(toFa(String(n + 1))); }} style={{ width: 34, height: '100%', border: 'none', background: 'transparent', fontSize: 18, fontWeight: num > 0 ? 700 : 400, color: num > 0 ? 'var(--accent)' : 'var(--muted)', cursor: 'pointer', fontFamily: 'inherit', borderLeft: '1px solid var(--border)', flexShrink: 0 }}>+</button>
              <input type="text" value={delta} onChange={e => {
                const raw = toEn(e.target.value);
                const isNegative = raw.startsWith('-') || raw.startsWith('−');
                const digits = raw.replace(/[^0-9]/g, '');
                if (digits) { setDelta(toFa(isNegative ? '-' + digits : digits)); } else { setDelta(isNegative ? '−' : ''); }
                setValidationError('');
              }} placeholder="۰" inputMode="text" style={{ flex: 1, minWidth: 0, background: 'none', border: 'none', outline: 'none', fontFamily: 'inherit', fontSize: 'var(--fs-base)', fontWeight: 700, color: num > 0 ? 'var(--accent)' : num < 0 ? 'var(--danger)' : 'var(--text)', textAlign: 'center', padding: '0 var(--sp-1)', direction: 'ltr' }} />
              <button type="button" onClick={() => { const n = parseInt(toEn(delta), 10) || 0; setDelta(toFa(String(n - 1))); }} style={{ width: 34, height: '100%', border: 'none', background: 'transparent', fontSize: 18, fontWeight: num < 0 ? 700 : 400, color: num < 0 ? 'var(--danger)' : 'var(--muted)', cursor: 'pointer', fontFamily: 'inherit', borderRight: '1px solid var(--border)', flexShrink: 0 }}>−</button>
            </div>

            <div style={{ background: 'var(--input-bg)', border: '1px solid ' + (num !== 0 ? (newCount < 0 ? 'var(--danger)' : (newCount < initial * 0.1 ? 'var(--warn)' : 'var(--accent)')) : 'var(--border)'), borderRadius: 'var(--r-md)', height: 38, padding: '0 var(--sp-2)', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
              <div dir="ltr" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontFamily: 'monospace', fontSize: 13, fontWeight: 600, color: 'var(--muted)' }}>{toFa(current)}</span>
                <span style={{ color: 'var(--dim)', fontSize: 11 }}>→</span>
                {num === 0 ? <span style={{ fontFamily: 'monospace', fontSize: 14, fontWeight: 400, color: 'var(--dim)' }}>؟</span> : newCount < 0 ? <span style={{ fontFamily: 'monospace', fontSize: 14, fontWeight: 700, color: 'var(--danger)' }}>منفی</span> : num > 0 ? <span style={{ fontFamily: 'monospace', fontSize: 14, fontWeight: 700, color: 'var(--accent)' }}>{toFa(newCount)}</span> : <span style={{ fontFamily: 'monospace', fontSize: 14, fontWeight: 700, color: 'var(--danger)' }}>{toFa(newCount)}</span>}
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <span style={{ fontSize: 10, color: 'var(--muted)', fontWeight: 600, paddingRight: 2 }}>دلیل</span>
              <Select value={reasonCode} onChange={e => setReasonCode(e.target.value as FlockEventReasonCode)}>
                {REASON_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </Select>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <span style={{ fontSize: 10, color: 'var(--muted)', fontWeight: 600, paddingRight: 2 }}>توضیح (اختیاری)</span>
              <input type="text" value={notes} onChange={e => setNotes(e.target.value)} placeholder="مثلاً شمارش اشتباه" style={{ background: 'var(--input-bg)', border: '1px solid var(--border)', borderRadius: 'var(--r-md)', height: 38, padding: '0 var(--sp-3)', fontFamily: 'inherit', fontSize: 'var(--fs-sm)', color: 'var(--text)', outline: 'none', width: '100%' }} />
            </div>
          </div>

          {validationError && (
            <div style={{ padding: 'var(--sp-2) var(--sp-3)', background: 'var(--danger-soft)', border: '1px solid rgba(239,68,68,.3)', borderRadius: 'var(--r-md)', color: 'var(--danger)', fontSize: 'var(--fs-xs)', fontWeight: 600 }}>{validationError}</div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <button type="button" onClick={handleSaveCorrection} disabled={num === 0 || newCount < 0} style={{ height: 38, background: (num === 0 || newCount < 0) ? 'var(--dim)' : 'var(--accent)', color: 'white', border: 'none', borderRadius: 'var(--r-md)', fontFamily: 'inherit', fontSize: 'var(--fs-sm)', fontWeight: 700, cursor: (num === 0 || newCount < 0) ? 'not-allowed' : 'pointer' }}>ثبت اصلاح</button>
            <button type="button" onClick={() => { setCorrectionOpen(false); setDelta(''); setNotes(''); setValidationError(''); }} style={{ height: 38, background: 'var(--input-bg)', color: 'var(--muted)', border: '1px solid var(--border)', borderRadius: 'var(--r-md)', fontFamily: 'inherit', fontSize: 'var(--fs-sm)', fontWeight: 600, cursor: 'pointer' }}>لغو</button>
          </div>
        </div>
      )}

      {/* ═══ تب‌ها ═══ */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 8, flexWrap: 'wrap' }}>
        <Chip active={tabMode === 'events'} onClick={() => setTabMode('events')}>📋 همه ({toFa(totalCount)})</Chip>
        {auditCount > 0 && (
          <Chip active={tabMode === 'audit'} onClick={() => setTabMode('audit')}>⚥ تغییرات جنسیتی ({toFa(auditCount)})</Chip>
        )}
        {consumptionCount > 0 && (
          <Chip active={tabMode === 'consumption'} onClick={() => setTabMode('consumption')}>🍽️ مصرف ({toFa(consumptionCount)})</Chip>
        )}
      </div>

      {/* ═══ فیلتر نوع (فقط تب همه) ═══ */}
      {tabMode === 'events' && totalCount > 0 && (
        <div style={{ display: 'flex', gap: 6, marginBottom: 10, flexWrap: 'wrap' }}>
          {FILTER_TYPES.map(t => {
            const n = typeCounts.get(t) || 0;
            if (n === 0) return null;
            return (
              <Chip key={t} active={filter === t} onClick={() => setFilter(filter === t ? 'all' : t)}>
                {TYPE_INFO[t].icon} {TYPE_INFO[t].label} ({toFa(n)})
              </Chip>
            );
          })}
          {filter !== 'all' && (
            <button type="button" onClick={() => setFilter('all')} style={{ padding: '5px var(--sp-3)', fontSize: 12, fontWeight: 600, borderRadius: 'var(--r-sm)', border: '1px solid var(--border)', background: 'transparent', color: 'var(--muted)', cursor: 'pointer', fontFamily: 'inherit' }}>✕ نمایش همه</button>
          )}
        </div>
      )}

      {/* ═══ محتوا ═══ */}
      {tabMode === 'consumption' ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {consumptionSummary.hasData && (
            <div style={{ padding: '8px 10px', background: 'var(--accent-soft)', border: '1px solid var(--accent-border)', borderRadius: 'var(--r-md)', fontSize: 11 }}>
              <div style={{ fontWeight: 700, marginBottom: 6, color: 'var(--muted)', fontSize: 10 }}>📊 خلاصه ۳۰ روز اخیر</div>
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
          )}
          {fcrResult.fcr !== null && (
            <div style={{ padding: '8px 10px', background: fcrResult.confidence === 'exact' ? 'var(--accent-soft)' : 'var(--warn-soft)', border: `1px solid ${fcrResult.confidence === 'exact' ? 'var(--accent-border)' : 'var(--warn)'}`, borderRadius: 'var(--r-md)', fontSize: 11 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                <span style={{ fontWeight: 700, color: 'var(--muted)', fontSize: 10 }}>📊 FCR</span>
                <span style={{ fontSize: 9, padding: '1px 5px', borderRadius: 3, background: fcrResult.confidence === 'exact' ? 'var(--accent)' : 'var(--warn)', color: 'white', fontWeight: 700 }}>
                  {fcrResult.confidence === 'exact' ? 'دقیق' : fcrResult.confidence === 'standard' ? 'استاندارد' : 'ناقص'}
                </span>
              </div>
              <div style={{ fontSize: 14, fontWeight: 700, color: fcrResult.confidence === 'exact' ? 'var(--accent)' : 'var(--warn)', marginBottom: 4 }}>
                {toFa(fcrResult.fcr.toFixed(2))}
              </div>
              <div style={{ fontSize: 10, color: 'var(--muted)', lineHeight: 1.6 }}>
                {fcrResult.note}<br />
                دان/پرنده: {toFa(fcrResult.feedPerBird)} kg
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
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {visibleData.consumption.items.map(ev => (
                  <div key={ev.id} style={{ display: 'flex', gap: 8, padding: '6px 8px', background: 'var(--input-bg)', borderRadius: 'var(--r-sm)', border: '1px solid var(--border)', fontSize: 'var(--fs-xs)' }}>
                    <span style={{ fontSize: 16, flexShrink: 0 }}>{ev.type === 'feed' ? '🍽️' : '💧'}</span>
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
            <div style={{ padding: '8px 10px', background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--r-md)', fontSize: 11 }}>
              <div style={{ fontWeight: 700, marginBottom: 6, color: 'var(--muted)', fontSize: 10 }}>📊 نرخ تلفات به تفکیک جنسیت</div>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                <span>♂ نر: <b dir="ltr" style={{ color: toneFromRate(deathRate.male.rate) }}>{toFa(deathRate.male.deaths)} / {toFa(deathRate.male.initial)} → {toFa(deathRate.male.rate.toFixed(1))}٪</b></span>
                <span>♀ ماده: <b dir="ltr" style={{ color: toneFromRate(deathRate.female.rate) }}>{toFa(deathRate.female.deaths)} / {toFa(deathRate.female.initial)} → {toFa(deathRate.female.rate.toFixed(1))}٪</b></span>
                {deathRate.unknown.deaths > 0 && (
                  <span style={{ color: 'var(--muted)' }}>❓ نامشخص: <b>{toFa(deathRate.unknown.deaths)}</b></span>
                )}
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
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {visibleData.audit.items.map(ev => <AuditRow key={ev.id} ev={ev} />)}
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
                  <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', letterSpacing: '.5px', paddingBottom: 6, marginBottom: 6, borderBottom: '1px dashed var(--border)' }}>{g.label}</div>
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

      {/* ═══ فوتر ═══ */}
      <BtnRow>
        {!correctionOpen && (
          <Btn onClick={() => setCorrectionOpen(true)}>✏️ ثبت اصلاح</Btn>
        )}
        <Btn onClick={handleExport}>📥 CSV</Btn>
        <Btn variant="primary" onClick={onClose}>بستن</Btn>
      </BtnRow>
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

function AuditRow({ ev }: { ev: FlockSexBalanceEvent }) {
  const meta = SEX_AUDIT_META[ev.type] || { icon: '•', label: ev.type, tone: 'var(--muted)' };
  const delta = formatSexDelta(ev.delta);
  return (
    <div style={{ display: 'flex', gap: 8, padding: '6px 8px', background: 'var(--input-bg)', borderRadius: 'var(--r-sm)', border: '1px solid var(--border)', fontSize: 'var(--fs-xs)' }}>
      <span style={{ fontSize: 16, flexShrink: 0 }}>{meta.icon}</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 6 }}>
          <b style={{ color: meta.tone }}>{meta.label}</b>
          <span style={{ color: 'var(--muted)', fontSize: 10 }}>{toFa(ev.date)}</span>
        </div>
        <div dir="ltr" style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 2, fontFamily: 'monospace', fontSize: 11 }}>
          <span>{toFa(ev.before.male)}/{toFa(ev.before.female)}/{toFa(ev.before.unknown)}</span>
          <span style={{ color: 'var(--muted)' }}>→</span>
          <span>{toFa(ev.after.male)}/{toFa(ev.after.female)}/{toFa(ev.after.unknown)}</span>
          {delta && <span style={{ color: meta.tone, fontWeight: 600 }}>({delta})</span>}
        </div>
        {ev.note && <div style={{ color: 'var(--muted)', fontSize: 10, marginTop: 2 }}>{ev.note}</div>}
      </div>
    </div>
  );
}

function EventRow({ e, onRevoke }: { e: FlockEvent; onRevoke: () => void }) {
  const info = TYPE_INFO[e.type] || { icon: '•', label: e.type, tone: 'var(--muted)' };
  const isRevoked = e.revoked === true;
  const isRevokeAction = !!e.linkedEventId;
  const canRevoke = !isRevoked && !isRevokeAction && e.type !== 'add' && e.type !== 'correction';
  const isPlus = e.type === 'add' || e.type === 'transfer' || (e.type === 'correction' && !isRevokeAction);

  return (
    <div style={{ display: 'flex', gap: 8, padding: '6px 8px', background: 'var(--input-bg)', borderRadius: 'var(--r-sm)', border: '1px solid var(--border)', fontSize: 'var(--fs-xs)' }}>
      <span style={{ fontSize: 16, flexShrink: 0 }}>{info.icon}</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 6, alignItems: 'baseline' }}>
          <div style={{ display: 'flex', gap: 6, alignItems: 'baseline', flexWrap: 'wrap' }}>
            <b style={{ color: info.tone }}>{info.label}</b>
            <span dir="ltr" style={{ fontFamily: 'monospace', fontWeight: 700, color: isRevoked ? 'var(--muted)' : (isPlus ? 'var(--accent)' : 'var(--danger)'), textDecoration: isRevoked ? 'line-through' : 'none' }}>
              {isPlus ? '+' : '-'}{toFa(e.count)}
            </span>
          </div>
          <span style={{ color: 'var(--muted)', fontSize: 10 }}>{toFa(e.date)}</span>
        </div>
        {e.reason && <div style={{ color: 'var(--muted)', fontSize: 10, marginTop: 2 }}>{e.reason}</div>}
        {e.type === 'correction' && !e.linkedEventId && !e.revoked && (
          <div style={{ color: 'var(--warn)', fontSize: 10, marginTop: 2 }}>
            ⚠️ این اصلاح در ثبت روزانه (dlg) ثبت نشده — فقط موجودی گله تغییر کرده
          </div>
        )}
        {isRevoked && <div style={{ color: 'var(--danger)', fontSize: 10, marginTop: 2, fontWeight: 600 }}>لغو شده</div>}
        {canRevoke && (
          <button type="button" onClick={onRevoke} style={{ padding: 0, marginTop: 4, background: 'none', border: 'none', fontSize: 10, fontWeight: 600, color: 'var(--danger)', cursor: 'pointer', fontFamily: 'inherit' }}>↩️ لغو</button>
        )}
      </div>
    </div>
  );
}

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button type="button" onClick={onClick} style={{ padding: '5px var(--sp-3)', fontSize: 12, fontWeight: 600, borderRadius: 'var(--r-sm)', border: '1px solid ' + (active ? 'var(--accent)' : 'var(--border)'), background: active ? 'var(--accent-soft)' : 'transparent', color: active ? 'var(--accent)' : 'var(--muted)', cursor: 'pointer', fontFamily: 'inherit' }}>{children}</button>
  );
}
