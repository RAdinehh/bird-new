import { create } from 'zustand';
import { parse as parseJ, differenceInCalendarDays as diffCalDays, startOfDay } from 'date-fns-jalali';
import { persist } from 'zustand/middleware';
import { v4 as uuid } from 'uuid';
import { validate } from '../../shr/validation/helpers';
import { createItemSchema, createMovementSchema } from '../../shr/validation/rules/whs';

export type ItemCategory = 'feed' | 'medicine' | 'vaccine' | 'herbal' | 'equipment' | 'consumable' | 'egg' | 'manure' | 'broken';
export type ItemUnit = 'kg' | 'g' | 'L' | 'l' | 'ml' | 'pcs' | 'vial' | 'pack' | 'ton' | 'bag' | 'dose';
export type MovementType = 'in' | 'out' | 'adjust';
export type MovementReason = 'purchase' | 'consumption' | 'sale' | 'gift' | 'loss' | 'adjustment' | 'return';

export interface Item {
  id: string;
  name: string;
  category: ItemCategory;
  feedType?: string;
  brand?: string;
  protein?: number | null;
  energy?: number | null;
  fat?: number | null;
  fiber?: number | null;
  calcium?: number | null;
  phosphorus?: number | null;
  methionine?: number | null;
  lysine?: number | null;
  unit: ItemUnit;
  minStock: number;
  currentStock: number;
  lastPrice: number;
  /** میانگین موزون قیمت (fallback: lastPrice) */
  avgPrice?: number;
  supplierId: string;
  expireDate: string;
  withdrawalDays: number | null;  // فقط برای دارو
  /** کد منبع برای شماره بچ خودکار (مثلاً ND برای نیوکاسل) */
  sourceCode?: string;
  storage: string;                 // fridge | freezer | room
  notes: string;
  // ─── فیلدهای تجهیزات (اختیاری) ───
  purchaseDate?: string;           // تاریخ خرید
  purchasePrice?: number;          // قیمت خرید کل
  hallId?: string;                 // سالن محل استقرار
  equipmentStatus?: string;        // active | repair | scrapped
  warrantyUntil?: string;          // گارانتی تا
  // ─── فیلدهای دارو/واکسن ───
  usageType?: string;              // oral | injectable | water | spray
  productionDate?: string;         // تاریخ تولید
  dosePerBird?: number;            // دوز مصرفی هر پرنده
  /** موجودی اولیه هنگام ایجاد — پایه راستی‌آزمایی */
  initialStock?: number;
  /** قیمت موجودی اولیه (برای میانگین موزون) */
  initialPrice?: number;
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
  sourceModule?: 'egg' | 'dlg' | 'tra' | 'inc' | 'fed' | 'manual' | 'deal';
  /** 🆕 رهگیری: ID رکورد مبدأ */
  sourceId?: string;
  /** 🆕 شماره دسته (Batch) — برای تخم و دارو */
  /** 🆕 تاریخ انقضا (برای دارو) */
  expiryDate?: string;
}

interface State {
  items: Item[];
  movements: Movement[];
  addItem: (i: Omit<Item, 'id' | 'createdAt' | 'updatedAt'>) => string;
  updateItem: (id: string, patch: Partial<Item>) => void;
  deleteItem: (id: string) => void;
  addMovement: (m: Omit<Movement, 'id' | 'createdAt'>) => string;
  deleteMovement: (id: string) => void;
}


/** تولید شماره دسته — B-YYYY-MM-DD-NNN */

const now = () => new Date().toISOString();

/** میانگین موزون قیمت یک قلم (با fallback) */
export function getAvgPrice(item: Item): number {
  return item.avgPrice ?? item.lastPrice ?? 0;
}

/**
 * recalcAvgPrice — بازمحاسبه میانگین موزون از تاریخچه
 * startAvg: میانگین شروع (fallback: lastPrice)
 */
export function recalcAvgPrice(
  item: Item,
  movements: Movement[]
): { avg: number; stock: number } {
  let stock = item.initialStock ?? 0;
  let avg = item.lastPrice || 0;
  const sorted = movements
    .filter(m => m.itemId === item.id)
    .sort((a, b) => (a.createdAt || '').localeCompare(b.createdAt || ''));
  for (const m of sorted) {
    if (m.type === 'in') {
      if (m.unitPrice > 0 && stock + m.quantity > 0) {
        avg = (stock * avg + m.quantity * m.unitPrice) / (stock + m.quantity);
      }
      stock += m.quantity;
    } else if (m.type === 'out') {
      stock -= m.quantity;
    } else {
      stock = m.quantity;
    }
  }
  return { avg: Math.round(avg * 100) / 100, stock };
}

