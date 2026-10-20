/**
 * store.ts — بخش hal
 */
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { v4 as uuid } from 'uuid';
import { ensureWhsItem, syncWhsItem, removeWhsItem } from './api/equipmentWhs';
import { isFanLike, isLampLike } from './helpers';

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
  /** 🆕 یادداشت ضدعفونی (دستی) */
  sanitizeNotes?: string;
  /** 🆕 وضعیت سالن */
  status?: 'active' | 'empty' | 'sanitizing' | 'maintenance' | 'inactive';
  /** 🆕 آرشیو */
  archived?: boolean;
  /** 🆕 مسئول سالن (FK → ctc، نقش کارگر) */
  responsibleId?: string;
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
  /** 🆕 آرشیو */
  archived?: boolean;
  createdAt: string;
  updatedAt: string;
}

export type EquipmentKind = 'asset' | 'consumable';

export type EquipmentStatus = 'active' | 'broken' | 'maintenance' | 'repairing' | 'retired' | 'archived';

export type EquipmentCategory =
  | 'ventilation'
  | 'feeding'
  | 'drinking'
  | 'heating'
  | 'lighting'
  | 'litter'
  | 'power'
  | 'auxiliary'
  | 'water_treatment'
  | 'safety'
  | 'cleaning'
  | 'hand_tools'
  | 'weighing'
  | 'cooling';

export type EquipmentUnit = 'pcs' | 'kg' | 'm2' | 'm' | 'L';

export interface Equipment {
  id: string;
  hallId: string;
  /** 🆕 بخش (FK → Zone) */
  zoneId?: string;
  kind?: EquipmentKind;  // 🆕 optional — از type خودکار محاسبه می‌شه
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
  /** 🆕 وضعیت تجهیز */
  status?: EquipmentStatus;
  /** 🆕 برند سازنده (پارس، ستاره، آکو، ...) */
  brand?: string;
  /** 🆕 شناسه تأمین‌کننده (FK → ctc) */
  supplierId?: string;
  sourceInvoiceId?: string;
  warehouseItemId?: string;
  /** 🆕 شماره سریال تجهیز */
  serialNo?: string;
  /** 🆕 مدل / نوع تجهیز */
  model?: string;
  createdAt: string;
  updatedAt: string;
}

// ═══ Sync بین Equipment و Hall (Single Source of Truth) ═══
/** نگاشت دسته تجهیز → فیلد Hall */
const HALL_FIELD_BY_CAT: Record<string, keyof Hall | null> = {
  ventilation: 'ventilationSystem',
  feeding: 'feederType',
  drinking: 'drinkerType',
  litter: 'litterType',
  lighting: null,
  heating: null,
  power: null,
  auxiliary: null,
  water_treatment: null,
  safety: null,
  cleaning: null,
  hand_tools: null,
  weighing: null,
  cooling: null,
};

/**
 * محاسبه patch برای Hall بر اساس Equipment های موجود
 * آخرین تجهیز هر دسته = مقدار Hall (اولویت آخری که اضافه/ویرایش شده)
 */
