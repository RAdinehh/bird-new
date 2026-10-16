/**
 * FlockHistoryModal.tsx — تاریخچه رویدادهای گله
 */
import { useState, type ReactNode } from 'react';
import { Modal, Btn, BtnRow, Field, Grid2, Select } from '../../../shr/components/ui';
import type { Flock, FlockEventType, FlockEventReasonCode } from '../store';
import { useFlk } from '../store';
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
  const addCorrection = useFlk(st => st.addCorrection);
  const revokeEvent = useFlk(st => st.revokeEvent);
  const [validationError, setValidationError] = useState('');
  const events = (flock.events || []).slice().sort((a, b) => (b.date || '').localeCompare(a.date || ''));
  const filtered = filter === 'all' ? events : events.filter(e => e.type === filter);
  // 🆕 event هایی که لغو شدن (توسط یه correction با linkedEventId)
  const revokedIds = new Set(events.filter(e => e.linkedEventId).map(e => e.linkedEventId));

  const handleSaveCorrection = async () => {
    setValidationError('');
    const en = toEn(delta).trim();
    const cleaned = en.replace(/[^0-9+\-]/g, '');
    const d = parseInt(cleaned.replace('+', '')) || 0;

    // ─── Smart Validation ───
    const cur = flock.currentCount || 0;
    const init = flock.initialCount || 0;
    const newCount = cur + d;

    if (d === 0) {
      setValidationError('تغییر نمی‌تواند صفر باشد');
      return;
    }
    if (newCount < 0) {
      setValidationError('موجودی کافی نیست — موجودی فعلی ' + toFa(cur) + ' پرنده');
      return;
    }
    if (d > 0 && newCount > init) {
      const ok = await showConfirmAsync(
        'بیشتر از تعداد اولیه',
        'تعداد جدید (' + toFa(newCount) + ') از تعداد اولیه (' + toFa(init) + ') بیشتر می‌شود. ادامه؟',
      );
      if (!ok) return;
    }
    if (d < 0 && init > 0 && newCount < init * 0.1) {
      const pct = Math.round((newCount / init) * 100);
      const ok = await showConfirmAsync(
        'هشدار موجودی کم',
        'موجودی زیر ۱۰٪ می‌رود (' + toFa(pct) + '٪ از اولیه). ادامه؟',
      );
      if (!ok) return;
    }

    const label = REASON_OPTIONS.find(r => r.value === reasonCode)?.label || reasonCode;
    addCorrection(flock.id, d, reasonCode, label, notes.trim());
    setCorrectionOpen(false);
    setDelta('');
    setNotes('');
    setValidationError('');
  };

  const handleRevoke = async (eventId: string, eventLabel: string) => {
    const ok = await showConfirmAsync(
      'لغو رویداد',
      'رویداد «' + eventLabel + '» لغو شود؟ یک رویداد اصلاح معکوس ثبت می‌شود (audit trail حفظ می‌شود).',
    );
    if (!ok) return;
    revokeEvent(flock.id, eventId);
  };

  const initial = flock.initialCount || 0;
  const current = flock.currentCount || 0;
  const losses = Math.max(0, initial - current);
  const lossesPct = initial > 0 ? (losses / initial) * 100 : 0;

  return (
    <Modal open={open} onClose={onClose} title={'📜 تاریخچه • ' + flock.name}>
      <div style={{
        padding: 'var(--pad-normal)',
        background: 'var(--accent-soft)',
        border: '1px solid var(--accent-border)',
        borderRadius: 'var(--r-md)',
        marginBottom: 'var(--sp-3)',
        display: 'flex',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 'var(--sp-2)',
        fontSize: 'var(--fs-sm)',
      }}>
        <span>موجودی: <b>{toFa(current)}</b> از {toFa(initial)}</span>
        {losses > 0 && (
          <span style={{ color: lossesPct > 5 ? 'var(--danger)' : 'var(--warn)', fontWeight: 700 }}>
            تلفات کل: {toFa(losses)} ({toFa(lossesPct.toFixed(1))}٪)
          </span>
        )}
      </div>

      {!correctionOpen ? (
        <div style={{ marginBottom: 'var(--sp-3)' }}>
          <Btn size="sm" onClick={() => setCorrectionOpen(true)} style={{ width: '100%' }}>
            ✏️ ثبت اصلاح
          </Btn>
        </div>
      ) : (
        <div style={{
          marginBottom: 'var(--sp-3)',
          padding: 'var(--pad-normal)',
          background: 'var(--warn-soft)',
          border: '1px solid var(--warn)',
          borderRadius: 'var(--r-md)',
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--sp-2)',
        }}>
          <div style={{ fontWeight: 700, color: 'var(--warn)', fontSize: 'var(--fs-sm)' }}>
            ✏️ ثبت اصلاح
          </div>
          <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--muted)', lineHeight: 1.6 }}>
            عدد مثبت = افزودن، عدد منفی = کسر
          </div>
          <Grid2>
            <Field label="تغییر تعداد" required>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--input-bg)', border: '1px solid var(--border)', borderRadius: 'var(--r-md)', padding: '0 12px', height: 38 }}>
                <input
                  type="text"
                  value={delta}
                  onChange={e => setDelta(e.target.value)}
                  placeholder="مثلاً +۵ یا -۳"
                  dir="ltr"
                  style={{ flex: 1, width: '100%', minWidth: 0, background: 'none', border: 'none', outline: 'none', color: 'var(--text)', fontFamily: 'inherit', fontSize: 'var(--fs-base)', textAlign: 'center' }}
                />
                <span style={{ fontSize: 'var(--fs-sm)', color: 'var(--dim)', flexShrink: 0 }}>پرنده</span>
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
                style={{ flex: 1, width: '100%', minWidth: 0, background: 'none', border: 'none', outline: 'none', color: 'var(--text)', fontFamily: 'inherit', fontSize: 'var(--fs-base)' }}
              />
            </div>
          </Field>
          {validationError && (
            <div style={{
              padding: 'var(--pad-tight)',
              background: 'var(--danger-soft)',
              border: '1px solid var(--danger)',
              borderRadius: 'var(--r-sm)',
              color: 'var(--danger)',
              fontSize: 'var(--fs-xs)',
              fontWeight: 600,
            }}>
              ⚠️ {validationError}
            </div>
          )}
          <div style={{ display: 'flex', gap: 'var(--sp-2)' }}>
            <Btn size="sm" variant="primary" onClick={handleSaveCorrection} style={{ flex: 1 }}>ثبت</Btn>
            <Btn size="sm" onClick={() => { setCorrectionOpen(false); setDelta(''); setNotes(''); setValidationError(''); }} style={{ flex: 1 }}>لغو</Btn>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', gap: 'var(--sp-1)', marginBottom: 'var(--sp-3)', flexWrap: 'wrap' }}>
        <FilterBtn active={filter === 'all'} onClick={() => setFilter('all')}>
          همه ({toFa(events.length)})
        </FilterBtn>
        {(['death', 'sell', 'correction'] as FlockEventType[]).map(t => {
          const n = events.filter(e => e.type === t).length;
          if (n === 0) return null;
          return (
            <FilterBtn key={t} active={filter === t} onClick={() => setFilter(t)}>
              {TYPE_INFO[t].icon} {TYPE_INFO[t].label} ({toFa(n)})
            </FilterBtn>
          );
        })}
      </div>

      {filtered.length === 0 ? (
        <div style={{ padding: 'var(--pad-loose)', textAlign: 'center', color: 'var(--muted)', fontSize: 'var(--fs-sm)' }}>
          <div style={{ fontSize: 40, marginBottom: 'var(--sp-2)' }}>📜</div>
          <div>هنوز رویدادی ثبت نشده</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {filtered.map(e => {
            const info = TYPE_INFO[e.type] || { icon: '•', label: e.type, tone: 'var(--muted)' };
            return (
              <div key={e.id} style={{
                padding: '6px 10px',
                background: 'var(--input-bg)',
                borderRight: '3px solid ' + info.tone,
                borderRadius: 'var(--r-sm)',
                display: 'flex',
                flexDirection: 'column',
                gap: 2,
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 'var(--sp-2)' }}>
                  <span style={{ fontWeight: 700, color: info.tone, fontSize: 'var(--fs-sm)' }}>
                    {info.icon} {info.label}
                  </span>
                  <span style={{ fontFamily: 'monospace', opacity: 0.8, fontSize: 10 }}>
                    {toFa(e.date)}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 'var(--sp-2)', fontSize: 'var(--fs-xs)' }}>
                  <span><b>{toFa(e.count)}</b> پرنده</span>
                  {e.sex !== 'mixed' && (
                    <span style={{ opacity: 0.7 }}>
                      {e.sex === 'male' ? 'نر' : 'ماده'}
                    </span>
                  )}
                </div>
                {e.reason && (
                  <div style={{ fontSize: 10, color: 'var(--muted)' }}>
                    {e.reason}
                  </div>
                )}
                {e.notes && (
                  <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--dim)' }}>{e.notes}</div>
                )}
                {e.type !== 'add' && !e.linkedEventId && !revokedIds.has(e.id) && (
                  <button
                    type="button"
                    onClick={() => handleRevoke(e.id, info.label + ' ' + toFa(e.count) + ' پرنده')}
                    style={{
                      padding: '2px 8px',
                      fontSize: 10,
                      fontWeight: 600,
                      background: 'transparent',
                      border: '1px solid var(--border)',
                      borderRadius: 'var(--r-sm)',
                      color: 'var(--muted)',
                      cursor: 'pointer',
                      fontFamily: 'inherit',
                      alignSelf: 'flex-start',
                    }}
                  >
                    ↩️ لغو
                  </button>
                )}
                {e.linkedEventId && (
                  <div style={{ fontSize: 10, color: 'var(--muted)', fontStyle: 'italic' }}>
                    ↩️ لغو رویداد
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <BtnRow>
        <Btn variant="primary" onClick={onClose}>بستن</Btn>
      </BtnRow>
    </Modal>
  );
}

function FilterBtn({ active, onClick, children }: { active: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        padding: '4px 10px',
        fontSize: 'var(--fs-xs)',
        fontWeight: 600,
        borderRadius: 'var(--r-sm)',
        border: '1px solid ' + (active ? 'var(--accent)' : 'var(--border)'),
        background: active ? 'var(--accent-soft)' : 'transparent',
        color: active ? 'var(--accent)' : 'var(--muted)',
        cursor: 'pointer',
        fontFamily: 'inherit',
      }}
    >
      {children}
    </button>
  );
}
