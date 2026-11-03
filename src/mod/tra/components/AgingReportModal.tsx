/**
 * AgingReportModal.tsx — گزارش Aging (تحلیل سنی بدهی/طلب)
 * استاندارد: SAP FBL5N
 */
import { useState, useMemo } from 'react';
import { Modal, ModalFooter, Field, Grid2 } from '../../../shr/components/ui';
import DatePicker from '../../../shr/components/DatePicker';
import { useTra, computeDealBalance, remaining, AGING_BUCKETS } from '../store';
import { agingBucketFromDue } from '../formulas';
import { useCtc } from '../../ctc/store';
import { useSet } from '../../set/store';
import { toFa } from '../../../shr/utils/fa';
import { toCSV, downloadCSV, printHTML } from '../../../shr/utils/export';
import { getTodayJalali } from '../calc';

interface Props {
  open: boolean;
  onClose: () => void;
}

interface AgingRow {
  kind: 'invoice' | 'deal';
  name: string;
  partyName: string;
  amount: number;
  bucket: string;
}

import type { AgingBucket } from '../calc';
type BucketKey = AgingBucket;

function bucketFromDate(dueDate: string, today: string): BucketKey {
  if (!dueDate) return 'current';
  try {
    const en = (s: string) => s.replace(/[۰-۹]/g, (x) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(x)));
    const [y, m, d] = en(dueDate).split('/').map(Number);
    const [ty, tm, td] = en(today).split('/').map(Number);
    const dueTime = new Date(y, m - 1, d).getTime();
    const todayTime = new Date(ty, tm - 1, td).getTime();
    const days = Math.floor((todayTime - dueTime) / 86400000);
    if (days <= 0) return 'current';
    if (days <= 30) return '1-30';
    if (days <= 60) return '31-60';
    if (days <= 90) return '61-90';
    if (days <= 180) return '91-180';
    if (days <= 365) return '181-365';
    return '+365';
  } catch {
    return 'current';
  }
}

