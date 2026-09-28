import { Btn } from '../../shr/components/ui';
import { exportTableToCSV, printHTML, printTemplate } from '../../shr/utils/export';
import { useTra, remaining, paidSum, invoiceStatus, STATUS_LABEL, PAYMENT_LABEL } from '../tra/store';
import { useEgg, healthyCount } from '../egg/store';
import { useFlk, getAgeDays } from '../flk/store';
import { useCtc } from '../ctc/store';
import { useBrd } from '../brd/store';
import { useDlg } from '../dlg/store';
import { toFa } from '../../shr/utils/fa';

export default function ExportButtons() {
  const { invoices } = useTra();
  const { productions } = useEgg();
  const { flocks } = useFlk();
  const { contacts } = useCtc();
  const { birds } = useBrd();
  const { logs } = useDlg();

  // ============ Excel: فاکتورهای فروش ============
  const exportSales = () => {
    const headers = ['شماره', 'تاریخ', 'مشتری', 'دسته', 'قیمت نهایی', 'پرداخت‌شده', 'مانده', 'وضعیت'];
    const rows = invoices
      .filter(i => i.type === 'sale')
      .sort((a, b) => b.date.localeCompare(a.date))
      .map(i => {
        const cus = contacts.find(c => c.id === i.partyId);
        const st = invoiceStatus(i);
        return [
          i.number,
          i.date,
          cus?.name || '—',
          i.category,
          i.total,
          paidSum(i.payments || []),
          remaining(i),
          STATUS_LABEL[st]
        ];
      });
    exportTableToCSV('گزارش-فروش', headers, rows);
  };

  // ============ Excel: فاکتورهای خرید ============
  const exportPurchases = () => {
    const headers = ['شماره', 'تاریخ', 'فروشنده', 'دسته', 'قیمت نهایی', 'پرداخت‌شده', 'مانده', 'وضعیت'];
    const rows = invoices
      .filter(i => i.type === 'purchase')
      .sort((a, b) => b.date.localeCompare(a.date))
      .map(i => {
        const sup = contacts.find(c => c.id === i.partyId);
        const st = invoiceStatus(i);
        return [
          i.number,
          i.date,
          sup?.name || '—',
          i.category,
          i.total,
          paidSum(i.payments || []),
          remaining(i),
          STATUS_LABEL[st]
        ];
      });
    exportTableToCSV('گزارش-خرید', headers, rows);
  };

  // ============ Excel: تخم‌گذاری ============
  const exportEggs = () => {
    const headers = ['تاریخ', 'گله', 'سالم', 'شکسته', 'نرم', 'کثیف', 'جمع', 'وزن میانگین'];
    const rows = productions
      .sort((a, b) => b.date.localeCompare(a.date))
      .map(p => {
        const f = flocks.find(x => x.id === p.flockId);
        return [
          p.date,
          f?.name || '—',
          healthyCount(p),
          p.brokenCount,
          p.softCount,
          p.dirtyCount,
          (p.totalCount || 0) + (p.brokenCount || 0) + (p.softCount || 0) + (p.dirtyCount || 0),
          p.avgWeight || ''
        ];
      });
    exportTableToCSV('گزارش-تخم‌گذاری', headers, rows);
  };

  // ============ Excel: گله‌ها ============
  const exportFlocks = () => {
    const headers = ['نام', 'نوع', 'پرنده', 'نژاد', 'سالن', 'تعداد اولیه', 'تعداد فعلی', 'سن (روز)', 'تاریخ شروع'];
    const rows = flocks.map(f => {
      const b = birds.find(x => x.id === f.birdId);
      return [
        f.name,
        f.type === 'layer' ? 'تخم‌گذار' : f.type === 'broiler' ? 'گوشتی' : 'مادر',
        b?.name || '—',
        '—',
        '—',
        f.initialCount || 0,
        f.currentCount || 0,
        getAgeDays(f),
        f.startDate
      ];
    });
    exportTableToCSV('گزارش-گله‌ها', headers, rows);
  };

  // ============ Excel: مخاطبین ============
  const exportContacts = () => {
    const headers = ['نام', 'تلفن', 'شهر', 'نقش‌ها'];
    const rows = contacts.map(c => [
      c.name,
      c.phone,
      c.city,
      c.roles.map(r => r === 'customer' ? 'مشتری' : r === 'supplier' ? 'فروشنده' : 'کارگر').join('، ')
    ]);
    exportTableToCSV('گزارش-مخاطبین', headers, rows);
  };

  // ============ Excel: ثبت روزانه ============
  const exportDailyLogs = () => {
    const headers = ['تاریخ', 'گله', 'دما', 'رطوبت', 'دان (kg)', 'آب (L)', 'تلفات'];
    const rows = logs
      .sort((a, b) => b.date.localeCompare(a.date))
      .map(l => {
        const f = flocks.find(x => x.id === l.flockId);
        const deaths = (l.deaths || []).reduce((a, x) => a + (x.count || 0), 0);
        return [l.date, f?.name || '—', l.temperature || '', l.humidity || '', l.feedAmount || '', l.waterAmount || '', deaths];
      });
    exportTableToCSV('گزارش-ثبت-روزانه', headers, rows);
  };

  // ============ PDF گزارش کلی ============
  const exportSummaryPDF = () => {
    const totalSales = invoices.filter(i => i.type === 'sale').reduce((a, i) => a + i.total, 0);
    const totalPurchases = invoices.filter(i => i.type === 'purchase').reduce((a, i) => a + i.total, 0);
    const totalEggs = productions.reduce((a, p) => a + healthyCount(p), 0);
    const totalFlocks = flocks.filter(f => f.status === 'active').length;
    const totalBirds = flocks.filter(f => f.status === 'active').reduce((a, f) => a + (f.currentCount || f.initialCount || 0), 0);

    const body = `
      <div class="header">
        <div>
          <h1>گزارش کلی مرغداری</h1>
          <div class="farm-info">تاریخ گزارش: ${toFa(new Date().toLocaleDateString('fa-IR'))}</div>
        </div>
      </div>

      <h2>📊 خلاصه‌ی مالی</h2>
      <table>
        <tr><td>فروش کل</td><td style="text-align: left;">${toFa(totalSales.toLocaleString('fa-IR'))} ت</td></tr>
        <tr><td>خرید کل</td><td style="text-align: left;">${toFa(totalPurchases.toLocaleString('fa-IR'))} ت</td></tr>
        <tr class="total-row"><td>سود کل</td><td style="text-align: left;">${toFa((totalSales - totalPurchases).toLocaleString('fa-IR'))} ت</td></tr>
      </table>

      <h2>🐔 وضعیت گله</h2>
      <table>
        <tr><td>تعداد گله فعال</td><td style="text-align: left;">${toFa(totalFlocks)}</td></tr>
        <tr><td>جمع پرنده</td><td style="text-align: left;">${toFa(totalBirds.toLocaleString('fa-IR'))}</td></tr>
      </table>

      <h2>🥚 تولید</h2>
      <table>
        <tr><td>جمع تخم‌گذاری</td><td style="text-align: left;">${toFa(totalEggs.toLocaleString('fa-IR'))} عدد</td></tr>
      </table>

      <div class="footer">
        این گزارش از نرم‌افزار مدیریت مرغداری تولید شده است
      </div>
    `;
    printHTML(printTemplate('گزارش کلی', body));
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-3)' }}>
      <div style={{
        background: 'var(--card)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--r-lg)',
        padding: 'var(--sp-4)',
        display: 'flex', flexDirection: 'column', gap: 'var(--sp-3)'
      }}>
        <div style={{ fontSize: 'var(--fs-sm)', fontWeight: 700, color: 'var(--muted)' }}>
          📊 خروجی Excel (CSV)
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
          <Btn size="sm" onClick={exportSales}>📥 فروش</Btn>
          <Btn size="sm" onClick={exportPurchases}>📤 خرید</Btn>
          <Btn size="sm" onClick={exportEggs}>🥚 تخم‌گذاری</Btn>
          <Btn size="sm" onClick={exportFlocks}>🐔 گله‌ها</Btn>
          <Btn size="sm" onClick={exportContacts}>👥 مخاطبین</Btn>
          <Btn size="sm" onClick={exportDailyLogs}>📋 ثبت روزانه</Btn>
        </div>
        <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--muted)', lineHeight: 1.7 }}>
          فایل‌های CSV در Excel و Google Sheets باز می‌شوند
        </div>
      </div>

      <div style={{
        background: 'var(--card)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--r-lg)',
        padding: 'var(--sp-4)',
        display: 'flex', flexDirection: 'column', gap: 'var(--sp-3)'
      }}>
        <div style={{ fontSize: 'var(--fs-sm)', fontWeight: 700, color: 'var(--muted)' }}>
          📄 خروجی PDF
        </div>
        <Btn variant="primary" full onClick={exportSummaryPDF}>
          📄 گزارش کلی PDF
        </Btn>
        <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--muted)', lineHeight: 1.7 }}>
          در پنجره‌ی چاپ، «ذخیره به PDF» را انتخاب کنید
        </div>
      </div>
    </div>
  );
}
