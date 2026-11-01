/**
 * StatementModal.tsx — صورت‌حساب طرف حساب
 * استاندارد: SAP FBL5N | Layout: 3-line mobile-friendly
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

type LineKind = 'invoice_sale' | 'invoice_purchase' | 'deal' | 'payment_cash' | 'payment_card' | 'payment_check';
type CheckStatus = 'pending' | 'cleared' | 'bounced';

interface StatementLine {
  date: string;
  kind: LineKind;
  docNumber?: string;
  checkNo?: string;
  bank?: string;
  dueDate?: string;
  checkStatus?: CheckStatus;
  description: string;
  debit: number;
  credit: number;
  balance: number;
}

const KIND_INFO: Record<LineKind, { icon: string; label: string; color: string }> = {
  invoice_sale: { icon: '📄', label: 'فاکتور فروش', color: 'var(--info)' },
  invoice_purchase: { icon: '🛒', label: 'فاکتور خرید', color: 'var(--info)' },
  deal: { icon: '🤝', label: 'معامله خاص', color: 'var(--purple)' },
  payment_cash: { icon: '💰', label: 'دریافت نقدی', color: 'var(--accent)' },
  payment_card: { icon: '💳', label: 'دریافت کارت', color: 'var(--accent)' },
  payment_check: { icon: '📝', label: 'دریافت چک', color: 'var(--accent)' },
};

const CHECK_INFO: Record<CheckStatus, { label: string; bg: string; color: string }> = {
  pending: { label: 'در انتظار', bg: 'var(--warn-soft)', color: 'var(--warn)' },
  cleared: { label: 'پاس شده', bg: 'var(--accent-soft)', color: 'var(--accent)' },
  bounced: { label: 'برگشتی', bg: 'var(--danger-soft)', color: 'var(--danger)' },
};

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

    for (const inv of invoices) {
      if (inv.partyId !== partyId) continue;
      if (fromDate && inv.date < fromDate) continue;
      if (toDate && inv.date > toDate) continue;

      raw.push({
        date: inv.date,
        kind: inv.type === 'sale' ? 'invoice_sale' : 'invoice_purchase',
        docNumber: inv.number || inv.id.slice(0, 6),
        description: inv.notes || '',
        debit: inv.total,
        credit: 0,
      });

      for (const p of (inv.payments || [])) {
        const kind: LineKind = p.method === 'cash' ? 'payment_cash' : p.method === 'card' ? 'payment_card' : 'payment_check';
        raw.push({
          date: p.date,
          kind,
          docNumber: inv.number || '',
          checkNo: p.method === 'check' ? p.checkNo : undefined,
          bank: p.method === 'check' ? p.bank : undefined,
          dueDate: p.method === 'check' ? p.dueDate : undefined,
          checkStatus: p.method === 'check' ? (p.status || 'pending') : undefined,
          description: p.notes || '',
          debit: 0,
          credit: p.amount,
        });
      }
    }

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
          kind: 'deal',
          docNumber: deal.dealNumber || '',
          description: deal.description || DEAL_LABEL[deal.type],
          debit: bal.totalSales,
          credit: 0,
        });
      }

      for (const p of (deal.payments || [])) {
        const kind: LineKind = p.method === 'cash' ? 'payment_cash' : p.method === 'card' ? 'payment_card' : 'payment_check';
        raw.push({
          date: p.date,
          kind,
          docNumber: deal.dealNumber || '',
          checkNo: p.method === 'check' ? p.checkNo : undefined,
          bank: p.method === 'check' ? p.bank : undefined,
          dueDate: p.method === 'check' ? p.dueDate : undefined,
          checkStatus: p.method === 'check' ? 'pending' : undefined,
          description: p.notes || (p.direction === 'in' ? 'دریافت از طرف' : 'پرداخت به طرف'),
          debit: p.direction === 'out' ? p.amount : 0,
          credit: p.direction === 'in' ? p.amount : 0,
        });
      }
    }

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

  const groupedLines = useMemo(() => {
    const days: Record<string, StatementLine[]> = {};
    lines.forEach(l => {
      if (!days[l.date]) days[l.date] = [];
      days[l.date].push(l);
    });
    return Object.entries(days).map(([date, dayLines]) => {
      const lastLine = dayLines[dayLines.length - 1];
      return {
        date,
        lines: dayLines,
        endBalance: lastLine.balance
      };
    }).sort((a, b) => a.date.localeCompare(b.date));
  }, [lines]);


  const buildHTML = (): string => {
    const farmName = settings?.farm?.name || 'مرغداری';
    const farmAddr = settings?.farm?.address || '';
    const farmPhone = settings?.farm?.phone || '';

    const rows = lines.map(l => {
      const isDebit = l.debit > 0;
      const isOutP = isDebit && (l.kind === 'payment_cash' || l.kind === 'payment_card' || l.kind === 'payment_check');
      const info = isOutP ? { label: 'پرداخت' } : KIND_INFO[l.kind];
      
      const metaParts = [info.label];
      if (l.docNumber && !isOutP) metaParts.push(l.docNumber);
      if (l.kind === 'payment_check' && l.checkNo) metaParts.push('#' + l.checkNo);
      if (l.kind === 'payment_check' && l.bank) metaParts.push(l.bank);
      if (l.kind === 'payment_check' && l.dueDate) metaParts.push('سرسید ' + toFa(l.dueDate));
      
      return `
        <tr>
          <td class="center text-muted" style="width: 80px;">${toFa(l.date)}</td>
          <td>
            <div class="fw-bold text-main">${metaParts.join(' • ')}</div>
            ${l.description ? `<div class="text-muted text-sm">${l.description}</div>` : ''}
          </td>
          <td class="amount ${l.debit > 0 ? 'text-danger' : 'text-muted'}">${l.debit > 0 ? toFa(l.debit.toLocaleString('fa-IR')) : '—'}</td>
          <td class="amount ${l.credit > 0 ? 'text-success' : 'text-muted'}">${l.credit > 0 ? toFa(l.credit.toLocaleString('fa-IR')) : '—'}</td>
          <td class="amount fw-bold text-main">${toFa(Math.abs(l.balance).toLocaleString('fa-IR'))}</td>
        </tr>
      `;
    }).join('');

    return `<!DOCTYPE html>
<html dir="rtl" lang="fa">
<head>
  <meta charset="UTF-8">
  <title>صورت‌حساب ${party?.name || ''}</title>
  <style>
    @import url('https://cdn.jsdelivr.net/gh/rastikerdar/vazirmatn@v33.003/Vazirmatn-font-face.css');
    @page { size: A4; margin: 15mm; }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    
    body { 
      font-family: Vazirmatn, sans-serif; direction: rtl; color: #0f172a; font-size: 12px; background: #fff; line-height: 1.6; 
    }
    
    /* Typography Helpers */
    .text-main { color: #0f172a; }
    .text-muted { color: #64748b; }
    .text-sm { font-size: 11px; }
    .text-danger { color: #dc2626; }
    .text-success { color: #16a34a; }
    .fw-bold { font-weight: 700; }
    .center { text-align: center; }
    .amount { text-align: left; font-variant-numeric: tabular-nums; direction: ltr; }

    /* Header Layout */
    .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 3px solid #16a34a; padding-bottom: 16px; margin-bottom: 24px; }
    .header .brand h1 { font-size: 22px; color: #16a34a; margin-bottom: 4px; font-weight: 800; }
    .header .doc-title { text-align: left; }
    .header .doc-title h2 { font-size: 20px; color: #0f172a; margin-bottom: 4px; font-weight: 700; letter-spacing: -0.5px; }
    
    /* Meta Info (Customer & Range) */
    .meta-grid { display: flex; justify-content: space-between; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 16px 20px; margin-bottom: 24px; }
    .meta-block { display: flex; flex-direction: column; gap: 4px; }
    .meta-label { font-size: 10px; color: #94a3b8; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; }
    .meta-value { font-size: 14px; font-weight: 700; color: #0f172a; }
    .meta-sub { font-size: 11px; color: #64748b; }
    
    /* Table */
    table { width: 100%; border-collapse: separate; border-spacing: 0; margin-bottom: 24px; }
    th { background: #f1f5f9; color: #334155; padding: 12px 10px; text-align: right; font-weight: 700; border-bottom: 2px solid #cbd5e1; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; }
    td { padding: 12px 10px; border-bottom: 1px solid #e2e8f0; vertical-align: middle; }
    tr:last-child td { border-bottom: none; }
    tr:nth-child(even) td { background: #f8fafc; }
    
    /* Summary Box */
    .summary-wrapper { display: flex; justify-content: flex-end; margin-bottom: 40px; }
    .summary-box { 
      width: 340px; 
      background: #ffffff; 
      border: 1px solid #e2e8f0; 
      border-radius: 10px; 
      padding: 16px 20px; 
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03);
    }
    .summary-row { display: flex; justify-content: space-between; padding: 8px 0; font-size: 13px; color: #475569; }
    .summary-total { font-size: 16px; font-weight: 800; color: #0f172a; border-top: 2px solid #cbd5e1; padding-top: 12px; margin-top: 8px; }
    
    /* Footer / Signatures */
    .footer { display: flex; justify-content: space-between; padding-top: 24px; margin-top: 20px; border-top: 1px solid #e2e8f0; }
    .signature { text-align: center; color: #94a3b8; font-size: 11px; width: 160px; }
    .signature-box { height: 60px; margin-bottom: 8px; border-bottom: 1px dashed #cbd5e1; }
  </style>
</head>
<body>
  <div class="header">
    <div class="brand">
      <h1>${farmName}</h1>
      <div class="text-muted text-sm">${farmAddr}</div>
      <div class="text-muted text-sm">${farmPhone}</div>
    </div>
    
    <div style="text-align: center; display: flex; flex-direction: column; justify-content: center; align-items: center;">
      <div style="font-size: 22px; font-weight: 900; color: #16a34a; letter-spacing: 1px;">هو الرزاق</div>
      <div style="font-size: 11px; color: #64748b; margin-top: 4px; font-weight: 600;">او روزی‌دهنده است</div>
    </div>

    <div class="doc-title">
      <h2>صورت‌حساب</h2>
      <div class="text-muted text-sm">تاریخ چاپ: ${toFa(getTodayJalali())}</div>
    </div>
  </div>
  
  <div class="meta-grid">
    <div class="meta-block">
      <div class="meta-label">طرف حساب</div>
      <div class="meta-value">${party?.name || '—'}</div>
      <div class="meta-sub">${party?.phone ? `تلفن: ${party.phone}` : ''}</div>
    </div>
    <div class="meta-block" style="text-align: left;">
      <div class="meta-label">بازه زمانی</div>
      <div class="meta-value" style="direction: rtl;">${toFa(fromDate || '—')} تا ${toFa(toDate || '—')}</div>
    </div>
  </div>
  
  <table>
    <thead>
      <tr>
        <th style="width: 80px; text-align: center;">تاریخ</th>
        <th>شرح عملیات</th>
        <th style="width: 110px; text-align: left;">بدهی (تومان)</th>
        <th style="width: 110px; text-align: left;">پرداخت (تومان)</th>
        <th style="width: 110px; text-align: left;">مانده (تومان)</th>
      </tr>
    </thead>
    <tbody>
      ${rows}
    </tbody>
  </table>
  
  <div class="summary-wrapper">
    <div class="summary-box">
      <div class="summary-row"><span>مجموع بدهی:</span><span class="fw-bold text-main">${toFa(totalDebit.toLocaleString('fa-IR'))}</span></div>
      <div class="summary-row"><span>مجموع پرداخت:</span><span class="fw-bold text-main">${toFa(totalCredit.toLocaleString('fa-IR'))}</span></div>
      <div class="summary-row summary-total">
        <span>مانده نهایی:</span>
        <span class="${netBalance > 0 ? 'text-danger' : 'text-success'}" style="direction: ltr;">${toFa(Math.abs(netBalance).toLocaleString('fa-IR'))} ${netBalance < 0 ? '(بستانکار)' : ''}</span>
      </div>
    </div>
  </div>
  
  <div class="footer">
    <div class="signature">
      <div class="signature-box"></div>
      مهر و امضا فروشنده
    </div>
    <div class="signature">
      <div class="signature-box"></div>
      مهر و امضا خریدار
    </div>
  </div>
</body>
</html>`;
  };

  const handlePrint = () => {
    if (!party || lines.length === 0) return;
    printHTML(buildHTML());
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="📄 صورت‌حساب طرف حساب"
      size="lg"
      footer={
        <ModalFooter actions={[
          { label: '📄 چاپ / PDF', role: 'primary', onClick: handlePrint, disabled: !partyId || lines.length === 0 },
          { label: 'بستن', role: 'secondary', onClick: onClose },
        ]} />
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 8, paddingTop: 12 }}>
        <Field label="طرف حساب" required>
          <Select value={partyId} onChange={e => setPartyId(e.target.value)}>
            <option value="">— انتخاب —</option>
            {parties.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </Select>
        </Field>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, direction: 'rtl' }}>
          <Field label="از تاریخ">
            <DatePicker value={fromDate} onChange={setFromDate} />
          </Field>
          <Field label="تا تاریخ">
            <DatePicker value={toDate} onChange={setToDate} autoToday />
          </Field>
        </div>
      </div>

      {partyId && lines.length === 0 && (
        <div style={{ padding: 24, textAlign: 'center', color: 'var(--muted)', fontSize: 'var(--fs-sm)' }}>
          تراکنشی در این بازه برای این طرف حساب وجود ندارد.
        </div>
      )}

      {partyId && lines.length > 0 && (
        <>
          {/* خلاصه حساب */}
          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8,
            padding: 'var(--pad-normal)', background: 'var(--input-bg)',
            borderRadius: 'var(--r-sm)', marginTop: 8, marginBottom: 12, fontSize: 'var(--fs-sm)', textAlign: 'center',
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

          {/* کارت‌های روزانه */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {groupedLines.map((day, dIdx) => (
              <div key={dIdx} style={{ background: 'var(--card)', borderRadius: 'var(--r-lg)', border: '1px solid var(--border)', overflow: 'hidden' }}>
                
                {/* هدر روز */}
                <div style={{ padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', borderBottom: '2px solid var(--border)', background: 'var(--bg)' }}>
                  <div style={{ fontSize: '14px', fontWeight: 700 }}>{toFa(day.date)}</div>
                  <div style={{ fontSize: '11px', color: 'var(--muted)' }}>{day.lines.length} تراکنش</div>
                </div>
                
                {/* ردیف‌های تراکنش */}
                <div style={{ padding: '0 16px 8px' }}>
                  {day.lines.map((l, i) => {
                    const isPaymentOut = l.debit > 0 && (l.kind === 'payment_cash' || l.kind === 'payment_card' || l.kind === 'payment_check');
                    const info = isPaymentOut ? { icon: '💸', label: 'پرداخت', color: 'var(--danger)' } : KIND_INFO[l.kind];
                    const checkInfo = l.checkStatus ? CHECK_INFO[l.checkStatus] : null;
                    const isDebit = l.debit > 0;
                    const amount = isDebit ? l.debit : l.credit;
                    
                    return (
                      <div key={i} style={{
                        display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) auto',
                        alignItems: 'center', gap: 12, padding: '10px 0',
                        borderTop: i > 0 ? '1px dashed var(--border)' : 'none'
                      }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 3, minWidth: 0 }}>
                          <div style={{ fontSize: '12px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
                            <span style={{ flexShrink: 0 }}>{info.icon}</span>
                            <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{info.label}</span>
                            {l.docNumber && (l.kind === 'deal' || l.kind === 'invoice_sale' || l.kind === 'invoice_purchase') && <span style={{ fontSize: '11px', color: 'var(--dim)', fontWeight: 400 }}>({l.docNumber})</span>}
                          </div>
                          <div style={{ fontSize: '10.5px', color: 'var(--muted)', paddingRight: 22, display: 'flex', alignItems: 'center', gap: 4, minWidth: 0 }}>
                            {l.description ? <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', flex: 1 }}>{l.description}</span> : null}
                            {l.kind === 'payment_check' && (l.checkNo || l.bank) && (
                               <span style={{ color: 'var(--dim)' }}> • #{l.checkNo} {l.bank}</span>
                            )}
                            {checkInfo && (
                              <span style={{ padding: '1px 4px', borderRadius: 'var(--r-sm)', background: checkInfo.bg, color: checkInfo.color, fontSize: '9px', fontWeight: 600, flexShrink: 0 }}>
                                {checkInfo.label}
                              </span>
                            )}
                          </div>
                        </div>
                        
                        <div style={{ minWidth: '110px', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 2 }}>
                           <span style={{ fontSize: '13px', fontWeight: 700, color: isDebit ? 'var(--danger)' : 'var(--accent)', fontVariantNumeric: 'tabular-nums', direction: 'ltr' }}>
                              {isDebit ? '+' : '-'}{toFa(amount.toLocaleString('fa-IR'))}
                           </span>
                           <span style={{ fontSize: '9px', padding: '1px 5px', borderRadius: '4px', fontWeight: 500, background: isDebit ? 'var(--danger-soft)' : 'var(--accent-soft)', color: isDebit ? 'var(--danger)' : 'var(--accent)' }}>
                              {isDebit ? 'بدهکار' : 'بستانکار'}
                           </span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* فوتر روز */}
                <div style={{ padding: '10px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg)', borderTop: '1px solid var(--border)' }}>
                  <span style={{ fontSize: '11px', color: 'var(--muted)' }}>مانده پایان روز</span>
                  <span style={{ fontSize: '13px', fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>
                    {toFa(day.endBalance.toLocaleString('fa-IR'))} ت
                  </span>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
      </Modal>
  );
}
