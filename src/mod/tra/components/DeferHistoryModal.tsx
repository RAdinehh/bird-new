/**
 * DeferHistoryModal — تاریخچه تعویق‌ها (UI Final)
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
  kind?: 'invoice' | 'deal';
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

export default function DeferHistoryModal({ open, onClose, deferrals, invoiceNumber, kind = 'invoice', onVoidLatest }: Props) {
  if (!open) return null;
  const list = deferrals || [];
  const label = kind === 'deal' ? 'معامله' : 'فاکتور';

  return (
    <Modal open={open} onClose={onClose} title="📋 تاریخچه تعویق‌ها" size="md"
      footer={<BtnRow><Btn onClick={onClose}>بستن</Btn></BtnRow>}
    >
      <div style={{ fontSize: 'var(--fs-sm)', color: 'var(--muted)', marginBottom: 8 }}>
        {label}: {invoiceNumber}
      </div>

      {list.length === 0 ? (
        <Empty icon="📭" title="تاریخچه‌ای وجود ندارد" desc="تاکنون تعویقی ثبت نشده است." />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {list.slice().reverse().map((d, idx) => {
            const isLatest = idx === 0;
            const delta = daysBetween(d.fromDate, d.toDate);
            const hasReason = d.reason && d.reason.trim() !== '' && d.reason !== '—';

            return (
              <div key={d.id} style={{ padding: '8px 12px', background: 'var(--card-solid, #fff)', borderRadius: 'var(--r-sm)', border: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                {/* بخش راست: اطلاعات */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 3, flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 'var(--fs-sm)', fontWeight: 700, color: 'var(--text)' }}>
                    از {toFa(d.fromDate)} به {toFa(d.toDate)}
                  </div>
                  {delta !== null && (
                    <div style={{ fontSize: 'var(--fs-xs)', fontWeight: 600, color: delta < 0 ? 'var(--danger)' : 'var(--accent)' }}>
                      {delta < 0 ? '⚠️ ' : ''}{toFa(Math.abs(delta))} روز
                    </div>
                  )}
                  {hasReason && (
                    <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--text)' }}>📝 {d.reason}</div>
                  )}
                  <div style={{ fontSize: 'var(--fs-2xs)', color: 'var(--dim)' }}>🕒 ثبت: {toJalaliDate(d.createdAt)}</div>
                </div>

                {/* بخش چپ: دکمه حذف (سطل زباله) */}
                {isLatest && onVoidLatest && (
                  <button
                    type="button"
                    onClick={onVoidLatest}
                    title="حذف آخرین تعویق"
                    style={{ background: 'transparent', border: 'none', color: 'var(--danger)', fontSize: 'var(--fs-md)', cursor: 'pointer', fontFamily: 'inherit', padding: 2, flexShrink: 0, display: 'flex', alignItems: 'flex-start', marginTop: 2 }}
                  >
                    🗑️
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </Modal>
  );
}
