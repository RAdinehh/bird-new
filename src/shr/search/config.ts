/** تعریف منابع جستجوی سراسری — فقط این فایل رو برای اضافه/کم کردن ماژول دست بزن */

export interface SourceDef {
  id: string;
  label: string;
  icon: string;
  route: string;
}

export const SOURCES: SourceDef[] = [
  { id: 'flk', label: 'گله‌ها',     icon: '🐔', route: '/flk' },
  { id: 'hal', label: 'سالن‌ها',    icon: '🏠', route: '/hal' },
  { id: 'ctc', label: 'مخاطبین',    icon: '👥', route: '/ctc' },
  { id: 'whs', label: 'انبار',      icon: '📦', route: '/whs' },
  { id: 'tra', label: 'معاملات',    icon: '💰', route: '/tra' },
  { id: 'egg', label: 'تخم‌مرغ',    icon: '🥚', route: '/egg' },
  { id: 'inc', label: 'جوجه‌کشی',   icon: '🐣', route: '/inc' },
  { id: 'dlg', label: 'ثبت روزانه', icon: '📝', route: '/dlg' },
  { id: 'fed', label: 'جیره',       icon: '🌾', route: '/fed' },
  { id: 'alt', label: 'هشدارها',    icon: '🔔', route: '/alt' },
  { id: 'brd', label: 'پرندگان',    icon: '🐦', route: '/brd' },
  { id: 'arc', label: 'آرشیو',      icon: '🗄', route: '/arc' },
];

/** ترتیب نمایش — مهم‌ترها اول */
export const PRIORITY = ['flk','hal','ctc','whs','tra','egg','inc','dlg','fed','alt','brd','arc'];

export const MAX_PER_GROUP = 6;

/** نرمال‌سازی متن فارسی (ی/ک عربی، اعراب، نیم‌فاصله) */
export function normalize(s: string): string {
  if (!s) return '';
  return String(s)
    .toLowerCase()
    .replace(/[\u064A\u0649]/g, 'ی')
    .replace(/\u0643/g, 'ک')
    .replace(/[\u0622\u0623\u0625]/g, 'ا')
    .replace(/\u0629/g, 'ه')
    .replace(/[\u064B-\u0652]/g, '')
    .replace(/\u200C/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** آیا needle توی هرکدوم از فیلدها هست؟ */
export function hit(fields: (string | number | undefined | null)[], needle: string): boolean {
  if (!needle) return false;
  for (const f of fields) {
    if (f == null) continue;
    if (normalize(String(f)).includes(needle)) return true;
  }
  return false;
}

/** آیتم نتیجه */
export interface SearchHit {
  id: string;
  sourceId: string;
  title: string;
  sub?: string;
}

export interface GroupedResult {
  source: SourceDef;
  hits: SearchHit[];
}
