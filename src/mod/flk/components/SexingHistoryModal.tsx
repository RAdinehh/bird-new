/**
 * SexingHistoryModal — تاریخچه تفکیک جنسیت گله
 * گروه‌بندی بر اساس تاریخ (match FlockHistoryModal)
 */
import { useMemo } from 'react';
import { Modal, Btn, BtnRow, Tag } from '../../../shr/components/ui';
import { useFlk, type Flock } from '../store';
import { toFa, formatNumWhileTyping } from '../../../shr/utils/fa';
import { todayJ } from '../api/flocksCalc';

interface Props {
  open: boolean;
  onClose: () => void;
  flock: Flock | null;
}

const SRC_LABEL: Record<string, { label: string; tone: 'green' | 'amber' | 'blue' | 'gray' }> = {
  purchase: { label: 'اولیه', tone: 'green' },
  partial: { label: 'جزئی', tone: 'amber' },
  final: { label: 'تکمیل', tone: 'green' },
  correction: { label: 'اصلاح', tone: 'blue' },
};

function fmt(n: number | undefined | null): string {
  return formatNumWhileTyping(String(n || 0)) || '۰';
}

export default function SexingHistoryModal({ open, onClose, flock }: Props) {
  const events = useMemo(() => {
    if (!flock) return [];
    return [...(flock.sexingEvents || [])].sort((a, b) => {
      const da = a.date || '';
      const db = b.date || '';
      if (da !== db) return da.localeCompare(db);
      return (a.createdAt || '').localeCompare(b.createdAt || '');
    });
  }, [flock]);

  const eventsWithMeta = useMemo(
    () => events.map((ev, idx) => ({ ev, prev: idx > 0 ? events[idx - 1] : null })),
    [events],
  );

  const groups = useMemo(() => {
    const today = todayJ();
    const map = new Map<string, typeof eventsWithMeta>();
    const order: string[] = [];
    for (const item of eventsWithMeta) {
      const key = item.ev.date === today ? 'امروز' : (item.ev.date || 'نامشخص');
      if (!map.has(key)) { map.set(key, []); order.push(key); }
      map.get(key)!.push(item);
    }
    return order.map(k => ({ label: k, items: map.get(k)! }));
  }, [eventsWithMeta]);

  if (!flock) return null;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="📅 تاریخچه تفکیک جنسیت"
      size="md"
      footer={<BtnRow><Btn onClick={onClose}>بستن</Btn></BtnRow>}
    >
      {groups.length === 0 ? (
        <div style={{ padding: 'var(--pad-normal)', textAlign: 'center', color: 'var(--muted)', fontSize: 'var(--fs-sm)' }}>
          هنوز تفکیکی برای این گله ثبت نشده است.
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
              }}>
                {g.label}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {g.items.map(({ ev, prev }) => {
                  const dM = prev ? ev.male - prev.male : 0;
                  const dF = prev ? ev.female - prev.female : 0;
                  const dU = prev ? ev.unknown - prev.unknown : 0;
                  const hasDelta = prev && (dM !== 0 || dF !== 0 || dU !== 0);
                  const srcInfo = SRC_LABEL[ev.source] || { label: ev.source, tone: 'gray' as const };
                  return (
                    <div key={ev.id} style={{
                      padding: 'var(--pad-normal)',
                      background: 'var(--input-bg)',
                      borderRadius: 'var(--r-md)',
                      border: '1px solid var(--border)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 6,
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontWeight: 700, fontSize: 'var(--fs-sm)' }}>
                          📅 {toFa(ev.date)}
                        </span>
                        <Tag tone={srcInfo.tone}>{srcInfo.label}</Tag>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 'var(--sp-1)' }}>
                        <div style={{ padding: 'var(--pad-tight)', background: 'var(--bg)', borderRadius: 'var(--r-sm)', fontSize: 'var(--fs-xs)' }}>
                          <div style={{ color: 'var(--muted)' }}>نر</div>
                          <div style={{ fontWeight: 700 }}>{fmt(ev.male)}</div>
                        </div>
                        <div style={{ padding: 'var(--pad-tight)', background: 'var(--bg)', borderRadius: 'var(--r-sm)', fontSize: 'var(--fs-xs)' }}>
                          <div style={{ color: 'var(--muted)' }}>ماده</div>
                          <div style={{ fontWeight: 700 }}>{fmt(ev.female)}</div>
                        </div>
                        <div style={{ padding: 'var(--pad-tight)', background: 'var(--bg)', borderRadius: 'var(--r-sm)', fontSize: 'var(--fs-xs)' }}>
                          <div style={{ color: 'var(--muted)' }}>نامشخص</div>
                          <div style={{ fontWeight: 700 }}>{fmt(ev.unknown)}</div>
                        </div>
                      </div>
                      {hasDelta && (
                        <div style={{
                          fontSize: 'var(--fs-xs)',
                          color: 'var(--info, #0284c7)',
                          padding: 'var(--pad-tight)',
                          background: 'var(--info-soft, rgba(2,132,199,.08))',
                          borderRadius: 'var(--r-sm)',
                        }}>
                          ⚠️ تفاوت با قبلی:
                          {dM !== 0 && ` نر ${dM > 0 ? '+' : ''}${toFa(dM)}`}
                          {dF !== 0 && ` • ماده ${dF > 0 ? '+' : ''}${toFa(dF)}`}
                          {dU !== 0 && ` • نامشخص ${dU > 0 ? '+' : ''}${toFa(dU)}`}
                        </div>
                      )}
                      {ev.note && (
                        <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--muted)' }}>
                          📝 {ev.note}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </Modal>
  );
}
