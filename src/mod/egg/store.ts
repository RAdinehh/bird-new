import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { v4 as uuid } from 'uuid';

export type EggType = 'eating' | 'fertile' | 'broken';

export interface EggProduction {
  id: string;
  flockId: string;
  date: string;
  totalCount: number;
  brokenCount: number;
  softCount: number;
  dirtyCount: number;
  avgWeight: number | null;
  notes: string;
  sourceLogId?: string;   // لینک به dlg (اختیاری)
  createdAt: string;
}

export interface EggStock {
  eating: number;
  fertile: number;
  broken: number;
}

export interface EggSale {
  id: string;
  date: string;
  type: EggType;
  count: number;
  unit: 'piece' | 'shikan' | 'box' | 'carton';
  unitPrice: number;
  totalPrice: number;
  customerId: string;
  paymentType: 'cash' | 'card' | 'debt';
  notes: string;
  createdAt: string;
}

interface State {
  productions: EggProduction[];
  sales: EggSale[];
  packShikan: number;
  packBox: number;
  packCarton: number;
  addProduction: (p: Omit<EggProduction, 'id' | 'createdAt'>) => string;
  findByLogId: (logId: string) => EggProduction | undefined;
  updateProduction: (id: string, patch: Partial<EggProduction>) => void;
  deleteProduction: (id: string) => void;
  addSale: (s: Omit<EggSale, 'id' | 'createdAt'>) => void;
  deleteSale: (id: string) => void;
}

const now = () => new Date().toISOString();

export const useEgg = create<State>()(
  persist(
    (set, get) => ({
      productions: [],
      sales: [],
      packShikan: 0,
      packBox: 0,
      packCarton: 0,

      addProduction: (p) => {
        const newProd = { ...p, id: uuid(), createdAt: now() };
        set({ productions: [...get().productions, newProd] });
        return newProd.id;
      },
      findByLogId: (logId) => get().productions.find(x => x.sourceLogId === logId),
      updateProduction: (id, patch) => set({
        productions: get().productions.map(x => x.id === id ? { ...x, ...patch } : x)
      }),
      deleteProduction: (id) => set({ productions: get().productions.filter(x => x.id !== id) }),

      addSale: (s) => set({ sales: [...get().sales, { ...s, id: uuid(), createdAt: now() }] }),
      deleteSale: (id) => set({ sales: get().sales.filter(x => x.id !== id) })
    }),
    { name: 'pm-egg' }
  )
);

export const EGG_TYPE_LABEL: Record<EggType, string> = {
  eating: 'خوراکی',
  fertile: 'نطفه‌دار',
  broken: 'شکسته'
};

export const UNIT_LABEL: Record<string, string> = {
  piece: 'عدد',
  shikan: 'شانه (۳۰ عدد)',
  box: 'جعبه (۱۰ عدد)',
  carton: 'کارتن (۳۶۰ عدد)'
};

export const PAYMENT_LABEL: Record<string, string> = {
  cash: 'نقدی',
  card: 'کارت',
  debt: 'نسیه'
};

/** محاسبه‌ی تعداد سالم */
export function healthyCount(p: EggProduction): number {
  return Math.max(0, (p.totalCount || 0) - (p.brokenCount || 0) - (p.softCount || 0) - (p.dirtyCount || 0));
}

/** نرخ تخم‌گذاری Hen-Day — درصد */
export function henDayRate(p: EggProduction, flockCount: number): number {
  if (flockCount <= 0) return 0;
  return (healthyCount(p) / flockCount) * 100;
}

/** درصد شکسته */
export function brokenRate(p: EggProduction): number {
  const total = (p.totalCount || 0) + (p.brokenCount || 0) + (p.softCount || 0) + (p.dirtyCount || 0);
  if (total === 0) return 0;
  return ((p.brokenCount || 0) / total) * 100;
}

/** محاسبه‌ی موجودی انبار */
export function calcStock(productions: EggProduction[], sales: EggSale[]): EggStock {
  let eating = 0, fertile = 0, broken = 0;

  // اضافه‌ی تخم‌گذاری
  productions.forEach(p => {
    eating += healthyCount(p);
    broken += (p.brokenCount || 0) + (p.softCount || 0);
  });

  // کم کردن فروش
  sales.forEach(s => {
    const pieces = toPieces(s.count, s.unit);
    if (s.type === 'eating') eating -= pieces;
    else if (s.type === 'fertile') fertile -= pieces;
    else if (s.type === 'broken') broken -= pieces;
  });

  return {
    eating: Math.max(0, eating),
    fertile: Math.max(0, fertile),
    broken: Math.max(0, broken)
  };
}

/** تبدیل واحد به تعداد عدد */
export function toPieces(count: number, unit: string): number {
  if (unit === 'piece') return count;
  if (unit === 'shikan') return count * 30;
  if (unit === 'box') return count * 10;
  if (unit === 'carton') return count * 360;
  return count;
}

/** محاسبه‌ی قیمت کل */
export function saleTotal(count: number, unitPrice: number): number {
  return (count || 0) * (unitPrice || 0);
}

/** قیمت تخم بر اساس واحد */
export function pricePerPiece(count: number, unitPrice: number, unit: string): number {
  const pieces = toPieces(count, unit);
  if (pieces === 0) return 0;
  const total = count * unitPrice;
  return total / pieces;
}
