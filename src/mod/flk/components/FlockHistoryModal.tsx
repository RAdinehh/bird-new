/**
 * FlockHistoryModal.tsx — تاریخچه رویدادهای گله
 * طراحی: KPI + گروه‌بندی زمانی + فیلتر + کارت‌های فشرده
 * منابع: Material Design 3 + Apple HIG + Linear
 */
import { useEffect, useState, useMemo, type ReactNode } from 'react';
import { Modal, Btn, BtnRow, Field, Grid2, Select } from '../../../shr/components/ui';
import type { Flock, FlockEvent, FlockEventType, FlockEventReasonCode } from '../store';
import { useFlk } from '../store';
import { todayJ } from '../api/flocksCalc';
import { showConfirmAsync } from '../../../cor/store/dialog';
import { toFa, toEn } from '../../../shr/utils/fa';
import type { DailyLog as DlgLog } from '../../dlg/store';

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

type Filter = 'all' | FlockEventType;

interface Props {
  open: boolean;
  onClose: () => void;
  flock: Flock;
}

export default function FlockHistoryModal({ open, onClose, flock }: Props) {
  const [filter, setFilter] = useState<Filter>('all');
  const [dlgDeaths, setDlgDeaths] = useState<number>(0);

  useEffect(() => {
    let cancelled = false;
    import('../../dlg/store').then((mod) => {
      if (cancelled) return;
      const logs: DlgLog[] = mod.useDlg.getState().logs || [];
      const total = logs
        .filter((l: DlgLog) => l.flockId === flock.id)
        .reduce((sum: number, l: DlgLog) => sum + (l.deathsCount || 0), 0);
      setDlgDeaths(total);
    }).catch(() => {});
    return () => { cancelled = true; };
  }, [flock.id, flock.events]);
  const [correctionOpen, setCorrectionOpen] = useState(false);
  const [delta, setDelta] = useState('');
  const [reasonCode, setReasonCode] = useState<FlockEventReasonCode>('data_entry_error');
  const [notes, setNotes] = useState('');
  const [validationError, setValidationError] = useState('');
  const addCorrection = useFlk(st => st.addCorrection);
  const revokeEvent = useFlk(st => st.revokeEvent);

  const initial = flock.initialCount || 0;
  const current = flock.currentCount || 0;

  // 🆕 منطق جدید: استخراج عدد علامت‌دار (مثلاً "-10" یا "10")
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
    const ok = await showConfirmAsync(
      'لغو رویداد',
      '«' + info.label + ' ' + toFa(e.count) + ' پرنده» لغو شود؟ یک رویداد اصلاح معکوس ثبت می‌شود.',
    );
    if (!ok) return;
    revokeEvent(flock.id, e.id);
  };

  const losses = Math.max(0, initial - current);
  const lossesPct = initial > 0 ? (losses / initial) * 100 : 0;
  const totalCount = flock.events?.length || 0;

  const typeCounts = useMemo(() => {
    const m = new Map<FlockEventType, number>();
    (flock.events || []).forEach(e => m.set(e.type, (m.get(e.type) || 0) + 1));
    return m;
  }, [flock.events]);

  const groups = useMemo(() => {
    const today = todayJ();
    const all = (flock.events || []).slice().sort((a, b) =>
      (b.createdAt || '').localeCompare(a.createdAt || '')
    );
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

  return (
    <Modal open={open} onClose={onClose} title={'📜 تاریخچه • ' + flock.name}>
      <div style={{ padding: 'var(--sp-3) var(--sp-4)', background: 'var(--accent-soft)', border: '1px solid var(--accent-border)', borderRadius: 'var(--r-md)', marginBottom: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8, fontSize: 13 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <span>موجودی: <b>{toFa(current)}</b> از {toFa(initial)}</span>
          {losses > 0 && (
            <div style={{ fontSize: 11 }}>
              <span style={{ color: lossesPct > 5 ? 'var(--danger)' : 'var(--warn)', fontWeight: 700 }}>
                تلفات کل: {toFa(losses)} ({toFa(lossesPct.toFixed(1))}٪)
              </span>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 2, fontSize: 10, color: 'var(--muted)' }}>
                <span>📥 از dlg: {toFa(dlgDeaths)}</span>
                <span>✏️ سایر: {toFa(Math.max(0, losses - dlgDeaths))}</span>
              </div>
          {flock.dealType && flock.dealType !== 'own' && (
            <div style={{ fontSize: 10, color: 'var(--purple)', fontWeight: 600, marginTop: 2 }}>
              {flock.dealType === 'partnership' && '🤝 شراکتی' + (flock.dealData?.partnerShare ? ' ' + toFa(flock.dealData.partnerShare) + '-' + toFa(100 - (flock.dealData.partnerShare || 0)) : '')}
              {flock.dealType === 'consignment' && '📦 امانی'}
              {flock.dealType === 'rent' && '📋 اجاره'}
            </div>
          )}
            </div>
          )}
        </div>
      </div>

      {!correctionOpen ? (
        <div style={{ marginBottom: 12 }}>
          <Btn size="sm" onClick={() => setCorrectionOpen(true)} style={{ width: '100%' }}>✏️ ثبت اصلاح</Btn>
        </div>
      ) : (
        <div style={{ marginBottom: 12, background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--r-md)', padding: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px dashed var(--border)', paddingBottom: 8 }}>
            <span style={{ fontWeight: 700, color: 'var(--warn)', fontSize: 'var(--fs-sm)' }}>✏️ ثبت اصلاح موجودی</span>
            <button type="button" onClick={() => { setCorrectionOpen(false); setDelta(''); setNotes(''); setValidationError(''); }} style={{ background: 'none', border: 'none', color: 'var(--muted)', fontSize: 16, cursor: 'pointer', padding: 0, fontFamily: 'inherit' }}>✕</button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', background: 'var(--input-bg)', border: '1px solid ' + (validationError ? 'var(--danger)' : (num !== 0 ? (newCount < 0 ? 'var(--danger)' : 'var(--border)') : 'var(--border)')), borderRadius: 'var(--r-md)', height: 38, overflow: 'hidden' }}>
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
            <div style={{ padding: 'var(--sp-2) var(--sp-3)', background: 'var(--danger-soft)', border: '1px solid rgba(239,68,68,.3)', borderRadius: 'var(--r-md)', color: 'var(--danger)', fontSize: 'var(--fs-xs)', fontWeight: 600 }}>⚠️ {validationError}</div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <button type="button" onClick={handleSaveCorrection} disabled={num === 0 || newCount < 0} style={{ height: 38, background: (num === 0 || newCount < 0) ? 'var(--dim)' : 'var(--accent)', color: 'white', border: 'none', borderRadius: 'var(--r-md)', fontFamily: 'inherit', fontSize: 'var(--fs-sm)', fontWeight: 700, cursor: (num === 0 || newCount < 0) ? 'not-allowed' : 'pointer' }}>ثبت اصلاح</button>
            <button type="button" onClick={() => { setCorrectionOpen(false); setDelta(''); setNotes(''); setValidationError(''); }} style={{ height: 38, background: 'var(--input-bg)', color: 'var(--muted)', border: '1px solid var(--border)', borderRadius: 'var(--r-md)', fontFamily: 'inherit', fontSize: 'var(--fs-sm)', fontWeight: 600, cursor: 'pointer' }}>لغو</button>
          </div>
        </div>
      )}

      {totalCount > 0 && (
        <div style={{ display: 'flex', gap: 6, marginBottom: 12, flexWrap: 'wrap' }}>
          <Chip active={filter === 'all'} onClick={() => setFilter('all')}>همه ({toFa(totalCount)})</Chip>
          {(['death', 'sell', 'correction'] as FlockEventType[]).map(t => {
            const n = typeCounts.get(t) || 0;
            if (n === 0) return null;
            return <Chip key={t} active={filter === t} onClick={() => setFilter(t)}>{TYPE_INFO[t].icon} {TYPE_INFO[t].label} ({toFa(n)})</Chip>;
          })}
        </div>
      )}

      {groups.length === 0 ? (
        <div style={{ padding: 'var(--sp-8)', textAlign: 'center', color: 'var(--muted)', fontSize: 13 }}>
          <div style={{ fontSize: 40, marginBottom: 8 }}>📜</div>
          <div>هنوز رویدادی ثبت نشده</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {groups.map(g => (
            <div key={g.label}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', letterSpacing: '.5px', paddingBottom: 6, marginBottom: 6, borderBottom: '1px dashed var(--border)' }}>{g.label}</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {g.events.map(e => <EventRow key={e.id} e={e} onRevoke={() => handleRevoke(e)} />)}
              </div>
            </div>
          ))}
        </div>
      )}
      <BtnRow><Btn variant="primary" onClick={onClose}>بستن</Btn></BtnRow>
    </Modal>
  );
}

