import {
  Fan, Wind, Warehouse, Thermometer, ThermometerSimple,
  Drop, DropHalf, BowlFood, Grains, Bread,
  Fire, Lightbulb, Lamp, Plug, Lightning, Power,
  Plant, Tree, Stack, Package, Cube,
  Camera, Gauge, VideoCamera, Cpu, Circuitry,
  Egg, Barn, Farm, Gear, GearSix, Wrench,
  Snowflake, Sun, LightbulbFilament,
} from '@phosphor-icons/react';

export type IconWeight = 'thin' | 'light' | 'regular' | 'bold' | 'fill' | 'duotone';

interface IconProps {
  size?: number;
  weight?: IconWeight;
  color?: string;
  className?: string;
}

// ═══ Equipment subtypes ═══
const EQUIP_ICONS: Record<string, React.ComponentType<any>> = {
  // تهویه
  fan_tunnel:     Fan,
  fan_ceiling:    Wind,
  air_inlet:      Warehouse,
  cooling_pad:    Snowflake,
  // تغذیه
  feeder_manual:  BowlFood,
  feeder_pan:     BowlFood,
  feeder_chain:   Grains,
  feeder_tube:    BowlFood,
  feeder_bucket:  Package,
  // آبخوری
  nipple:           Drop,
  cup:              DropHalf,
  trough:           Drop,
  fountain_drinker: Drop,
  // گرمایش
  radiant_brooder: Fire,
  jet_heater:      Fire,
  duct_heater:     Thermometer,
  // روشنایی
  lamp_led:         Lightbulb,
  lamp_fluorescent: Lamp,
  dimmer:           Gauge,
  // بستر
  litter_wood_shavings: Tree,
  litter_roll:          Stack,
  litter_sand:          Plant,
  // برق‌رسانی
  generator:        Lightning,
  electrical_panel: Plug,
  cable:            Power,
  // جانبی
  camera: Camera,
  sensor: VideoCamera,
  scale:  Gauge,
  // قدیمی
  lamp:    Lightbulb,
  fan:     Fan,
  heater:  Fire,
  cooler:  Snowflake,
  drinker: Drop,
  feeder:  BowlFood,
  other:   Wrench,
};

// ═══ Categories ═══
const CATEGORY_ICONS: Record<string, React.ComponentType<any>> = {
  ventilation: Fan,
  feeding:     Grains,
  drinking:    Drop,
  heating:     Fire,
  lighting:    Lightbulb,
  litter:      Plant,
  power:       Lightning,
  auxiliary:   Wrench,
};

// ═══ Kinds ═══
const KIND_ICONS: Record<string, React.ComponentType<any>> = {
  asset:      Warehouse,
  consumable: Package,
  system:     GearSix,
};

export const CATEGORY_COLORS: Record<string, string> = {
  ventilation: '#2563eb',
  feeding:     '#d97706',
  drinking:    '#0891b2',
  heating:     '#dc2626',
  lighting:    '#ca8a04',
  litter:      '#0d9488',
  power:       '#ea580c',
  auxiliary:   '#475569',
};

export const KIND_COLORS: Record<string, string> = {
  asset:      '#2563eb',
  consumable: '#d97706',
  system:     '#7c3aed',
};

export function EquipmentIcon({ type, size = 24, weight = 'duotone', color }: IconProps & { type: string }) {
  const Icon = EQUIP_ICONS[type] || Wrench;
  return <Icon size={size} weight={weight} color={color} />;
}

export function CategoryIcon({ category, size = 22, weight = 'duotone', color }: IconProps & { category: string }) {
  const Icon = CATEGORY_ICONS[category] || Wrench;
  const c = color || CATEGORY_COLORS[category] || '#475569';
  return <Icon size={size} weight={weight} color={c} />;
}

export function KindIcon({ kind, size = 22, weight = 'duotone', color }: IconProps & { kind: string }) {
  const Icon = KIND_ICONS[kind] || Package;
  const c = color || KIND_COLORS[kind] || '#475569';
  return <Icon size={size} weight={weight} color={c} />;
}
