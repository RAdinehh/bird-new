/**
 * store.ts — Zustand store ثبت روزانه
 */
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { v4 as uuid } from 'uuid';

export interface Death {
  id: string;
  count: number;
  cause: string;
  notes: string;
  /** 🆕 جنسیت تلفات — undefined = unknown (قبل از تفکیک) */
  sex?: 'male' | 'female' | 'unknown';
}

export type LogStatus = 'active' | 'archived';

export interface WeightSample {
  id: string;
  weight: number; // kg
}

export interface Vaccine {
  id: string;
  name: string;
  dose: string;
  method: string;
  reaction: string;
  itemId?: string;
  quantity?: number | null;
  movementId?: string;
}

export interface Medication {
  id: string;
  name: string;
  dose: string;
  method: string;
  withdrawalDays: number | null;
  itemId?: string;
  quantity?: number | null;
  movementId?: string;
}

export interface Activity {
  id: string;
  type: string;
  notes: string;
}

export interface DailyLog {
  id: string;
  flockId: string;
  date: string;
  entryTime: string;
  shift: 'morning' | 'noon' | 'evening';

  // محیط
  temperature: number | null;
  temperatureMin: number | null;
  temperatureMax: number | null;
  humidity: number | null;
  humidityMin: number | null;
  humidityMax: number | null;
  ventilation: string; // ok | low | high
  litter: string; // dry | wet | clumped
  lightHours: number | null;   // ← جدید: ساعت نوردهی

  // پرنده
  behavior: string; // active | lethargic | excited
  distribution: string; // uniform | cornered
  appearance: string;
  sound: string; // normal | cough | sneeze

  // تغذیه
  feedType: string;
  feedDelivered: number | null;    // kg (دان داده‌شده)
  feedConsumed: number | null;     // kg (دان مصرف‌شده — مشتق)
  feedRemaining: number | null; // kg
  feedSourceType: 'formula' | 'item' | '';
  feedSourceId: string;
  feedMethod: 'manual' | 'auto' | '';
  feedMovementIds: string[];

  // آب
  waterAmount: number | null;   // L
  waterMethod: 'manual' | 'nipple' | 'trough' | 'tank' | '';
  waterFillCount: number | null;
  waterFillVolume: number | null;

  // وزن‌کشی
  weightSamples: WeightSample[];
  weightGender: '' | 'male' | 'female' | 'mixed';

  // تخم‌گذاری (اختصاصی layer/breeder)
  brokenEggs: number | null;
  // 🆕 تخم - تفکیک جدید
  eatingEggs?: number | null;
  fertileEggs?: number | null;
  otherEggs?: number | null;
  brokenTarget?: 'saleable' | 'lost';
  otherTarget?: 'saleable' | 'lost';

  // تلفات
  deathsCount: number;
  deaths: Death[];

  // سلامت
  vaccines: Vaccine[];
  medications: Medication[];

  // فعالیت‌ها
  activities: Activity[];

  // یادداشت
  notes: string;

  // متادیتا
  status: LogStatus;
  birdAgeDays: number | null;
  createdAt: string;
  updatedAt: string;
}

interface State {
  logs: DailyLog[];
  add: (l: Omit<DailyLog, 'id' | 'status' | 'createdAt' | 'updatedAt'>) => string;
  update: (id: string, patch: Partial<DailyLog>) => void;
  remove: (id: string) => void;
  archive: (id: string) => void;
  restore: (id: string) => void;
}

