import { create } from 'zustand';
import { parse as parseJ, differenceInCalendarDays as diffCalDays, startOfDay } from 'date-fns-jalali';
import { persist } from 'zustand/middleware';
import { v4 as uuid } from 'uuid';

export type ItemCategory = 'feed' | 'medicine' | 'vaccine' | 'herbal' | 'equipment' | 'consumable' | 'egg';
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
  /** 🆕 رهگیری: کدوم گله */
  flockId?: string;
  /** 🆕 رهگیری: از کدوم ماژول اومده */
  sourceModule?: 'egg' | 'dlg' | 'tra' | 'inc' | 'fed' | 'manual';
  /** 🆕 رهگیری: ID رکورد مبدأ */
  sourceId?: string;
  /** 🆕 شماره دسته (Batch) — برای تخم و دارو */
  batchNo?: string;
}

interface State {
  items: Item[];
  movements: Movement[];
  addItem: (i: Omit<Item, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateItem: (id: string, patch: Partial<Item>) => void;
  deleteItem: (id: string) => void;
  addMovement: (m: Omit<Movement, 'id' | 'createdAt'>) => string;
  deleteMovement: (id: string) => void;
}


/** تولید شماره دسته — B-YYYY-MM-DD-NNN */
export function generateBatchNo(date: string, existingMovements: Movement[], itemId: string): string {
  if (!date) return '';
  const clean = date.replace(/[۰-۹]/g, (d: string) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d)));
  const parts = clean.split('/');
  if (parts.length !== 3) return '';
  const prefix = `B-${parts[0]}-${String(parts[1]).padStart(2, '0')}-${String(parts[2]).padStart(2, '0')}`;
  const todayMovements = existingMovements.filter(m =>
    m.itemId === itemId && (m.batchNo || '').startsWith(prefix)
  );
  const next = todayMovements.length + 1;
  return `${prefix}-${String(next).padStart(3, '0')}`;
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
        if (item === undefined) return '';

        let newStock = item.currentStock;
        if (m.type === 'in') newStock += m.quantity;
        else if (m.type === 'out') newStock = Math.max(0, newStock - m.quantity);
        else newStock = m.quantity;

        const newId = uuid();
        set({
          movements: [...get().movements, { ...m, id: newId, createdAt: now() }],
          items: get().items.map(x => x.id === m.itemId ? {
            ...x,
            currentStock: newStock,
            lastPrice: m.unitPrice > 0 ? m.unitPrice : x.lastPrice,
            updatedAt: now()
          } : x)
        });
        return newId;
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
  egg: '🥚 تخم مرغ',
  feed: 'دان و خوراک',
  medicine: 'دارو',
  vaccine: 'واکسن',
  herbal: 'گیاه دارویی',
  equipment: 'تجهیزات',
  consumable: 'مصرفی'
};

export const CATEGORY_ICON: Record<ItemCategory, string> = {
  egg: '🥚',
  feed: '🌾',
  medicine: '💊',
  vaccine: '💉',
  herbal: '🌿',
  equipment: '🔧',
  consumable: '📦'
};



/** پیش‌فرض‌های هر دسته — قابل ویرایش در فرم */
export const CATEGORY_DEFAULTS: Record<ItemCategory, {
  unit: ItemUnit;
  storage: string;
  needsExpiry: boolean;
  needsWithdrawal: boolean;
}> = {
  egg:        { unit: 'pcs',  storage: 'room',   needsExpiry: false, needsWithdrawal: false },
  feed:       { unit: 'kg',   storage: 'room',   needsExpiry: false, needsWithdrawal: false },
  medicine:   { unit: 'ml',   storage: 'fridge', needsExpiry: true,  needsWithdrawal: true  },
  vaccine:    { unit: 'vial', storage: 'fridge', needsExpiry: true,  needsWithdrawal: true  },
  herbal:     { unit: 'g',    storage: 'room',   needsExpiry: false, needsWithdrawal: false },
  equipment:  { unit: 'pcs',  storage: 'room',   needsExpiry: false, needsWithdrawal: false },
  consumable: { unit: 'pcs',  storage: 'room',   needsExpiry: false, needsWithdrawal: false },
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
  try {
    const en = String(expireDate).replace(/[۰-۹]/g, d => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d)));
    const d = parseJ(en, 'yyyy/MM/dd', new Date());
    if (isNaN(d.getTime())) return null;
    return diffCalDays(startOfDay(d), startOfDay(new Date()));
  } catch {
    return null;
  }
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
