/**
 * shr/icons/equipment.tsx — آیکون‌های تجهیزات (Lucide)
 *
 * API عمومی:
 *   <EquipmentIcon type="fan_tunnel" size={22} color="var(--cat-ventilation)" />
 *   <CategoryIcon category="ventilation" size={22} />
 *   <KindIcon kind="asset" size={22} />
 *   <IconBadge category="ventilation" size="md"><Fan /></IconBadge>
 */

import type { ComponentType } from 'react';
import {
  Fan, Wind, PanelTop, Snowflake,
  Utensils, Package, Package2, Wheat,
  Droplet, Droplets, GlassWater, CupSoda,
  Flame, Thermometer,
  Lightbulb, Lamp, Gauge, Sun,
  Leaf, Layers, TreePine, Container,
  Zap, Plug, Power, BatteryCharging,
  Camera, Video, CircuitBoard, Cpu,
  Wrench, Hammer, Shovel, Scale, Briefcase,
  ShieldAlert, ShieldCheck, AlarmSmoke, Cross,
  SprayCan, Droplet as Spray,
  Biohazard, Sparkles,
  Truck, Warehouse,
  Weight, Anchor, Cloudy, Waves,
  Hand, Disc, Link, Pipette, Beer, Cable, Brush,
} from 'lucide-react';

export type IconWeight = 'thin' | 'light' | 'regular' | 'bold' | 'fill' | 'duotone';

interface IconProps {
  size?: number;
  weight?: IconWeight;
  color?: string;
  className?: string;
}

// ═══ Equipment subtypes ═══
const EQUIP_ICONS: Record<string, ComponentType<any>> = {
  // تهویه
  fan_tunnel:     Fan,
  fan_ceiling:    Wind,
  air_inlet:      PanelTop,
  cooling_pad:    Snowflake,
  // تغذیه
  feeder_manual:  Hand,
  feeder_pan:     Disc,
  feeder_chain:   Link,
  feeder_tube:    Pipette,
  feeder_bucket:  Beer,
  // آبخوری
  nipple:           Droplet,
  cup:              CupSoda,
  trough:           GlassWater,
  fountain_drinker: Droplet,
  // گرمایش
  radiant_brooder: Flame,
  jet_heater:      Flame,
  duct_heater:     Thermometer,
  // روشنایی
  lamp_led:         Lightbulb,
  lamp_fluorescent: Lamp,
  dimmer:           Gauge,
  // بستر
  litter_wood_shavings: TreePine,
  litter_roll:          Layers,
  litter_sand:          Leaf,
  // برق‌رسانی
  generator:        Zap,
  electrical_panel: Plug,
  cable:            Power,
  // جانبی
  camera: Camera,
  sensor: Cpu,
  scale:  Scale,
  // تصفیه آب
  water_tank:   Container,
  water_filter: Droplet,
  water_pipe:   Cable,
  // ایمنی
  fire_extinguisher: ShieldAlert,
  smoke_detector:    AlarmSmoke,
  emergency_light:   Sun,
  first_aid:         Cross,
  // شستشو
  pressure_washer: SprayCan,
  sprayer:         SprayCan,
  flame_gun:       Flame,
  // ابزار دستی
  shovel:      Shovel,
  wheelbarrow: Package2,
  rake:        Brush,
  feed_scoop:  Briefcase,
  broom:       Sparkles,
  bucket:      Package,
  // وزن‌کشی
  bird_scale:     Weight,
  feed_scale:     Scale,
  platform_scale: Anchor,
  // سردکننده
  fogger:         Cloudy,
  misting_system: Waves,
  swamp_cooler:   Snowflake,
  // قدیمی
  lamp:    Lightbulb,
  fan:     Fan,
  heater:  Flame,
  cooler:  Snowflake,
  drinker: Droplet,
  feeder:  Utensils,
  other:   Wrench,
};

// ═══ Categories ═══
const CATEGORY_ICONS: Record<string, ComponentType<any>> = {
  ventilation:     Fan,
  feeding:         Utensils,
  drinking:        Droplet,
  heating:         Flame,
  lighting:        Lightbulb,
  litter:          Leaf,
  power:           Zap,
  auxiliary:       Wrench,
  water_treatment: Droplets,
  safety:          ShieldCheck,
  cleaning:        SprayCan,
  hand_tools:      Hammer,
  weighing:        Scale,
  cooling:         Snowflake,
};

// ═══ Kinds ═══
const KIND_ICONS: Record<string, ComponentType<any>> = {
  asset:      Warehouse,
  consumable: Package,
  system:     CircuitBoard,
};

