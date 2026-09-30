/**
 * store.ts — Zustand store ماژول inc (Device, EggEntry, Candling, Hatch)
 */
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { v4 as uuid } from 'uuid';
import { parse as parseJ, addDays as addDaysJ, format as formatJ, differenceInDays as diffDaysJ } from 'date-fns-jalali';
import { toEn } from '../../shr/utils/fa';

/* ============ انواع ============ */
export type DeviceMode = 'setter' | 'hatcher' | 'setter+hatcher';
export type DeviceStatus = 'active' | 'idle' | 'maintenance' | 'broken';
export type DealType = 'own' | 'purchase' | 'partnership' | 'rent' | 'consignment';
export type DealStatus = 'active' | 'withdrawn';
export type EntryStatus = 'incubating' | 'candled' | 'locked' | 'hatched' | 'done' | 'failed';

export interface MaintenanceLog {
  id: string;
  date: string;
  type: string;
  cost: number | null;
  description: string;
}

export interface DeviceCapacity {
  birdName: string;
  capacity: number | null;
  setterTemp?: number;
  setterHumidity?: number;
  hatcherTemp?: number;
  hatcherHumidity?: number;
  totalDays?: number;
  lockdownDay?: number;
}

export interface Device {
  id: string; name: string;
  code: string;                    // deprecated
  capacity: number | null;         // deprecated — برای سازگاری
  capacityByBird: DeviceCapacity[];
  mode: DeviceMode;
  status: DeviceStatus;
  temp: number | null;
  humidity: number | null;
  purchasedAt: string; price: number | null;
  warranty: number | null;
  racks: number | null;
  trays: number | null;
  fans: number | null;
  tempSensors: number | null;
  humiditySensors: number | null;
  motorPower: number | null;
  extraCost: number | null;
  maintenanceLogs: MaintenanceLog[];
  equipmentId: string;
  notes: string;
  createdAt: string; updatedAt: string;
}

export interface HatchGroup {
  id: string; name: string;
  targetHatchDate: string; // تاریخ هچ هدف
  notes: string;
  createdAt: string; updatedAt: string;
}

export interface EggEntry {
  id: string;
  deviceId: string;
  hatchGroupId: string;
  birdId: string; breedId: string;
  count: number | null;
  entryDate: string;   // تاریخ ورود به دستگاه
  expectedHatchDate: string; // محاسبه‌شده
  source: string;      // own | purchase | partnership
  dealType: DealType;
  dealStatus: DealStatus;
  dealWithdrawnAt: string;
  dealWithdrawnReason: string;
  dealData: Record<string, any>;
  trayNumbers: string;
  unitPrice: number | null;
  totalPrice: number | null;
  shippingCost: number | null;
  status: EntryStatus;
  generatedInvoiceId: string;
  generatedProductionId: string;
  notes: string;
  createdAt: string; updatedAt: string;
}

export interface Candling {
  id: string;
  eggEntryId: string;
  stage: number;
  date: string;
  alive: number | null;
  infertile: number | null;
  dead: number | null;
  deadEarly?: number | null;
  deadMid?: number | null;
  deadLate?: number | null;
  broken: number | null;
  infertileReason: string;
  deadReason: string;
  notes: string;
  createdAt: string;
}

export interface HatchResult {
  id: string;
  eggEntryId: string;
  date: string;
  hatched: number | null;
  unhatched: number | null;
  deadInShell: number | null;
  pipped: number | null;
  other: number | null;
  gradeA: number | null;
  gradeB: number | null;
  maleCount: number | null;
  femaleCount: number | null;
  unknownCount: number | null;
  avgWeight: number | null;
  generatedFlockId: string;
  generatedInvoiceId: string;
  notes: string;
  createdAt: string;
}

/* ============ Store ============ */
interface State {
  devices: Device[];
  hatchGroups: HatchGroup[];
  eggEntries: EggEntry[];
  candlings: Candling[];
  hatches: HatchResult[];

  addDevice: (d: Omit<Device, 'id'|'createdAt'|'updatedAt'>) => void;
  updateDevice: (id: string, patch: Partial<Device>) => void;
  deleteDevice: (id: string) => void;

  addGroup: (g: Omit<HatchGroup, 'id'|'createdAt'|'updatedAt'>) => void;
  updateGroup: (id: string, patch: Partial<HatchGroup>) => void;
  deleteGroup: (id: string) => void;

