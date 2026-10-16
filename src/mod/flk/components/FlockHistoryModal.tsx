/**
 * FlockHistoryModal.tsx — تاریخچه رویدادهای گله
 */
import { useState, type ReactNode } from 'react';
import { Modal, Btn, BtnRow } from '../../../shr/components/ui';
import type { Flock, FlockEventType } from '../store';
import { toFa } from '../../../shr/utils/fa';

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
  const events = (flock.events || []).slice().sort((a, b) => (b.date || '').localeCompare(a.date || ''));
  const filtered = filter === 'all' ? events : events.filter(e => e.type === filter);

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
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-2)' }}>
          {filtered.map(e => {
            const info = TYPE_INFO[e.type] || { icon: '•', label: e.type, tone: 'var(--muted)' };
            return (
              <div key={e.id} style={{
                padding: 'var(--pad-normal)',
                background: 'var(--input-bg)',
                borderRight: '3px solid ' + info.tone,
                borderRadius: 'var(--r-sm)',
                display: 'flex',
                flexDirection: 'column',
                gap: 4,
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 'var(--sp-2)' }}>
                  <span style={{ fontWeight: 700, color: info.tone }}>
                    {info.icon} {info.label}
                  </span>
                  <span style={{ fontFamily: 'monospace', opacity: 0.8, fontSize: 'var(--fs-xs)' }}>
                    {toFa(e.date)}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 'var(--sp-2)' }}>
                  <span><b>{toFa(e.count)}</b> پرنده</span>
                  {e.sex !== 'mixed' && (
                    <span style={{ opacity: 0.7, fontSize: 'var(--fs-xs)' }}>
                      {e.sex === 'male' ? 'نر' : 'ماده'}
                    </span>
                  )}
                </div>
                {e.reason && (
                  <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--muted)' }}>
                    <b>دلیل:</b> {e.reason}
                  </div>
                )}
                {e.notes && (
                  <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--dim)' }}>{e.notes}</div>
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
