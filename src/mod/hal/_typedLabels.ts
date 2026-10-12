/**
 * _typedLabels.ts — دسترسی type-safe به label maps
 * طبق FOUNDATION قانون ۳.۳ (کاهش as any)
 */
import {
  KIND_LABELS, CATEGORY_LABELS, UNIT_LABELS_EQ, STATUS_LABELS,
} from './store';

// ═══ انواع ═══
export interface LabelInfo {
  name: string;
  icon: string;
  tone?: string;
}

type LabelsMap = Record<string, LabelInfo | undefined>;

// ═══ getters ایمن ═══
export function getKindLabel(kind: string | undefined): LabelInfo | undefined {
  return (KIND_LABELS as unknown as LabelsMap)[kind || 'asset'];
}

export function getCategoryLabel(cat: string | undefined): LabelInfo | undefined {
  return (CATEGORY_LABELS as unknown as LabelsMap)[cat || 'auxiliary'];
}

export function getStatusLabel(status: string | undefined): LabelInfo | undefined {
  if (!status) return undefined;
  return (STATUS_LABELS as unknown as LabelsMap)[status];
}

export function getUnitLabel(unit: string | undefined): string {
  const m = UNIT_LABELS_EQ as unknown as Record<string, string | undefined>;
  return m[unit || 'pcs'] || 'عدد';
}