// ═══ Colors ═══
export const CATEGORY_COLORS: Record<string, string> = {
  ventilation:     'var(--cat-ventilation)',
  feeding:         'var(--cat-feeding)',
  drinking:        'var(--cat-drinking)',
  heating:         'var(--cat-heating)',
  lighting:        'var(--cat-lighting)',
  litter:          'var(--cat-litter)',
  power:           'var(--cat-power)',
  auxiliary:       'var(--cat-auxiliary)',
  water_treatment: 'var(--cat-water_treatment)',
  safety:          'var(--cat-safety)',
  cleaning:        'var(--cat-cleaning)',
  hand_tools:      'var(--cat-hand_tools)',
  weighing:        'var(--cat-weighing)',
  cooling:         'var(--cat-cooling)',
};

export const CATEGORY_COLORS_SOFT: Record<string, string> = {
  ventilation:     'var(--cat-ventilation-soft)',
  feeding:         'var(--cat-feeding-soft)',
  drinking:        'var(--cat-drinking-soft)',
  heating:         'var(--cat-heating-soft)',
  lighting:        'var(--cat-lighting-soft)',
  litter:          'var(--cat-litter-soft)',
  power:           'var(--cat-power-soft)',
  auxiliary:       'var(--cat-auxiliary-soft)',
  water_treatment: 'var(--cat-water_treatment-soft)',
  safety:          'var(--cat-safety-soft)',
  cleaning:        'var(--cat-cleaning-soft)',
  hand_tools:      'var(--cat-hand_tools-soft)',
  weighing:        'var(--cat-weighing-soft)',
  cooling:         'var(--cat-cooling-soft)',
};

export const KIND_COLORS: Record<string, string> = {
  asset:      'var(--cat-ventilation)',
  consumable: 'var(--cat-feeding)',
  system:     'var(--purple)',
};

// ═══ API عمومی ═══
export function EquipmentIcon({
  type, size = 24, weight = 'duotone', color,
}: IconProps & { type: string }) {
  void weight;
  const Icon = EQUIP_ICONS[type] || Wrench;
  return <Icon size={size} color={color || 'currentColor'} strokeWidth={2} />;
}

export function CategoryIcon({
  category, size = 24, weight = 'duotone', color,
}: IconProps & { category: string }) {
  void weight;
  const Icon = CATEGORY_ICONS[category] || Wrench;
  const c = color || CATEGORY_COLORS[category] || 'var(--cat-auxiliary)';
  return <Icon size={size} color={c} strokeWidth={2} />;
}

export function KindIcon({
  kind, size = 22, weight = 'duotone', color,
}: IconProps & { kind: string }) {
  void weight;
  const Icon = KIND_ICONS[kind] || Package;
  const c = color || KIND_COLORS[kind] || 'var(--cat-auxiliary)';
  return <Icon size={size} color={c} strokeWidth={2} />;
}

// ═══ 🆕 IconBadge — wrapper رنگی ═══
type BadgeSize = 'sm' | 'md' | 'lg';
const BADGE_SIZES: Record<BadgeSize, { box: number; icon: number; r: number }> = {
  sm: { box: 32, icon: 16, r: 8 },
  md: { box: 38, icon: 20, r: 10 },
  lg: { box: 46, icon: 24, r: 12 },
};

interface BadgeProps {
  category?: string;
  kind?: string;
  size?: BadgeSize;
  children: React.ReactNode;
}

export function IconBadge({ category, kind, size = 'md', children }: BadgeProps) {
  const s = BADGE_SIZES[size];
  const color =
    (category && CATEGORY_COLORS[category]) ||
    (kind && KIND_COLORS[kind]) ||
    'var(--cat-auxiliary)';
  const bg =
    (category && CATEGORY_COLORS_SOFT[category]) ||
    'var(--cat-auxiliary-soft)';

  return (
    <span
      style={{
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        width: s.box, height: s.box, borderRadius: s.r,
        background: bg, color,
        flexShrink: 0,
        lineHeight: 1,
      }}
    >
      {children}
    </span>
  );
}

// ═══ نگاشت آیکن برای زیرنوع (فقط برای استفاده‌های قدیمی) ═══
export function sourceIcon(type: string): string {
  const map: Record<string, string> = {
    nipple: '💧', cup: '🥛', trough: '🛁', fountain_drinker: '⛲',
    feeder_manual: '🪣', feeder_pan: '🥣', feeder_chain: '⛓', feeder_tube: '🥤', feeder_bucket: '🪣',
    fan_tunnel: '🌀', fan_ceiling: '💨', air_inlet: '🪟', cooling_pad: '❄',
  };
  return map[type] || '🔧';
}