function computeHallPatch(hallId: string, equipment: Equipment[], hall: Hall | null): Partial<Hall> {
  const hallEquip = equipment.filter(e => e.hallId === hallId);
  const patch: Partial<Hall> = {};
  // ── فیلدهای string (نوع تجهیز) ──
  Object.entries(HALL_FIELD_BY_CAT).forEach(([cat, field]) => {
    if (!field) return;
    const items = hallEquip.filter(e => e.category === cat);
    const last = items.length > 0 ? items[items.length - 1] : null;
    (patch as Record<string, string>)[field as string] = last?.type || '';
  });
  // ── 🆕 تهویه (m³/h) — مجموع ظرفیت فن‌ها ──
  const totalAirflow = hallEquip
    .filter(e => isFanLike(e.type))
    .reduce((a, e) => a + ((e.count || 0) * (e.capacity || 0)), 0);
  patch.ventilation = totalAirflow > 0 ? totalAirflow : null;
  // ── 🆕 روشنایی (lux) — مجموع لومن / مساحت ──
  if (hall) {
    const area = (hall.length || 0) * (hall.width || 0);
    if (area > 0) {
      const lampLumensPerW = (type: string) => {
        if (type === 'lamp_led') return 100;
        if (type === 'lamp_fluorescent') return 60;
        return 15;
      };
      const totalLumens = hallEquip
        .filter(e => isLampLike(e.type))
        .reduce((a, e) => a + ((e.count || 0) * (e.capacity || 0) * lampLumensPerW(e.type)), 0);
      patch.light = totalLumens > 0 ? Math.round(totalLumens / area) : null;
    }
  }
  return patch;
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
  addEquip: (e: Omit<Equipment, 'id'|'createdAt'|'updatedAt'>) => string;
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
      deleteZone: (id) => set({
        zones: get().zones.filter(x => x.id !== id),
        equipment: get().equipment.map(e =>
          e.zoneId === id ? { ...e, zoneId: '' } : e
        )
      }),
      addEquip: (e) => {
        const id = uuid();
        const eq = { ...e, id, createdAt: now(), updatedAt: now() } as Equipment;
        const nextEquipment = [...get().equipment, eq];
        const hall = get().halls.find(h => h.id === eq.hallId) || null;
        const hallPatch = computeHallPatch(eq.hallId, nextEquipment, hall);
        set({
          equipment: nextEquipment,
          halls: get().halls.map(h => h.id === eq.hallId ? { ...h, ...hallPatch, updatedAt: now() } : h),
        });
        // 🆕 سینک با انبار
        try {
          const whsId = ensureWhsItem(eq);
          if (whsId) set({ equipment: get().equipment.map(x => x.id === id ? { ...x, warehouseItemId: whsId } : x) });
        } catch (err) { console.error('[HAL] whs sync:', err); }
        return id;
      },
      updateEquip: (id, patch) => {
        const prev = get().equipment.find(x => x.id === id);
        const nextEquipment = get().equipment.map(x => x.id === id ? {...x, ...patch, updatedAt: now()} : x);
        const updated = nextEquipment.find(x => x.id === id);
        // halls تحت تأثیر: قبلی + جدید
        const affected = new Set<string>();
        if (prev?.hallId) affected.add(prev.hallId);
        if (updated?.hallId) affected.add(updated.hallId);
        const patches: Record<string, Partial<Hall>> = {};
        affected.forEach(hid => {
          const hall = get().halls.find(h => h.id === hid) || null;
          patches[hid] = computeHallPatch(hid, nextEquipment, hall);
        });
        set({
          equipment: nextEquipment,
          halls: get().halls.map(h => patches[h.id] ? { ...h, ...patches[h.id], updatedAt: now() } : h),
        });
        const eq = get().equipment.find(x => x.id === id);
        if (eq) try { syncWhsItem(eq); } catch {}
      },
      deleteEquip: (id) => {
        const eq = get().equipment.find(x => x.id === id);
        if (eq) try { removeWhsItem(eq); } catch {}
        const nextEquipment = get().equipment.filter(x => x.id !== id);
        if (!eq?.hallId) {
          set({ equipment: nextEquipment });
          return;
        }
        const hall = get().halls.find(h => h.id === eq.hallId) || null;
        const hallPatch = computeHallPatch(eq.hallId, nextEquipment, hall);
        set({
          equipment: nextEquipment,
          halls: get().halls.map(h => h.id === eq.hallId ? { ...h, ...hallPatch, updatedAt: now() } : h),
        });
      }
    }),
    {
      name: 'pm-hal',
      version: 5,
      // ═══ Migration: داده‌های نسخه‌های قدیمی ═══
      // FOUNDATION استثنا — اینجا any مجاز ئه چون:
      //   ۱. داده از localStorage نسخه‌های قبلی میاد (ساختار ناشناخته)
      //   ۲. مشابه JSON.parse — نمی‌تونیم دقیق تایپ کنیم
      //   ۳. بعد از migration، داده به تایپ دقیق تبدیل می‌شه
      // forEach داخلی: هر رکورد legacy، شکل متفاوتی داره
      migrate: (persistedData: unknown, version: number) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const persisted = persistedData as any;
      // 🆕 migration: kind 'system' → 'asset'
      if (Array.isArray(persisted.equipment)) {
        persisted.equipment.forEach((e: any) => {
          if (e.kind === 'system') e.kind = 'asset';
        });
      }

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
        if (version < 5) {
          persisted.state.halls = (persisted.state.halls || []).map((h: any) => {
            const { waterSources, feedSources, ventSources, litterSections, systemNotes, ...rest } = h;
            return rest;
          });
        }
        return persisted;
      },
    }
  )
);

// ═══ Re-export labels برای سازگاری ═══
export {
  CATEGORY_LABELS,
  KIND_LABELS,
  STATUS_LABELS,
  UNIT_LABELS_EQ,
  EQUIP_LABELS,
  EQUIP_CAPACITY_UNIT,
  EQUIP_EFFICIENCY_UNIT,
  VENT_SYS_LABELS,
  FEEDER_LABELS,
  DRINKER_LABELS,
  LITTER_LABELS,
} from './_labels';

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
