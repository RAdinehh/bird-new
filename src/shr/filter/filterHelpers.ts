import type { ReactNode } from 'react';
import type { FilterDef } from './types';
import { toFa } from '../utils/fa';

export function summarizeChip<T>(def: FilterDef<T>, v: any): { text: string; icon?: ReactNode } | null {
  if (v === undefined || v === null || v === '') return null;
  if (Array.isArray(v) && (v.length === 0 || v.every((x) => x === ''))) return null;
  if (def.kind === 'enum') {
    const arr = Array.isArray(v) ? (v as string[]) : [String(v)];
    const opts = arr.map(x => def.options?.find(o => o.value === x));
    const labels = opts.map((o, i) => o?.label || arr[i]);
    const icon = opts[0]?.icon;
    if (labels.length === 1) return { text: toFa(labels[0]), icon };
    return { text: `${toFa(labels.length)} مورد`, icon };
  }
  if (def.kind === 'dateRange') {
    const [a, b] = v as [string, string];
    return { text: `${a ? toFa(a) : '؟'}–${b ? toFa(b) : '؟'}` };
  }
  if (def.kind === 'numberRange') {
    const [a, b] = v as [number, number];
    return { text: `${a != null ? toFa(a) : '؟'}–${b != null ? toFa(b) : '؟'}` };
  }
  if (def.kind === 'boolean') return { text: v ? 'بله' : 'خیر' };
  return { text: toFa(String(v)) };
}

export function isEmptyVal(v: any): boolean {
  if (v === undefined || v === null || v === '') return true;
  if (Array.isArray(v)) return v.length === 0 || v.every((x) => x === '');
  return false;
}
