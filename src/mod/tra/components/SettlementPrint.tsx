/**
 * SettlementPrint.tsx — سند چاپ تسویه دوره‌ای
 * استاندارد SAP MRKO
 */
import { useSet } from '../../set/store';
import { useCtc } from '../../ctc/store';
import { toFa } from '../../../shr/utils/fa';
import { printHTML } from '../../../shr/utils/export';
import { DEAL_LABEL } from '../store';
import type { Deal, Settlement } from '../types';

interface Props {
  settlement: Settlement;
  deal: Deal;
  onClose: () => void;
}

export default function SettlementPrint({ settlement, deal, onClose }: Props) {
  const settings: any = useSet();
  const { contacts } = useCtc();
  const party = contacts.find(c => c.id === deal.partyId);

  const buildHtml = () => {
    const farmName = settings?.farm?.name || 'مرغداری';
    const farmAddr = settings?.farm?.address || '';
    const farmPhone = settings?.farm?.phone || '';

    const salesRows = (settlement.salesSnapshot || []).map(s => {
      const good = (deal.goods || []).find(g => g.id === s.goodId);
      const qty = Number(s.quantity) || 0;
      const price = Number(s.unitPrice) || 0;
      const total = qty * price;
      return '<tr>' +
        '<td>' + (s.date ? toFa(s.date) : '—') + '</td>' +
        '<td>' + (good?.name || '—') + '</td>' +
        '<td>' + toFa(qty) + '</td>' +
        '<td>' + toFa(price.toLocaleString('fa-IR')) + '</td>' +
        '<td>' + toFa(total.toLocaleString('fa-IR')) + '</td>' +
        '</tr>';
    }).join('');

    const balance = (settlement.netPayable || 0) - (settlement.paidAmount || 0);
    const statusLabel = settlement.status === 'draft' ? 'پیش‌نویس' : settlement.status === 'confirmed' ? 'تأییدشده' : 'فاکتورشده';

    return '<!DOCTYPE html>' +
      '<html dir="rtl" lang="fa"><head><meta charset="UTF-8">' +
      '<title>سند تسویه ' + (deal.dealNumber || '') + '</title>' +
      '<style>' +
      'body { font-family: Vazirmatn, Tahoma, sans-serif; padding: 20px; direction: rtl; color: #0f172a; }' +
      'h1 { font-size: 18px; text-align: center; margin: 8px 0; }' +
      'h2 { font-size: 13px; margin: 14px 0 6px; }' +
      '.header { text-align: center; margin-bottom: 20px; }' +
      '.header .farm { font-size: 14px; font-weight: 700; }' +
      '.header .meta { font-size: 11px; color: #64748b; margin-top: 4px; }' +
      '.info { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 16px; padding: 12px; background: #f1f5f9; border-radius: 8px; font-size: 12px; }' +
      '.info div { display: flex; justify-content: space-between; }' +
      '.info span:first-child { color: #64748b; }' +
      'table { width: 100%; border-collapse: collapse; margin-bottom: 16px; font-size: 12px; }' +
      'th { background: #f1f5f9; padding: 8px; text-align: right; border-bottom: 2px solid #cbd5e1; font-size: 11px; }' +
      'td { padding: 6px 8px; border-bottom: 1px solid #e2e8f0; }' +
      '.summary { padding: 12px; background: rgba(22,163,74,.12); border: 1px solid rgba(22,163,74,.35); border-radius: 8px; margin-bottom: 16px; }' +
      '.summary-row { display: flex; justify-content: space-between; padding: 4px 0; font-size: 12px; }' +
      '.summary-row.total { border-top: 1px dashed rgba(22,163,74,.35); padding-top: 8px; margin-top: 4px; font-weight: 700; font-size: 14px; }' +
      '.footer { text-align: center; font-size: 10px; color: #94a3b8; margin-top: 24px; padding-top: 12px; border-top: 1px dashed #e2e8f0; }' +
      '</style></head><body>' +
      '<div class="header">' +
      '<div class="farm">' + farmName + '</div>' +
      (farmAddr ? '<div class="meta">' + farmAddr + '</div>' : '') +
      (farmPhone ? '<div class="meta">تلفن: ' + farmPhone + '</div>' : '') +
      '<h1>سند تسویه دوره‌ای</h1>' +
      '</div>' +
      '<div class="info">' +
      '<div><span>شماره قرارداد:</span><strong>' + (deal.dealNumber || '—') + '</strong></div>' +
      '<div><span>نوع معامله:</span><strong>' + (DEAL_LABEL[deal.type] || deal.type) + '</strong></div>' +
      '<div><span>طرف حساب:</span><strong>' + (party?.name || '—') + '</strong></div>' +
      '<div><span>وضعیت:</span><strong>' + statusLabel + '</strong></div>' +
      '<div><span>از تاریخ:</span><strong>' + toFa(settlement.periodStart) + '</strong></div>' +
      '<div><span>تا تاریخ:</span><strong>' + toFa(settlement.periodEnd) + '</strong></div>' +
      '</div>' +
      (salesRows
        ? '<h2>فروش‌های دوره</h2>' +
          '<table><thead><tr><th>تاریخ</th><th>کالا</th><th>مقدار</th><th>قیمت واحد</th><th>جمع</th></tr></thead><tbody>' + salesRows + '</tbody></table>'
        : '<p style="text-align:center;color:#64748b;font-size:12px;">فروشی در این دوره ثبت نشده است</p>') +
      '<div class="summary">' +
      '<div class="summary-row"><span>فروش کل:</span><span>' + toFa((settlement.grossSales || 0).toLocaleString('fa-IR')) + ' ت</span></div>' +
      '<div class="summary-row"><span>کمیسیون:</span><span>' + toFa((settlement.commission || 0).toLocaleString('fa-IR')) + ' ت</span></div>' +
      '<div class="summary-row"><span>خالص قابل پرداخت:</span><span>' + toFa((settlement.netPayable || 0).toLocaleString('fa-IR')) + ' ت</span></div>' +
      '<div class="summary-row"><span>دریافت‌شده:</span><span>' + toFa((settlement.paidAmount || 0).toLocaleString('fa-IR')) + ' ت</span></div>' +
      '<div class="summary-row total"><span>مانده:</span><span>' + toFa(Math.abs(balance).toLocaleString('fa-IR')) + ' ت</span></div>' +
      '</div>' +
      '<div class="footer">' +
      'تاریخ چاپ: ' + toFa(new Date().toLocaleDateString('fa-IR')) +
      (settlement.notes ? '<br>' + settlement.notes : '') +
      '</div>' +
      '</body></html>';
  };

  const handlePrint = () => {
    printHTML(buildHtml());
  };

  const balance = (settlement.netPayable || 0) - (settlement.paidAmount || 0);

  return (
    <div role="button" tabIndex={0}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      style={{
        position: 'fixed', inset: 0,
        background: 'var(--overlay)',
        zIndex: 110,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 16,
      }}
    >
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
        }}>🖨️ پیش‌نمایش سند تسویه</div>
        
        <div style={{ padding: 20, overflow: 'auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 16 }}>
            <div style={{ fontSize: 15, fontWeight: 700 }}>{settings?.farm?.name || 'مرغداری'}</div>
            <div style={{ fontSize: 13, fontWeight: 700, marginTop: 8 }}>سند تسویه دوره‌ای</div>
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
              <span style={{ color: 'var(--muted)' }}>دوره:</span>
              <strong>{toFa(settlement.periodStart)} تا {toFa(settlement.periodEnd)}</strong>
            </div>
          </div>
          
          <div style={{ padding: 12, background: 'var(--accent-soft)', border: '1px solid var(--accent-border)', borderRadius: 8, fontSize: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: 2 }}>
              <span style={{ color: 'var(--muted)' }}>فروش کل:</span>
              <span>{toFa((settlement.grossSales || 0).toLocaleString('fa-IR'))} ت</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: 2 }}>
              <span style={{ color: 'var(--muted)' }}>کمیسیون:</span>
              <span>{toFa((settlement.commission || 0).toLocaleString('fa-IR'))} ت</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: 2 }}>
              <span style={{ color: 'var(--muted)' }}>دریافت‌شده:</span>
              <span>{toFa((settlement.paidAmount || 0).toLocaleString('fa-IR'))} ت</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: 2, borderTop: '1px dashed var(--accent-border)', marginTop: 4, paddingTop: 6 }}>
              <strong>خالص:</strong>
              <strong style={{ color: 'var(--accent)' }}>{toFa((settlement.netPayable || 0).toLocaleString('fa-IR'))} ت</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: 2 }}>
              <strong>مانده:</strong>
              <strong style={{ color: balance > 0 ? 'var(--danger)' : 'var(--accent)' }}>{toFa(Math.abs(balance).toLocaleString('fa-IR'))} ت</strong>
            </div>
          </div>
        </div>
        
        <div style={{
          padding: '12px 20px 20px',
          borderTop: '1px solid var(--border)',
          display: 'flex', flexDirection: 'row-reverse', gap: 8,
        }}>
          <button onClick={handlePrint}
            style={{ flex: 1, height: 40, background: 'var(--accent)', color: 'var(--avatar-text)', border: 'none', borderRadius: 'var(--r-md)', fontFamily: 'inherit', fontSize: 'var(--fs-base)', fontWeight: 600, cursor: 'pointer' }}
          >🖨 چاپ / ذخیره PDF</button>
          <button onClick={onClose}
            style={{ flex: 1, height: 40, background: 'var(--btn-bg)', color: 'var(--muted)', border: '1px solid var(--border)', borderRadius: 'var(--r-md)', fontFamily: 'inherit', fontSize: 'var(--fs-base)', fontWeight: 600, cursor: 'pointer' }}
          >لغو</button>
        </div>
      </div>
    </div>
  );
}
