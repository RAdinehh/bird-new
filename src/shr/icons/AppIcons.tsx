import React from 'react';

export const ICON_KEYS = [
  'hall', 'zone',
  'feeder', 'drinker', 'litter',
  'ventilation', 'water_system', 'power', 'scale',
  'feeder_chain', 'feeder_tube', 'feeder_bucket', 'feeder_tray',
  'drinker_cup', 'drinker_hanging', 'drinker_fountain', 'drinker_trough', 'litter_straw',
  'kg', 'pcs',
  'chicken', 'duck', 'turkey', 'egg', 'fertile_egg', 'broken_egg', 'manure',
  'hatch', 'feed', 'invoice', 'meds',
  'mortality', 'water', 'stats', 'flock', 'flocks_group',
  'inventory', 'cash', 'climate', 'unknown'
,
  'fan_ceiling', 'air_inlet', 'cooling_pad', 'feeder_manual', 'nipple', 'drinker_capsule', 'heating', 'jet_heater', 'duct_heater', 'radiant_brooder', 'lighting', 'lamp_led', 'lamp_fluorescent', 'dimmer', 'litter_sawdust', 'litter_roll', 'litter_rice_hull', 'litter_sand', 'litter_peat', 'cooling', 'fogger', 'misting_system', 'swamp_cooler', 'water_filter', 'water_pipe', 'generator', 'electrical_panel', 'cable', 'weighing', 'platform_scale', 'cleaning', 'pressure_washer', 'sprayer', 'flame_gun', 'safety', 'fire_extinguisher', 'smoke_detector', 'emergency_light', 'first_aid', 'hand_tools', 'wheelbarrow', 'shovel', 'rake', 'feed_scoop', 'broom', 'bucket', 'auxiliary', 'camera', 'sensor'
] as const;

export type AppIconKey = typeof ICON_KEYS[number];

// تابع پیدا کردن مسیر آیکون‌های تایید شده‌ی اپلی در پروژه
export function getAppIconPath(key: AppIconKey): string {
  return `/assets/emojis/${key}.svg`;
}

// کامپوننت هوشمند برای نمایش ایموجی‌های جدید با سایز استاندارد
interface AppIconProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  name?: string;
  size?: number | string;
}

export const AppIcon: React.FC<AppIconProps> = ({ name, size = '1.2em', style, ...props }) => {
  const key = (name && ICON_KEYS.includes(name as AppIconKey) ? name : 'unknown') as AppIconKey;
  
  return (
    <img
      src={getAppIconPath(key)}
      alt={key}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: size,
        height: size,
        verticalAlign: 'middle',
        objectFit: 'contain',
        ...style
      }}
      {...props}
    />
  );
};

// تابع تشخیص خودکار ایموجی از روی متن‌های فارسی (Keyword Matcher)
export function getSmartIconByText(text?: string): AppIconKey {
  if (!text) return 'unknown';
  const t = text.toLowerCase();

  if (t.includes('دان') || t.includes('تغذیه') || t.includes('خوراک') || t.includes('جیره') || t.includes('feeder') || t.includes('feed')) return 'feeder';
  if (t.includes('آب') || t.includes('نیپل') || t.includes('کاپ') || t.includes('drinker') || t.includes('water')) return 'drinker';
  if (t.includes('بستر') || t.includes('پوشال') || t.includes('کاه') || t.includes('litter')) return 'litter';
  if (t.includes('سالن') || t.includes('سوله') || t.includes('آشیانه') || t.includes('hall') || t.includes('coop')) return 'hall';
  if (t.includes('جوجه') || t.includes('هچ') || t.includes('hatch') || t.includes('chick')) return 'hatch';
  if (t.includes('مرغ') || t.includes('خروس') || t.includes('chicken') || t.includes('hen')) return 'chicken';
  if (t.includes('اردک') || t.includes('duck')) return 'duck';
  if (t.includes('بوقلمون') || t.includes('turkey')) return 'turkey';
  if (t.includes('تخم') || t.includes('egg')) return 'egg';
  if (t.includes('دارو') || t.includes('واکسن') || t.includes('درمان') || t.includes('سرنگ') || t.includes('meds') || t.includes('vaccine')) return 'meds';
  if (t.includes('تلفات') || t.includes('مرگ') || t.includes('mortality') || t.includes('dead')) return 'mortality';
  if (t.includes('مالی') || t.includes('پول') || t.includes('هزینه') || t.includes('پرداخت') || t.includes('cash') || t.includes('pay') || t.includes('تومن')) return 'cash';
  if (t.includes('فاکتور') || t.includes('خرید') || t.includes('فروش') || t.includes('معامله') || t.includes('چک') || t.includes('invoice') || t.includes('deal') || t.includes('bill')) return 'invoice';
  if (t.includes('انبار') || t.includes('کیسه') || t.includes('کارتن') || t.includes('بسته') || t.includes('inventory') || t.includes('stock')) return 'inventory';
  if (t.includes('دما') || t.includes('رطوبت') || t.includes('هوا') || t.includes('فن') || t.includes('تهویه') || t.includes('climate') || t.includes('temp') || t.includes('humidity')) return 'climate';
  if (t.includes('آمار') || t.includes('نمودار') || t.includes('گزارش') || t.includes('تولید') || t.includes('stats')) return 'stats';

  return 'unknown';
}

export function isValidIconKey(key: string): key is AppIconKey {
  return (ICON_KEYS as readonly string[]).includes(key);
}
