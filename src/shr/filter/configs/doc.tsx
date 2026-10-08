/** filter/configs/doc.tsx */
import { IconFolder, IconActivity, IconTag, IconChart, IconCalendar } from '../../icons';
import { type DocFile, CATEGORY_LABEL as DOC_CAT_LABEL, CATEGORY_ICON as DOC_CAT_ICON } from '../../../mod/doc/store';
import type { FilterConfig } from './_types';

export function getDocFilesConfig(): FilterConfig<DocFile> {
  return {
    filterDefs: [
      {
        key: 'category', label: 'دسته', kind: 'enum',
        icon: <IconFolder size={18} />,
        options: (Object.keys(DOC_CAT_LABEL) as Array<keyof typeof DOC_CAT_LABEL>).map(c => ({
          value: c,
          label: DOC_CAT_LABEL[c],
          icon: DOC_CAT_ICON[c],
        })),
        getValue: (f: DocFile) => f.category || '',
        multi: true,
      },
      {
        key: 'linkedType', label: 'اتصال', kind: 'enum',
        icon: <IconTag size={18} />,
        options: [
          { value: 'flk', label: 'گله' },
          { value: 'hal', label: 'سالن' },
          { value: 'ctc', label: 'مخاطب' },
          { value: 'inc', label: 'جوجه‌کشی' },
          { value: 'whs', label: 'انبار' },
          { value: 'tra', label: 'معاملات' },
          { value: 'none', label: 'بدون اتصال' },
        ],
        getValue: (f: DocFile) => f.linkedType || 'none',
        multi: true,
      },
      {
        key: 'hasTags', label: 'برچسب', kind: 'enum',
        icon: <IconActivity size={18} />,
        options: [
          { value: 'yes', label: 'دارد' },
          { value: 'no', label: 'ندارد' },
        ],
        getValue: (f: DocFile) => (f.tags && f.tags.length > 0) ? 'yes' : 'no',
      },
    ],
    sortDefs: [
      {
        key: 'uploadedAt', label: 'تاریخ بارگذاری', icon: <IconCalendar size={18} />,
        hint: 'جدیدترین اول',
        compare: (a: DocFile, b: DocFile) => (a.uploadedAt || '').localeCompare(b.uploadedAt || ''),
      },
      {
        key: 'name', label: 'نام فایل', icon: <IconTag size={18} />,
        hint: 'از الف به ی',
        compare: (a: DocFile, b: DocFile) => (a.name || '').localeCompare(b.name || '', 'fa'),
      },
      {
        key: 'size', label: 'حجم', icon: <IconChart size={18} />,
        hint: 'از بزرگ به کوچک',
        compare: (a: DocFile, b: DocFile) => (a.size || 0) - (b.size || 0),
      },
      {
        key: 'category', label: 'دسته', icon: <IconFolder size={18} />,
        hint: 'بر اساس نوع فایل',
        compare: (a: DocFile, b: DocFile) => (a.category || '').localeCompare(b.category || ''),
      },
    ],
    persistKey: 'doc-files',
    initialSort: { key: 'uploadedAt', dir: 'desc' },
  };
}
