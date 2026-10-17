/**
 * FlockHistoryModal.tsx — تاریخچه رویدادهای گله
 * طراحی: KPI + گروه‌بندی زمانی + فیلتر + کارت‌های فشرده
 * منابع: Material Design 3 + Apple HIG + Linear
 */
import { useState, useMemo, type ReactNode } from 'react';
import { Modal, Btn, BtnRow, Field, Grid2, Select } from '../../../shr/components/ui';
import type { Flock, FlockEvent, FlockEventType, FlockEventReasonCode } from '../store';
import { useFlk } from '../store';
import { todayJ } from '../api/flocksCalc';
import { showConfirmAsync } from '../../../cor/store/dialog';
import { toFa, toEn } from '../../../shr/utils/fa';

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
  const [correctionOpen, setCorrectionOpen] = useState(false);
  const [delta, setDelta] = useState('');
  const [reasonCode, setReasonCode] = useState<FlockEventReasonCode>('data_entry_error');
  const [notes, setNotes] = useState('');
  const [validationError, setValidationError] = useState('');
  const [sign, setSign] = useState<1 | -1>(1);
  const addCorrection = useFlk(st => st.addCorrection);
  const revokeEvent = useFlk(st => st.revokeEvent);

  const initial = flock.initialCount || 0;
  const current = flock.currentCount || 0;
  // 🆕 تبدیل اعداد فارسی به انگلیسی + فیلتر
  const num = parseInt(toEn(delta).replace(/[^0-9]/g, '')) || 0;
  const newCount = current + sign * num;
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
      if (!map.has(key)) {
        map.set(key, []);
        order.push(key);
      }
      map.get(key)!.push(e);
    }
    return order.map(k => ({ label: k, events: map.get(k)! }));
  }, [flock.events, filter]);

  const handleSaveCorrection = async () => {
    setValidationError('');
    const en = toEn(delta).trim();
    const cleaned = en.replace(/[^0-9]/g, '');
    const num = parseInt(cleaned) || 0;
    const d = sign * num;
    const newCount = current + d;

    if (num === 0) { setValidationError('عدد را وارد کنید'); return; }
    if (newCount < 0) { setValidationError('موجودی کافی نیست — موجودی فعلی ' + toFa(current) + ' پرنده'); return; }
    if (d > 0 && newCount > initial) {
      const ok = await showConfirmAsync('بیشتر از تعداد اولیه', 'تعداد جدید (' + toFa(newCount) + ') از تعداد اولیه (' + toFa(initial) + ') بیشتر می‌شود. ادامه؟');
      if (!ok) return;
    }
    if (d < 0 && initial > 0 && newCount < initial * 0.1) {
      const pct = Math.round((newCount / initial) * 100);
      const ok = await showConfirmAsync('هشدار موجودی کم', 'موجودی زیر ۱۰٪ می‌رود (' + toFa(pct) + '٪). ادامه؟');
      if (!ok) return;
    }

    const label = REASON_OPTIONS.find(r => r.value === reasonCode)?.label || reasonCode;
    addCorrection(flock.id, d, reasonCode, label, notes.trim());
    setCorrectionOpen(false);
    setDelta('');
    setNotes('');
    setSign(1);
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

  return (
    <Modal open={open} onClose={onClose} title={'📜 تاریخچه • ' + flock.name}>
      {/* KPI */}
      <div style={{
        padding: '10px 14px',
        background: 'var(--accent-soft)',
        border: '1px solid var(--accent-border)',
        borderRadius: 'var(--r-md)',
        marginBottom: 12,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 8,
        fontSize: 13,
      }}>
        <span>موجودی: <b>{toFa(current)}</b> از {toFa(initial)}</span>
        {losses > 0 && (
          <span style={{ color: lossesPct > 5 ? 'var(--danger)' : 'var(--warn)', fontWeight: 700 }}>
            تلفات: {toFa(losses)} ({toFa(lossesPct.toFixed(1))}٪)
          </span>
        )}
      </div>

      {/* دکمه/فرم ثبت اصلاح */}
      {!correctionOpen ? (
        <div style={{ marginBottom: 12 }}>
          <Btn size="sm" onClick={() => setCorrectionOpen(true)} style={{ width: '100%' }}>✏️ ثبت اصلاح</Btn>
        </div>
      ) : (
        <div style={{
          marginBottom: 12,
          background: 'var(--card)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--r-md)',
          padding: 12,
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px dashed var(--border)', paddingBottom: 8 }}>
            <span style={{ fontWeight: 700, color: 'var(--warn)', fontSize: 'var(--fs-sm)' }}>✏️ ثبت اصلاح موجودی</span>
            <button type="button" onClick={() => { setCorrectionOpen(false); setDelta(''); setNotes(''); setSign(1); setValidationError(''); }} style={{ background: 'none', border: 'none', color: 'var(--muted)', fontSize: 16, cursor: 'pointer', padding: 0, fontFamily: 'inherit' }}>✕</button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', background: 'var(--input-bg)', border: '1px solid ' + (validationError ? 'var(--danger)' : (num > 0 ? (newCount < 0 ? 'var(--danger)' : (newCount < initial * 0.1 ? 'var(--warn)' : 'var(--accent)')) : 'var(--border)')), borderRadius: 'var(--r-md)', height: 38, overflow: 'hidden' }}>
              <button type="button" onClick={() => { setSign(1); const currNum = parseInt(toEn(delta).replace(/[^0-9]/g, '')) || 0; setDelta(toFa(String(currNum + 1))); }} style={{ width: 34, height: '100%', border: 'none', background: 'transparent', fontSize: 18, fontWeight: sign === 1 ? 700 : 400, color: sign === 1 ? 'var(--accent)' : 'var(--muted)', cursor: 'pointer', fontFamily: 'inherit', borderLeft: '1px solid var(--border)', flexShrink: 0 }}>+</button>
              <input type="text" value={delta} onChange={e => {
  const v = toEn(e.target.value);
  // 🆕 پشتیبانی از -/+ در ابتدا + اعداد
  let sign: 'plus' | 'minus' | null = null;
  let body = v;
  if (v.startsWith('-') || v.startsWith('−')) { sign = 'minus'; body = v.slice(1); }
  else if (v.startsWith('+')) { sign = 'plus'; body = v.slice(1); }
  const en = body.replace(/[^0-9]/g, '');
  if (sign === 'minus') { setSign(-1); setDelta(en ? toFa(en) : ''); }
  else if (sign === 'plus') { setSign(1); setDelta(en ? toFa(en) : ''); }
  else { setDelta(en ? toFa(en) : ''); }
  setValidationError('');
}} placeholder="۰" inputMode="numeric" style={{ flex: 1, minWidth: 0, background: 'none', border: 'none', outline: 'none', fontFamily: 'inherit', fontSize: 'var(--fs-base)', fontWeight: 700, color: 'var(--text)', textAlign: 'center', padding: '0 4px', direction: 'rtl' }} />
              <button type="button" onClick={() => { setSign(-1); const currNum = parseInt(toEn(delta).replace(/[^0-9]/g, '')) || 0; setDelta(toFa(String(currNum + 1))); }} style={{ width: 34, height: '100%', border: 'none', background: 'transparent', fontSize: 18, fontWeight: sign === -1 ? 700 : 400, color: sign === -1 ? 'var(--danger)' : 'var(--muted)', cursor: 'pointer', fontFamily: 'inherit', borderRight: '1px solid var(--border)', flexShrink: 0 }}>−</button>
            </div>

            <div style={{ background: 'var(--input-bg)', border: '1px solid ' + (num > 0 ? (newCount < 0 ? 'var(--danger)' : (newCount < initial * 0.1 ? 'var(--warn)' : 'var(--accent)')) : 'var(--border)'), borderRadius: 'var(--r-md)', height: 38, padding: '0 10px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontFamily: 'monospace', fontSize: 13, fontWeight: 600, color: 'var(--muted)' }}>{toFa(current)}</span>
                <span style={{ color: 'var(--dim)', fontSize: 11 }}>→</span>
                {num === 0 ? (
                  <span style={{ fontFamily: 'monospace', fontSize: 14, fontWeight: 400, color: 'var(--dim)' }}>؟</span>
                ) : newCount < 0 ? (
                  <span style={{ fontFamily: 'monospace', fontSize: 14, fontWeight: 700, color: 'var(--danger)' }}>منفی</span>
                ) : newCount > current ? (
                  <span style={{ fontFamily: 'monospace', fontSize: 14, fontWeight: 700, color: 'var(--accent)' }}>{toFa(newCount)}</span>
                ) : newCount < current ? (
                  <span style={{ fontFamily: 'monospace', fontSize: 14, fontWeight: 700, color: 'var(--danger)' }}>{toFa(newCount)}</span>
                ) : (
                  <span style={{ fontFamily: 'monospace', fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>{toFa(newCount)}</span>
                )}
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
              <input type="text" value={notes} onChange={e => setNotes(e.target.value)} placeholder="مثلاً شمارش اشتباه" style={{ background: 'var(--input-bg)', border: '1px solid var(--border)', borderRadius: 'var(--r-md)', height: 38, padding: '0 10px', fontFamily: 'inherit', fontSize: 'var(--fs-sm)', color: 'var(--text)', outline: 'none', width: '100%' }} />
            </div>
          </div>

          {validationError && (
            <div style={{ padding: '8px 12px', background: 'var(--danger-soft)', border: '1px solid rgba(239,68,68,.3)', borderRadius: 'var(--r-md)', color: 'var(--danger)', fontSize: 'var(--fs-xs)', fontWeight: 600 }}>
              ⚠️ {validationError}
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <button type="button" onClick={handleSaveCorrection} disabled={num === 0 || newCount < 0} style={{ height: 38, background: (num === 0 || newCount < 0) ? 'var(--dim)' : 'var(--accent)', color: 'white', border: 'none', borderRadius: 'var(--r-md)', fontFamily: 'inherit', fontSize: 'var(--fs-sm)', fontWeight: 700, cursor: (num === 0 || newCount < 0) ? 'not-allowed' : 'pointer' }}>ثبت اصلاح</button>
            <button type="button" onClick={() => { setCorrectionOpen(false); setDelta(''); setNotes(''); setSign(1); setValidationError(''); }} style={{ height: 38, background: 'var(--input-bg)', color: 'var(--muted)', border: '1px solid var(--border)', borderRadius: 'var(--r-md)', fontFamily: 'inherit', fontSize: 'var(--fs-sm)', fontWeight: 600, cursor: 'pointer' }}>لغو</button>
          </div>
        </div>
      )}

      {/* فیلترها */}
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

      {/* لیست رویدادها */}
      {groups.length === 0 ? (
        <div style={{ padding: 32, textAlign: 'center', color: 'var(--muted)', fontSize: 13 }}>
          <div style={{ fontSize: 40, marginBottom: 8 }}>📜</div>
          <div>هنوز رویدادی ثبت نشده</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {groups.map(g => (
            <div key={g.label}>
              <div style={{
                fontSize: 11,
                fontWeight: 700,
                color: 'var(--muted)',
                letterSpacing: '.5px',
                paddingBottom: 6,
                marginBottom: 6,
                borderBottom: '1px dashed var(--border)',
              }}>{g.label}</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {g.events.map(e => <EventRow key={e.id} e={e} onRevoke={() => handleRevoke(e)} />)}
              </div>
            </div>
          ))}
        </div>
      )}

      <BtnRow>
        <Btn variant="primary" onClick={onClose}>بستن</Btn>
      </BtnRow>
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
    correction: 'linear-gradient(135deg, #fef9c3, #fde68a)',
    death: 'linear-gradient(135deg, #fecaca, #fca5a5)',
    sell: 'linear-gradient(135deg, #e9d5ff, #d8b4fe)',
    transfer: 'linear-gradient(135deg, #bfdbfe, #93c5fd)',
    add: 'linear-gradient(135deg, #a7f3d0, #6ee7b7)',
    cull: 'linear-gradient(135deg, #fef3c7, #fde68a)',
  };

  return (
    <div style={{
      background: isRevoked ? 'var(--danger-soft)' : 'var(--card)',
      border: '1px solid ' + (isRevoked ? 'rgba(239, 68, 68, 0.25)' : 'var(--border)'),
      borderRadius: 14,
      padding: '14px 16px',
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
            padding: '2px 6px',
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
      padding: '5px 12px',
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
