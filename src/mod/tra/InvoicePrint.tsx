/**
 * InvoicePrint.tsx — بخش tra
 */
import { useSet } from '../set/store';
import { useCtc } from '../ctc/store';
import { PAYMENT_LABEL, STATUS_LABEL, remaining, paidSum, invoiceStatus, type Invoice } from './store';
import { toFa } from '../../shr/utils/fa';
import { printHTML, printTemplate } from '../../shr/utils/export';

interface Props {
  invoice: Invoice;
  onClose: () => void;
}

export default function InvoicePrint({ invoice, onClose }: Props) {
  const settings = useSet();
  const { contacts } = useCtc();
  const party = contacts.find(c => c.id === invoice.partyId);
  const status = invoiceStatus(invoice);
  const rem = remaining(invoice);
  const paid = paidSum(invoice.payments || []);

  const isSale = invoice.type === 'sale';
  const title = isSale ? 'فاکتور فروش' : 'فاکتور خرید';

  const catLabel = (() => {
    const list = isSale
      ? [['chick','جوجه'],['egg','تخم خوراکی'],['fertile_egg','تخم نطفه‌دار'],['adult','پرنده بالغ'],['manure','کود'],['feed','دان'],['equipment','وسایل'],['broken','اقلام شکسته'],['other','سایر']]
      : [['egg','تخم نطفه‌دار'],['chick','جوجه یک‌روزه'],['adult','پرنده بالغ'],['feed','دان'],['medicine','دارو'],['equipment','تجهیزات'],['other','سایر']];
    return (list.find(x => x[0] === invoice.category) || ['', invoice.category])[1];
  })();

  const buildHtml = () => {
    const farmName = settings.farm.name || 'مرغداری';
    const farmAddr = settings.farm.address || '';
    const farmPhone = settings.farm.phone || '';
    const bankInfo = settings.bank.bankName ? 'بانک ' + settings.bank.bankName : '';

    const itemsRows = invoice.items.map(it => (
      '<tr>' +
        '<td>' + (it.description || '—') + '</td>' +
        '<td>' + (it.unit || '—') + '</td>' +
        '<td>' + toFa(it.quantity) + '</td>' +
        '<td>' + toFa(it.unitPrice.toLocaleString('fa-IR')) + '</td>' +
        '<td>' + toFa(it.total.toLocaleString('fa-IR')) + '</td>' +
      '</tr>'
    )).join('');

    const paymentsRows = (invoice.payments || []).map(p => (
      '<tr>' +
        '<td>' + PAYMENT_LABEL[p.method] + '</td>' +
        '<td>' + (p.date ? toFa(p.date) : '—') + '</td>' +
        '<td>' + (p.checkNo ? p.checkNo : '—') + '</td>' +
        '<td>' + (p.bank ? p.bank : '—') + '</td>' +
        '<td>' + toFa(p.amount.toLocaleString('fa-IR')) + '</td>' +
      '</tr>'
    )).join('');

    const statusBadge = status === 'paid'
      ? '<span class="badge badge-green">پرداخت‌شده</span>'
      : status === 'partial'
      ? '<span class="badge badge-amber">نیمه‌پرداخت</span>'
      : '<span class="badge badge-red">پرداخت‌نشده</span>';

    const body = `
      <div class="header">
        <div>
          <h1>${farmName}</h1>
          <div class="farm-info">
            ${farmAddr ? farmAddr + '<br>' : ''}
            ${farmPhone ? 'تلفن — ' + farmPhone : ''}
          </div>
        </div>
        <div style="text-align: left;">
          <h2>${title}</h2>
          <div class="farm-info">
            شماره: ${invoice.number || '—'}<br>
            تاریخ: ${toFa(invoice.date)}<br>
            ${invoice.dueDate ? 'سرسید — ' + toFa(invoice.dueDate) : ''}
          </div>
        </div>
      </div>

      <div class="meta">
        <div>
          <b>${isSale ? 'مشتری:' : 'فروشنده:'}</b> ${party?.name || '—'}<br>
          ${party?.phone ? 'تلفن — ' + party.phone : ''}<br>
          ${party?.address ? party.address : ''}
        </div>
        <div style="text-align: left;">
          ${statusBadge}<br>
          <span style="font-size: 11px; color: #475569;">دسته: ${catLabel}</span>
        </div>
      </div>

      <table>
        <thead>
          <tr>
            <th style="width: 40%;">شرح</th>
            <th style="width: 12%;">واحد</th>
            <th style="width: 12%;">تعداد</th>
            <th style="width: 18%;">قیمت واحد (ت)</th>
            <th style="width: 18%;">جمع (ت)</th>
          </tr>
        </thead>
        <tbody>
          ${itemsRows || '<tr><td colspan="5" style="text-align:center;color:#94a3b8;">موردی نیست</td></tr>'}
        </tbody>
      </table>

      <table style="width: 60%; margin-right: auto; margin-left: auto;">
        <tr><td>جمع کل اقلام:</td><td style="text-align: left;">${toFa(invoice.items.reduce((a, x) => a + x.total, 0).toLocaleString('fa-IR'))} ت</td></tr>
        ${(invoice.discount ||
          0) > 0 ? '<tr><td>تخفیف:</td><td style="text-align: left;">' + toFa((invoice.discount ||
          0).toLocaleString('fa-IR')) + ' ت</td></tr>' : ''}
        ${(invoice.shipping ||
          0) > 0 ? '<tr><td>حمل:</td><td style="text-align: left;">' + toFa((invoice.shipping ||
          0).toLocaleString('fa-IR')) + ' ت</td></tr>' : ''}
        <tr class="total-row"><td>قیمت نهایی:</td><td style="text-align: left;">${toFa(invoice.total.toLocaleString('fa-IR'))} ت</td></tr>
        <tr><td>پرداخت‌شده:</td><td style="text-align: left;">${toFa(paid.toLocaleString('fa-IR'))} ت</td></tr>
        ${rem > 0 ? '<tr class="total-row"><td>مانده:</td><td style="text-align: left; color: #d97706;">' + toFa(rem.toLocaleString('fa-IR')) + ' ت</td></tr>' : ''}
      </table>

      ${(invoice.payments || []).length > 0 ? `
        <h3 style="margin-top: 14px;">پرداخت‌ها</h3>
        <table>
          <thead>
            <tr>
              <th>روش</th>
              <th>تاریخ</th>
              <th>شماره چک</th>
              <th>بانک</th>
              <th>مبلغ (ت)</th>
            </tr>
          </thead>
          <tbody>${paymentsRows}</tbody>
        </table>
      ` : ''}

      ${bankInfo ? '<div style="margin-top: 10px; font-size: 11px; color: #475569;">' + bankInfo + (settings.bank.cardNo ? ' — کارت: ' + toFa(settings.bank.cardNo) : '') + (settings.bank.sheba ? ' — شبا: ' + settings.bank.sheba : '') + '</div>' : ''}

      ${invoice.notes ? '<div style="margin-top: 10px; padding: 8px 10px; background: #f8fafc; border-radius: 6px; font-size: 11px; line-height: 36.8;"><b>یادداشت:</b> ' + invoice.notes + '</div>' : ''}

      <div class="signature">
        <div class="sig-box">مهر و امضای ${isSale ? 'فروشنده' : 'خریدار'}</div>
        <div class="sig-box">مهر و امضای ${isSale ? 'خریدار' : 'فروشنده'}</div>
      </div>

      <div class="footer">
        ${farmName} — این فاکتور از نرم‌افزار مدیریت مرغداری صادر شده است
      </div>
    `;

    return printTemplate(title + ' — ' + (invoice.number || ''), body);
  };

  const handlePrint = () => {
    printHTML(buildHtml());
  };

  return (
    <div
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      style={{
        position: 'fixed', inset: 0,
        background: 'var(--overlay)',
        zIndex: 110,
        display: 'flex', alignItems: 'flex-end', justifyContent: 'center'
      }}
    >
      <div style={{
        background: 'var(--card-solid)',
        width: '100%', maxWidth: 480, maxHeight: '85vh',
        borderTopLeftRadius: 'var(--r-2xl)',
        borderTopRightRadius: 'var(--r-2xl)',
        overflow: 'hidden',
        display: 'flex', flexDirection: 'column'
      }}>
        <div style={{
          padding: '14px 20px',
          borderBottom: '1px solid var(--border)',
          display: 'flex', alignItems: 'center', gap: 10
        }}>
          <div style={{ flex: 1, fontSize: 'var(--fs-lg)', fontWeight: 700 }}>
            پیش‌نمایش {title}
          </div>
          <button
            onClick={onClose}
            style={{
              width: 32, height: 32, borderRadius: 'var(--r-md)',
              background: 'var(--btn-bg)', border: '1px solid var(--border)',
              color: 'var(--muted)', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: 'inherit', fontSize: 'var(--fs-base)'
            }}
          >✕</button>
        </div>

        <div style={{
          flex: 1, overflowY: 'auto',
          padding: '16px 20px',
          background: 'var(--input-bg)'
        }}>
          {/* پیش‌نمایش A4 در موبایل */}
          <div style={{
            background: '#fff', color: '#0f172a',
            padding: '20px',
            borderRadius: 8,
            boxShadow: '0 4px 12px rgba(0,0,0,.15)',
            fontSize: 'var(--fs-xs)'
          }}>
            <div style={{ textAlign: 'center', marginBottom: 10 }}>
              <div style={{ fontSize: 'var(--fs-md)', fontWeight: 700 }}>{settings.farm.name || 'مرغداری'}</div>
              <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>{title} — {invoice.number}</div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 10, paddingBottom: 8, borderBottom: '1px solid #e2e8f0' }}>
              <span>{party?.name || '—'}</span>
              <span>{toFa(invoice.date)}</span>
            </div>

            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr style={{ background: '#f1f5f9' }}>
                  <th style={{ padding: 4, border: '1px solid #cbd5e1', textAlign: 'right' }}>شرح</th>
                  <th style={{ padding: 4, border: '1px solid #cbd5e1', textAlign: 'right' }}>تعداد</th>
                  <th style={{ padding: 4, border: '1px solid #cbd5e1', textAlign: 'right' }}>جمع</th>
                </tr>
              </thead>
              <tbody>
                {invoice.items.map(it => (
                  <tr key={it.id}>
                    <td style={{ padding: 4, border: '1px solid #cbd5e1' }}>{it.description}</td>
                    <td style={{ padding: 4, border: '1px solid #cbd5e1' }}>{toFa(it.quantity)}</td>
                    <td style={{ padding: 4, border: '1px solid #cbd5e1' }}>{toFa(it.total.toLocaleString('fa-IR'))}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 10, padding: 'var(--pad-normal)', background: '#f1f5f9', borderRadius: 6, fontSize: 'var(--fs-xs)', fontWeight: 700 }}>
              <span>قیمت نهایی:</span>
              <span>{toFa(invoice.total.toLocaleString('fa-IR'))} ت</span>
            </div>

            <div style={{ fontSize: 12, color: '#94a3b8', textAlign: 'center', marginTop: 10 }}>
              پیش‌نمایش — برای مشاهده کامل، چاپ کنید
            </div>
          </div>
        </div>

        <div style={{
          padding: '12px 20px 20px',
          borderTop: '1px solid var(--border)',
          display: 'flex', flexDirection: 'row-reverse', gap: 8
        }}>
          <button
            onClick={handlePrint}
            style={{
              flex: 1, height: 40,
              background: 'var(--accent)', color: 'var(--avatar-text)',
              border: 'none', borderRadius: 'var(--r-md)',
              fontFamily: 'inherit', fontSize: 'var(--fs-base)', fontWeight: 600,
              cursor: 'pointer'
            }}
          >🖨 چاپ / ذخیره PDF</button>
          <button
            onClick={onClose}
            style={{
              flex: 1, height: 40,
              background: 'var(--btn-bg)', color: 'var(--muted)',
              border: '1px solid var(--border)', borderRadius: 'var(--r-md)',
              fontFamily: 'inherit', fontSize: 'var(--fs-base)', fontWeight: 600,
              cursor: 'pointer'
            }}
          >لغو</button>
        </div>
      </div>
    </div>
  );
}