  addEntry: (e: Omit<EggEntry, 'id'|'createdAt'|'updatedAt'>) => string;
  updateEntry: (id: string, patch: Partial<EggEntry>) => void;
  deleteEntry: (id: string) => void;

  addCandling: (c: Omit<Candling, 'id'|'createdAt'>) => void;
  updateCandling: (id: string, patch: Partial<Candling>) => void;
  deleteCandling: (id: string) => void;

  addHatch: (h: Omit<HatchResult, 'id'|'createdAt'>) => void;
  updateHatch: (id: string, patch: Partial<HatchResult>) => void;
  deleteHatch: (id: string) => void;
}

const now = () => new Date().toISOString();

export const useInc = create<State>()(
  persist(
    (set, get) => ({
      devices: [], hatchGroups: [], eggEntries: [], candlings: [], hatches: [],

      addDevice: (d) => set({ devices: [...get().devices, {...d, id: uuid(), createdAt: now(), updatedAt: now()}] }),
      updateDevice: (id, patch) => set({ devices: get().devices.map(x => x.id === id ? {...x, ...patch, updatedAt: now()} : x) }),
      deleteDevice: (id) => set({
        devices: get().devices.filter(x => x.id !== id),
        eggEntries: get().eggEntries.filter(x => x.deviceId !== id)
      }),

      addGroup: (g) => set({ hatchGroups: [...get().hatchGroups, {...g, id: uuid(), createdAt: now(), updatedAt: now()}] }),
      updateGroup: (id, patch) => set({ hatchGroups: get().hatchGroups.map(x => x.id === id ? {...x, ...patch, updatedAt: now()} : x) }),
      deleteGroup: (id) => set({ hatchGroups: get().hatchGroups.filter(x => x.id !== id) }),

      addEntry: (e) => {
        const id = uuid();
        set({ eggEntries: [...get().eggEntries, {...e, id, createdAt: now(), updatedAt: now()}] });
        return id;
      },
      updateEntry: (id, patch) => set({ eggEntries: get().eggEntries.map(x => x.id === id ? {...x, ...patch, updatedAt: now()} : x) }),
      deleteEntry: (id) => set({
        eggEntries: get().eggEntries.filter(x => x.id !== id),
        candlings: get().candlings.filter(x => x.eggEntryId !== id),
        hatches: get().hatches.filter(x => x.eggEntryId !== id)
      }),

      addCandling: (c) => set({ candlings: [...get().candlings, {...c, id: uuid(), createdAt: now()}] }),
      updateCandling: (id, patch) => set({ candlings: get().candlings.map(x => x.id === id ? {...x, ...patch} : x) }),
      deleteCandling: (id) => set({ candlings: get().candlings.filter(x => x.id !== id) }),

      addHatch: (h) => set({ hatches: [...get().hatches, {...h, id: uuid(), createdAt: now()}] }),
      updateHatch: (id, patch) => set({ hatches: get().hatches.map(x => x.id === id ? {...x, ...patch} : x) }),
      deleteHatch: (id) => set({ hatches: get().hatches.filter(x => x.id !== id) })
    }),
    { name: 'pm-inc' }
  )
);

/* ============ برچسب‌ها ============ */
export const DEVICE_MODE_LABEL: Record<DeviceMode, string> = {
  'setter': 'Setter',
  'hatcher': 'Hatcher',
  'setter+hatcher': 'Setter + Hatcher'
};

export const DEVICE_STATUS_LABEL: Record<DeviceStatus, string> = {
  active: 'فعال', idle: 'خاموش', maintenance: 'تعمیر', broken: 'خراب'
};

export const DEAL_LABEL: Record<DealType, string> = {
  own: '🏠 گله خودم',
  purchase: '📥 خریداری',
  partnership: '🤝 شراکتی',
  rent: '🏢 اجاره‌ای',
  consignment: '📦 امانی'
};

export const ENTRY_STATUS_LABEL: Record<EntryStatus, string> = {
  incubating: 'در دستگاه',
  candled: 'کندلینگ‌شده',
  locked: 'Lock-down',
  hatched: 'هچ‌شده',
  done: 'تمام‌شده',
  failed: 'ناموفق'};

/* ============ محاسبات ============ */
export function jalaliToDate(s: string): Date | null {
  if (!s) return null;
  try {
    const d = parseJ(toEn(s), 'yyyy/MM/dd', new Date());
    return isNaN(d.getTime()) ? null : d;
  } catch { return null; }
}

