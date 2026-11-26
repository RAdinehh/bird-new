/**
 * _labels.ts — برچسب‌های فارسی برای تجهیزات، سالن، بخش
 * از store.ts جدا شد برای شکستن فایل‌های بزرگ
 */
import type {
  EquipmentCategory,
  EquipmentKind,
  EquipmentStatus,
  EquipmentUnit,
} from './store';

export const CATEGORY_LABELS: Record<EquipmentCategory, { name: string; icon: string }> = {
  ventilation:     { name: 'تهویه', icon: 'ventilation' },
  feeding:         { name: 'دانخوری', icon: 'feeder' },
  drinking:        { name: 'آبخوری', icon: 'drinker' },
  heating:         { name: 'گرمایش', icon: 'heating' },
  lighting:        { name: 'روشنایی', icon: 'lighting' },
  litter:          { name: 'بستر', icon: 'litter' },
  cooling:         { name: 'سرمایش', icon: 'cooling' },
  water_treatment: { name: 'آب‌رسانی', icon: 'water_system' },
  power:           { name: 'برق', icon: 'power' },
  weighing:        { name: 'توزین', icon: 'weighing' },
  cleaning:        { name: 'شستشو', icon: 'cleaning' },
  safety:          { name: 'ایمنی', icon: 'safety' },
  hand_tools:      { name: 'ابزار دستی', icon: 'hand_tools' },
  auxiliary:       { name: 'جانبی', icon: 'auxiliary' },
};

export const KIND_LABELS: Record<EquipmentKind, { name: string; icon: string }> = {
  asset: { name: 'دارایی ثابت', icon: 'hall' },
  consumable: { name: 'مصرفی', icon: 'inventory' },
};

export const STATUS_LABELS: Record<EquipmentStatus, { name: string; icon: string; tone: string }> = {
  active:      { name: 'سالم',         icon: '🟢', tone: 'accent' },
  broken:      { name: 'خراب',          icon: '🔴', tone: 'danger' },
  maintenance: { name: 'نیاز به سرویس', icon: '🟡', tone: 'warn' },
  repairing:   { name: 'در حال تعمیر',  icon: '🟠', tone: 'warn' },
  retired:     { name: 'اسقاط شده',      icon: '🔚', tone: 'gray' },
  archived:    { name: 'آرشیو',         icon: '📦', tone: 'gray' },
};

export const UNIT_LABELS_EQ: Record<EquipmentUnit, string> = {
  pcs: 'عدد',
  kg: 'کیلوگرم',
  m2: 'متر مربع',
  m: 'متر',
  L: 'لیتر',
};