function EventRow({ e, onRevoke }: { e: FlockEvent; onRevoke: () => void }) {
  const info = TYPE_INFO[e.type] || { icon: '•', label: e.type, tone: 'var(--muted)' };
  const isRevoked = e.revoked === true;
  const isRevokeAction = !!e.linkedEventId;
  const canRevoke = !isRevoked && !isRevokeAction && e.type !== 'add' && e.type !== 'correction';
  const isPlus = e.type === 'add' || e.type === 'transfer' || (e.type === 'correction' && !isRevokeAction);

  // رنگ آواتار بر اساس نوع
  const avatarStyle: Record<string, string> = {
    correction: 'linear-gradient(135deg, var(--warn-soft), color-mix(in srgb, var(--warn) 30%, var(--warn-soft)))',
    death: 'linear-gradient(135deg, var(--danger-soft), color-mix(in srgb, var(--danger) 30%, var(--danger-soft)))',
    sell: 'linear-gradient(135deg, var(--purple-soft), color-mix(in srgb, var(--purple) 30%, var(--purple-soft)))',
    transfer: 'linear-gradient(135deg, var(--info-soft), color-mix(in srgb, var(--info) 30%, var(--info-soft)))',
    add: 'linear-gradient(135deg, var(--accent-soft), color-mix(in srgb, var(--accent) 30%, var(--accent-soft)))',
    cull: 'linear-gradient(135deg, var(--warn-soft), color-mix(in srgb, var(--warn) 30%, var(--warn-soft)))',
  };

  return (
    <div style={{
      background: isRevoked ? 'var(--danger-soft)' : 'var(--card)',
      border: '1px solid ' + (isRevoked ? 'rgba(239, 68, 68, 0.25)' : 'var(--border)'),
      borderRadius: 14,
      padding: 'var(--sp-4) var(--sp-5)',
      display: 'flex',
      alignItems: 'center',
      gap: 14,
      boxShadow: isRevoked ? 'none' : '0 1px 2px rgba(15, 23, 42, 0.04)',
      opacity: isRevoked ? 0.85 : 1,
    }}>
      {/* آواتار */}
      <div style={{
        width: 38, height: 38,
        borderRadius: 11,
        background: isRevoked ? 'var(--input-bg)' : (avatarStyle[e.type] || 'var(--input-bg)'),
        filter: isRevoked ? 'grayscale(1)' : 'none',
        opacity: isRevoked ? 0.85 : 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 17,
        flexShrink: 0,
      }}>{info.icon}</div>

      {/* بدنه وسط */}
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 3 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, flexWrap: 'wrap' }}>
          <span style={{
            fontSize: 13,
            fontWeight: 700,
            textDecoration: isRevoked ? 'line-through' : 'none',
            color: isRevoked ? 'var(--muted)' : 'var(--text)',
          }}>{info.label}</span>
          <span style={{
            fontSize: 14,
            fontWeight: 700,
            fontFamily: 'monospace',
            textDecoration: isRevoked ? 'line-through' : 'none',
            color: isRevoked ? 'var(--muted)' : (isPlus ? 'var(--accent)' : 'var(--danger)'),
          }}>
            {isPlus ? '+' : '-'}{toFa(e.count)} پرنده
          </span>
        </div>
        {e.reason && (
          <span style={{ fontSize: 12, color: isRevoked ? 'var(--dim)' : 'var(--muted)' }}>{e.reason}</span>
        )}
      
            {e.type === 'correction' && !e.linkedEventId && !e.revoked && (
              <span style={{ fontSize: 10, color: 'var(--warn)' }}>
                ⚠️ این اصلاح در dlg ثبت نشده
              </span>
            )}
