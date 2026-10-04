import {
  Fan, Wind, Warehouse, Thermometer,
  Drop, DropHalf, BowlFood, Grains,
  Fire, Lightbulb, Lamp, Plug, Lightning,
  Plant, Tree, Stack, Package,
  Camera, Gauge, VideoCamera, Cpu,
  Egg, Barn, Farm,
} from '@phosphor-icons/react';

export type IconWeight = 'thin' | 'light' | 'regular' | 'bold' | 'fill' | 'duotone';

interface IconProps {
  size?: number;
  weight?: IconWeight;
  color?: string;
  className?: string;
}

const ICONS: Record<string, React.ComponentType<any>> = {
  // ─── تهویه ───
  fan_tunnel:     Fan,
  fan_ceiling:    Wind,
  air_inlet:      Warehouse,
  cooling_pad:    DropHalf,

  // ─── تغذیه ───
  feeder_manual:  BowlFood,
  feeder_pan:     BowlFood,
  feeder_chain:   Grains,
  feeder_tube:    BowlFood,
  feeder_bucket:  Package,

  // ─── آبخوری ───
  nipple:           Drop,
  cup:              DropHalf,
  trough:           Drop,
  fountain_drinker: Drop,

  // ─── گرمایش ───
  radiant_brooder: Fire,
  jet_heater:      Fire,
  duct_heater:     Thermometer,

  // ─── روشنایی ───
  lamp_led:         Lightbulb,
  lamp_fluorescent: Lamp,
  dimmer:           Gauge,

  // ─── بستر ───
  litter_wood_shavings: Tree,
  litter_roll:          Stack,
  litter_sand:          Plant,

  // ─── برق‌رسانی ───
  generator:        Lightning,
  electrical_panel: Plug,
  cable:            Lightning,

  // ─── جانبی ───
  camera: Camera,
  sensor: VideoCamera,
  scale:  Gauge,

  // ─── سازگاری با داده‌های قدیمی ───
  lamp:    Lightbulb,
  fan:     Fan,
  heater:  Fire,
  cooler:  DropHalf,
  drinker: Drop,
  feeder:  BowlFood,
  other:   Package,
};

/** رنگ اختصاصی هر دسته */
export const CATEGORY_COLORS: Record<string, string> = {
  ventilation: '#2563eb',  // آبی
  feeding:     '#d97706',  // نارنجی
  drinking:    '#0891b2',  // فیروزه‌ای
  heating:     '#dc2626',  // قرمز
  lighting:    '#ca8a04',  // طلایی
  litter:      '#16a34a',  // سبز
  power:       '#ea580c',  // نارنجی-قرمز
  auxiliary:   '#475569',  // خاکستری
};

export function EquipmentIcon({ type, size = 24, weight = 'duotone', color }: IconProps & { type: string }) {
  const Icon = ICONS[type] || Package;
  return <Icon size={size} weight={weight} color={color} />;
}

/** برای استفاده بدون React — فقط نام آیکون */
export function hasIcon(type: string): boolean {
  return type in ICONS;
}
