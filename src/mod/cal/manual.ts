import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { v4 as uuid } from 'uuid';
import type { EventType } from './store';

export interface ManualEvent {
  id: string;
  date: string;      // 1405/07/15
  time: string;      // 08:30 یا خالی
  title: string;
  notes: string;
  type: EventType;
  done: boolean;
  createdAt: string;
}

interface State {
  events: ManualEvent[];
  add: (e: Omit<ManualEvent, 'id' | 'createdAt' | 'done'>) => void;
  update: (id: string, patch: Partial<ManualEvent>) => void;
  remove: (id: string) => void;
  toggleDone: (id: string) => void;
}

export const useManual = create<State>()(
  persist(
    (set, get) => ({
      events: [],
      add: (e) => set({
        events: [...get().events, {
          ...e,
          id: uuid(),
          done: false,
          createdAt: new Date().toISOString()
        }]
      }),
      update: (id, patch) => set({
        events: get().events.map(x => x.id === id ? { ...x, ...patch } : x)
      }),
      remove: (id) => set({
        events: get().events.filter(x => x.id !== id)
      }),
      toggleDone: (id) => set({
        events: get().events.map(x => x.id === id ? { ...x, done: !x.done } : x)
      })
    }),
    { name: 'pm-cal-manual' }
  )
);

export const TYPE_OPTIONS: { id: EventType; label: string; icon: string }[] = [
  { id: 'daily', label: 'کار روزانه', icon: '📋' },
  { id: 'vaccine', label: 'واکسن / دارو', icon: '💉' },
  { id: 'hatch', label: 'جوجه‌کشی', icon: '🐣' },
  { id: 'payment', label: 'مالی', icon: '💰' },
  { id: 'finance', label: 'یادآور', icon: '🔔' }
];
