/** filter/configs/fed.tsx */
import { IconFolder, IconActivity, IconTag, IconChart, IconDollar, IconClock, IconUser, IconCalendar, IconPackage } from '../../icons';
import { type Ingredient, type Formula, type Requirement, CATEGORY_LABEL as FED_CAT_LABEL, CATEGORY_ICON as FED_CAT_ICON, STAGE_LABEL as FED_STAGE_LABEL } from '../../../mod/fed/store';
import type { FilterConfig } from './_types';

export function getFedIngredientsConfig(): FilterConfig<Ingredient> {
  return {
    filterDefs: [
      {
        key: 'category', label: 'دسته', kind: 'enum',
        icon: <IconFolder size={18} />,
        options: Object.keys(FED_CAT_LABEL).map(c => ({
          value: c,
          label: FED_CAT_LABEL[c as keyof typeof FED_CAT_LABEL],
          icon: FED_CAT_ICON[c as keyof typeof FED_CAT_ICON],
        })),
        getValue: (i: Ingredient) => i.category || '',
        multi: true,
      },
      {
        key: 'isCore', label: 'پیش‌فرض', kind: 'enum',
        icon: <IconTag size={18} />,
        options: [
          { value: 'yes', label: 'پیش‌فرض' },
          { value: 'no', label: 'سفارشی' },
        ],
        getValue: (i: Ingredient) => i.isCore ? 'yes' : 'no',
      },
      {
        key: 'hasStock', label: 'اتصال انبار', kind: 'enum',
        icon: <IconPackage size={18} />,
        options: [
          { value: 'yes', label: 'وصل شده' },
          { value: 'no', label: 'وصل نشده' },
        ],
        getValue: (i: Ingredient) => i.stockItemId ? 'yes' : 'no',
      },
    ],
    sortDefs: [
      {
        key: 'name', label: 'نام', icon: <IconTag size={18} />,
        hint: 'از الف به ی',
        compare: (a: Ingredient, b: Ingredient) => (a.name || '').localeCompare(b.name || '', 'fa'),
      },
      {
        key: 'protein', label: 'پروتئین', icon: <IconChart size={18} />,
        hint: 'درصد پروتئین',
        compare: (a: Ingredient, b: Ingredient) => (a.protein || 0) - (b.protein || 0),
      },
      {
        key: 'energy', label: 'انرژی', icon: <IconChart size={18} />,
        hint: 'انرژی متابولیزه',
        compare: (a: Ingredient, b: Ingredient) => (a.energy || 0) - (b.energy || 0),
      },
      {
        key: 'price', label: 'قیمت', icon: <IconDollar size={18} />,
        hint: 'قیمت هر واحد',
        compare: (a: Ingredient, b: Ingredient) => (a.price || 0) - (b.price || 0),
      },
      {
        key: 'createdAt', label: 'جدیدترین', icon: <IconClock size={18} />,
        hint: 'بر اساس تاریخ ایجاد',
        compare: (a: Ingredient, b: Ingredient) => (a.createdAt || '').localeCompare(b.createdAt || ''),
      },
    ],
    persistKey: 'fed-ingredients',
    initialSort: { key: 'name', dir: 'asc' },
  };
}

