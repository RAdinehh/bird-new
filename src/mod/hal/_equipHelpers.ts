/**
 * _equipHelpers.ts — helperهای HallEquipSection
 */
import { getEquipUnit } from './equipUnits';
import type { Equipment } from './store';

export const TYPES_BY_CATEGORY: Record<string, string[]> = {
  ventilation: ['fan_tunnel', 'fan_ceiling', 'air_inlet', 'cooling_pad'],
  feeding:     ['feeder_chick_tray', 'feeder_manual', 'feeder_pan', 'feeder_chain', 'feeder_tube', 'feeder_bucket'],  // 🆕 chick_feeder + chick_tray اضافه شدن
  drinking:    ['nipple', 'cup', 'trough', 'fountain_drinker', 'drinker_capsule', 'drinker_auto_hanging'],
  heating:     ['radiant_brooder', 'jet_heater', 'duct_heater'],
  lighting:    ['lamp_led', 'lamp_fluorescent', 'dimmer'],
  litter:      ['litter_wood_shavings', 'litter_roll', 'litter_sand', 'litter_rice_hull', 'litter_straw', 'litter_sawdust', 'litter_peat'],
  power:       ['generator', 'electrical_panel', 'cable'],
  auxiliary:   ['camera', 'sensor', 'scale'],
  // 🆕 ۶ دسته گم‌شده (طبق EquipmentSchema در Zod)
  water_treatment: ['water_tank', 'water_filter', 'water_pipe'],
  safety:          ['fire_extinguisher', 'smoke_detector', 'emergency_light', 'first_aid'],
  cleaning:        ['pressure_washer', 'sprayer', 'flame_gun'],
  hand_tools:      ['shovel', 'wheelbarrow', 'rake', 'feed_scoop', 'broom', 'bucket'],
  weighing:        ['bird_scale', 'feed_scale', 'platform_scale'],
  cooling:         ['cooling_pad', 'fogger', 'misting_system', 'swamp_cooler'],
};

export function typesForCategory(cat: string): string[] {
  return TYPES_BY_CATEGORY[cat] || [];
}

/** ترتیب نمایش */
export const REQUIRED_CATS: string[] = ['ventilation', 'heating', 'lighting', 'drinking', 'feeding', 'litter'];
export const OPTIONAL_CATS: string[] = ['power', 'auxiliary'];
export const ALL_CATS: string[] = [...REQUIRED_CATS, ...OPTIONAL_CATS];

/**
 * واحد هر دسته بر اساس زیرنوع‌های داخلش
 */
export function unitForCategory(cat: string, list: { unit?: string; type?: string }[]): string {
  if (list.length === 0) {
    if (cat === 'ventilation') return 'm³/h';
    if (cat === 'lighting') return 'W';
    if (cat === 'litter') return 'kg';
    if (cat === 'heating') return 'kW';
    return 'عدد';
  }
  return getEquipUnit(list[0].type || '').baseUnit;
}

/** محاسبه مقدار نصب‌شده برای یک دسته */
export function calcInstalled(cat: string, list: Equipment[]): number {
  return list.reduce((a, e) => {
    const def = getEquipUnit(e.type);
    const primary = e.count || 0;
    const secondary = e.capacity != null
      ? e.capacity
      : (def.secondary?.defaultValue || 0);
    return a + def.calc(primary, secondary);
  }, 0);
}

/** 🆕 پیشنهاد placeholder بر اساس زیرنوع */
export const PLACEHOLDER_BY_TYPE: Record<string, string> = {
  // تهویه
  fan_tunnel:        'فن تونلی ۱۲۰',
  fan_ceiling:       'فن سقفی ۵۰',
  air_inlet:         'دریچه دیواری',
  cooling_pad:       'پد سلولزی ۱۵۰×۶۰',
  // دانخوری
  feeder_chick_tray: 'سینی دانخوری جوجه',
  feeder_manual:     'کله‌قندی ۴ کیلویی',
  feeder_pan:        'بشقابی ۴۰ سانت',
  feeder_chain:      'دانخوری زنجیری',
  feeder_tube:       'دانخوری لوله‌ای',
  feeder_bucket:     'سطل لبه‌دار ۱۰ kg',
  // آبخوری
  nipple:            'نیپل استیل',
  drinker_capsule:   'کپسولی ۱ لیتری',
  drinker_auto_hanging: 'جامیکو ستاره',
  cup:               'کاپ آبخوری',
  trough:            'آبخوری ناودانی',
  fountain_drinker:  'کله‌قندی ۳ لیتری',
  // گرمایش
  radiant_brooder:   'هیتر مادون قرمز',
  jet_heater:        'جت هیتر ۵۰ kW',
  duct_heater:       'هیتر کانالی',
  // روشنایی
  lamp_led:          'لامپ LED سقفی',
  lamp_fluorescent:  'لامپ مهتابی',
  dimmer:            'دیمر تریاک',
  // بستر
  litter_wood_shavings: 'خاک‌اره نرم',
  litter_roll:       'رول کاغذی',
  litter_sand:       'ماسه شسته',
  litter_rice_hull:  'سبوس برنج',
  litter_straw:      'کاه خرد شده',
  litter_sawdust:    'خاک‌اره زبر',
  litter_peat:       'پیت ماس',
  // برق
  generator:         'ژنراتور ۱۰ kW',
  electrical_panel:  'تابلو برق اصلی',
  cable:             'کابل ۳×۲.۵',
  // جانبی
  camera:            'دوربین دام',
  sensor:            'سنسور دما',
  scale:             'ترازو دیجیتال',
  // تصفیه آب
  water_tank:        'مخزن ۳۰۰ لیتری',
  water_filter:      'فیلتر آب',
  water_pipe:        'لوله پلی‌اتیلن',
  // ایمنی
  fire_extinguisher: 'کپسول ۶ kg',
  smoke_detector:    'دتکتور دود',
  emergency_light:   'چراغ اضطراری',
  first_aid:         'جعبه کمک‌های اولیه',
  // شستشو
  pressure_washer:   'کارواش ۱۰۰ بار',
  sprayer:           'سم‌پاش ۲۰ لیتری',
  flame_gun:         'شعله‌افکن',
  // ابزار دستی
  shovel:            'بیل نانوایی',
  wheelbarrow:       'فرقون',
  rake:              'شن‌کش',
  feed_scoop:        'ملاقه دان',
  broom:             'جارو صنعتی',
  bucket:            'سطل ۱۰ لیتری',
  // وزن‌کشی
  bird_scale:        'ترازو پرنده',
  feed_scale:        'ترازو دان',
  platform_scale:    'باسکول ۵۰۰ kg',
  // سردکننده
  fogger:            'مه‌پاش',
  misting_system:    'سیستم مه‌پاش',
  swamp_cooler:      'کولر آبی ۴۰۰۰',
};

export function getPlaceholderForType(type: string): string {
  return PLACEHOLDER_BY_TYPE[type] || 'نام تجهیز را بنویسید';
}
