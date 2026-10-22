/**
 * _typedLabels.ts — دسترسی type-safe به label maps
 * طبق FOUNDATION قانون ۳.۳ (کاهش as any)
 */
import {
  KIND_LABELS, CATEGORY_LABELS, UNIT_LABELS_EQ, STATUS_LABELS, EQUIP_LABELS,
  VENT_SYS_LABELS, FEEDER_LABELS, DRINKER_LABELS, LITTER_LABELS,
} from './store';
import { CATEGORY_COLORS } from '../../shr/icons/equipment';

// ═══ انواع ═══
export type TagTone = 'green' | 'amber' | 'red' | 'blue' | 'gray' | 'purple' | 'accent' | 'warn' | 'danger' | 'info' | 'dim';

export interface LabelInfo {
  name: string;
  icon: string;
  tone?: TagTone;
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

const SUB_LABEL_MAPS: Record<string, string>[] = [
  LITTER_LABELS, DRINKER_LABELS, FEEDER_LABELS, VENT_SYS_LABELS,
];

export function getEquipLabel(key: string | undefined): LabelInfo | undefined {
  if (!key) return undefined;
  const eq = (EQUIP_LABELS as unknown as LabelsMap)[key];
  if (eq) return eq;
  for (const map of SUB_LABEL_MAPS) {
    if (map[key]) return { name: map[key], icon: '' };
  }
  return undefined;
}

export function getCategoryColor(cat: string | undefined): string {
  const m = CATEGORY_COLORS as unknown as Record<string, string | undefined>;
  return m[cat || 'auxiliary'] || 'var(--cat-auxiliary)';
}

export function getCategorySoft(cat: string | undefined): string {
  const m = CATEGORY_COLORS as unknown as Record<string, string | undefined>;
  return m[(cat || 'auxiliary') + '-soft'] || 'var(--input-bg)';
}
