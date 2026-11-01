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

  const buildHTML = (): string => {
    const farmName = settings?.farm?.name || 'مرغداری';
    const farmAddr = settings?.farm?.address || '';
    const farmPhone = settings?.farm?.phone || '';

    const rows = lines.map(l => {
      const isOutP = l.debit > 0 && (l.kind === 'payment_cash' || l.kind === 'payment_card' || l.kind === 'payment_check');
      const info = isOutP ? { icon: '💸', label: 'پرداخت', color: '#dc2626' } : KIND_INFO[l.kind];
      const metaParts = [info.label];
      if (l.docNumber) metaParts.push(l.docNumber);
      if (l.kind === 'payment_check' && l.checkNo) metaParts.push('#' + l.checkNo);
      if (l.kind === 'payment_check' && l.bank) metaParts.push(l.bank);
      if (l.kind === 'payment_check' && l.dueDate) metaParts.push('سرسید ' + toFa(l.dueDate));
      const statusTag = l.checkStatus ? ` [${CHECK_INFO[l.checkStatus].label}]` : '';

      return `<tr>
        <td style="white-space:nowrap">${toFa(l.date)}</td>
        <td>
          <div style="font-weight:600">${info.icon} ${metaParts.join(' • ')}${statusTag}</div>
          ${l.description ? `<div style="font-size:10px;color:#64748b;margin-top:2px">${l.description}</div>` : ''}
        </td>
        <td style="color:#dc2626;text-align:left">${l.debit > 0 ? '+' + toFa(l.debit.toLocaleString('fa-IR')) : ''}</td>
        <td style="color:#16a34a;text-align:left">${l.credit > 0 ? '-' + toFa(l.credit.toLocaleString('fa-IR')) : ''}</td>
        <td style="text-align:left;font-weight:600">${toFa(l.balance.toLocaleString('fa-IR'))}</td>
      </tr>`;
    }).join('');

    return `<!DOCTYPE html>
<html dir="rtl" lang="fa"><head><meta charset="UTF-8"><title>صورت‌حساب ${party?.name || ''}</title>
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
td { padding: 6px 8px; border-bottom: 1px solid #e2e8f0; vertical-align: top; }
.summary { margin-top: 16px; padding: 12px; background: #f1f5f9; border-radius: 8px; }
.summary-row { display: flex; justify-content: space-between; padding: 4px 0; }
.summary-total { font-weight: 700; font-size: 14px; border-top: 2px solid #cbd5e1; padding-top: 8px; margin-top: 8px; }
</style></head><body>
<div class="header"><h1>${farmName}</h1><div class="meta">${farmAddr}${farmPhone ? ' • ' + farmPhone : ''}</div></div>
<h2>صورت‌حساب: ${party?.name || ''}</h2>
<div class="meta">بازه: ${toFa(fromDate || '—')} تا ${toFa(toDate || '—')}${party?.phone ? ' • تلفن: ' + party.phone : ''}</div>
<table><thead><tr><th>تاریخ</th><th>شرح</th><th>بدهی</th><th>پرداخت</th><th>مانده</th></tr></thead><tbody>${rows}</tbody></table>
<div class="summary">
<div class="summary-row"><span>مجموع بدهی:</span><span>${toFa(totalDebit.toLocaleString('fa-IR'))} تومان</span></div>
<div class="summary-row"><span>مجموع پرداخت:</span><span>${toFa(totalCredit.toLocaleString('fa-IR'))} تومان</span></div>
<div class="summary-row summary-total"><span>مانده نهایی:</span><span>${toFa(Math.abs(netBalance).toLocaleString('fa-IR'))} تومان</span></div>
</div></body></html>`;
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

          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {lines.map((l, i) => {
              const info = (l.debit > 0 && (l.kind === 'payment_cash' || l.kind === 'payment_card' || l.kind === 'payment_check')) ? { icon: '💸', label: 'پرداخت', color: 'var(--danger)' } : KIND_INFO[l.kind];
              const checkInfo = l.checkStatus ? CHECK_INFO[l.checkStatus] : null;
              const amountColor = l.debit > 0 ? 'var(--danger)' : l.credit > 0 ? 'var(--accent)' : 'var(--text)';
              const amountSign = l.debit > 0 ? '+' : l.credit > 0 ? '-' : '';
              const amountValue = l.debit > 0 ? l.debit : l.credit;

              return (
                <div
                  key={i}
                  style={{
                    display: 'flex', flexDirection: 'column', gap: 4,
                    padding: '10px 8px', borderBottom: '1px solid var(--border)',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 'var(--fs-sm)', fontWeight: 600, color: info.color, flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {info.icon} {info.label}
                      {l.docNumber && (l.kind === 'invoice_sale' || l.kind === 'invoice_purchase' || l.kind === 'deal') && <span style={{ color: 'var(--muted)', fontWeight: 400, marginRight: 4 }}>({l.docNumber})</span>}
                    </span>
                    <span style={{ fontSize: 'var(--fs-xs)', color: 'var(--muted)', flexShrink: 0 }}>
                      {toFa(l.date)}
                    </span>
                  </div>

                  {l.description && (
                    <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--text)', wordBreak: 'break-word', lineHeight: 1.5 }}>
                      {l.description}
                    </div>
                  )}

                  {l.kind === 'payment_check' && (l.checkNo || l.bank || l.dueDate || checkInfo) && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, fontSize: 'var(--fs-xs)', color: 'var(--muted)', alignItems: 'center' }}>
                      {l.checkNo && <span>#{l.checkNo}</span>}
                      {l.bank && <span>• {l.bank}</span>}
                      {l.dueDate && <span>• سرسید {toFa(l.dueDate)}</span>}
                      {checkInfo && (
                        <span style={{
                          padding: '1px 6px', borderRadius: 'var(--r-sm)',
                          background: checkInfo.bg, color: checkInfo.color,
                          fontWeight: 600,
                        }}>
                          {checkInfo.label}
                        </span>
                      )}
                    </div>
                  )}

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 'var(--fs-sm)', fontWeight: 700, color: amountColor, fontVariantNumeric: 'tabular-nums' }}>
                      {amountSign}{toFa(amountValue.toLocaleString('fa-IR'))} <span style={{ fontSize: 'var(--fs-xs)', fontWeight: 400 }}>ت</span>
                    </span>
                    <span style={{ fontSize: 'var(--fs-xs)', color: 'var(--muted)', fontVariantNumeric: 'tabular-nums' }}>
                      مانده: <b style={{ color: 'var(--text)', fontSize: 'var(--fs-sm)' }}>{toFa(l.balance.toLocaleString('fa-IR'))}</b> ت
                    </span>
                  </div>
                </div>
              );
            })}
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
