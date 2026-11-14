/** constants/vetMethods.ts — منبع یکتای روش‌های مصرف دامپزشکی (طیور) */

export const VET_METHOD_LABEL: Record<string, string> = {
  water: '💧 آشامیدنی (در آب)',
  drinking_water: '💧 آشامیدنی (در آب)',
  oral: '🍽 خوراکی',
  injection: '💉 تزریقی',
  injectable: '💉 تزریقی',
  feed: '🌾 مخلوط با دان',
  spray: '🌫 اسپری',
  topical: '🧴 موضعی',
  eye_drop: '👁 قطره چشمی/بینی',
  wing_web: '🪶 بال زدن',
  other: '—',
};

/** لیست کامل برای Select/SmartSelect */
export const VET_METHOD_OPTIONS = [
  { value: 'water', label: '💧 آشامیدنی (در آب)' },
  { value: 'oral', label: '🍽 خوراکی' },
  { value: 'injection', label: '💉 تزریقی' },
  { value: 'feed', label: '🌾 مخلوط با دان' },
  { value: 'spray', label: '🌫 اسپری' },
  { value: 'topical', label: '🧴 موضعی' },
  { value: 'eye_drop', label: '👁 قطره چشمی/بینی' },
  { value: 'wing_web', label: '🪶 بال زدن' },
];
