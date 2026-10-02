import { create } from 'zustand';
import type { BirdStandard } from './standards';
import { persist } from 'zustand/middleware';




export interface Settings {
  schemaVersion: number;
  // پروفایل کاربر
  user: { name: string; phone: string; email: string; role: string; avatar: string; };
  // مرغداری
  farm: {
    name: string; type: string; province: string; city: string;
    address: string; postalCode: string; phone: string;
    licenseNo: string; establishedAt: string; logo: string;
  };
  // بانکی
  bank: { cardNo: string; sheba: string; bankName: string; accountHolder: string; };
  // استانداردها
  units: {
    currency: string; length: string; weight: string; volume: string;
    temperature: string; area: string; dateFormat: string;
    numberFormat: string; thousandSep: string; decimals: string;
  };
  // امنیت
  security: { pinEnabled: boolean; pin: string; recoveryHash?: string; autoLockMin: number; };

  // ظاهر
  theme: 'light' | 'dark';
  accentColor: 'green' | 'blue' | 'orange' | 'purple';
  fontSize: 'small' | 'medium' | 'large' | 'xlarge';
  density: 'compact' | 'comfortable';
  animations: boolean;
  highContrast: boolean;
  lowPowerMode: boolean;
  printPaper: 'A4' | 'A5';

  // ماژول‌ها
  modules: Record<string, boolean>;

  // منوی پایین — ۵ ماژول انتخابی
  bottomNav: string[];

  // اعلان‌ها
  channels: { inApp: boolean; sound: boolean; vibration: boolean; sms: boolean; email: boolean; telegram: boolean; };
  alerts: { critical: boolean; important: boolean; info: boolean; };
  quietHours: { enabled: boolean; from: string; to: string; weekends: boolean; };
  thresholds: { eggDropPercent: number; mortalityPerThousand: number; tempDeviation: number; humidityDeviation: number; waterFeedMin: number; waterFeedMax: number; criticalTempHigh: number; criticalTempLow: number; },
  dueDateReminders: number[];

  /** استانداردهای سفارشی (ویرایش‌شده توسط کاربر) */
  customStandards?: Record<string, BirdStandard>;

  // پشتیبان
  autoBackup: { enabled: boolean; intervalHours: number; maxVersions: number; };
  encryption: { enabled: boolean; password: string; };
  auditLog: { enabled: boolean; maxEntries: number; };
}

const defaultSettings: Settings = {
  schemaVersion: 1,
  user: { name: '', phone: '', email: '', role: 'owner', avatar: '' },
  farm: { name: '', type: 'layer', province: '', city: '', address: '', postalCode: '', phone: '', licenseNo: '', establishedAt: '', logo: '' },
  bank: { cardNo: '', sheba: '', bankName: '', accountHolder: '' },
  units: { currency: 'toman', length: 'm', weight: 'kg', volume: 'L', temperature: 'c', area: 'm2', dateFormat: 'jalali', numberFormat: 'fa', thousandSep: '،', decimals: '2' },

  bottomNav: ['dsh', 'dlg', 'inc', 'rep', 'set'],

  channels: { inApp: true, sound: true, vibration: true, sms: false, email: false, telegram: false },
  alerts: { critical: true, important: true, info: true },
  quietHours: { enabled: false, from: '22:00', to: '07:00', weekends: true },
  thresholds: { eggDropPercent: 10, mortalityPerThousand: 5, tempDeviation: 2, humidityDeviation: 10, waterFeedMin: 1.6, waterFeedMax: 2.2, criticalTempHigh: 32, criticalTempLow: 18 },
  dueDateReminders: [7, 3, 1],
  security: { pinEnabled: false, pin: '', autoLockMin: 0 },
  theme: 'light',
  accentColor: 'green',
  fontSize: 'medium',
  density: 'comfortable',
  animations: true,
  highContrast: false,
  lowPowerMode: false,
  printPaper: 'A4',
  modules: {},
  customStandards: {},

  autoBackup: { enabled: true, intervalHours: 24, maxVersions: 5 },
  encryption: { enabled: false, password: '' },
  auditLog: { enabled: true, maxEntries: 100 },
};

