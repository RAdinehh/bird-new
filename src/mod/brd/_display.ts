/**
 * _display.ts — helperهای نمایش پرنده و نژاد
 *
 * طبق طرح گام ۱ و ۲:
 *   - ایموجی و رنگ برای birdKind
 *   - برچسب فارسی برای purposes
 *   - برچسب فارسی برای category
 *   - تبدیل اطلاعات به بج‌های UI
 */
import type { Bird, Breed } from './store';

// ═══ birdKind ═══
export interface KindInfo {
  emoji: string;
  label: string;
}

export const KIND_MAP: Record<string, KindInfo> = {
  chicken: { emoji: '🐔', label: 'مرغ' },
  duck:    { emoji: '🦆', label: 'اردک' },
  turkey:  { emoji: '🦃', label: 'بوقلمون' },
  quail:   { emoji: '🐦', label: 'بلدرچین' },
  goose:   { emoji: '🦢', label: 'غاز' },
};

export function getKindInfo(kind?: string): KindInfo {
  if (!kind) return { emoji: '🐔', label: 'پرنده' };
  return KIND_MAP[kind] || { emoji: '🐔', label: 'پرنده' };
}

// ═══ purpose ═══
export interface PurposeInfo {
  emoji: string;
  label: string;
  tone: 'green' | 'blue' | 'amber' | 'purple' | 'gray' | 'rose';
}

export const PURPOSE_MAP: Record<string, PurposeInfo> = {
  broiler:    { emoji: '🥩', label: 'گوشتی',    tone: 'green' },
  layer:      { emoji: '🥚', label: 'تخم‌گذار', tone: 'green' },
  breeder:    { emoji: '🧬', label: 'مادر',     tone: 'purple' },
  dual:       { emoji: '🥚🥩', label: 'دو منظوره', tone: 'green' },
  ornamental: { emoji: '🦚', label: 'تزئینی',   tone: 'amber' },
};

export function getPurposeInfo(purpose?: string): PurposeInfo | null {
  if (!purpose) return null;
  return PURPOSE_MAP[purpose] || null;
}

// ═══ category ═══
export interface CategoryInfo {
  emoji: string;
  label: string;
  tone: 'green' | 'blue' | 'amber';
}

export const CATEGORY_MAP: Record<string, CategoryInfo> = {
  native:     { emoji: '🌾', label: 'بومی',    tone: 'amber' },
  industrial: { emoji: '🏭', label: 'صنعتی',   tone: 'blue' },
  fancy:      { emoji: '🦚', label: 'تزئینی',  tone: 'amber' },
};

export function getCategoryInfo(category?: string): CategoryInfo | null {
  if (!category) return null;
  return CATEGORY_MAP[category] || null;
}

// ═══ خواندن اطلاعات از استاندارد ═══
export interface StandardRef {
  name: string;         // نام استاندارد (اسم نژاد)
  source?: string;      // منبع علمی
  year?: number;        // سال
  connected: boolean;   // آیا وصل هست
}

export function getStandardRef(bird: Bird, standardFromRegistry?: any): StandardRef | null {
  const key = (bird as any).standardKey;
  if (!key || !standardFromRegistry) {
    return {
      name: bird.name,
      connected: false,
    };
  }
  const std = standardFromRegistry;
  return {
    name: std.nameFa || std.nameEn || key,
    source: std.source,
    year: std.publishYear,
    connected: true,
  };
}
