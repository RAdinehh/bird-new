/**
 * DealPrint.tsx — سند چاپ قرارداد معامله
 */
import { useSet } from '../../set/store';
import { useCtc } from '../../ctc/store';
import { toFa } from '../../../shr/utils/fa';
import { printHTML } from '../../../shr/utils/export';
import { DEAL_LABEL, computeDealBalance } from '../store';
import type { Deal } from '../types';

interface Props {
  deal: Deal;
  onClose: () => void;
}

export default function DealPrint({ deal, onClose }: Props) {
  const settings: any = useSet();
  const { contacts } = useCtc();
  const party = contacts.find(c => c.id === deal.partyId);

  const buildHtml = () => {
    const farmName = settings?.farm?.name || 'مرغداری';
    const farmAddr = settings?.farm?.address || '';
    const farmPhone = settings?.farm?.phone || '';
    const bal = computeDealBalance(deal);

    const goodsRows = (deal.goods || []).map(g => {
      const out = (deal.deliveries || []).filter(dv => dv.goodId === g.id && dv.type === 'out').reduce((s, dv) => s + (Number(dv.quantity) || 0), 0);
      const ret = (deal.deliveries || []).filter(dv => dv.goodId === g.id && dv.type === 'return').reduce((s, dv) => s + (Number(dv.quantity) || 0), 0);
      const loss = (deal.deliveries || []).filter(dv => dv.goodId === g.id && dv.type === 'loss').reduce((s, dv) => s + (Number(dv.quantity) || 0), 0);
      const sold = (deal.sales || []).filter(s => s.goodId === g.id).reduce((s, x) => s + (Number(x.quantity) || 0), 0);
      const delivered = out - ret - loss;
      const inHand = delivered - sold;
      return '<tr>' +
        '<td>' + g.name + '</td>' +
        '<td>' + g.unit + '</td>' +
        '<td>' + toFa(g.quantity) + '</td>' +
        '<td>' + toFa(delivered) + '</td>' +
        '<td>' + toFa(sold) + '</td>' +
        '<td>' + toFa(inHand) + '</td>' +
        '</tr>';
    }).join('');

    const paymentsRows = (deal.payments || []).map(p => {
      const dirLabel = p.direction === 'in' ? 'دریافت' : 'پرداخت';
      const methodLabel = p.method === 'cash' ? 'نقدی' : p.method === 'card' ? 'کارت' : 'چک';
      const statusLabel = p.method === 'check' ? (
        p.status === 'cleared' ? ' (پاس‌شده)' :
        p.status === 'bounced' ? ' (برگشتی)' :
        p.status === 'in_transit' ? ' (در جریان)' : ' (در انتظار)'
      ) : '';
      return '<tr>' +
        '<td>' + toFa(p.date) + '</td>' +
        '<td>' + dirLabel + '</td>' +
        '<td>' + methodLabel + statusLabel + '</td>' +
        '<td>' + toFa((p.amount || 0).toLocaleString('fa-IR')) + '</td>' +
        '</tr>';
    }).join('');

    return '<!DOCTYPE html>' +
      '<html dir="rtl" lang="fa"><head><meta charset="UTF-8">' +
      '<title>قرارداد معامله ' + (deal.dealNumber || '') + '</title>' +
      '<style>' +
      'body { font-family: Vazirmatn, Tahoma, sans-serif; padding: 20px; direction: rtl; color: #0f172a; font-size: 12px; }' +
      'h1 { font-size: 18px; text-align: center; margin: 8px 0; }' +
      'h2 { font-size: 13px; margin: 16px 0 8px; border-bottom: 1px solid #cbd5e1; padding-bottom: 4px; }' +
      '.header { text-align: center; border-bottom: 2px solid #0284c7; padding-bottom: 12px; margin-bottom: 16px; }' +
      '.info-row { display: flex; justify-content: space-between; padding: 4px 0; border-bottom: 1px dashed #e2e8f0; }' +
      'table { width: 100%; border-collapse: collapse; margin-bottom: 16px; }' +
      'th, td { border: 1px solid #cbd5e1; padding: 6px 8px; font-size: 11px; text-align: center; }' +
      'th { background: #f1f5f9; font-weight: 700; }' +
      '.summary { background: #f8fafc; padding: 12px; border-radius: 4px; border: 1px solid #e2e8f0; }' +
      '.summary-row { display: flex; justify-content: space-between; padding: 3px 0; }' +
      '.total { font-weight: 700; border-top: 1px dashed #cbd5e1; padding-top: 6px; margin-top: 4px; }' +
      '.footer { text-align: center; margin-top: 24px; padding-top: 16px; border-top: 1px dashed #cbd5e1; font-size: 11px; color: #64748b; }' +
      '.signatures { display: flex; justify-content: space-between; margin-top: 40px; }' +
      '.sign-box { text-align: center; font-size: 11px; width: 45%; }' +
      '.sign-line { border-top: 1px solid #64748b; margin-top: 40px; padding-top: 6px; }' +
      '</style></head><body>' +
      '<div class="header">' +
      '<div style="font-size: 14px; font-weight: 700;">' + farmName + '</div>' +
      (farmAddr ? '<div style="font-size: 11px; color: #64748b;">' + farmAddr + '</div>' : '') +
      (farmPhone ? '<div style="font-size: 11px; color: #64748b;">تلفن: ' + toFa(farmPhone) + '</div>' : '') +
      '<h1>قرارداد معامله</h1>' +
      '</div>' +

      '<h2>اطلاعات قرارداد</h2>' +
      '<div class="info-row"><span>شماره قرارداد:</span><strong>' + (deal.dealNumber || '—') + '</strong></div>' +
      '<div class="info-row"><span>نوع معامله:</span><strong>' + DEAL_LABEL[deal.type] + '</strong></div>' +
      '<div class="info-row"><span>طرف حساب:</span><strong>' + (party?.name || '—') + '</strong></div>' +
      (party?.phone ? '<div class="info-row"><span>تلفن طرف:</span><strong>' + toFa(party.phone) + '</strong></div>' : '') +
      '<div class="info-row"><span>تاریخ قرارداد:</span><strong>' + toFa(deal.date) + '</strong></div>' +
      (deal.startDate ? '<div class="info-row"><span>دوره:</span><strong>' + toFa(deal.startDate) + (deal.endDate ? ' تا ' + toFa(deal.endDate) : '') + '</strong></div>' : '') +
      (deal.dueDate ? '<div class="info-row"><span>سرسید:</span><strong>' + toFa(deal.dueDate) + '</strong></div>' : '') +

      (deal.description ? '<h2>توضیحات</h2><div style="padding: 8px; background: #f8fafc; border-radius: 4px;">' + deal.description + '</div>' : '') +

      ((deal.goods || []).length > 0 ?
        '<h2>کالاها و تحویل‌ها</h2>' +
        '<table><thead><tr>' +
        '<th>کالا</th><th>واحد</th><th>مقدار اولیه</th><th>تحویل‌شده</th><th>فروش‌رفته</th><th>مانده</th>' +
        '</tr></thead><tbody>' + goodsRows + '</tbody></table>'
        : '') +

      '<h2>خلاصه مالی</h2>' +
      '<div class="summary">' +
      '<div class="summary-row"><span>فروش کل:</span><span>' + toFa(bal.totalSales.toLocaleString('fa-IR')) + ' تومان</span></div>' +
      '<div class="summary-row"><span>کمیسیون:</span><span>' + toFa(bal.commission.toLocaleString('fa-IR')) + ' تومان</span></div>' +
      '<div class="summary-row"><span>سهم طرف:</span><span>' + toFa(bal.myShare.toLocaleString('fa-IR')) + ' تومان</span></div>' +
      '<div class="summary-row"><span>دریافت‌شده:</span><span>' + toFa(bal.paidIn.toLocaleString('fa-IR')) + ' تومان</span></div>' +
      (bal.paidOut > 0 ? '<div class="summary-row"><span>پرداخت‌شده:</span><span>' + toFa(bal.paidOut.toLocaleString('fa-IR')) + ' تومان</span></div>' : '') +
      '<div class="summary-row total"><span>مانده:</span><span>' + toFa(Math.abs(bal.balance).toLocaleString('fa-IR')) + ' تومان' + (bal.balance < 0 ? ' (بستانکار)' : '') + '</span></div>' +
      '</div>' +

      ((deal.payments || []).length > 0 ?
        '<h2>پرداخت‌ها</h2>' +
        '<table><thead><tr>' +
        '<th>تاریخ</th><th>جهت</th><th>روش</th><th>مبلغ (تومان)</th>' +
        '</tr></thead><tbody>' + paymentsRows + '</tbody></table>'
        : '') +

      (deal.notes ? '<h2>یادداشت</h2><div style="padding: 8px; background: #f8fafc; border-radius: 4px;">' + deal.notes + '</div>' : '') +

      '<div class="signatures">' +
      '<div class="sign-box"><div class="sign-line">امضای ' + farmName + '</div></div>' +
      '<div class="sign-box"><div class="sign-line">امضای ' + (party?.name || 'طرف حساب') + '</div></div>' +
      '</div>' +

      '<div class="footer">' +
      'تاریخ چاپ: ' + toFa(new Date().toLocaleDateString('fa-IR')) +
      '</div>' +
      '</body></html>';
  };

  const handlePrint = () => {
    printHTML(buildHtml());
  };

  const bal = computeDealBalance(deal);

  return (
    <div role="button" tabIndex={0}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      style={{
        position: 'fixed', inset: 0,
        background: 'var(--overlay)',
        zIndex: 500,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 16,
      }}>
      <div style={{
        background: 'var(--card-solid)',
        borderRadius: 'var(--r-lg)',
        maxWidth: 480, width: '100%',
        maxHeight: '90vh',
        display: 'flex', flexDirection: 'column',
        overflow: 'hidden',
      }}>
        <div style={{
          padding: '14px 20px',
          borderBottom: '1px solid var(--border)',
          fontSize: 'var(--fs-base)',
          fontWeight: 700,
        }}>🖨️ پیش‌نمایش قرارداد معامله</div>

        <div style={{ padding: 20, overflow: 'auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 16 }}>
            <div style={{ fontSize: 15, fontWeight: 700 }}>{settings?.farm?.name || 'مرغداری'}</div>
            <div style={{ fontSize: 13, fontWeight: 700, marginTop: 8 }}>قرارداد معامله</div>
          </div>

          <div style={{ padding: 12, background: 'var(--input-bg)', borderRadius: 8, fontSize: 12, marginBottom: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: 2 }}>
              <span style={{ color: 'var(--muted)' }}>شماره قرارداد:</span>
              <strong>{deal.dealNumber || '—'}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: 2 }}>
              <span style={{ color: 'var(--muted)' }}>طرف حساب:</span>
              <strong>{party?.name || '—'}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: 2 }}>
              <span style={{ color: 'var(--muted)' }}>نوع:</span>
              <strong>{DEAL_LABEL[deal.type]}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: 2 }}>
              <span style={{ color: 'var(--muted)' }}>تاریخ:</span>
              <strong>{toFa(deal.date)}</strong>
            </div>
          </div>

          <div style={{ padding: 12, background: 'var(--accent-soft)', border: '1px solid var(--accent-border)', borderRadius: 8, fontSize: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: 2 }}>
              <span style={{ color: 'var(--muted)' }}>فروش کل:</span>
              <span>{toFa(bal.totalSales.toLocaleString('fa-IR'))} ت</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: 2 }}>
              <span style={{ color: 'var(--muted)' }}>کمیسیون:</span>
              <span>{toFa(bal.commission.toLocaleString('fa-IR'))} ت</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: 2 }}>
              <span style={{ color: 'var(--muted)' }}>دریافت‌شده:</span>
              <span>{toFa(bal.paidIn.toLocaleString('fa-IR'))} ت</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: 2, borderTop: '1px dashed var(--accent-border)', marginTop: 4, paddingTop: 6 }}>
              <strong>مانده:</strong>
              <strong style={{ color: bal.balance > 0 ? 'var(--danger)' : 'var(--accent)' }}>{toFa(Math.abs(bal.balance).toLocaleString('fa-IR'))} ت</strong>
            </div>
          </div>
        </div>

        <div style={{
          padding: '12px 20px 20px',
          borderTop: '1px solid var(--border)',
          display: 'flex', flexDirection: 'row-reverse', gap: 8,
        }}>
          <button onClick={handlePrint}
            style={{
              flex: 1,
              padding: '10px 16px',
              background: 'var(--accent)',
              color: '#fff',
              border: 'none',
              borderRadius: 'var(--r-sm)',
              fontFamily: 'inherit',
              fontSize: 'var(--fs-sm)',
              fontWeight: 700,
              cursor: 'pointer',
            }}>چاپ / PDF</button>
          <button onClick={onClose}
            style={{
              flex: 1,
              padding: '10px 16px',
              background: 'var(--btn-bg)',
              color: 'var(--text)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--r-sm)',
              fontFamily: 'inherit',
              fontSize: 'var(--fs-sm)',
              fontWeight: 600,
              cursor: 'pointer',
            }}>بستن</button>
        </div>
      </div>
    </div>
  );
}
