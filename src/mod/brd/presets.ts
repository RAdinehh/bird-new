/**
 * مقادیر پیش‌فرض پرندگان و نژادها
 * منبع: استانداردهای جهانی صنعت طیور
 */
import { DEFAULT_STANDARDS } from '../set/standards/data';

export interface BirdPreset {
  name: string;
  cycleDays: number | null;
  fcrStandard: number | null;
  notes: string;
}

export const BIRD_PRESETS: Record<string, BirdPreset> = {
  'مرغ': { name: 'مرغ', cycleDays: 500, fcrStandard: 2.0, notes: 'مرغ تخم‌گذار تجاری' },
  'مرغ گوشتی': { name: 'مرغ گوشتی', cycleDays: 42, fcrStandard: 1.65, notes: 'جوجه گوشتی' },
  'مرغ تخم‌گذار': { name: 'مرغ تخم‌گذار', cycleDays: 500, fcrStandard: 2.05, notes: 'مرغ تخم‌گذار تجاری' },
  'مرغ مادر': { name: 'مرغ مادر', cycleDays: 500, fcrStandard: 2.2, notes: 'مرغ مادر' },
  'اردک': { name: 'اردک', cycleDays: 60, fcrStandard: 2.5, notes: 'اردک گوشتی' },
  'بوقلمون': { name: 'بوقلمون', cycleDays: 120, fcrStandard: 2.8, notes: 'بوقلمون گوشتی' },
  'بلدرچین': { name: 'بلدرچین', cycleDays: 45, fcrStandard: 3.0, notes: 'بلدرچین' },
  'غاز': { name: 'غاز', cycleDays: 90, fcrStandard: 3.0, notes: 'غاز گوشتی' },
};

/** نژادهای پیشنهادی (فقط راهنما — کاربر آزاد است) */
export const SUGGESTED_BREEDS: Record<string, string[]> = {
  'مرغ': ['مرندی', 'گلپایگانی', 'گلین'],
};

export function findBirdPreset(name: string): BirdPreset | undefined {
  const trimmed = name.trim();
  if (!trimmed) return undefined;

  // ۱. اول از استانداردهای نژاد بخون (match دقیق)
  for (const std of Object.values(DEFAULT_STANDARDS)) {
    if (std.nameFa === trimmed) {
      const lastGrowth = std.growth?.weightByAge?.[std.growth.weightByAge.length - 1];
      return {
        name: std.nameFa,
        cycleDays: std.biology.cullDay ?? null,
        fcrStandard: lastGrowth?.fcr ?? null,
        notes: std.nameEn || '',
      };
    }
  }

  // ۲. اگه پیدا نشد، از presets قدیمی
  if (BIRD_PRESETS[trimmed]) return BIRD_PRESETS[trimmed];
  for (const key of Object.keys(BIRD_PRESETS)) {
    if (trimmed.includes(key) || key.includes(trimmed)) return BIRD_PRESETS[key];
  }
  return undefined;
}
