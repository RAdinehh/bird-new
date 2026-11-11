import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { v4 as uuid } from 'uuid';
import { useWhs } from '../whs/store';

export type IngredientCategory = 'energy' | 'protein' | 'mineral' | 'vitamin' | 'amino' | 'additive';

export interface Ingredient {
  id: string;
  name: string;
  category: IngredientCategory;
  protein: number;
  energy: number;
  fat: number;
  fiber: number;
  calcium: number;
  phosphorus: number;
  methionine: number;
  lysine: number;
  minPercent: number;
  maxPercent: number;
  price: number;
  stockItemId: string;
  isCore?: boolean;         // true = ماده پیش‌فرض
  isHidden?: boolean;       // true = پنهان شده از لیست
  standardKey?: string;     // کد استاندارد در standards.ts
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export interface Requirement {
  id: string;
  name: string;
  birdType: string;
  stage: string;
  protein: number;
  energy: number;
  calcium: number;
  phosphorus: number;
  methionine: number;
  lysine: number;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

/** نرمال‌سازی نام برای تطبیق (ذرت = ذرت، يك = یک) */
function normalizeName(s: string): string {
  return String(s || '').trim()
    .replace(/ي/g, 'ی')
    .replace(/ك/g, 'ک')
    .replace(/\u200c/g, '')
    .replace(/\s+/g, ' ')
    .toLowerCase();
}

/** اتصال خودکار یک ماده اولیه به کالای انبار (پیدا کردن یا ساختن) */
function autoLinkIngredient(ing: { name: string; category: string; price: number; stockItemId: string }): string {
  if (ing.stockItemId) return ing.stockItemId;
  try {
    const whs = useWhs.getState();
    const normalizedName = normalizeName(ing.name);
    if (!normalizedName) return '';

    // ۱. جستجو در کالاهای موجود انبار (feed یا concentrate)
    const existing = whs.items.find(x =>
      (x.category === 'feed' || (x as any).category === 'concentrate') &&
      normalizeName(x.name) === normalizedName
    );
    if (existing) return existing.id;

    // ۲. ساخت کالای جدید در انبار
    const newId = whs.addItem({
      name: ing.name.trim(),
      category: 'feed',
      unit: 'kg',
      minStock: 0,
      currentStock: 0,
      lastPrice: ing.price || 0,
      supplierId: '',
      expireDate: '',
      withdrawalDays: null,
      storage: 'room',
      notes: 'از جیره‌نویسی',
      brand: '',
      hallId: '',
      equipmentStatus: '',
      usageType: '',
      purchaseDate: '',
      purchasePrice: ing.price || 0,
    } as any);
    return newId || '';
  } catch (e) {
    console.error('[fed] autoLinkIngredient failed:', e);
    return '';
  }
}

export interface FormulaLine {
  id: string;
  ingredientId: string;
  percent: number;
}

export interface Formula {
  id: string;
  name: string;
  requirementId: string;
  lines: FormulaLine[];
  date: string;
  status: 'draft' | 'active' | 'archived';
  notes: string;
  /** 🆕 نسخه — با هر تغییر در lines یک واحد زیاد می‌شود */
  version: number;
  createdAt: string;
  updatedAt: string;
}

interface State {
  ingredients: Ingredient[];
  requirements: Requirement[];
  formulas: Formula[];
  addIngredient: (i: Omit<Ingredient, 'id' | 'createdAt' | 'updatedAt'>) => void;
  autoLinkAllIngredients: () => void;
  updateIngredient: (id: string, patch: Partial<Ingredient>) => void;
  deleteIngredient: (id: string) => void;
  dedupeCore: () => void;
  addRequirement: (r: Omit<Requirement, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateRequirement: (id: string, patch: Partial<Requirement>) => void;
  deleteRequirement: (id: string) => void;
  addFormula: (f: Omit<Formula, 'id' | 'createdAt' | 'updatedAt' | 'version'>) => void;
  updateFormula: (id: string, patch: Partial<Formula>) => void;
  deleteFormula: (id: string) => void;
}

const now = () => new Date().toISOString();

export const useFed = create<State>()(
  persist(
    (set, get) => ({
      ingredients: [],
      requirements: [],
      formulas: [],

      addIngredient: (i) => {
        // 🆕 اتصال خودکار به کالای انبار (اگر stockItemId خالی بود)
        const stockItemId = autoLinkIngredient({
          name: i.name,
          category: i.category,
          price: i.price,
          stockItemId: i.stockItemId || '',
        });
        set({
          ingredients: [...get().ingredients, {
            ...i,
            stockItemId,
            id: uuid(),
            createdAt: now(),
            updatedAt: now(),
          }],
        });
      },
      autoLinkAllIngredients: () => {
        try {
          const whs = useWhs.getState();
          let linked = 0;
          let created = 0;
          const updated = get().ingredients.map(ing => {
            if (ing.stockItemId) return ing;
            const normalizedName = normalizeName(ing.name);
            if (!normalizedName) return ing;

            const existing = whs.items.find(x =>
              (x.category === 'feed' || (x as any).category === 'concentrate') &&
              normalizeName(x.name) === normalizedName
            );

            if (existing) {
              linked++;
              return { ...ing, stockItemId: existing.id, updatedAt: now() };
            }

            // اگر پیدا نشد، کالای جدید بساز
            const newId = autoLinkIngredient({
              name: ing.name,
              category: ing.category,
              price: ing.price,
              stockItemId: '',
            });
            if (newId) {
              created++;
              return { ...ing, stockItemId: newId, updatedAt: now() };
            }
            return ing;
          });
          if (linked > 0 || created > 0) {
            set({ ingredients: updated });
            console.info(`[fed] auto-link: ${linked} linked, ${created} created`);
          }
        } catch (e) {
          console.error('[fed] autoLinkAllIngredients failed:', e);
        }
      },
      updateIngredient: (id, patch) => set({ ingredients: get().ingredients.map(x => x.id === id ? { ...x, ...patch, updatedAt: now() } : x) }),
      dedupeCore: () => {
        const seen = new Set<string>();
        const cleaned = get().ingredients.filter(i => {
          if (!i.standardKey) return true;
          if (seen.has(i.standardKey)) return false;
          seen.add(i.standardKey);
          return true;
        });
        set({ ingredients: cleaned });
      },

      deleteIngredient: (id) => set({
        ingredients: get().ingredients.filter(x => x.id !== id),
        formulas: get().formulas.map(f => {
          const newLines = f.lines.filter(l => l.ingredientId !== id);
          if (newLines.length === f.lines.length) return f;
          return { ...f, lines: newLines, version: (f.version ?? 1) + 1, updatedAt: now() };
        })
      }),

      addRequirement: (r) => set({ requirements: [...get().requirements, { ...r, id: uuid(), createdAt: now(), updatedAt: now() }] }),
      updateRequirement: (id, patch) => set({ requirements: get().requirements.map(x => x.id === id ? { ...x, ...patch, updatedAt: now() } : x) }),
      deleteRequirement: (id) => set({ requirements: get().requirements.filter(x => x.id !== id) }),

      addFormula: (f) => set({ formulas: [...get().formulas, { ...f, version: 1, id: uuid(), createdAt: now(), updatedAt: now() }] }),
      updateFormula: (id, patch) => set({
        formulas: get().formulas.map(x => {
          if (x.id !== id) return x;
          const currentVersion = x.version ?? 1;
          const linesChanged = patch.lines !== undefined && JSON.stringify(patch.lines) !== JSON.stringify(x.lines);
          return { ...x, ...patch, version: linesChanged ? currentVersion + 1 : currentVersion, updatedAt: now() };
        }),
      }),
      deleteFormula: (id) => set({ formulas: get().formulas.filter(x => x.id !== id) })
    }),
    { name: 'pm-fed' }
  )
);

export const CATEGORY_LABEL: Record<IngredientCategory, string> = {
  energy: 'انرژی‌زا',
  protein: 'پروتئینی',
  mineral: 'معدنی',
  vitamin: 'ویتامینه',
  amino: 'اسید آمینه',
  additive: 'افزودنی'
};

export const CATEGORY_ICON: Record<IngredientCategory, string> = {
  energy: '🌽',
  protein: '🫘',
  mineral: '🦴',
  vitamin: '💊',
  amino: '🧪',
  additive: '✨'
};

export const STAGE_LABEL: Record<string, string> = {
  starter: 'استارتر',
  grower: 'گروور',
  developer: 'دولوپر',
  prelayer: 'پریلیر',
  layer: 'لیر',
  finisher: 'فینیشر',
  breeder: 'بریدر'
};

export const STAGE_LABEL_LONG: Record<string, string> = {
  starter: 'استارتر (آغازین، ۰-۳ هفته)',
  grower: 'گروور (رشد، ۳-۶ هفته)',
  developer: 'دولوپر (پرورش، ۶-۱۸ هفته)',
  prelayer: 'پریلیر (پیش‌تخم‌گذار، ۱۶-۲۰ هفته)',
  layer: 'لیر (تخم‌گذار، ۱۸+ هفته)',
  finisher: 'فینیشر (پایانی/پروار)',
  breeder: 'بریدر (مادر، تولید تخم نطفه‌دار)'
};

/** محاسبه‌ی مجموع درصدهای یک جیره */
export function formulaTotal(lines: FormulaLine[]): number {
  return lines.reduce((a, l) => a + (l.percent || 0), 0);
}

/** محاسبه‌ی مواد مغذی نهایی جیره */
export function calcNutrients(lines: FormulaLine[], ingredients: Ingredient[]) {
  let protein = 0, energy = 0, fat = 0, fiber = 0;
  let calcium = 0, phosphorus = 0, methionine = 0, lysine = 0;
  let price = 0;

  lines.forEach(l => {
    const ing = ingredients.find(i => i.id === l.ingredientId);
    if (ing === undefined) return;
    const p = (l.percent || 0) / 100;
    protein += ing.protein * p;
    energy += ing.energy * p;
    fat += ing.fat * p;
    fiber += ing.fiber * p;
    calcium += ing.calcium * p;
    phosphorus += ing.phosphorus * p;
    methionine += ing.methionine * p;
    lysine += ing.lysine * p;
    price += ing.price * p;
  });

  return {
    protein: Math.round(protein * 100) / 100,
    energy: Math.round(energy),
    fat: Math.round(fat * 100) / 100,
    fiber: Math.round(fiber * 100) / 100,
    calcium: Math.round(calcium * 100) / 100,
    phosphorus: Math.round(phosphorus * 100) / 100,
    methionine: Math.round(methionine * 1000) / 1000,
    lysine: Math.round(lysine * 1000) / 1000,
    price: Math.round(price)
  };
}

/** بررسی اعتبار جیره */
export function formulaValid(lines: FormulaLine[], ingredients: Ingredient[]): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  const total = formulaTotal(lines);

  if (lines.length === 0) {
    errors.push('حداقل یک ماده اضافه کنید');
    return { valid: false, errors };
  }

  if (Math.abs(total - 100) > 0.5) {
    errors.push(`مجموع درصدها باید ۱۰۰ باشد (فعلاً ${total.toFixed(2)}٪)`);
  }

  lines.forEach(l => {
    const ing = ingredients.find(i => i.id === l.ingredientId);
    if (ing === undefined) return;
    if (ing.maxPercent > 0 && l.percent > ing.maxPercent) {
      errors.push(`${ing.name}: حداکثر ${ing.maxPercent}٪ (فعلاً ${l.percent}٪)`);
    }
    if (ing.minPercent > 0 && l.percent < ing.minPercent) {
      errors.push(`${ing.name}: حداقل ${ing.minPercent}٪ (فعلاً ${l.percent}٪)`);
    }
  });

  return { valid: errors.length === 0, errors };
}
