import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { v4 as uuid } from 'uuid';

export interface CustomOption {
  id: string;
  key: string;
  name: string;
  icon: string;
  createdAt: string;
}

interface State {
  options: CustomOption[];
  addOption: (key: string, name: string, icon: string) => void;
  updateOption: (id: string, patch: Partial<Pick<CustomOption, 'name' | 'icon'>>) => void;
  removeOption: (id: string) => void;
  getByKey: (key: string) => CustomOption[];
}

export const useCustomOptions = create<State>()(
  persist(
    (set, get) => ({
      options: [],
      addOption: (key, name, icon) => set({
        options: [...get().options, { id: uuid(), key, name, icon, createdAt: new Date().toISOString() }],
      }),
      updateOption: (id, patch) => set({
        options: get().options.map(o => o.id === id ? { ...o, ...patch } : o),
      }),
      removeOption: (id) => set({
        options: get().options.filter(o => o.id !== id),
      }),
      getByKey: (key) => get().options.filter(o => o.key === key),
    }),
    { name: 'pm-custom-options', version: 1 }
  )
);
