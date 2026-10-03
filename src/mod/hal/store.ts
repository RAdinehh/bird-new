/**
 * store.ts — بخش hal
 */
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { v4 as uuid } from 'uuid';

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

export interface Equipment {
  id: string;
  hallId: string;
  type: string;
  name: string;
  count: number | null;
  unitPrice: number | null;
  purchasedAt: string;
  warranty: number | null;
  notes: string;
  /** ظرفیت هر واحد — m³/h برای هواکش/کولر، وات برای لامپ/هیتر */
  capacity?: number | null;
  /** بازدهی — lumen/Watt برای لامپ */
  efficiency?: number | null;
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
    { name: 'pm-hal' }
  )
);

export const EQUIP_LABELS: Record<string, { name: string; icon: string }> = {
  lamp: { name: 'لامپ', icon: '💡' },
  fan: { name: 'فن', icon: '🌀' },
  heater: { name: 'هیتر', icon: '🔥' },
  cooler: { name: 'کولر', icon: '❄' },
  drinker: { name: 'آبخوری', icon: '💧' },
  feeder: { name: 'دانخوری', icon: '🥣' },
  camera: { name: 'دوربین', icon: '📷' },
  sensor: { name: 'سنسور', icon: '📡' },
  other: { name: 'سایر', icon: '🔧' }
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
  tunnel: 'تونلی', longitudinal: 'طولی', transverse: 'عرضی', natural: 'طبیعی', none: '—'
};
export const FEEDER_LABELS: Record<string, string> = {
  chain: 'زنجیری', pan: 'بشقابی', tube: 'لوله‌ای', manual: 'دستی', none: '—'
};
export const DRINKER_LABELS: Record<string, string> = {
  nipple: 'نوپل', cup: 'کاپ', trough: 'ناودانی', manual: 'دستی', none: '—'
};
export const LITTER_LABELS: Record<string, string> = {
  wood_shavings: 'پوشال چوب', straw: 'کاه', sand: 'ماسه', net: 'شبکه', none: '—'
};
