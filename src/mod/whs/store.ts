import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { v4 as uuid } from 'uuid';

export type ItemCategory = 'feed' | 'medicine' | 'vaccine' | 'herbal' | 'equipment' | 'consumable';
export type ItemUnit = 'kg' | 'g' | 'L' | 'ml' | 'pcs' | 'vial' | 'pack';
export type MovementType = 'in' | 'out' | 'adjust';
export type MovementReason = 'purchase' | 'consumption' | 'sale' | 'loss' | 'adjustment' | 'return';

export interface Item {
  id: string;
  name: string;
  category: ItemCategory;
  unit: ItemUnit;
  minStock: number;
  currentStock: number;
  lastPrice: number;
  supplierId: string;
  expireDate: string;
  withdrawalDays: number | null;  // فقط برای دارو
  batchNo: string;                 // فقط برای دارو/واکسن
  storage: string;                 // fridge | freezer | room
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export interface Movement {
  id: string;
  itemId: string;
  type: MovementType;
  quantity: number;
  unitPrice: number;
  reason: MovementReason;
  date: string;
  partyId: string;
  notes: string;
  createdAt: string;
}

interface State {
  items: Item[];
  movements: Movement[];
  addItem: (i: Omit<Item, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateItem: (id: string, patch: Partial<Item>) => void;
  deleteItem: (id: string) => void;
  addMovement: (m: Omit<Movement, 'id' | 'createdAt'>) => void;
  deleteMovement: (id: string) => void;
}

const now = () => new Date().toISOString();

export const useWhs = create<State>()(
  persist(
    (set, get) => ({
      items: [],
      movements: [],

      addItem: (i) => set({ items: [...get().items, { ...i, id: uuid(), createdAt: now(), updatedAt: now() }] }),
      updateItem: (id, patch) => set({ items: get().items.map(x => x.id === id ? { ...x, ...patch, updatedAt: now() } : x) }),
      deleteItem: (id) => set({
        items: get().items.filter(x => x.id !== id),
        movements: get().movements.filter(x => x.itemId !== id)
      }),

      addMovement: (m) => {
        const item = get().items.find(x => x.id === m.itemId);
        if (item === undefined) return;

        let newStock = item.currentStock;
        if (m.type === 'in') newStock += m.quantity;
        else if (m.type === 'out') newStock = Math.max(0, newStock - m.quantity);
        else newStock = m.quantity;

        set({
          movements: [...get().movements, { ...m, id: uuid(), createdAt: now() }],
          items: get().items.map(x => x.id === m.itemId ? {
            ...x,
            currentStock: newStock,
            lastPrice: m.unitPrice > 0 ? m.unitPrice : x.lastPrice,
            updatedAt: now()
          } : x)
        });
      },

      deleteMovement: (id) => {
        const mv = get().movements.find(x => x.id === id);
        if (mv === undefined) return;
        const item = get().items.find(x => x.id === mv.itemId);
        if (item === undefined) return;

        let newStock = item.currentStock;
        if (mv.type === 'in') newStock = Math.max(0, newStock - mv.quantity);
        else if (mv.type === 'out') newStock += mv.quantity;

        set({
          movements: get().movements.filter(x => x.id !== id),
          items: get().items.map(x => x.id === mv.itemId ? { ...x, currentStock: newStock, updatedAt: now() } : x)
        });
      }
    }),
    { name: 'pm-whs' }
  )
);

export const CATEGORY_LABEL: Record<ItemCategory, string> = {
  feed: 'دان و خوراک',
  medicine: 'دارو',
  vaccine: 'واکسن',
  herbal: 'گیاه دارویی',
  equipment: 'تجهیزات',
  consumable: 'مصرفی'
};

export const CATEGORY_ICON: Record<ItemCategory, string> = {
  feed: '🌾',
  medicine: '💊',
  vaccine: '💉',
  herbal: '🌿',
  equipment: '🔧',
  consumable: '📦'
};

export const UNIT_LABEL: Record<ItemUnit, string> = {
  kg: 'کیلوگرم', g: 'گرم', L: 'لیتر', ml: 'میلی‌لیتر',
  pcs: 'عدد', vial: 'ویال', pack: 'بسته'
};

export const MOVEMENT_REASON: Record<MovementReason, string> = {
  purchase: 'خرید', consumption: 'مصرف', sale: 'فروش',
  loss: 'ضایعات', adjustment: 'اصلاح', return: 'برگشت'
};

export const STORAGE_LABEL: Record<string, string> = {
  fridge: 'یخچال (۲-۸°)',
  freezer: 'فریزر',
  room: 'دمای اتاق'
};

/** هشدار موجودی */
export function stockWarning(item: Item): 'ok' | 'low' | 'critical' {
  if (item.currentStock <= 0) return 'critical';
  if (item.currentStock <= item.minStock) return 'low';
  return 'ok';
}

/** روزهای مانده تا انقضا */
export function daysToExpiry(expireDate: string): number | null {
  if (expireDate === '' || expireDate == null) return null;
  const parts = expireDate.replace(/[۰-۹]/g, d => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d).toString()).split('/');
  if (parts.length !== 3) return null;
  const d = new Date(+parts[0], +parts[1] - 1, +parts[2]);
  const diff = Math.ceil((d.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  return diff;
}

/** هشدار انقضا */
export function expiryWarning(item: Item): 'ok' | 'soon' | 'expired' {
  const days = daysToExpiry(item.expireDate);
  if (days === null) return 'ok';
  if (days < 0) return 'expired';
  if (days <= 30) return 'soon';
  return 'ok';
}

/** ارزش کل انبار */
export function totalInventoryValue(items: Item[]): number {
  return items.reduce((a, x) => a + (x.currentStock * x.lastPrice), 0);
}
