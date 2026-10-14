import { create } from 'zustand';
import type { BirdStandard } from './standards';
import type { StandardOverrides } from './standards/_override';
import { setByPath, unsetByPath } from './standards/_override';
import { persist } from 'zustand/middleware';
import { DEFAULT_UNITS, type Units } from '../../shr/units';




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
  // واحدها و قالب‌بندی
  units: Units;
  // امنیت
  security: { pinEnabled: boolean; pin: string; recoveryHash?: string; autoLockMin: number; };

  // ظاهر
  theme: 'light' | 'dark';
  accentColor: 'green' | 'blue' | 'turquoise' | 'olive';
  fontSize: 'small' | 'medium' | 'large' | 'xlarge' | 'xxlarge' | 'huge' | 'xhuge' | 'max';
  fontSizePercent: number;
  density: 'compact' | 'comfortable';
  animations: boolean;
  highContrast: boolean;
  lowPowerMode: boolean;
  printPaper: 'A4' | 'A5';

  // ماژول‌ها
  modules: Record<string, boolean>;

  // ویژگی‌های داخلی (زیرماژول‌ها)
  features: {
    vaccine: boolean;         // واکسن و برنامه واکسن
    medicine: boolean;        // دارو (گیاهی + شیمیایی)
  };

  // منوی پایین — ۵ ماژول انتخابی
  bottomNav: string[];

  // اعلان‌ها
  channels: { inApp: boolean; sound: boolean; vibration: boolean; sms: boolean; email: boolean; telegram: boolean; };
  alerts: { critical: boolean; important: boolean; info: boolean; };
  quietHours: { enabled: boolean; from: string; to: string; weekends: boolean; };
  /** 🆕 حذف شد — همه از standards میان */

  dueDateReminders: number[];

  /** استانداردهای سفارشی (ویرایش‌شده توسط کاربر) — legacy */
  customStandards?: Record<string, BirdStandard>;
  /** 🆕 گونه‌های سفارشی (کبک، شترمرغ، ...) */
  customSpecies?: Array<{ kind: string; nameFa: string; nameEn?: string; icon: string; builtIn: boolean }>;

  /** 🆕 تغییرات کاربر بر پایه Diff — سبک‌تر */
  customOverrides?: Record<string, StandardOverrides>;

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
  units: DEFAULT_UNITS,

  bottomNav: ['dsh', 'dlg', 'inc', 'rep', 'set'],

  channels: { inApp: true, sound: true, vibration: true, sms: false, email: false, telegram: false },
  alerts: { critical: true, important: true, info: true },
  quietHours: { enabled: false, from: '22:00', to: '07:00', weekends: true },

  dueDateReminders: [7, 3, 1],
  security: { pinEnabled: false, pin: '', autoLockMin: 0 },
  theme: 'light',
  accentColor: 'green',
  fontSize: 'medium',
  fontSizePercent: 100,
  density: 'comfortable',
  animations: true,
  highContrast: false,
  lowPowerMode: false,
  printPaper: 'A4',
  modules: {},
  features: { vaccine: true, medicine: true },
  customStandards: {},
  customSpecies: [],
  customOverrides: {},

  autoBackup: { enabled: true, intervalHours: 24, maxVersions: 5 },
  encryption: { enabled: false, password: '' },
  auditLog: { enabled: true, maxEntries: 100 },
};

interface State extends Settings {
  update: (patch: Partial<Settings>) => void;
  updateSection: <K extends keyof Settings>(key: K, patch: Partial<Settings[K]>) => void;
  reset: () => void;
  updateStandard: (key: string, std: BirdStandard) => void;
  addSpecies: (species: { kind: string; nameFa: string; nameEn?: string; icon: string }) => void;
  removeSpecies: (kind: string) => void;
  resetStandard: (key: string) => void;
  /** 🆕 ذخیره یک override فیلد خاص */
  setOverride: (key: string, path: string, value: any) => void;
  /** 🆕 حذف override یک فیلد (بازگشت به استاندارد) */
  clearOverride: (key: string, path: string) => void;
  /** 🆕 حذف همه overrideهای یه نژاد */
  clearAllOverrides: (key: string) => void;
  toggleModule: (id: string) => void;
}

