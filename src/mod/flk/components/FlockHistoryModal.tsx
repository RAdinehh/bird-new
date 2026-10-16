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
  const addCorrection = useFlk(st => st.addCorrection);
  const revokeEvent = useFlk(st => st.revokeEvent);

  const initial = flock.initialCount || 0;
  const current = flock.currentCount || 0;
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
    const cleaned = en.replace(/[^0-9+\-]/g, '');
    const d = parseInt(cleaned.replace('+', '')) || 0;
    const newCount = current + d;

    if (d === 0) { setValidationError('تغییر نمی‌تواند صفر باشد'); return; }
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
          padding: 12,
          background: 'var(--warn-soft)',
          border: '1px solid var(--warn)',
          borderRadius: 'var(--r-md)',
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
        }}>
          <div style={{ fontWeight: 700, color: 'var(--warn)', fontSize: 13 }}>✏️ ثبت اصلاح</div>
          <div style={{ fontSize: 11, color: 'var(--muted)', lineHeight: 1.6 }}>عدد مثبت = افزودن، عدد منفی = کسر</div>
          <Grid2>
            <Field label="تغییر تعداد" required>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--input-bg)', border: '1px solid var(--border)', borderRadius: 'var(--r-md)', padding: '0 12px', height: 38 }}>
                <input
                  type="text"
                  value={delta}
                  onChange={e => setDelta(e.target.value)}
                  placeholder="مثلاً +۵ یا -۳"
                  dir="ltr"
                  style={{ flex: 1, width: '100%', minWidth: 0, background: 'none', border: 'none', outline: 'none', color: 'var(--text)', fontFamily: 'inherit', fontSize: 14, textAlign: 'center' }}
                />
                <span style={{ fontSize: 12, color: 'var(--dim)', flexShrink: 0 }}>پرنده</span>
              </div>
            </Field>
            <Field label="دلیل" required>
              <Select value={reasonCode} onChange={e => setReasonCode(e.target.value as FlockEventReasonCode)}>
                {REASON_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </Select>
            </Field>
          </Grid2>
          <Field label="توضیح (اختیاری)">
            <div style={{ display: 'flex', alignItems: 'center', background: 'var(--input-bg)', border: '1px solid var(--border)', borderRadius: 'var(--r-md)', padding: '0 12px', height: 38 }}>
              <input
                type="text"
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="مثلاً خطای شمارش دیروز"
                style={{ flex: 1, width: '100%', minWidth: 0, background: 'none', border: 'none', outline: 'none', color: 'var(--text)', fontFamily: 'inherit', fontSize: 13 }}
              />
            </div>
          </Field>
          {validationError && (
            <div style={{ padding: 8, background: 'var(--danger-soft)', border: '1px solid var(--danger)', borderRadius: 'var(--r-sm)', color: 'var(--danger)', fontSize: 12, fontWeight: 600 }}>
              ⚠️ {validationError}
            </div>
          )}
          <div style={{ display: 'flex', gap: 8 }}>
            <Btn size="sm" variant="primary" onClick={handleSaveCorrection} style={{ flex: 1 }}>ثبت</Btn>
            <Btn size="sm" onClick={() => { setCorrectionOpen(false); setDelta(''); setNotes(''); setValidationError(''); }} style={{ flex: 1 }}>لغو</Btn>
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
  const canRevoke = !isRevoked && !isRevokeAction && e.type !== 'add';

  return (
    <div style={{
      padding: '8px 12px',
      background: isRevoked ? 'transparent' : 'var(--input-bg)',
      border: isRevoked ? '1px dashed var(--border)' : 'none',
      borderRight: '3px solid ' + (isRevoked ? 'var(--dim)' : info.tone),
      borderRadius: 'var(--r-sm)',
      display: 'flex',
      flexDirection: 'column',
      gap: 3,
      opacity: isRevoked ? 0.6 : 1,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
        <span style={{
          fontWeight: 700,
          color: isRevoked ? 'var(--muted)' : info.tone,
          fontSize: 13,
          textDecoration: isRevoked ? 'line-through' : 'none',
        }}>
          {info.icon} {info.label}
        </span>
        <span style={{ fontFamily: 'monospace', opacity: 0.75, fontSize: 11, color: 'var(--muted)' }}>
          {toFa(e.date)}
        </span>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, fontSize: 13 }}>
        <span><b style={{ textDecoration: isRevoked ? 'line-through' : 'none' }}>{toFa(e.count)}</b> پرنده</span>
        {e.sex !== 'mixed' && <span style={{ opacity: 0.7, fontSize: 12 }}>{e.sex === 'male' ? 'نر' : 'ماده'}</span>}
      </div>

      {e.reason && <div style={{ fontSize: 12, color: 'var(--muted)' }}>{e.reason}</div>}
      {e.notes && <div style={{ fontSize: 12, color: 'var(--dim)', fontStyle: 'italic' }}>{e.notes}</div>}

      {(isRevoked || isRevokeAction) && (
        <div style={{ fontSize: 11, color: 'var(--muted)', fontStyle: 'italic' }}>
          {isRevoked ? '↩️ لغو شده' : '↩️ این یک لغو است'}
        </div>
      )}

      {canRevoke && (
        <button
          type="button"
          onClick={onRevoke}
          style={{
            alignSelf: 'flex-start',
            marginTop: 2,
            padding: '3px 10px',
            fontSize: 11,
            fontWeight: 600,
            background: 'transparent',
            border: '1px solid var(--border)',
            borderRadius: 'var(--r-sm)',
            color: 'var(--muted)',
            cursor: 'pointer',
            fontFamily: 'inherit',
          }}
        >↩️ لغو</button>
      )}
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
