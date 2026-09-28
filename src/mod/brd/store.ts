import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { v4 as uuid } from 'uuid';

export interface Bird {
  id: string;
  name: string;
  nameEn: string;
  cycleDays: number | null;
  fcrStandard: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface Breed {
  id: string;
  birdId: string;
  name: string;
  fcr: number | null;
  createdAt: string;
  updatedAt: string;
}

interface State {
  birds: Bird[];
  breeds: Breed[];
  addBird: (b: Omit<Bird, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateBird: (id: string, patch: Partial<Bird>) => void;
  deleteBird: (id: string) => void;
  addBreed: (b: Omit<Breed, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateBreed: (id: string, patch: Partial<Breed>) => void;
  deleteBreed: (id: string) => void;
  dedupeBirds: () => void;
}

const now = () => new Date().toISOString();

export const useBrd = create<State>()(
  persist(
    (set, get) => ({
      birds: [],
      breeds: [],

      addBird: (b) => set({
        birds: [...get().birds, { ...b, id: uuid(), createdAt: now(), updatedAt: now() }]
      }),
      updateBird: (id, patch) => set({
        birds: get().birds.map(x => x.id === id ? { ...x, ...patch, updatedAt: now() } : x)
      }),
      deleteBird: (id) => set({
        birds: get().birds.filter(x => x.id !== id),
        breeds: get().breeds.filter(x => x.birdId !== id)
      }),

      addBreed: (b) => set({
        breeds: [...get().breeds, { ...b, id: uuid(), createdAt: now(), updatedAt: now() }]
      }),
      updateBreed: (id, patch) => set({
        breeds: get().breeds.map(x => x.id === id ? { ...x, ...patch, updatedAt: now() } : x)
      }),
      dedupeBirds: () => {
        const seen = new Set<string>();
        const cleaned = get().birds.filter(b => {
          const key = b.name.trim().toLowerCase();
          if (seen.has(key)) return false;
          seen.add(key);
          return true;
        });
        set({ birds: cleaned });
      },

      deleteBreed: (id) => set({
        breeds: get().breeds.filter(x => x.id !== id)
      })
    }),
    { name: 'pm-brd' }
  )
);
