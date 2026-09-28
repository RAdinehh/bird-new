import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { v4 as uuid } from 'uuid';

export type Role = 'customer' | 'supplier' | 'worker';

export interface Person {
  id: string;
  name: string;
  phone: string;
  phone2: string;
  email: string;
  address: string;
  city: string;
  nationalId: string;
  roles: Role[];
  notes: string;

  // مشتری
  customerType: string;        // [قدیمی] wholesale | retail | ...
  customerTypes: string[];     // [جدید] چندتایی: wholesale, retail, ...
  trustScore: number | null; // 1-10
  defaultDiscount: number | null;

  // فروشنده
  supplierTypes: string[];   // egg | chick | adult | feed | medicine | equipment

  // کارگر
  position: string;
  startDate: string;
  salaryType: string;        // monthly | daily | hourly
  salaryAmount: number | null;
  insurance: boolean;

  createdAt: string;
  updatedAt: string;
}

interface State {
  contacts: Person[];
  add: (c: Omit<Person, 'id'|'createdAt'|'updatedAt'>) => void;
  update: (id: string, patch: Partial<Person>) => void;
  remove: (id: string) => void;
}

const now = () => new Date().toISOString();

export const useCtc = create<State>()(
  persist(
    (set, get) => ({
      contacts: [],
      add: (c) => set({ contacts: [...get().contacts, {...c, id: uuid(), createdAt: now(), updatedAt: now()}] }),
      update: (id, patch) => set({ contacts: get().contacts.map(x => x.id === id ? {...x, ...patch, updatedAt: now()} : x) }),
      remove: (id) => set({ contacts: get().contacts.filter(x => x.id !== id) })
    }),
    {
      name: 'pm-ctc',
      version: 2,
      migrate: (persisted: any, version: number) => {
        if (version < 2 && persisted?.people) {
          persisted.people = persisted.people.map((p: any) => ({
            ...p,
            customerTypes: p.customerTypes || (p.customerType ? [p.customerType] : []),
          }));
        }
        return persisted;
      }
    }
  )
);

export const ROLE_LABEL: Record<Role, string> = {
  customer: 'مشتری',
  supplier: 'فروشنده',
  worker: 'کارگر'
};

export const ROLE_COLOR: Record<Role, string> = {
  customer: 'blue',
  supplier: 'green',
  worker: 'purple'
};

export const CUSTOMER_TYPES: [string, string][] = [
  ['wholesale', 'عمده'],
  ['retail', 'خرده'],
  ['restaurant', 'رستوران'],
  ['shop', 'مغازه'],
  ['other', 'سایر']
];

export const SUPPLIER_TYPES: [string, string][] = [
  ['egg', 'تخم نطفه‌دار'],
  ['chick', 'جوجه یک‌روزه'],
  ['adult', 'پرنده بالغ'],
  ['feed', 'دان و مواد اولیه'],
  ['medicine', 'دارو و واکسن'],
  ['equipment', 'تجهیزات']
];

export const SALARY_TYPES: [string, string][] = [
  ['monthly', 'ماهانه'],
  ['daily', 'روزانه'],
  ['hourly', 'ساعتی']
];

export function avatarLetter(name: string): string {
  if (!name) return '؟';
  return name.trim().charAt(0);
}
