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
  ventilation: { name: 'تهویه', icon: '🌀' },
  feeding: { name: 'دانخوری', icon: '🍽' },
  drinking: { name: 'آبخوری', icon: '🚰' },
  heating: { name: 'گرمایش', icon: '🔥' },
  lighting: { name: 'روشنایی', icon: '💡' },
  litter: { name: 'بستر', icon: '🛏' },
  power: { name: 'برق‌رسانی', icon: '⚡' },
  auxiliary: { name: 'جانبی', icon: '🔧' },
  water_treatment: { name: 'تصفیه آب', icon: '💦' },
  safety: { name: 'ایمنی', icon: '🚨' },
  cleaning: { name: 'شستشو', icon: '🧽' },
  hand_tools: { name: 'ابزار دستی', icon: '🛠' },
  weighing: { name: 'وزن‌کشی', icon: '⚖️' },
  cooling: { name: 'سردکننده', icon: '🧊' },
};

export const KIND_LABELS: Record<EquipmentKind, { name: string; icon: string }> = {
  asset: { name: 'دارایی ثابت', icon: '🏭' },
  consumable: { name: 'مصرفی', icon: '📦' },
};

export const STATUS_LABELS: Record<EquipmentStatus, { name: string; icon: string; tone: string }> = {
  active:      { name: 'سالم',         icon: '🟢', tone: 'accent' },
  broken:      { name: 'خراب',          icon: '🔴', tone: 'danger' },
  maintenance: { name: 'نیاز به سرویس', icon: '🟡', tone: 'warn' },
  repairing:   { name: 'در حال تعمیر',  icon: '🟠', tone: 'warn' },
  retired:     { name: 'کنار گذاشته',   icon: '⚫', tone: 'gray' },
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
  fan_tunnel:   { name: 'فن تونلی', icon: '🌀' },
  fan_ceiling:  { name: 'فن سقفی', icon: '💨' },
  air_inlet:    { name: 'دریچه هوا', icon: '🪟' },
  cooling_pad:  { name: 'پد سلولزی', icon: '❄' },
  // تغذیه
  feeder_manual: { name: 'دانخوری دستی', icon: '🪣' },
  feeder_pan:    { name: 'دانخوری بشقابی', icon: '🥣' },
  feeder_chain:  { name: 'دانخوری زنجیری', icon: '⛓' },
  feeder_tube:   { name: 'دانخوری لوله‌ای', icon: '🥤' },
  feeder_bucket: { name: 'دانخوری سطلی لبه‌دار', icon: '🪣' },
  // آبخوری
  nipple:           { name: 'نیپل', icon: '💧' },
  cup:              { name: 'کاپ', icon: '🥛' },
  trough:           { name: 'ناودانی', icon: '🛁' },
  fountain_drinker: { name: 'آبخوری کله قندی', icon: '⛲' },
  // گرمایش
  radiant_brooder: { name: 'هیتر تابشی', icon: '🔥' },
  jet_heater:      { name: 'هیتر جت', icon: '♨' },
  duct_heater:     { name: 'هیتر کانالی', icon: '🌡' },
  // روشنایی
  lamp_led:         { name: 'لامپ LED', icon: '💡' },
  lamp_fluorescent: { name: 'لامپ فلورسنت', icon: '🔆' },
  dimmer:           { name: 'دیمر', icon: '🎚' },
  // بستر
  litter_wood_shavings: { name: 'پوشال چوب', icon: '🪵' },
  litter_roll:          { name: 'رول کاغذی', icon: '📜' },
  litter_sand:          { name: 'ماسه', icon: '🏖' },
  // برق‌رسانی
  generator:        { name: 'ژنراتور', icon: '⚡' },
  electrical_panel: { name: 'تابلو برق', icon: '🔌' },
  cable:            { name: 'کابل و سیم', icon: '🔗' },
  // جانبی
  camera: { name: 'دوربین', icon: '📷' },
  sensor: { name: 'سنسور', icon: '📡' },
  scale:  { name: 'ترازو', icon: '⚖' },
  // 🆕 تصفیه آب
  water_tank:   { name: 'مخزن آب', icon: '🛢' },
  water_filter: { name: 'فیلتر آب', icon: '🔵' },
  water_pipe:   { name: 'لوله‌کشی آب', icon: '🚰' },
  // 🆕 ایمنی
  fire_extinguisher: { name: 'کپسول آتش‌نشانی', icon: '🧯' },
  smoke_detector:    { name: 'دتکتور دود', icon: '🔔' },
  emergency_light:   { name: 'چراغ اضطراری', icon: '🔦' },
  first_aid:         { name: 'جعبه کمک‌های اولیه', icon: '🩹' },
  // 🆕 شستشو
  pressure_washer: { name: 'واش‌پرس', icon: '💦' },
  sprayer:         { name: 'سمپاش', icon: '🧴' },
  flame_gun:       { name: 'شعله‌افکن', icon: '🔥' },
  // 🆕 ابزار دستی
  shovel:     { name: 'بیل', icon: '🧹' },
  wheelbarrow:{ name: 'فرقان', icon: '🚛' },
  rake:       { name: 'چنگک', icon: '🪣' },
  feed_scoop: { name: 'پیمانه دان', icon: '🥄' },
  broom:      { name: 'جارو', icon: '🧹' },
  bucket:     { name: 'سطل', icon: '🪣' },
  // 🆕 وزن‌کشی
  bird_scale:     { name: 'ترازوی پرنده', icon: '⚖' },
  feed_scale:     { name: 'ترازوی دان', icon: '🌾' },
  platform_scale: { name: 'باسکول کفه‌ای', icon: '🏗' },
  // 🆕 سردکننده
  fogger:         { name: 'مه‌ساز', icon: '🌫' },
  misting_system: { name: 'سیستم پاشش', icon: '💧' },
  swamp_cooler:   { name: 'کولر آبی', icon: '🧊' },
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
  air_inlet: 'دریچه هوا',
  cooling_pad: 'پد سلولزی',
};

export const FEEDER_LABELS: Record<string, string> = {
  feeder_manual: 'دانخوری دستی',
  feeder_pan: 'دانخوری بشقابی',
  feeder_chain: 'دانخوری زنجیری',
  feeder_tube: 'دانخوری لوله‌ای',
  feeder_bucket: 'دانخوری سطلی لبه‌دار',
};

export const DRINKER_LABELS: Record<string, string> = {
  nipple: 'نیپل',
  cup: 'کاپ',
  trough: 'ناودانی',
  fountain_drinker: 'آبخوری کله قندی',
};

export const LITTER_LABELS: Record<string, string> = {
  litter_wood_shavings: 'پوشال چوب',
  litter_roll: 'رول کاغذی',
  litter_sand: 'ماسه',
};



/** نگاشت آیکن برای هر زیرنوع منبع */
