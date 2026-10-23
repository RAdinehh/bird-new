import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { v4 as uuid } from 'uuid';

export interface Bird {
  id: string;
  name: string;
  /** شناسه‌ی گونه (chicken، duck، turkey، یا custom) */
  birdKind?: string;
  /** کلید استاندارد در DEFAULT_STANDARDS (اختیاری) */
  standardKey?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Breed {
  id: string;
  birdId: string;
  name: string;
  fcr: number | null;
  /** کلید استاندارد در DEFAULT_STANDARDS (اختیاری) */
  standardKey?: string;
  /** 🆕 هدف‌های انتخاب‌شده توسط کاربر (broiler/layer/breeder/ornamental) */
  purposes?: string[];
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
  dedupeBreeds: () => void;
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
      dedupeBreeds: () => {
        const seen = new Set<string>();
        const cleaned = get().breeds.filter(b => {
          const purposesKey = ((b as any).purposes || []).slice().sort().join(',');
          const key = (b.birdId || '') + '|' + (b.name || '').trim().toLowerCase() + '|' + purposesKey + '|' + (b.standardKey || '');
          if (seen.has(key)) return false;
          seen.add(key);
          return true;
        });
        set({ breeds: cleaned });
      },

      dedupeBirds: () => {
        const seen = new Set<string>();
        const cleaned = get().birds.filter(b => {
          const key = (b.name || '').trim().toLowerCase() + '|' + (b.birdKind || '') + '|' + (b.standardKey || '');
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
    {
      name: 'pm-brd',
      version: 5,
      migrate: (persisted: any, version: number) => {
        // v3: حذف purpose و categoryId از Bird (مالِ نژاد هستن)
        if (persisted && Array.isArray(persisted.birds)) {
          persisted.birds = persisted.birds.map((b: any) => {
            const { purpose, categoryId, ...rest } = b;
            return rest;
          });
        }
        // v5: حذف cycleDays و fcrStandard از Bird (مالِ نژاد هستن)
        if (persisted && Array.isArray(persisted.birds)) {
          persisted.birds = persisted.birds.map((b: any) => {
            const { cycleDays, fcrStandard, ...rest } = b;
            return rest;
          });
        }
        // پاک کردن تکرارهای پرنده و نژاد
        if (persisted) {
          if (Array.isArray(persisted.birds)) {
            const seen = new Set<string>();
            persisted.birds = persisted.birds.filter((b: any) => {
              const key = (b.name || '').trim().toLowerCase() + '|' + (b.birdKind || '') + '|' + (b.standardKey || '');
              if (seen.has(key)) return false;
              seen.add(key);
              return true;
            });
          }
          if (Array.isArray(persisted.breeds)) {
            const seen = new Set<string>();
            persisted.breeds = persisted.breeds.filter((b: any) => {
              const purposesKey = ((b as any).purposes || []).slice().sort().join(',');
              const key = (b.birdId || '') + '|' + (b.name || '').trim().toLowerCase() + '|' + purposesKey + '|' + (b.standardKey || '');
              if (seen.has(key)) return false;
              seen.add(key);
              return true;
            });
          }
        }
        return persisted;
      }
    }
  )
);
