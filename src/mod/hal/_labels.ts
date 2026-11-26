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
  heating:         { name: 'گرمایش', icon: '🔥' },
  lighting:        { name: 'روشنایی', icon: '💡' },
  litter:          { name: 'بستر', icon: 'litter' },
  cooling:         { name: 'سرمایش', icon: '🧊' },
  water_treatment: { name: 'آب‌رسانی', icon: 'water_system' },
  power:           { name: 'برق', icon: 'power' },
  weighing:        { name: 'توزین', icon: 'scale' },
  cleaning:        { name: 'شستشو', icon: '🧽' },
  safety:          { name: 'ایمنی', icon: '🚨' },
  hand_tools:      { name: 'ابزار دستی', icon: '🛠' },
  auxiliary:       { name: 'جانبی', icon: '🔧' },
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
  fan_ceiling:  { name: 'فن سقفی', icon: '💨' },
  air_inlet:    { name: 'دریچه اینلت', icon: '🪟' },
  cooling_pad:  { name: 'پد سلولزی', icon: '❄' },
  // دانخوری
  feeder_chick_tray: { name: 'سینی جوجه', icon: 'feeder_tray' },
  feeder_pan:        { name: 'دانخوری بشقابی', icon: 'feeder' },
  feeder_chain:      { name: 'دانخوری زنجیری', icon: 'feeder_chain' },
  feeder_tube:       { name: 'دانخوری لوله‌ای', icon: 'feeder_tube' },
  feeder_bucket:     { name: 'دانخوری سطلی', icon: 'feeder_bucket' },
  feeder_manual:     { name: 'دانخوری دستی', icon: '🪣' },
  // آبخوری
  nipple:               { name: 'نیپل', icon: 'drinker' },
  cup:                  { name: 'کاپ', icon: 'drinker_cup' },
  drinker_auto_hanging: { name: 'آبخوری آویز', icon: 'drinker_hanging' },
  fountain_drinker:     { name: 'آبخوری کله‌قندی', icon: 'drinker_fountain' },
  trough:               { name: 'آبخوری ناودانی', icon: 'drinker_trough' },
  drinker_capsule:      { name: 'آبخوری کپسولی', icon: '🧪' },
  // گرمایش
  jet_heater:      { name: 'جت هیتر', icon: '♨' },
  duct_heater:     { name: 'هیتر کابینتی', icon: '🌡' },
  radiant_brooder: { name: 'هیتر تابشی', icon: '🔥' },
  // سرمایش
  fogger:         { name: 'مه‌پاش', icon: '🌫' },
  misting_system: { name: 'رطوبت‌ساز', icon: '💧' },
  swamp_cooler:   { name: 'کولر آبی', icon: '🧊' },
  // روشنایی
  lamp_led:         { name: 'لامپ LED', icon: '💡' },
  lamp_fluorescent: { name: 'لامپ مهتابی', icon: '🔆' },
  dimmer:           { name: 'دیمر', icon: '🎚' },
  // بستر
  litter_wood_shavings: { name: 'پوشال چوب', icon: 'litter' },
  litter_sawdust:       { name: 'خاک‌اره', icon: 'litter' },
  litter_roll:          { name: 'رول کاغذی', icon: '📜' },
  litter_rice_hull:     { name: 'سبوس برنج', icon: '🌾' },
  litter_straw:         { name: 'کاه و کلش', icon: 'litter_straw' },
  litter_sand:          { name: 'ماسه', icon: '🪨' },
  litter_peat:          { name: 'پیت ماس', icon: '🌱' },
  // آب‌رسانی
  water_tank:   { name: 'مخزن آب', icon: 'water_system' },
  water_filter: { name: 'فیلتر آب', icon: '🔵' },
  water_pipe:   { name: 'لوله آب', icon: '🚰' },
  // برق
  generator:        { name: 'ژنراتور', icon: 'power' },
  electrical_panel: { name: 'تابلو برق', icon: '🔌' },
  cable:            { name: 'کابل و سیم', icon: '🔗' },
  // توزین
  bird_scale:     { name: 'ترازوی پرنده', icon: 'scale' },
  feed_scale:     { name: 'ترازوی دان', icon: 'scale' },
  platform_scale: { name: 'باسکول کفه‌ای', icon: '⚖️' },
  // شستشو
  pressure_washer: { name: 'واش‌پرس', icon: '💦' },
  sprayer:         { name: 'سمپاش', icon: '🚿' },
  flame_gun:       { name: 'شعله‌افکن', icon: '🔥' },
  // ایمنی
  fire_extinguisher: { name: 'کپسول آتش‌نشانی', icon: '🧯' },
  smoke_detector:    { name: 'دتکتور دود', icon: '🚨' },
  emergency_light:   { name: 'چراغ اضطراری', icon: '🔦' },
  first_aid:         { name: 'کمک‌های اولیه', icon: '🩹' },
  // ابزار دستی
  wheelbarrow: { name: 'فرغون', icon: '🚛' },
  shovel:      { name: 'بیل', icon: '⛏️' },
  rake:        { name: 'چنگک', icon: '🔱' },
  feed_scoop:  { name: 'پیمانه دان', icon: '🥄' },
  broom:       { name: 'جارو', icon: '🧹' },
  bucket:      { name: 'سطل', icon: '🪣' },
  // جانبی
  camera: { name: 'دوربین', icon: '📷' },
  sensor: { name: 'سنسور', icon: '📡' },
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
