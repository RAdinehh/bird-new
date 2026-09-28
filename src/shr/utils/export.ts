import { toFa } from './fa';

/** تبدیل به CSV با BOM برای Excel */
export function toCSV(headers: string[], rows: (string | number | null | undefined)[][]): string {
  const esc = (v: any) => {
    if (v === null || v === undefined) return '';
    const s = String(v);
    if (s.includes(',') || s.includes('"') || s.includes('\n')) {
      return '"' + s.replace(/"/g, '""') + '"';
    }
    return s;
  };

  const lines = [headers.map(esc).join(',')];
  for (const row of rows) {
    lines.push(row.map(esc).join(','));
  }
  // BOM برای UTF-8
  return '\uFEFF' + lines.join('\n');
}

/** دانلود فایل CSV */
export function downloadCSV(filename: string, csvContent: string): void {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename.replace(/\.csv$/, '') + '.csv';
  a.click();
  URL.revokeObjectURL(url);
}

/** تاریخ فایل */
export function fileStamp(): string {
  const d = new Date();
  return d.getFullYear() + '-' +
    String(d.getMonth() + 1).padStart(2, '0') + '-' +
    String(d.getDate()).padStart(2, '0') + '-' +
    String(d.getHours()).padStart(2, '0') +
    String(d.getMinutes()).padStart(2, '0');
}

/** خروجی Excel از یک لیست اشیاء */
export function exportTableToCSV(
  filename: string,
  headers: string[],
  rows: (string | number | null | undefined)[][]
): void {
  const csv = toCSV(headers, rows);
  downloadCSV(filename + '-' + fileStamp() + '.csv', csv);
}

/** چاپ با iframe مخفی — بدون باز کردن پنجره‌ی جدید */
export function printHTML(html: string): void {
  // حذف iframe قبلی اگر هست
  const old = document.getElementById('pm-print-frame');
  if (old) old.remove();

  const iframe = document.createElement('iframe');
  iframe.id = 'pm-print-frame';
  iframe.style.position = 'fixed';
  iframe.style.left = '-9999px';
  iframe.style.width = '210mm';
  iframe.style.height = '297mm';
  iframe.style.border = 'none';
  document.body.appendChild(iframe);

  const doc = iframe.contentDocument;
  if (doc === null) return;

  doc.open();
  doc.write(html);
  doc.close();

  // صبر کن تا فونت لود شود
  setTimeout(() => {
    iframe.contentWindow?.focus();
    iframe.contentWindow?.print();
    setTimeout(() => iframe.remove(), 1000);
  }, 400);
}

/** قالب چاپ استاندارد A4 */
export function printTemplate(title: string, bodyHtml: string, extraCss = ''): string {
  return `<!DOCTYPE html>
<html lang="fa" dir="rtl">
<head>
<meta charset="UTF-8">
<title>${title}</title>
<link href="https://cdn.jsdelivr.net/gh/rastikerdar/vazirmatn@v33.003/Vazirmatn-font-face.css" rel="stylesheet">
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    font-family: Vazirmatn, sans-serif;
    direction: rtl;
    padding: 15mm;
    color: #0f172a;
    background: #fff;
    font-size: 12px;
    line-height: 1.7;
  }
  h1 { font-size: 20px; margin-bottom: 8px; }
  h2 { font-size: 16px; margin-bottom: 6px; color: #334155; }
  h3 { font-size: 14px; margin-bottom: 4px; color: #475569; }
  table { width: 100%; border-collapse: collapse; margin: 8px 0; font-size: 11px; }
  th, td { padding: 6px 8px; border: 1px solid #cbd5e1; text-align: right; }
  th { background: #f1f5f9; font-weight: 700; }
  .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #0f172a; padding-bottom: 10px; margin-bottom: 14px; }
  .farm-info { font-size: 11px; color: #475569; }
  .meta { display: flex; justify-content: space-between; margin-bottom: 12px; font-size: 11px; }
  .total-row { background: #f1f5f9; font-weight: 700; }
  .accent { color: #16a34a; font-weight: 700; }
  .footer { margin-top: 20px; padding-top: 10px; border-top: 1px solid #cbd5e1; font-size: 10px; color: #64748b; text-align: center; }
  .signature { display: flex; justify-content: space-between; margin-top: 30px; }
  .sig-box { width: 40%; text-align: center; padding-top: 40px; border-top: 1px solid #94a3b8; font-size: 11px; }
  .badge { display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 10px; font-weight: 700; }
  .badge-green { background: #dcfce7; color: #16a34a; }
  .badge-amber { background: #fef3c7; color: #d97706; }
  .badge-red { background: #fee2e2; color: #dc2626; }
  @media print {
    body { padding: 10mm; }
    @page { size: A4; margin: 10mm; }
  }
  ${extraCss}
</style>
</head>
<body>
${bodyHtml}
</body>
</html>`;
}
