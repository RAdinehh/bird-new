/**
 * store.ts — بخش hal
 */
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { v4 as uuid } from 'uuid';

export interface HallSource {
  id: string;
  type: string;
  count: number | null;
  notes: string;
}

export interface Hall {
  id: string;
  name: string;
  code: string;
  length: number | null;
  width: number | null;
  height: number | null;
  capacity: number | null;
  targetTemp: number | null;
  targetHumidity: number | null;
  ventilation: number | null;
  light: number | null;
  ventilationSystem: string;
  feederType: string;
  drinkerType: string;
  litterType: string;
  address: string;
  builtAt: string;
  lastSanitizedAt: string;
  notes: string;
  /** شناسه پرنده (birdId) — برای محاسبه ظرفیت و استانداردها */
  birdId?: string;
  /** شناسه نژاد (breedId) — دقیق‌تر از پرنده */
  breedId?: string;
  // 🆕 منابع توزیع‌شده
  waterSources?: HallSource[];
  feedSources?: HallSource[];
  ventSources?: HallSource[];
  litterSections?: HallSource[];
  systemNotes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Zone {
  id: string;
  hallId: string;
  name: string;
  capacity: number | null;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export type EquipmentKind = 'asset' | 'consumable' | 'system';

export type EquipmentCategory =
  | 'ventilation'
  | 'feeding'
  | 'drinking'
  | 'heating'
  | 'lighting'
  | 'litter'
  | 'power'
  | 'auxiliary';

export type EquipmentUnit = 'pcs' | 'kg' | 'm2' | 'm' | 'L';

export interface Equipment {
  id: string;
  hallId: string;
  kind: EquipmentKind;
  category: EquipmentCategory;
  type: string;
  name: string;
  count: number | null;
  unit: EquipmentUnit;
  unitPrice: number | null;
  purchasedAt: string;
  warranty: number | null;
  notes: string;
  capacity?: number | null;
  efficiency?: number | null;
  consumeRate?: 'once' | 'per-cycle';
  sourceInvoiceId?: string;
  warehouseItemId?: string;
  createdAt: string;
  updatedAt: string;
}

interface State {
  halls: Hall[];
  zones: Zone[];
  equipment: Equipment[];
  addHall: (h: Omit<Hall, 'id'|'createdAt'|'updatedAt'>) => void;
  updateHall: (id: string, patch: Partial<Hall>) => void;
  deleteHall: (id: string) => void;
  addZone: (z: Omit<Zone, 'id'|'createdAt'|'updatedAt'>) => void;
  updateZone: (id: string, patch: Partial<Zone>) => void;
  deleteZone: (id: string) => void;
  addEquip: (e: Omit<Equipment, 'id'|'createdAt'|'updatedAt'>) => void;
  updateEquip: (id: string, patch: Partial<Equipment>) => void;
  deleteEquip: (id: string) => void;
}

const now = () => new Date().toISOString();

export const useHal = create<State>()(
  persist(
    (set, get) => ({
      halls: [], zones: [], equipment: [],
      addHall: (h) => set({ halls: [...get().halls, {...h, id: uuid(), createdAt: now(), updatedAt: now()}] }),
      updateHall: (id, patch) => set({ halls: get().halls.map(x => x.id === id ? {...x, ...patch, updatedAt: now()} : x) }),
      deleteHall: (id) => set({ halls: get().halls.filter(x => x.id !== id), zones: get().zones.filter(x => x.hallId !== id), equipment: get().equipment.filter(x => x.hallId !== id) }),
      addZone: (z) => set({ zones: [...get().zones, {...z, id: uuid(), createdAt: now(), updatedAt: now()}] }),
      updateZone: (id, patch) => set({ zones: get().zones.map(x => x.id === id ? {...x, ...patch, updatedAt: now()} : x) }),
      deleteZone: (id) => set({ zones: get().zones.filter(x => x.id !== id) }),
      addEquip: (e) => set({ equipment: [...get().equipment, {...e, id: uuid(), createdAt: now(), updatedAt: now()}] }),
      updateEquip: (id, patch) => set({ equipment: get().equipment.map(x => x.id === id ? {...x, ...patch, updatedAt: now()} : x) }),
      deleteEquip: (id) => set({ equipment: get().equipment.filter(x => x.id !== id) })
    }),
    {
      name: 'pm-hal',
      version: 4,
      migrate: (persisted: any, version: number) => {
        if (!persisted?.state?.halls) return persisted;
        if (version < 2) {
          persisted.state.halls = persisted.state.halls.map((h: any) => {
            const waterSources = h.waterSources || (h.drinkerType ? [{
              id: 'legacy-w-' + h.id,
              type: h.drinkerType,
              count: null,
              notes: '',
            }] : []);
            const feedSources = h.feedSources || (h.feederType ? [{
              id: 'legacy-f-' + h.id,
              type: h.feederType,
              count: null,
              notes: '',
            }] : []);
            const ventSources = h.ventSources || (h.ventilationSystem ? [{
              id: 'legacy-v-' + h.id,
              type: h.ventilationSystem,
              count: null,
              notes: '',
            }] : []);
            const litterSections = h.litterSections || (h.litterType ? [{
              id: 'legacy-l-' + h.id,
              type: h.litterType,
              count: h.length && h.width ? h.length * h.width : null,
              notes: '',
            }] : []);
            return {
              ...h,
              waterSources,
              feedSources,
              ventSources,
              litterSections,
              systemNotes: h.systemNotes || '',
            };
          });
        }
        if (version < 3) {
          persisted.state.equipment = (persisted.state.equipment || []).map((e: any) => {
            const map: Record<string, { kind: string; category: string; unit: string }> = {
              lamp:    { kind: 'asset', category: 'lighting',    unit: 'pcs' },
              fan:     { kind: 'asset', category: 'ventilation', unit: 'pcs' },
              cooler:  { kind: 'asset', category: 'ventilation', unit: 'pcs' },
              heater:  { kind: 'asset', category: 'heating',     unit: 'pcs' },
              drinker: { kind: 'asset', category: 'drinking',    unit: 'pcs' },
              feeder:  { kind: 'asset', category: 'feeding',     unit: 'pcs' },
              camera:  { kind: 'asset', category: 'auxiliary',   unit: 'pcs' },
              sensor:  { kind: 'asset', category: 'auxiliary',   unit: 'pcs' },
              other:   { kind: 'asset', category: 'auxiliary',   unit: 'pcs' },
            };
            const m = map[e.type] || map.other;
            return {
              ...e,
              kind: e.kind || m.kind,
              category: e.category || m.category,
              unit: e.unit || m.unit,
            };
          });
        }
        if (version < 4) {
          const typeMap: Record<string, string> = {
            chain: 'feeder_chain',
            pan: 'feeder_pan',
            tube: 'feeder_tube',
            tunnel: 'fan_tunnel',
            longitudinal: 'fan_tunnel',
            transverse: 'fan_ceiling',
            natural: 'air_inlet',
            wood_shavings: 'litter_wood_shavings',
            straw: 'litter_roll',
            sand: 'litter_sand',
            manual: 'feeder_manual',
          };
          const fixSources = (arr: any[]) => (arr || []).map((src: any) => ({
            ...src,
            type: typeMap[src.type] || src.type,
          }));
          persisted.state.halls = (persisted.state.halls || []).map((h: any) => ({
            ...h,
            waterSources: fixSources(h.waterSources),
            feedSources: fixSources(h.feedSources),
            ventSources: fixSources(h.ventSources),
            litterSections: fixSources(h.litterSections),
          }));
        }
        return persisted;
      },
    }
  )
);

export const CATEGORY_LABELS: Record<EquipmentCategory, { name: string; icon: string }> = {
  ventilation: { name: 'تهویه', icon: '🌀' },
  feeding: { name: 'تغذیه', icon: '🍽' },
  drinking: { name: 'آبخوری', icon: '🚰' },
  heating: { name: 'گرمایش', icon: '🔥' },
  lighting: { name: 'روشنایی', icon: '💡' },
  litter: { name: 'بستر', icon: '🛏' },
  power: { name: 'برق‌رسانی', icon: '⚡' },
  auxiliary: { name: 'جانبی', icon: '🔧' },
};

export const KIND_LABELS: Record<EquipmentKind, { name: string; icon: string }> = {
  asset: { name: 'دارایی ثابت', icon: '🏭' },
  consumable: { name: 'مصرفی', icon: '📦' },
  system: { name: 'سیستم', icon: '⚙️' },
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
  tunnel: 'تونلی', longitudinal: 'طولی', transverse: 'عرضی', natural: 'طبیعی', none: '—',
};

export const FEEDER_LABELS: Record<string, string> = {
  feeder_manual: 'دانخوری دستی',
  feeder_pan: 'دانخوری بشقابی',
  feeder_chain: 'دانخوری زنجیری',
  feeder_tube: 'دانخوری لوله‌ای',
  feeder_bucket: 'دانخوری سطلی لبه‌دار',
  chain: 'زنجیری', pan: 'بشقابی', tube: 'لوله‌ای', manual: 'دستی', none: '—',
};

export const DRINKER_LABELS: Record<string, string> = {
  nipple: 'نیپل',
  cup: 'کاپ',
  trough: 'ناودانی',
  fountain_drinker: 'آبخوری کله قندی',
  manual: 'دستی', none: '—',
};

export const LITTER_LABELS: Record<string, string> = {
  litter_wood_shavings: 'پوشال چوب',
  litter_roll: 'رول کاغذی',
  litter_sand: 'ماسه',
};



/** نگاشت آیکن برای هر زیرنوع منبع */
export function sourceIcon(type: string): string {
  const map: Record<string, string> = {
    nipple: '💧', cup: '🥛', trough: '🛁', fountain_drinker: '⛲',
    feeder_manual: '🪣', feeder_pan: '🥣', feeder_chain: '⛓', feeder_tube: '🥤', feeder_bucket: '🪣',
    fan_tunnel: '🌀', fan_ceiling: '💨', air_inlet: '🪟', cooling_pad: '❄',
    litter_wood_shavings: '🪵', litter_roll: '📜', litter_sand: '🏖',
    tunnel: '🌀', longitudinal: '💨', transverse: '🌬', natural: '🍃',
    chain: '⛓', pan: '🥣', tube: '🥤', manual: '🪣',
    wood_shavings: '🪵', straw: '🌾', sand: '🏖', net: '🕸',
  };
  return map[type] || '•';
}