export default function AgingReportModal({ open, onClose }: Props) {
  const { invoices, deals, allocations } = useTra();
  const { contacts } = useCtc();
  const settings: any = useSet();

  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState(getTodayJalali());

  const today = getTodayJalali();

  const rows = useMemo<AgingRow[]>(() => {
    const raw: AgingRow[] = [];

    // ─── Invoices ───
    for (const inv of invoices) {
      const rem = remaining(inv, allocations);
      if (rem <= 0) continue;
      if (fromDate && inv.date < fromDate) continue;
      if (toDate && inv.date > toDate) continue;
      const party = contacts.find((c) => c.id === inv.partyId);
      const bucket = inv.dueDate ? agingBucketFromDue(inv) : bucketFromDate(inv.date, today);
      raw.push({
        kind: 'invoice',
        name: `${inv.type === 'sale' ? 'فروش' : 'خرید'} ${inv.number || inv.id.slice(0, 6)}`,
        partyName: party?.name || '—',
        amount: rem,
        bucket,
      });
    }

    // ─── Deals (فقط باز) ───
    const invoicedDealIds = new Set(
      invoices.filter((i) => i.relatedDealId).map((i) => i.relatedDealId as string),
    );
    for (const d of deals) {
      if (d.status !== 'open') continue;
      if (invoicedDealIds.has(d.id)) continue;
      if (fromDate && d.date < fromDate) continue;
      if (toDate && d.date > toDate) continue;
      const bal = computeDealBalance(d).balance;
      if (Math.abs(bal) < 0.01) continue;
      const party = contacts.find((c) => c.id === d.partyId);
      const bucket = bucketFromDate(d.dueDate || d.date, today);
      raw.push({
        kind: 'deal',
        name: `معامله ${d.dealNumber || d.id.slice(0, 6)}`,
        partyName: party?.name || '—',
        amount: Math.abs(bal),
        bucket,
      });
    }

    return raw;
  }, [invoices, deals, allocations, contacts, fromDate, toDate, today]);

  const bucketSummary = useMemo(() => {
    const map: Record<BucketKey, { count: number; sum: number }> = {
      'current': { count: 0, sum: 0 },
      '1-30': { count: 0, sum: 0 },
      '31-60': { count: 0, sum: 0 },
      '61-90': { count: 0, sum: 0 },
      '91-180': { count: 0, sum: 0 },
      '181-365': { count: 0, sum: 0 },
      '+365': { count: 0, sum: 0 },
    };
    for (const r of rows) {
      const k = r.bucket as BucketKey;
      if (map[k]) {
        map[k].count += 1;
        map[k].sum += r.amount;
      }
    }
    return map;
  }, [rows]);

  const totalCount = rows.length;
  const totalSum = rows.reduce((s, r) => s + r.amount, 0);

  const handleCSV = () => {
    const headers = ['ردیف', 'نوع', 'نام', 'طرف حساب', 'مبلغ (تومان)', 'باکت'];
    const data = rows.map((r, i) => [
      i + 1,
      r.kind === 'invoice' ? 'فاکتور' : 'معامله',
      r.name,
      r.partyName,
      r.amount,
      r.bucket,
    ]);
    const csv = toCSV(headers, data);
    downloadCSV('aging-report', csv);
  };

  const handlePrint = () => {
    const farmName = settings?.farm?.name || 'مرغداری';
    const bucketRows = AGING_BUCKETS.map((b) => {
      const k = b.key as BucketKey;
      const s = bucketSummary[k];
      return `<tr><td>${b.label}</td><td>${toFa(s.count)}</td><td>${toFa(s.sum.toLocaleString('fa-IR'))}</td></tr>`;
    }).join('');

    const html = `<!DOCTYPE html>
<html dir="rtl" lang="fa"><head><meta charset="UTF-8"><title>گزارش Aging</title>
<style>
@import url('https://cdn.jsdelivr.net/gh/rastikerdar/vazirmatn@v33.003/Vazirmatn-font-face.css');
body { font-family: Vazirmatn, sans-serif; direction: rtl; padding: 24px; font-size: 12px; color: #0f172a; }
h1 { color: #16a34a; font-size: 18px; margin: 0 0 4px; }
.header { border-bottom: 2px solid #16a34a; padding-bottom: 10px; margin-bottom: 16px; }
.meta { color: #64748b; font-size: 11px; }
table { width: 100%; border-collapse: collapse; margin-top: 16px; }
th { background: #f1f5f9; padding: 8px; text-align: right; border-bottom: 2px solid #cbd5e1; }
td { padding: 6px 8px; border-bottom: 1px solid #e2e8f0; }
.total { font-weight: 700; background: #f1f5f9; }
</style></head><body>
<div class="header"><h1>${farmName}</h1><div class="meta">گزارش Aging — تحلیل سنی بدهی/طلب</div></div>
<div class="meta">بازه: ${toFa(fromDate || '—')} تا ${toFa(toDate || '—')} | مجموع: ${toFa(totalCount)} مورد — ${toFa(totalSum.toLocaleString('fa-IR'))} تومان</div>
<table>
<thead><tr><th>باکت</th><th>تعداد</th><th>مجموع (تومان)</th></tr></thead>
<tbody>${bucketRows}<tr class="total"><td>مجموع کل</td><td>${toFa(totalCount)}</td><td>${toFa(totalSum.toLocaleString('fa-IR'))}</td></tr></tbody>
</table>
</body></html>`;
    printHTML(html);
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="📊 گزارش Aging"
      size="lg"
      footer={
        <ModalFooter actions={[
          { label: '📥 CSV', role: 'primary', onClick: handleCSV, disabled: rows.length === 0 },
          { label: '📄 چاپ', role: 'secondary', onClick: handlePrint, disabled: rows.length === 0 },
          { label: 'بستن', role: 'secondary', onClick: onClose },
        ]} />
      }
    >
      <Grid2>
        <Field label="از تاریخ">
          <DatePicker value={fromDate} onChange={setFromDate} />
        </Field>
        <Field label="تا تاریخ">
          <DatePicker value={toDate} onChange={setToDate} autoToday />
        </Field>
      </Grid2>

      {rows.length === 0 ? (
        <div style={{ padding: 24, textAlign: 'center', color: 'var(--muted)', fontSize: 'var(--fs-sm)' }}>
          تراکنشی در این بازه وجود ندارد.
        </div>
      ) : (
        <>
          <div style={{ marginTop: 8, marginBottom: 8, fontSize: 'var(--fs-xs)', color: 'var(--muted)' }}>
            مجموع: {toFa(totalCount)} مورد — {toFa(totalSum.toLocaleString('fa-IR'))} تومان
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 'var(--fs-sm)' }}>
            <thead>
              <tr style={{ background: 'var(--input-bg)' }}>
                <th style={{ padding: 8, textAlign: 'right' }}>باکت</th>
                <th style={{ padding: 8, textAlign: 'center' }}>تعداد</th>
                <th style={{ padding: 8, textAlign: 'left' }}>مجموع (تومان)</th>
              </tr>
            </thead>
            <tbody>
              {AGING_BUCKETS.map((b) => {
                const k = b.key as BucketKey;
                const s = bucketSummary[k];
                return (
                  <tr key={b.key} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: 6, color: `var(--${b.color})`, fontWeight: 600 }}>{b.label}</td>
                    <td style={{ padding: 6, textAlign: 'center', fontVariantNumeric: 'tabular-nums' }}>{toFa(s.count)}</td>
                    <td style={{ padding: 6, textAlign: 'left', fontVariantNumeric: 'tabular-nums' }}>
                      {toFa(s.sum.toLocaleString('fa-IR'))}
                    </td>
                  </tr>
                );
              })}
              <tr style={{ background: 'var(--accent-soft)', fontWeight: 700 }}>
                <td style={{ padding: 8 }}>مجموع</td>
                <td style={{ padding: 8, textAlign: 'center' }}>{toFa(totalCount)}</td>
                <td style={{ padding: 8, textAlign: 'left' }}>{toFa(totalSum.toLocaleString('fa-IR'))}</td>
              </tr>
            </tbody>
          </table>
        </>
      )}

      </Modal>
  );
}