</div>

      {/* ستون چپ: تاریخ + لغو */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', justifyContent: 'center', gap: 5, flexShrink: 0 }}>
        <span style={{
          fontFamily: 'monospace',
          fontSize: 11,
          fontWeight: 600,
          color: 'var(--dim)',
          opacity: isRevoked ? 0.7 : 1,
          whiteSpace: 'nowrap',
        }}>{toFa(e.date)}</span>

        {isRevoked && (
          <span style={{
            fontSize: 10,
            fontWeight: 700,
            color: 'var(--danger)',
            padding: '2px var(--sp-2)',
            background: 'rgba(239, 68, 68, 0.1)',
            borderRadius: 4,
            whiteSpace: 'nowrap',
          }}>لغو شده</span>
        )}

        {canRevoke && (
          <button
            type="button"
            onClick={onRevoke}
            style={{
              padding: 0,
              background: 'none',
              border: 'none',
              fontSize: 11,
              fontWeight: 600,
              color: 'var(--danger)',
              cursor: 'pointer',
              fontFamily: 'inherit',
              whiteSpace: 'nowrap',
            }}
          >↩️ لغو</button>
        )}
      </div>
    </div>
  );
}

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button type="button" onClick={onClick} style={{
      padding: '5px var(--sp-3)',
      fontSize: 12,
      fontWeight: 600,
      borderRadius: 'var(--r-sm)',
      border: '1px solid ' + (active ? 'var(--accent)' : 'var(--border)'),
      background: active ? 'var(--accent-soft)' : 'transparent',
      color: active ? 'var(--accent)' : 'var(--muted)',
      cursor: 'pointer',
      fontFamily: 'inherit',
    }}>{children}</button>
  );
}
