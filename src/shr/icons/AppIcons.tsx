import React from 'react';

export const ICON_KEYS = [
  'hall', 'zone',
  'feeder', 'drinker', 'litter',
  'ventilation', 'water_system', 'power', 'scale',
  'feeder_chain', 'feeder_tube', 'feeder_bucket', 'feeder_tray',
  'drinker_cup', 'drinker_hanging', 'drinker_fountain', 'drinker_trough', 'litter_straw',
  'kg', 'pcs',
  'chicken', 'duck', 'turkey', 'egg', 'fertile_egg', 'incubator', 'candling', 'egg_tray', 'old_rooster', 'soft_egg', 'dirty_egg', 'rotten_egg', 'cal_7', 'cal_30', 'cal_6m', 'cal_90', 'cal_all', 'broken_egg', 'manure', 'herbal', 'other', 'equipment', 'bag', 'vial', 'liquid', 'dose', 'pack', 'cage', 'corn', 'wheat', 'barley', 'bran', 'soybean_meal', 'sesame_meal', 'sunflower_meal', 'canola_meal', 'fish_meal', 'alfalfa', 'calcium_powder', 'oyster_shell', 'rock_salt', 'salt', 'oil', 'amino_acid', 'premix',
  'hatch', 'feed', 'invoice', 'meds',
  'mortality', 'water', 'stats', 'flock', 'flocks_group',
  'inventory', 'behavior', 'alert_info', 'alert_important', 'alert_critical', 'alert_bell', 'payment_promise', 'reminder', 'expired', 'stock_empty', 'expiring_soon', 'stock_low', 'cash', 'climate', 'compare', 'trophy', 'broken', 'target', 'export_doc', 'profit_trend', 'export_report', 'compare_scale', 'cal_3m', 'excel_export', 'unknown'
,
  'fan_tunnel', 'fan_ceiling', 'air_inlet', 'cooling_pad', 'feeder_manual', 'nipple', 'drinker_capsule', 'heating', 'jet_heater', 'duct_heater', 'radiant_brooder', 'lighting', 'lamp_led', 'lamp_fluorescent', 'dimmer', 'litter_sawdust', 'litter_roll', 'litter_rice_hull', 'litter_sand', 'litter_peat', 'cooling', 'fogger', 'misting_system', 'swamp_cooler', 'water_filter', 'water_pipe', 'generator', 'electrical_panel', 'cable', 'weighing', 'platform_scale', 'bird_scale', 'feed_scale', 'cleaning', 'pressure_washer', 'sprayer', 'flame_gun', 'safety', 'fire_extinguisher', 'smoke_detector', 'emergency_light', 'first_aid', 'hand_tools', 'wheelbarrow', 'shovel', 'rake', 'feed_scoop', 'broom', 'bucket', 'auxiliary', 'camera', 'sensor', 'vet_eye_drop', 'vet_wing_web', 'vet_injection', 'vet_topical', 'cause_disease', 'cause_heat_stress', 'cause_suffocation', 'cause_cannibalism', 'cause_injury', 'cause_weakness', 'cause_culling', 'sex_male', 'sex_female', 'sex_mixed',
  'bank_melli', 'bank_mellat', 'bank_saderat', 'bank_tejarat', 'bank_sepah', 'bank_keshavarzi', 'bank_maskan', 'bank_refah', 'bank_postbank', 'bank_tosee', 'bank_sanatmadan', 'bank_tosee_coop', 'bank_markazi', 'bank_pasargad', 'bank_saman', 'bank_parsian', 'bank_en', 'bank_ayande', 'bank_sina', 'bank_day', 'bank_shahr', 'bank_sarmaye', 'bank_gardeshgari', 'bank_iranzamin', 'bank_karafarin', 'bank_khavarmiane', 'bank_mehreiran', 'bank_resalat', 'bank_mellal', 'bank_noor', 'bank_caspian', 'bank_ansar', 'bank_hekmat', 'bank_ghavamin', 'bank_kosar', 'bank_mehreghtesad', 'bank_other',
  'folder', 'folder_open', 'storage_disk', 'image_file', 'audio_file', 'video_file', 'attachment', 'archive_box', 'daily_log', 'contact_user'
] as const;