export function daysAgo(s: string): number {
  const d = jalaliToDate(s);
  if (!d) return 0;
  const days = diffDaysJ(new Date(), d);
  return Math.max(1, days + 1);  // روز اول انکوباسیون = ۱
}

export function addDaysJalali(s: string, days: number): string {
  const d = jalaliToDate(s);
  if (!d) return '';
  return formatJ(addDaysJ(d, days), 'yyyy/MM/dd');
}

/** روزهای باقی‌مانده تا هچ */
export function daysToHatch(hatchDate: string): number {
  const d = jalaliToDate(hatchDate);
  if (!d) return 0;
  return diffDaysJ(d, new Date());
}

/** Lock-down شده؟ (روز ۱۸ به بعد) */
export function isLockdown(entry: EggEntry): boolean {
  const age = daysAgo(entry.entryDate);
  return age >= 18;
}

/** پنجره هچ باز است؟ (۲ روز قبل از هچ) */
export function isHatchWindow(entry: EggEntry): boolean {
  const days = daysToHatch(entry.expectedHatchDate);
  return days <= 2 && days >= -1;
}

/** طول دوره بر اساس پرنده (پیش‌فرض ۲۱ روز برای مرغ) */
let _incCache: { key: string; map: Record<string, number> } = { key: '__init__', map: {} };

function _normBird(s: string): string {
  return (s || '').replace(/[\u{1F300}-\u{1F9FF}]/gu, '').replace(/\s+/g, '').toLowerCase();
}

function _getProfileDaysMap(): Record<string, number> {
  try {
    const stored = localStorage.getItem('pm-settings') || '';
    if (stored === _incCache.key) return _incCache.map;
    const parsed = JSON.parse(stored || '{}');
    const profiles = parsed?.state?.incubationProfiles || parsed?.incubationProfiles || [];
    const map: Record<string, number> = {};
    profiles.forEach((p: any) => {
      if (p?.totalDays) map[_normBird(p.birdName)] = p.totalDays;
    });
    _incCache = { key: stored, map };
    return map;
  } catch { return {}; }
}

export function incubationDays(birdName: string): number {
  const target = _normBird(birdName);
  const cached = _getProfileDaysMap();
  if (cached[target]) return cached[target];
  return _fallbackDays(birdName);
}

function _fallbackDays(birdName: string): number {
  const n = (birdName || '').toLowerCase();
  if (n.includes('بوقلمون')) return 28;
  if (n.includes('اردک')) return 28;
  if (n.includes('غاز')) return 30;
  if (n.includes('بلدرچین')) return 18;
  if (n.includes('قرقاول')) return 24;
  if (n.includes('کبوتر')) return 17;
  return 21;
}

/** نسخه pure — از آرایه profiles داده‌شده استفاده می‌کنه (برای useMemo) */
export function daysFromProfiles(birdName: string, profiles: any[]): number {
  const target = _normBird(birdName);
  const found = (profiles || []).find((p: any) => _normBird(p.birdName) === target);
  if (found?.totalDays) return found.totalDays;
  return _fallbackDays(birdName);
}

/** محاسبه‌ی نرخ هچ */
export function hatchRate(hatched: number, total: number): number {
  if (!total) return 0;
  return (hatched / total) * 100;
}

/** محاسبه‌ی هزینه‌ی هر جوجه */
export function costPerChick(totalCost: number, hatched: number): number {
  if (!hatched) return 0;
  return totalCost / hatched;
}


/** پر کردن اتوماتیک از پروفایل انکوباسیون بر اساس نام پرنده */
export function fillCapacityFromProfile(birdName: string): Partial<DeviceCapacity> | null {
  try {
    const raw = localStorage.getItem('pm-settings');
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    const profiles = parsed?.state?.incubationProfiles || parsed?.incubationProfiles || [];
    const norm = (s: string) => String(s || '')
      .replace(/[\u200c\u200f]/g, '')
      .replace(/[🐔🦃🦆🦢🐦🕊️]/g, '')
      .trim()
      .toLowerCase();
    const target = norm(birdName);
    const found = profiles.find((p: any) => {
      const pn = norm(p.birdName);
      return pn === target || pn.includes(target) || target.includes(pn);
    });
    if (!found) return null;
    return {
      setterTemp: found.setterTemp,
      setterHumidity: found.setterHumidity,
      hatcherTemp: found.hatcherTemp,
      hatcherHumidity: found.hatcherHumidity,
      totalDays: found.totalDays,
      lockdownDay: found.lockdownDay,
    };
  } catch { return null; }
}
