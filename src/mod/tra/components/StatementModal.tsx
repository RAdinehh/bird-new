/**
 * StatementModal.tsx — صورت‌حساب طرف حساب
 * استاندارد: SAP FBL5N (Customer Line Item Display)
 */
import { useState, useMemo } from 'react';
import { Modal, Btn, BtnRow, ModalFooter, Field, Grid2, Select } from '../../../shr/components/ui';
import DatePicker from '../../../shr/components/DatePicker';
import { useTra, computeDealBalance, DEAL_LABEL } from '../store';
import { useCtc } from '../../ctc/store';
import { useSet } from '../../set/store';
import { toFa } from '../../../shr/utils/fa';
import { printHTML } from '../../../shr/utils/export';
import { getTodayJalali } from '../calc';

interface Props {
  open: boolean;
  onClose: () => void;
}

interface StatementLine {
  date: string;
  type: 'invoice' | 'payment';
  description: string;
  debit: number;
  credit: number;
  balance: number;
}

export default function StatementModal({ open, onClose }: Props) {
  const { invoices, deals } = useTra();
  const { contacts } = useCtc();
  const settings: any = useSet();

  const [partyId, setPartyId] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState(getTodayJalali());

  const parties = useMemo(
    () => contacts.filter(c => c.roles.includes('customer') || c.roles.includes('supplier')),
    [contacts],
  );

  const party = contacts.find(c => c.id === partyId);

  const lines = useMemo<StatementLine[]>(() => {
    if (!partyId) return [];
    const raw: Omit<StatementLine, 'balance'>[] = [];

    // ─── Invoices ───
    for (const inv of invoices) {
      if (inv.partyId !== partyId) continue;
      if (fromDate && inv.date < fromDate) continue;
      if (toDate && inv.date > toDate) continue;

      raw.push({
        date: inv.date,
        type: 'invoice',
        description: `فاکتور ${inv.number || inv.id.slice(0, 6)} (${inv.type === 'sale' ? 'فروش' : 'خرید'})`,
        debit: inv.total,
        credit: 0,
      });

      for (const p of (inv.payments || [])) {
        raw.push({
          date: p.date,
          type: 'payment',
          description: `پرداخت فاکتور ${inv.number || ''} (${p.method === 'cash' ? 'نقدی' : p.method === 'card' ? 'کارت' : 'چک'})`,
          debit: 0,
          credit: p.amount,
        });
      }
    }

    // ─── Deals (فقط اگر به فاکتور تبدیل نشدن) ───
    const invoicedDealIds = new Set(
      invoices.filter(i => i.relatedDealId).map(i => i.relatedDealId as string),
    );

    for (const deal of deals) {
      if (deal.partyId !== partyId) continue;
      if (invoicedDealIds.has(deal.id)) continue;
      if (fromDate && deal.date < fromDate) continue;
      if (toDate && deal.date > toDate) continue;

      const bal = computeDealBalance(deal);
      if (bal.totalSales > 0) {
        raw.push({
          date: deal.date,
          type: 'invoice',
          description: `معامله ${deal.dealNumber || ''} (${DEAL_LABEL[deal.type]})`,
          debit: bal.totalSales,
          credit: 0,
        });
      }

      for (const p of (deal.payments || [])) {
        raw.push({
          date: p.date,
          type: 'payment',
          description: `پرداخت معامله (${p.direction === 'in' ? 'دریافت' : 'پرداخت'})`,
          debit: p.direction === 'out' ? p.amount : 0,
          credit: p.direction === 'in' ? p.amount : 0,
        });
      }
    }

    // Sort by date + running balance
    raw.sort((a, b) => a.date.localeCompare(b.date));
    let running = 0;
    return raw.map(l => {
      running += l.debit - l.credit;
      return { ...l, balance: running };
    });
  }, [invoices, deals, partyId, fromDate, toDate]);

  const totalDebit = lines.reduce((s, l) => s + l.debit, 0);
  const totalCredit = lines.reduce((s, l) => s + l.credit, 0);
  const netBalance = totalDebit - totalCredit;

  const buildHTML = (): string => {
    const farmName = settings?.farm?.name || 'مرغداری';
    const farmAddr = settings?.farm?.address || '';
    const farmPhone = settings?.farm?.phone || '';

    const rows = lines.map(l => `
      <tr>
        <td>${toFa(l.date)}</td>
        <td>${l.description}</td>
        <td style="color:#dc2626;text-align:left">${l.debit > 0 ? '+' + toFa(l.debit.toLocaleString('fa-IR')) : ''}</td>
        <td style="color:#16a34a;text-align:left">${l.credit > 0 ? '-' + toFa(l.credit.toLocaleString('fa-IR')) : ''}</td>
        <td style="text-align:left;font-weight:600">${toFa(l.balance.toLocaleString('fa-IR'))}</td>
      </tr>
    `).join('');

    return `
      <!DOCTYPE html>
      <html dir="rtl" lang="fa">
      <head>
        <meta charset="UTF-8">
        <title>صورت‌حساب ${party?.name || ''}</title>
        <style>
          @import url('https://cdn.jsdelivr.net/gh/rastikerdar/vazirmatn@v33.003/Vazirmatn-font-face.css');
          * { box-sizing: border-box; }
          body { font-family: Vazirmatn, sans-serif; direction: rtl; padding: 24px; font-size: 12px; color: #0f172a; }
          h1 { font-size: 18px; margin: 0 0 4px; color: #16a34a; }
          h2 { font-size: 14px; margin: 16px 0 4px; }
          .header { border-bottom: 2px solid #16a34a; padding-bottom: 10px; margin-bottom: 16px; }
          .meta { font-size: 11px; color: #64748b; }
          table { width: 100%; border-collapse: collapse; margin-top: 12px; }
          th { background: #f1f5f9; padding: 8px; text-align: right; border-bottom: 2px solid #cbd5e1; font-weight: 700; }
          td { padding: 6px 8px; border-bottom: 1px solid #e2e8f0; }
          .summary { margin-top: 16px; padding: 12px; background: #f1f5f9; border-radius: 8px; }
          .summary-row { display: flex; justify-content: space-between; padding: 4px 0; }
          .summary-total { font-weight: 700; font-size: 14px; border-top: 2px solid #cbd5e1; padding-top: 8px; margin-top: 8px; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>${farmName}</h1>
          <div class="meta">${farmAddr}${farmPhone ? ' • ' + farmPhone : ''}</div>
        </div>
        <h2>صورت‌حساب: ${party?.name || ''}</h2>
        <div class="meta">
          بازه: ${toFa(fromDate || '—')} تا ${toFa(toDate || '—')}
          ${party?.phone ? ' • تلفن: ' + party.phone : ''}
        </div>
        <table>
          <thead>
            <tr>
              <th>تاریخ</th><th>شرح</th><th>بدهی</th><th>پرداخت</th><th>مانده</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
        <div class="summary">
          <div class="summary-row"><span>مجموع بدهی:</span><span>${toFa(totalDebit.toLocaleString('fa-IR'))} تومان</span></div>
          <div class="summary-row"><span>مجموع پرداخت:</span><span>${toFa(totalCredit.toLocaleString('fa-IR'))} تومان</span></div>
          <div class="summary-row summary-total"><span>مانده نهایی:</span><span>${toFa(Math.abs(netBalance).toLocaleString('fa-IR'))} تومان</span></div>
        </div>
      </body>
      </html>
    `;
  };

  const handlePrint = () => {
    if (!party || lines.length === 0) return;
    printHTML(buildHTML());
  };

  return (
    <Modal open={open} onClose={onClose} title="📄 صورت‌حساب طرف حساب" size="lg">
      <Grid2>
        <Field label="طرف حساب" required>
          <Select value={partyId} onChange={e => setPartyId(e.target.value)}>
            <option value="">— انتخاب —</option>
            {parties.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </Select>
        </Field>
        <Field label="از تاریخ">
          <DatePicker value={fromDate} onChange={setFromDate} />
        </Field>
      </Grid2>
      <Field label="تا تاریخ">
        <DatePicker value={toDate} onChange={setToDate} autoToday />
      </Field>

      {partyId && lines.length === 0 && (
        <div style={{ padding: 24, textAlign: 'center', color: 'var(--muted)', fontSize: 'var(--fs-sm)' }}>
          تراکنشی در این بازه برای این طرف حساب وجود ندارد.
        </div>
      )}

      {partyId && lines.length > 0 && (
        <>
          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8,
            padding: 'var(--pad-normal)', background: 'var(--input-bg)',
            borderRadius: 'var(--r-sm)', marginTop: 8, marginBottom: 12, fontSize: 'var(--fs-sm)',
          }}>
            <div>
              <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--muted)' }}>مجموع بدهی</div>
              <div style={{ fontWeight: 700, color: 'var(--danger)' }}>{toFa(totalDebit.toLocaleString('fa-IR'))} ت</div>
            </div>
            <div>
              <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--muted)' }}>مجموع پرداخت</div>
              <div style={{ fontWeight: 700, color: 'var(--accent)' }}>{toFa(totalCredit.toLocaleString('fa-IR'))} ت</div>
            </div>
            <div>
              <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--muted)' }}>مانده نهایی</div>
              <div style={{ fontWeight: 700, color: netBalance > 0 ? 'var(--danger)' : 'var(--accent)' }}>
                {toFa(Math.abs(netBalance).toLocaleString('fa-IR'))} ت
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {lines.map((l, i) => (
              <div
                key={i}
                style={{
                  display: 'flex', flexDirection: 'column', gap: 4,
                  padding: '8px', borderBottom: '1px solid var(--border)',
                  fontSize: 'var(--fs-sm)',
                }}
              >
                {/* خط اول: شرح + تاریخ */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontWeight: 600, color: 'var(--text)', flex: 1, wordBreak: 'break-word' }}>
                    {l.description}
                  </span>
                  <span style={{ color: 'var(--muted)', fontSize: 'var(--fs-xs)', flexShrink: 0 }}>
                    {toFa(l.date)}
                  </span>
                </div>

                {/* خط دوم: بدهی، پرداخت، مانده */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 'var(--fs-xs)' }}>
                  <span style={{ color: 'var(--danger)', fontVariantNumeric: 'tabular-nums', width: 80 }}>
                    {l.debit > 0 ? '+' + toFa(l.debit.toLocaleString('fa-IR')) : ''}
                  </span>
                  <span style={{ color: 'var(--accent)', fontVariantNumeric: 'tabular-nums', width: 80, textAlign: 'center' }}>
                    {l.credit > 0 ? '-' + toFa(l.credit.toLocaleString('fa-IR')) : ''}
                  </span>
                  <span style={{ fontWeight: 700, fontVariantNumeric: 'tabular-nums', width: 80, textAlign: 'left' }}>
                    {toFa(l.balance.toLocaleString('fa-IR'))}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      <div style={{ marginTop: 'var(--sp-4)' }}>
        <ModalFooter actions={[
          { label: '📄 چاپ / PDF', role: 'primary', onClick: handlePrint, disabled: !partyId || lines.length === 0 },
          { label: 'بستن', role: 'secondary', onClick: onClose },
        ]} />
      </div>
    </Modal>
  );
}
