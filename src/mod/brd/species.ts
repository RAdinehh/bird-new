/**
 * species.ts — گونه‌های پرنده (سطح ۱ مدل داده)
 *
 * طبق FOUNDATION: ۳ سطح
 *   ۱. گونه (Species) — این فایل
 *   ۲. پرنده (Bird) — instance از گونه
 *   ۳. نژاد (Breed) — نژاد + هدف
 *
 * کاربر می‌تونه گونه‌ی جدید اضافه کنه (customSpecies در useSet).
 */

export interface Species {
  /** شناسه یکتا — built-in از BirdKind، custom آزاد */
  kind: string;
  /** نام فارسی — «مرغ» */
  nameFa: string;
  /** نام انگلیسی */
  nameEn?: string;
  /** ایموجی */
  icon: string;
  /** آیا built-in ئه؟ (کاربر نمی‌تونه حذف کنه) */
  builtIn: boolean;
}

export const DEFAULT_SPECIES: Species[] = [
  { kind: 'chicken', nameFa: 'مرغ',     nameEn: 'Chicken', icon: '🐔', builtIn: true },
  { kind: 'duck',    nameFa: 'اردک',    nameEn: 'Duck',    icon: '🦆', builtIn: true },
  { kind: 'turkey',  nameFa: 'بوقلمون', nameEn: 'Turkey',  icon: '🦃', builtIn: true },
  { kind: 'quail',   nameFa: 'بلدرچین', nameEn: 'Quail',   icon: '🐦', builtIn: true },
  { kind: 'goose',   nameFa: 'غاز',     nameEn: 'Goose',   icon: '🦢', builtIn: true },
];

/** پیدا کردن گونه با kind */
export function findSpecies(kind: string, custom: Species[] = []): Species | undefined {
  return [...DEFAULT_SPECIES, ...custom].find(s => s.kind === kind);
}

/** پیدا کردن گونه با نام فارسی */
export function findSpeciesByName(nameFa: string, custom: Species[] = []): Species | undefined {
  const trimmed = nameFa.trim();
  return [...DEFAULT_SPECIES, ...custom].find(s => s.nameFa === trimmed);
}

/** لیست کامل — default + custom */
export function listSpecies(custom: Species[] = []): Species[] {
  return [...DEFAULT_SPECIES, ...custom];
}
