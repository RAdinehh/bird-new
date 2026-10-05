type Theme = 'light' | 'dark';

// مقیاس فونت به درصد (0.85 تا 1.30)
const FONT_SCALES: Record<string, number> = {
  small: 0.90,
  medium: 0.95,
  large: 1.00,
  xlarge: 1.05,
  xxlarge: 1.10,
  huge: 1.15,
  xhuge: 1.20,
  max: 1.25
};

/** تبدیل عدد درصدی (۸۵ تا ۱۳۰) به scale */
export function fontScaleFromPercent(pct: number): number {
  const clamped = Math.max(85, Math.min(130, pct));
  return clamped / 100;
}

const FONT_BASE = {
  xs: 11.8,
  sm: 13.4,
  base: 13.9,
  md: 15,
  lg: 16.6,
  xl: 20.3,
  xxl: 24.6
};

const ACCENT_PRESETS: Record<string, { dark: any; light: any }> = {
  green: {
    light: { accent: '#16a34a', soft: 'rgba(22,163,74,.12)', border: 'rgba(22,163,74,.35)', avatarText: '#ffffff' },
    dark:  { accent: '#22c55e', soft: 'rgba(34,197,94,.15)', border: 'rgba(34,197,94,.4)',  avatarText: '#0f172a' }
  },
  blue: {
    light: { accent: '#0284c7', soft: 'rgba(2,132,199,.12)', border: 'rgba(2,132,199,.35)', avatarText: '#ffffff' },
    dark:  { accent: '#38bdf8', soft: 'rgba(56,189,248,.15)', border: 'rgba(56,189,248,.4)',  avatarText: '#0f172a' }
  },
  turquoise: {
    light: { accent: '#0891b2', soft: 'rgba(8,145,178,.12)', border: 'rgba(8,145,178,.35)', avatarText: '#ffffff' },
    dark:  { accent: '#22d3ee', soft: 'rgba(34,211,238,.15)', border: 'rgba(34,211,238,.4)',  avatarText: '#0f172a' }
  },
  olive: {
    light: { accent: '#65a30d', soft: 'rgba(101,163,13,.12)', border: 'rgba(101,163,13,.35)', avatarText: '#ffffff' },
    dark:  { accent: '#a3e635', soft: 'rgba(163,230,53,.15)', border: 'rgba(163,230,53,.4)',  avatarText: '#0f172a' }
  }
};

export function applyTheme(
  theme: Theme,
  accentColor: string,
  fontSize: string | number,
  animations: boolean,
  lowPowerMode: boolean,
  highContrast: boolean,
  density: string = 'comfortable'
) {
  const root = document.documentElement;

  // ===== رنگ اصلی =====
  // روش ۱: data-attribute (مطمئن‌تر)
  root.setAttribute('data-accent', accentColor);
  // روش ۲: inline style (پشتیبان)
  const preset = ACCENT_PRESETS[accentColor] || ACCENT_PRESETS.green;
  const accent = theme === 'dark' ? preset.dark : preset.light;
  root.style.setProperty('--accent', accent.accent);
  root.style.setProperty('--accent-soft', accent.soft);
  root.style.setProperty('--accent-border', accent.border);
  root.style.setProperty('--avatar-text', accent.avatarText);

  // ===== اندازه فونت =====
  // اگه fontSize عددی بود، مستقیم از همون استفاده کن
  // اگه اسمی بود، از FONT_SCALES
  let scale = 1;
  if (typeof fontSize === 'number') {
    scale = Math.max(0.85, Math.min(1.30, fontSize / 100));
  } else {
    scale = FONT_SCALES[fontSize] || 1;
  }
  root.style.setProperty('--fs-xs',  (FONT_BASE.xs  * scale) + 'px');
  root.style.setProperty('--fs-sm',  (FONT_BASE.sm  * scale) + 'px');
  root.style.setProperty('--fs-base',(FONT_BASE.base * scale) + 'px');
  root.style.setProperty('--fs-md',  (FONT_BASE.md  * scale) + 'px');
  root.style.setProperty('--fs-lg',  (FONT_BASE.lg  * scale) + 'px');
  root.style.setProperty('--fs-xl',  (FONT_BASE.xl  * scale) + 'px');
  root.style.setProperty('--fs-2xl', (FONT_BASE.xxl * scale) + 'px');

  // ===== انیمیشن‌ها =====
  const enableAnim = animations && !lowPowerMode;
  if (enableAnim) {
    root.style.setProperty('--dur-fast', '150ms');
    root.style.setProperty('--dur-base', '200ms');
    root.style.setProperty('--dur-slow', '250ms');
    root.style.setProperty('--dur-enter', '300ms');
    root.style.setProperty('--dur-exit', '150ms');
    root.classList.remove('pm-no-anim');
  } else {
    root.style.setProperty('--dur-fast', '0.01ms');
    root.style.setProperty('--dur-base', '0.01ms');
    root.style.setProperty('--dur-slow', '0.01ms');
    root.style.setProperty('--dur-enter', '0.01ms');
    root.style.setProperty('--dur-exit', '0.01ms');
    root.classList.add('pm-no-anim');
  }

  // ===== حالت کم‌مصرف =====
  if (lowPowerMode) {
    root.classList.add('pm-low-power');
  } else {
    root.classList.remove('pm-low-power');
  }

  // ===== کنتراست بالا =====
  if (highContrast) {
    root.classList.add('pm-high-contrast');
  } else {
    root.classList.remove('pm-high-contrast');
  }

  // ===== تراکم نمایش =====
  root.classList.remove('pm-dense', 'pm-comfy');
  if (density === 'compact') {
    root.classList.add('pm-dense');
  } else {
    root.classList.add('pm-comfy');
  }
}
