/** constants/vetMethods.ts — منبع یکتای روش‌های مصرف دامپزشکی (طیور) */

export const VET_METHOD_LABEL: Record<string, string> = {
  water: 'آشامیدنی',
  drinking_water: 'آشامیدنی',
  oral: 'خوراکی',
  injection: 'تزریقی',
  injectable: 'تزریقی',
  feed: 'در دان',
  spray: 'اسپری',
  topical: 'موضعی',
  eye_drop: 'قطره چشمی',
  wing_web: 'بال‌زنی',
  other: '—',
};

/** لیست کامل برای Select/SmartSelect */
export const VET_METHOD_OPTIONS = [
  { value: 'water', label: 'آشامیدنی', icon: 'water' },
  { value: 'oral', label: 'خوراکی', icon: 'meds' },
  { value: 'injection', label: 'تزریقی', icon: 'vet_injection' },
  { value: 'feed', label: 'در دان', icon: 'feed' },
  { value: 'spray', label: 'اسپری', icon: 'sprayer' },
  { value: 'topical', label: 'موضعی', icon: 'vet_topical' },
  { value: 'eye_drop', label: 'قطره چشمی', icon: 'vet_eye_drop' },
  { value: 'wing_web', label: 'بال‌زنی', icon: 'vet_wing_web' },
];
