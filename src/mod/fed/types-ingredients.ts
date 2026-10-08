/**
 * types-ingredients.ts — نوع‌های IngredientsPage
 */
import type { IngredientCategory } from './store';

export interface F {
  id?: string;
  name: string;
  category: IngredientCategory;
  protein: string; energy: string; fat: string; fiber: string;
  calcium: string; phosphorus: string; methionine: string; lysine: string;
  minPercent: string; maxPercent: string;
  price: string;
  stockItemId: string;
  standardKey: string;
  notes: string;
}

export const emptyForm = (): F => ({
  name: '', category: 'energy',
  protein: '', energy: '', fat: '', fiber: '',
  calcium: '', phosphorus: '', methionine: '', lysine: '',
  minPercent: '', maxPercent: '',
  price: '', stockItemId: '', standardKey: '', notes: '',
});