export const useSet = create<State>()(
  persist(
    (set, get) => ({
      ...defaultSettings,
      update: (patch) => set((state: any) => ({ ...state, ...patch })),
      updateSection: (key, patch) => set((state: any) => ({ ...state, [key]: { ...state[key], ...patch } })),
      reset: () => set(defaultSettings as any),
      addSpecies: (species) => set((state: any) => {
        const existing = state.customSpecies || [];
        if (existing.some((s: any) => s.kind === species.kind)) return state;
        return { ...state, customSpecies: [...existing, { ...species, builtIn: false }] };
      }),
      removeSpecies: (kind) => set((state: any) => ({
        ...state,
        customSpecies: (state.customSpecies || []).filter((s: any) => s.kind !== kind),
      })),
      updateStandard: (key: string, std: BirdStandard) => set((state: any) => ({
        ...state,
        customStandards: { ...(state.customStandards || {}), [key]: std }
      })),
      resetStandard: (key: string) => set((state: any) => {
        const next = { ...(state.customStandards || {}) };
        delete next[key];
        return { ...state, customStandards: next };
      }),
      setOverride: (key: string, path: string, value: any) => set((state: any) => {
        const overrides = { ...(state.customOverrides || {}) };
        const current = overrides[key] || {};
        overrides[key] = setByPath(current, path, value);
        return { ...state, customOverrides: overrides };
      }),
      clearOverride: (key: string, path: string) => set((state: any) => {
        const overrides = { ...(state.customOverrides || {}) };
        if (!overrides[key]) return state;
        overrides[key] = unsetByPath(overrides[key], path);
        // اگه خالی شد، حذفش کن
        if (Object.keys(overrides[key]).length === 0) delete overrides[key];
        return { ...state, customOverrides: overrides };
      }),
      clearAllOverrides: (key: string) => set((state: any) => {
        const overrides = { ...(state.customOverrides || {}) };
        delete overrides[key];
        return { ...state, customOverrides: overrides };
      }),
      toggleModule: (id) => set({
        modules: { ...get().modules, [id]: !get().modules[id] }
      })
    }),
    {
      name: 'pm-settings',
      merge: (persisted, current) => {
        const p: any = persisted || {};

        // 🆕 Migration (۱۴۰۴/۰۷/۲۱): حذف litter.kgPerM2 قدیمی (ساختار جدید: kgPerM2ByMaterial)
        const migrateLitter = (obj: any): any => {
          if (!obj?.litter || obj.litter.kgPerM2 === undefined) return obj;
          const { kgPerM2: _old, ...litterRest } = obj.litter;
          if (Object.keys(litterRest).length === 0) {
            const { litter: _l, ...objRest } = obj;
            return objRest;
          }
          return { ...obj, litter: litterRest };
        };

        const cleanedOverrides: Record<string, any> = {};
        for (const [k, v] of Object.entries(p.customOverrides || {})) {
          cleanedOverrides[k] = migrateLitter(v);
        }
        const cleanedStandards: Record<string, any> = {};
        for (const [k, v] of Object.entries(p.customStandards || {})) {
          cleanedStandards[k] = migrateLitter(v);
        }

        return {
          ...current,
          ...p,
          modules: { ...current.modules, ...(p.modules || {}) },
          bottomNav: Array.isArray(p.bottomNav) && p.bottomNav.length === 5
            ? p.bottomNav
            : current.bottomNav,
          units: { ...DEFAULT_UNITS, ...(p.units || {}) },
          channels: { ...current.channels, ...(p.channels || {}) },
          alerts: { ...current.alerts, ...(p.alerts || {}) },
          quietHours: { ...current.quietHours, ...(p.quietHours || {}) },
          features: { ...current.features, ...(p.features || {}) },
          customOverrides: cleanedOverrides,
          customStandards: cleanedStandards,
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
