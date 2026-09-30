import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { v4 as uuid } from 'uuid';
import { parse, differenceInDays, addDays } from 'date-fns-jalali';
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
  stage: 1 | 2 | 3;
  date: string;
  alive: number | null;
  infertile: number | null;
  dead: number | null;
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
    const en = toEn(s).replace(/[۰-۹]/g, d => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d))).replace(/\//g, '/');
    const parts = en.split('/').map(p => parseInt(p, 10));
    if (parts.length !== 3 || parts.some(isNaN)) return null;
    const [jy, jm, jd] = parts;
    // الگوریتم تبدیل شمسی به میلادی (بدون کتابخانه)
    const g_d_m = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334];
    let gy = (jy > 979 ? 1600 : 621);
    let jy2 = (jy > 979 ? jy - 979 : jy);
    let days = 365 * jy2 + Math.floor(jy2 / 33) * 8 + Math.floor(((jy2 % 33) + 3) / 4);
    for (let i = 0; i < jm - 1; i++) days += (i < 6 ? 31 : 30);
    days += jd - 1;
    let gy2 = gy + 400 * Math.floor(days / 146097);
    days %= 146097;
    if (days > 36524) {
      gy2 += 100 * Math.floor(--days / 36524);
      days %= 36524;
      if (days >= 365) days++;
    }
    gy2 += 4 * Math.floor(days / 1461);
    days %= 1461;
    if (days > 365) {
      gy2 += Math.floor((days - 1) / 365);
      days = (days - 1) % 365;
    }
    let gd = days + 1;
    let gm = 0;
    for (let i = 0; i < 12; i++) {
      const mdays = i === 1 ? ((gy2 % 4 === 0 && gy2 % 100 !== 0) || gy2 % 400 === 0 ? 29 : 28) : (g_d_m[i + 1] - g_d_m[i]);
      if (gd <= mdays) break;
      gd -= mdays;
      gm++;
    }
    return new Date(gy2, gm, gd);
  } catch { return null; }
}

export function daysAgo(s: string): number {
  const d = jalaliToDate(s);
  if (!d) return 0;
  return differenceInDays(new Date(), d);
}

export function addDaysJalali(s: string, days: number): string {
  const d = jalaliToDate(s);
  if (!d) return '';
  d.setDate(d.getDate() + days);
  // تبدیل میلادی به شمسی
  const gy = d.getFullYear();
  const gm = d.getMonth() + 1;
  const gd = d.getDate();
  const g_d_m = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334];
  let jy = (gy > 1600 ? gy - 1600 : gy - 621);
  let gy2 = (gy > 1600 ? gy - 1600 : gy - 621);
  gy2 = gy - 1600;
  jy = 979;
  let days2 = (gy - 1600) * 365 + Math.floor((gy - 1600 + 3) / 4) - Math.floor((gy - 1600 + 99) / 100) + Math.floor((gy - 1600 + 399) / 400);
  for (let i = 0; i < gm - 1; i++) days2 += g_d_m[i + 1] - g_d_m[i];
  if (gm > 2 && ((gy % 4 === 0 && gy % 100 !== 0) || gy % 400 === 0)) days2++;
  days2 += gd - 1;
  let j_days = days2 - 79;
  let j_np = Math.floor(j_days / 12053);
  j_days %= 12053;
  let jy2 = 979 + 33 * j_np + 4 * Math.floor(j_days / 1461);
  j_days %= 1461;
  if (j_days >= 366) {
    jy2 += Math.floor((j_days - 1) / 365);
    j_days = (j_days - 1) % 365;
  }
  let jm = 0;
  for (let i = 0; i < 11; i++) {
    const mdays = i < 6 ? 31 : 30;
    if (j_days < mdays) break;
    j_days -= mdays;
    jm++;
  }
  const jd = j_days + 1;
  const pad = (n: number) => String(n).padStart(2, '0');
  return jy2 + '/' + pad(jm + 1) + '/' + pad(jd);
}

/** روزهای باقی‌مانده تا هچ */
export function daysToHatch(expectedHatchDate: string): number {
  const d = jalaliToDate(expectedHatchDate);
  if (!d) return 0;
  return differenceInDays(d, new Date());
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
export function incubationDays(birdName: string): number {
  try {
    const stored = localStorage.getItem('pm-settings');
    if (stored) {
      const parsed = JSON.parse(stored);
      const profiles = parsed?.state?.incubationProfiles || parsed?.incubationProfiles || [];
      const found = profiles.find((p: any) => p.birdName === birdName || p.birdName?.includes(birdName));
      if (found?.totalDays) return found.totalDays;
    }
  } catch {}
  const n = (birdName || '').toLowerCase();
  if (n.includes('بوقلمون')) return 28;
  if (n.includes('اردک')) return 28;
  if (n.includes('غاز')) return 30;
  if (n.includes('بلدرچین')) return 18;
  if (n.includes('قرقاول')) return 24;
  if (n.includes('کبوتر')) return 17;
  return 21;
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