/** اعتبارسنجی Item — پرتاب خطا در صورت نامعتبر */
function assertItem(data: any): void {
  const r = validate(createItemSchema({}), data);
  if (!r.ok) {
    const msgs = Object.values(r.errors).join(' • ');
    throw new Error('اعتبارسنجی کالا: ' + msgs);
  }
}

/** اعتبارسنجی Movement */
function assertMovement(data: any): void {
  const r = validate(createMovementSchema({}), data);
  if (!r.ok) {
    const msgs = Object.values(r.errors).join(' • ');
    throw new Error('اعتبارسنجی گردش: ' + msgs);
  }
}

/**
 * recalcStock — محاسبه موجودی از تاریخچه تراکنش‌ها
 * expected = initialStock + Σ(in) − Σ(out) + Σ(adjust net)
 */
export function recalcStock(
  item: Item,
  movements: Movement[]
): { expected: number; actual: number; drift: number; totalIn: number; totalOut: number; totalAdjust: number } {
  const itemMovements = movements.filter(m => m.itemId === item.id);
  let totalIn = 0, totalOut = 0, totalAdjust = 0;

  // برای محاسبه دقیق adjust، ترتیب زمانی مهمه
  const sorted = [...itemMovements].sort((a, b) => (a.createdAt || '').localeCompare(b.createdAt || ''));
  let running = item.initialStock ?? 0;
  for (const m of sorted) {
    if (m.type === 'in') { running += m.quantity; totalIn += m.quantity; }
    else if (m.type === 'out') { running -= m.quantity; totalOut += m.quantity; }
    else { // adjust: تنظیم روی مقدار جدید
      totalAdjust += (m.quantity - running);
      running = m.quantity;
    }
  }
  const expected = Math.round(running * 1000) / 1000;
  const actual = Math.round((item.currentStock || 0) * 1000) / 1000;
  const drift = Math.round((actual - expected) * 1000) / 1000;
  return { expected, actual, drift, totalIn, totalOut, totalAdjust };
}

/**
 * checkIntegrity — چک همه اقلام برای مغایرت
 */
export function checkIntegrity(
  items: Item[],
  movements: Movement[]
): Array<{ item: Item; expected: number; actual: number; drift: number }> {
  const drift: Array<{ item: Item; expected: number; actual: number; drift: number }> = [];
  for (const it of items) {
    const r = recalcStock(it, movements);
    if (Math.abs(r.drift) >= 0.001) {
      drift.push({ item: it, expected: r.expected, actual: r.actual, drift: r.drift });
    }
  }
  return drift;
}