// ═══════════════════════════════════════════════════
// fed/FormulasPage — جیره‌ها
// ═══════════════════════════════════════════════════
export function getFedFormulasConfig(ctx: {
  requirements: Array<{ id: string; name: string; stage: string }>;
}): FilterConfig<Formula> {
  return {
    filterDefs: [
      {
        key: 'status', label: 'وضعیت', kind: 'enum',
        icon: <IconActivity size={18} />,
        options: [
          { value: 'draft', label: 'پیش‌نویس' },
          { value: 'active', label: 'فعال' },
          { value: 'archived', label: 'آرشیو' },
        ],
        getValue: (f: Formula) => f.status || 'draft',
        multi: true,
      },
      {
        key: 'stage', label: 'مرحله', kind: 'enum',
        icon: <IconChart size={18} />,
        options: Object.keys(FED_STAGE_LABEL).map(s => ({
          value: s,
          label: FED_STAGE_LABEL[s],
        })),
        getValue: (f: Formula) => {
          const req = ctx.requirements.find(r => r.id === f.requirementId);
          return req?.stage || '';
        },
        multi: true,
      },
      {
        key: 'requirementId', label: 'نیاز', kind: 'enum',
        icon: <IconTag size={18} />,
        options: ctx.requirements.map(r => ({ value: r.id, label: r.name })),
        getValue: (f: Formula) => f.requirementId || '',
        layout: 'chips',
      },
    ],
    sortDefs: [
      {
        key: 'date', label: 'تاریخ', icon: <IconCalendar size={18} />,
        hint: 'جدیدترین اول',
        compare: (a: Formula, b: Formula) => (a.date || '').localeCompare(b.date || ''),
      },
      {
        key: 'name', label: 'نام جیره', icon: <IconTag size={18} />,
        hint: 'از الف به ی',
        compare: (a: Formula, b: Formula) => (a.name || '').localeCompare(b.name || '', 'fa'),
      },
      {
        key: 'lineCount', label: 'تعداد مواد', icon: <IconChart size={18} />,
        hint: 'بر اساس تعداد مواد اولیه',
        compare: (a: Formula, b: Formula) => (a.lines?.length || 0) - (b.lines?.length || 0),
      },
      {
        key: 'createdAt', label: 'جدیدترین ثبت', icon: <IconClock size={18} />,
        hint: 'بر اساس تاریخ ایجاد',
        compare: (a: Formula, b: Formula) => (a.createdAt || '').localeCompare(b.createdAt || ''),
      },
    ],
    persistKey: 'fed-formulas',
    initialSort: { key: 'date', dir: 'desc' },
  };
}

// ═══════════════════════════════════════════════════
// fed/RequirementsPage — نیازهای غذایی
// ═══════════════════════════════════════════════════
export function getFedRequirementsConfig(ctx: {
  birdTypes: Array<{ value: string; label: string }>;
}): FilterConfig<Requirement> {
  return {
    filterDefs: [
      {
        key: 'stage', label: 'مرحله', kind: 'enum',
        icon: <IconChart size={18} />,
        options: Object.keys(FED_STAGE_LABEL).map(s => ({
          value: s,
          label: FED_STAGE_LABEL[s],
        })),
        getValue: (r: Requirement) => r.stage || '',
        multi: true,
      },
      {
        key: 'birdType', label: 'نوع پرنده', kind: 'enum',
        icon: <IconUser size={18} />,
        options: ctx.birdTypes,
        getValue: (r: Requirement) => r.birdType || '',
        multi: true,
      },
    ],
    sortDefs: [
      {
        key: 'name', label: 'نام', icon: <IconTag size={18} />,
        hint: 'از الف به ی',
        compare: (a: Requirement, b: Requirement) => (a.name || '').localeCompare(b.name || '', 'fa'),
      },
      {
        key: 'protein', label: 'پروتئین', icon: <IconChart size={18} />,
        hint: 'درصد پروتئین',
        compare: (a: Requirement, b: Requirement) => (a.protein || 0) - (b.protein || 0),
      },
      {
        key: 'energy', label: 'انرژی', icon: <IconChart size={18} />,
        hint: 'انرژی متابولیزه',
        compare: (a: Requirement, b: Requirement) => (a.energy || 0) - (b.energy || 0),
      },
      {
        key: 'createdAt', label: 'جدیدترین', icon: <IconClock size={18} />,
        hint: 'بر اساس تاریخ ایجاد',
        compare: (a: Requirement, b: Requirement) => (a.createdAt || '').localeCompare(b.createdAt || ''),
      },
    ],
    persistKey: 'fed-requirements',
    initialSort: { key: 'name', dir: 'asc' },
  };
}
