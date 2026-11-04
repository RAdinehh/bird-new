/**
 * DeferHistoryModal — تاریخچه تعویق‌ها (Audit Trail)
 */
import { Modal, Btn, BtnRow, Empty } from '../../../shr/components/ui';
import { toFa } from '../../../shr/utils/fa';
import type { Deferral } from '../types';
import { format as formatJ, parse as parseJ, differenceInCalendarDays } from 'date-fns-jalali';

interface Props {
  open: boolean;
  onClose: () => void;
  deferrals: Deferral[] | undefined;
  invoiceNumber: string;
  onVoidLatest?: () => void;
}

function daysBetween(from: string, to: string): number | null {
  try {
    const en = (s: string) => s.replace(/[۰-۹]/g, d => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d)));
    const fromD = parseJ(en(from), 'yyyy/MM/dd', new Date());
    const toD = parseJ(en(to), 'yyyy/MM/dd', new Date());
    if (isNaN(fromD.getTime()) || isNaN(toD.getTime())) return null;
    return differenceInCalendarDays(toD, fromD);
  } catch { return null; }
}

function toJalaliDate(iso: string | undefined): string {
  if (!iso) return '—';
  try {
    const d = new Date(iso);
    if (isNaN(d.getTime())) return toFa(iso);
    return toFa(formatJ(d, 'yyyy/MM/dd'));
  } catch { return toFa(iso || '—'); }
}

export default function DeferHistoryModal({ open, onClose, deferrals, invoiceNumber, onVoidLatest }: Props) {
  if (!open) return null;
  const list = deferrals || [];

  return (
    <Modal open={open} onClose={onClose} title="📋 تاریخچه تعویق‌ها" size="md"
      footer={<BtnRow><Btn onClick={onClose}>بستن</Btn></BtnRow>}
    >
      <div style={{ fontSize: 'var(--fs-sm)', color: 'var(--muted)', marginBottom: 8 }}>
        فاکتور: {invoiceNumber}
      </div>
      {list.length === 0 ? (
        <Empty icon="📭" title="تاریخچه‌ای وجود ندارد" desc="تاکنون تعویقی ثبت نشده است." />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {list.slice().reverse().map((d, idx) => {
            const isLatest = idx === 0;
            const delta = daysBetween(d.fromDate, d.toDate);
            return (
              <div key={d.id} style={{ padding: '8px 12px', background: 'var(--input-bg)', borderRadius: 'var(--r-sm)', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: 4 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 'var(--fs-sm)', fontWeight: 700, color: 'var(--text)', flex: 1, minWidth: 0 }}>
                    🗓️ {toFa(d.fromDate)} ← {toFa(d.toDate)}
                    {delta !== null && (
                      <span style={{ fontSize: 'var(--fs-xs)', fontWeight: 600, color: 'var(--accent)', marginRight: 8 }}>
                        ({toFa(delta)} روز)
                      </span>
                    )}
                  </span>
                  {isLatest && onVoidLatest && (
                    <button
                      type="button"
                      onClick={onVoidLatest}
                      style={{ background: 'transparent', border: 'none', color: 'var(--danger)', fontSize: 'var(--fs-xs)', cursor: 'pointer', textDecoration: 'underline', fontFamily: 'inherit', flexShrink: 0, padding: 0 }}
                    >
                      🗑️ حذف
                    </button>
                  )}
                </div>
                <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--muted)' }}>📝 {d.reason || '—'}</div>
                <div style={{ fontSize: 'var(--fs-2xs)', color: 'var(--dim)' }}>🕒 ثبت: {toJalaliDate(d.createdAt)}</div>
              </div>
            );
          })}
        </div>
      )}
    </Modal>
  );
}
