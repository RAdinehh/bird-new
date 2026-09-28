import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { v4 as uuid } from 'uuid';

export interface Death {
  id: string;
  count: number;
  cause: string;
  notes: string;
}

export interface Vaccine {
  id: string;
  name: string;
  dose: string;
  method: string;
  reaction: string;
}

export interface Medication {
  id: string;
  name: string;
  dose: string;
  method: string;
  withdrawalDays: number | null;
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

  // محیط
  temperature: number | null;
  humidity: number | null;
  ventilation: string; // ok | low | high
  litter: string; // dry | wet | clumped

  // پرنده
  behavior: string; // active | lethargic | excited
  distribution: string; // uniform | cornered
  appearance: string;
  sound: string; // normal | cough | sneeze

  // تغذیه
  feedType: string;
  feedAmount: number | null;    // kg
  feedRemaining: number | null; // kg
  waterAmount: number | null;   // L

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
}

interface State {
  logs: DailyLog[];
  add: (l: Omit<DailyLog, 'id'>) => void;
  update: (id: string, patch: Partial<DailyLog>) => void;
  remove: (id: string) => void;
}

export const useDlg = create<State>()(
  persist(
    (set, get) => ({
      logs: [],
      add: (l) => set({ logs: [...get().logs, { ...l, id: uuid() }] }),
      update: (id, patch) => set({ logs: get().logs.map(x => x.id === id ? { ...x, ...patch } : x) }),
      remove: (id) => set({ logs: get().logs.filter(x => x.id !== id) })
    }),
    { name: 'pm-dlg' }
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

/** محاسبه‌ی نسبت آب به دان */
export function waterFeedRatio(water: number | null, feed: number | null): number {
  if (!water || !feed) return 0;
  return water / feed;
}

/** تشخیص هشدار دما (مرغ تخم‌گذار: ۱۸-۲۴) */
export function tempWarning(temp: number | null): 'ok' | 'warn' | 'danger' {
  if (!temp) return 'ok';
  if (temp < 15 || temp > 30) return 'danger';
  if (temp < 18 || temp > 26) return 'warn';
  return 'ok';
}

/** تشخیص هشدار رطوبت (۴۰-۷۰) */
export function humidityWarning(h: number | null): 'ok' | 'warn' | 'danger' {
  if (!h) return 'ok';
  if (h < 30 || h > 80) return 'danger';
  if (h < 40 || h > 70) return 'warn';
  return 'ok';
}

/** نرخ تلفات (در هزار) */
export function mortalityRate(deaths: number, aliveCount: number | null): number {
  if (!aliveCount || !deaths) return 0;
  return (deaths / aliveCount) * 1000;
}

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
