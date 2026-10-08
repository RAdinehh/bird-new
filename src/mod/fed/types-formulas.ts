/**
 * types-formulas.ts — نوع‌های FormulasPage
 */
import type { FormulaLine } from './store';

export interface F {
  id?: string;
  name: string;
  requirementId: string;
  lines: FormulaLine[];
  date: string;
  status: 'draft' | 'active' | 'archived';
  notes: string;
}

export const emptyForm = (): F => ({
  name: '', requirementId: '', lines: [],
  date: '', status: 'draft', notes: '',
});
