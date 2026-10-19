/**
 * WithdrawalModal — نمایش وضعیت دوره پرهیز دارو
 * فقط-خواندنی. برای ویرایش از «ثبت روزانه» استفاده می‌شود.
 */
import { useMemo } from 'react';
import { Modal, Btn, BtnRow, Tag, Empty } from '../../../shr/components/ui';
import { toFa } from '../../../shr/utils/fa';
import { useFlk, type Flock } from '../store';
import { parse as parseJ, differenceInCalendarDays as diffCalDays, startOfDay } from 'date-fns-jalali';

function daysUntil(dateStr: string | undefined): number | null {
  if (!dateStr) return null;
  try {
    const en = dateStr.replace(/[۰-۹]/g, (d: string) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d)));
    const target = parseJ(en, 'yyyy/MM/dd', new Date());
    if (isNaN(target.getTime())) return null;
    return diffCalDays(startOfDay(target), startOfDay(new Date()));
  } catch {
    return null;
  }
}

interface Props {
  open: boolean;
  onClose: () => void;
}

type Item = { flock: Flock; aw: NonNullable<Flock['activeWithdrawal']>; daysLeft: number };

export default function WithdrawalModal({ open, onClose }: Props) {
  const flocks = useFlk(s => s.flocks);

  const items: Item[] = useMemo(() => {
    const result: Item[] = [];
    for (const f of flocks) {
      if (!f.activeWithdrawal || !f.activeWithdrawal.until) continue;
      const d = daysUntil(f.activeWithdrawal.until);
      if (d === null || d < 0) continue;
      result.push({ flock: f, aw: f.activeWithdrawal, daysLeft: d });
    }
    result.sort((a, b) => a.daysLeft - b.daysLeft);
    return result;
  }, [flocks]);

  const urgentCount = items.filter(x => x.daysLeft <= 3).length;
  const nearestDays = items.length > 0 ? items[0].daysLeft : null;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="🩺 مدیریت دوره پرهیز"
      size="md"
      footer={<BtnRow><Btn onClick={onClose} full>بستن</Btn></BtnRow>}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-3)' }}>
        {items.length === 0 ? (
          <Empty
            icon={
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            }
            title="هیچ دوره پرهیز فعالی وجود ندارد"
            desc="همه گله‌ها آزاد هستند و می‌توانید بدون محدودیت بفروشید."
            tone="accent"
          />
        ) : (
          <>
            {/* KPI Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--sp-2)' }}>
              <div style={{
                padding: 'var(--sp-3)',
                background: 'var(--danger-soft)',
                border: '1px solid var(--danger)',
                borderRadius: 'var(--r-md)',
                display: 'flex', flexDirection: 'column', gap: 2,
                alignItems: 'center', textAlign: 'center',
              }}>
                <div style={{ fontSize: 'var(--fs-xl)', fontWeight: 700, color: 'var(--danger)', lineHeight: 1.2 }}>
                  {toFa(urgentCount)}
                </div>
                <div style={{ fontSize: 'var(--fs-2xs)', color: 'var(--muted)', fontWeight: 600 }}>
                  گله فوری (≤ ۳ روز)
                </div>
              </div>
              <div style={{
                padding: 'var(--sp-3)',
                background: 'var(--warn-soft)',
                border: '1px solid var(--warn)',
                borderRadius: 'var(--r-md)',
                display: 'flex', flexDirection: 'column', gap: 2,
                alignItems: 'center', textAlign: 'center',
              }}>
                <div style={{ fontSize: 'var(--fs-xl)', fontWeight: 700, color: 'var(--warn)', lineHeight: 1.2 }}>
                  {nearestDays !== null ? toFa(nearestDays) : '—'}
                </div>
                <div style={{ fontSize: 'var(--fs-2xs)', color: 'var(--muted)', fontWeight: 600 }}>
                  نزدیک‌ترین پایان (روز)
                </div>
              </div>
            </div>

            {/* Section Title */}
            <div style={{
              paddingTop: 'var(--sp-2)',
              paddingBottom: 'var(--sp-1)',
              borderBottom: '1px dashed var(--border)',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            }}>
              <span style={{ fontSize: 'var(--fs-base)', fontWeight: 700, color: 'var(--text)' }}>
                📋 گله‌های درگیر
              </span>
              <span style={{ fontSize: 'var(--fs-xs)', color: 'var(--muted)', fontWeight: 500 }}>
                {toFa(items.length)} گله
              </span>
            </div>

            {/* List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-1)' }}>
              {items.map(it => {
                const days = it.daysLeft;
                const tone = days <= 3 ? 'red' : days <= 7 ? 'amber' : 'green';
                return (
                  <div key={it.flock.id} style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    gap: 'var(--sp-2)',
                    padding: 'var(--sp-2) var(--sp-3)',
                    background: 'var(--input-bg)',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--r-sm)',
                  }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 2, flex: 1, minWidth: 0 }}>
                      <div style={{
                        fontSize: 'var(--fs-sm)', fontWeight: 700, color: 'var(--text)',
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                      }}>
                        {it.flock.name}
                      </div>
                      <div style={{
                        fontSize: 'var(--fs-xs)', color: 'var(--muted)',
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                      }}>
                        💊 {it.aw.medicine}
                      </div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4, flexShrink: 0 }}>
                      <Tag tone={tone}>⏱ {toFa(days)} روز</Tag>
                      <span style={{ fontSize: 'var(--fs-2xs)', color: 'var(--dim)' }}>
                        {toFa(it.aw.until)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </Modal>
  );
}