export const useDlg = create<State>()(
  persist(
    (set, get) => ({
      logs: [],
      add: (l) => {
        const newLog = {
          ...l,
          id: uuid(),
          status: 'active',
          lightHours: (l as any).lightHours ?? null,
          shift: (l as any).shift || 'morning',
          feedConsumed: (l as any).feedConsumed ?? null,
          birdAgeDays: (l as any).birdAgeDays ?? null,
          brokenEggs: (l as any).brokenEggs ?? null,
          eatingEggs: (l as any).eatingEggs ?? null,
          fertileEggs: (l as any).fertileEggs ?? null,
          otherEggs: (l as any).otherEggs ?? null,
          brokenTarget: (l as any).brokenTarget || 'saleable',
          otherTarget: (l as any).otherTarget || 'saleable',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        } as DailyLog;
        set({ logs: [...get().logs, newLog] });
        return newLog.id;
      },
      update: (id, patch) => set({
        logs: get().logs.map(x => x.id === id
          ? { ...x, ...patch, updatedAt: new Date().toISOString() }
          : x)
      }),
      remove: (id) => set({ logs: get().logs.filter(x => x.id !== id) }),
      archive: (id) => set({
        logs: get().logs.map(x => x.id === id
          ? { ...x, status: 'archived' as LogStatus, updatedAt: new Date().toISOString() }
          : x)
      }),
      restore: (id) => set({
        logs: get().logs.map(x => x.id === id
          ? { ...x, status: 'active' as LogStatus, updatedAt: new Date().toISOString() }
          : x)
      })
    }),
    {
      name: 'pm-dlg',
      version: 11,
      migrate: (persisted: any, version: number) => {
        if (version < 2 && persisted?.logs) {
          persisted.logs = persisted.logs.map((l: any) => ({
            ...l,
            feedSourceType: l.feedItemId ? 'item' : '',
            feedSourceId: l.feedItemId || '',
            feedMovementIds: l.feedMovementId ? [l.feedMovementId] : [],
          }));
        }
        if (version < 3 && persisted?.logs) {
          persisted.logs = persisted.logs.map((l: any) => ({
            ...l,
            feedMethod: l.feedMethod || '',
            waterMethod: l.waterMethod || '',
            waterFillCount: l.waterFillCount ?? null,
            waterFillVolume: l.waterFillVolume ?? null,
            weightSamples: l.weightSamples || [],
            weightGender: l.weightGender || '',
          }));
        }
        if (version < 4 && persisted?.logs) {
          persisted.logs = persisted.logs.map((l: any) => ({
            ...l,
            createdAt: l.createdAt || new Date().toISOString(),
            updatedAt: l.updatedAt || new Date().toISOString(),
          }));
        }
        if (version < 5 && persisted?.logs) {
          persisted.logs = persisted.logs.map((l: any) => ({
            ...l,
            status: l.status || 'active',
          }));
        }
        // ═══ FIXED ORDER: v6 before v7 ═══
        if (version < 6 && persisted?.logs) {
          persisted.logs = persisted.logs.map((l: any) => ({
            ...l,
            lightHours: l.lightHours ?? null,
            eggsCount: l.eggsCount ?? null,
            brokenEggs: l.brokenEggs ?? null,
            dirtyEggs: l.dirtyEggs ?? null,
          }));
        }
        if (version < 7 && persisted?.logs) {
          persisted.logs = persisted.logs.map((l: any) => ({
            ...l,
            eatingEggs: l.eatingEggs ?? l.eggsCount ?? null,
            fertileEggs: l.fertileEggs ?? null,
            otherEggs: l.otherEggs ?? l.dirtyEggs ?? null,
            brokenTarget: l.brokenTarget === 'eating' ? 'lost' : 'saleable',
            otherTarget: l.otherTarget === 'eating' ? 'lost' : 'saleable',
          }));
        }
        // ═══ v10 — A1 (shift + birdAgeDays + target rename + legacy removal) ═══
        if (version < 10 && persisted?.logs) {
          persisted.logs = persisted.logs.map((l: any) => {
            const { eggsCount, dirtyEggs, ...rest } = l;
            // Map target: old ('consumption'/'eating') and new ('saleable'/'lost') both OK
            const mapTarget = (v: any): 'saleable' | 'lost' => {
              if (v === 'eating' || v === 'lost') return 'lost';
              return 'saleable';
            };
            return {
              ...rest,
              shift: l.shift || 'morning',
              birdAgeDays: l.birdAgeDays ?? null,
              // Defensive: if v7 failed for any reason
              eatingEggs: l.eatingEggs ?? eggsCount ?? null,
              otherEggs: l.otherEggs ?? dirtyEggs ?? null,
              brokenTarget: mapTarget(l.brokenTarget),
              otherTarget: mapTarget(l.otherTarget),
            };
          });
        }
        // ═══ v11 — A2b (rename feedAmount → feedDelivered + feedConsumed) ═══
        if (version < 11 && persisted?.logs) {
          persisted.logs = persisted.logs.map((l: any) => {
            const delivered = l.feedDelivered ?? l.feedAmount ?? null;
            const consumed = l.feedConsumed ?? delivered;
            const { feedAmount: _oldFeedAmount, ...rest } = l;
            return {
              ...rest,
              feedDelivered: delivered,
              feedConsumed: consumed,
            };
          });
        }
        return persisted;
      }
    }
  )
);

export const VENTILATION_LABEL: Record<string, string> = {
  ok: 'مناسب', low: 'ضعیف', high: 'شدید'
};
export const LITTER_LABEL: Record<string, string> = {
  dry: 'خشک', wet: 'مرطوب', clumped: 'کلوخه'
};
export const BEHAVIOR_LABEL: Record<string, string> = {
  active: 'فعال', lethargic: 'بی‌حال', excited: 'پرهیجان'
};
export const DISTRIBUTION_LABEL: Record<string, string> = {
  uniform: 'یکنواخت', cornered: 'گوشه‌گیر'
};
export const SOUND_LABEL: Record<string, string> = {
  normal: 'طبیعی', cough: 'سرفه', sneeze: 'عطسه'
};

/** دلایل رایج تلفات */
export const DEATH_CAUSES: [string, string][] = [
  ['', '— نامشخص —'],
  ['disease_respiratory', 'بیماری تنفسی'],
  ['disease_digestive', 'بیماری گوارشی'],
  ['disease_other', 'بیماری دیگر'],
  ['heat', 'گرمازدگی'],
  ['cold', 'سرمازدگی'],
  ['suffocation', 'خفگی / کمبود تهویه'],
  ['cannibalism', 'پرنده‌خواری'],
  ['predator', 'شکارچی'],
  ['injury', 'آسیب / تصادف'],
  ['weak', 'ضعف بدنی'],
  ['deformity', 'نقص مادرزادی'],
  ['old_age', 'پیری'],
  ['unknown', 'نامشخص']
];

export function causeLabel(key: string): string {
  return DEATH_CAUSES.find(x => x[0] === key)?.[1] || '—';
}


// === کمک‌کننده‌ها برای وزن‌کشی ===

/** میانگین وزن نمونه‌ها (kg) */
export function avgWeight(samples: WeightSample[]): number {
  if (samples.length === 0) return 0;
  const sum = samples.reduce((a, x) => a + x.weight, 0);
  return Math.round((sum / samples.length) * 1000) / 1000;
}

/** مجموع وزن نمونه‌ها (kg) */
export function sumWeight(samples: WeightSample[]): number {
  return Math.round(samples.reduce((a, x) => a + x.weight, 0) * 1000) / 1000;
}

/** ضریب تغییرات (CV%) */
export function cvWeight(samples: WeightSample[]): number {
  if (samples.length < 2) return 0;
  const mean = samples.reduce((a, x) => a + x.weight, 0) / samples.length;
  if (mean === 0) return 0;
  const variance = samples.reduce((a, x) => a + Math.pow(x.weight - mean, 2), 0) / samples.length;
  const std = Math.sqrt(variance);
  return Math.round((std / mean) * 10000) / 100;
}

