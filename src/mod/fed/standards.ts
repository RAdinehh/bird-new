/**
 * کتابخانه استاندارد مواد اولیه جیره — فقط مواد ضروری (CORE)
 * 
 * معماری:
 * - CORE: ۲۰ ماده ضروری که همیشه تو فرم میان و قابل حذف نیستن
 * - CUSTOM: کاربر میتونه مواد دیگه خودش اضافه کنه (تو store ذخیره میشه)
 * 
 * واحدها:
 * - پروتئین، چربی، فیبر، کلسیم، فسفر، متیونین، لیزین: درصد (٪)
 * - انرژی: کیلوکالری بر کیلوگرم (kcal/kg)
 */

import type { IngredientCategory } from './store';

export interface StandardIngredient {
  key: string;
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
  notes?: string;
}

export const INGREDIENT_STANDARDS: StandardIngredient[] = [
  // ===== منابع انرژی =====
  {
    key: 'corn',
    name: 'ذرت',
    category: 'energy',
    protein: 8.5, energy: 3350, fat: 3.8, fiber: 2.2,
    calcium: 0.02, phosphorus: 0.27, methionine: 0.18, lysine: 0.24,
    minPercent: 0, maxPercent: 65,
  },
  {
    key: 'wheat',
    name: 'گندم',
    category: 'energy',
    protein: 11.5, energy: 3120, fat: 1.9, fiber: 2.7,
    calcium: 0.05, phosphorus: 0.35, methionine: 0.18, lysine: 0.35,
    minPercent: 0, maxPercent: 40,
  },
  {
    key: 'barley',
    name: 'جو',
    category: 'energy',
    protein: 11, energy: 2640, fat: 1.9, fiber: 5.5,
    calcium: 0.07, phosphorus: 0.35, methionine: 0.18, lysine: 0.4,
    minPercent: 0, maxPercent: 30,
  },
  {
    key: 'wheat_bran',
    name: 'سبوس گندم',
    category: 'energy',
    protein: 15.7, energy: 1300, fat: 3.5, fiber: 10.5,
    calcium: 0.14, phosphorus: 1.18, methionine: 0.22, lysine: 0.6,
    minPercent: 0, maxPercent: 15,
  },

  // ===== منابع پروتئینی =====
  {
    key: 'soybean_meal',
    name: 'کنجاله سویا (۴۴٪)',
    category: 'protein',
    protein: 44, energy: 2230, fat: 0.9, fiber: 7,
    calcium: 0.33, phosphorus: 0.65, methionine: 0.63, lysine: 2.73,
    minPercent: 0, maxPercent: 40,
  },
  {
    key: 'sesame_meal',
    name: 'کنجاله کنجد',
    category: 'protein',
    protein: 42, energy: 2400, fat: 8, fiber: 6,
    calcium: 2, phosphorus: 1.3, methionine: 0.9, lysine: 1.2,
    minPercent: 0, maxPercent: 15,
  },
  {
    key: 'sunflower_meal',
    name: 'کنجاله آفتابگردان',
    category: 'protein',
    protein: 32, energy: 1543, fat: 1.5, fiber: 18,
    calcium: 0.21, phosphorus: 0.14, methionine: 0.6, lysine: 1.1,
    minPercent: 0, maxPercent: 20,
  },
  {
    key: 'canola_meal',
    name: 'کنجاله کانولا',
    category: 'protein',
    protein: 36, energy: 2000, fat: 3.5, fiber: 12,
    calcium: 0.65, phosphorus: 1, methionine: 0.7, lysine: 2,
    minPercent: 0, maxPercent: 20,
  },

  // ===== حیوانی =====
  {
    key: 'fish_meal',
    name: 'پودر ماهی',
    category: 'protein',
    protein: 64.2, energy: 2580, fat: 8, fiber: 0,
    calcium: 3.73, phosphorus: 2.43, methionine: 1.8, lysine: 4.8,
    minPercent: 0, maxPercent: 10,
  },

  // ===== علوفه‌ای =====
  {
    key: 'alfalfa',
    name: 'یونجه خشک',
    category: 'protein',
    protein: 17, energy: 1300, fat: 2.5, fiber: 25,
    calcium: 1.4, phosphorus: 0.22, methionine: 0.25, lysine: 0.8,
    minPercent: 0, maxPercent: 10,
  },

  // ===== معدنی =====
  {
    key: 'calcium_carbonate',
    name: 'کربنات کلسیم (آهک)',
    category: 'mineral',
    protein: 0, energy: 0, fat: 0, fiber: 0,
    calcium: 38, phosphorus: 0, methionine: 0, lysine: 0,
    minPercent: 0, maxPercent: 10,
  },
  {
    key: 'dcp',
    name: 'دی‌کلسیم فسفات',
    category: 'mineral',
    protein: 0, energy: 0, fat: 0, fiber: 0,
    calcium: 23, phosphorus: 18, methionine: 0, lysine: 0,
    minPercent: 0, maxPercent: 5,
  },
  {
    key: 'oyster_shell',
    name: 'پودر صدف',
    category: 'mineral',
    protein: 0, energy: 0, fat: 0, fiber: 0,
    calcium: 38, phosphorus: 0, methionine: 0, lysine: 0,
    minPercent: 0, maxPercent: 10,
  },
  {
    key: 'salt',
    name: 'نمک طعام',
    category: 'mineral',
    protein: 0, energy: 0, fat: 0, fiber: 0,
    calcium: 0, phosphorus: 0, methionine: 0, lysine: 0,
    minPercent: 0, maxPercent: 1,
    notes: 'سدیم ۳۹٪ · کلر ۶۱٪',
  },
  {
    key: 'rock_salt',
    name: 'سنگ نمک',
    category: 'mineral',
    protein: 0, energy: 0, fat: 0, fiber: 0,
    calcium: 0, phosphorus: 0, methionine: 0, lysine: 0,
    minPercent: 0, maxPercent: 1,
    notes: 'نمک معدنی طبیعی',
  },

  // ===== روغن‌ها =====
  {
    key: 'soybean_oil',
    name: 'روغن سویا',
    category: 'energy',
    protein: 0, energy: 8500, fat: 100, fiber: 0,
    calcium: 0, phosphorus: 0, methionine: 0, lysine: 0,
    minPercent: 0, maxPercent: 5,
  },
  {
    key: 'sesame_oil',
    name: 'روغن کنجد',
    category: 'energy',
    protein: 0, energy: 8800, fat: 100, fiber: 0,
    calcium: 0, phosphorus: 0, methionine: 0, lysine: 0,
    minPercent: 0, maxPercent: 5,
  },
  {
    key: 'sunflower_oil',
    name: 'روغن آفتابگردان',
    category: 'energy',
    protein: 0, energy: 8000, fat: 100, fiber: 0,
    calcium: 0, phosphorus: 0, methionine: 0, lysine: 0,
    minPercent: 0, maxPercent: 5,
  },

  // ===== اسیدآمینه و افزودنی =====
  {
    key: 'methionine',
    name: 'DL-متیونین',
    category: 'amino',
    protein: 0, energy: 0, fat: 0, fiber: 0,
    calcium: 0, phosphorus: 0, methionine: 99, lysine: 0,
    minPercent: 0, maxPercent: 0.5,
  },
  {
    key: 'lysine',
    name: 'L-لیزین',
    category: 'amino',
    protein: 0, energy: 0, fat: 0, fiber: 0,
    calcium: 0, phosphorus: 0, methionine: 0, lysine: 78,
    minPercent: 0, maxPercent: 0.5,
  },
  {
    key: 'vitamin_premix',
    name: 'ویتامین پرمیکس',
    category: 'vitamin',
    protein: 0, energy: 0, fat: 0, fiber: 0,
    calcium: 0, phosphorus: 0, methionine: 0, lysine: 0,
    minPercent: 0, maxPercent: 0.5,
    notes: 'ترکیب ویتامین‌های A, D3, E, K, B',
  },
];

/** پیدا کردن ماده با key */
export function findStandard(key: string): StandardIngredient | undefined {
  return INGREDIENT_STANDARDS.find(s => s.key === key);
}

/** چک کردن اینکه یه ماده CORE هست */
export function isCoreIngredient(name: string): boolean {
  return INGREDIENT_STANDARDS.some(s => s.name === name);
}