export const useWhs = create<State>()(
  persist(
    (set, get) => ({
      items: [],
      movements: [],

      addItem: (i) => {
        assertItem(i);
        const id = uuid();
        set({ items: [...get().items, {
          ...i,
          id,
          initialStock: (i as any).currentStock || 0,
          initialPrice: (i as any).initialPrice || 0,
          avgPrice: (i as any).initialPrice || (i as any).lastPrice || 0,
          createdAt: now(),
          updatedAt: now()
        }] });
        return id;
      },
      updateItem: (id, patch) => {
        const current = get().items.find(x => x.id === id);
        if (current) assertItem({ ...current, ...patch });
        set({ items: get().items.map(x => x.id === id ? { ...x, ...patch, updatedAt: now() } : x) });
      },
      deleteItem: (id) => set({
        items: get().items.filter(x => x.id !== id),
        movements: get().movements.filter(x => x.itemId !== id)
      }),

      addMovement: (m) => {
        assertMovement(m);
        const item = get().items.find(x => x.id === m.itemId);
        if (item === undefined) return '';

        let newStock = item.currentStock;
        if (m.type === 'in') newStock += m.quantity;
        else if (m.type === 'out') newStock = newStock - m.quantity;  // soft: اجازه منفی (UI هشدار می‌ده)
        else newStock = m.quantity;

        // میانگین موزون: فقط برای in با قیمت > 0
        let newAvg = getAvgPrice(item);
        if (m.type === 'in' && m.unitPrice > 0) {
          const stockBefore = item.currentStock;
          const stockAfter = stockBefore + m.quantity;
          if (stockAfter > 0) {
            newAvg = (stockBefore * newAvg + m.quantity * m.unitPrice) / stockAfter;
          } else {
            newAvg = m.unitPrice;
          }
          newAvg = Math.round(newAvg * 100) / 100;
        }

        const newId = uuid();
        set({
          movements: [...get().movements, { ...m, id: newId, createdAt: now() }],
          items: get().items.map(x => x.id === m.itemId ? {
            ...x,
            currentStock: newStock,
            lastPrice: m.unitPrice > 0 ? m.unitPrice : x.lastPrice,
            avgPrice: newAvg,
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

        // 🎯 محاسبه مجدد از تاریخچه بعد از حذف — درست برای همه انواع (in/out/adjust)
        const remaining = get().movements.filter(x => x.id !== id);
        const recalc = recalcStock(item, remaining);
        const newStock = recalc.expected;  // soft: اجازه منفی
        const recalcAvg = recalcAvgPrice({ ...item, currentStock: newStock }, remaining);

        set({
          movements: remaining,
          items: get().items.map(x => x.id === mv.itemId ? {
            ...x,
            currentStock: newStock,
            avgPrice: recalcAvg.avg,
            updatedAt: now()
          } : x)
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
  consumable: 'مصرفی',
  manure: '🌱 کود',
  broken: '💔 تخم شکسته'
};

export const CATEGORY_ICON: Record<ItemCategory, string> = {
  egg: '🥚',
  feed: '🌾',
  medicine: '💊',
  vaccine: '💉',
  herbal: '🌿',
  equipment: '🔧',
  consumable: '📦',
  manure: '🌱',
  broken: '💔'
};



/** پیش‌فرض‌های هر دسته — قابل ویرایش در فرم */
export const CATEGORY_DEFAULTS: Record<ItemCategory, {
  unit: ItemUnit;
  storage: string;
  needsExpiry: boolean;
  needsWithdrawal: boolean;
  needsBatch: boolean;
  needsStorage: boolean;
  needsEquipment: boolean;
  title: string;
}> = {
  egg:        { unit: 'pcs',  storage: 'room',   needsExpiry: true,  needsWithdrawal: false, needsBatch: false, needsStorage: false, needsEquipment: false, title: '🥚 اطلاعات تخم' },
  feed:       { unit: 'kg',   storage: 'room',   needsExpiry: true,  needsWithdrawal: false, needsBatch: true,  needsStorage: false, needsEquipment: false, title: '' },
  medicine:   { unit: 'ml',   storage: 'fridge', needsExpiry: true,  needsWithdrawal: true,  needsBatch: true,  needsStorage: true,  needsEquipment: false, title: '💊 اطلاعات دارویی' },
  vaccine:    { unit: 'vial', storage: 'fridge', needsExpiry: true,  needsWithdrawal: true,  needsBatch: true,  needsStorage: true,  needsEquipment: false, title: '💉 اطلاعات واکسن' },
  herbal:     { unit: 'g',    storage: 'room',   needsExpiry: true,  needsWithdrawal: false, needsBatch: false, needsStorage: false, needsEquipment: false, title: '🌿 اطلاعات گیاهی' },
  equipment:  { unit: 'pcs',  storage: 'room',   needsExpiry: false, needsWithdrawal: false, needsBatch: false, needsStorage: false, needsEquipment: true,  title: '' },
  consumable: { unit: 'pcs',  storage: 'room',   needsExpiry: false, needsWithdrawal: false, needsBatch: false, needsStorage: false, needsEquipment: false, title: '' },
  manure:     { unit: 'kg',   storage: 'room', needsExpiry: false, needsWithdrawal: false, needsBatch: false, needsStorage: false, needsEquipment: false, title: '🌱 اطلاعات کود' },
  broken:     { unit: 'pcs',  storage: 'room', needsExpiry: false, needsWithdrawal: false, needsBatch: false, needsStorage: false, needsEquipment: false, title: '💔 تخم شکسته' },
};

export const UNIT_LABEL: Record<ItemUnit, string> = {
  kg: 'کیلوگرم', g: 'گرم', L: 'لیتر', l: 'لیتر', ml: 'میلی‌لیتر',
  pcs: 'عدد', vial: 'ویال', pack: 'بسته', ton: 'تن', bag: 'کیسه', dose: 'دوز'
};

export const MOVEMENT_REASON: Record<MovementReason, string> = {
  purchase: '🛒 خرید نقدی',
  consumption: '🍽 مصرف',
  sale: '💰 فروش',
  gift: '🎁 هدیه',
  loss: '⚠️ ضایعات',
  adjustment: '🔄 اصلاح',
  return: '↩️ برگشت',
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
  return items.reduce((a, x) => a + (x.currentStock * getAvgPrice(x)), 0);
}
