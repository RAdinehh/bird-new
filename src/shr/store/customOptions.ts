import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { v4 as uuid } from 'uuid';

export interface CustomOption {
  id: string;
  key: string;
  name: string;
  icon: string;
  hidden?: boolean;
  createdAt: string;
}

interface State {
  options: CustomOption[];
  addOption: (key: string, name: string, icon: string) => void;
  updateOption: (id: string, patch: Partial<Pick<CustomOption, 'name' | 'icon'>>) => void;
  removeOption: (id: string) => void;
  hideOption: (id: string) => void;
  unhideOption: (id: string) => void;
  deleteOption: (id: string) => void;
  getByKey: (key: string) => CustomOption[];
  getHidden: () => CustomOption[];
}

export const useCustomOptions = create<State>()(
  persist(
    (set, get) => ({
      options: [],
      addOption: (key, name, icon) => set({
        options: [...get().options, { id: uuid(), key, name, icon, hidden: false, createdAt: new Date().toISOString() }],
      }),
      updateOption: (id, patch) => set({
        options: get().options.map(o => o.id === id ? { ...o, ...patch } : o),
      }),
      removeOption: (id) => set({
        options: get().options.filter(o => o.id !== id),
      }),
      hideOption: (id) => set({
        options: get().options.map(o => o.id === id ? { ...o, hidden: true } : o),
      }),
      unhideOption: (id) => set({
        options: get().options.map(o => o.id === id ? { ...o, hidden: false } : o),
      }),
      deleteOption: (id) => set({
        options: get().options.filter(o => o.id !== id),
      }),
      getByKey: (key) => get().options.filter(o => o.key === key && !o.hidden),
      getHidden: () => get().options.filter(o => o.hidden),
    }),
    {
      name: 'pm-custom-options',
      version: 2,
      migrate: (persisted: any, version: number) => {
        if (version < 2 && persisted?.options) {
          persisted.options = persisted.options.map((o: any) => ({ ...o, hidden: false }));
        }
        return persisted;
      },
    }
  )
);