export const EQUIP_LABELS: Record<string, { name: string; icon: string }> = {
  // تهویه
  fan_tunnel:   { name: 'فن تونلی', icon: 'ventilation' },
  fan_ceiling:  { name: 'فن سقفی', icon: 'fan_ceiling' },
  air_inlet:    { name: 'دریچه اینلت', icon: 'air_inlet' },
  cooling_pad:  { name: 'پد سلولزی', icon: 'cooling_pad' },
  // دانخوری
  feeder_chick_tray: { name: 'سینی جوجه', icon: 'feeder_tray' },
  feeder_pan:        { name: 'دانخوری بشقابی', icon: 'feeder' },
  feeder_chain:      { name: 'دانخوری زنجیری', icon: 'feeder_chain' },
  feeder_tube:       { name: 'دانخوری لوله‌ای', icon: 'feeder_tube' },
  feeder_bucket:     { name: 'دانخوری سطلی', icon: 'feeder_bucket' },
  feeder_manual:     { name: 'دانخوری دستی', icon: 'feeder_manual' },
  // آبخوری
  nipple:               { name: 'نیپل', icon: 'nipple' },
  cup:                  { name: 'کاپ', icon: 'drinker_cup' },
  drinker_auto_hanging: { name: 'آبخوری آویز', icon: 'drinker_hanging' },
  fountain_drinker:     { name: 'آبخوری کله‌قندی', icon: 'drinker_fountain' },
  trough:               { name: 'آبخوری ناودانی', icon: 'drinker_trough' },
  drinker_capsule:      { name: 'آبخوری کپسولی', icon: 'drinker_capsule' },
  // گرمایش
  jet_heater:      { name: 'جت هیتر', icon: 'jet_heater' },
  duct_heater:     { name: 'هیتر کابینتی', icon: 'duct_heater' },
  radiant_brooder: { name: 'هیتر تابشی', icon: 'radiant_brooder' },
  // سرمایش
  fogger:         { name: 'مه‌پاش', icon: 'fogger' },
  misting_system: { name: 'رطوبت‌ساز', icon: 'misting_system' },
  swamp_cooler:   { name: 'کولر آبی', icon: 'swamp_cooler' },
  // روشنایی
  lamp_led:         { name: 'لامپ LED', icon: 'lamp_led' },
  lamp_fluorescent: { name: 'لامپ مهتابی', icon: 'lamp_fluorescent' },
  dimmer:           { name: 'دیمر', icon: 'dimmer' },
  // بستر
  litter_wood_shavings: { name: 'پوشال چوب', icon: 'litter' },
  litter_sawdust:       { name: 'خاک‌اره', icon: 'litter_sawdust' },
  litter_roll:          { name: 'رول کاغذی', icon: 'litter_roll' },
  litter_rice_hull:     { name: 'سبوس برنج', icon: 'litter_rice_hull' },
  litter_straw:         { name: 'کاه و کلش', icon: 'litter_straw' },
  litter_sand:          { name: 'ماسه', icon: 'litter_sand' },
  litter_peat:          { name: 'پیت ماس', icon: 'litter_peat' },
  // آب‌رسانی
  water_tank:   { name: 'مخزن آب', icon: 'water_system' },
  water_filter: { name: 'فیلتر آب', icon: 'water_filter' },
  water_pipe:   { name: 'لوله آب', icon: 'water_pipe' },
  // برق
  generator:        { name: 'ژنراتور', icon: 'generator' },
  electrical_panel: { name: 'تابلو برق', icon: 'electrical_panel' },
  cable:            { name: 'کابل و سیم', icon: 'cable' },
  // توزین
  bird_scale:     { name: 'ترازوی پرنده', icon: 'scale' },
  feed_scale:     { name: 'ترازوی دان', icon: 'scale' },
  platform_scale: { name: 'باسکول کفه‌ای', icon: 'platform_scale' },
  // شستشو
  pressure_washer: { name: 'واش‌پرس', icon: 'pressure_washer' },
  sprayer:         { name: 'سمپاش', icon: 'sprayer' },
  flame_gun:       { name: 'شعله‌افکن', icon: 'flame_gun' },
  // ایمنی
  fire_extinguisher: { name: 'کپسول آتش‌نشانی', icon: 'fire_extinguisher' },
  smoke_detector:    { name: 'دتکتور دود', icon: 'smoke_detector' },
  emergency_light:   { name: 'چراغ اضطراری', icon: 'emergency_light' },
  first_aid:         { name: 'کمک‌های اولیه', icon: 'first_aid' },
  // ابزار دستی
  wheelbarrow: { name: 'فرغون', icon: 'wheelbarrow' },
  shovel:      { name: 'بیل', icon: 'shovel' },
  rake:        { name: 'چنگک', icon: 'rake' },
  feed_scoop:  { name: 'پیمانه دان', icon: 'feed_scoop' },
  broom:       { name: 'جارو', icon: 'broom' },
  bucket:      { name: 'سطل', icon: 'bucket' },
  // جانبی
  camera: { name: 'دوربین', icon: 'camera' },
  sensor: { name: 'سنسور', icon: 'sensor' },
  scale:  { name: 'ترازو', icon: '⚖' },
  // سازگاری با داده‌های قدیمی
  lamp:    { name: 'لامپ', icon: '💡' },
  fan:     { name: 'فن', icon: '🌀' },
  heater:  { name: 'هیتر', icon: '🔥' },
  cooler:  { name: 'کولر', icon: '❄' },
  drinker: { name: 'آبخوری', icon: '💧' },
  feeder:  { name: 'دانخوری', icon: '🥣' },
  other:   { name: 'سایر', icon: '🔧' },
};

/** واحد ظرفیت هر نوع تجهیز */
export const EQUIP_CAPACITY_UNIT: Record<string, string> = {
  fan: 'm³/h',
  cooler: 'm³/h',
  heater: 'kW',
  lamp: 'W',
  camera: '—',
  sensor: '—',
  drinker: '—',
  feeder: '—',
  other: '—',
};

/** واحد بازدهی */
export const EQUIP_EFFICIENCY_UNIT: Record<string, string> = {
  lamp: 'lm/W',
};

export const VENT_SYS_LABELS: Record<string, string> = {
  fan_tunnel: 'فن تونلی',
  fan_ceiling: 'فن سقفی',
  air_inlet: 'دریچه اینلت',
  cooling_pad: 'پد سلولزی',
};

export const FEEDER_LABELS: Record<string, string> = {
  feeder_chick_tray: 'سینی جوجه',
  feeder_manual: 'دانخوری دستی',
  feeder_pan: 'دانخوری بشقابی',
  feeder_chain: 'دانخوری زنجیری',
  feeder_tube: 'دانخوری لوله‌ای',
  feeder_bucket: 'دانخوری سطلی',
};

export const DRINKER_LABELS: Record<string, string> = {
  nipple: 'نیپل',
  cup: 'کاپ',
  trough: 'آبخوری ناودانی',
  fountain_drinker: 'آبخوری کله‌قندی',
};

export const LITTER_LABELS: Record<string, string> = {
  litter_wood_shavings: 'پوشال چوب',
  litter_roll: 'رول کاغذی',
  litter_sand: 'ماسه',
  litter_rice_hull: 'سبوس برنج',
  litter_straw: 'کاه و کلش',
  litter_sawdust: 'خاک‌اره',
  litter_peat: 'پیت ماس',
};



/** نگاشت آیکن برای هر زیرنوع منبع */
