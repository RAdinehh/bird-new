/**
 * SexingHistoryModal — تاریخچه تفکیک جنسیت گله
 * یک wrapper برای هر گروه + جداکننده بین eventها
 */
import { useMemo, useState } from 'react';
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

const VISIBLE_LIMIT = 10;

function fmt(n: number | undefined | null): string {
  return formatNumWhileTyping(String(n || 0)) || '۰';
}

export default function SexingHistoryModal({ open, onClose, flock }: Props) {
  const [showAll, setShowAll] = useState(false);

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

  const { visibleGroups, hiddenCount } = useMemo(() => {
    if (showAll) return { visibleGroups: groups, hiddenCount: 0 };
    let total = 0;
    const out: typeof groups = [];
    for (const g of groups) {
      if (total >= VISIBLE_LIMIT) break;
      out.push(g);
      total += g.items.length;
    }
    const visibleCount = out.reduce((s, g) => s + g.items.length, 0);
    const totalCount = groups.reduce((s, g) => s + g.items.length, 0);
    return { visibleGroups: out, hiddenCount: totalCount - visibleCount };
  }, [groups, showAll]);

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
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {visibleGroups.map(g => (
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

              {/* یک wrapper برای کل گروه با یک border */}
              <div style={{
                background: 'var(--input-bg)',
                borderRadius: 'var(--r-md)',
                border: '1px solid var(--border)',
                overflow: 'hidden',
              }}>
                {g.items.map(({ ev, prev }, idx) => {
                  const dM = prev ? ev.male - prev.male : 0;
                  const dF = prev ? ev.female - prev.female : 0;
                  const dU = prev ? ev.unknown - prev.unknown : 0;
                  const hasDelta = prev && (dM !== 0 || dF !== 0 || dU !== 0);
                  const srcInfo = SRC_LABEL[ev.source] || { label: ev.source, tone: 'gray' as const };
                  return (
                    <div
                      key={ev.id}
                      style={{
                        padding: '8px 10px',
                        borderTop: idx > 0 ? '1px dashed var(--border)' : 'none',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                        <Tag tone={srcInfo.tone}>{srcInfo.label}</Tag>
                      </div>

                      <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(3, 1fr)',
                        gap: 8,
                        textAlign: 'center',
                      }}>
                        <div>
                          <div style={{ color: 'var(--muted)', fontSize: 'var(--fs-xs)', marginBottom: 2 }}>نر</div>
                          <div style={{ fontWeight: 700, fontSize: 'var(--fs-sm)' }}>{fmt(ev.male)}</div>
                        </div>
                        <div>
                          <div style={{ color: 'var(--muted)', fontSize: 'var(--fs-xs)', marginBottom: 2 }}>ماده</div>
                          <div style={{ fontWeight: 700, fontSize: 'var(--fs-sm)' }}>{fmt(ev.female)}</div>
                        </div>
                        <div>
                          <div style={{ color: 'var(--muted)', fontSize: 'var(--fs-xs)', marginBottom: 2 }}>نامشخص</div>
                          <div style={{ fontWeight: 700, fontSize: 'var(--fs-sm)' }}>{fmt(ev.unknown)}</div>
                        </div>
                      </div>

                      {hasDelta && (
                        <div style={{
                          fontSize: 'var(--fs-xs)',
                          color: 'var(--info, #0284c7)',
                          paddingTop: 4,
                          marginTop: 6,
                          borderTop: '1px dashed var(--border)',
                        }}>
                          ⚠️ تفاوت با قبلی:
                          {dM !== 0 && ` نر ${dM > 0 ? '+' : ''}${toFa(dM)}`}
                          {dF !== 0 && ` · ماده ${dF > 0 ? '+' : ''}${toFa(dF)}`}
                          {dU !== 0 && ` · نامشخص ${dU > 0 ? '+' : ''}${toFa(dU)}`}
                        </div>
                      )}

                      {ev.note && (
                        <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--muted)', marginTop: 4 }}>
                          📝 {ev.note}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
          {hiddenCount > 0 && (
            <button
              type="button"
              onClick={() => setShowAll(true)}
              style={{
                padding: '10px',
                background: 'var(--input-bg)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--r-sm)',
                fontSize: 'var(--fs-sm)',
                color: 'var(--accent)',
                fontWeight: 600,
                cursor: 'pointer',
                fontFamily: 'inherit',
              }}
            >
              📜 نمایش {toFa(hiddenCount)} رویداد بیشتر
            </button>
          )}
        </div>
      )}
    </Modal>
  );
}
