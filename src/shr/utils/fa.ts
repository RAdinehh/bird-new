const FA = '۰۱۲۳۴۵۶۷۸۹';

export const toFa = (s: any): string => 
  String(s ?? '')
    .replace(/[0-9]/g, d => FA[+d])
    .replace(/,/g, '٬');

export const toEn = (s: any): string =>
  String(s ?? '')
    .replace(/[۰-۹]/g, d => String(FA.indexOf(d)))
    .replace(/[٬,]/g, '');

export const numFa = (n: any): string => {
  const num = Number(n || 0);
  if (!isFinite(num)) return '۰';
  return toFa(num.toLocaleString('fa-IR'));
};

/** فرمت عدد هنگام تایپ: جداکننده هزار هر ۳ رقم + ارقام فارسی */
export function formatNumWhileTyping(s: string): string {
  const cleaned = String(s || '')
    .replace(/[۰-۹]/g, d => String(FA.indexOf(d)))
    .replace(/\D/g, '');
  if (!cleaned) return '';
  const noZero = cleaned.replace(/^0+/, '') || '0';
  const withSep = noZero.replace(/\B(?=(\d{3})+(?!\d))/g, '٬');
  return withSep.replace(/[0-9]/g, d => FA[+d]);
}

/** تبدیل عدد به حروف فارسی */
const ONES = ['', 'یک', 'دو', 'سه', 'چهار', 'پنج', 'شش', 'هفت', 'هشت', 'نه'];
const TEENS = ['ده', 'یازده', 'دوازده', 'سیزده', 'چهارده', 'پانزده', 'شانزده', 'هفده', 'هجده', 'نوزده'];
const TENS = ['', '', 'بیست', 'سی', 'چهل', 'پنجاه', 'شصت', 'هفتاد', 'هشتاد', 'نود'];
const HUNDREDS = ['', 'صد', 'دویست', 'سیصد', 'چهارصد', 'پانصد', 'ششصد', 'هفتصد', 'هشتصد', 'نهصد'];
const SCALES = ['', ' هزار', ' میلیون', ' میلیارد', ' بیلیون'];

function threeDigitWords(n: number): string {
  if (n === 0) return '';
  const out: string[] = [];
  const h = Math.floor(n / 100);
  const r = n % 100;
  if (h > 0) out.push(HUNDREDS[h]);
  if (r > 0) {
    if (r < 10) out.push(ONES[r]);
    else if (r < 20) out.push(TEENS[r - 10]);
    else {
      const t = Math.floor(r / 10);
      const o = r % 10;
      if (o === 0) out.push(TENS[t]);
      else out.push(TENS[t] + ' و ' + ONES[o]);
    }
  }
  return out.join(' و ');
}

export function numberToWords(n: number | null | undefined): string {
  if (n === null || n === undefined) return '';
  const num = Math.floor(Math.abs(Number(n)));
  if (isNaN(num)) return '';
  if (num === 0) return 'صفر';

  const groups: number[] = [];
  let tmp = num;
  while (tmp > 0) {
    groups.push(tmp % 1000);
    tmp = Math.floor(tmp / 1000);
  }

  const parts: string[] = [];
  for (let i = groups.length - 1; i >= 0; i--) {
    if (groups[i] > 0) parts.push(threeDigitWords(groups[i]) + SCALES[i]);
  }

  return (n < 0 ? 'منفی ' : '') + parts.join(' و ');
}

/** تجزیه‌ی عدد از رشته‌ی فارسی با جداکننده */
export function parseFaNum(s: any): number {
  if (s === null || s === undefined || s === '') return 0;
  const cleaned = String(s).replace(/[۰-۹]/g, d => String(FA.indexOf(d))).replace(/[^\d.-]/g, '');
  return parseFloat(cleaned) || 0;
}