interface State extends Settings {
  update: (patch: Partial<Settings>) => void;
  updateSection: <K extends keyof Settings>(key: K, patch: Partial<Settings[K]>) => void;
  reset: () => void;
  updateStandard: (key: string, std: BirdStandard) => void;
  resetStandard: (key: string) => void;
  toggleModule: (id: string) => void;
}

export const useSet = create<State>()(
  persist(
    (set, get) => ({
      ...defaultSettings,
      update: (patch) => set((state: any) => ({ ...state, ...patch })),
      updateSection: (key, patch) => set((state: any) => ({ ...state, [key]: { ...state[key], ...patch } })),
      reset: () => set(defaultSettings as any),
      updateStandard: (key: string, std: BirdStandard) => set((state: any) => ({
        ...state,
        customStandards: { ...(state.customStandards || {}), [key]: std }
      })),
      resetStandard: (key: string) => set((state: any) => {
        const next = { ...(state.customStandards || {}) };
        delete next[key];
        return { ...state, customStandards: next };
      }),
      toggleModule: (id) => set({
        modules: { ...get().modules, [id]: !get().modules[id] }
      })
    }),
    {
      name: 'pm-settings',
      merge: (persisted, current) => {
        const p: any = persisted || {};
        return {
          ...current,
          ...p,
          modules: { ...current.modules, ...(p.modules || {}) },
          bottomNav: Array.isArray(p.bottomNav) && p.bottomNav.length === 5
            ? p.bottomNav
            : current.bottomNav,
          channels: { ...current.channels, ...(p.channels || {}) },
          alerts: { ...current.alerts, ...(p.alerts || {}) },
          quietHours: { ...current.quietHours, ...(p.quietHours || {}) },
          thresholds: { ...current.thresholds, ...(p.thresholds || {}) }
        };
      }
    }
  )
);

export const MODULE_LABELS: Record<string, { name: string; desc: string; icon: string }> = {
  dsh: { name: 'داشبورد', desc: 'نمای کلی و شاخص‌ها', icon: '🏠' },
  brd: { name: 'پرنده و نژاد', desc: 'مدیریت پرنده‌ها و نژادها', icon: '🐔' },
  hal: { name: 'سالن‌ها', desc: 'مدیریت سالن و تجهیزات', icon: '🏭' },
  ctc: { name: 'مخاطبین', desc: 'مشتری، فروشنده، کارگر', icon: '👥' },
  flk: { name: 'گله‌ها', desc: 'گله‌های تخم‌گذار، گوشتی، مادر', icon: '👨‍🌾' },
  inc: { name: 'جوجه‌کشی', desc: 'دستگاه، ورودی تخم، کندلینگ، هچ', icon: '🥚' },
  egg: { name: 'تخم‌ها', desc: 'تخم‌گذاری و انبار تخم', icon: '🥚' },
  dlg: { name: 'ثبت روزانه', desc: 'چک‌لیست روزانه سالن', icon: '📋' },
  whs: { name: 'انبار', desc: 'مواد، دارو، واکسن، گیاهان', icon: '📦' },
  fed: { name: 'جیره‌نویسی', desc: 'فرمول و نیاز غذایی', icon: '🌾' },
  tra: { name: 'معاملات', desc: 'خرید، فروش، معاملات خاص', icon: '💰' },
  rep: { name: 'گزارش‌ها', desc: 'تحلیل مالی و تولید', icon: '📊' },
  alt: { name: 'هشدارها', desc: 'هشدارهای بحرانی و مهم', icon: '🔔' },
  cal: { name: 'تقویم', desc: 'تقویم تخصصی مرغداری', icon: '📅' },
  doc: { name: 'اسناد', desc: 'فایل‌ها و تصاویر', icon: '📎' },
  set: { name: 'تنظیمات', desc: 'همیشه فعال', icon: '⚙' }
};
