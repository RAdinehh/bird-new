import { create } from 'zustand';
import { format } from 'date-fns-jalali';
import { persist } from 'zustand/middleware';
import { v4 as uuid } from 'uuid';

export type AlertLevel = 'critical' | 'important' | 'info';
export type AlertCategory = 'stock' | 'vaccine' | 'payment' | 'temp' | 'mortality' | 'reproduction' | 'other';
export type AlertStatus = 'active' | 'dismissed' | 'snoozed';

export interface Alert {
  id: string;
  level: AlertLevel;
  category: AlertCategory;
  title: string;
  message: string;
  source: string;      // کدام ماژول
  sourceId: string;    // شناسه‌ی رکورد
  date: string;        // تاریخ هشدار
  status: AlertStatus;
  snoozeUntil: string; // اگر به تعویق افتاد
  notes: string;
  createdAt: string;
}

interface State {
  alerts: Alert[];
  add: (a: Omit<Alert, 'id' | 'status' | 'snoozeUntil' | 'createdAt'>) => void;
  dismiss: (id: string) => void;
  snooze: (id: string, untilDate: string) => void;
  restore: (id: string) => void;
  remove: (id: string) => void;
  clearAll: () => void;
  findOrCreate: (a: Omit<Alert, 'id' | 'status' | 'snoozeUntil' | 'createdAt'>) => void;
}

const now = () => new Date().toISOString();

/** تاریخ امروز شمسی — برای مقایسه با snoozeUntil */
function todayJalali(): string {
  return format(new Date(), 'yyyy/MM/dd');
}

export const useAlt = create<State>()(
  persist(
    (set, get) => ({
      alerts: [],

      add: (a) => set({
        alerts: [...get().alerts, { ...a, id: uuid(), status: 'active', snoozeUntil: '', createdAt: now() }]
      }),

      findOrCreate: (a) => {
        const existing = get().alerts.find(x => x.sourceId === a.sourceId && x.category === a.category);
        if (existing) {
          // اگر قبلاً بود و dismiss نشده، فقط آپدیت کن
          if (existing.status === 'dismissed') {
            set({
              alerts: get().alerts.map(x => x.id === existing.id ? {
                ...x, status: 'active', title: a.title, message: a.message
              } : x)
            });
          }
          return;
        }
        set({
          alerts: [...get().alerts, { ...a, id: uuid(), status: 'active', snoozeUntil: '', createdAt: now() }]
        });
      },

      dismiss: (id) => set({
        alerts: get().alerts.map(x => x.id === id ? { ...x, status: 'dismissed' } : x)
      }),

      snooze: (id, untilDate) => set({
        alerts: get().alerts.map(x => x.id === id ? { ...x, status: 'snoozed', snoozeUntil: untilDate } : x)
      }),

      restore: (id) => set({
        alerts: get().alerts.map(x => x.id === id ? { ...x, status: 'active', snoozeUntil: '' } : x)
      }),

      remove: (id) => set({
        alerts: get().alerts.filter(x => x.id !== id)
      }),

      clearAll: () => set({ alerts: [] })
    }),
    { name: 'pm-alt' }
  )
);

export const LEVEL_LABEL: Record<AlertLevel, string> = {
  critical: 'بحرانی',
  important: 'مهم',
  info: 'اطلاعی'
};

export const LEVEL_ICON: Record<AlertLevel, string> = {
  critical: '🔴',
  important: '🟡',
  info: '🔵'
};

export const LEVEL_COLOR: Record<AlertLevel, string> = {
  critical: 'danger',
  important: 'warn',
  info: 'info'
};

export const CATEGORY_LABEL: Record<AlertCategory, string> = {
  stock: 'انبار',
  vaccine: 'واکسن و دارو',
  payment: 'مالی و پرداخت',
  temp: 'دما و شرایط',
  mortality: 'تلفات',
  reproduction: 'تخم‌گذاری و جوجه‌کشی',
  other: 'سایر'
};

/** فیلتر هشدارهای فعال */
export function activeAlerts(alerts: Alert[]): Alert[] {
  const today = todayJalali();
  return alerts.filter(a => {
    if (a.status === 'active') return true;
    if (a.status === 'snoozed' && a.snoozeUntil && a.snoozeUntil <= today) return true;
    return false;
  });
}

/** شمارش بر اساس سطح */
export function countByLevel(alerts: Alert[]) {
  const active = activeAlerts(alerts);
  return {
    critical: active.filter(a => a.level === 'critical').length,
    important: active.filter(a => a.level === 'important').length,
    info: active.filter(a => a.level === 'info').length,
    total: active.length
  };
}