export type AppIconKey = typeof ICON_KEYS[number];

export const ICON_ASSET_VERSION = 34;

/** نگاشت کلیدهای قدیمی یا مترادف به کلیدهای استاندارد برای حفظ سازگاری با داده‌های ذخیره‌شده */
export const ICON_KEY_ALIASES: Record<string, AppIconKey> = {
  bell: 'alert_bell',
  critical: 'alert_critical',
  important: 'alert_important',
  warn: 'alert_important',
  warning: 'alert_important',
  info: 'alert_info',
  remind: 'reminder',
  promise: 'payment_promise',
  pay_promise: 'payment_promise',
  stock: 'inventory',
  temp: 'climate',
  temperature: 'climate',
};

const INLINE_FALLBACK_SVG =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><text x="50%" y="54%" dominant-baseline="middle" text-anchor="middle" font-size="48">🏷️</text></svg>'
  );

export function normalizeIconKey(name?: string): AppIconKey {
  if (!name) return 'unknown';
  const trimmed = name.trim();
  if (ICON_KEYS.includes(trimmed as AppIconKey)) {
    return trimmed as AppIconKey;
  }
  if (trimmed in ICON_KEY_ALIASES) {
    return ICON_KEY_ALIASES[trimmed];
  }
  return 'unknown';
}

// تابع پیدا کردن مسیر آیکون‌های تایید شده‌ی اپلی در پروژه
export function getAppIconPath(key: AppIconKey): string {
  return '/assets/emojis/' + key + '.svg?v=' + ICON_ASSET_VERSION;
}

// کامپوننت هوشمند برای نمایش ایموجی‌های جدید با سایز استاندارد و مقاوم در برابر خطای لود
interface AppIconProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  name?: string;
  size?: number | string;
}

export const AppIcon: React.FC<AppIconProps> = ({ name, size = '1.2em', style, onError, ...props }) => {
  const key = normalizeIconKey(name);

  const handleError: React.ReactEventHandler<HTMLImageElement> = (e) => {
    const img = e.currentTarget;
    const step = img.dataset.fallbackStep || '0';
    if (step === '0' && key !== 'unknown') {
      img.dataset.fallbackStep = '1';
      img.src = getAppIconPath('unknown');
    } else if (step !== '2') {
      img.dataset.fallbackStep = '2';
      img.src = INLINE_FALLBACK_SVG;
    }
    onError?.(e);
  };

  return (
    <img
      src={getAppIconPath(key)}
      alt={key}
      onError={handleError}
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
  if (t.includes('نطفه') || t.includes('fertile')) return 'fertile_egg';
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

export function isValidIconKey(key?: string): key is AppIconKey {
  if (!key) return false;
  const t = key.trim();
  return ICON_KEYS.includes(t as AppIconKey) || t in ICON_KEY_ALIASES;
}

export function getSmartFeedIcon(name?: string, fallback: AppIconKey = 'feed'): AppIconKey {
  if (!name) return fallback;
  const n = name.trim().toLowerCase();
  if (n.includes('سبوس') || n.includes('bran')) return 'bran';
  if (n.includes('ذرت')) return 'corn';
  if (n.includes('گندم')) return 'wheat';
  if (/(?:^|\s|\u200c)جو(?:$|\s|\u200c)|barley/.test(n)) return 'barley';
  if (n.includes('روغن')) return 'oil';
  if (n.includes('سویا')) return 'soybean_meal';
  if (n.includes('کنجد')) return 'sesame_meal';
  if (n.includes('آفتابگردان')) return 'sunflower_meal';
  if (n.includes('کانولا') || n.includes('کلزا')) return 'canola_meal';
  if (n.includes('ماهی')) return 'fish_meal';
  if (n.includes('یونجه')) return 'alfalfa';
  if (n.includes('صدف')) return 'oyster_shell';
  if (n.includes('کلسیم') || n.includes('آهک') || n.includes('فسفات')) return 'calcium_powder';
  if (n.includes('نمک')) return 'salt';
  if (n.includes('متیونین') || n.includes('لیزین')) return 'amino_acid';
  if (n.includes('پرمیکس') || n.includes('ویتامین') || n.includes('مکمل')) return 'premix';
  return fallback;
}
