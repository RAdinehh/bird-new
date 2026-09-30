type Theme = 'light' | 'dark';

const FONT_SCALES: Record<string, number> = {
  small: 0.9,
  medium: 1,
  large: 1.15,
  xlarge: 1.3
};

const FONT_BASE = {
  xs: 11,
  sm: 12.5,
  base: 13,
  md: 14,
  lg: 15.5,
  xl: 19,
  xxl: 23
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
  orange: {
    light: { accent: '#ea580c', soft: 'rgba(234,88,12,.12)', border: 'rgba(234,88,12,.35)', avatarText: '#ffffff' },
    dark:  { accent: '#fb923c', soft: 'rgba(251,146,60,.15)', border: 'rgba(251,146,60,.4)',  avatarText: '#0f172a' }
  },
  purple: {
    light: { accent: '#7c3aed', soft: 'rgba(124,58,237,.12)', border: 'rgba(124,58,237,.35)', avatarText: '#ffffff' },
    dark:  { accent: '#a78bfa', soft: 'rgba(167,139,250,.15)', border: 'rgba(167,139,250,.4)',  avatarText: '#0f172a' }
  }
};

export function applyTheme(
  theme: Theme,
  accentColor: string,
  fontSize: string,
  animations: boolean,
  lowPowerMode: boolean,
  highContrast: boolean,
  density: string = 'comfortable'
) {
  const root = document.documentElement;

  // ===== رنگ اصلی =====
  const preset = ACCENT_PRESETS[accentColor] || ACCENT_PRESETS.green;
  const accent = theme === 'dark' ? preset.dark : preset.light;
  root.style.setProperty('--accent', accent.accent);
  root.style.setProperty('--accent-soft', accent.soft);
  root.style.setProperty('--accent-border', accent.border);
  root.style.setProperty('--avatar-text', accent.avatarText);

  // ===== اندازه فونت =====
  const scale = FONT_SCALES[fontSize] || 1;
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
